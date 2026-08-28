import React from 'react';

// Standard 1x1 meter tile offset
export const TILE_SIZE = 1.0;

export function StraightStreet({ position = [0, 0, 0], rotation = [0, 0, 0], scale = [1, 1, 1] }) {
  return (
    <group position={position} rotation={rotation} scale={scale}>
      {/* Asphalt */}
      <mesh receiveShadow position={[0, 0.01, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[TILE_SIZE, TILE_SIZE]} />
        <meshStandardMaterial color="#333333" />
      </mesh>
      {/* Center line (dashed) */}
      <mesh receiveShadow position={[0, 0.015, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[0.05, TILE_SIZE * 0.6]} />
        <meshStandardMaterial color="#ffffff" />
      </mesh>
      {/* Outer borders */}
      <mesh receiveShadow position={[-TILE_SIZE/2 + 0.05, 0.015, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[0.05, TILE_SIZE]} />
        <meshStandardMaterial color="#ddaa00" />
      </mesh>
      <mesh receiveShadow position={[TILE_SIZE/2 - 0.05, 0.015, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[0.05, TILE_SIZE]} />
        <meshStandardMaterial color="#ddaa00" />
      </mesh>
    </group>
  );
}

export function Intersection({ position = [0, 0, 0], rotation = [0, 0, 0], scale = [1, 1, 1] }) {
  return (
    <group position={position} rotation={rotation} scale={scale}>
      <mesh receiveShadow position={[0, 0.01, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[TILE_SIZE, TILE_SIZE]} />
        <meshStandardMaterial color="#333333" />
      </mesh>
    </group>
  );
}

export function Turn({ position = [0, 0, 0], rotation = [0, 0, 0], scale = [1, 1, 1] }) {
  return (
    <group position={position} rotation={rotation} scale={scale}>
      <mesh receiveShadow position={[0, 0.01, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[TILE_SIZE, TILE_SIZE]} />
        <meshStandardMaterial color="#333333" />
      </mesh>
      {/* A simple diagonal line as a basic corner placeholder */}
      <mesh receiveShadow position={[0.15, 0.015, -0.15]} rotation={[-Math.PI / 2, 0, Math.PI / 4]}>
        <planeGeometry args={[0.05, TILE_SIZE * 0.6]} />
        <meshStandardMaterial color="#ffffff" />
      </mesh>
    </group>
  );
}

export function Roundabout({ position = [0, 0, 0], rotation = [0, 0, 0], scale = [1, 1, 1] }) {
  return (
    <group position={position} rotation={rotation} scale={scale}>
      {/* Base asphalt circle */}
      <mesh receiveShadow position={[0, 0.01, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[TILE_SIZE/1.2, TILE_SIZE/1.2, 0.01, 32]} />
        <meshStandardMaterial color="#333333" />
      </mesh>
      {/* Inner green island */}
      <mesh receiveShadow position={[0, 0.015, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[TILE_SIZE/3, TILE_SIZE/3, 0.01, 32]} />
        <meshStandardMaterial color="#11aa11" />
      </mesh>
    </group>
  );
}

// Zebra crosswalk — a road overlay tile with white stripes (QVL QLabsCrosswalk).
export function Crosswalk({ position = [0, 0, 0], rotation = [0, 0, 0], scale = [1, 1, 1] }) {
  const stripes = [-0.36, -0.24, -0.12, 0, 0.12, 0.24, 0.36];
  return (
    <group position={position} rotation={rotation} scale={scale}>
      {/* Asphalt base */}
      <mesh receiveShadow position={[0, 0.01, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[TILE_SIZE, TILE_SIZE]} />
        <meshStandardMaterial color="#333333" />
      </mesh>
      {/* White zebra stripes */}
      {stripes.map((x, i) => (
        <mesh key={i} receiveShadow position={[x, 0.015, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[0.07, TILE_SIZE * 0.8]} />
          <meshStandardMaterial color="#f5f5f5" />
        </mesh>
      ))}
    </group>
  );
}
