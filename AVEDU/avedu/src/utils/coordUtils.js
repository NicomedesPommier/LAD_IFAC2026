/**
 * coordUtils.js — Coordinate frame conversions: ROS (Z-up) ↔ Three.js (Y-up)
 *
 * Frame mapping (Rx(+90°) takes Three.js basis to ROS basis):
 *
 *   Three.js +X  →  ROS +X    (forward, unchanged)
 *   Three.js +Y  →  ROS +Z    (up)
 *   Three.js +Z  →  ROS -Y    (toward-viewer → ROS left = +Y, so toward-viewer = -Y)
 *
 * Position shorthand:
 *   Three.js (x, y, z)  →  ROS  (x, -z, y)
 *   ROS      (x, y, z)  →  Three.js (x,  z, -y)
 *
 * Quaternion shorthand (derived from the Rx(90°) sandwich Q*q*Q⁻¹):
 *   Three.js q=(qx, qy, qz, qw)  →  ROS  q=( qx, -qz,  qy, qw)
 *   ROS      q=(qx, qy, qz, qw)  →  Three.js q=( qx,  qz, -qy, qw)
 *
 * Sanity check — yaw θ:
 *   Three.js: (0, sinθ/2, 0, cosθ/2) [around Y]
 *          →  ROS: (0, 0, sinθ/2, cosθ/2) [around Z]  ✓
 *
 * All functions are pure and allocation-free.
 */

// ── Position ───────────────────────────────────────────────────────────────────

/** Three.js (Y-up) position → ROS (Z-up) position */
export function posThreeToRos(x, y, z) {
  return { x, y: -z, z: y };
}

/** ROS (Z-up) position → Three.js (Y-up) position */
export function posRosToThree(x, y, z) {
  return { x, y: z, z: -y };
}

// ── Quaternion ─────────────────────────────────────────────────────────────────

/**
 * Three.js quaternion (x,y,z,w, Y-up frame) → ROS quaternion (Z-up frame)
 *
 * Closed form of Rx(+90°) * q * Rx(-90°):
 *   x_out =  qx
 *   y_out = -qz
 *   z_out =  qy
 *   w_out =  qw
 */
export function quatThreeToRos(qx, qy, qz, qw) {
  return { x: qx, y: -qz, z: qy, w: qw };
}

/**
 * ROS quaternion (x,y,z,w, Z-up frame) → Three.js quaternion (Y-up frame)
 *
 * Closed form of Rx(-90°) * q * Rx(+90°):
 *   x_out =  qx
 *   y_out =  qz
 *   z_out = -qy
 *   w_out =  qw
 */
export function quatRosToThree(qx, qy, qz, qw) {
  return { x: qx, y: qz, z: -qy, w: qw };
}

// ── Velocity ───────────────────────────────────────────────────────────────────

/**
 * Three.js linear velocity (Y-up) → ROS linear velocity (Z-up)
 * Same component swap as positions.
 */
export function linvelThreeToRos(vx, vy, vz) {
  return { x: vx, y: -vz, z: vy };
}

/**
 * Three.js angular velocity (Y-up) → ROS angular velocity (Z-up)
 *
 * Angular velocity is a pseudo-vector; same frame swap applies.
 * Key result: Three.js angvel.y (CCW from above) = ROS angular.z (CCW from above).
 * Same physical yaw direction → same sign.
 */
export function angvelThreeToRos(wx, wy, wz) {
  return { x: wx, y: -wz, z: wy };
}

// ── /cmd_vel → drive parameters ───────────────────────────────────────────────

/**
 * Convert ROS geometry_msgs/Twist to Three.js drive parameters.
 *
 * @param {{ x, y, z }} linear   – Twist.linear  (m/s)
 * @param {{ x, y, z }} angular  – Twist.angular (rad/s)
 * @returns {{ linX: number, angY: number }}
 *   linX — forward speed m/s (+X forward, same in both frames)
 *   angY — yaw rate rad/s (positive = CCW from above = turn left, same sign)
 */
export function cmdVelToThree(linear, angular) {
  return {
    linX: linear?.x  ?? 0,
    angY: angular?.z ?? 0,
  };
}
