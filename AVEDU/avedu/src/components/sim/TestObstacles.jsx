// src/components/sim/TestObstacles.jsx
//
// Six fixed Rapier RigidBody boxes scattered around the QCar spawn point.
// Placed at 1–5 m distances in various directions so the simulated LiDAR
// has realistic returns at different angles and ranges.

import React from 'react';
import { RigidBody } from '@react-three/rapier';

// [x, y_half (height/2 = half-extent), z, half-w, half-h, half-d, color]
const OBSTACLES = [
  // pos [x, z], dims [hx, hy, hz], color
  { pos: [2.5, 0, 0.0],  dims: [0.15, 0.25, 0.15], color: '#2255cc' },  // front
  { pos: [-2.0, 0, 0.5], dims: [0.20, 0.30, 0.10], color: '#22aa55' },  // rear-right
  { pos: [0.5, 0, -1.8], dims: [0.10, 0.20, 0.50], color: '#cc4422' },  // left wall
  { pos: [0.0, 0, 2.2],  dims: [0.40, 0.15, 0.10], color: '#aa22aa' },  // right
  { pos: [4.0, 0, -1.5], dims: [0.15, 0.35, 0.15], color: '#ccaa00' },  // far front-left
  { pos: [-3.5, 0, -1.0],dims: [0.25, 0.20, 0.25], color: '#00aacc' },  // far rear
];

export default function TestObstacles() {
  return (
    <>
      {OBSTACLES.map(({ pos, dims, color }, i) => (
        <RigidBody key={i} type="fixed" position={[pos[0], dims[1], pos[2]]}>
          <mesh castShadow receiveShadow>
            <boxGeometry args={dims.map((d) => d * 2)} />
            <meshStandardMaterial color={color} metalness={0.2} roughness={0.7} />
          </mesh>
        </RigidBody>
      ))}
    </>
  );
}
