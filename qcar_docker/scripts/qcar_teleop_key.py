#!/usr/bin/env python3
"""
qcar_teleop_key.py — Keyboard teleoperation for the QCar browser simulator.

Publishes geometry_msgs/Twist to /cmd_vel.
The browser simulation listens via rosbridge (port 9090) and drives the QCar.

Controls
--------
  W / Arrow Up    : forward
  S / Arrow Down  : backward
  A / Arrow Left  : turn left
  D / Arrow Right : turn right
  Space           : full stop
  Q / Ctrl+C      : quit

How to run (from the ROS Docker container)
------------------------------------------
  # Option A — from the app terminal (already in the container):
  source /opt/ros/humble/setup.bash
  python3 /workspaces/<username>/<canvas_id>/qcar_teleop_key.py

  # Option B — exec into the container from your host:
  docker exec -it qcar_docker-ros-1 bash
  source /opt/ros/humble/setup.bash
  python3 /workspaces/<username>/<canvas_id>/qcar_teleop_key.py

Speed tuning
------------
  Adjust LINEAR_SPEED and ANGULAR_SPEED below to match what feels right in the sim.
"""

import sys
import tty
import termios
import threading

import rclpy
from rclpy.node import Node
from geometry_msgs.msg import Twist


# ── Speed parameters ───────────────────────────────────────────────────────────
LINEAR_SPEED  = 0.5   # m/s   — forward / backward
ANGULAR_SPEED = 1.0   # rad/s — left / right turn rate


# ── Key → (linear.x, angular.z) mapping ───────────────────────────────────────
KEYMAP = {
    'w': ( LINEAR_SPEED,  0.0),
    's': (-LINEAR_SPEED,  0.0),
    'a': ( 0.0,  ANGULAR_SPEED),
    'd': ( 0.0, -ANGULAR_SPEED),
    ' ': ( 0.0,  0.0),           # spacebar = full stop
}

# ANSI escape sequences for arrow keys
ARROW_MAP = {
    '\x1b[A': ( LINEAR_SPEED,  0.0),   # Up
    '\x1b[B': (-LINEAR_SPEED,  0.0),   # Down
    '\x1b[D': ( 0.0,  ANGULAR_SPEED),  # Left
    '\x1b[C': ( 0.0, -ANGULAR_SPEED),  # Right
}

HELP = """
╔══════════════════════════════════════╗
║       QCar Keyboard Teleop           ║
╠══════════════════════════════════════╣
║  W / ↑   forward                    ║
║  S / ↓   backward                   ║
║  A / ←   turn left                  ║
║  D / →   turn right                 ║
║  Space   stop                       ║
║  Q       quit                       ║
╚══════════════════════════════════════╝
Topic: /cmd_vel  (geometry_msgs/Twist)
"""


# ── ROS 2 node ─────────────────────────────────────────────────────────────────

class TeleopKeyNode(Node):
    def __init__(self):
        super().__init__('qcar_teleop_key')
        self.pub = self.create_publisher(Twist, 'cmd_vel', 10)
        self.get_logger().info(f'TeleopKeyNode ready — publishing on {self.get_namespace()}/cmd_vel')

    def publish_vel(self, lin_x: float, ang_z: float):
        msg = Twist()
        msg.linear.x  = float(lin_x)
        msg.angular.z = float(ang_z)
        self.pub.publish(msg)

    def stop(self):
        self.publish_vel(0.0, 0.0)


# ── Keyboard reader ────────────────────────────────────────────────────────────

def read_key(saved_settings) -> str:
    """
    Read one keypress from stdin (raw mode).
    Arrow keys produce 3-byte sequences (\x1b[A etc.).
    Returns the full sequence as a string.
    """
    tty.setraw(sys.stdin.fileno())
    try:
        ch = sys.stdin.read(1)
        if ch == '\x1b':
            # Peek for the rest of the escape sequence ([ + letter)
            rest = sys.stdin.read(2)
            return ch + rest
        return ch
    finally:
        termios.tcsetattr(sys.stdin, termios.TCSADRAIN, saved_settings)


# ── Main ───────────────────────────────────────────────────────────────────────

def main():
    # ── TTY guard ──────────────────────────────────────────────────────────────
    # termios requires a real terminal (TTY).  The app terminal runs
    # `docker exec -i` (piped stdin) which is NOT a TTY, so tcgetattr fails.
    # You must run this from a real interactive session:
    #
    #   docker exec -it qcar_docker-ros-1 bash
    #   source /opt/ros/humble/setup.bash
    #   source /ros2_ws/install/setup.bash
    #   ros2 run nico TeleopKeyNode
    # ──────────────────────────────────────────────────────────────────────────
    if not sys.stdin.isatty():
        print('\n[qcar_teleop_key] ERROR: stdin is not a TTY.')
        print('This script needs raw keyboard input, which requires a real terminal.')
        print('')
        print('Run it like this instead:')
        print('  1. Open a host terminal')
        print('  2. docker exec -it qcar_docker-ros-1 bash')
        print('  3. source /opt/ros/humble/setup.bash && source /ros2_ws/install/setup.bash')
        print('  4. ros2 run nico TeleopKeyNode')
        sys.exit(1)

    rclpy.init()
    node = TeleopKeyNode()

    # Spin ROS in a background thread so the main thread owns the terminal
    spin_thread = threading.Thread(target=rclpy.spin, args=(node,), daemon=True)
    spin_thread.start()

    saved = termios.tcgetattr(sys.stdin)
    print(HELP)
    print('Waiting for keypresses...\n')

    try:
        while rclpy.ok():
            key = read_key(saved)
            lower = key.lower()

            if lower == 'q' or key == '\x03':       # Q or Ctrl+C
                print('\nQuitting...')
                break

            elif lower in KEYMAP:
                lin, ang = KEYMAP[lower]
                node.publish_vel(lin, ang)
                label = 'STOP' if lin == 0.0 and ang == 0.0 else \
                        f'lin={lin:+.2f} m/s   ang={ang:+.2f} rad/s'
                print(f'\r  {label:<40}', end='', flush=True)

            elif key in ARROW_MAP:
                lin, ang = ARROW_MAP[key]
                node.publish_vel(lin, ang)
                print(f'\r  lin={lin:+.2f} m/s   ang={ang:+.2f} rad/s   ', end='', flush=True)

    except Exception as e:
        print(f'\nError: {e}')

    finally:
        node.stop()
        termios.tcsetattr(sys.stdin, termios.TCSADRAIN, saved)
        print('\nVelocity zeroed. Bye!')
        node.destroy_node()
        rclpy.shutdown()


if __name__ == '__main__':
    main()
