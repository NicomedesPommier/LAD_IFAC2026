// =============================================================
// FILE: src/components/sim/road/RoadEditor.jsx
// PathPhalt-style road editor, restyled to the app's dark theme.
//
//   • Left icon toolbar: Lane · Path · Line · Roundabout · Marking · Surface
//   • Top-down 3D canvas (Three.js) — drivable meter-scale roads
//   • Floating right properties panel for the selected element
//   • Shortcuts:  Ctrl+click add point · Shift+click marking
//                 Ctrl+Shift+click roundabout · [space] hide helpers · Esc deselect
//
// Owns a road `model` (see roadModel.js). Calls onChange(model) so a parent
// (MapCreator) can persist it alongside the floor image / spawn / waypoints.
// =============================================================
import React, { useState, useEffect, useRef, useCallback, useMemo, Suspense } from 'react';
import { Canvas, useLoader } from '@react-three/fiber';
import { OrbitControls, Grid } from '@react-three/drei';
import * as THREE from 'three';

import RoadView from './RoadView';
import {
  emptyModel, makePoint, makeRoad, makeMarking, makeSurface,
  CURVE_TYPES, ROAD_TEXTURES, MARKING_TEXTURES, SURFACE_TEXTURES, DEFAULT_WIDTH,
} from './roadModel';
import { snapToGrid, snapToRoads, insertIndexForPoint, sampleCenterline } from './roadGeo';
import { missingTextures } from './textures';

const GROUND = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);

// ── Tool definitions (left toolbar) ──────────────────────────────────────────
const TOOLS = [
  { id: 'select',     icon: '⤢', label: 'Select',     hint: 'Click an element to edit it' },
  { id: 'lane',       icon: '🛣', label: 'Lane',       hint: 'Click to add points · Enter to finish' },
  { id: 'path',       icon: '〰', label: 'Path',       hint: 'Textured curve (no lines)' },
  { id: 'line',       icon: '┃', label: 'Line',       hint: 'A guide line (lines only)' },
  { id: 'roundabout', icon: '◎', label: 'Roundabout', hint: 'Click to drop a ring road' },
  { id: 'crosswalk',  icon: '╫', label: 'Crosswalk',  hint: 'Click a road to drop a zebra crossing' },
  { id: 'marking',    icon: '➤', label: 'Marking',    hint: 'Click a road to drop a marking' },
  { id: 'surface',    icon: '▦', label: 'Surface',    hint: 'Click an enclosed area to fill' },
];
// Extra map tools shown only when the host supplies mapTools (spawn / waypoints).
const MAP_TOOLS = [
  { id: 'spawn',    icon: '🚗', label: 'Spawn',    hint: 'Click the map to set the car spawn point' },
  { id: 'waypoint', icon: '📍', label: 'Waypoint', hint: 'Click the map to add route waypoints' },
];
const DRAW_KINDS = { lane: 'lane', path: 'path', line: 'line' };

// ── Invisible ground plane that captures clicks/moves ────────────────────────
function GroundCatcher({ onClick, onMove }) {
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.001, 0]} onClick={onClick} onPointerMove={onMove}>
      <planeGeometry args={[400, 400]} />
      <meshBasicMaterial transparent opacity={0} depthWrite={false} />
    </mesh>
  );
}

// ── Draggable node handle (pointer-drag onto ground plane) ───────────────────
function NodeHandle({ x, z, color, big, onDown, onMove, onUp, onClick }) {
  const dragging = useRef(false);
  const hit = useRef(new THREE.Vector3());
  return (
    <mesh
      position={[x, big ? 0.09 : 0.06, z]}
      onClick={(e) => { e.stopPropagation(); onClick?.(); }}
      onPointerDown={(e) => { e.stopPropagation(); dragging.current = true; e.target?.setPointerCapture?.(e.pointerId); onDown?.(); }}
      onPointerMove={(e) => { if (!dragging.current) return; e.stopPropagation(); if (e.ray.intersectPlane(GROUND, hit.current)) onMove?.(hit.current.x, hit.current.z); }}
      onPointerUp={(e) => { if (!dragging.current) return; e.stopPropagation(); dragging.current = false; e.target?.releasePointerCapture?.(e.pointerId); onUp?.(); }}
    >
      <sphereGeometry args={[big ? 0.1 : 0.07, 16, 16]} />
      <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.5} />
    </mesh>
  );
}

