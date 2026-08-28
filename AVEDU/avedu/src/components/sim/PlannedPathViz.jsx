// src/components/sim/PlannedPathViz.jsx
//
// Debug visualizer: subscribes to <ns>/planned_path (nav_msgs/Path) and draws it
// in the 3-D sim, so you can SEE exactly what a follower (Pure Pursuit / SDCS
// Roadmap node) is being told to drive. If the orange line sits off the road or
// far from the car, the issue is frame alignment, not the follower.
//
// Frame: the path is published in the odom frame (x = sim_x, y = -sim_z), so we
// render each point at sim (x, GROUND_Y, z = -y).
//
// Must live inside <Canvas> and under <ROSProvider> (ROSContext).

import { useEffect, useState, useContext } from 'react';
import { Line } from '@react-three/drei';
import { ROSContext } from './ROSContext';
import { GROUND_Y } from '../simulator/QCarBody';

export default function PlannedPathViz({ namespace = '' }) {
  const { subscribeTopic, connected } = useContext(ROSContext);
  const [pts, setPts] = useState([]);
  const topicName = namespace ? `${namespace}/planned_path` : '/planned_path';
  const y = GROUND_Y + 0.05;

  useEffect(() => {
    if (!connected || !subscribeTopic) return undefined;
    const unsub = subscribeTopic(topicName, 'nav_msgs/Path', (msg) => {
      const poses = msg?.poses || [];
      const arr = poses
        .map((p) => p?.pose?.position)
        .filter(Boolean)
        // odom (x, y) → sim (x, z = -y)
        .map((pos) => [pos.x, y, -pos.y]);
      setPts(arr);
    });
    return unsub;
  }, [connected, subscribeTopic, topicName, y]);

  if (pts.length < 2) return null;

  const start = pts[0];
  const end = pts[pts.length - 1];
  // Sparse markers so a 1700-point path doesn't spawn 1700 meshes.
  const step = Math.max(1, Math.floor(pts.length / 40));
  const markers = pts.filter((_, i) => i % step === 0);

  return (
    <>
      <Line points={pts} color="#f59e0b" lineWidth={3} />
      {markers.map((p, i) => (
        <mesh key={i} position={p}>
          <sphereGeometry args={[0.025, 8, 8]} />
          <meshStandardMaterial color="#fbbf24" />
        </mesh>
      ))}
      {/* start (green) / goal (red) */}
      <mesh position={start}>
        <sphereGeometry args={[0.08, 14, 14]} />
        <meshStandardMaterial color="#22c55e" emissive="#16a34a" emissiveIntensity={0.7} />
      </mesh>
      <mesh position={end}>
        <sphereGeometry args={[0.08, 14, 14]} />
        <meshStandardMaterial color="#ef4444" emissive="#b91c1c" emissiveIntensity={0.7} />
      </mesh>
    </>
  );
}
