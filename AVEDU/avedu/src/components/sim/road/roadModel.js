// =============================================================
// FILE: src/components/sim/road/roadModel.js
// PathPhalt-compatible data model for the road editor, kept as plain JS objects
// (not classes) so it lives comfortably in React state.
//
// Editor state shape:
//   {
//     roads:    [ Road ],      // Road = lane / path / line / roundabout
//     markings: [ Marking ],
//     surfaces: [ Surface ],   // surface-fill modifiers
//     background: { x, z, sx, sy, rot }
//   }
//
// Road:
//   { id, kind:'lane'|'path'|'line'|'roundabout',
//     curve:'centripetal'|'chordal'|'bspline',
//     tex:'wear2', texL:'', texR:'', lineOnly:false, shear:0,
//     radius?:number, width?:number,      // roundabout only
//     points:[ Point ] }
// Point: { id, x, z, width, prio }
// Marking: { id, kind:'arrow'|..., x, z, yaw, sx, sy, color, magnet, offsetX }
// Surface: { id, x, z, tex:'asphalt'|'zebra'|..., rot, color, fill, line... }
//
// Units are METERS (sim scale). PathPhalt JSON uses large units + a `pos`
// nesting + y; importPathPhalt() converts both ways.
// =============================================================

let _seq = 1;
export const uid = (p = 'r') => `${p}_${Date.now().toString(36)}_${(_seq++).toString(36)}`;

export const DEFAULT_WIDTH = 0.6;        // meters
export const CURVE_TYPES = ['centripetal', 'chordal', 'bspline'];
export const ROAD_TEXTURES = ['wear2', 'wear', 'asphalt', 'crossing', 'bus', 'bike', 'empty'];
export const LINE_TEXTURES = ['auto', 'continuous', 't1', 't2', 'yield', 'stop', 'used', 'line_parking', 'empty'];
export const SURFACE_TEXTURES = ['asphalt', 'zebra', 'damier', 'plain', 'empty'];
export const MARKING_TEXTURES = ['arrow', 'arrow_left', 'arrow_right', 'bus_place', 'bus_text', 'bike_sign'];

// PathPhalt uses ~50× larger units than our meters. Scale when importing/exporting
// its native JSON so the QCar (~0.4 m) still fits the roads.
const PP_SCALE = 50;

export function emptyModel() {
  return { roads: [], markings: [], surfaces: [], background: { x: 0, z: 0, sx: 1, sy: 1, rot: 0 } };
}

export function makePoint(x, z, width = DEFAULT_WIDTH, prio = 1) {
  return { id: uid('p'), x, z, width, prio };
}

export function makeRoad(kind, points, opts = {}) {
  return {
    id: uid('road'),
    kind,                                   // lane | path | line | roundabout
    curve: opts.curve || 'centripetal',
    tex: opts.tex || 'wear2',
    texL: opts.texL || '',
    texR: opts.texR || '',
    lineOnly: kind === 'line' ? true : !!opts.lineOnly,
    shear: opts.shear || 0,
    ...(kind === 'roundabout'
      ? { radius: opts.radius ?? 0.7, width: opts.width ?? DEFAULT_WIDTH }
      : {}),
    points,
  };
}

export function makeMarking(kind, x, z, opts = {}) {
  return {
    id: uid('mk'), kind, x, z,
    yaw: opts.yaw ?? 0, sx: opts.sx ?? 1, sy: opts.sy ?? 1,
    color: opts.color || '#ffffff', magnet: opts.magnet ?? true, offsetX: opts.offsetX ?? 0,
    // crosswalk-only sizing (ignored by other marking kinds)
    ...(kind === 'crosswalk' ? { width: opts.width ?? DEFAULT_WIDTH, depth: opts.depth ?? 0.4 } : {}),
  };
}

export function makeSurface(x, z, opts = {}) {
  return {
    id: uid('sf'), x, z,
    tex: opts.tex || 'asphalt', rot: opts.rot ?? 0, color: opts.color || '#ffffff',
    fill: opts.fill || '', lineTex: opts.lineTex || '', lineColor: opts.lineColor || '#ffffff',
    lineWidth: opts.lineWidth ?? 3, lineOffset: opts.lineOffset ?? 0,
  };
}