// ── Floor-image backdrop (so you draw roads ON the map you're building) ──────
function FloorBackdrop({ url, width, height }) {
  const texture = useLoader(THREE.TextureLoader, url);
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.002, 0]}>
      <planeGeometry args={[width, height]} />
      <meshStandardMaterial map={texture} />
    </mesh>
  );
}

// ── Editor scene (inside the Canvas) ─────────────────────────────────────────
function EditorScene({
  model, tool, draft, hover, selected, controlsRef, backdrop,
  onGroundClick, onGroundMove, onSelectRoad, onSelectNode,
  onNodeMove, onNodeUp, onDragStart,
}) {
  const fitDist = 12;
  const selRoad = model.roads.find((r) => r.id === selected?.roadId);
  return (
    <>
      <ambientLight intensity={0.7} />
      <directionalLight position={[8, 14, 6]} intensity={1} />
      <Grid args={[60, 60]} position={[0, 0, 0]} sectionColor="#1c3a52" cellColor="#15212e" fadeDistance={40} infiniteGrid />
      <GroundCatcher onClick={onGroundClick} onMove={onGroundMove} />

      {/* Map backdrop: floor image + spawn car + waypoints from the Map Creator */}
      {backdrop?.imageUrl && (
        <Suspense fallback={null}>
          <FloorBackdrop url={backdrop.imageUrl} width={backdrop.width || 20} height={backdrop.height || 20} />
        </Suspense>
      )}
      {backdrop?.spawn && (
        <group position={[backdrop.spawn.x, 0.05, backdrop.spawn.z]} rotation={[0, (backdrop.spawn.yawDeg || 0) * Math.PI / 180, 0]}>
          <mesh><boxGeometry args={[0.415, 0.08, 0.182]} /><meshStandardMaterial color="#00ff88" transparent opacity={0.7} /></mesh>
          <mesh position={[0.18, 0, 0]}><boxGeometry args={[0.05, 0.09, 0.19]} /><meshStandardMaterial color="#fff" transparent opacity={0.9} /></mesh>
        </group>
      )}
      {(backdrop?.waypoints || []).map((w, i) => (
        <mesh key={i} position={[w.x, 0.06, w.z]}>
          <sphereGeometry args={[0.08, 12, 12]} />
          <meshStandardMaterial color={i === 0 ? '#22c55e' : '#22d3ee'} emissive={i === 0 ? '#16a34a' : '#0891b2'} emissiveIntensity={0.6} />
        </mesh>
      ))}

      <Suspense fallback={null}>
        <RoadView model={model} selectedId={selected?.roadId || selected?.id} />
      </Suspense>

      {/* Draft (road being drawn) */}
      {draft.length > 0 && (
        <>
          <RoadView
            model={{ roads: [makeRoad(DRAW_KINDS[tool] || 'lane', hover ? [...draft, hover] : draft)], markings: [], surfaces: [] }}
            showIntersections={false}
          />
          {draft.map((p, i) => (
            <mesh key={i} position={[p.x, 0.05, p.z]}>
              <sphereGeometry args={[0.06, 12, 12]} />
              <meshStandardMaterial color="#a855f7" emissive="#7c3aed" emissiveIntensity={0.7} />
            </mesh>
          ))}
        </>
      )}

      {/* Select-mode node handles for the selected road */}
      {tool === 'select' && selRoad && selRoad.kind !== 'roundabout' && selRoad.points.map((p, i) => (
        <NodeHandle key={`${selRoad.id}_${i}`} x={p.x} z={p.z}
          big={i === selected?.nodeIdx}
          color={i === selected?.nodeIdx ? '#f59e0b' : '#22d3ee'}
          onClick={() => onSelectNode(i)}
          onDown={() => { onDragStart(); onSelectNode(i); }}
          onMove={(nx, nz) => onNodeMove(selRoad.id, i, nx, nz)}
          onUp={() => onNodeUp(selRoad.id, i)} />
      ))}

      <OrbitControls ref={controlsRef} makeDefault enableRotate={false} enablePan enableZoom
        target={[0, 0, 0]} minDistance={1} maxDistance={fitDist * 4} />
    </>
  );
}

