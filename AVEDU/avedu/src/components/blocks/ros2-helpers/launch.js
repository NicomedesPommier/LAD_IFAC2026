// `ros2 run` command + Python launch file generation.

export function buildRosRunCmd(rosRunData) {
  if (!rosRunData) return "";

  const {
    pkg = "",
    exe = "",
    ns = "",
    args = []
  } = rosRunData;

  if (!pkg || !exe) {
    return "# ros2 run requires package and executable names";
  }

  let cmd = `ros2 run ${pkg} ${exe}`;

  if (ns && ns.trim()) {
    cmd += ` --ros-args -r __ns:=${ns.trim()}`;
  }

  if (Array.isArray(args) && args.length > 0) {
    const argsStr = args.join(" ");
    if (argsStr.trim()) {
      cmd += ` ${argsStr.trim()}`;
    }
  }

  return cmd;
}

export function generateLaunchFileCode(launchFileData, executableNodes) {
  const fileName = launchFileData?.fileName || "my_launch";

  if (!executableNodes || executableNodes.length === 0) {
    return `# Launch file: ${fileName}.launch.py
# Connect "Launch Node" blocks to add nodes to this launch file.

from launch import LaunchDescription


def generate_launch_description():
    return LaunchDescription([
        # Add Node() entries here
    ])`;
  }

  const nodeEntries = executableNodes.map((node) => {
    const d = node.data || {};
    const pkg = d.package || "my_package";
    const exe = d.executable || "my_executable";
    const nodeName = d.nodeName && d.nodeName !== exe ? d.nodeName : null;
    const namespace = d.namespace ? d.namespace.trim() : null;
    const params = Array.isArray(d.params) ? d.params.filter((p) => p.key) : [];

    const extras = [];
    if (nodeName) extras.push(`            name='${nodeName}',`);
    if (namespace) extras.push(`            namespace='${namespace}',`);
    if (params.length > 0) {
      const kvs = params.map((p) => `'${p.key}': '${p.value}'`).join(", ");
      extras.push(`            parameters=[{${kvs}}],`);
    }

    const extraStr = extras.length > 0 ? "\n" + extras.join("\n") : "";

    return `        Node(
            package='${pkg}',
            executable='${exe}',${extraStr}
        ),`;
  }).join("\n");

  return `# =============================================================================
# Launch file: ${fileName}.launch.py
# Generated from visual blocks — edit freely.
# =============================================================================

from launch import LaunchDescription
from launch_ros.actions import Node


def generate_launch_description():
    return LaunchDescription([
${nodeEntries}
    ])`;
}
