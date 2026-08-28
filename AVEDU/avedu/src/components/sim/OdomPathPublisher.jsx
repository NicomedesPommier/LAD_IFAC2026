// src/components/sim/OdomPathPublisher.jsx
//
// Publishes the simulated QCar's pose (nav_msgs/Odometry on <ns>/odom) and the
// authored route (nav_msgs/Path on <ns>/planned_path) so node-based followers
// (e.g. the Pure Pursuit block) can close the loop and drive the car.
//
// Frame convention (kept consistent with the Pure Pursuit node):
//   world_x =  sim_x,  world_y = -sim_z,  theta = car yaw about +Y.
//   QCarBody forward = (cos yaw, 0, -sin yaw), so forward in (world_x, world_y)
//   is (cos yaw, sin yaw) — a standard planar pose. We encode theta as a yaw
//   about +Z in the published quaternion.
//
// Must live inside <Canvas> (uses useFrame) and under <ROSProvider> (ROSContext).

import { useEffect, useRef, useContext } from 'react';
import { useFrame } from '@react-three/fiber';
import { ROSContext } from './ROSContext';

const ODOM_EVERY = 2;    // frames → ~30 Hz @ 60 fps
const PATH_EVERY = 30;   // frames → ~2 Hz

export default function OdomPathPublisher({ carRef, namespace = '', waypoints = [] }) {
  const { advertise, connected } = useContext(ROSContext);
  const odomTopicName = namespace ? `${namespace}/odom` : '/odom';
  const pathTopicName = namespace ? `${namespace}/planned_path` : '/planned_path';

  const odomRef  = useRef(null);
  const pathRef  = useRef(null);
  const frame    = useRef(0);
  const wpRef    = useRef(waypoints);
  wpRef.current  = waypoints;

  useEffect(() => {
    if (!connected) return;
    const o = advertise(odomTopicName, 'nav_msgs/Odometry', { queue_size: 1 });
    const p = advertise(pathTopicName, 'nav_msgs/Path', { queue_size: 1 });
    odomRef.current = o;
    pathRef.current = p;
    return () => {
      o.unadvertise();
      p.unadvertise();
      odomRef.current = null;
      pathRef.current = null;
    };
  }, [connected, advertise, odomTopicName, pathTopicName]);

  const stamp = () => {
    const nowMs = performance.now();
    return { sec: Math.floor(nowMs / 1000), nanosec: Math.round((nowMs % 1000) * 1e6) };
  };

  const publishPath = () => {
    if (!pathRef.current) return;
    // Only publish a route drawn in Map Creator. With no map waypoints we stay
    // silent so we don't clobber a follower that publishes its OWN /planned_path
    // (e.g. the SDCS Roadmap node generating the path from a node sequence).
    if (!wpRef.current || wpRef.current.length === 0) return;
    const poses = (wpRef.current || []).map((w) => ({
      header: { stamp: stamp(), frame_id: 'map' },
      pose: {
        position: { x: w.x, y: -w.z, z: 0 },
        orientation: { x: 0, y: 0, z: 0, w: 1 },
      },
    }));
    pathRef.current.publish({ header: { stamp: stamp(), frame_id: 'map' }, poses });
  };

  useFrame(() => {
    if (!carRef?.current) return;
    frame.current += 1;

    if (frame.current % ODOM_EVERY === 0 && odomRef.current) {
      let t, r;
      try {
        t = carRef.current.translation();
        r = carRef.current.rotation();
      } catch {
        return;
      }
      const yaw = 2 * Math.atan2(r.y, r.w);   // car heading is a rotation about +Y
      const qz = Math.sin(yaw / 2);
      const qw = Math.cos(yaw / 2);
      odomRef.current.publish({
        header: { stamp: stamp(), frame_id: 'map' },
        child_frame_id: 'base_link',
        pose: {
          pose: {
            position: { x: t.x, y: -t.z, z: 0 },
            orientation: { x: 0, y: 0, z: qz, w: qw },
          },
          covariance: new Array(36).fill(0),
        },
        twist: {
          twist: {
            linear:  { x: 0, y: 0, z: 0 },
            angular: { x: 0, y: 0, z: 0 },
          },
          covariance: new Array(36).fill(0),
        },
      });
    }

    if (frame.current % PATH_EVERY === 0) publishPath();
  });

  return null;
}
