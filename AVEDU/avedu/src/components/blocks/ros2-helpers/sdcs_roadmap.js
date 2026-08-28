// =============================================================================
// sdcs_roadmap.js
// Generator for the `sdcsRoadmap` RosFlow node (one ROS 2 code -> one file).
//
// Drives the QCar around Quanser's Self-Driving Car Studio (SDCS) right-hand
// traffic roadmap, EXACTLY like vehicle_control.py: the student gives a node
// sequence (e.g. 10, 4, 20, 10) and the node generates the real curved path
// through the graph (arc + line segments via SCSPath, shortest path via A*),
// publishes it on /planned_path, and follows it with pure pursuit on /cmd_vel
// using the car's pose from /odom.
//
// The roadmap graph (node poses + edges + turn radii) is embedded verbatim from
// hal/products/mats.py (right-hand traffic), and SCSPath / RoadMap are trimmed
// copies of hal/utilities/path_planning.py — so the path matches the real lab.
//
// Frame: the simulator publishes /odom as (x = sim_x, y = -sim_z, theta = yaw).
// The roadmap is its own metric frame; x_offset/y_offset/yaw_offset (params)
// align the published path onto the sim — defaults centre the roadmap at the
// origin so it sits on the cityscape floor. Tune them live if it looks shifted.
// =============================================================================

import { pascalCase, enforceWorkspace } from "./utils";

// Roadmap centre (mean of the scaled node coords) — subtracted by default so the
// path is centred on the floor image (which is centred at the sim origin).
const ROADMAP_CENTER_X = 0.135;
const ROADMAP_CENTER_Y = 1.706;