// ── Our native save shape (already in meters) ────────────────────────────────
export function toJSON(model) {
  return {
    version: '2.0',
    roads: model.roads,
    markings: model.markings,
    surfaces: model.surfaces,
    background: model.background,
  };
}

export function fromJSON(data) {
  if (!data) return emptyModel();
  // PathPhalt native file → detect by point.pos nesting or isRondPoint.
  if (Array.isArray(data.roads) && data.roads.some((r) => r.isRondPoint || (r.points && r.points[0] && r.points[0].pos))) {
    return importPathPhalt(data);
  }
  return {
    roads: (data.roads || []).map(normalizeRoad),
    markings: data.markings || [],
    surfaces: data.surfaces || [],
    background: data.background || { x: 0, z: 0, sx: 1, sy: 1, rot: 0 },
  };
}

function normalizeRoad(r) {
  return {
    id: r.id || uid('road'),
    kind: r.kind || (r.lineOnly ? 'line' : 'lane'),
    curve: r.curve || 'centripetal',
    tex: r.tex || 'wear2',
    texL: r.texL || '', texR: r.texR || '',
    lineOnly: !!r.lineOnly, shear: r.shear || 0,
    ...(r.kind === 'roundabout' || r.isRondPoint ? { radius: r.radius ?? 0.7, width: r.width ?? DEFAULT_WIDTH } : {}),
    points: (r.points || []).map((p) => ({
      id: p.id || uid('p'),
      x: p.x ?? p.pos?.x ?? 0,
      z: p.z ?? p.pos?.z ?? 0,
      width: p.width ?? DEFAULT_WIDTH,
      prio: p.prio ?? 1,
    })),
  };
}

// ── PathPhalt native import (large units, pos nesting, isRondPoint) ───────────
export function importPathPhalt(data) {
  const s = 1 / PP_SCALE;
  const roads = (data.roads || []).map((r) => ({
    id: uid('road'),
    kind: r.isRondPoint ? 'roundabout' : (r.lineOnly ? (r.tex === 'empty' ? 'line' : 'path') : 'lane'),
    curve: r.curve || 'centripetal',
    tex: r.tex || 'wear2',
    texL: r.texL || '', texR: r.texR || '',
    lineOnly: !!r.lineOnly, shear: r.shear || 0,
    ...(r.isRondPoint ? { radius: (r.radius ?? 50) * s, width: (r.width ?? 30) * s } : {}),
    points: (r.points || []).map((p) => ({
      id: uid('p'),
      x: (p.pos?.x ?? p.x ?? 0) * s,
      z: (p.pos?.z ?? p.z ?? 0) * s,
      width: (p.width ?? 30) * s,
      prio: p.prio ?? 1,
    })),
  }));
  return { roads, markings: [], surfaces: [], background: data.background || { x: 0, z: 0, sx: 1, sy: 1, rot: 0 } };
}

// Export back to PathPhalt's native JSON (so work round-trips to pathphalt.fr).
export function exportPathPhalt(model) {
  const S = PP_SCALE;
  return {
    roads: model.roads.map((r) => ({
      ...(r.kind === 'roundabout' ? { isRondPoint: true, radius: (r.radius ?? 0.7) * S, width: (r.width ?? DEFAULT_WIDTH) * S } : {}),
      prio: 1, curve: r.curve, sub: 40, shear: r.shear || 0,
      tex: r.tex, texL: r.texL || '', texR: r.texR || '', lineOnly: !!r.lineOnly,
      points: r.points.map((p) => ({
        id: 0, prio: p.prio ?? 1, width: (p.width ?? DEFAULT_WIDTH) * S, wLine: 5,
        texL: '', texR: '', pos: { x: p.x * S, y: 0, z: p.z * S },
      })),
      modLignes: [],
    })),
    modSols: [], markings: [],
    background: model.background,
  };
}
