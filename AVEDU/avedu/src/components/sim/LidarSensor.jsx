// src/components/sim/LidarSensor.jsx
//
// Simulated 2-D LiDAR using Rapier ray-casts.
//
// • Casts NUM_RAYS horizontal rays every PUBLISH_EVERY frames (~10 Hz @ 60 fps).
// • Rays originate at the car's RigidBody origin + LIDAR_HEIGHT_OFFSET (Y-up).
// • Ray directions rotate with the car's current yaw.
// • Publishes sensor_msgs/LaserScan to /scan via rosbridge.
// • Calls onScan(ranges, angles) so the debug panel can draw a mini-map.
//
// Must be placed inside <Physics> so useRapier() works.

import { useEffect, useRef, useContext } from 'react';
import { useFrame } from '@react-three/fiber';
import { useRapier } from '@react-three/rapier';
import * as THREE from 'three';
import { ROSContext } from './ROSContext';

// ── Constants ───────────────────────────────────────────────────────────────

const NUM_RAYS           = 72;                        // 360° / 5° per ray
const ANGLE_INCREMENT    = (2 * Math.PI) / NUM_RAYS;
const LIDAR_HEIGHT_OFFSET = 0.18;                     // m above RigidBody origin
const MAX_RANGE          = 12.0;                      // metres
const PUBLISH_EVERY      = 6;                         // frames  ≈ 10 Hz @ 60 fps

// Pre-built local-frame ray directions (Z-up → Y-up already handled by convention:
// horizontal rays have Y=0, X/Z cover the horizontal plane).
const LOCAL_DIRS = Array.from({ length: NUM_RAYS }, (_, i) => {
  const a = i * ANGLE_INCREMENT;
  return new THREE.Vector3(Math.cos(a), 0, Math.sin(a));
});

// ── Component ───────────────────────────────────────────────────────────────

export default function LidarSensor({ carRef, onScan, namespace = '' }) {
  const { rapier, world } = useRapier();
  const { advertise, connected } = useContext(ROSContext);
  const scanTopic = namespace ? `${namespace}/scan` : '/scan';

  const topicRef   = useRef(null);
  const frameCount = useRef(0);
  const lastPubTs  = useRef(0);
  const _quat      = useRef(new THREE.Quaternion());
  const _worldDir  = useRef(new THREE.Vector3());
  const _origin    = useRef(new THREE.Vector3());
  const hzCountRef = useRef(0);
  const hzTimeRef  = useRef(performance.now());

  // Advertise /scan once when ROS connects.
  useEffect(() => {
    if (!connected) return;
    const t = advertise(scanTopic, 'sensor_msgs/LaserScan', { queue_size: 1 });
    topicRef.current = t;
    return () => {
      t.unadvertise();
      topicRef.current = null;
    };
  }, [connected, advertise, scanTopic]);

  useFrame(() => {
    if (!carRef?.current) return;

    frameCount.current += 1;
    if (frameCount.current % PUBLISH_EVERY !== 0) return;

    // ── Get car pose ────────────────────────────────────────────────────────
    // Guard against unmount-race reads on a disposed Rapier body.
    let trans, rot;
    try {
      trans = carRef.current.translation();
      rot   = carRef.current.rotation();
    } catch {
      return;
    }

    _quat.current.set(rot.x, rot.y, rot.z, rot.w);
    _origin.current.set(trans.x, trans.y + LIDAR_HEIGHT_OFFSET, trans.z);

    // ── Cast rays ───────────────────────────────────────────────────────────
    const ranges = new Array(NUM_RAYS);

    for (let i = 0; i < NUM_RAYS; i++) {
      _worldDir.current.copy(LOCAL_DIRS[i]).applyQuaternion(_quat.current);

      const ray = new rapier.Ray(
        { x: _origin.current.x, y: _origin.current.y, z: _origin.current.z },
        { x: _worldDir.current.x, y: _worldDir.current.y, z: _worldDir.current.z }
      );

      const hit = world.castRay(ray, MAX_RANGE, false);
      ranges[i] = hit ? Math.min(hit.timeOfImpact, MAX_RANGE) : MAX_RANGE;
    }

    // ── Publish to /scan ────────────────────────────────────────────────────
    if (topicRef.current) {
      const nowMs = performance.now();
      const sec   = Math.floor(nowMs / 1000);
      const nsec  = Math.round((nowMs % 1000) * 1e6);

      topicRef.current.publish({
        header: { stamp: { sec, nanosec: nsec }, frame_id: 'lidar_link' },
        angle_min:       0.0,
        angle_max:       2 * Math.PI - ANGLE_INCREMENT,
        angle_increment: ANGLE_INCREMENT,
        time_increment:  0.0,
        scan_time:       PUBLISH_EVERY / 60,
        range_min:       0.15,
        range_max:       MAX_RANGE,
        ranges,
        intensities:     new Array(NUM_RAYS).fill(0),
      });

      // Hz tracking
      hzCountRef.current += 1;
      const elapsed = nowMs - hzTimeRef.current;
      if (elapsed >= 1000) {
        const hz = (hzCountRef.current / elapsed) * 1000;
        hzCountRef.current = 0;
        hzTimeRef.current  = nowMs;
        onScan?.(ranges, hz);
      } else {
        onScan?.(ranges, null);   // pass ranges every publish, hz only when updated
      }

      lastPubTs.current = nowMs;
    }
  });

  return null;
}