export function generateSdcsRoadmapCode(d) {
  if (!d) return "";

  const {
    nodeName     = "sdcs_roadmap",
    nodeSequence = "10, 4, 20, 10",
    odomTopic    = "/odom",
    pathTopic    = "/planned_path",
    cmdVelTopic  = "/cmd_vel",
    speed        = 0.4,
    lookahead    = 0.5,
    goalTolerance = 0.25,
    maxAngular   = 1.5,
    xOffset      = -ROADMAP_CENTER_X,
    yOffset      = -ROADMAP_CENTER_Y,
    yawOffset    = 0.0,
    canvasId,
  } = d;

  const isQCarMode = d?.isQCarMode || false;
  const ctx = { canvasId, isQCarMode };
  const nsOdom = enforceWorkspace(odomTopic, ctx);
  const nsPath = enforceWorkspace(pathTopic, ctx);
  const nsCmd  = enforceWorkspace(cmdVelTopic, ctx);

  const className = pascalCase(nodeName);

  // Sanitize the sequence to a clean python int list literal.
  const seq = String(nodeSequence)
    .split(/[,\s]+/)
    .map((s) => parseInt(s, 10))
    .filter((n) => Number.isInteger(n));
  const seqLiteral = `[${(seq.length ? seq : [10, 4, 20, 10]).join(", ")}]`;

  const num = (v, def) => parseFloat(v != null ? v : def).toFixed(4);

  return `#!/usr/bin/env python3
# =============================================================================
# 🧩 This file was generated from visual blocks!
# You can edit it as text, but re-opening it will show the block editor.
# =============================================================================
#
# SDCS Roadmap Follower (right-hand traffic) — drives a node sequence
# Sequence : ${seqLiteral}   (change it to route differently, e.g. [9, 2, 4, 6])
# Pose  in : ${odomTopic}        (nav_msgs/Odometry)
# Path out : ${pathTopic}  (nav_msgs/Path)
# Drive    : ${cmdVelTopic}      (geometry_msgs/Twist)
# Embeds the real SDCSRoadMap graph + SCSPath + A* from Quanser's mats.py.
# =============================================================================

import math
import heapq
import numpy as np

import rclpy
from rclpy.node import Node
from rclpy.qos import QoSProfile, DurabilityPolicy, ReliabilityPolicy
from nav_msgs.msg import Odometry, Path
from geometry_msgs.msg import PoseStamped, Twist


# ── geometry helpers (from pal.utilities.math) ──────────────────────────────
def wrap_to_pi(th):
    th = th % (2 * math.pi)
    th = (th + 2 * math.pi) % (2 * math.pi)
    if th > math.pi:
        th -= 2 * math.pi
    return th


def wrap_to_2pi(th):
    return ((th % (2 * math.pi)) + 2 * math.pi) % (2 * math.pi)


def signed_angle(v1, v2):
    v1 = np.asarray(v1).reshape(-1)
    v2 = np.asarray(v2).reshape(-1)
    return wrap_to_pi(math.atan2(float(v2[1]), float(v2[0]))
                      - math.atan2(float(v1[1]), float(v1[0])))


# ── SCSPath: straight-curve-straight path between two poses (from path_planning.py) ──
def scs_path(start_pose, end_pose, radius, step=0.01):
    p1 = start_pose[:2, :]
    th1 = start_pose[2, 0]
    p2 = end_pose[:2, :]
    th2 = end_pose[2, 0]

    t1 = np.array([[math.cos(th1)], [math.sin(th1)]])
    t2 = np.array([[math.cos(th2)], [math.sin(th2)]])
    direction = 1 if signed_angle(t1, p2 - p1) > 0 else -1

    n1 = radius * np.array([[-t1[1, 0]], [t1[0, 0]]]) * direction
    n2 = radius * np.array([[-t2[1, 0]], [t2[0, 0]]]) * direction

    tol = 0.01
    if abs(wrap_to_pi(th2 - th1)) < tol:
        v = p2 - p1
        v_uv = v / np.linalg.norm(v)
        if 1 - abs(np.dot(t1.squeeze(), v_uv.squeeze())) < tol:
            c = p2 + n1
        else:
            return None, None
    elif abs(wrap_to_pi(th2 - th1 + math.pi)) < tol:
        v = (p2 + 2 * n2) - p1
        v_uv = v / np.linalg.norm(v)
        if 1 - abs(np.dot(t1.squeeze(), v_uv.squeeze())) < tol:
            s = np.dot(t1.squeeze(), v.squeeze())
            c = p1 + n1 if s < tol else p2 + n2
        else:
            return None, None
    else:
        d1 = p1 + n1
        d2 = p2 + n2
        A = np.hstack((t1, -t2))
        b = d2 - d1
        try:
            alpha, beta = np.linalg.solve(A, b)
        except np.linalg.LinAlgError:
            return None, None
        if alpha >= -tol and beta <= tol:
            c = d1 + alpha * t1
        else:
            return None, None

    b1 = c - n1
    b2 = c - n2

    line1 = np.empty((2, 0))
    line1_length = np.linalg.norm(b1 - p1)
    if line1_length > step:
        ds = step / line1_length
        s = ds
        while s < 1:
            line1 = np.hstack((line1, p1 + s * (b1 - p1)))
            s += ds

    arc = np.empty((2, 0))
    ang_dist = wrap_to_2pi(direction * signed_angle(b1 - c, b2 - c))
    arc_length = abs(ang_dist * radius)
    if arc_length > step:
        start_angle = math.atan2(b1[1, 0] - c[1, 0], b1[0, 0] - c[0, 0])
        dth = (2 * math.pi / (math.pi * 2 * radius)) * step
        s = dth
        while s < ang_dist:
            th = start_angle + s * direction
            arc = np.hstack((arc, c + np.array([[math.cos(th)], [math.sin(th)]]) * radius))
            s += dth

    line2 = np.empty((2, 0))
    line2_length = np.linalg.norm(b2 - p2)
    if line2_length > step:
        ds = step / line2_length
        s = ds
        while s < 1:
            line2 = np.hstack((line2, b2 + s * (p2 - b2)))
            s += ds

    path = np.hstack((line1, arc, line2))
    return path, line1_length + arc_length + line2_length


# ── minimal RoadMap with A* (from path_planning.py) ─────────────────────────
class _RMNode:
    def __init__(self, pose):
        self.pose = np.array(pose, dtype=float).reshape(3, 1)
        self.out_edges = []


class _RMEdge:
    def __init__(self, a, b):
        self.from_node = a
        self.to_node = b
        self.waypoints = None
        self.length = None


class RoadMap:
    def __init__(self):
        self.nodes = []
        self.edges = []

    def add_node(self, pose):
        self.nodes.append(_RMNode(pose))

    def add_edge(self, i, j, radius):
        a, b = self.nodes[i], self.nodes[j]
        e = _RMEdge(a, b)
        pts, length = scs_path(a.pose, b.pose, radius, step=0.01)
        e.waypoints, e.length = pts, length
        self.edges.append(e)
        a.out_edges.append(e)

    def _heuristic(self, n, goal):
        return float(np.linalg.norm(goal.pose[:2, :] - n.pose[:2, :]))

    def find_shortest_path(self, start, goal):
        start_n, goal_n = self.nodes[start], self.nodes[goal]
        if start_n is goal_n:
            return None
        counter = 0
        open_set = [(self._heuristic(start_n, goal_n), counter, start_n)]
        g = {n: float('inf') for n in self.nodes}
        g[start_n] = 0.0
        came = {n: None for n in self.nodes}
        closed = set()
        while open_set:
            current = heapq.heappop(open_set)[2]
            if current is goal_n:
                path = goal_n.pose[:2, :]
                node = goal_n
                while True:
                    node, edge = came[node]
                    path = np.hstack((node.pose[:2, :], edge.waypoints, path))
                    if came[node] is None:
                        break
                return path
            closed.add(current)
            for edge in current.out_edges:
                nb = edge.to_node
                if nb in closed or edge.length is None:
                    continue
                tentative = g[current] + edge.length
                if tentative < g[nb]:
                    came[nb] = (current, edge)
                    g[nb] = tentative
                    counter += 1
                    heapq.heappush(open_set, (tentative + self._heuristic(nb, goal_n), counter, nb))
        return None

    def generate_path(self, sequence):
        path = np.empty((2, 0))
        for i in range(len(sequence) - 1):
            seg = self.find_shortest_path(sequence[i], sequence[i + 1])
            if seg is None:
                return None
            path = np.hstack((path, seg[:, :-1]))
        return path


def build_sdcs_roadmap():
    """SDCS right-hand-traffic roadmap (verbatim from mats.py)."""
    scale, x_off, y_off = 0.002035, 1134, 2363
    pi = math.pi
    hp = pi / 2
    inner = 305.5 * scale
    outer = 438 * scale
    circle = 333 * scale
    oneway = 350 * scale
    kink = 375 * scale

    node_poses = [
        [1134, 2299, -hp], [1266, 2323, hp], [1688, 2896, 0], [1688, 2763, pi],
        [2242, 2323, hp], [2109, 2323, -hp], [1632, 1822, pi], [1741, 1955, 0],
        [766, 1822, pi], [766, 1955, 0], [504, 2589, -42 * pi / 180],
        [1134, 1300, -hp], [1134, 1454, -hp], [1266, 1454, hp], [2242, 905, hp],
        [2109, 1454, -hp], [1580, 540, -80.6 * pi / 180], [1854.4, 814.5, -9.4 * pi / 180],
        [1440, 856, -138 * pi / 180], [1523, 958, 42 * pi / 180], [1134, 153, pi],
        [1134, 286, 0], [159, 905, -hp], [291, 905, hp],
    ]
    edges = [
        [0, 2, outer], [1, 7, inner], [1, 8, outer], [2, 4, outer], [3, 1, inner],
        [4, 6, outer], [5, 3, inner], [6, 0, outer], [6, 8, 0], [7, 5, inner],
        [8, 10, oneway], [9, 0, inner], [9, 7, 0], [10, 1, inner], [10, 2, inner],
        [1, 13, 0], [4, 14, 0], [6, 13, inner], [7, 14, outer], [8, 23, inner],
        [9, 13, outer], [11, 12, 0], [12, 0, 0], [12, 7, outer], [12, 8, inner],
        [13, 19, inner], [14, 16, circle], [14, 20, circle], [15, 5, outer],
        [15, 6, inner], [16, 17, circle], [16, 18, inner], [17, 15, inner],
        [17, 16, circle], [17, 20, circle], [18, 11, kink], [19, 17, inner],
        [20, 22, outer], [21, 16, inner], [22, 9, outer], [22, 10, outer], [23, 21, inner],
    ]
    rm = RoadMap()
    for px, py, th in node_poses:
        rm.add_node([scale * (px - x_off), scale * (y_off - py), th])
    for cfg in edges:
        rm.add_edge(*cfg)
    return rm


def yaw_from_quat(q):
    return math.atan2(2.0 * (q.w * q.z + q.x * q.y),
                      1.0 - 2.0 * (q.y * q.y + q.z * q.z))


class ${className}(Node):
    def __init__(self):
        super().__init__('${nodeName}')

        self.declare_parameter('node_sequence', ${seqLiteral})
        self.declare_parameter('odom_topic',     '${nsOdom}')
        self.declare_parameter('path_topic',     '${nsPath}')
        self.declare_parameter('cmd_vel_topic',  '${nsCmd}')
        self.declare_parameter('speed',          ${num(speed, 0.4)})
        self.declare_parameter('lookahead',      ${num(lookahead, 0.5)})
        self.declare_parameter('goal_tolerance', ${num(goalTolerance, 0.25)})
        self.declare_parameter('max_angular',    ${num(maxAngular, 1.5)})
        self.declare_parameter('x_offset',       ${num(xOffset, -ROADMAP_CENTER_X)})
        self.declare_parameter('y_offset',       ${num(yOffset, -ROADMAP_CENTER_Y)})
        self.declare_parameter('yaw_offset',     ${num(yawOffset, 0.0)})

        seq = list(self.get_parameter('node_sequence').value)
        self._speed       = self.get_parameter('speed').value
        self._lookahead   = self.get_parameter('lookahead').value
        self._goal_tol    = self.get_parameter('goal_tolerance').value
        self._max_angular = self.get_parameter('max_angular').value
        xo = self.get_parameter('x_offset').value
        yo = self.get_parameter('y_offset').value
        ya = self.get_parameter('yaw_offset').value

        # Build the roadmap and the path through the requested node sequence.
        roadmap = build_sdcs_roadmap()
        raw = roadmap.generate_path(seq)
        self._waypoints = []
        if raw is None or raw.shape[1] == 0:
            self.get_logger().error(f'No path through node sequence {seq}!')
        else:
            cos_a, sin_a = math.cos(ya), math.sin(ya)
            for i in range(raw.shape[1]):
                rx, ry = float(raw[0, i]), float(raw[1, i])
                # rotate (yaw_offset) then translate (x/y offset) into the sim frame
                self._waypoints.append((
                    cos_a * rx - sin_a * ry + xo,
                    sin_a * rx + cos_a * ry + yo,
                ))
            self.get_logger().info(f'SDCS path: {len(self._waypoints)} points through {seq}')

        self._x = self._y = self._theta = 0.0
        self._have_pose = False
        self._idx = 0   # monotonic progress along the path

        # Latched QoS for the path: rosbridge (and the sim path visualizer)
        # subscribe with TRANSIENT_LOCAL durability, so a VOLATILE publisher gets
        # "incompatible QoS / no messages sent". Match it here.
        path_qos = QoSProfile(depth=1)
        path_qos.durability = DurabilityPolicy.TRANSIENT_LOCAL
        path_qos.reliability = ReliabilityPolicy.RELIABLE

        self._cmd_pub  = self.create_publisher(Twist, self.get_parameter('cmd_vel_topic').value, 10)
        self._path_pub = self.create_publisher(Path, self.get_parameter('path_topic').value, path_qos)
        self.create_subscription(Odometry, self.get_parameter('odom_topic').value, self._odom_cb, 10)
        self.create_timer(0.05, self._control)       # 20 Hz pure pursuit
        self.create_timer(1.0, self._publish_path)   # 1 Hz path broadcast

    def _odom_cb(self, msg):
        p = msg.pose.pose.position
        self._x, self._y = p.x, p.y
        self._theta = yaw_from_quat(msg.pose.pose.orientation)
        self._have_pose = True

    def _publish_path(self):
        path = Path()
        path.header.frame_id = 'map'
        path.header.stamp = self.get_clock().now().to_msg()
        for (wx, wy) in self._waypoints:
            ps = PoseStamped()
            ps.header.frame_id = 'map'
            ps.pose.position.x = float(wx)
            ps.pose.position.y = float(wy)
            ps.pose.orientation.w = 1.0
            path.poses.append(ps)
        self._path_pub.publish(path)

    def _control(self):
        if not self._have_pose or len(self._waypoints) < 1:
            self._cmd_pub.publish(Twist())
            return

        n = len(self._waypoints)
        # Advance progress monotonically past points we're already within a
        # lookahead of. Starting from the current index (not 0) means a LOOPING
        # route (start == end) does not think it is already at the goal on spawn.
        while (self._idx < n - 1 and
               math.hypot(self._waypoints[self._idx][0] - self._x,
                          self._waypoints[self._idx][1] - self._y) < self._lookahead):
            self._idx += 1

        target = self._waypoints[self._idx]

        # Goal only once we have actually consumed the whole path.
        if (self._idx >= n - 1 and
                math.hypot(target[0] - self._x, target[1] - self._y) < self._goal_tol):
            self._cmd_pub.publish(Twist())   # reached the final node
            return

        dx = target[0] - self._x
        dy = target[1] - self._y
        cos_t, sin_t = math.cos(self._theta), math.sin(self._theta)
        local_x =  cos_t * dx + sin_t * dy
        local_y = -sin_t * dx + cos_t * dy
        ld = math.hypot(dx, dy)
        if ld < 1e-3:
            self._cmd_pub.publish(Twist())
            return

        angular_z = self._speed * (2.0 * local_y / (ld * ld))   # v * curvature
        angular_z = max(-self._max_angular, min(self._max_angular, angular_z))

        twist = Twist()
        twist.linear.x = self._speed if local_x > 0.0 else self._speed * 0.4
        twist.angular.z = angular_z
        self._cmd_pub.publish(twist)


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