// ── Main editor ──────────────────────────────────────────────────────────────
export default function RoadEditor({ value, onChange, backdrop, leftExtras, mapTools }) {
  const [model, setModel] = useState(() => value || emptyModel());
  const [tool, setTool] = useState('select');
  const [draft, setDraft] = useState([]);
  const [hover, setHover] = useState(null);
  const [selected, setSelected] = useState(null); // {roadId, nodeIdx} | {id} (marking/surface)
  const [width, setWidth] = useState(DEFAULT_WIDTH);
  const [curve, setCurve] = useState('centripetal');
  const [roadTex, setRoadTex] = useState('wear2');
  const [markTex, setMarkTex] = useState('arrow');
  const [showHelpers, setShowHelpers] = useState(true);
  const controlsRef = useRef(null);

  const missing = useMemo(() => missingTextures(), []);

  // push model up to parent
  const commit = useCallback((m) => { setModel(m); onChange?.(m); }, [onChange]);

  // sync if parent value changes (e.g. load)
  useEffect(() => { if (value) setModel(value); }, [value]);

  const isDrawing = !!DRAW_KINDS[tool];

  const snap = useCallback((raw) => {
    const onRoad = snapToRoads(raw, model.roads, 0.25);
    return onRoad || snapToGrid(raw, 0.1);
  }, [model.roads]);

  const finishDraft = useCallback(() => {
    if (draft.length >= 2) {
      const road = makeRoad(DRAW_KINDS[tool], draft, { curve, tex: roadTex });
      commit({ ...model, roads: [...model.roads, road] });
    }
    setDraft([]); setHover(null);
  }, [draft, tool, curve, roadTex, model, commit]);

  // keyboard shortcuts
  useEffect(() => {
    const onKey = (e) => {
      if (e.code === 'Space' && e.target === document.body) { e.preventDefault(); setShowHelpers((s) => !s); }
      else if (e.key === 'Enter' && isDrawing) { e.preventDefault(); finishDraft(); }
      else if (e.key === 'Escape') { setDraft([]); setHover(null); setSelected(null); }
      else if (e.key === 'Backspace' && isDrawing && draft.length) { e.preventDefault(); setDraft((d) => d.slice(0, -1)); }
      else if ((e.key === 'Delete' || e.key === 'Backspace') && tool === 'select' && selected) { e.preventDefault(); deleteSelected(); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isDrawing, draft, finishDraft, tool, selected]);

  // ── ground interaction ─────────────────────────────────────────────────────
  const onGroundClick = (e) => {
    e.stopPropagation();
    const p = { x: e.point.x, z: e.point.z };
    const ctrl = e.nativeEvent.ctrlKey || e.nativeEvent.metaKey;
    const shift = e.nativeEvent.shiftKey;

    // Map tools (spawn / waypoints) — only when host provides them
    if (tool === 'spawn' && mapTools?.setSpawn) {
      const c = snapToGrid(p, 0.25);
      mapTools.setSpawn((s) => ({ ...s, x: c.x, z: c.z }));
      return;
    }
    if (tool === 'waypoint' && mapTools?.setWaypoints) {
      const c = snapToGrid(p, 0.25);
      mapTools.setWaypoints((w) => [...w, { x: c.x, z: c.z }]);
      return;
    }

    // PathPhalt shortcuts (work regardless of active tool)
    if (ctrl && shift) { dropRoundabout(p); return; }
    if (shift)         { dropMarking(p); return; }

    if (isDrawing || (ctrl && tool === 'select')) {
      setDraft((d) => [...d, { ...snap(p), width }]);
      return;
    }
    if (tool === 'roundabout') { dropRoundabout(p); return; }
    if (tool === 'crosswalk')  { dropCrosswalk(p); return; }
    if (tool === 'marking')    { dropMarking(p); return; }
    if (tool === 'surface')    { dropSurface(p); return; }
    if (tool === 'select')     { setSelected(null); } // click empty → deselect
  };

  const onGroundMove = (e) => {
    if (!isDrawing || draft.length === 0) return;
    e.stopPropagation();
    setHover({ ...snap({ x: e.point.x, z: e.point.z }), width });
  };

  // ── drops ──────────────────────────────────────────────────────────────────
  const dropRoundabout = (p) => {
    const onRoad = snapToRoads(p, model.roads, 0.6);
    const c = onRoad || snapToGrid(p, 0.1);
    const r = makeRoad('roundabout', [makePoint(c.x, c.z, width)], { tex: roadTex, radius: Math.max(0.45, width * 1.3), width });
    commit({ ...model, roads: [...model.roads, r] });
    setTool('select'); setSelected({ roadId: r.id });
  };
  const dropCrosswalk = (p) => {
    // Snap onto the nearest road and size the crossing to that road's width.
    const onRoad = snapToRoads(p, model.roads, 0.6);
    const c = onRoad || snapToGrid(p, 0.1);
    let roadW = width;
    let bd = Infinity;
    for (const r of model.roads) {
      if (r.kind === 'roundabout') continue;
      for (const pt of (r.points || [])) {
        const d = Math.hypot(pt.x - c.x, pt.z - c.z);
        if (d < bd) { bd = d; roadW = pt.width ?? r.width ?? width; }
      }
    }
    const m = makeMarking('crosswalk', c.x, c.z, { magnet: true, width: roadW, depth: 0.4 });
    commit({ ...model, markings: [...model.markings, m] });
    setTool('select'); setSelected({ id: m.id });
  };
  const dropMarking = (p) => {
    const c = snapToGrid(p, 0.1);
    const m = makeMarking(markTex, c.x, c.z, { magnet: true });
    commit({ ...model, markings: [...model.markings, m] });
    setTool('select'); setSelected({ id: m.id });
  };
  const dropSurface = (p) => {
    const c = snapToGrid(p, 0.1);
    const s = makeSurface(c.x, c.z, { tex: 'asphalt' });
    commit({ ...model, surfaces: [...model.surfaces, s] });
    setTool('select'); setSelected({ id: s.id });
  };

  // ── node editing ────────────────────────────────────────────────────────────
  const onDragStart = () => { if (controlsRef.current) controlsRef.current.enabled = false; };
  const onNodeMove = (roadId, idx, x, z) => {
    setModel((m) => ({ ...m, roads: m.roads.map((r) => r.id !== roadId ? r : { ...r, points: r.points.map((pt, i) => i === idx ? { ...pt, x, z } : pt) }) }));
  };
  const onNodeUp = (roadId, idx) => {
    if (controlsRef.current) controlsRef.current.enabled = true;
    setModel((m) => {
      const nm = { ...m, roads: m.roads.map((r) => {
        if (r.id !== roadId) return r;
        const raw = r.points[idx];
        const s = snapToRoads(raw, m.roads, 0.25, roadId) || snapToGrid(raw, 0.1);
        return { ...r, points: r.points.map((pt, i) => i === idx ? { ...pt, x: Math.round(s.x * 100) / 100, z: Math.round(s.z * 100) / 100 } : pt) };
      }) };
      onChange?.(nm);
      return nm;
    });
  };

  // Select the road whose centerline is closest to the click — but only if the
  // click actually lands on/near a road (within ~half a wide road). Clicking
  // empty space deselects.
  const selectRoadAt = (p) => {
    let best = null, bd = Infinity;
    for (const r of model.roads) {
      if (r.kind === 'roundabout') {
        const c = r.points?.[0];
        if (!c) continue;
        const ring = Math.abs(Math.hypot(p.x - c.x, p.z - c.z) - (r.radius ?? 0.7));
        if (ring < (r.width ?? 0.6) && ring < bd) { bd = ring; best = r; }
        continue;
      }
      for (const v of sampleCenterline(r.points, r.curve, 8)) {
        const half = Math.max(...r.points.map((pt) => pt.width ?? 0.6), 0.6) / 2 + 0.15;
        const d = Math.hypot(v.x - p.x, v.z - p.z);
        if (d < half && d < bd) { bd = d; best = r; }
      }
    }
    setSelected(best ? { roadId: best.id } : null);
  };

  // mutate selected element
  const patchSelectedRoad = (patch) => {
    if (!selected?.roadId) return;
    commit({ ...model, roads: model.roads.map((r) => r.id === selected.roadId ? { ...r, ...patch } : r) });
  };
  const patchSelectedNode = (patch) => {
    if (!selected?.roadId || selected.nodeIdx == null) return;
    commit({ ...model, roads: model.roads.map((r) => r.id !== selected.roadId ? r : { ...r, points: r.points.map((pt, i) => i === selected.nodeIdx ? { ...pt, ...patch } : pt) }) });
  };
  const patchSelectedMarking = (patch) => {
    if (!selected?.id) return;
    commit({ ...model, markings: model.markings.map((m) => m.id === selected.id ? { ...m, ...patch } : m), surfaces: model.surfaces.map((s) => s.id === selected.id ? { ...s, ...patch } : s) });
  };

  const deleteSelected = () => {
    if (selected?.roadId && selected.nodeIdx != null) {
      // delete a node (or whole road if <2 left)
      commit({ ...model, roads: model.roads.flatMap((r) => {
        if (r.id !== selected.roadId) return [r];
        if (r.points.length <= 2) return [];
        return [{ ...r, points: r.points.filter((_, i) => i !== selected.nodeIdx) }];
      }) });
      setSelected({ roadId: selected.roadId });
    } else if (selected?.roadId) {
      commit({ ...model, roads: model.roads.filter((r) => r.id !== selected.roadId) });
      setSelected(null);
    } else if (selected?.id) {
      commit({ ...model, markings: model.markings.filter((m) => m.id !== selected.id), surfaces: model.surfaces.filter((s) => s.id !== selected.id) });
      setSelected(null);
    }
  };

  const selRoad = model.roads.find((r) => r.id === selected?.roadId);
  const selNode = selRoad && selected?.nodeIdx != null ? selRoad.points[selected.nodeIdx] : null;
  const selMarking = model.markings.find((m) => m.id === selected?.id);
  const selSurface = model.surfaces.find((s) => s.id === selected?.id);

  return (
    <div style={{ display: 'flex', height: '100%', position: 'relative', background: '#0a1018' }}>
      {/* ── Left toolbar ──────────────────────────────────────────── */}
      <div style={S.toolbar}>
        {[...TOOLS, ...(mapTools ? MAP_TOOLS : [])].map((t) => (
          <button key={t.id} title={t.hint}
            onClick={() => { setDraft([]); setHover(null); setSelected(null); setTool(t.id); }}
            style={{ ...S.toolBtn, ...(tool === t.id ? S.toolBtnActive : {}) }}>
            <span style={{ fontSize: 20, lineHeight: 1 }}>{t.icon}</span>
            <span style={{ fontSize: 9, marginTop: 3 }}>{t.label}</span>
          </button>
        ))}
      </div>

      {/* ── Canvas ────────────────────────────────────────────────── */}
      <div style={{ flex: 1, position: 'relative' }}>
        <Canvas camera={{ position: [0, 12, 0.01], fov: 50 }} style={{ background: '#0a1018' }}
          onPointerMissed={() => { if (tool === 'select') setSelected(null); }}>
          <EditorScene
            model={model} tool={tool} draft={draft} hover={hover} selected={selected}
            controlsRef={controlsRef} backdrop={backdrop}
            onGroundClick={(e) => { onGroundClick(e); if (tool === 'select' && !(e.nativeEvent.ctrlKey || e.nativeEvent.metaKey || e.nativeEvent.shiftKey)) selectRoadAt({ x: e.point.x, z: e.point.z }); }}
            onGroundMove={onGroundMove}
            onSelectNode={(i) => setSelected((s) => ({ roadId: selRoad?.id || s?.roadId, nodeIdx: i }))}
            onNodeMove={onNodeMove} onNodeUp={onNodeUp} onDragStart={onDragStart}
          />
        </Canvas>

        {/* Helper overlay */}
        {showHelpers && (
          <div style={S.help}>
            <div><Key>Ctrl</Key> + click — add point</div>
            <div><Key>Shift</Key> + click — marking</div>
            <div><Key>Ctrl</Key>+<Key>Shift</Key> + click — roundabout</div>
            <div><Key>Space</Key> — hide helpers · <Key>Enter</Key> finish · <Key>Esc</Key> cancel</div>
          </div>
        )}

        {/* Current tool hint */}
        <div style={S.toolHint}>
          {TOOLS.find((t) => t.id === tool)?.icon} {TOOLS.find((t) => t.id === tool)?.label}
          {isDrawing && draft.length > 0 && ` — ${draft.length} pts (Enter to finish)`}
        </div>

        {missing.length > 0 && (
          <div style={S.texHint}>{missing.length} textures missing → flat colors. Drop files in src/components/roadtextures/</div>
        )}
      </div>

      {/* ── Right properties panel ────────────────────────────────── */}
      <div style={S.props}>
        {/* Host-supplied map controls (floor image / spawn / waypoints / save) */}
        {leftExtras}

        {/* Drawing defaults (always visible) */}
        <div style={S.card}>
          <div style={S.cardTitle}>New road</div>
          <Label>Width: {width.toFixed(2)} m</Label>
          <input type="range" min={0.2} max={2.5} step={0.05} value={width} onChange={(e) => setWidth(+e.target.value)} style={S.range} />
          <Label>Curve</Label>
          <select value={curve} onChange={(e) => setCurve(e.target.value)} style={S.select}>
            {CURVE_TYPES.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
          <Label>Texture</Label>
          <select value={roadTex} onChange={(e) => setRoadTex(e.target.value)} style={S.select}>
            {ROAD_TEXTURES.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
          {tool === 'marking' && <>
            <Label>Marking</Label>
            <select value={markTex} onChange={(e) => setMarkTex(e.target.value)} style={S.select}>
              {MARKING_TEXTURES.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          </>}
        </div>

        {/* Selected ROAD */}
        {selRoad && selRoad.kind !== 'roundabout' && (
          <div style={S.card}>
            <div style={S.cardTitle}>Road · {selRoad.kind}</div>
            <Label>Curve</Label>
            <select value={selRoad.curve} onChange={(e) => patchSelectedRoad({ curve: e.target.value })} style={S.select}>
              {CURVE_TYPES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
            <Label>Texture</Label>
            <select value={selRoad.tex} onChange={(e) => patchSelectedRoad({ tex: e.target.value })} style={S.select}>
              {ROAD_TEXTURES.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
            <Label>Shear: {selRoad.shear}</Label>
            <input type="range" min={-10} max={10} step={1} value={selRoad.shear} onChange={(e) => patchSelectedRoad({ shear: +e.target.value })} style={S.range} />
            <label style={S.check}><input type="checkbox" checked={!!selRoad.lineOnly} onChange={(e) => patchSelectedRoad({ lineOnly: e.target.checked })} /> Line only</label>
            <button style={S.del} onClick={() => { setSelected({ roadId: selRoad.id }); deleteSelected(); }}>Delete road</button>
          </div>
        )}

        {/* Selected ROUNDABOUT */}
        {selRoad && selRoad.kind === 'roundabout' && (
          <div style={S.card}>
            <div style={S.cardTitle}>Roundabout</div>
            <Label>Radius: {(selRoad.radius ?? 0.7).toFixed(2)} m</Label>
            <input type="range" min={0.3} max={4} step={0.05} value={selRoad.radius ?? 0.7} onChange={(e) => patchSelectedRoad({ radius: +e.target.value })} style={S.range} />
            <Label>Width: {(selRoad.width ?? DEFAULT_WIDTH).toFixed(2)} m</Label>
            <input type="range" min={0.2} max={2} step={0.05} value={selRoad.width ?? DEFAULT_WIDTH} onChange={(e) => patchSelectedRoad({ width: +e.target.value })} style={S.range} />
            <button style={S.del} onClick={() => { setSelected({ roadId: selRoad.id }); deleteSelected(); }}>Delete roundabout</button>
          </div>
        )}

        {/* Selected NODE */}
        {selNode && (
          <div style={S.card}>
            <div style={S.cardTitle}>Point {selected.nodeIdx + 1}</div>
            <Label>Width: {(selNode.width ?? DEFAULT_WIDTH).toFixed(2)} m</Label>
            <input type="range" min={0.2} max={2.5} step={0.05} value={selNode.width ?? DEFAULT_WIDTH} onChange={(e) => patchSelectedNode({ width: +e.target.value })} style={S.range} />
            <button style={S.del} onClick={deleteSelected}>Delete point</button>
          </div>
        )}

        {/* Selected CROSSWALK */}
        {selMarking && selMarking.kind === 'crosswalk' && (
          <div style={S.card}>
            <div style={S.cardTitle}>Crosswalk</div>
            <Label>Width (across): {(selMarking.width ?? DEFAULT_WIDTH).toFixed(2)} m</Label>
            <input type="range" min={0.3} max={2.5} step={0.05} value={selMarking.width ?? DEFAULT_WIDTH} onChange={(e) => patchSelectedMarking({ width: +e.target.value })} style={S.range} />
            <Label>Depth (along): {(selMarking.depth ?? 0.4).toFixed(2)} m</Label>
            <input type="range" min={0.2} max={1.2} step={0.05} value={selMarking.depth ?? 0.4} onChange={(e) => patchSelectedMarking({ depth: +e.target.value })} style={S.range} />
            <Label>Rotate: {Math.round((selMarking.yaw || 0) * 180 / Math.PI)}°</Label>
            <input type="range" min={-1.57} max={1.57} step={0.087} value={selMarking.yaw || 0} onChange={(e) => patchSelectedMarking({ yaw: +e.target.value })} style={S.range} />
            <label style={S.check}><input type="checkbox" checked={!!selMarking.magnet} onChange={(e) => patchSelectedMarking({ magnet: e.target.checked })} /> Align across road</label>
            <button style={S.del} onClick={deleteSelected}>Delete crosswalk</button>
          </div>
        )}

        {/* Selected MARKING (non-crosswalk) */}
        {selMarking && selMarking.kind !== 'crosswalk' && (
          <div style={S.card}>
            <div style={S.cardTitle}>Marking</div>
            <Label>Type</Label>
            <select value={selMarking.kind} onChange={(e) => patchSelectedMarking({ kind: e.target.value })} style={S.select}>
              {MARKING_TEXTURES.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
            <Label>Rotation: {Math.round((selMarking.yaw || 0) * 180 / Math.PI)}°</Label>
            <input type="range" min={0} max={6.28} step={0.087} value={selMarking.yaw || 0} onChange={(e) => patchSelectedMarking({ yaw: +e.target.value })} style={S.range} />
            <Label>Scale: {(selMarking.sx || 1).toFixed(1)}</Label>
            <input type="range" min={0.5} max={2} step={0.1} value={selMarking.sx || 1} onChange={(e) => patchSelectedMarking({ sx: +e.target.value, sy: +e.target.value })} style={S.range} />
            <label style={S.check}><input type="checkbox" checked={!!selMarking.magnet} onChange={(e) => patchSelectedMarking({ magnet: e.target.checked })} /> Snap to road</label>
            <button style={S.del} onClick={deleteSelected}>Delete marking</button>
          </div>
        )}

        {/* Selected SURFACE */}
        {selSurface && (
          <div style={S.card}>
            <div style={S.cardTitle}>Surface</div>
            <Label>Texture</Label>
            <select value={selSurface.tex} onChange={(e) => patchSelectedMarking({ tex: e.target.value })} style={S.select}>
              {SURFACE_TEXTURES.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
            <button style={S.del} onClick={deleteSelected}>Delete surface</button>
          </div>
        )}

        {!selected && (
          <div style={{ ...S.card, color: '#5a8aaa', fontSize: 11 }}>
            Pick a tool, then click on the map. Select an element to edit it here.
          </div>
        )}
      </div>
    </div>
  );
}

// ── small styled helpers ─────────────────────────────────────────────────────
const Label = ({ children }) => <div style={{ fontSize: 10, color: '#5a8aaa', textTransform: 'uppercase', letterSpacing: '0.05em', margin: '6px 0 3px' }}>{children}</div>;
const Key = ({ children }) => <span style={{ background: '#1c3a52', color: '#cfe', padding: '1px 5px', borderRadius: 3, fontSize: 10, fontFamily: 'monospace' }}>{children}</span>;

const S = {
  toolbar: { width: 64, background: '#0a1828', borderRight: '1px solid #1c3a52', display: 'flex', flexDirection: 'column', gap: 4, padding: 6, flexShrink: 0 },
  toolBtn: { display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: 52, borderRadius: 8, border: '1px solid transparent', background: '#0f2236', color: '#5a8aaa', cursor: 'pointer' },
  toolBtnActive: { background: 'rgba(168,85,247,0.18)', border: '1px solid #a855f7', color: '#d8b4fe' },
  props: { width: 220, background: '#0a1828', borderLeft: '1px solid #1c3a52', padding: 10, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 10, flexShrink: 0 },
  card: { background: '#0f2236', borderRadius: 8, padding: 10, border: '1px solid #14304a' },
  cardTitle: { fontSize: 12, fontWeight: 700, color: '#7ad4ff', marginBottom: 6 },
  select: { width: '100%', background: '#0a1828', color: '#cfe', border: '1px solid #1c3a52', borderRadius: 4, padding: '4px 6px', fontSize: 11 },
  range: { width: '100%' },
  check: { display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: '#9ab', marginTop: 6, cursor: 'pointer' },
  del: { width: '100%', marginTop: 8, padding: 6, background: '#7f1d1d', color: '#fff', border: 'none', borderRadius: 4, cursor: 'pointer', fontSize: 11 },
  help: { position: 'absolute', top: 10, left: 10, background: 'rgba(8,14,24,0.8)', border: '1px solid #1c3a52', borderRadius: 8, padding: '8px 10px', fontSize: 11, color: '#9ab', display: 'flex', flexDirection: 'column', gap: 4, pointerEvents: 'none' },
  toolHint: { position: 'absolute', top: 10, right: 10, background: 'rgba(8,14,24,0.8)', border: '1px solid #1c3a52', borderRadius: 8, padding: '6px 10px', fontSize: 12, color: '#a855f7', fontWeight: 700, pointerEvents: 'none' },
  texHint: { position: 'absolute', bottom: 10, left: 10, background: 'rgba(127,29,29,0.85)', borderRadius: 6, padding: '4px 8px', fontSize: 10, color: '#fee', pointerEvents: 'none' },
};
