from rest_framework import viewsets, status
from rest_framework.decorators import action, api_view, permission_classes, throttle_classes
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from django.shortcuts import get_object_or_404
from django.core.cache import cache
import subprocess
import os
import json
import shlex
import threading
import queue
import uuid
import time
import stat as _stat

import paramiko

from .models import Canvas, WorkspaceFile, CustomMesh
from .serializers import CanvasSerializer, WorkspaceFileSerializer, FileTreeSerializer, CustomMeshSerializer
from django.core.files.base import ContentFile
import requests

# Docker container name for workspace operations
DOCKER_CONTAINER = "qcar_docker-ros-1"

# Cache timeout for file trees (in seconds)
FILE_TREE_CACHE_TIMEOUT = 3600  # 1 hour

# Global storage for running processes
RUNNING_PROCESSES = {}

# Short cache for the ROS running-params sweep. The frontend params panel polls
# this endpoint, so caching the result briefly stops each poll from re-spawning a
# fresh introspection sweep inside the shared container.
ROS_PARAMS_CACHE_TIMEOUT = 3  # seconds

# Helper executed INSIDE the ROS container (which already ships PyYAML + rclpy).
# It enumerates running nodes and bulk-dumps each node's parameters with a single
# `ros2 param dump` per node (instead of one `ros2 param get` per parameter) and
# emits JSON on stdout. Every ros2 call is individually wrapped in `timeout` so a
# hung/slow parameter service self-terminates instead of orphaning and piling up
# (the cause of the "get_param storm"). Fed to `docker exec -i ... python3 -`.
_ROS_PARAM_DUMP_HELPER = r'''
import subprocess, json
try:
    import yaml
except Exception as e:
    print(json.dumps({"nodes": [], "error": "yaml unavailable: %s" % e}))
    raise SystemExit(0)

def sh(args, t=6):
    try:
        return subprocess.run(
            ["timeout", "--signal=KILL", "%ds" % t, *args],
            capture_output=True, text=True, timeout=t + 2,
        ).stdout
    except Exception:
        return ""

def flatten(d, prefix=""):
    out = []
    for k, v in (d or {}).items():
        key = prefix + k
        if isinstance(v, dict):
            out.extend(flatten(v, key + "."))
        else:
            out.append((key, v))
    return out

nodes = [n.strip() for n in sh(["ros2", "node", "list"]).splitlines()
         if n.strip() and not n.strip().startswith("/_") and n.strip() != "/rosout"]
result = []
for n in nodes:
    try:
        data = yaml.safe_load(sh(["ros2", "param", "dump", n])) or {}
        block = data.get(n)
        if block is None and isinstance(data, dict) and len(data) == 1:
            block = next(iter(data.values()))
        params = (block or {}).get("ros__parameters", {}) if isinstance(block, dict) else {}
        plist = []
        for key, val in flatten(params):
            if key == "use_sim_time":
                continue
            if isinstance(val, bool):
                ptype, sval = "bool", ("true" if val else "false")
            elif isinstance(val, int):
                ptype, sval = "int", str(val)
            elif isinstance(val, float):
                ptype, sval = "float", str(val)
            elif isinstance(val, (list, dict)):
                ptype, sval = "string", json.dumps(val)
            else:
                ptype, sval = "string", str(val)
            plist.append({"name": key, "value": sval, "type": ptype})
        if plist:
            result.append({"name": n, "params": plist})
    except Exception:
        pass
print(json.dumps({"nodes": result}))
'''

# ── QCar SSH/SFTP credentials ──────────────────────────────────────────────────
# Sourced from env so the real robot password is not committed. Defaults to the
# Quanser factory creds for local dev; override QCAR_USERNAME / QCAR_PASSWORD
# (and change the robot's password) before any non-local deployment.
QCAR_USERNAME = os.environ.get('QCAR_USERNAME', 'nvidia')
QCAR_PASSWORD = os.environ.get('QCAR_PASSWORD', 'nvidia')
QCAR_ROS_WORKSPACE = '/home/nvidia/ros2'
QCAR_SCAN_EXCLUDE = {'build', 'install', 'log', '__pycache__', '.git'}


def _qcar_connect(qcar_ip):
    """Open a paramiko SSH + SFTP connection to the QCar."""
    client = paramiko.SSHClient()
    client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    client.connect(qcar_ip, username=QCAR_USERNAME, password=QCAR_PASSWORD, timeout=10)
    sftp = client.open_sftp()
    return client, sftp


def _sftp_walk(sftp, root, max_depth=6):
    """Return flat list of {path, file_type} dicts relative to *root*."""
    results = []

    def _recurse(path, depth):
        if depth > max_depth:
            return
        try:
            entries = sftp.listdir_attr(path)
        except Exception:
            return
        for attr in sorted(entries, key=lambda a: a.filename):
            name = attr.filename
            if name.startswith('.'):
                continue
            if name in QCAR_SCAN_EXCLUDE:
                continue
            full = f'{path}/{name}'
            rel  = full[len(root) + 1:] if full.startswith(root + '/') else full
            is_dir = _stat.S_ISDIR(attr.st_mode or 0)
            if is_dir:
                results.append({'path': rel, 'file_type': 'directory'})
                _recurse(full, depth + 1)
            else:
                results.append({'path': rel, 'file_type': 'file'})

    _recurse(root, 0)
    return results


def _sftp_makedirs(sftp, path):
    """Recursively create directories on the remote host."""
    parts = [p for p in path.split('/') if p]
    current = ''
    for part in parts:
        current += '/' + part
        try:
            sftp.stat(current)
        except FileNotFoundError:
            sftp.mkdir(current)


import re as _re

def _ros_namespace(canvas_id: str) -> str:
    """Return the ROS 2 namespace for a canvas: /ws_<uuid_with_underscores>"""
    return '/ws_' + str(canvas_id).replace('-', '_')


def _inject_ros_namespace(command: str, canvas_id: str) -> str:
    """
    Append --ros-args -r __ns:=/ws_<canvas_id> to ROS node commands so every
    topic the student's code touches is scoped to their workspace.

    Only modifies:
      • python3 *.py  /  python *.py
      • ros2 run ...
      • ros2 launch ...

    Leaves shell utilities (ls, cat, colcon build, source, etc.) untouched.
    Does nothing if --ros-args is already present (student added it manually).
    """
    stripped = command.strip()

    is_ros_cmd = bool(
        _re.match(r'python3?\s+\S+\.py', stripped) or
        _re.match(r'ros2\s+(run|launch)\s+', stripped)
    )

    if not is_ros_cmd:
        return command

    if '--ros-args' in command:
        return command

    ns = _ros_namespace(canvas_id)
    return f'{command} --ros-args -r __ns:={ns}'


