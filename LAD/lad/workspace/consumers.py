"""
TerminalConsumer — WebSocket PTY terminal that runs a real bash session
inside the ROS Docker container.

Flow:
  Browser (xterm.js) ↔ WebSocket ↔ TerminalConsumer ↔ PTY ↔ docker exec -it

Linux:   uses pty.fork()  — standard Unix PTY
Windows: uses pywinpty   — Windows ConPTY (same behaviour as Linux PTY)

Both paths provide a real controlling terminal so `docker exec -it` works
and bash behaves normally (prompts, readline, colours, resize).
"""

import asyncio
import json
import os
import queue
import signal
import struct
import sys
import threading

from asgiref.sync import sync_to_async
from channels.generic.websocket import AsyncWebsocketConsumer

from .models import Canvas
from .views import DOCKER_CONTAINER

_IS_WINDOWS = sys.platform == 'win32'

if _IS_WINDOWS:
    from winpty import PtyProcess
else:
    import fcntl
    import pty
    import select
    import termios


class TerminalConsumer(AsyncWebsocketConsumer):

    async def connect(self):
        self.canvas_id = self.scope['url_route']['kwargs']['canvas_id']
        self.master_fd = None       # Unix PTY master fd
        self._pty_pid = None        # Unix child PID
        self._pty_proc = None       # Windows PtyProcess
        self._read_queue = None     # Windows reader queue
        self._running = False

        # Accept first — calling close() before accept() returns HTTP 403,
        # losing the custom close code and triggering the generic error path.
        await self.accept()

        # ── JWT auth ─────────────────────────────────────────────────────────
        query_string = self.scope.get('query_string', b'').decode()
        token = None
        for param in query_string.split('&'):
            if param.startswith('token='):
                token = param[6:]
                break

        if not token:
            await self.send(text_data='\r\n\x1b[31mNo auth token — please log in again\x1b[0m\r\n')
            await self.close(code=4001)
            return

        try:
            from rest_framework_simplejwt.tokens import AccessToken
            from django.contrib.auth.models import User
            access_token = AccessToken(token)
            user_id = access_token['user_id']
            self.user = await sync_to_async(User.objects.get)(id=user_id)
        except Exception as e:
            await self.send(text_data=f'\r\n\x1b[31mAuthentication failed: {e}\x1b[0m\r\n')
            await self.close(code=4001)
            return

        # ── Canvas ownership ──────────────────────────────────────────────────
        try:
            def _get_canvas():
                c = Canvas.objects.select_related('user').get(
                    id=self.canvas_id, user=self.user
                )
                return c.id, c.user.username, c.connect_to_qcar

            canvas_id, username, self.connect_to_qcar = await sync_to_async(_get_canvas)()
            self.working_dir = f"/workspaces/{username}/{canvas_id}"
        except Canvas.DoesNotExist:
            await self.send(text_data=f'\r\n\x1b[31mCanvas not found\x1b[0m\r\n')
            await self.close(code=4003)
            return

        # ── Start PTY ─────────────────────────────────────────────────────────
        loop = asyncio.get_event_loop()
        try:
            await loop.run_in_executor(None, self._start_pty)
        except Exception as e:
            await self.send(text_data=(
                f'\r\n\x1b[31mFailed to start terminal: {e}\x1b[0m\r\n'
                f'Make sure Docker container "{DOCKER_CONTAINER}" is running.\r\n'
            ))
            await self.close(code=4002)
            return

        self._running = True
        self._read_task = asyncio.create_task(self._read_loop())

    # ── PTY startup ───────────────────────────────────────────────────────────

    def _start_pty(self):
        if self.connect_to_qcar:
            # QCar mode: SSH from inside the Docker container to the physical QCar.
            # The container is on the same LAN so it can reach the QCar directly.
            from core.ip_config import load_network_config
            qcar_ip = load_network_config().qcar_ip
            init_cmd = (
                f'ssh -o StrictHostKeyChecking=no '
                f'-o UserKnownHostsFile=/dev/null '
                f'nvidia@{qcar_ip}'
            )
        else:
            ros_namespace = '/ws_' + str(self.canvas_id).replace('-', '_')
            init_cmd = (
                'source /opt/ros/humble/setup.bash 2>/dev/null; '
                f'[ -f {self.working_dir}/install/setup.bash ] && '
                f'source {self.working_dir}/install/setup.bash 2>/dev/null; '
                f'mkdir -p {self.working_dir} 2>/dev/null; '
                f'cd {self.working_dir} 2>/dev/null || cd /; '
                f'export ROS_NAMESPACE={ros_namespace}; '
                'exec bash'
            )
        if _IS_WINDOWS:
            self._start_pty_windows(init_cmd)
        else:
            self._start_pty_unix(init_cmd)

    def _start_pty_unix(self, init_cmd):
        """Linux/Mac: pty.fork() gives docker exec -it a real controlling TTY."""
        pid, master_fd = pty.fork()

        if pid == 0:
            try:
                os.execvp('docker', [
                    'docker', 'exec', '-it', DOCKER_CONTAINER,
                    'bash', '-c', init_cmd,
                ])
            except Exception:
                pass
            os._exit(1)

        self.master_fd = master_fd
        self._pty_pid = pid

        # Set default terminal size 80×24
        winsize = struct.pack('HHHH', 24, 80, 0, 0)
        fcntl.ioctl(master_fd, termios.TIOCSWINSZ, winsize)

    def _start_pty_windows(self, init_cmd):
        """Windows: pywinpty (ConPTY) — behaves identically to pty.fork() on Linux.

        Uses docker exec -it so bash gets a proper TTY and behaves normally.
        A background thread feeds output into a queue for the async read loop.
        """
        env = os.environ.copy()
        env['TERM'] = 'xterm-256color'

        self._pty_proc = PtyProcess.spawn(
            ['docker', 'exec', '-it', DOCKER_CONTAINER, 'bash', '-c', init_cmd],
            dimensions=(24, 80),
            env=env,
        )
        self._read_queue = queue.Queue()
        threading.Thread(target=self._windows_reader_thread, daemon=True).start()

    def _windows_reader_thread(self):
        """Blocking reader in a daemon thread — feeds self._read_queue."""
        try:
            while self._pty_proc.isalive():
                data = self._pty_proc.read(4096)
                if data:
                    if isinstance(data, str):
                        data = data.encode('utf-8', errors='replace')
                    self._read_queue.put(data)
        except Exception:
            pass
        self._read_queue.put(None)  # EOF sentinel

    # ── Output reading loop ────────────────────────────────────────────────────

    async def _read_loop(self):
        loop = asyncio.get_event_loop()
        while self._running:
            try:
                data = await loop.run_in_executor(None, self._read_chunk)
                if data is None:
                    break
                if data:
                    await self.send(bytes_data=data)
            except Exception:
                break
        self._running = False
        try:
            await self.close()
        except Exception:
            pass

    def _read_chunk(self):
        if _IS_WINDOWS:
            return self._read_chunk_windows()
        return self._read_chunk_unix()

    def _read_chunk_unix(self):
        try:
            r, _, _ = select.select([self.master_fd], [], [], 0.3)
            if r:
                return os.read(self.master_fd, 4096)
            if self._pty_pid is not None:
                try:
                    pid, _ = os.waitpid(self._pty_pid, os.WNOHANG)
                    if pid != 0:
                        return None
                except ChildProcessError:
                    return None
            return b''
        except OSError:
            return None

    def _read_chunk_windows(self):
        try:
            data = self._read_queue.get(timeout=0.3)
            return data  # None = EOF sentinel
        except queue.Empty:
            if self._pty_proc is not None and not self._pty_proc.isalive():
                return None
            return b''

    # ── Cleanup ───────────────────────────────────────────────────────────────

    async def disconnect(self, close_code):
        self._running = False

        if hasattr(self, '_read_task'):
            self._read_task.cancel()
            try:
                await self._read_task
            except (asyncio.CancelledError, Exception):
                pass

        if _IS_WINDOWS:
            if self._pty_proc is not None:
                try:
                    self._pty_proc.terminate(force=True)
                except Exception:
                    pass
                self._pty_proc = None
        else:
            if self._pty_pid is not None:
                try:
                    os.kill(self._pty_pid, signal.SIGTERM)
                except ProcessLookupError:
                    pass
                loop = asyncio.get_event_loop()
                try:
                    await loop.run_in_executor(None, self._reap_child)
                except Exception:
                    pass

            if self.master_fd is not None:
                try:
                    os.close(self.master_fd)
                    self.master_fd = None
                except Exception:
                    pass

    def _reap_child(self):
        if self._pty_pid is None:
            return
        try:
            os.waitpid(self._pty_pid, 0)
        except Exception:
            pass

    # ── Input from browser ────────────────────────────────────────────────────

    async def receive(self, text_data=None, bytes_data=None):
        loop = asyncio.get_event_loop()

        # Heartbeat: reply to client pings so it can detect a half-open socket
        # (looks connected but is silently dead) and reconnect.
        if text_data:
            try:
                _hb = json.loads(text_data)
            except (json.JSONDecodeError, ValueError):
                _hb = None
            if _hb and _hb.get('type') == 'ping':
                await self.send(text_data='{"type":"pong"}')
                return

        if _IS_WINDOWS:
            if self._pty_proc is None:
                return
            if bytes_data:
                text = bytes_data.decode('utf-8', errors='replace')
                await loop.run_in_executor(None, self._pty_proc.write, text)
            elif text_data:
                try:
                    msg = json.loads(text_data)
                    if msg.get('type') == 'resize':
                        cols = int(msg.get('cols', 80))
                        rows = int(msg.get('rows', 24))
                        await loop.run_in_executor(
                            None, self._pty_proc.setwinsize, rows, cols
                        )
                except (json.JSONDecodeError, ValueError):
                    await loop.run_in_executor(None, self._pty_proc.write, text_data)
        else:
            if self.master_fd is None:
                return
            if bytes_data:
                await loop.run_in_executor(None, os.write, self.master_fd, bytes_data)
            elif text_data:
                try:
                    msg = json.loads(text_data)
                    if msg.get('type') == 'resize':
                        cols = int(msg.get('cols', 80))
                        rows = int(msg.get('rows', 24))
                        winsize = struct.pack('HHHH', rows, cols, 0, 0)
                        await loop.run_in_executor(
                            None,
                            fcntl.ioctl,
                            self.master_fd,
                            termios.TIOCSWINSZ,
                            winsize,
                        )
                except (json.JSONDecodeError, ValueError):
                    await loop.run_in_executor(
                        None, os.write, self.master_fd, text_data.encode()
                    )
