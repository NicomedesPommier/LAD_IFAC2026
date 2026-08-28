/**
 * useLidarSim.js
 *
 * Simulates a 2-D planar LiDAR by casting NUM_RAYS horizontal Rapier rays
 * from the vehicle's LiDAR mount point, then publishes sensor_msgs/LaserScan
 * to /scan at ~10 Hz.
 *
 * Design notes:
 *   • Rays are pre-computed in the sensor's local frame and rotated into world
 *     frame each publish using the chassis quaternion.  No trigonometry per ray.
 *   • Uses useRapier() — must be called inside a component under <Physics>.
 *   • The ROS connection is read from RosBridgeContext (provided outside Canvas).
 *   • onScan(ranges) callback lets the scene draw a mini-map without ROS.
 *
 * LiDAR specs (simulating Hokuyo UTM-30LX used on QCar):
 *   270° field of view, 1° resolution → 270 rays
 *   Range: 0.1 – 12 m
 *   Mounted at 0.18 m above chassis RigidBody origin
 *
 * Coordinate convention:
 *   Rays are cast in the XZ plane (horizontal) in Three.js world space.
 *   angle_min = 0  corresponds to car's +X (forward) direction.
 *   Angles increase CCW (standard LaserScan convention viewed from above).
 */

import { useEffect, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { useRapier } from '@react-three/rapier';
import ROSLIB from 'roslib';
import * as THREE from 'three';
import { useRos } from './useRosBridge';

// ── LiDAR parameters ────────────────────────────────────────────────────────────
const NUM_RAYS       = 270;                           // rays (1° per step, 270° FOV)
const ANGLE_MIN      = -Math.PI * 135 / 180;          // –135°
const ANGLE_MAX      =  Math.PI * 135 / 180;          // +135°
const ANGLE_INC      = (ANGLE_MAX - ANGLE_MIN) / (NUM_RAYS - 1);
const RANGE_MIN      = 0.1;
const RANGE_MAX      = 12.0;
const LIDAR_Z_OFFSET = 0.18;   // metres above RigidBody origin
const PUBLISH_HZ     = 10;

// Pre-compute ray directions in the sensor local frame (Y-up, horizontal plane).
// Ray 0 = ANGLE_MIN (left-ish), last ray = ANGLE_MAX (right-ish).
// In Three.js, heading +X is "forward"; rotating CCW from above adds to angle.
// Note: THREE.Euler rotation around -Y gives CCW from top-down view.
const LOCAL_DIRS = (() => {
  const dirs = new Array(NUM_RAYS);
  for (let i = 0; i < NUM_RAYS; i++) {
    const a = ANGLE_MIN + i * ANGLE_INC;
    // Rotate +X (forward) by angle a around +Y (up) — CCW from above
    dirs[i] = new THREE.Vector3(Math.cos(a), 0, -Math.sin(a));
  }
  return dirs;
})();

// ── Hook ────────────────────────────────────────────────────────────────────────

/**
 * @param {React.MutableRefObject} carRef  — Rapier RigidBody ref
 * @param {function} [onScan]             — optional callback(ranges: number[])
 */
export function useLidarSim(carRef, onScan, namespace = '') {
  const { rapier, world } = useRapier();
  const { ros, connected } = useRos();
  const TOPIC = namespace ? `${namespace}/scan` : '/scan';

  const topicRef   = useRef(null);
  const frameCount = useRef(0);
  const frameSkip  = useRef(Math.round(60 / PUBLISH_HZ));

  // Reusable objects — allocated once, reused every scan (no GC pressure)
  const _quat   = useRef(new THREE.Quaternion());
  const _origin = useRef(new THREE.Vector3());
  const _dir    = useRef(new THREE.Vector3());

  useEffect(() => {
    if (!connected || !ros.current) return;

    const topic = new ROSLIB.Topic({
      ros:         ros.current,
      name:        TOPIC,
      messageType: 'sensor_msgs/LaserScan',
      queue_size:  1,
      latch:       false,
    });
    topic.advertise();
    topicRef.current = topic;

    return () => {
      try { topic.unadvertise(); } catch {}
      topicRef.current = null;
    };
  }, [connected, ros, TOPIC]);

  useFrame(() => {
    if (!carRef?.current) return;
    frameCount.current++;
    if (frameCount.current % frameSkip.current !== 0) return;

    // ── Sensor pose ────────────────────────────────────────────────────────
    const trans = carRef.current.translation();
    const rot   = carRef.current.rotation();

    _quat.current.set(rot.x, rot.y, rot.z, rot.w);
    _origin.current.set(trans.x, trans.y + LIDAR_Z_OFFSET, trans.z);

    // ── Raycasting ─────────────────────────────────────────────────────────
    const ranges = new Array(NUM_RAYS);

    for (let i = 0; i < NUM_RAYS; i++) {
      // Rotate pre-computed local direction into world frame
      _dir.current.copy(LOCAL_DIRS[i]).applyQuaternion(_quat.current);

      const ray = new rapier.Ray(
        { x: _origin.current.x, y: _origin.current.y, z: _origin.current.z },
        { x: _dir.current.x,    y: _dir.current.y,    z: _dir.current.z    }
      );

      // solid=false: starting point is NOT inside any shape (exterior ray)
      const hit = world.castRay(ray, RANGE_MAX, false);
      ranges[i] = hit
        ? Math.max(RANGE_MIN, Math.min(hit.timeOfImpact, RANGE_MAX))
        : RANGE_MAX;
    }

    // ── Publish LaserScan ──────────────────────────────────────────────────
    if (topicRef.current) {
      const nowMs   = performance.now();
      const sec     = Math.floor(nowMs / 1000);
      const nanosec = Math.round((nowMs % 1000) * 1e6);

      topicRef.current.publish(new ROSLIB.Message({
        header: {
          stamp:    { sec, nanosec },
          frame_id: 'lidar_link',
        },
        angle_min:       ANGLE_MIN,
        angle_max:       ANGLE_MAX,
        angle_increment: ANGLE_INC,
        time_increment:  0.0,
        scan_time:       1 / PUBLISH_HZ,
        range_min:       RANGE_MIN,
        range_max:       RANGE_MAX,
        ranges,
        intensities:     new Array(NUM_RAYS).fill(100),
      }));
    }

    onScan?.(ranges);
  });
}