class CanvasViewSet(viewsets.ModelViewSet):
    """
    API endpoint for managing canvases/workspaces
    """
    serializer_class = CanvasSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Canvas.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

    @action(detail=True, methods=["get"])
    def ros_packages(self, request, pk=None):
        """
        List ROS2 packages created in this canvas workspace.
        Scans docker_path/src/ for directories containing package.xml.
        """
        canvas = self.get_object()
        src_path = f"{canvas.docker_path}/src"

        try:
            result = subprocess.run(
                ["docker", "exec", DOCKER_CONTAINER, "bash", "-c",
                 f"find {src_path} -maxdepth 2 -name 'package.xml' -exec dirname {{}} \\; 2>/dev/null"],
                capture_output=True, text=True, timeout=10
            )
            packages = []
            if result.returncode == 0 and result.stdout.strip():
                for line in result.stdout.strip().split('\n'):
                    name = line.strip().rstrip('/').split('/')[-1]
                    if name:
                        packages.append(name)
            return Response({"packages": sorted(packages)})
        except Exception as e:
            return Response({"packages": [], "error": str(e)})

    @action(detail=True, methods=["get"])
    def ros_executables(self, request, pk=None):
        """
        List executables for a ROS2 package by parsing its setup.py entry_points.
        Query param: ?package=<pkg_name>
        """
        import re as _re2
        canvas = self.get_object()
        package = request.query_params.get("package", "").strip()

        if not package:
            return Response({"error": "package parameter required"}, status=400)

        setup_py_path = f"{canvas.docker_path}/src/{package}/setup.py"

        try:
            result = subprocess.run(
                ["docker", "exec", DOCKER_CONTAINER, "cat", setup_py_path],
                capture_output=True, text=True, timeout=10
            )

            executables = []
            if result.returncode == 0 and result.stdout:
                cs_match = _re2.search(
                    r"'console_scripts'\s*:\s*\[(.*?)\]",
                    result.stdout, _re2.DOTALL
                )
                if not cs_match:
                    cs_match = _re2.search(
                        r'"console_scripts"\s*:\s*\[(.*?)\]',
                        result.stdout, _re2.DOTALL
                    )
                if cs_match:
                    for m in _re2.finditer(r"['\"](\w+)\s*=\s*[^'\"]+['\"]", cs_match.group(1)):
                        executables.append(m.group(1))

            return Response({"executables": sorted(executables)})
        except Exception as e:
            return Response({"executables": [], "error": str(e)})

    @action(detail=True, methods=["get"])
    def ros_params(self, request, pk=None):
        """
        Scan a node's source file for declare_parameter() calls and return
        the discovered parameter names, defaults, and inferred types.
        Query params: ?package=<pkg>&executable=<exe>
        """
        import re as _re
        canvas = self.get_object()
        package = request.query_params.get("package", "").strip()
        executable = request.query_params.get("executable", "").strip()

        if not package or not executable:
            return Response({"error": "package and executable required"}, status=400)

        src_root = f"{canvas.docker_path}/src/{package}/{package}"

        # Find the Python file that likely implements this executable
        find_result = subprocess.run(
            ["docker", "exec", DOCKER_CONTAINER, "bash", "-c",
             f"find {src_root} -name '{executable}.py' 2>/dev/null | head -1"],
            capture_output=True, text=True, timeout=10
        )
        filepath = find_result.stdout.strip()

        # Fallback: search whole package src tree
        if not filepath:
            find_result = subprocess.run(
                ["docker", "exec", DOCKER_CONTAINER, "bash", "-c",
                 f"grep -rl 'declare_parameter' {canvas.docker_path}/src/{package} 2>/dev/null | head -5"],
                capture_output=True, text=True, timeout=10
            )
            candidates = [l.strip() for l in find_result.stdout.strip().splitlines() if l.strip()]
            filepath = candidates[0] if candidates else ""

        if not filepath:
            return Response({"params": [], "note": "source file not found"})

        cat_result = subprocess.run(
            ["docker", "exec", DOCKER_CONTAINER, "cat", filepath],
            capture_output=True, text=True, timeout=10
        )
        if cat_result.returncode != 0:
            return Response({"params": [], "note": "could not read source file"})

        source = cat_result.stdout
        params = []
        seen = set()

        # Match: declare_parameter('name') or declare_parameter('name', default)
        # Also handles descriptor variants: declare_parameter('name', value, descriptor)
        pattern = _re.compile(
            r"declare_parameter\(\s*['\"]([^'\"]+)['\"]\s*(?:,\s*([^,)\n]+))?"
            r"(?:,\s*[^)]+)?\s*\)",
            _re.MULTILINE,
        )
        for m in pattern.finditer(source):
            name = m.group(1).strip()
            if name in seen:
                continue
            seen.add(name)
            raw_default = (m.group(2) or "").strip()

            # Infer type from default value
            param_type = "string"
            default = ""
            if raw_default:
                if _re.match(r"^-?\d+\.\d+", raw_default):
                    param_type = "float"
                    default = raw_default
                elif _re.match(r"^-?\d+$", raw_default):
                    param_type = "int"
                    default = raw_default
                elif raw_default in ("True", "False", "true", "false"):
                    param_type = "bool"
                    default = raw_default
                elif raw_default.startswith(("'", '"')):
                    param_type = "string"
                    default = raw_default.strip("'\"")
                else:
                    default = raw_default

            params.append({"name": name, "default": default, "type": param_type})

        return Response({"params": params, "source_file": filepath.split("/")[-1]})

    @action(detail=True, methods=["get"])
    def ros_running_params(self, request, pk=None):
        """
        List running ROS2 nodes and their current parameter values:
          { nodes: [ { name, params: [ { name, value, type } ] } ] }

        Perf: this previously fanned out one `docker exec` + `ros2 param get` per
        (node, param) — dozens of throwaway ROS CLI processes per call, each able
        to orphan and accumulate inside the shared container (the get_param storm
        that saturated the host). It now runs ONE bounded `docker exec` that
        enumerates nodes and bulk-dumps each node's params (one `ros2 param dump`
        per node), parses container-side to JSON, and caches the result briefly so
        the frontend poll doesn't re-spawn a sweep on every tick. Ownership is
        enforced via get_object() (queryset is filtered to request.user).
        """
        canvas = self.get_object()
        cache_key = f"ros_running_params_{canvas.id}"
        try:
            cached = cache.get(cache_key)
        except OSError:
            cached = None
        if cached is not None:
            return Response(cached)

        try:
            proc = subprocess.run(
                ["docker", "exec", "-i", DOCKER_CONTAINER, "bash", "-c",
                 "source /opt/ros/humble/setup.bash 2>/dev/null && "
                 "timeout --signal=KILL 12s python3 -"],
                input=_ROS_PARAM_DUMP_HELPER,
                capture_output=True, text=True, timeout=20,
            )
        except subprocess.TimeoutExpired:
            return Response({"nodes": [], "error": "ros introspection timed out"})
        except Exception as e:
            return Response({"nodes": [], "error": str(e)})

        try:
            payload = json.loads(proc.stdout)
            if not isinstance(payload, dict) or "nodes" not in payload:
                payload = {"nodes": []}
        except ValueError:  # includes JSONDecodeError; covers empty/blank stdout
            payload = {"nodes": []}

        try:
            cache.set(cache_key, payload, ROS_PARAMS_CACHE_TIMEOUT)
        except OSError:
            pass
        return Response(payload)

    @action(detail=True, methods=["post"])
    def ros_set_param(self, request, pk=None):
        """
        Set a parameter on a running ROS2 node.
        Body: { node: "/node_name", param: "param_name", value: "new_value" }
        """
        node  = request.data.get("node", "").strip()
        param = request.data.get("param", "").strip()
        value = str(request.data.get("value", "")).strip()

        if not node or not param:
            return Response({"error": "node and param required"}, status=400)

        try:
            result = subprocess.run(
                ["docker", "exec", DOCKER_CONTAINER, "bash", "-c",
                 f"source /opt/ros/humble/setup.bash && "
                 f"ros2 param set {node} {param} {value} 2>&1"],
                capture_output=True, text=True, timeout=10
            )
            success = result.returncode == 0 and "Set parameter successful" in result.stdout
            return Response({
                "success": success,
                "output": result.stdout.strip() or result.stderr.strip(),
            })
        except Exception as e:
            return Response({"success": False, "error": str(e)}, status=500)

    @action(detail=True, methods=["get"])
    def file_tree(self, request, pk=None):
        """
        Get the file tree structure for this canvas
        Merges database files with actual Docker filesystem

        Query Parameters:
        - refresh: Set to 'true' to force refresh from Docker (default: false)

        Returns hierarchical structure similar to FileExplorer component
        """
        try:
            canvas = self.get_object()
            force_refresh = request.query_params.get('refresh', 'false').lower() == 'true'

            # Generate cache key for this canvas
            cache_key = f"file_tree_{canvas.id}"

            # Try to get cached tree if not forcing refresh
            if not force_refresh:
                try:
                    cached_tree = cache.get(cache_key)
                except OSError:
                    cached_tree = None
                if cached_tree is not None:
                    print(f"[FileTree] Returning cached tree for canvas {canvas.id}")
                    return Response(cached_tree)

            print(f"[FileTree] Building fresh tree for canvas {canvas.id} (refresh={force_refresh})")

            # Get files from Docker filesystem
            docker_files = self._scan_docker_filesystem(canvas)
            print(f"[FileTree] Found {len(docker_files)} files in Docker")

            # Get files from database
            db_files = list(canvas.files.all())
            print(f"[FileTree] Found {len(db_files)} files in database")

            # Merge both sources (Docker filesystem takes precedence for existence)
            merged_files = self._merge_file_sources(docker_files, db_files)
            print(f"[FileTree] Merged into {len(merged_files)} files")

            # Build tree structure
            tree = self._build_tree(merged_files)
            print(f"[FileTree] Built tree with {len(tree)} root items")

            serializer = FileTreeSerializer(tree, many=True)
            tree_data = serializer.data

            # Cache the tree (non-fatal — I/O errors on the cache backend must not
            # crash the view; the tree was already built successfully)
            try:
                cache.set(cache_key, tree_data, FILE_TREE_CACHE_TIMEOUT)
                print(f"[FileTree] Cached tree for {FILE_TREE_CACHE_TIMEOUT}s")
            except OSError as cache_err:
                print(f"[FileTree] Cache write failed ({cache_err}), serving without cache")

            return Response(tree_data)

        except Exception as e:
            print(f"[FileTree] ERROR: {str(e)}")
            import traceback
            traceback.print_exc()

            # Fall back to database-only files if Docker scanning fails
            try:
                db_files = list(canvas.files.all())
                tree = self._build_tree(db_files)
                serializer = FileTreeSerializer(tree, many=True)
                return Response(serializer.data)
            except Exception as fallback_error:
                print(f"[FileTree] Fallback also failed: {str(fallback_error)}")
                return Response([], status=status.HTTP_200_OK)

    def _invalidate_file_tree_cache(self, canvas_id):
        """Invalidate the file tree cache for a canvas"""
        cache_key = f"file_tree_{canvas_id}"
        cache.delete(cache_key)
        print(f"[FileTree] Cache invalidated for canvas {canvas_id}")

    # ── QCar SFTP file operations ──────────────────────────────────────────────

    def _require_qcar(self, canvas):
        """Return (qcar_ip, None) or (None, error Response)."""
        if not canvas.connect_to_qcar:
            return None, Response({'error': 'Canvas is not a QCar canvas'}, status=status.HTTP_400_BAD_REQUEST)
        from core.ip_config import load_network_config
        return load_network_config().qcar_ip, None

    @action(detail=True, methods=['get'])
    def qcar_file_tree(self, request, pk=None):
        """List files on the physical QCar via SFTP."""
        canvas = self.get_object()
        qcar_ip, err = self._require_qcar(canvas)
        if err:
            return err
        try:
            ssh, sftp = _qcar_connect(qcar_ip)
            try:
                try:
                    sftp.stat(QCAR_ROS_WORKSPACE)
                except FileNotFoundError:
                    return Response(
                        {'error': f'QCar home directory not found: {QCAR_ROS_WORKSPACE}'},
                        status=status.HTTP_404_NOT_FOUND,
                    )
                raw = _sftp_walk(sftp, QCAR_ROS_WORKSPACE)
            finally:
                sftp.close(); ssh.close()
            tree = self._build_tree(raw)
            serializer = FileTreeSerializer(tree, many=True)
            return Response(serializer.data)
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    @action(detail=True, methods=['get'])
    def qcar_read_file(self, request, pk=None):
        """Read a file from the QCar via SFTP. Query param: ?path=relative/path"""
        canvas = self.get_object()
        qcar_ip, err = self._require_qcar(canvas)
        if err:
            return err
        rel_path = request.query_params.get('path', '').lstrip('/')
        if not rel_path:
            return Response({'error': 'path required'}, status=status.HTTP_400_BAD_REQUEST)
        full_path = f'{QCAR_ROS_WORKSPACE}/{rel_path}'
        try:
            ssh, sftp = _qcar_connect(qcar_ip)
            try:
                with sftp.open(full_path, 'r') as fh:
                    content = fh.read().decode('utf-8', errors='replace')
            finally:
                sftp.close(); ssh.close()
            return Response({'content': content, 'path': rel_path})
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    @action(detail=True, methods=['post'])
    def qcar_write_file(self, request, pk=None):
        """Write content to a file on the QCar via SFTP. Body: {path, content}"""
        canvas = self.get_object()
        qcar_ip, err = self._require_qcar(canvas)
        if err:
            return err
        rel_path = (request.data.get('path') or '').lstrip('/')
        content  = request.data.get('content', '')
        if not rel_path:
            return Response({'error': 'path required'}, status=status.HTTP_400_BAD_REQUEST)
        full_path = f'{QCAR_ROS_WORKSPACE}/{rel_path}'
        try:
            ssh, sftp = _qcar_connect(qcar_ip)
            try:
                parent = '/'.join(full_path.split('/')[:-1])
                _sftp_makedirs(sftp, parent)
                with sftp.open(full_path, 'w') as fh:
                    fh.write(content.encode('utf-8'))
            finally:
                sftp.close(); ssh.close()
            return Response({'success': True, 'path': rel_path})
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    @action(detail=True, methods=['post'])
    def qcar_create(self, request, pk=None):
        """Create a file or directory on the QCar. Body: {path, file_type}"""
        canvas = self.get_object()
        qcar_ip, err = self._require_qcar(canvas)
        if err:
            return err
        rel_path  = (request.data.get('path') or '').lstrip('/')
        file_type = request.data.get('file_type', 'file')
        if not rel_path:
            return Response({'error': 'path required'}, status=status.HTTP_400_BAD_REQUEST)
        full_path = f'{QCAR_ROS_WORKSPACE}/{rel_path}'
        try:
            ssh, sftp = _qcar_connect(qcar_ip)
            try:
                if file_type == 'directory':
                    _sftp_makedirs(sftp, full_path)
                else:
                    parent = '/'.join(full_path.split('/')[:-1])
                    _sftp_makedirs(sftp, parent)
                    with sftp.open(full_path, 'w') as fh:
                        fh.write(b'')
            finally:
                sftp.close(); ssh.close()
            return Response({'success': True, 'path': rel_path, 'file_type': file_type})
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    @action(detail=True, methods=['post'])
    def qcar_delete(self, request, pk=None):
        """Delete a file or directory on the QCar. Body: {path}"""
        canvas = self.get_object()
        qcar_ip, err = self._require_qcar(canvas)
        if err:
            return err
        rel_path = (request.data.get('path') or '').lstrip('/')
        if not rel_path:
            return Response({'error': 'path required'}, status=status.HTTP_400_BAD_REQUEST)
        full_path = f'{QCAR_ROS_WORKSPACE}/{rel_path}'
        try:
            ssh, sftp = _qcar_connect(qcar_ip)
            try:
                _, stdout, _ = ssh.exec_command(f'rm -rf {shlex.quote(full_path)}')
                stdout.channel.recv_exit_status()
            finally:
                sftp.close(); ssh.close()
            return Response({'success': True})
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    @action(detail=True, methods=['post'])
    def qcar_rename(self, request, pk=None):
        """Rename/move a file on the QCar. Body: {old_path, new_path}"""
        canvas = self.get_object()
        qcar_ip, err = self._require_qcar(canvas)
        if err:
            return err
        old_rel = (request.data.get('old_path') or '').lstrip('/')
        new_rel = (request.data.get('new_path') or '').lstrip('/')
        if not old_rel or not new_rel:
            return Response({'error': 'old_path and new_path required'}, status=status.HTTP_400_BAD_REQUEST)
        old_full = f'{QCAR_ROS_WORKSPACE}/{old_rel}'
        new_full = f'{QCAR_ROS_WORKSPACE}/{new_rel}'
        try:
            ssh, sftp = _qcar_connect(qcar_ip)
            try:
                parent = '/'.join(new_full.split('/')[:-1])
                _sftp_makedirs(sftp, parent)
                sftp.rename(old_full, new_full)
            finally:
                sftp.close(); ssh.close()
            return Response({'success': True})
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    # Colcon build artifacts — not useful to browse and very slow to scan
    SCAN_EXCLUDE_DIRS = {"build", "install", "log"}

    def _scan_docker_filesystem(self, canvas):
        """Scan Docker container filesystem and return list of files.

        Uses a single find invocation that:
        - Prunes build/install/log directories so colcon artifacts are never
          returned (they can contain thousands of files).
        - Prints type + path in one pass via -printf, avoiding a separate
          'docker exec test -d' subprocess for every path found.
        """
        docker_path = canvas.docker_path
        files = []

        try:
            print(f"[Docker Scan] Checking container: {DOCKER_CONTAINER}")
            print(f"[Docker Scan] Workspace path: {docker_path}")

            # Check if Docker container is running
            check_container = subprocess.run(
                ["docker", "ps", "--filter", f"name={DOCKER_CONTAINER}", "--format", "{{.Names}}"],
                capture_output=True,
                text=True
            )

            if DOCKER_CONTAINER not in check_container.stdout:
                print(f"[Docker Scan] Container '{DOCKER_CONTAINER}' is not running!")
                print(f"[Docker Scan] Available containers: {check_container.stdout}")
                return []

            # Create workspace directory if it doesn't exist
            mkdir_result = subprocess.run(
                ["docker", "exec", DOCKER_CONTAINER, "mkdir", "-p", docker_path],
                capture_output=True,
                text=True
            )

            if mkdir_result.returncode != 0:
                print(f"[Docker Scan] Failed to create directory: {mkdir_result.stderr}")

            # Build -prune expression for excluded top-level dirs.
            # find accepts literal '(' and ')' when not going through a shell.
            prune_exprs = []
            for i, name in enumerate(self.SCAN_EXCLUDE_DIRS):
                if i > 0:
                    prune_exprs.append("-o")
                prune_exprs.extend(["-name", name])

            # Single find call: prune excluded dirs, emit "%y %p" per entry.
            # %y = file type character (f=file, d=dir, l=symlink, …)
            # %p = full path
            find_cmd = [
                "docker", "exec", DOCKER_CONTAINER,
                "find", docker_path, "-mindepth", "1",
                "(", *prune_exprs, ")", "-prune",
                "-o", "-printf", "%y %p\n",
            ]
            result = subprocess.run(find_cmd, capture_output=True, text=True)

            if result.returncode != 0:
                print(f"[Docker Scan] Find command failed: {result.stderr}")
                return []

            if result.stdout:
                lines = [line for line in result.stdout.strip().split('\n') if line]
                print(f"[Docker Scan] Found {len(lines)} items (build/install/log excluded)")

                for line in lines:
                    # Each line is "<type_char> <full_path>"
                    if len(line) < 3:
                        continue
                    type_char = line[0]
                    full_path = line[2:]

                    # Only handle regular files and directories
                    if type_char not in ('f', 'd'):
                        continue

                    if full_path == docker_path:
                        continue

                    if full_path.startswith(docker_path + "/"):
                        rel_path = full_path[len(docker_path) + 1:]
                    else:
                        rel_path = full_path

                    is_directory = (type_char == 'd')
                    files.append({
                        'path': rel_path,
                        'file_type': 'directory' if is_directory else 'file',
                        'source': 'docker',
                    })

        except subprocess.CalledProcessError as e:
            error_msg = e.stderr.decode() if e.stderr else str(e)
            print(f"[Docker Scan] CalledProcessError: {error_msg}")
        except Exception as e:
            print(f"[Docker Scan] Unexpected error: {str(e)}")
            import traceback
            traceback.print_exc()

        return files

    def _merge_file_sources(self, docker_files, db_files):
        """Merge files from Docker and database, preferring Docker for existence"""
        # Create a dict of Docker files by path
        docker_dict = {f['path']: f for f in docker_files}

        # Create a dict of DB files by path — strip leading slash so Docker paths
        # (which never have a leading slash) and DB paths compare identically.
        # Some older DB records were saved with a leading '/' prefix; normalise here
        # rather than requiring a data migration.
        db_dict = {f.path.lstrip('/'): f for f in db_files}

        # Merge: start with all Docker files
        merged = []
        for path, docker_file in docker_dict.items():
            # If file exists in DB, use DB object (has content, metadata)
            if path in db_dict:
                merged.append(db_dict[path])
            else:
                # File exists in Docker but not in DB, create a pseudo-object
                class DockerFile:
                    def __init__(self, path, file_type):
                        self.path = path
                        self.file_type = file_type
                        self.content = None
                        self.source = 'docker'

                merged.append(DockerFile(path, docker_file['file_type']))

        # Add DB files that don't exist in Docker (shouldn't happen normally)
        for path, db_file in db_dict.items():
            if path not in docker_dict:
                merged.append(db_file)

        return merged

    def _build_tree(self, files):
        """Build hierarchical tree from flat file list"""
        tree = {}

        for file in files:
            # Get file_type from either attribute or dict
            if hasattr(file, 'file_type'):
                file_type = file.file_type
            elif isinstance(file, dict):
                file_type = file.get('file_type', 'file')
            else:
                file_type = 'file'

            # Get path
            if hasattr(file, 'path'):
                file_path = file.path
            elif isinstance(file, dict):
                file_path = file.get('path', '')
            else:
                continue  # Skip if no path

            parts = file_path.split("/")
            current = tree

            for i, part in enumerate(parts):
                if not part:  # Skip empty parts
                    continue

                path = "/".join(parts[: i + 1])
                is_last = i == len(parts) - 1

                if part not in current:
                    current[part] = {
                        "name": part,
                        "path": path,
                        "type": file_type if is_last else "directory",
                        "children": {} if not is_last else None,
                    }
                else:
                    # Node already exists
                    # If this is the last part and current node is a directory, update it
                    if is_last and current[part]["type"] == "directory" and file_type == "file":
                        current[part]["type"] = "file"
                        current[part]["children"] = None

                # Move to next level
                if i < len(parts) - 1:
                    # Ensure children dict exists (convert file to directory if needed)
                    if current[part]["children"] is None:
                        print(f"[BuildTree] Converting {current[part]['path']} from file to directory")
                        current[part]["children"] = {}
                        current[part]["type"] = "directory"

                    current = current[part]["children"]

        # Convert dict to list
        def dict_to_list(node_dict):
            if node_dict is None:
                return []

            result = []
            for key, value in node_dict.items():
                item = {
                    "name": value["name"],
                    "path": value["path"],
                    "type": value["type"],
                }
                if value.get("children") is not None:
                    item["children"] = dict_to_list(value["children"])
                result.append(item)
            return result

        return dict_to_list(tree)


