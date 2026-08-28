// src/components/sim/LidarRayViz.jsx
//
// 3-D overlay rendered inside the R3F Canvas — same pattern as
// CameraFrustumViz, but for the LIDAR. Draws each scan ray as a line
// from the LIDAR origin to its hit point, with a colored point at the
// impact. Color encodes distance (red = close, cyan = far) so you can
// eyeball the scan in 3-D while debugging.
//
// Reads pose from carRef (Rapier body) and ranges from rangesRef (the
// same scanRangesRef MapRunner already updates from LidarSensor's
// onScan callback — no new data plumbing needed).
//
// One mutating BufferGeometry per primitive, not 72 individual Line
// components — keeps cost flat as ray count scales.

import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

// ── Must match LidarSensor.jsx ────────────────────────────────────────────────
const NUM_RAYS            = 72;
const ANGLE_INCREMENT     = (2 * Math.PI) / NUM_RAYS;
const LIDAR_HEIGHT_OFFSET = 0.18;
const MAX_RANGE           = 12.0*0.1;

// Unit-direction vectors per ray, in LIDAR-local frame (X-forward, Z-right).
// The enclosing <group> takes care of car-yaw rotation, so these never change.
const LOCAL_DIRS = Array.from({ length: NUM_RAYS }, (_, i) => {
  const a = i * ANGLE_INCREMENT;
  return [Math.cos(a), Math.sin(a)]; // [dx, dz] — Y is zero (horizontal scan)
});

// Reused THREE objects to avoid per-frame allocation
const _q = new THREE.Quaternion();
const _e = new THREE.Euler();

// Distance → [r, g, b] in [0,1]. Red (close) → yellow → cyan (far).
function rangeToRGB(dist) {
  const t = Math.min(dist / MAX_RANGE, 1);
  if (t < 0.5) {
    const k = t * 2;
    return [1, 0.3 + 0.7 * k, 0.3];
  }
  const k = (t - 0.5) * 2;
  return [1 - 0.7 * k, 1, 0.3 + 0.7 * k];
}

