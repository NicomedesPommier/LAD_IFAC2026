// =============================================================
// FILE: src/components/sim/RoadFeatures.jsx
// Road add-ons that sit on top of the freeform road network:
//   • IntersectionPatch — asphalt square auto-placed where roads cross
//   • RoundaboutFeature — circular asphalt + center island (click-to-drop)
//   • CrosswalkFeature  — zebra stripes across a road (click-to-drop, oriented)
// Shared by MapCreator (editing) and MapRunner (running).
// =============================================================
import React from 'react';
import { LANE_Y } from './roadGeometry';

// Asphalt patch (covers lane lines through a crossing) + white stop lines at the
// four entries. Rendered above the lane markings so it hides the lines cleanly.
// `headings` = [headA, headB] of the two crossing roads (radians around Y).
export function IntersectionPatch({ x, z, size = 0.7, widthA = size, widthB = size, headings = [] }) {
  const s = size * 1.5;
  // Stop line for a road of `roadW` width crossing with heading `head`: a short
  // white bar placed at each end of the patch, perpendicular to the road.
  const stopLines = [];
  const half = s / 2;
  headings.forEach((head, ri) => {
    const roadW = ri === 0 ? widthA : widthB;
    // direction along the road, and the offset to each entry edge of the patch
    const dx = Math.cos(head), dz = Math.sin(head);
    [1, -1].forEach((dir) => {
      const ex = x + dx * half * dir;
      const ez = z + dz * half * dir;
      stopLines.push({ ex, ez, yaw: head + Math.PI / 2, len: roadW * 0.9 });
    });
  });

  return (
    <group>
      <mesh position={[x, LANE_Y + 0.002, z]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[s, s]} />
        <meshStandardMaterial color="#2b2b2b" roughness={0.95} polygonOffset polygonOffsetFactor={-6} />
      </mesh>
      {stopLines.map((l, i) => (
        <mesh key={i} position={[l.ex, LANE_Y + 0.004, l.ez]} rotation={[-Math.PI / 2, 0, l.yaw]}>
          {/* thin white bar across the road entry */}
          <planeGeometry args={[0.06, l.len]} />
          <meshStandardMaterial color="#f2f2f2" polygonOffset polygonOffsetFactor={-8} />
        </mesh>
      ))}
    </group>
  );
}

// Click-to-drop roundabout: asphalt ring + green island.
export function RoundaboutFeature({ feature, selected = false }) {
  const { x, z, radius = 0.6 } = feature;
  return (
    <group position={[x, LANE_Y + 0.002, z]}>
      {/* Asphalt disc (above lane lines so it covers the crossing cleanly) */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <circleGeometry args={[radius, 40]} />
        <meshStandardMaterial color="#2b2b2b" roughness={0.95} polygonOffset polygonOffsetFactor={-7} />
      </mesh>
      {/* Center island */}
      <mesh position={[0, 0.001, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[radius * 0.45, 32]} />
        <meshStandardMaterial color="#1f9d4d" roughness={0.9} />
      </mesh>
      {/* Selection ring */}
      {selected && (
        <mesh position={[0, 0.002, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[radius * 1.02, radius * 1.12, 40]} />
          <meshBasicMaterial color="#22d3ee" />
        </mesh>
      )}
    </group>
  );
}

// Click-to-drop crosswalk: zebra stripes spanning the road width.
// `yaw` is already the across-road direction (road heading + 90°). In the
// rotated local frame, local +X runs ACROSS the road (the width we tile stripes
// along) and local +Z runs ALONG the road (each stripe's length = `depth`).
export function CrosswalkFeature({ feature, selected = false }) {
  const { x, z, yaw = 0, width = 0.6, depth = 0.4 } = feature;
  const span = width * 0.92;                       // leave a small margin
  const nStripes = Math.max(3, Math.round(span / 0.14)); // ~14cm pitch
  const stripeW = (span / nStripes) * 0.55;        // bar is ~55% of its slot → gaps
  const stripes = [];
  for (let i = 0; i < nStripes; i++) {
    const cx = ((i + 0.5) / nStripes - 0.5) * span; // centered across the width
    stripes.push(cx);
  }
  return (
    <group position={[x, LANE_Y, z]} rotation={[0, yaw, 0]}>
      {stripes.map((cx, i) => (
        <mesh key={i} position={[cx, 0, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          {/* plane args = [along local X (stripe width), along local Y→Z (length)] */}
          <planeGeometry args={[stripeW, depth]} />
          <meshStandardMaterial color="#f2f2f2" polygonOffset polygonOffsetFactor={-5} />
        </mesh>
      ))}
      {selected && (
        <mesh position={[0, 0.001, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[span * 1.1, depth * 1.3]} />
          <meshBasicMaterial color="#22d3ee" transparent opacity={0.25} />
        </mesh>
      )}
    </group>
  );
}

// Renders all auto-intersections + placed features for a map.
export function RoadFeatures({ intersections = [], features = [], selectedId = null }) {
  return (
    <>
      {intersections.map((p, i) => (
        <IntersectionPatch key={`ix_${i}`} x={p.x} z={p.z} size={p.size}
          widthA={p.widthA} widthB={p.widthB} headings={p.headings} />
      ))}
      {features.map((f) => {
        if (f.kind === 'roundabout') return <RoundaboutFeature key={f.id} feature={f} selected={f.id === selectedId} />;
        if (f.kind === 'crosswalk')  return <CrosswalkFeature  key={f.id} feature={f} selected={f.id === selectedId} />;
        return null;
      })}
    </>
  );
}
