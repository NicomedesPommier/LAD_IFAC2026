// =============================================================================
// pure_pursuit.js
// Generator for the `purePursuit` RosFlow node (one ROS 2 code → one file).
//
// A closed-loop path follower in the spirit of Quanser's vehicle_control.py:
// it reads the car's pose (nav_msgs/Odometry) and a route (nav_msgs/Path), and
// steers toward a lookahead point on the path — publishing geometry_msgs/Twist
// on /cmd_vel. The simulator publishes /odom and /planned_path (from the map's
// waypoints), so this node drives the QCar around the route you drew.
//
// Frame note: the simulator publishes pose + path in a single consistent 2-D
// world frame (x forward at θ=0, θ = yaw about +Z), so plain planar pure-pursuit
// math applies directly. angular.z is published as a YAW RATE (= v·curvature),
// matching the sim's cmd_vel model.
// =============================================================================

import { pascalCase, enforceWorkspace } from "./utils";

export function generatePurePursuitCode(d) {
  if (!d) return "";

  const {
    nodeName     = "pure_pursuit",
    odomTopic    = "/odom",
    pathTopic    = "/planned_path",
    cmdVelTopic  = "/cmd_vel",
    speed        = 0.4,
    lookahead    = 0.6,
    goalTolerance = 0.25,
    maxAngular   = 1.5,
    publishFrequency = 20.0,
    canvasId,
  } = d;

  const isQCarMode = d?.isQCarMode || false;
  const ctx = { canvasId, isQCarMode };
  const nsOdom = enforceWorkspace(odomTopic, ctx);
  const nsPath = enforceWorkspace(pathTopic, ctx);
  const nsCmd  = enforceWorkspace(cmdVelTopic, ctx);

  const className = pascalCase(nodeName);
  const freq = parseFloat(publishFrequency || 20.0).toFixed(1);

  return `#!/usr/bin/env python3
# =============================================================================
# 🧩 This file was generated from visual blocks!
# You can edit it as text, but re-opening it will show the block editor.
# =============================================================================
#
# Pure Pursuit Path Follower
# Pose  ← ${odomTopic}        (nav_msgs/Odometry)
# Path  ← ${pathTopic}  (nav_msgs/Path)
# Drive → ${cmdVelTopic}      (geometry_msgs/Twist)
# Cruise speed ${speed} m/s · lookahead ${lookahead} m · goal tol ${goalTolerance} m
# =============================================================================

import math
import rclpy
from rclpy.node import Node
from nav_msgs.msg import Odometry, Path
from geometry_msgs.msg import Twist


def yaw_from_quat(q):
    # Planar yaw about +Z from a quaternion.
    return math.atan2(2.0 * (q.w * q.z + q.x * q.y),
                      1.0 - 2.0 * (q.y * q.y + q.z * q.z))


class ${className}(Node):
    def __init__(self):
        super().__init__('${nodeName}')

        self.declare_parameter('odom_topic',     '${nsOdom}')
        self.declare_parameter('path_topic',     '${nsPath}')
        self.declare_parameter('cmd_vel_topic',  '${nsCmd}')
        self.declare_parameter('speed',          ${parseFloat(speed).toFixed(3)})
        self.declare_parameter('lookahead',      ${parseFloat(lookahead).toFixed(3)})
        self.declare_parameter('goal_tolerance', ${parseFloat(goalTolerance).toFixed(3)})
        self.declare_parameter('max_angular',    ${parseFloat(maxAngular).toFixed(3)})

        odom_topic    = self.get_parameter('odom_topic').value
        path_topic    = self.get_parameter('path_topic').value
        cmd_vel_topic = self.get_parameter('cmd_vel_topic').value
        self._speed       = self.get_parameter('speed').value
        self._lookahead   = self.get_parameter('lookahead').value
        self._goal_tol    = self.get_parameter('goal_tolerance').value
        self._max_angular = self.get_parameter('max_angular').value

        self._x = 0.0
        self._y = 0.0
        self._theta = 0.0
        self._have_pose = False
        self._waypoints = []   # list of (x, y)
        self._idx = 0          # monotonic progress along the path

        self._pub = self.create_publisher(Twist, cmd_vel_topic, 10)
        self.create_subscription(Odometry, odom_topic, self._odom_cb, 10)
        self.create_subscription(Path, path_topic, self._path_cb, 10)
        self._timer = self.create_timer(1.0 / ${freq}, self._control)

        self.get_logger().info(
            f'Pure pursuit ready — pose: {odom_topic} | path: {path_topic}'
            f' | drive: {cmd_vel_topic}'
        )

    def _odom_cb(self, msg):
        p = msg.pose.pose.position
        self._x = p.x
        self._y = p.y
        self._theta = yaw_from_quat(msg.pose.pose.orientation)
        self._have_pose = True

    def _path_cb(self, msg):
        self._waypoints = [(ps.pose.position.x, ps.pose.position.y) for ps in msg.poses]
        self._idx = 0   # new path → restart progress

    def _control(self):
        if not self._have_pose or len(self._waypoints) < 1:
            self._pub.publish(Twist())   # nothing to follow — hold still
            return

        n = len(self._waypoints)
        # Advance progress monotonically past points we are already within a
        # lookahead of (starting from the current index, not 0). This keeps a
        # LOOPING route (start == end) from declaring the goal reached on spawn.
        while (self._idx < n - 1 and
               math.hypot(self._waypoints[self._idx][0] - self._x,
                          self._waypoints[self._idx][1] - self._y) < self._lookahead):
            self._idx += 1

        target = self._waypoints[self._idx]

        # Goal only once we have actually consumed the whole path.
        if (self._idx >= n - 1 and
                math.hypot(target[0] - self._x, target[1] - self._y) < self._goal_tol):
            self._pub.publish(Twist())   # reached the goal
            return

        dx = target[0] - self._x
        dy = target[1] - self._y

        # Transform target into the vehicle frame (x forward, y left).
        cos_t = math.cos(self._theta)
        sin_t = math.sin(self._theta)
        local_x =  cos_t * dx + sin_t * dy
        local_y = -sin_t * dx + cos_t * dy

        ld = math.hypot(dx, dy)
        if ld < 1e-3:
            self._pub.publish(Twist())
            return

        # Pure-pursuit curvature → yaw rate (angular.z = v · curvature).
        curvature = 2.0 * local_y / (ld * ld)
        angular_z = self._speed * curvature
        angular_z = max(-self._max_angular, min(self._max_angular, angular_z))

        twist = Twist()
        # Slow down if the target is behind us (sharp correction).
        twist.linear.x = self._speed if local_x > 0.0 else self._speed * 0.4
        twist.angular.z = angular_z
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
