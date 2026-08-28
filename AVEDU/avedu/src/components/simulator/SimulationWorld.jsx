/**
 * SimulationWorld.jsx
 *
 * Rapier scene containing:
 *   • Ground plane + perimeter walls  (all in CG_WORLD)
 *   • Scattered box obstacles
 *   • LiDAR sensor component (renders inside <Physics>, calls useLidarSim)
 *   • Lighting, grid, skybox
 *   • Chase camera (follows the QCar with a smooth lag)
 *   • Mini-map overlay (2D bird's-eye scan visualiser — no ROS dependency)
 *
 * Receives:
 *   carRef    — Rapier RigidBody ref of the chassis (from QCarBody)
 *   onScan    — optional callback(ranges) for scan viz in SimulatorPage
 */

import { useRef, useEffect } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import {
  RigidBody,
  CuboidCollider,
} from '@react-three/rapier';
import { Grid, Environment, PerspectiveCamera } from '@react-three/drei';
import * as THREE from 'three';
import { CG_WORLD } from './QCarBody';
import { useLidarSim } from '../../hooks/useLidarSim';

// ── Arena dimensions ───────────────────────────────────────────────────────────
const ARENA_W    = 10;  // metres
const ARENA_D    = 10;
const WALL_H     = 0.5;
const WALL_T     = 0.1;
const GROUND_T   = 0.05;

// ── Obstacle layout ────────────────────────────────────────────────────────────
const OBSTACLES = [
  { pos: [ 2.5,  0,  0  ], half: [0.25, 0.25, 0.25] },
  { pos: [-2.0,  0,  1.5], half: [0.2,  0.4,  0.2 ] },
  { pos: [ 1.0,  0, -2.5], half: [0.15, 0.3,  0.5 ] },
  { pos: [-1.5,  0, -1.0], half: [0.3,  0.2,  0.3 ] },
  { pos: [ 3.5,  0,  2.0], half: [0.2,  0.25, 0.2 ] },
  { pos: [-3.0,  0, -2.5], half: [0.25, 0.35, 0.25] },
];

// ── Perimeter wall geometry ────────────────────────────────────────────────────
// Each wall: [position, [halfX, halfY, halfZ]]
const WALLS = [
  // North
  { pos: [0, WALL_H / 2,  ARENA_D / 2 + WALL_T / 2], half: [ARENA_W / 2 + WALL_T, WALL_H / 2, WALL_T / 2] },
  // South
  { pos: [0, WALL_H / 2, -ARENA_D / 2 - WALL_T / 2], half: [ARENA_W / 2 + WALL_T, WALL_H / 2, WALL_T / 2] },
  // East
  { pos: [ ARENA_W / 2 + WALL_T / 2, WALL_H / 2, 0], half: [WALL_T / 2, WALL_H / 2, ARENA_D / 2] },
  // West
  { pos: [-ARENA_W / 2 - WALL_T / 2, WALL_H / 2, 0], half: [WALL_T / 2, WALL_H / 2, ARENA_D / 2] },
];

// ── LiDAR sensor component ─────────────────────────────────────────────────────
// Thin wrapper so useLidarSim (which needs useRapier) lives inside <Physics>.

function LidarSensor({ carRef, onScan }) {
  useLidarSim(carRef, onScan);
  return null;
}

// ── Chase camera ───────────────────────────────────────────────────────────────

const _camTarget  = new THREE.Vector3();
const _carPos     = new THREE.Vector3();
const _camOffset  = new THREE.Vector3(0, 1.5, -4.0); // behind and above

function ChaseCamera({ carRef }) {
  const { camera } = useThree();

  useFrame(() => {
    if (!carRef?.current) return;

    // Guard against unmount-race reads on a disposed Rapier body.
    let t, q;
    try {
      t = carRef.current.translation();
      q = carRef.current.rotation();
    } catch {
      return;
    }
    const rot = new THREE.Quaternion(q.x, q.y, q.z, q.w);

    _carPos.set(t.x, t.y, t.z);

    // Rotate offset by car yaw so camera follows behind the car
    const offset = _camOffset.clone().applyQuaternion(rot);
    const desiredPos = _carPos.clone().add(offset);

    // Smooth lerp — adjust factor for tighter/looser chase
    camera.position.lerp(desiredPos, 0.08);

    _camTarget.copy(_carPos).add(new THREE.Vector3(0, 0.4, 0));
    camera.lookAt(_camTarget);
  });

  return null;
}

// ── Scan visualiser (optional 2D overlay rendered in 3D) ──────────────────────

const _scanGeo = new THREE.BufferGeometry();

