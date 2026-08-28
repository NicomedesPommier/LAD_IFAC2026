// =============================================================
// FILE: src/components/sim/road/RoadView.jsx
// Renders a whole road model (roads, roundabouts, lane lines, markings,
// surfaces, auto-intersections). Shared by the editor (RoadEditor) and the
// runner (MapRunner). Uses the texture system in ./textures.
// =============================================================
import React, { useMemo } from 'react';
import { Line } from '@react-three/drei';
import {
  buildRoadGeometry, buildLines, buildRoundabout, findIntersections,
  buildSurfacePatch, roadHeadingAt, LANE_Y, MARK_Y,
} from './roadGeo';
import { materialProps } from './textures';

// ── One road (lane / path / line) ────────────────────────────────────────────
function RoadPiece({ road, selected }) {
  const geom  = useMemo(() => buildRoadGeometry(road), [road]);
  const lines = useMemo(() => buildLines(road), [road]);
  const mat   = useMemo(() => materialProps(road.tex || 'wear2', { transparent: true }), [road.tex]);

  if (!geom) return null;
  const showSurface = road.kind !== 'line' && road.tex !== 'empty';
  const showLines   = road.kind === 'lane' || road.kind === 'line';

  return (
    <group>
      {showSurface && (
        <mesh geometry={geom} receiveShadow>
          <meshStandardMaterial {...mat} polygonOffset polygonOffsetFactor={-1} />
        </mesh>
      )}
      {showLines && road.texL !== 'empty' && lines.left.length > 1 && (
        <Line points={lines.left} color="#e8e8e8" lineWidth={1.3} />
      )}
      {showLines && road.texR !== 'empty' && lines.right.length > 1 && (
        <Line points={lines.right} color="#e8e8e8" lineWidth={1.3} />
      )}
      {road.kind === 'lane' && lines.center.length > 1 && (
        <Line points={lines.center} color="#f2c200" lineWidth={1.2} dashed dashSize={0.18} gapSize={0.14} />
      )}
      {selected && lines.left.length > 1 && (
        <>
          <Line points={lines.left} color="#22d3ee" lineWidth={3} />
          <Line points={lines.right} color="#22d3ee" lineWidth={3} />
        </>
      )}
    </group>
  );
}

// ── Roundabout ring ──────────────────────────────────────────────────────────
function RoundaboutPiece({ road, selected }) {
  const ra  = useMemo(() => buildRoundabout(road), [road]);
  const mat = useMemo(() => materialProps(road.tex || 'wear2', { transparent: true }), [road.tex]);
  if (!ra) return null;
  return (
    <group>
      <mesh geometry={ra.surface} receiveShadow>
        <meshStandardMaterial {...mat} polygonOffset polygonOffsetFactor={-1} />
      </mesh>
      {/* center island */}
      <mesh position={[ra.center[0], LANE_Y, ra.center[1]]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[Math.max(0.02, ra.R - ra.W / 2), 36]} />
        <meshStandardMaterial color="#1f9d4d" roughness={0.9} />
      </mesh>
      {ra.innerLine.length > 1 && <Line points={[...ra.innerLine, ra.innerLine[0]]} color="#e8e8e8" lineWidth={1.2} />}
      {ra.outerLine.length > 1 && <Line points={[...ra.outerLine, ra.outerLine[0]]} color="#e8e8e8" lineWidth={1.2} />}
      {selected && ra.outerLine.length > 1 && (
        <Line points={[...ra.outerLine, ra.outerLine[0]]} color="#22d3ee" lineWidth={3} />
      )}
    </group>
  );
}

// ── Intersection patch + stop lines ──────────────────────────────────────────
function IntersectionPiece({ hit }) {
  const s = hit.size * 1.5;
  const mat = useMemo(() => materialProps('asphalt'), []);
  const bars = [];
  const half = s / 2;
  (hit.headings || []).forEach((h) => {
    const dx = Math.cos(h), dz = Math.sin(h);
    [1, -1].forEach((dir) => bars.push({ x: hit.x + dx * half * dir, z: hit.z + dz * half * dir, yaw: h + Math.PI / 2 }));
  });
  return (
    <group>
      <mesh position={[hit.x, LANE_Y + 0.002, hit.z]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[s, s]} />
        <meshStandardMaterial {...mat} color="#2b2b2b" polygonOffset polygonOffsetFactor={-6} />
      </mesh>
      {bars.map((b, i) => (
        <mesh key={i} position={[b.x, LANE_Y + 0.004, b.z]} rotation={[-Math.PI / 2, 0, b.yaw]}>
          <planeGeometry args={[0.06, hit.size * 0.9]} />
          <meshStandardMaterial color="#f2f2f2" polygonOffset polygonOffsetFactor={-8} />
        </mesh>
      ))}
    </group>
  );
}

