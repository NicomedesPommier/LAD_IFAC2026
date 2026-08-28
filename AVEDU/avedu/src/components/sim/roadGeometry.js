// =============================================================
// FILE: src/components/sim/roadGeometry.js
// Pure geometry helpers for drawing freeform roads (PathPhalt-style).
// No React / no Three components are rendered here — only math + buffer
// geometry construction — so MapCreator (editing) and MapRunner (running)
// build identical road surfaces from the same saved data.
//
// A road is stored as:
//   { id, points: [{x, z}, ...], width: 0.6, type: 'asphalt', curved: true }
// where points are control points in sim-world meters (x, z), y is always 0.
// =============================================================
import * as THREE from 'three';

export const DEFAULT_ROAD_WIDTH = 0.6;   // meters — ~1.5 QCar widths
export const ROAD_Y = 0.012;             // sits just above the floor image
export const LANE_Y = 0.016;             // lane markings just above the asphalt

// ── Centerline sampling ──────────────────────────────────────────────────────
// Returns an array of THREE.Vector3 (y = 0) sampled along the control points.
// `curved` → smooth Catmull-Rom spline; otherwise straight polyline.
export function sampleCenterline(points, curved = true, samplesPerSeg = 12) {
  if (!points || points.length < 2) return [];
  const vecs = points.map((p) => new THREE.Vector3(p.x, 0, p.z));

  if (!curved || vecs.length === 2) {
    // Straight polyline — just return the control points themselves.
    return vecs;
  }

  // Centripetal Catmull-Rom (matches PathPhalt): avoids loops/overshoot that
  // the uniform/'catmullrom' variant produces on uneven point spacing.
  const curve = new THREE.CatmullRomCurve3(vecs, false, 'centripetal');
  const total = Math.max(2, (vecs.length - 1) * samplesPerSeg);
  return curve.getPoints(total);
}

// Per-sample width aligned 1:1 with sampleCenterline(points, curved, samplesPerSeg).
// Each control point may carry its own `width`; widths are linearly interpolated
// between control points so the road tapers. Falls back to `fallback` when a
// point has no width. PathPhalt's Point(pos, width) model.
export function sampleWidths(points, curved, samplesPerSeg, fallback = DEFAULT_ROAD_WIDTH) {
  const w = points.map((p) => (typeof p.width === 'number' ? p.width : fallback));
  if (!points || points.length < 2) return w;

  if (!curved || points.length === 2) {
    // Straight: samples ARE the control points → widths map directly.
    return w;
  }
  // Spline: getPoints(total) yields total+1 evenly-parametrised samples across
  // the whole curve. Map each sample's global t to a control-point span and lerp.
  const total = Math.max(2, (points.length - 1) * samplesPerSeg);
  const segs = points.length - 1;
  const out = [];
  for (let i = 0; i <= total; i++) {
    const t = (i / total) * segs;        // 0..segs
    const seg = Math.min(segs - 1, Math.floor(t));
    const frac = t - seg;
    out.push(w[seg] + (w[seg + 1] - w[seg]) * frac);
  }
  return out;
}

