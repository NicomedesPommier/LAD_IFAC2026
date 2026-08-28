// src/components/sim/CameraFrustumViz.jsx
//
// 3-D overlay rendered inside the R3F Canvas.
// For each QCar camera it draws:
//   • A colored sphere at the camera's mount point
//   • Two rays forming the horizontal FOV edges
//   • A filled triangle showing the camera's field of view
//
// The groups are re-positioned every frame by reading the Rapier RigidBody ref
// (same technique used by FrontCamera).  Must be placed inside <Canvas>.

import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Line } from '@react-three/drei';
import * as THREE from 'three';
import { CAMS, CAM_LABELS } from './QCarCameras';

// ── Color per camera ───────────────────────────────────────────────────────────

export const CAM_COLORS = {
  front: '#00e5ff',   // cyan
  right: '#ff8800',   // orange
  back:  '#ff4444',   // red
  left:  '#44ff88',   // green
  rgb:   '#cc44ff',   // purple  (RealSense)
};

// ── FOV geometry constants (in camera-local space, camera at origin, facing +X) ─

const FOV_DEG  = 70;
const FOV_LEN  = 0.45;                                        // metres
const FAN_HALF = Math.tan((FOV_DEG / 2) * Math.PI / 180) * FOV_LEN;

const L = [FOV_LEN, 0,  FAN_HALF];   // left  FOV edge endpoint
const R = [FOV_LEN, 0, -FAN_HALF];   // right FOV edge endpoint

// Triangle fill — one shared Float32Array is fine (never mutated)
const FILL_VERTS = new Float32Array([
  0, 0, 0,
  L[0], L[1], L[2],
  R[0], R[1], R[2],
]);

// ── Reused quaternion / euler to avoid allocation inside useFrame ──────────────

const _q = new THREE.Quaternion();
const _e = new THREE.Euler();

// ── Component ─────────────────────────────────────────────────────────────────

export default function CameraFrustumViz({ carRef }) {
  // One group ref per camera, keyed by cam.id
  const groupRefs = useRef({});

  useFrame(() => {
    if (!carRef?.current) return;

    // The ref object outlives the Rapier WASM body during unmount races
    // (e.g. closing a widget). Calling .translation() on a disposed body
    // throws "null pointer passed to rust" — skip the tick instead.
    let t, r;
    try {
      t = carRef.current.translation();
      r = carRef.current.rotation();
    } catch {
      return;
    }

    _q.set(r.x, r.y, r.z, r.w);
    _e.setFromQuaternion(_q, 'YXZ');
    const yaw = _e.y;
    const cosY = Math.cos(yaw);
    const sinY = Math.sin(yaw);

    CAMS.forEach(cam => {
      const g = groupRefs.current[cam.id];
      if (!g) return;

      // Rotate cam offset from car-local to world frame (same math as FrontCamera)
      const ox = cam.camOffset.x;
      const oy = cam.camOffset.y;
      const oz = cam.camOffset.z;

      g.position.set(
        t.x + ox * cosY - oz * sinY,
        t.y + oy,
        t.z + ox * sinY + oz * cosY,
      );
      g.rotation.set(-cam.facingRoll, -(yaw + cam.facingYaw), -cam.facingPitch, 'YZX');
    });
  });

  return (
    <>
      {CAMS.map(cam => {
        const color = CAM_COLORS[cam.id];
        return (
          <group
            key={cam.id}
            ref={el => { groupRefs.current[cam.id] = el; }}
          >
            {/* Mount-point dot */}
            <mesh>
              <sphereGeometry args={[0.018, 8, 6]} />
              <meshBasicMaterial color={color} />
            </mesh>

            {/* FOV side rays */}
            <Line points={[[0, 0, 0], L]} color={color} lineWidth={1.5} />
            <Line points={[[0, 0, 0], R]} color={color} lineWidth={1.5} />

            {/* FOV base line */}
            <Line points={[L, R]} color={color} lineWidth={1} />

            {/* FOV fill triangle */}
            <mesh>
              <bufferGeometry>
                <bufferAttribute
                  attach="attributes-position"
                  args={[FILL_VERTS, 3]}
                />
              </bufferGeometry>
              <meshBasicMaterial
                color={color}
                transparent
                opacity={0.1}
                side={THREE.DoubleSide}
              />
            </mesh>
          </group>
        );
      })}
    </>
  );
}

// ── HTML legend (rendered outside Canvas as a React element) ──────────────────

export function CameraFrustumLegend() {
  return (
    <div style={{
      position: 'absolute', top: 8, left: 8, zIndex: 5,
      background: 'rgba(6,10,20,0.80)',
      border: '1px solid rgba(255,255,255,0.07)',
      borderRadius: 4, padding: '5px 8px',
      fontFamily: 'monospace', fontSize: 9,
      pointerEvents: 'none',
      display: 'flex', flexDirection: 'column', gap: 3,
    }}>
      {CAMS.map(cam => (
        <div key={cam.id} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <div style={{
            width: 8, height: 8, borderRadius: '50%',
            background: CAM_COLORS[cam.id], flexShrink: 0,
          }} />
          <span style={{ color: CAM_COLORS[cam.id] }}>{CAM_LABELS[cam.id]}</span>
          <span style={{ color: '#334', fontSize: 8 }}>
            {Math.round((70) / 1)}° FOV
          </span>
        </div>
      ))}
    </div>
  );
}
