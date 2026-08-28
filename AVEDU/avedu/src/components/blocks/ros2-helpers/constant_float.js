// =============================================================================
// constant_float.js
// Generator for the `constantFloat` RosFlow node.
//
// One ROS 2 code → one file (project convention): this file owns *only* the
// Constant Float publisher so it can be edited without touching other nodes.
//
// The node publishes a fixed std_msgs/Float32 at a steady rate. It is the
// "cruise speed" / "constant heading" source for the self-driving pipeline
// (Mission 6), and a reusable building block anywhere a steady value is needed.
// =============================================================================

import { pascalCase, enforceWorkspace } from "./utils";

export function generateConstantFloatCode(d) {
  if (!d) return "";

  const {
    nodeName         = "constant_float",
    outputTopic      = "/target_speed",
    value            = 0.5,
    publishFrequency = 20.0,
    canvasId,
  } = d;

  const isQCarMode = d?.isQCarMode || false;
  // Match the simulator's workspace namespace so this value reaches the rest of
  // the in-sim pipeline (no-op in QCar mode — see enforceWorkspace).
  const internalOutputTopic = enforceWorkspace(outputTopic, { canvasId, isQCarMode });

  const className = pascalCase(nodeName);
  const freq = parseFloat(publishFrequency || 20.0).toFixed(1);
  const val  = parseFloat(value || 0).toFixed(4);

  return `#!/usr/bin/env python3
# =============================================================================
# 🧩 This file was generated from visual blocks!
# You can edit it as text, but re-opening it will show the block editor.
# =============================================================================
#
# Constant Float Node
# Publishes a fixed value on a topic at a steady rate.
# Output : ${outputTopic}  (std_msgs/Float32 = ${val})
# Rate   : ${freq} Hz
# =============================================================================

import rclpy
from rclpy.node import Node
from std_msgs.msg import Float32


class ${className}(Node):
    def __init__(self):
        super().__init__('${nodeName}')

        self.declare_parameter('output_topic', '${internalOutputTopic}')
        self.declare_parameter('value',        ${val})
        self.declare_parameter('frequency',    ${freq})

        output_topic = self.get_parameter('output_topic').value
        self._value  = self.get_parameter('value').value
        frequency    = self.get_parameter('frequency').value

        self._pub   = self.create_publisher(Float32, output_topic, 10)
        self._timer = self.create_timer(1.0 / frequency, self._tick)

        self.get_logger().info(
            f'Constant Float node ready — publishing {self._value}'
            f' on {output_topic} at ${freq} Hz'
        )

    def _tick(self):
        msg = Float32()
        msg.data = float(self._value)
        self._pub.publish(msg)


def main(args=None):
    rclpy.init(args=args)
    node = ${className}()
    try:
        rclpy.spin(node)
    except KeyboardInterrupt:
        pass
    finally:
        node.destroy_node()
        rclpy.shutdown()


if __name__ == '__main__':
    main()
`;
}