// ── Road surface ribbon ──────────────────────────────────────────────────────
// Builds a flat triangle-strip ribbon centered on the sampled centerline. Width
// may vary per control point (taper). `width` is the fallback for points that
// don't carry their own. Returns a THREE.BufferGeometry in the X-Z plane.
const SAMPLES_PER_SEG = 12;
export function buildRoadGeometry(points, width = DEFAULT_ROAD_WIDTH, curved = true) {
  const center = sampleCenterline(points, curved, SAMPLES_PER_SEG);
  if (center.length < 2) return null;
  const widths = sampleWidths(points, curved, SAMPLES_PER_SEG, width);

  const positions = [];
  const uvs = [];
  const left = [];
  const right = [];

  // Per-vertex normal (perpendicular to the local direction, in X-Z plane).
  for (let i = 0; i < center.length; i++) {
    const prev = center[Math.max(0, i - 1)];
    const next = center[Math.min(center.length - 1, i + 1)];
    const dir = new THREE.Vector3().subVectors(next, prev);
    dir.y = 0;
    if (dir.lengthSq() < 1e-9) dir.set(1, 0, 0);
    dir.normalize();
    // perpendicular in X-Z: rotate dir by -90° around Y → (dir.z, 0, -dir.x)
    const perp = new THREE.Vector3(dir.z, 0, -dir.x);
    const half = (widths[Math.min(i, widths.length - 1)] ?? width) / 2;
    const l = new THREE.Vector3().copy(center[i]).addScaledVector(perp, half);
    const r = new THREE.Vector3().copy(center[i]).addScaledVector(perp, -half);
    left.push(l);
    right.push(r);
  }

  // Build two triangles per segment (left/right edges → quad).
  let vRun = 0;
  for (let i = 0; i < center.length - 1; i++) {
    const l0 = left[i], r0 = right[i], l1 = left[i + 1], r1 = right[i + 1];
    const segLen = l0.distanceTo(l1);
    const v0 = vRun;
    const v1 = vRun + segLen;
    // tri 1: l0, r0, l1
    positions.push(l0.x, ROAD_Y, l0.z, r0.x, ROAD_Y, r0.z, l1.x, ROAD_Y, l1.z);
    uvs.push(0, v0, 1, v0, 0, v1);
    // tri 2: r0, r1, l1
    positions.push(r0.x, ROAD_Y, r0.z, r1.x, ROAD_Y, r1.z, l1.x, ROAD_Y, l1.z);
    uvs.push(1, v0, 1, v1, 0, v1);
    vRun = v1;
  }

  const geom = new THREE.BufferGeometry();
  geom.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geom.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  geom.computeVertexNormals();
  return geom;
}

// ── Dashed center line ───────────────────────────────────────────────────────
// Returns an array of small quad geometries (one per dash) for the road's
// centerline. Kept simple: short segments spaced along the centerline.
export function buildCenterLinePoints(points, curved = true) {
  const center = sampleCenterline(points, curved, 16);
  return center.map((v) => [v.x, LANE_Y, v.z]);
}

// ── Snapping ─────────────────────────────────────────────────────────────────
export function snapToGrid(p, grid = 0.1) {
  return { x: Math.round(p.x / grid) * grid, z: Math.round(p.z / grid) * grid };
}

// Returns the nearest snap target across all roads' control points + sampled
// centerlines within `radius` of `p`, or null. Lets new/edited points latch onto
// existing road endpoints (priority) and mid-road lines (T-junctions).
export function snapToRoads(p, roads, radius = 0.2, excludeRoadId = null) {
  let best = null;
  let bestD = radius;
  const consider = (x, z, priority) => {
    const d = Math.hypot(x - p.x, z - p.z) - priority; // priority shrinks effective distance
    if (d < bestD) { bestD = d; best = { x, z }; }
  };
  for (const road of roads) {
    if (road.id === excludeRoadId) continue;
    // Endpoints get priority (0.05 m bonus) so junctions snap to ends first.
    const pts = road.points || [];
    if (pts.length) {
      consider(pts[0].x, pts[0].z, 0.05);
      consider(pts[pts.length - 1].x, pts[pts.length - 1].z, 0.05);
    }
    // Mid-road: sampled centerline points.
    const center = sampleCenterline(pts, road.curved, 8);
    for (const v of center) consider(v.x, v.z, 0);
  }
  return best;
}

// ── Intersection detection ───────────────────────────────────────────────────
// Returns world points {x,z} where any two road centerlines cross. Used to drop
// asphalt intersection patches. Compares sampled segments pairwise.
function segIntersect(a1, a2, b1, b2) {
  const d1x = a2.x - a1.x, d1z = a2.z - a1.z;
  const d2x = b2.x - b1.x, d2z = b2.z - b1.z;
  const denom = d1x * d2z - d1z * d2x;
  if (Math.abs(denom) < 1e-9) return null; // parallel
  const tx = b1.x - a1.x, tz = b1.z - a1.z;
  const t = (tx * d2z - tz * d2x) / denom;
  const u = (tx * d1z - tz * d1x) / denom;
  if (t < 0 || t > 1 || u < 0 || u > 1) return null;
  return { x: a1.x + t * d1x, z: a1.z + t * d1z };
}

