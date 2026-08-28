// =============================================================
// FILE: src/components/sim/road/RoadDesignerPanel.jsx
// Integrated map editor: the PathPhalt-style RoadEditor with the Map Creator's
// context drawn underneath it (floor image, spawn car, waypoints) so you draw
// roads ON the actual map you're building — not on a blank canvas.
//
// Saves ONE combined file the MapRunner understands:
//   { version:'2.0', imageData, imageSize, spawnPoint, waypoints, assets,
//     roadModel:{roads,markings,surfaces,background} }
// =============================================================
import React, { useState, useEffect } from 'react';
import RoadEditor from './RoadEditor';
import { emptyModel, fromJSON, toJSON, exportPathPhalt } from './roadModel';
import fileApi from '../../../services/fileApi';

export default function RoadDesignerPanel({ canvasId, onBack }) {
  const [model, setModel]       = useState(emptyModel());
  const [files, setFiles]       = useState([]);
  const [loadPath, setLoadPath] = useState('');

  // Map context (drawn as a backdrop behind the roads)
  const [image, setImage]       = useState({ url: null, name: null, dataUrl: null });
  const [imgW, setImgW]         = useState(20);
  const [imgH, setImgH]         = useState(20);
  const [spawn, setSpawn]       = useState({ x: 0, z: 0, yawDeg: 0 });
  const [waypoints, setWaypoints] = useState([]);
  const [assets, setAssets]     = useState([]); // preserved across load/save (set via Map Creator)

  useEffect(() => {
    if (!canvasId) return;
    fileApi.listFiles(canvasId)
      .then((fs) => setFiles(fs.filter((f) => f.path.endsWith('.json'))))
      .catch(() => {});
  }, [canvasId]);

  const onImageUpload = (e) => {
    const f = e.target.files[0];
    if (!f) return;
    if (image.url) URL.revokeObjectURL(image.url);
    const url = URL.createObjectURL(f);
    const reader = new FileReader();
    reader.onload = (ev) => setImage({ url, name: f.name, dataUrl: ev.target.result });
    reader.readAsDataURL(f);
  };

  const save = async () => {
    if (!canvasId) { alert('No IDE workspace detected.'); return; }
    const name = prompt('Save map as (e.g. track1.json):', 'track1.json');
    if (!name) return;
    const safe = name.endsWith('.json') ? name : `${name}.json`;
    const data = {
      version: '2.0',
      imageOriginalName: image.name,
      imageData: image.dataUrl || null,
      imageSize: { width: imgW, height: imgH },
      spawnPoint: { x: spawn.x, z: spawn.z, yaw: (spawn.yawDeg || 0) * Math.PI / 180 },
      waypoints,
      assets,
      roadModel: toJSON(model),
    };
    try {
      await fileApi.createFile(canvasId, { path: `/${safe}`, file_type: 'file', content: JSON.stringify(data, null, 2) });
      alert(`Saved to /${safe}`);
    } catch (e) { alert('Save failed: ' + e.message); }
  };

  const applyLoaded = (data) => {
    if (data.imageData) setImage({ url: data.imageData, name: data.imageOriginalName || 'loaded', dataUrl: data.imageData });
    if (data.imageSize) { setImgW(data.imageSize.width ?? 20); setImgH(data.imageSize.height ?? 20); }
    if (data.spawnPoint) setSpawn({ x: data.spawnPoint.x ?? 0, z: data.spawnPoint.z ?? 0, yawDeg: Math.round((data.spawnPoint.yaw ?? 0) * 180 / Math.PI) });
    setWaypoints(data.waypoints || []);
    setAssets(data.assets || []);
    setModel(fromJSON(data.roadModel || data));
  };

  const load = async () => {
    if (!loadPath || !canvasId) return;
    try {
      const file = await fileApi.readFromDocker(canvasId, loadPath);
      applyLoaded(JSON.parse(file.content));
    } catch (e) { alert('Load failed: ' + e.message); }
  };

  const exportJson = () => {
    const blob = new Blob([JSON.stringify(exportPathPhalt(model), null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'pathphalt.json'; a.click();
    URL.revokeObjectURL(url);
  };

  const importJson = () => {
    const input = document.createElement('input');
    input.type = 'file'; input.accept = 'application/json';
    input.onchange = (e) => {
      const f = e.target.files[0]; if (!f) return;
      const r = new FileReader();
      r.onload = (ev) => { try { applyLoaded(JSON.parse(ev.target.result)); } catch (err) { alert('Bad JSON: ' + err.message); } };
      r.readAsText(f);
    };
    input.click();
  };

  // Map-context controls hosted inside the editor's right panel.
  const mapControls = (
    <div style={card}>
      <div style={cardTitle}>🗺 Map</div>
      <label style={lbl}>Floor image</label>
      <input type="file" accept="image/*" onChange={onImageUpload} style={{ width: '100%', fontSize: 10, color: '#9ab' }} />
      {image.name && <div style={{ fontSize: 9, color: '#5a8aaa', marginTop: 2 }}>📁 {image.name}</div>}

      <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
        <div style={{ flex: 1 }}>
          <label style={lbl}>Width (m)</label>
          <input type="number" min={2} max={200} step={1} value={imgW} onChange={(e) => setImgW(+e.target.value)} style={num} />
        </div>
        <div style={{ flex: 1 }}>
          <label style={lbl}>Height (m)</label>
          <input type="number" min={2} max={200} step={1} value={imgH} onChange={(e) => setImgH(+e.target.value)} style={num} />
        </div>
      </div>

      <label style={lbl}>Spawn yaw: {spawn.yawDeg}°</label>
      <input type="range" min={-180} max={180} step={15} value={spawn.yawDeg} onChange={(e) => setSpawn((s) => ({ ...s, yawDeg: +e.target.value }))} style={{ width: '100%' }} />
      <div style={{ fontSize: 9, color: '#5a8aaa', marginTop: 2 }}>
        Spawn @ ({spawn.x.toFixed(2)}, {spawn.z.toFixed(2)}) · {waypoints.length} waypoints
      </div>
      <div style={{ fontSize: 9, color: '#5a8aaa', marginTop: 4 }}>
        Use the 🚗 / 📍 tools to place spawn &amp; waypoints on the map.
      </div>
    </div>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={bar}>
        {onBack && <button style={btn} onClick={onBack}>← Map Creator</button>}
        <button style={btn} onClick={() => { setModel(emptyModel()); }}>＋ New Roads</button>
        <button style={btnP} onClick={save}>💾 Save Map</button>
        <select value={loadPath} onChange={(e) => setLoadPath(e.target.value)} style={sel}>
          <option value="">— load map —</option>
          {files.map((f) => <option key={f.id} value={f.path}>{f.path}</option>)}
        </select>
        <button style={btn} onClick={load} disabled={!loadPath}>Load</button>
        <div style={{ flex: 1 }} />
        <button style={btn} onClick={importJson}>⇪ Import PathPhalt</button>
        <button style={btn} onClick={exportJson}>⇩ Export JSON</button>
      </div>
      <div style={{ flex: 1, minHeight: 0 }}>
        <RoadEditor
          value={model}
          onChange={setModel}
          backdrop={{ imageUrl: image.url, width: imgW, height: imgH, spawn, waypoints }}
          mapTools={{
            spawn, setSpawn,
            waypoints, setWaypoints,
          }}
          leftExtras={mapControls}
        />
      </div>
    </div>
  );
}

const bar = { display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', background: '#0a1828', borderBottom: '1px solid #1c3a52', flexShrink: 0 };
const btn = { padding: '5px 12px', background: '#0f2236', color: '#cfe', border: '1px solid #1c3a52', borderRadius: 6, cursor: 'pointer', fontSize: 12 };
const btnP = { ...btn, background: '#10b981', color: '#fff', border: 'none', fontWeight: 700 };
const sel = { padding: '5px 8px', background: '#0f2236', color: '#cfe', border: '1px solid #1c3a52', borderRadius: 6, fontSize: 12 };
const card = { background: '#0f2236', borderRadius: 8, padding: 10, border: '1px solid #14304a' };
const cardTitle = { fontSize: 12, fontWeight: 700, color: '#7ad4ff', marginBottom: 6 };
const lbl = { display: 'block', fontSize: 10, color: '#5a8aaa', textTransform: 'uppercase', letterSpacing: '0.05em', margin: '6px 0 3px' };
const num = { width: '100%', background: '#0a1828', color: '#cfe', border: '1px solid #1c3a52', borderRadius: 4, padding: '4px 6px', fontSize: 11, boxSizing: 'border-box' };