function ScanViz({ carRef, ranges }) {
  const meshRef = useRef();

  useFrame(() => {
    if (!meshRef.current || !carRef?.current || !ranges?.current?.length) return;

    // Guard against unmount-race reads on a disposed Rapier body.
    let trans, rot;
    try {
      trans = carRef.current.translation();
      rot   = carRef.current.rotation();
    } catch {
      return;
    }
    const q     = new THREE.Quaternion(rot.x, rot.y, rot.z, rot.w);

    const pts = [];
    const r   = ranges.current;
    const n   = r.length;
    const aMin = -Math.PI * 135 / 180;
    const aInc = (Math.PI * 270 / 180) / (n - 1);

    for (let i = 0; i < n; i++) {
      const a = aMin + i * aInc;
      const d = r[i];
      const v = new THREE.Vector3(Math.cos(a) * d, 0, -Math.sin(a) * d);
      v.applyQuaternion(q);
      pts.push(trans.x + v.x, trans.y + 0.18, trans.z + v.z);
    }

    _scanGeo.setAttribute('position', new THREE.Float32BufferAttribute(pts, 3));
    meshRef.current.geometry = _scanGeo;
  });

  return (
    <points ref={meshRef}>
      <pointsMaterial size={0.05} color="#00ff88" sizeAttenuation />
    </points>
  );
}

// ── Main export ────────────────────────────────────────────────────────────────

/**
 * SimulationWorld
 *
 * @param {React.MutableRefObject} carRef   — chassis RigidBody ref
 * @param {function} [onScan]               — scan callback (ranges: number[])
 * @param {boolean}  [chaseCamera=true]
 * @param {boolean}  [showScan=true]
 */
export function SimulationWorld({
  carRef,
  onScan,
  namespace   = '',
  chaseCamera = true,
  showScan    = true,
}) {
  // Persist latest scan ranges for the visualiser
  const latestRanges = useRef([]);
  const handleScan = (ranges) => {
    latestRanges.current = ranges;
    onScan?.(ranges);
  };

  return (
    <>
      {/* ── Lighting ──────────────────────────────────────────────────────── */}
      <ambientLight intensity={0.5} />
      <directionalLight
        position={[8, 12, 6]}
        intensity={1.2}
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-camera-near={0.1}
        shadow-camera-far={40}
        shadow-camera-left={-12}
        shadow-camera-right={12}
        shadow-camera-top={12}
        shadow-camera-bottom={-12}
      />

      {/* ── Grid overlay ──────────────────────────────────────────────────── */}
      <Grid
        position={[0, 0.001, 0]}
        args={[ARENA_W, ARENA_D]}
        cellSize={0.5}
        cellThickness={0.5}
        cellColor="#4444aa"
        sectionSize={2}
        sectionThickness={1}
        sectionColor="#8888cc"
        fadeDistance={20}
        infiniteGrid={false}
      />

      {/* ── Ground ────────────────────────────────────────────────────────── */}
      <RigidBody type="fixed" friction={0.8} restitution={0.0}>
        <CuboidCollider
          args={[ARENA_W / 2 + 1, GROUND_T / 2, ARENA_D / 2 + 1]}
          position={[0, -GROUND_T / 2, 0]}
          collisionGroups={CG_WORLD}
        />
        <mesh receiveShadow position={[0, 0, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[ARENA_W, ARENA_D]} />
          <meshStandardMaterial color="#2a2a2a" />
        </mesh>
      </RigidBody>

      {/* ── Perimeter walls ───────────────────────────────────────────────── */}
      {WALLS.map((w, i) => (
        <RigidBody key={i} type="fixed" friction={0.5} restitution={0.1}>
          <CuboidCollider
            args={w.half}
            position={w.pos}
            collisionGroups={CG_WORLD}
          />
          <mesh position={w.pos} castShadow receiveShadow>
            <boxGeometry args={w.half.map(h => h * 2)} />
            <meshStandardMaterial color="#555577" />
          </mesh>
        </RigidBody>
      ))}

      {/* ── Box obstacles ─────────────────────────────────────────────────── */}
      {OBSTACLES.map((o, i) => (
        <RigidBody
          key={i}
          type="fixed"
          position={[o.pos[0], o.half[1], o.pos[2]]}
          friction={0.6}
          restitution={0.1}
        >
          <CuboidCollider
            args={o.half}
            collisionGroups={CG_WORLD}
          />
          <mesh castShadow receiveShadow>
            <boxGeometry args={o.half.map(h => h * 2)} />
            <meshStandardMaterial
              color={`hsl(${(i * 47) % 360}, 60%, 55%)`}
            />
          </mesh>
        </RigidBody>
      ))}

      {/* ── LiDAR sensor (must be inside Physics) ─────────────────────────── */}
      <LidarSensor carRef={carRef} onScan={handleScan} namespace={namespace} />

      {/* ── Chase camera ──────────────────────────────────────────────────── */}
      {chaseCamera && <ChaseCamera carRef={carRef} />}

      {/* ── Scan point cloud visualisation ────────────────────────────────── */}
      {showScan && <ScanViz carRef={carRef} ranges={latestRanges} />}
    </>
  );
}