export function findIntersections(roads) {
  const lines = roads
    .filter((r) => (r.points || []).length >= 2)
    .map((r) => ({ id: r.id, width: r.width || DEFAULT_ROAD_WIDTH, pts: sampleCenterline(r.points, r.curved, 10) }));
  const hits = [];
  for (let i = 0; i < lines.length; i++) {
    for (let j = i + 1; j < lines.length; j++) {
      const A = lines[i], B = lines[j];
      for (let a = 0; a < A.pts.length - 1; a++) {
        for (let b = 0; b < B.pts.length - 1; b++) {
          const p = segIntersect(A.pts[a], A.pts[a + 1], B.pts[b], B.pts[b + 1]);
          if (p) {
            // Skip near-duplicate hits (same crossing sampled twice).
            if (!hits.some((h) => Math.hypot(h.x - p.x, h.z - p.z) < 0.15)) {
              const headA = Math.atan2(A.pts[a + 1].z - A.pts[a].z, A.pts[a + 1].x - A.pts[a].x);
              const headB = Math.atan2(B.pts[b + 1].z - B.pts[b].z, B.pts[b + 1].x - B.pts[b].x);
              hits.push({
                x: p.x, z: p.z,
                size: Math.max(A.width, B.width),
                widthA: A.width, widthB: B.width,
                headings: [headA, headB],
              });
            }
          }
        }
      }
    }
  }
  return hits;
}

// Heading (radians, around Y) of a road at the point nearest to `p`. Used to
// orient a crosswalk across the road.
export function roadHeadingAt(road, p) {
  const center = sampleCenterline(road.points, road.curved, 12);
  if (center.length < 2) return 0;
  let bestI = 0, bestD = Infinity;
  for (let i = 0; i < center.length; i++) {
    const d = Math.hypot(center[i].x - p.x, center[i].z - p.z);
    if (d < bestD) { bestD = d; bestI = i; }
  }
  const a = center[Math.max(0, bestI - 1)];
  const b = center[Math.min(center.length - 1, bestI + 1)];
  return Math.atan2(b.z - a.z, b.x - a.x);
}

// Given a click point near a road, returns the index in `points` AFTER which a
// new control point should be inserted (i.e. the clicked segment's start index),
// by finding the closest control-point segment to the click. Used for mid-road
// node insertion when editing.
export function insertIndexForPoint(points, p) {
  if (!points || points.length < 2) return 0;
  let best = 0, bestD = Infinity;
  for (let i = 0; i < points.length - 1; i++) {
    const a = points[i], b = points[i + 1];
    // distance from p to segment a-b
    const abx = b.x - a.x, abz = b.z - a.z;
    const apx = p.x - a.x, apz = p.z - a.z;
    const len2 = abx * abx + abz * abz || 1e-9;
    let t = (apx * abx + apz * abz) / len2;
    t = Math.max(0, Math.min(1, t));
    const cx = a.x + t * abx, cz = a.z + t * abz;
    const d = Math.hypot(p.x - cx, p.z - cz);
    if (d < bestD) { bestD = d; best = i; }
  }
  return best; // insert after this index
}

// ── Edge outline points (for the two side lines) ─────────────────────────────
export function buildEdgePoints(points, width = DEFAULT_ROAD_WIDTH, curved = true) {
  const SPS = 16;
  const center = sampleCenterline(points, curved, SPS);
  if (center.length < 2) return { left: [], right: [] };
  const widths = sampleWidths(points, curved, SPS, width);
  const left = [];
  const right = [];
  for (let i = 0; i < center.length; i++) {
    const prev = center[Math.max(0, i - 1)];
    const next = center[Math.min(center.length - 1, i + 1)];
    const dir = new THREE.Vector3().subVectors(next, prev);
    dir.y = 0;
    if (dir.lengthSq() < 1e-9) dir.set(1, 0, 0);
    dir.normalize();
    const perp = new THREE.Vector3(dir.z, 0, -dir.x);
    const half = (widths[Math.min(i, widths.length - 1)] ?? width) / 2;
    left.push([center[i].x + perp.x * half, LANE_Y, center[i].z + perp.z * half]);
    right.push([center[i].x - perp.x * half, LANE_Y, center[i].z - perp.z * half]);
  }
  return { left, right };
}
