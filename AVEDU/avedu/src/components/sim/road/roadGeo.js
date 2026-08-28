// =============================================================
// FILE: src/components/sim/road/roadGeo.js
// Geometry engine for the PathPhalt-style editor. Pure math + THREE buffer
// geometry (no React). Curve types, per-point-width ribbons, roundabout rings,
// intersection detection, and surface triangulation (delaunator + earcut).
// =============================================================
import * as THREE from 'three';
import Delaunator from 'delaunator';
import earcut from 'earcut';
import { DEFAULT_WIDTH } from './roadModel';

export const ROAD_Y = 0.012;
export const LANE_Y = 0.016;
export const MARK_Y = 0.018;
const SPS = 14; // samples per control-point span

// ── Curves ───────────────────────────────────────────────────────────────────
// Returns sampled centerline (array of THREE.Vector3, y=0) for a road's points.
// curve: 'centripetal' | 'chordal' | 'bspline'. <3 points → straight polyline.
export function sampleCenterline(points, curve = 'centripetal', sps = SPS) {
  if (!points || points.length < 2) return [];
  const vecs = points.map((p) => new THREE.Vector3(p.x, 0, p.z));
  if (vecs.length === 2) return vecs;

  if (curve === 'bspline') return sampleBSpline(vecs, sps);

  const type = curve === 'chordal' ? 'chordal' : 'centripetal';
  const c = new THREE.CatmullRomCurve3(vecs, false, type, 0.5);
  return c.getPoints(Math.max(2, (vecs.length - 1) * sps));
}

// Uniform cubic B-spline (approximating; doesn't pass through control points).
function sampleBSpline(vecs, sps) {
  const n = vecs.length;
  if (n < 3) return vecs;
  const pts = [];
  const total = (n - 1) * sps;
  const P = (i) => vecs[Math.max(0, Math.min(n - 1, i))];
  for (let s = 0; s <= total; s++) {
    const t = (s / total) * (n - 1);
    const i = Math.floor(t);
    const u = t - i;
    const p0 = P(i - 1), p1 = P(i), p2 = P(i + 1), p3 = P(i + 2);
    const u2 = u * u, u3 = u2 * u;
    const b0 = (-u3 + 3 * u2 - 3 * u + 1) / 6;
    const b1 = (3 * u3 - 6 * u2 + 4) / 6;
    const b2 = (-3 * u3 + 3 * u2 + 3 * u + 1) / 6;
    const b3 = u3 / 6;
    pts.push(new THREE.Vector3(
      b0 * p0.x + b1 * p1.x + b2 * p2.x + b3 * p3.x, 0,
      b0 * p0.z + b1 * p1.z + b2 * p2.z + b3 * p3.z,
    ));
  }
  return pts;
}

// Per-sample width aligned 1:1 with sampleCenterline (linear taper between pts).
export function sampleWidths(points, curve, sps = SPS, fallback = DEFAULT_WIDTH) {
  const w = points.map((p) => (typeof p.width === 'number' ? p.width : fallback));
  if (!points || points.length < 2) return w;
  if (points.length === 2) return w;
  const total = Math.max(2, (points.length - 1) * sps);
  const segs = points.length - 1;
  const out = [];
  for (let i = 0; i <= total; i++) {
    const t = (i / total) * segs;
    const seg = Math.min(segs - 1, Math.floor(t));
    out.push(w[seg] + (w[seg + 1] - w[seg]) * (t - seg));
  }
  return out;
}

// Left/right edge offsets for a centerline given per-sample widths + shear.
function edges(center, widths, shear = 0) {
  const left = [], right = [];
  for (let i = 0; i < center.length; i++) {
    const prev = center[Math.max(0, i - 1)];
    const next = center[Math.min(center.length - 1, i + 1)];
    const dir = new THREE.Vector3().subVectors(next, prev);
    dir.y = 0;
    if (dir.lengthSq() < 1e-9) dir.set(1, 0, 0);
    dir.normalize();
    const perp = new THREE.Vector3(dir.z, 0, -dir.x);
    const half = (widths[Math.min(i, widths.length - 1)] ?? DEFAULT_WIDTH) / 2;
    // shear shifts the whole ribbon sideways proportional to width (subtle)
    const off = shear * 0.02 * half;
    left.push(new THREE.Vector3(center[i].x + perp.x * (half + off), 0, center[i].z + perp.z * (half + off)));
    right.push(new THREE.Vector3(center[i].x - perp.x * (half - off), 0, center[i].z - perp.z * (half - off)));
  }
  return { left, right };
}

