import React from 'react';

export function PlaceholderPedestrian({ position = [0, 0, 0], rotation = [0, 0, 0], scale = [1, 1, 1], color = "#e04f4f" }) {
  // A standard blocky person: 0.3m wide, 1.0m tall, standing flush on grass/road
  return (
    <group position={position} rotation={rotation} scale={scale}>
      <mesh castShadow receiveShadow position={[0, 0.5, 0]}>
        <boxGeometry args={[0.3, 1.0, 0.3]} />
        <meshStandardMaterial color={color} roughness={0.9} />
      </mesh>
    </group>
  );
}

export function TrafficLight({ position = [0, 0, 0], rotation = [0, 0, 0], scale = [1, 1, 1] }) {
  // A tall pole with a dark box on top
  return (
    <group position={position} rotation={rotation} scale={scale}>
      {/* Pole */}
      <mesh castShadow receiveShadow position={[0, 0.8, 0]}>
        <cylinderGeometry args={[0.02, 0.02, 1.6, 8]} />
        <meshStandardMaterial color="#222222" />
      </mesh>
      {/* Light box */}
      <mesh castShadow receiveShadow position={[0, 1.5, 0]}>
        <boxGeometry args={[0.1, 0.3, 0.1]} />
        <meshStandardMaterial color="#111111" />
      </mesh>
    </group>
  );
}

export function Wall({ position = [0, 0, 0], rotation = [0, 0, 0], scale = [1, 1, 1], args = [1.0, 0.2, 0.1] }) {
  // Generic boundary/wall that the qcar camera can see and lidar can hit.
  // We orient it so the bottom is flush with Y=0
  return (
    <group position={position} rotation={rotation} scale={scale}>
      <mesh castShadow receiveShadow position={[0, args[1]/2, 0]}>
        <boxGeometry args={args} />
        <meshStandardMaterial color="#dddddd" roughness={0.8} />
      </mesh>
    </group>
  );
}

// ── Road signs (QVL QLabsStopSign / QLabsYieldSign / QLabsRoundaboutSign) ──────
// A small post topped with a sign face. The face is a thin n-gon prism standing
// upright (rotated to face along +Z; placement rotation aims it on the map).
export function StopSign({ position = [0, 0, 0], rotation = [0, 0, 0], scale = [1, 1, 1] }) {
  return (
    <group position={position} rotation={rotation} scale={scale}>
      {/* Post */}
      <mesh castShadow receiveShadow position={[0, 0.18, 0]}>
        <cylinderGeometry args={[0.012, 0.012, 0.36, 8]} />
        <meshStandardMaterial color="#9aa0a6" metalness={0.4} roughness={0.6} />
      </mesh>
      {/* Octagonal face */}
      <mesh castShadow position={[0, 0.42, 0]} rotation={[Math.PI / 2, 0, Math.PI / 8]}>
        <cylinderGeometry args={[0.11, 0.11, 0.012, 8]} />
        <meshStandardMaterial color="#c1121f" roughness={0.6} />
      </mesh>
    </group>
  );
}

export function YieldSign({ position = [0, 0, 0], rotation = [0, 0, 0], scale = [1, 1, 1] }) {
  return (
    <group position={position} rotation={rotation} scale={scale}>
      <mesh castShadow receiveShadow position={[0, 0.18, 0]}>
        <cylinderGeometry args={[0.012, 0.012, 0.36, 8]} />
        <meshStandardMaterial color="#9aa0a6" metalness={0.4} roughness={0.6} />
      </mesh>
      {/* Downward-pointing triangle (3-gon prism, rotated point-down) */}
      <mesh castShadow position={[0, 0.42, 0]} rotation={[Math.PI / 2, 0, Math.PI / 6]}>
        <cylinderGeometry args={[0.13, 0.13, 0.012, 3]} />
        <meshStandardMaterial color="#c1121f" roughness={0.6} />
      </mesh>
    </group>
  );
}

export function RoundaboutSign({ position = [0, 0, 0], rotation = [0, 0, 0], scale = [1, 1, 1] }) {
  return (
    <group position={position} rotation={rotation} scale={scale}>
      <mesh castShadow receiveShadow position={[0, 0.18, 0]}>
        <cylinderGeometry args={[0.012, 0.012, 0.36, 8]} />
        <meshStandardMaterial color="#9aa0a6" metalness={0.4} roughness={0.6} />
      </mesh>
      {/* Blue circular face */}
      <mesh castShadow position={[0, 0.42, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.11, 0.11, 0.012, 24]} />
        <meshStandardMaterial color="#1d4ed8" roughness={0.6} />
      </mesh>
    </group>
  );
}

// Traffic cone (QVL QLabsTrafficCone) — a solid lidar-visible obstacle.
export function TrafficCone({ position = [0, 0, 0], rotation = [0, 0, 0], scale = [1, 1, 1] }) {
  return (
    <group position={position} rotation={rotation} scale={scale}>
      {/* Square base */}
      <mesh castShadow receiveShadow position={[0, 0.015, 0]}>
        <boxGeometry args={[0.18, 0.03, 0.18]} />
        <meshStandardMaterial color="#e8590c" roughness={0.7} />
      </mesh>
      {/* Cone body */}
      <mesh castShadow receiveShadow position={[0, 0.21, 0]}>
        <coneGeometry args={[0.09, 0.36, 20]} />
        <meshStandardMaterial color="#f76707" roughness={0.7} />
      </mesh>
      {/* White reflective band */}
      <mesh position={[0, 0.24, 0]}>
        <coneGeometry args={[0.066, 0.08, 20]} />
        <meshStandardMaterial color="#f8f9fa" roughness={0.5} />
      </mesh>
    </group>
  );
}
