// QCar2-specific code generators.

import { pascalCase } from "./utils";

export function generateQCarTeleopCode(d) {
  if (!d) return "";

  const {
    nodeName    = "qcar_teleop",
    throttleMax = 0.3,
    steeringMax = 0.4,
  } = d;

  const className = pascalCase(nodeName);

  return `#!/usr/bin/env python3
# =============================================================================
# 🧩 This file was generated from visual blocks!
# You can edit it as text, but re-opening it will show the block editor.
# =============================================================================
#
# QCar2 Keyboard Teleop  →  /qcar2_motor_speed_cmd
# W/S  = forward / backward  (motor_throttle, max ${throttleMax} m/s)
# A/D  = steer left / right  (steering_angle, max ${steeringMax} rad)
# SPACE = stop
# q     = quit
# =============================================================================

import curses
import time
import rclpy
from rclpy.node import Node
from qcar2_interfaces.msg import MotorCommands

THROTTLE_MAX = ${throttleMax}   # m/s
STEERING_MAX = ${steeringMax}   # radians
PUBLISH_HZ   = 20


class ${className}(Node):
    def __init__(self):
        super().__init__('${nodeName}')
        self.pub = self.create_publisher(MotorCommands, '/qcar2_motor_speed_cmd', 10)
        self.get_logger().info(
            'QCar2 teleop ready\\n'
            '  W/S  = forward/backward\\n'
            '  A/D  = steer left/right\\n'
            '  SPACE = stop\\n'
            '  q     = quit'
        )

    def send(self, throttle: float, steering: float):
        msg = MotorCommands()
        msg.motor_names = ['motor_throttle', 'steering_angle']
        msg.values      = [float(throttle), float(steering)]
        self.pub.publish(msg)

    def run(self, stdscr):
        curses.cbreak()
        stdscr.keypad(True)
        stdscr.nodelay(True)
        stdscr.clear()
        stdscr.addstr(0, 0, 'QCar2 Teleop  |  W/S=drive  A/D=steer  SPACE=stop  q=quit')

        throttle = 0.0
        steering = 0.0
        period   = 1.0 / PUBLISH_HZ

        while rclpy.ok():
            key = stdscr.getch()

            if   key == ord('q'):                  break
            elif key == ord('w'):  throttle =  THROTTLE_MAX
            elif key == ord('s'):  throttle = -THROTTLE_MAX
            elif key == ord('a'):  steering =  STEERING_MAX
            elif key == ord('d'):  steering = -STEERING_MAX
            elif key == ord(' '):  throttle = 0.0; steering = 0.0

            self.send(throttle, steering)

            stdscr.addstr(2, 0, f'throttle: {throttle:+.2f} m/s   steering: {steering:+.3f} rad   ')
            stdscr.refresh()
            time.sleep(period)

        self.send(0.0, 0.0)


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
    main()
`;
}