// ── Road surface ribbon ──────────────────────────────────────────────────────
export function buildRoadGeometry(road) {
  const { points, curve, shear = 0 } = road;
  const center = sampleCenterline(points, curve, SPS);
  if (center.length < 2) return null;
  const widths = sampleWidths(points, curve, SPS);
  const { left, right } = edges(center, widths, shear);

  const positions = [], uvs = [];
  let vRun = 0;
  for (let i = 0; i < center.length - 1; i++) {
    const l0 = left[i], r0 = right[i], l1 = left[i + 1], r1 = right[i + 1];
    const segLen = l0.distanceTo(l1);
    const v0 = vRun, v1 = vRun + segLen;
    positions.push(l0.x, ROAD_Y, l0.z, r0.x, ROAD_Y, r0.z, l1.x, ROAD_Y, l1.z);
    uvs.push(0, v0, 1, v0, 0, v1);
    positions.push(r0.x, ROAD_Y, r0.z, r1.x, ROAD_Y, r1.z, l1.x, ROAD_Y, l1.z);
    uvs.push(1, v0, 1, v1, 0, v1);
    vRun = v1;
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  g.computeVertexNormals();
  return g;
}

// Edge polylines (for left/right lane lines) and dashed centerline.
export function buildLines(road) {
  const { points, curve, shear = 0 } = road;
  const center = sampleCenterline(points, curve, SPS);
  if (center.length < 2) return { left: [], right: [], center: [] };
  const widths = sampleWidths(points, curve, SPS);
  const { left, right } = edges(center, widths, shear);
  return {
    left: left.map((v) => [v.x, LANE_Y, v.z]),
    right: right.map((v) => [v.x, LANE_Y, v.z]),
    center: center.map((v) => [v.x, LANE_Y, v.z]),
  };
}

// ── Roundabout ring road ─────────────────────────────────────────────────────
// Returns { surface, innerLine[], outerLine[] } for a ring of `radius` & `width`.
export function buildRoundabout(road) {
  const cx = road.points?.[0]?.x ?? 0;
  const cz = road.points?.[0]?.z ?? 0;
  const R = road.radius ?? 0.7;
  const W = road.width ?? DEFAULT_WIDTH;
  const ro = R + W / 2, ri = Math.max(0.02, R - W / 2);
  const seg = 48;
  const positions = [], uvs = [];
  const inner = [], outer = [];
  for (let i = 0; i <= seg; i++) {
    const a0 = (i / seg) * Math.PI * 2;
    const a1 = ((i + 1) / seg) * Math.PI * 2;
    const oi0 = [cx + Math.cos(a0) * ro, cz + Math.sin(a0) * ro];
    const ii0 = [cx + Math.cos(a0) * ri, cz + Math.sin(a0) * ri];
    const oi1 = [cx + Math.cos(a1) * ro, cz + Math.sin(a1) * ro];
    const ii1 = [cx + Math.cos(a1) * ri, cz + Math.sin(a1) * ri];
    positions.push(oi0[0], ROAD_Y, oi0[1], ii0[0], ROAD_Y, ii0[1], oi1[0], ROAD_Y, oi1[1]);
    positions.push(ii0[0], ROAD_Y, ii0[1], ii1[0], ROAD_Y, ii1[1], oi1[0], ROAD_Y, oi1[1]);
    uvs.push(0, i, 1, i, 0, i + 1, 1, i, 1, i + 1, 0, i + 1);
    outer.push([cx + Math.cos(a0) * ro, LANE_Y, cz + Math.sin(a0) * ro]);
    inner.push([cx + Math.cos(a0) * ri, LANE_Y, cz + Math.sin(a0) * ri]);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  g.computeVertexNormals();
  return { surface: g, innerLine: inner, outerLine: outer, center: [cx, cz], R, W };
}

// ── Intersections (centerline crossings) ─────────────────────────────────────
function segHit(a1, a2, b1, b2) {
  const d1x = a2.x - a1.x, d1z = a2.z - a1.z, d2x = b2.x - b1.x, d2z = b2.z - b1.z;
  const den = d1x * d2z - d1z * d2x;
  if (Math.abs(den) < 1e-9) return null;
  const tx = b1.x - a1.x, tz = b1.z - a1.z;
  const t = (tx * d2z - tz * d2x) / den, u = (tx * d1z - tz * d1x) / den;
  if (t < 0 || t > 1 || u < 0 || u > 1) return null;
  return { x: a1.x + t * d1x, z: a1.z + t * d1z };
}

export function findIntersections(roads) {
  const lines = roads
    .filter((r) => r.kind !== 'roundabout' && (r.points || []).length >= 2)
    .map((r) => ({ id: r.id, width: maxWidth(r), pts: sampleCenterline(r.points, r.curve, 8) }));
  const hits = [];
  for (let i = 0; i < lines.length; i++)
    for (let j = i + 1; j < lines.length; j++)
      for (let a = 0; a < lines[i].pts.length - 1; a++)
        for (let b = 0; b < lines[j].pts.length - 1; b++) {
          const p = segHit(lines[i].pts[a], lines[i].pts[a + 1], lines[j].pts[b], lines[j].pts[b + 1]);
          if (p && !hits.some((h) => Math.hypot(h.x - p.x, h.z - p.z) < 0.12)) {
            const hA = Math.atan2(lines[i].pts[a + 1].z - lines[i].pts[a].z, lines[i].pts[a + 1].x - lines[i].pts[a].x);
            const hB = Math.atan2(lines[j].pts[b + 1].z - lines[j].pts[b].z, lines[j].pts[b + 1].x - lines[j].pts[b].x);
            hits.push({ x: p.x, z: p.z, size: Math.max(lines[i].width, lines[j].width), headings: [hA, hB] });
          }
        }
  return hits;
}

function maxWidth(r) {
  return Math.max(...(r.points || []).map((p) => p.width ?? DEFAULT_WIDTH), DEFAULT_WIDTH);
}

// ── Surface fill (Delaunay-triangulated region around a click point) ──────────
// Triangulates the area enclosed by nearby road edges so a surface modifier can
// paint asphalt/zebra/etc. Simplified vs PathPhalt: builds a convex-ish patch
// from all road edge vertices within `range` of (x,z).
export function buildSurfacePatch(surface, roads, range = 2.0) {
  const verts = [];
  for (const r of roads) {
    if (r.kind === 'roundabout') continue;
    const { left, right } = (() => {
      const c = sampleCenterline(r.points, r.curve, 8);
      const w = sampleWidths(r.points, r.curve, 8);
      return edges(c, w, r.shear || 0);
    })();
    for (const v of [...left, ...right]) {
      if (Math.hypot(v.x - surface.x, v.z - surface.z) <= range) verts.push([v.x, v.z]);
    }
  }
  if (verts.length < 3) return null;
  try {
    const flat = verts.flat();
    const d = new Delaunator(flat);
    const positions = [];
    for (let i = 0; i < d.triangles.length; i += 3) {
      for (const ti of [i, i + 1, i + 2]) {
        const vi = d.triangles[ti];
        positions.push(verts[vi][0], ROAD_Y + 0.001, verts[vi][1]);
      }
    }
    if (!positions.length) return null;
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    g.computeVertexNormals();
    return g;
  } catch (e) {
    return null;
  }
}

// earcut-based polygon fill (for explicit polygon surfaces, future use).
export function triangulatePolygon(poly2d) {
  const flat = poly2d.flat();
  const idx = earcut(flat);
  const positions = [];
  for (const i of idx) positions.push(poly2d[i][0], ROAD_Y + 0.001, poly2d[i][1]);
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  g.computeVertexNormals();
  return g;
}

// Heading of a road at the point nearest p (to orient markings/crosswalks).
export function roadHeadingAt(road, p) {
  const c = sampleCenterline(road.points, road.curve, 10);
  if (c.length < 2) return 0;
  let bi = 0, bd = Infinity;
  for (let i = 0; i < c.length; i++) {
    const d = Math.hypot(c[i].x - p.x, c[i].z - p.z);
    if (d < bd) { bd = d; bi = i; }
  }
  const a = c[Math.max(0, bi - 1)], b = c[Math.min(c.length - 1, bi + 1)];
  return Math.atan2(b.z - a.z, b.x - a.x);
}

// ── Snapping ─────────────────────────────────────────────────────────────────
export function snapToGrid(p, grid = 0.1) {
  return { x: Math.round(p.x / grid) * grid, z: Math.round(p.z / grid) * grid };
}

export function snapToRoads(p, roads, radius = 0.25, excludeId = null) {
  let best = null, bestD = radius;
  const consider = (x, z, prio) => {
    const d = Math.hypot(x - p.x, z - p.z) - prio;
    if (d < bestD) { bestD = d; best = { x, z }; }
  };
  for (const r of roads) {
    if (r.id === excludeId) continue;
    const pts = r.points || [];
    if (pts.length) { consider(pts[0].x, pts[0].z, 0.05); consider(pts[pts.length - 1].x, pts[pts.length - 1].z, 0.05); }
    for (const v of sampleCenterline(pts, r.curve, 6)) consider(v.x, v.z, 0);
  }
  return best;
}

// Insert index: which control-point span a click lands on.
export function insertIndexForPoint(points, p) {
  if (!points || points.length < 2) return 0;
  let best = 0, bd = Infinity;
  for (let i = 0; i < points.length - 1; i++) {
    const a = points[i], b = points[i + 1];
    const abx = b.x - a.x, abz = b.z - a.z;
    const len2 = abx * abx + abz * abz || 1e-9;
    let t = ((p.x - a.x) * abx + (p.z - a.z) * abz) / len2;
    t = Math.max(0, Math.min(1, t));
    const d = Math.hypot(p.x - (a.x + t * abx), p.z - (a.z + t * abz));
    if (d < bd) { bd = d; best = i; }
  }
  return best;
}