// ── Crosswalk (zebra band spanning a road, auto-oriented across it) ──────────
// A crosswalk is a marking of kind 'crosswalk'. `mark.width` = road width it
// spans, `mark.depth` = how long along the road. Stripes run ALONG the road
// and tile ACROSS the width, so it reads as a zebra crossing.
function CrosswalkPiece({ mark, roads, selected }) {
  // Orient ACROSS the road: road heading + 90°.
  const yaw = useMemo(() => {
    let best = null, bd = Infinity;
    for (const r of roads) {
      if (r.kind === 'roundabout') continue;
      for (const p of (r.points || [])) {
        const d = Math.hypot(p.x - mark.x, p.z - mark.z);
        if (d < bd) { bd = d; best = r; }
      }
    }
    const base = best ? roadHeadingAt(best, mark) : 0;
    return base + Math.PI / 2 + (mark.yaw || 0);
  }, [mark, roads]);

  const width = mark.width || 0.6;   // span across the road
  const depth = mark.depth || 0.4;   // length along the road
  const span = width * 0.94;
  const n = Math.max(3, Math.round(span / 0.14));
  const stripeW = (span / n) * 0.55;
  const stripes = useMemo(() => {
    const a = [];
    for (let i = 0; i < n; i++) a.push(((i + 0.5) / n - 0.5) * span);
    return a;
  }, [n, span]);

  return (
    <group position={[mark.x, MARK_Y, mark.z]} rotation={[0, yaw, 0]}>
      {/* local +X runs across the road (width); local +Z runs along it (depth) */}
      {stripes.map((cx, i) => (
        <mesh key={i} position={[cx, 0, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[stripeW, depth]} />
          <meshStandardMaterial color="#f2f2f2" polygonOffset polygonOffsetFactor={-9} />
        </mesh>
      ))}
      {selected && (
        <mesh position={[0, 0.001, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[span * 1.1, depth * 1.35]} />
          <meshBasicMaterial color="#22d3ee" transparent opacity={0.22} />
        </mesh>
      )}
    </group>
  );
}

// ── Marking (textured quad on the road) ──────────────────────────────────────
function MarkingPiece({ mark, roads, selected }) {
  const mat = useMemo(() => materialProps(mark.kind, { transparent: true, tint: mark.color }), [mark.kind, mark.color]);
  // Magnet: orient to nearest road heading
  const yaw = useMemo(() => {
    if (!mark.magnet || !roads.length) return mark.yaw || 0;
    let best = null, bd = Infinity;
    for (const r of roads) for (const p of (r.points || [])) {
      const d = Math.hypot(p.x - mark.x, p.z - mark.z);
      if (d < bd) { bd = d; best = r; }
    }
    return best ? roadHeadingAt(best, mark) + (mark.yaw || 0) : (mark.yaw || 0);
  }, [mark, roads]);
  return (
    <group position={[mark.x, MARK_Y, mark.z]} rotation={[0, yaw, 0]}>
      <mesh rotation={[-Math.PI / 2, 0, 0]} scale={[mark.sx || 1, mark.sy || 1, 1]}>
        <planeGeometry args={[0.4, 0.4]} />
        <meshStandardMaterial {...mat} polygonOffset polygonOffsetFactor={-9} />
      </mesh>
      {selected && (
        <mesh rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.26, 0.3, 20]} />
          <meshBasicMaterial color="#22d3ee" />
        </mesh>
      )}
    </group>
  );
}

// ── Surface fill ─────────────────────────────────────────────────────────────
function SurfacePiece({ surface, roads, selected }) {
  const geom = useMemo(() => buildSurfacePatch(surface, roads), [surface, roads]);
  const mat  = useMemo(() => materialProps(surface.tex || 'asphalt', { transparent: surface.tex === 'zebra', tint: surface.color }), [surface.tex, surface.color]);
  if (!geom) return null;
  return (
    <mesh geometry={geom} receiveShadow>
      <meshStandardMaterial {...mat} polygonOffset polygonOffsetFactor={-2} side={2}
        emissive={selected ? '#22d3ee' : '#000000'} emissiveIntensity={selected ? 0.25 : 0} />
    </mesh>
  );
}

// ── Whole model ──────────────────────────────────────────────────────────────
export default function RoadView({ model, selectedId = null, showIntersections = true }) {
  const roads = model?.roads || [];
  const intersections = useMemo(
    () => (showIntersections ? findIntersections(roads) : []),
    [roads, showIntersections]
  );
  return (
    <group>
      {/* surfaces first (lowest), then roads, then markings */}
      {(model?.surfaces || []).map((s) => (
        <SurfacePiece key={s.id} surface={s} roads={roads} selected={s.id === selectedId} />
      ))}
      {roads.map((r) =>
        r.kind === 'roundabout'
          ? <RoundaboutPiece key={r.id} road={r} selected={r.id === selectedId} />
          : <RoadPiece key={r.id} road={r} selected={r.id === selectedId} />
      )}
      {intersections.map((h, i) => <IntersectionPiece key={`ix${i}`} hit={h} />)}
      {(model?.markings || []).map((m) =>
        m.kind === 'crosswalk'
          ? <CrosswalkPiece key={m.id} mark={m} roads={roads} selected={m.id === selectedId} />
          : <MarkingPiece key={m.id} mark={m} roads={roads} selected={m.id === selectedId} />
      )}
    </group>
  );
}
