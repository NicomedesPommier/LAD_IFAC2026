// Control-loop nodes: PID error, PID controller, velocity command.

import { pascalCase, enforceWorkspace } from "./utils";

export function generatePIDErrorCode(d) {
  if (!d) return "";

  const {
    nodeName      = "pid_error_node",
    measuredTopic = "/measured",
    setpointMode  = "constant",
    setpointValue = 0.0,
    setpointTopic = "/setpoint",
    outputTopic   = "/pid/error",
  } = d;

  const className = pascalCase(nodeName);

  const setpointInit = setpointMode === "topic"
    ? `        self.declare_parameter('setpoint_topic', '${setpointTopic}')
        sp_topic = self.get_parameter('setpoint_topic').value
        self._setpoint = 0.0
        self._sp_sub = self.create_subscription(
            Float32, sp_topic, self._setpoint_cb, 10)`
    : `        self.declare_parameter('setpoint_value', ${setpointValue})
        self._setpoint = self.get_parameter('setpoint_value').value`;

  const setpointCb = setpointMode === "topic"
    ? `
    def _setpoint_cb(self, msg):
        self._setpoint = float(msg.data)
`
    : "";

  return `#!/usr/bin/env python3
# =============================================================================
# 🧩 This file was generated from visual blocks!
# You can edit it as text, but re-opening it will show the block editor.
# =============================================================================
#
# PID Error Node
# Computes: error = setpoint - measured
# Measured : ${measuredTopic}  (Float32)
${setpointMode === "topic" ? `# Setpoint : ${setpointTopic}  (Float32)` : `# Setpoint : constant ${setpointValue}`}
# Output   : ${outputTopic}  (Float32)
# =============================================================================

import rclpy
from rclpy.node import Node
from std_msgs.msg import Float32


class ${className}(Node):
    def __init__(self):
        super().__init__('${nodeName}')

        self.declare_parameter('measured_topic', '${measuredTopic}')
        self.declare_parameter('output_topic',   '${outputTopic}')
${setpointInit}

        measured_topic = self.get_parameter('measured_topic').value
        output_topic   = self.get_parameter('output_topic').value

        self._pub = self.create_publisher(Float32, output_topic, 10)
        self._sub = self.create_subscription(
            Float32, measured_topic, self._measured_cb, 10)

        self.get_logger().info(
            f'PID Error node ready — measured: {measured_topic}'
            f' | output: {output_topic}'
        )
${setpointCb}
    def _measured_cb(self, msg):
        error = self._setpoint - float(msg.data)
        out = Float32()
        out.data = error
        self._pub.publish(out)


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

export function generatePIDControllerCode(d) {
  if (!d) return "";

  const {
    nodeName         = "pid_controller",
    errorTopic       = "/pid/error",
    outputTopic      = "/pid/correction",
    kp               = 1.0,
    ki               = 0.0,
    kd               = 0.0,
    publishFrequency = 20.0,
  } = d;

  const className = pascalCase(nodeName);
  const timerPeriod = (1.0 / parseFloat(publishFrequency || 20.0)).toFixed(4);

  return `#!/usr/bin/env python3
# =============================================================================
# 🧩 This file was generated from visual blocks!
# You can edit it as text, but re-opening it will show the block editor.
# =============================================================================
#
# PID Controller Node
# Error input  : ${errorTopic}  (Float32)
# Correction   : ${outputTopic}  (Float32)
# Gains        : Kp=${kp}  Ki=${ki}  Kd=${kd}
# Frequency    : ${publishFrequency} Hz
# =============================================================================

import time
import rclpy
from rclpy.node import Node
from std_msgs.msg import Float32


class ${className}(Node):
    def __init__(self):
        super().__init__('${nodeName}')

        self.declare_parameter('error_topic',  '${errorTopic}')
        self.declare_parameter('output_topic', '${outputTopic}')
        self.declare_parameter('kp',           ${kp})
        self.declare_parameter('ki',           ${ki})
        self.declare_parameter('kd',           ${kd})

        error_topic  = self.get_parameter('error_topic').value
        output_topic = self.get_parameter('output_topic').value
        self._kp     = self.get_parameter('kp').value
        self._ki     = self.get_parameter('ki').value
        self._kd     = self.get_parameter('kd').value

        self._error     = 0.0
        self._integral  = 0.0
        self._prev_error = 0.0
        self._prev_time  = self.get_clock().now().nanoseconds * 1e-9

        self._pub = self.create_publisher(Float32, output_topic, 10)
        self._sub = self.create_subscription(
            Float32, error_topic, self._error_cb, 10)
        self._timer = self.create_timer(${timerPeriod}, self._timer_cb)

        self.get_logger().info(
            f'PID Controller ready — error: {error_topic}'
            f' | output: {output_topic}'
            f' | Kp={self._kp} Ki={self._ki} Kd={self._kd}'
        )

    def _error_cb(self, msg):
        self._error = float(msg.data)

    def _timer_cb(self):
        now = self.get_clock().now().nanoseconds * 1e-9
        dt  = now - self._prev_time
        if dt <= 0.0:
            dt = 1e-6
        self._prev_time = now

        # Integral with anti-windup clamp [-10, 10]
        self._integral += self._error * dt
        self._integral  = max(-10.0, min(10.0, self._integral))

        derivative = (self._error - self._prev_error) / dt
        self._prev_error = self._error

        correction = (self._kp * self._error
                      + self._ki * self._integral
                      + self._kd * derivative)

        out = Float32()
        out.data = float(correction)
        self._pub.publish(out)


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

export function generateVelocityCommandCode(d) {
  if (!d) return "";

  const {
    nodeName         = "velocity_command",
    linearTopic      = "/pid/correction",
    angularTopic     = "/steering/correction",
    cmdVelTopic      = "/cmd_vel",
    publishFrequency = 20.0,
    stopTopic        = "",
  } = d;

  const className = pascalCase(nodeName);

  // Match the simulator's workspace namespace so the pipeline reaches the in-sim
  // QCar (no-op in QCar mode — see enforceWorkspace).
  const ctx = { canvasId: d.canvasId, isQCarMode: d?.isQCarMode || false };
  const nsLinear  = enforceWorkspace(linearTopic, ctx);
  const nsAngular = enforceWorkspace(angularTopic, ctx);
  const nsCmdVel  = enforceWorkspace(cmdVelTopic, ctx);

  // Optional safety gate: when a Bool `stopTopic` is wired in and reads True,
  // the node publishes a zero Twist (emergency stop). Used by the self-driving
  // pipeline to halt on /obstacle/detected.
  const hasStop = !!(stopTopic && String(stopTopic).trim());
  const nsStop  = hasStop ? enforceWorkspace(stopTopic, ctx) : "";

  const stopImport = hasStop ? "from std_msgs.msg import Float32, Bool" : "from std_msgs.msg import Float32";

  const stopInit = hasStop ? `
        self.declare_parameter('stop_topic',    '${nsStop}')
        stop_topic    = self.get_parameter('stop_topic').value
        self._stopped = False
        self._stop_sub = self.create_subscription(
            Bool, stop_topic, self._stop_cb, 10)` : "";

  const stopCb = hasStop ? `
    def _stop_cb(self, msg):
        self._stopped = bool(msg.data)
` : "";

  const stopGate = hasStop ? `
        if self._stopped:
            self._pub.publish(Twist())   # zero velocity — emergency stop
            return
` : "";

  const stopLog = hasStop ? `\n            f' | stop: {stop_topic}'` : "";

  return `#!/usr/bin/env python3
# =============================================================================
# 🧩 This file was generated from visual blocks!
# You can edit it as text, but re-opening it will show the block editor.
# =============================================================================
#
# Velocity Command Node
# linear.x  ← ${linearTopic}  (Float32)
# angular.z ← ${angularTopic}  (Float32)
${hasStop ? `# stop      ← ${stopTopic}  (Bool — True publishes zero Twist)\n` : ""}# Publishes → ${cmdVelTopic}  (geometry_msgs/Twist)
# Frequency : ${publishFrequency} Hz
# =============================================================================

import rclpy
from rclpy.node import Node
${stopImport}
from geometry_msgs.msg import Twist


class ${className}(Node):
    def __init__(self):
        super().__init__('${nodeName}')

        self.declare_parameter('linear_topic',  '${nsLinear}')
        self.declare_parameter('angular_topic', '${nsAngular}')
        self.declare_parameter('cmd_vel_topic', '${nsCmdVel}')
        self.declare_parameter('frequency',     ${parseFloat(publishFrequency || 20.0).toFixed(1)})

        linear_topic  = self.get_parameter('linear_topic').value
        angular_topic = self.get_parameter('angular_topic').value
        cmd_vel_topic = self.get_parameter('cmd_vel_topic').value
        frequency     = self.get_parameter('frequency').value

        self._linear_x  = 0.0
        self._angular_z = 0.0

        self._pub = self.create_publisher(Twist, cmd_vel_topic, 10)

        self._linear_sub = self.create_subscription(
            Float32, linear_topic, self._linear_cb, 10)
        self._angular_sub = self.create_subscription(
            Float32, angular_topic, self._angular_cb, 10)
${stopInit}

        self._timer = self.create_timer(1.0 / frequency, self._timer_cb)

        self.get_logger().info(
            f'Velocity Command node ready'
            f' | linear: {linear_topic}'
            f' | angular: {angular_topic}'
            f' | cmd_vel: {cmd_vel_topic}'${stopLog}
        )

    def _linear_cb(self, msg):
        self._linear_x = float(msg.data)

    def _angular_cb(self, msg):
        self._angular_z = float(msg.data)
${stopCb}
    def _timer_cb(self):
${stopGate}        twist = Twist()
        twist.linear.x  = self._linear_x
        twist.angular.z = self._angular_z
        self._pub.publish(twist)


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