export default function LidarRayViz({ carRef, rangesRef }) {
  const groupRef     = useRef();
  const lineGeomRef  = useRef();
  const pointGeomRef = useRef();

  // Pre-allocate the underlying typed arrays once. The geometry attributes
  // wrap these and we just flip needsUpdate after mutating in-place.
  const buffers = useMemo(() => ({
    linePos:   new Float32Array(NUM_RAYS * 2 * 3),  // origin + end per ray
    lineCol:   new Float32Array(NUM_RAYS * 2 * 3),
    pointPos:  new Float32Array(NUM_RAYS * 3),      // one point per impact
    pointCol:  new Float32Array(NUM_RAYS * 3),
  }), []);

  useFrame(() => {
    if (!carRef?.current) return;

    // Guard against unmount-race reads on a disposed Rapier body.
    let trans, rot;
    try {
      trans = carRef.current.translation();
      rot   = carRef.current.rotation();
    } catch {
      return;
    }

    // Anchor the group at the LIDAR origin, oriented to the car's yaw.
    if (groupRef.current) {
      groupRef.current.position.set(trans.x, trans.y + LIDAR_HEIGHT_OFFSET, trans.z);
      _q.set(rot.x, rot.y, rot.z, rot.w);
      _e.setFromQuaternion(_q, 'YXZ');
      groupRef.current.rotation.set(0, _e.y, 0, 'YXZ');
    }

    const ranges = rangesRef?.current;
    if (!Array.isArray(ranges) || ranges.length !== NUM_RAYS) return;

    const { linePos, lineCol, pointPos, pointCol } = buffers;

    for (let i = 0; i < NUM_RAYS; i++) {
      const [dx, dz] = LOCAL_DIRS[i];
      const dist  = Math.min(ranges[i] ?? MAX_RANGE, MAX_RANGE);
      const endX  = dx * dist;
      const endZ  = dz * dist;
      const noHit = dist >= MAX_RANGE * 0.999; // ray reached max range = free space

      const [r, g, b] = rangeToRGB(dist);
      const dim       = noHit ? 0.35 : 1.0;

      // Line: 2 verts × 3 components = 6 floats per ray
      const li = i * 6;
      linePos[li + 0] = 0;       linePos[li + 1] = 0; linePos[li + 2] = 0;
      linePos[li + 3] = endX;    linePos[li + 4] = 0; linePos[li + 5] = endZ;
      lineCol[li + 0] = r * dim; lineCol[li + 1] = g * dim; lineCol[li + 2] = b * dim;
      lineCol[li + 3] = r * dim; lineCol[li + 4] = g * dim; lineCol[li + 5] = b * dim;

      // Impact dot — collapse to origin when no hit so it doesn't render
      // a misleading "wall" at MAX_RANGE.
      const pi = i * 3;
      pointPos[pi + 0] = noHit ? 0 : endX;
      pointPos[pi + 1] = 0;
      pointPos[pi + 2] = noHit ? 0 : endZ;
      pointCol[pi + 0] = noHit ? 0 : r;
      pointCol[pi + 1] = noHit ? 0 : g;
      pointCol[pi + 2] = noHit ? 0 : b;
    }

    if (lineGeomRef.current) {
      lineGeomRef.current.attributes.position.needsUpdate = true;
      lineGeomRef.current.attributes.color.needsUpdate    = true;
    }
    if (pointGeomRef.current) {
      pointGeomRef.current.attributes.position.needsUpdate = true;
      pointGeomRef.current.attributes.color.needsUpdate    = true;
    }
  });

  return (
    <group ref={groupRef}>
      {/* Mount-point indicator — small cyan sphere at the LIDAR origin */}
      <mesh>
        <sphereGeometry args={[0.04, 12, 8]} />
        <meshBasicMaterial color="#00e5ff" transparent opacity={0.85} />
      </mesh>

      {/* Scan rays */}
      <lineSegments frustumCulled={false}>
        <bufferGeometry ref={lineGeomRef}>
          <bufferAttribute attach="attributes-position" args={[buffers.linePos, 3]} />
          <bufferAttribute attach="attributes-color"    args={[buffers.lineCol, 3]} />
        </bufferGeometry>
        <lineBasicMaterial vertexColors transparent opacity={0.55} />
      </lineSegments>

      {/* Impact points */}
      <points frustumCulled={false}>
        <bufferGeometry ref={pointGeomRef}>
          <bufferAttribute attach="attributes-position" args={[buffers.pointPos, 3]} />
          <bufferAttribute attach="attributes-color"    args={[buffers.pointCol, 3]} />
        </bufferGeometry>
        <pointsMaterial size={0.09} vertexColors sizeAttenuation />
      </points>
    </group>
  );
}

// ── HTML legend (rendered outside Canvas as a React element) ─────────────────
export function LidarRayLegend() {
  return (
    <div style={{
      position: 'absolute', top: 8, right: 8, zIndex: 5,
      background: 'rgba(6,10,20,0.80)',
      border: '1px solid rgba(255,255,255,0.07)',
      borderRadius: 4, padding: '5px 8px',
      fontFamily: 'monospace', fontSize: 9,
      pointerEvents: 'none',
      display: 'flex', flexDirection: 'column', gap: 3,
      minWidth: 160,
    }}>
      <div style={{ color: '#00e5ff', fontWeight: 'bold' }}>
        LIDAR · {NUM_RAYS} rays · max {MAX_RANGE} m
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
        <span style={{ color: '#aaa' }}>close</span>
        <span style={{
          flex: 1, height: 4, marginLeft: 4, marginRight: 4, borderRadius: 2,
          background: 'linear-gradient(to right, rgb(255,80,80), rgb(255,255,80), rgb(80,255,255))',
        }} />
        <span style={{ color: '#aaa' }}>far</span>
      </div>
      <div style={{ color: '#557', fontSize: 8 }}>Dim ray = no hit (≥ max range)</div>
    </div>
  );
}