class WorkspaceFileViewSet(viewsets.ModelViewSet):
    """
    API endpoint for file CRUD operations
    """
    serializer_class = WorkspaceFileSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        canvas_id = self.kwargs.get("canvas_pk")
        return WorkspaceFile.objects.filter(
            canvas_id=canvas_id, canvas__user=self.request.user
        )

    def perform_create(self, serializer):
        canvas_id = self.kwargs.get("canvas_pk")
        canvas = get_object_or_404(
            Canvas, id=canvas_id, user=self.request.user
        )

        try:
            file_instance = serializer.save(canvas=canvas)

            # Write to Docker volume
            self._write_to_docker(file_instance)

            # Invalidate file tree cache
            self._invalidate_file_tree_cache(canvas_id)
        except Exception as e:
            # If Docker write fails, delete the database entry
            if 'file_instance' in locals():
                file_instance.delete()
            print(f"[WorkspaceFile] Create failed: {str(e)}")
            raise

    def perform_update(self, serializer):
        try:
            file_instance = serializer.save()
            print(f"[WorkspaceFile] Updating file: {file_instance.path}")
            print(f"[WorkspaceFile] Docker path: {file_instance.full_docker_path}")
            print(f"[WorkspaceFile] Content length: {len(file_instance.content) if file_instance.content else 0}")

            # Update Docker file
            self._write_to_docker(file_instance)

            # Invalidate file tree cache
            self._invalidate_file_tree_cache(file_instance.canvas_id)
            print(f"[WorkspaceFile] ✓ File updated successfully: {file_instance.path}")
        except Exception as e:
            import traceback
            error_details = traceback.format_exc()
            print(f"[WorkspaceFile] ❌ Update failed: {str(e)}")
            print(f"[WorkspaceFile] Full traceback:\n{error_details}")
            # Re-raise with more context
            from rest_framework.exceptions import APIException
            raise APIException(f"Failed to save file: {str(e)}")

    def perform_destroy(self, instance):
        canvas_id = instance.canvas_id

        # Delete from Docker
        self._delete_from_docker(instance)
        instance.delete()

        # Invalidate file tree cache
        self._invalidate_file_tree_cache(canvas_id)

    def _invalidate_file_tree_cache(self, canvas_id):
        """Invalidate the file tree cache for a canvas"""
        cache_key = f"file_tree_{canvas_id}"
        cache.delete(cache_key)
        print(f"[FileTree] Cache invalidated for canvas {canvas_id}")

    @action(detail=False, methods=["post"])
    def read_from_docker(self, request, canvas_pk=None):
        """
        Read file content directly from Docker filesystem
        Used for files that exist in Docker but not in database yet

        Request body:
        {
            "path": "relative/path/to/file.py"
        }

        Response:
        {
            "path": "relative/path/to/file.py",
            "content": "file contents...",
            "file_type": "file"
        }
        """
        canvas = get_object_or_404(Canvas, id=canvas_pk, user=request.user)
        file_path = request.data.get("path")

        if not file_path:
            return Response(
                {"error": "Path is required"},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Construct full Docker path
        full_docker_path = f"{canvas.docker_path}/{file_path}"

        try:
            # Check if file exists
            check_result = subprocess.run(
                ["docker", "exec", DOCKER_CONTAINER, "test", "-f", full_docker_path],
                capture_output=True
            )

            if check_result.returncode != 0:
                return Response(
                    {"error": f"File not found: {file_path}"},
                    status=status.HTTP_404_NOT_FOUND
                )

            # Read file content
            result = subprocess.run(
                ["docker", "exec", DOCKER_CONTAINER, "cat", full_docker_path],
                capture_output=True,
                text=True,
                check=True
            )

            return Response({
                "path": file_path,
                "content": result.stdout,
                "file_type": "file"
            })

        except subprocess.CalledProcessError as e:
            error_msg = e.stderr.decode() if e.stderr else str(e)
            return Response(
                {"error": f"Failed to read file: {error_msg}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    def _write_to_docker(self, file_instance):
        """Write file content to Docker volume using docker exec"""
        docker_path = file_instance.full_docker_path

        try:
            # First, check if Docker container is running
            check_container = subprocess.run(
                ["docker", "ps", "--filter", f"name={DOCKER_CONTAINER}", "--format", "{{.Names}}"],
                capture_output=True,
                text=True
            )

            if DOCKER_CONTAINER not in check_container.stdout:
                available_containers = subprocess.run(
                    ["docker", "ps", "--format", "{{.Names}}"],
                    capture_output=True,
                    text=True
                )
                error_msg = (
                    f"Docker container '{DOCKER_CONTAINER}' is not running!\n"
                    f"Available containers: {available_containers.stdout.strip() or 'None'}\n"
                    f"Stderr: {check_container.stderr.strip() or 'None'}\n"
                    f"Docker logs: {subprocess.run(['docker', 'logs', DOCKER_CONTAINER], capture_output=True, text=True).stderr.strip() or subprocess.run(['docker', 'logs', DOCKER_CONTAINER], capture_output=True, text=True).stdout.strip() or 'None'}\n"
                    f"Please start the container or update DOCKER_CONTAINER in settings."
                )
                print(f"[Docker] ❌ {error_msg}")
                raise Exception(error_msg)

            print(f"[Docker] Writing to: {docker_path}")

            # Create parent directories
            parent_dir = os.path.dirname(docker_path)
            if parent_dir:
                print(f"[Docker] Creating parent dir: {parent_dir}")
                mkdir_result = subprocess.run(
                    ["docker", "exec", DOCKER_CONTAINER, "mkdir", "-p", parent_dir],
                    check=True,
                    capture_output=True
                )

            if file_instance.file_type == WorkspaceFile.FILE:
                # Write file content (handle None or empty content)
                content = file_instance.content if file_instance.content is not None else ""
                print(f"[Docker] Writing {len(content)} bytes to file")

                write_result = subprocess.run(
                    ["docker", "exec", "-i", DOCKER_CONTAINER, "tee", docker_path],
                    input=content.encode('utf-8'),
                    check=True,
                    capture_output=True
                )
                print(f"[Docker] ✓ File written successfully")
            else:
                # Create directory
                print(f"[Docker] Creating directory")
                subprocess.run(
                    ["docker", "exec", DOCKER_CONTAINER, "mkdir", "-p", docker_path],
                    check=True,
                    capture_output=True
                )
                print(f"[Docker] ✓ Directory created successfully")

        except subprocess.CalledProcessError as e:
            error_msg = e.stderr.decode('utf-8') if e.stderr else str(e)
            print(f"[Docker] ❌ CalledProcessError: {error_msg}")
            print(f"[Docker] Command: {e.cmd}")
            print(f"[Docker] Return code: {e.returncode}")
            raise Exception(f"Docker command failed: {error_msg}")
        except UnicodeDecodeError as e:
            error_msg = f"File contains invalid UTF-8 characters: {str(e)}"
            print(f"[Docker] ❌ {error_msg}")
            raise Exception(error_msg)
        except Exception as e:
            print(f"[Docker] ❌ Unexpected error: {str(e)}")
            import traceback
            print(traceback.format_exc())
            raise Exception(f"Failed to write file to Docker: {str(e)}")

    def _delete_from_docker(self, file_instance):
        """Delete file from Docker volume using docker exec"""
        docker_path = file_instance.full_docker_path

        try:
            if file_instance.file_type == WorkspaceFile.FILE:
                subprocess.run(
                    ["docker", "exec", DOCKER_CONTAINER, "rm", "-f", docker_path],
                    check=True,
                    capture_output=True
                )
            else:
                subprocess.run(
                    ["docker", "exec", DOCKER_CONTAINER, "rm", "-rf", docker_path],
                    check=True,
                    capture_output=True
                )
        except subprocess.CalledProcessError as e:
            print(f"Error deleting from Docker: {e.stderr.decode() if e.stderr else str(e)}")


class MeshViewSet(viewsets.ModelViewSet):
    """
    API endpoint for managing custom mesh files
    """
    serializer_class = CustomMeshSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        canvas_id = self.kwargs.get("canvas_pk")
        return CustomMesh.objects.filter(
            canvas_id=canvas_id, canvas__user=self.request.user
        )

    @action(detail=False, methods=["post"])
    def upload(self, request, canvas_pk=None):
        """
        Upload a custom mesh file (.stl, .dae, .obj)

        Request body (multipart/form-data):
        {
            "file": <file>,
            "name": "optional_custom_name"
        }
        """
        canvas = get_object_or_404(Canvas, id=canvas_pk, user=request.user)

        uploaded_file = request.FILES.get("file")
        if not uploaded_file:
            return Response(
                {"error": "No file provided"},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Validate file extension
        valid_extensions = [".stl", ".dae", ".obj", ".STL", ".DAE", ".OBJ"]
        file_name = uploaded_file.name
        file_ext = file_name[file_name.rfind("."):] if "." in file_name else ""

        if file_ext not in valid_extensions:
            return Response(
                {"error": "Invalid file type. Supported: .stl, .dae, .obj"},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Use provided name or file name
        mesh_name = request.data.get("name") or file_name

        # Check for duplicate name in this canvas
        if CustomMesh.objects.filter(canvas=canvas, name=mesh_name).exists():
            return Response(
                {"error": f"Mesh with name '{mesh_name}' already exists"},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Create mesh instance
        mesh = CustomMesh.objects.create(
            canvas=canvas,
            user=request.user,
            name=mesh_name,
            file=uploaded_file,
            file_size=uploaded_file.size,
            file_type=file_ext.lower()
        )

        serializer = self.get_serializer(mesh)
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    @action(detail=False, methods=["post"])
    def import_from_url(self, request, canvas_pk=None):
        """
        Import a mesh file from a URL

        Request body:
        {
            "url": "http://example.com/mesh.stl",
            "name": "optional_custom_name"
        }
        """
        canvas = get_object_or_404(Canvas, id=canvas_pk, user=request.user)

        url = request.data.get("url")
        if not url:
            return Response(
                {"error": "URL is required"},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            # Download file from URL
            response = requests.get(url, timeout=30)
            response.raise_for_status()

            # Extract filename from URL
            url_filename = url.split("/")[-1].split("?")[0]

            # Validate file extension
            valid_extensions = [".stl", ".dae", ".obj", ".STL", ".DAE", ".OBJ"]
            file_ext = url_filename[url_filename.rfind("."):] if "." in url_filename else ""

            if file_ext not in valid_extensions:
                return Response(
                    {"error": "Invalid file type in URL. Supported: .stl, .dae, .obj"},
                    status=status.HTTP_400_BAD_REQUEST
                )

            # Use provided name or URL filename
            mesh_name = request.data.get("name") or url_filename

            # Check for duplicate name
            if CustomMesh.objects.filter(canvas=canvas, name=mesh_name).exists():
                return Response(
                    {"error": f"Mesh with name '{mesh_name}' already exists"},
                    status=status.HTTP_400_BAD_REQUEST
                )

            # Create mesh instance with downloaded content
            mesh = CustomMesh(
                canvas=canvas,
                user=request.user,
                name=mesh_name,
                file_size=len(response.content),
                file_type=file_ext.lower()
            )

            # Save file content
            mesh.file.save(url_filename, ContentFile(response.content), save=True)

            serializer = self.get_serializer(mesh)
            return Response(serializer.data, status=status.HTTP_201_CREATED)

        except requests.exceptions.RequestException as e:
            return Response(
                {"error": f"Failed to download file from URL: {str(e)}"},
                status=status.HTTP_400_BAD_REQUEST
            )
        except Exception as e:
            return Response(
                {"error": f"Failed to import mesh: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


@api_view(["GET"])
@permission_classes([AllowAny])
@throttle_classes([])
def serve_mesh(request, canvas_id, filename):
    """
    Serve mesh files for URDF visualization
    Resolves package://workspace_{canvas_id}/meshes/{filename} URLs

    Intentionally public (AllowAny) and throttle-exempt: the URDF loader fetches
    many mesh files per model without an auth header. Read-only, low-sensitivity
    static geometry; do not add per-user data here without an ownership check.
    """
    try:
        # Find the mesh file
        mesh = CustomMesh.objects.filter(
            canvas_id=canvas_id,
            file__icontains=filename
        ).first()

        if not mesh:
            return Response(
                {"error": "Mesh file not found"},
                status=status.HTTP_404_NOT_FOUND
            )

        # Determine content type based on file extension
        content_type_map = {
            '.stl': 'model/stl',
            '.dae': 'model/vnd.collada+xml',
            '.obj': 'model/obj',
        }
        content_type = content_type_map.get(mesh.file_type.lower(), 'application/octet-stream')

        # Return the file with appropriate content type
        from django.http import FileResponse
        response = FileResponse(mesh.file.open('rb'), content_type=content_type)

        # Add CORS headers to allow cross-origin requests from frontend
        response['Access-Control-Allow-Origin'] = '*'
        response['Access-Control-Allow-Methods'] = 'GET, OPTIONS'
        response['Access-Control-Allow-Headers'] = 'Content-Type'

        return response

    except Exception as e:
        return Response(
            {"error": f"Failed to serve mesh: {str(e)}"},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def execute_command(request, canvas_id):
    """
    Execute a command in the Docker container for this canvas

    Request body:
    {
        "command": "ls -la",
        "working_directory": "/workspaces/user/canvas_id" (optional)
    }

    Returns:
    {
        "output": "command output",
        "error": "error output if any",
        "exit_code": 0
    }
    """
    canvas = get_object_or_404(Canvas, id=canvas_id, user=request.user)

    command = request.data.get("command")
    if not command:
        return Response(
            {"error": "Command is required"}, status=status.HTTP_400_BAD_REQUEST
        )

    working_dir = request.data.get("working_directory") or canvas.docker_path

    # Increase timeout for potentially long-running commands
    timeout_seconds = 60 if command.startswith(('ros2 run', 'colcon build')) else 30

    # Execute command in Docker container
    try:
        # First, ensure the canvas directory exists in Docker
        mkdir_result = subprocess.run(
            [
                "docker", "exec",
                DOCKER_CONTAINER,
                "bash", "-c", f"mkdir -p {working_dir}"
            ],
            capture_output=True,
            text=True,
            timeout=5,
        )

        if mkdir_result.returncode != 0:
            return Response(
                {
                    "error": f"Failed to create workspace directory: {mkdir_result.stderr}",
                    "exit_code": mkdir_result.returncode
                },
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

        # Execute command inside Docker container with working directory
        # Source ROS2 setup before executing the command
        # Also source local workspace setup if it exists
        full_command = f"source /opt/ros/humble/setup.bash && cd {working_dir} && "

        # Check if install/setup.bash exists and source it
        full_command += f"if [ -f {working_dir}/install/setup.bash ]; then source {working_dir}/install/setup.bash; fi && "

        # Execute the user's command (namespace-injected for ROS node commands)
        full_command += _inject_ros_namespace(command, canvas_id)

        result = subprocess.run(
            [
                "docker", "exec",
                DOCKER_CONTAINER,
                "bash", "-c", full_command
            ],
            capture_output=True,
            text=True,
            timeout=timeout_seconds,
        )

        # For source commands, return success message if no errors
        response_data = {
            "output": result.stdout,
            "error": result.stderr,
            "exit_code": result.returncode,
            "command": command,
            "working_directory": working_dir,
        }

        # If it's a source command with no output and no errors, add success message
        if command.startswith('source') and not result.stdout and not result.stderr and result.returncode == 0:
            response_data["output"] = "Environment sourced successfully"

        return Response(response_data)
    except subprocess.TimeoutExpired:
        timeout_msg = f"Command execution timeout ({timeout_seconds}s)"
        return Response(
            {"error": timeout_msg},
            status=status.HTTP_408_REQUEST_TIMEOUT,
        )
    except Exception as e:
        return Response(
            {"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


def read_stream(stream, output_queue, stream_name):
    """
    Read from a stream (stdout/stderr) and put lines into a queue
    Runs in a separate thread
    """
    try:
        for line in iter(stream.readline, ''):
            if line:
                output_queue.put((stream_name, line))
        stream.close()
    except Exception as e:
        output_queue.put((stream_name, f"[Stream error: {str(e)}]\n"))


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def start_streaming_command(request, canvas_id):
    """
    Start a long-running command that streams output

    Request body:
    {
        "command": "ros2 run my_pkg my_node"
    }

    Returns:
    {
        "process_id": "uuid-string",
        "status": "running"
    }
    """
    canvas = get_object_or_404(Canvas, id=canvas_id, user=request.user)

    command = request.data.get("command")
    if not command:
        return Response(
            {"error": "Command is required"},
            status=status.HTTP_400_BAD_REQUEST
        )

    working_dir = canvas.docker_path

    # Generate unique process ID
    process_id = str(uuid.uuid4())

    try:
        # Build full command with ROS2 setup
        full_command = f"source /opt/ros/humble/setup.bash && cd {working_dir} && "
        full_command += f"if [ -f {working_dir}/install/setup.bash ]; then source {working_dir}/install/setup.bash; fi && "
        full_command += _inject_ros_namespace(command, canvas_id)

        # Start process with Popen for streaming
        process = subprocess.Popen(
            ["docker", "exec", "-i", DOCKER_CONTAINER, "bash", "-c", full_command],
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            text=True,
            bufsize=1,  # Line buffered
            universal_newlines=True
        )

        # Create output queue for this process
        output_queue = queue.Queue()

        # Start threads to read stdout and stderr
        stdout_thread = threading.Thread(
            target=read_stream,
            args=(process.stdout, output_queue, 'stdout'),
            daemon=True
        )
        stderr_thread = threading.Thread(
            target=read_stream,
            args=(process.stderr, output_queue, 'stderr'),
            daemon=True
        )

        stdout_thread.start()
        stderr_thread.start()

        # Store process info
        RUNNING_PROCESSES[process_id] = {
            'process': process,
            'output_queue': output_queue,
            'command': command,
            'start_time': time.time(),
            'canvas_id': canvas_id,
            'user_id': request.user.id,
            'stdout_thread': stdout_thread,
            'stderr_thread': stderr_thread,
        }

        return Response({
            "process_id": process_id,
            "status": "running",
            "command": command
        })

    except Exception as e:
        return Response(
            {"error": str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def get_process_output(request, canvas_id, process_id):
    """
    Get new output from a running process

    Returns:
    {
        "output": [
            {"type": "stdout", "data": "line 1"},
            {"type": "stderr", "data": "line 2"}
        ],
        "status": "running" | "completed" | "error",
        "exit_code": 0 (if completed)
    }
    """
    # Check if process exists and user owns it
    if process_id not in RUNNING_PROCESSES:
        return Response(
            {"error": "Process not found", "status": "not_found"},
            status=status.HTTP_404_NOT_FOUND
        )

    process_info = RUNNING_PROCESSES[process_id]

    # Verify user owns this process
    if process_info['user_id'] != request.user.id:
        return Response(
            {"error": "Unauthorized"},
            status=status.HTTP_403_FORBIDDEN
        )

    process = process_info['process']
    output_queue = process_info['output_queue']

    # Collect all available output
    output_lines = []
    try:
        while not output_queue.empty():
            stream_name, line = output_queue.get_nowait()
            output_lines.append({
                "type": stream_name,
                "data": line.rstrip('\n')
            })
    except queue.Empty:
        pass

    # Check if process is still running
    poll_result = process.poll()

    if poll_result is None:
        # Still running
        return Response({
            "output": output_lines,
            "status": "running"
        })
    else:
        # Process completed
        # Get any remaining output
        try:
            while not output_queue.empty():
                stream_name, line = output_queue.get_nowait()
                output_lines.append({
                    "type": stream_name,
                    "data": line.rstrip('\n')
                })
        except queue.Empty:
            pass

        # Clean up
        if process_id in RUNNING_PROCESSES:
            del RUNNING_PROCESSES[process_id]

        return Response({
            "output": output_lines,
            "status": "completed",
            "exit_code": poll_result
        })


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def kill_process(request, canvas_id, process_id):
    """
    Kill a running process

    Returns:
    {
        "status": "killed",
        "process_id": "uuid"
    }
    """
    if process_id not in RUNNING_PROCESSES:
        return Response(
            {"error": "Process not found"},
            status=status.HTTP_404_NOT_FOUND
        )

    process_info = RUNNING_PROCESSES[process_id]

    # Verify user owns this process
    if process_info['user_id'] != request.user.id:
        return Response(
            {"error": "Unauthorized"},
            status=status.HTTP_403_FORBIDDEN
        )

    process = process_info['process']

    try:
        # Send SIGTERM first
        process.terminate()

        # Wait up to 2 seconds for graceful shutdown
        try:
            process.wait(timeout=2)
        except subprocess.TimeoutExpired:
            # Force kill if still running
            process.kill()
            process.wait()

        # Clean up
        if process_id in RUNNING_PROCESSES:
            del RUNNING_PROCESSES[process_id]

        return Response({
            "status": "killed",
            "process_id": process_id
        })

    except Exception as e:
        return Response(
            {"error": str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )
