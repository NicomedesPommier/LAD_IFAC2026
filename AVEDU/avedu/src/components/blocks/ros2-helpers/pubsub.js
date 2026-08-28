// ROS2 publisher/subscriber + keyboard teleop code generators.

import { pascalCase, enforceWorkspace } from "./utils";
import { generateQCarTeleopCode } from "./qcar";

// Event-driven keyboard teleop (curses, no timer). Routed via generatePublisherCode
// when the publisher has a connected keyboardInput node.
export function generateKeyboardTeleopCode(publisherData, keyboardData) {
  const {
    topicName = "/cmd_vel",
    queueSize = "10",
  } = publisherData || {};

  const {
    nodeName = "teleop_keyboard",
    linearSpeed = 0.5,
    angularSpeed = 0.5,
    keyMap = "wasd",
  } = keyboardData || {};

  const isQCarMode = publisherData?.isQCarMode || keyboardData?.isQCarMode || false;

  // QCar mode hijacks the publisher and emits MotorCommands teleop instead of Twist.
  if (isQCarMode) {
    return generateQCarTeleopCode({
      nodeName: nodeName || 'qcar_teleop',
      throttleMax: linearSpeed,
      steeringMax: angularSpeed,
    });
  }

  const className = pascalCase(nodeName);
  const displayTopic = topicName;
  const canvasId = publisherData?.canvasId || keyboardData?.canvasId;
  const internalTopic = enforceWorkspace(displayTopic, { canvasId, isQCarMode });

  const isWasd = keyMap === "wasd";

  return `#!/usr/bin/env python3
# =============================================================================
# 🧩 This file was generated from visual blocks!
# You can edit it as text, but re-opening it will show the block editor.
# =============================================================================
#
# Keyboard Teleop  →  ${topicName}
# Key map : ${keyMap.toUpperCase()}
# Linear  : ${linearSpeed} m/s   |   Steer : ${angularSpeed} rad/s
#
# Ackermann steering: A/D set the steering direction but the car only turns
# while it is moving (W/S).  Pressing A or D alone turns the wheels visually
# but does NOT spin the car in place.
# =============================================================================

import curses
import time
import rclpy
from rclpy.node import Node
from geometry_msgs.msg import Twist

LINEAR_SPEED  = ${linearSpeed}   # m/s  — top drive speed
ANGULAR_SPEED = ${angularSpeed}  # rad/s — max yaw rate while driving
PUBLISH_HZ    = 20               # how often to send cmd_vel (Hz)
WHEELBASE     = 0.265            # metres — matches QCar geometry


class ${className}(Node):
    def __init__(self):
        super().__init__('${nodeName}')

        self.declare_parameter('topic_name', '${internalTopic}')
        self.declare_parameter('linear_speed', ${linearSpeed})
        self.declare_parameter('angular_speed', ${angularSpeed})
        self.declare_parameter('queue_size', ${queueSize})

        topic          = self.get_parameter('topic_name').value
        self.lin_speed = self.get_parameter('linear_speed').value
        self.ang_speed = self.get_parameter('angular_speed').value
        q_size         = self.get_parameter('queue_size').value

        self.publisher_ = self.create_publisher(Twist, topic, q_size)
        self.get_logger().info(
            'Teleop keyboard ready on ${displayTopic}\\n'
            '  ${isWasd ? "W/S" : "↑/↓"} = forward/backward\\n'
            '  ${isWasd ? "A/D" : "←/→"} = steer left/right (only while moving)\\n'
            '  SPACE = stop\\n'
            '  q     = quit'
        )

    def publish_twist(self, linear_x, angular_z):
        msg = Twist()
        msg.linear.x  = float(linear_x)
        msg.angular.z = float(angular_z)
        self.publisher_.publish(msg)

    def run(self, stdscr):
        curses.cbreak()
        stdscr.keypad(True)
        stdscr.nodelay(True)   # non-blocking — lets us publish at a fixed rate
        stdscr.addstr(0, 0, 'Teleop — press q to quit')

        linear  = 0.0
        steer   = 0.0

        period = 1.0 / PUBLISH_HZ

        while rclpy.ok():
            key = stdscr.getch()

            if key == ord('q'):
                break
            elif key == ${isWasd ? "ord('w')" : "curses.KEY_UP"}:
                linear =  self.lin_speed
            elif key == ${isWasd ? "ord('s')" : "curses.KEY_DOWN"}:
                linear = -self.lin_speed
            elif key == ${isWasd ? "ord('a')" : "curses.KEY_LEFT"}:
                steer  =  1.0
            elif key == ${isWasd ? "ord('d')" : "curses.KEY_RIGHT"}:
                steer  = -1.0
            elif key == ord(' '):
                linear = 0.0
                steer  = 0.0

            # Ackermann model: angular rate is only non-zero when the car is moving.
            angular_z = (linear * steer * self.ang_speed / self.lin_speed) if linear != 0.0 else 0.0

            self.publish_twist(linear, angular_z)
            time.sleep(period)

        self.publish_twist(0.0, 0.0)


def main(args=None):
    rclpy.init(args=args)
    node = ${className}()
    try:
        curses.wrapper(node.run)
    except KeyboardInterrupt:
        pass
    finally:
        node.destroy_node()
        rclpy.shutdown()


if __name__ == '__main__':
    main()`;
}

export function generatePublisherCode(publisherData, inputNode = null) {
  if (!publisherData) return "";

  // Keyboard teleop path — event-driven, no timer
  if (inputNode?.data?.inputType === "keyboard") {
    return generateKeyboardTeleopCode(publisherData, inputNode.data);
  }

  const {
    publisherName = "publisher_node",
    topicName = "/chatter",
    msgPackage = "std_msgs",
    msgType = "String",
    frequency = "1.0",
    dataInput = "",
    queueSize = "10",
  } = publisherData;

  const canvasId = publisherData?.canvasId || inputNode?.data?.canvasId;
  const isQCarMode = publisherData?.isQCarMode || inputNode?.data?.isQCarMode || false;
  const internalTopic = enforceWorkspace(topicName, { canvasId, isQCarMode });

  const importLine = `from ${msgPackage}.msg import ${msgType}`;

  let msgPreparation = "";
  if (msgType === "String") {
    msgPreparation = `msg = ${msgType}()\n        msg.data = ${dataInput ? `'${dataInput}'` : "'Hello World'"}`;
  } else if (msgType.match(/^(Int32|Int64|UInt8|UInt16|Float32|Float64)$/)) {
    msgPreparation = `msg = ${msgType}()\n        msg.data = ${dataInput || "0"}`;
  } else if (msgType === "Bool") {
    msgPreparation = `msg = ${msgType}()\n        msg.data = ${dataInput || "True"}`;
  } else if (msgType === "Point" || msgType === "Vector3") {
    msgPreparation = `msg = ${msgType}()\n        # TODO: Set x, y, z values\n        msg.x = 0.0\n        msg.y = 0.0\n        msg.z = 0.0`;
  } else if (msgType === "Twist") {
    msgPreparation = `msg = ${msgType}()\n        # TODO: Set linear and angular velocities\n        msg.linear.x = 0.0\n        msg.angular.z = 0.0`;
  } else {
    msgPreparation = `msg = ${msgType}()\n        # TODO: Configure message fields`;
  }

  const className = pascalCase(publisherName);

  return `#!/usr/bin/env python3
# =============================================================================
# 🧩 This file was generated from visual blocks!
# You can edit it as text, but re-opening it will show the block editor.
# =============================================================================

import rclpy
from rclpy.node import Node
${importLine}

class ${className}(Node):
    def __init__(self):
        super().__init__('${publisherName}')

        self.declare_parameter('topic_name', '${internalTopic}')
        self.declare_parameter('queue_size', ${queueSize})
        self.declare_parameter('publish_frequency', ${parseFloat(frequency || 1.0).toFixed(2)})

        topic     = self.get_parameter('topic_name').value
        q_size    = self.get_parameter('queue_size').value
        frequency = self.get_parameter('publish_frequency').value

        self.publisher_ = self.create_publisher(${msgType}, topic, q_size)
        self.timer = self.create_timer(1.0 / frequency, self.timer_callback)
        self.get_logger().info(f'Publisher started on {topic}')

    def timer_callback(self):
        ${msgPreparation}
        self.publisher_.publish(msg)
        self.get_logger().info(f'Publishing: {msg.data}')

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
    main()`;
}

export function generateSubscriberCode(subscriberData) {
  if (!subscriberData) return "";

  const {
    subscriberName = "subscriber_node",
    topicName = "/chatter",
    msgPackage = "std_msgs",
    msgType = "String",
    queueSize = "10",
  } = subscriberData;

  const className = pascalCase(subscriberName);
  const displayTopic = topicName;
  const canvasId = subscriberData?.canvasId;
  const isQCarMode = subscriberData?.isQCarMode || false;
  const internalTopic = enforceWorkspace(displayTopic, { canvasId, isQCarMode });

  const importLine = `from ${msgPackage}.msg import ${msgType}`;

  let msgProcessing = "";
  if (msgType === "String") {
    msgProcessing = `self.get_logger().info(f'Received: "{msg.data}"')`;
  } else if (msgType.match(/^(Int32|Int64|UInt8|UInt16|Float32|Float64)$/)) {
    msgProcessing = `self.get_logger().info(f'Received: {msg.data}')`;
  } else if (msgType === "Bool") {
    msgProcessing = `self.get_logger().info(f'Received: {msg.data}')`;
  } else if (msgType === "Point" || msgType === "Vector3") {
    msgProcessing = `self.get_logger().info(f'Received Point - x: {msg.x}, y: {msg.y}, z: {msg.z}')`;
  } else if (msgType === "Twist") {
    msgProcessing = `self.get_logger().info(f'Linear: ({msg.linear.x}, {msg.linear.y}, {msg.linear.z}), Angular: ({msg.angular.x}, {msg.angular.y}, {msg.angular.z})')`;
  } else {
    msgProcessing = `self.get_logger().info(f'Received message on ${displayTopic}')`;
  }

  return `#!/usr/bin/env python3
# =============================================================================
# 🧩 This file was generated from visual blocks!
# You can edit it as text, but re-opening it will show the block editor.
# =============================================================================

import rclpy
from rclpy.node import Node
${importLine}


class ${className}(Node):
    def __init__(self):
        super().__init__('${subscriberName}')

        self.declare_parameter('topic_name', '${internalTopic}')
        self.declare_parameter('queue_size', ${queueSize})

        topic  = self.get_parameter('topic_name').value
        q_size = self.get_parameter('queue_size').value

        self.subscription = self.create_subscription(
            ${msgType},
            topic,
            self.listener_callback,
            q_size
        )
        self.subscription  # prevent unused variable warning

        self.get_logger().info(f'Subscriber started on {topic}')

    def listener_callback(self, msg):
        ${msgProcessing}


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
    main()`;
}
