import React, { useState, useEffect, useRef, Suspense } from 'react';
import { Canvas, useLoader, useThree } from '@react-three/fiber';
import { OrbitControls, Grid } from '@react-three/drei';
import * as THREE from 'three';
import { ASSET_REGISTRY } from './assets/AssetLibrary';
import fileApi from '../../services/fileApi';

// QCar footprint from QCarBody.jsx constants
const QCAR_LENGTH = 0.415;  // 2 * BODY_HALF_X
const QCAR_WIDTH  = 0.182;  // 2 * BODY_HALF_Z

function FloorImageTexture({ imageUrl }) {
  const texture = useLoader(THREE.TextureLoader, imageUrl);
  return <meshStandardMaterial map={texture} />;
}

function FloorImage({ imageUrl, onClick, onMove, width, height }) {
  return (
    <mesh
      rotation={[-Math.PI / 2, 0, 0]}
      position={[0, 0, 0]}
      receiveShadow
      onClick={onClick}
      onPointerMove={onMove}
      onPointerOver={(e) => { e.stopPropagation(); document.body.style.cursor = 'crosshair'; }}
      onPointerOut={(e)  => { e.stopPropagation(); document.body.style.cursor = 'default'; }}
    >
      <planeGeometry args={[width, height]} />
      {imageUrl ? (
        <Suspense fallback={<meshStandardMaterial color="#222222" />}>
          <FloorImageTexture imageUrl={imageUrl} />
        </Suspense>
      ) : (
        <meshStandardMaterial color="#222222" />
      )}
    </mesh>
  );
}

// Visual QCar footprint shown at the spawn point
function SpawnIndicator({ x, z, yawDeg }) {
  const yaw = (yawDeg * Math.PI) / 180;
  return (
    <group position={[x, 0.05, z]} rotation={[0, yaw, 0]}>
      {/* Car body */}
      <mesh>
        <boxGeometry args={[QCAR_LENGTH, 0.08, QCAR_WIDTH]} />
        <meshStandardMaterial color="#00ff88" transparent opacity={0.75} />
      </mesh>
      {/* White nose — shows forward direction */}
      <mesh position={[QCAR_LENGTH / 2 - 0.03, 0, 0]}>
        <boxGeometry args={[0.05, 0.09, QCAR_WIDTH + 0.01]} />
        <meshStandardMaterial color="#ffffff" transparent opacity={0.9} />
      </mesh>
    </group>
  );
}

function PlacedAssets({ assets }) {
  return (
    <>
      {assets.map((item, i) => {
        const AssetComponent = ASSET_REGISTRY[item.type]?.component;
        if (!AssetComponent) return null;
        return (
          <AssetComponent key={i} position={item.position} rotation={item.rotation} scale={item.scale} />
        );
      })}
    </>
  );
}

// Syncs the Three.js camera to the current map size when the user clicks "Fit View"
function CameraSync({ controlsRef, targetDist }) {
  const { camera } = useThree();
  useEffect(() => {
    if (!targetDist || !controlsRef.current) return;
    camera.position.set(0, targetDist, 0);
    camera.lookAt(0, 0, 0);
    controlsRef.current.target.set(0, 0, 0);
    controlsRef.current.update();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [targetDist]);
  return null;
}


export default function MapCreator({ canvasId }) {
  const [mapImage,   setMapImage]   = useState({ url: null, name: null, dataUrl: null });
  const [imageWidth,  setImageWidth]  = useState(20);
  const [imageHeight, setImageHeight] = useState(20);
  const [placedAssets, setPlacedAssets] = useState([]);
  const [selectedType, setSelectedType] = useState(null);
  const [rotationAngle, setRotationAngle] = useState(0);
  const [spawnPoint, setSpawnPoint] = useState({ x: 0, z: 0 });
  const [spawnYaw,   setSpawnYaw]   = useState(0); // degrees
  const [waypoints,  setWaypoints]  = useState([]); // ordered route [{x,z}, ...]
  const [fitKey,     setFitKey]     = useState(0); // increment to trigger camera fit

  const controlsRef = useRef(null);
  const isSpawnMode    = selectedType === '__spawn__';
  const isWaypointMode = selectedType === '__waypoint__';
  const fitDist = Math.max(imageWidth, imageHeight) * 0.85;

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (mapImage.url) URL.revokeObjectURL(mapImage.url);
    const url = URL.createObjectURL(file);
    const reader = new FileReader();
    reader.onload = (evt) => {
      setMapImage({ url, name: file.name, dataUrl: evt.target.result });
    };
    reader.readAsDataURL(file);
  };

  const handleFloorClick = (e) => {
    e.stopPropagation();
    const point = e.point;
    if (isSpawnMode) {
      setSpawnPoint({
        x: Math.round(point.x * 4) / 4,
        z: Math.round(point.z * 4) / 4,
      });
      return;
    }
    if (isWaypointMode) {
      setWaypoints(prev => [...prev, {
        x: Math.round(point.x * 4) / 4,
        z: Math.round(point.z * 4) / 4,
      }]);
      return;
    }
    // Internal tool modes (spawn/waypoint) don't place assets — ignore.
    if (!selectedType || selectedType.startsWith('__')) return;
    setPlacedAssets(prev => [...prev, {
      type: selectedType,
      position: [Math.round(point.x * 2) / 2, 0, Math.round(point.z * 2) / 2],
      rotation: [0, (rotationAngle * Math.PI) / 180, 0],
      scale: [1, 1, 1],
    }]);
  };

  const handleSaveMap = async () => {
    if (!canvasId) { alert('No IDE workspace detected.'); return; }
    const mapName = prompt('Enter map file name (e.g. track1.json):', 'track1.json');
    if (!mapName) return;
    const safeName = mapName.endsWith('.json') ? mapName : `${mapName}.json`;
    const mapData = {
      version: '1.0',
      imageOriginalName: mapImage.name,
      imageData: mapImage.dataUrl || null,
      imageSize: { width: imageWidth, height: imageHeight },
      spawnPoint: { x: spawnPoint.x, z: spawnPoint.z, yaw: (spawnYaw * Math.PI) / 180 },
      assets: placedAssets,
      waypoints: waypoints,
    };
    try {
      await fileApi.createFile(canvasId, {
        path: `/${safeName}`,
        file_type: 'file',
        content: JSON.stringify(mapData, null, 2),
      });
      alert(`Map saved to /${safeName}`);
    } catch (err) {
      alert('Failed to save map: ' + err.message);
    }
  };

  const labelStyle = { display: 'block', marginBottom: 6, fontSize: 12, color: '#9ca3af', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' };
  const inputStyle = { width: '100%', padding: '5px 8px', borderRadius: 4, border: '1px solid #4b5563', background: '#374151', color: '#fff', fontSize: 12, boxSizing: 'border-box' };

  return (
    <div style={{ display: 'flex', height: '100%', color: '#fff' }}>

      {/* ── Sidebar ─────────────────────────────────────────────────────────── */}
      <div data-tour="map-creator-panel" style={{ width: 260, background: '#1f2937', padding: '14px 12px', overflowY: 'auto', borderRight: '1px solid #374151', display: 'flex', flexDirection: 'column', gap: 14, flexShrink: 0 }}>
        <h3 style={{ margin: 0, color: '#10b981', fontSize: 14 }}>Map Creator</h3>

        {/* Floor image */}
        <div>
          <label style={labelStyle}>1. Floor Image</label>
          <input type="file" accept="image/*" onChange={handleImageUpload} style={{ width: '100%', fontSize: 11 }} />
          {mapImage.name && <div style={{ fontSize: 10, color: '#6b7280', marginTop: 3 }}>📁 {mapImage.name}</div>}
        </div>

        {/* Image size */}
        <div>
          <label style={labelStyle}>2. Image Size (meters)</label>
          <div style={{ display: 'flex', gap: 6 }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 10, color: '#6b7280', marginBottom: 2 }}>Width</div>
              <input type="number" value={imageWidth} min={5} max={200} step={5}
                onChange={e => setImageWidth(Number(e.target.value))} style={inputStyle} />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 10, color: '#6b7280', marginBottom: 2 }}>Height</div>
              <input type="number" value={imageHeight} min={5} max={200} step={5}
                onChange={e => setImageHeight(Number(e.target.value))} style={inputStyle} />
            </div>
          </div>
          <button onClick={() => setFitKey(k => k + 1)}
            style={{ marginTop: 6, width: '100%', padding: '5px 0', background: '#374151', color: '#9ca3af', border: '1px solid #4b5563', borderRadius: 4, cursor: 'pointer', fontSize: 11 }}>
            🔍 Fit View
          </button>
          <div style={{ marginTop: 4, fontSize: 10, color: '#4b5563' }}>
            QCar: {QCAR_LENGTH}m × {QCAR_WIDTH}m (green box = scale ref)
          </div>
        </div>

        {/* Spawn point */}
        <div>
          <label style={labelStyle}>3. Car Spawn Point</label>
          <button data-tour="map-spawn" onClick={() => setSelectedType(isSpawnMode ? null : '__spawn__')}
            style={{ width: '100%', padding: '7px 0', borderRadius: 4, border: 'none', cursor: 'pointer', fontWeight: 700, fontSize: 12,
              background: isSpawnMode ? '#f59e0b' : '#374151', color: '#fff' }}>
            {isSpawnMode ? '🟡 Click map to place…' : '🚗 Move Spawn Point'}
          </button>
          <div style={{ display: 'flex', gap: 6, marginTop: 6 }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 10, color: '#6b7280', marginBottom: 2 }}>Yaw (deg)</div>
              <input type="number" value={spawnYaw} step={45}
                onChange={e => setSpawnYaw(Number(e.target.value))} style={inputStyle} />
            </div>
            <div style={{ flex: 1, fontSize: 10, color: '#6b7280', paddingTop: 16, lineHeight: 1.7 }}>
              ({spawnPoint.x.toFixed(2)}, {spawnPoint.z.toFixed(2)})
            </div>
          </div>
        </div>

        {/* Waypoint route */}
        <div data-tour="map-waypoints">
          <label style={labelStyle}>4. Route Waypoints (self-driving)</label>
          <button onClick={() => setSelectedType(isWaypointMode ? null : '__waypoint__')}
            style={{ width: '100%', padding: '7px 0', borderRadius: 4, border: 'none', cursor: 'pointer', fontWeight: 700, fontSize: 12,
              background: isWaypointMode ? '#06b6d4' : '#374151', color: '#fff' }}>
            {isWaypointMode ? '🔵 Click map to add waypoints…' : `📍 Place Waypoints (${waypoints.length})`}
          </button>
          <div style={{ display: 'flex', gap: 6, marginTop: 6 }}>
            <button onClick={() => setWaypoints(p => p.slice(0, -1))}
              style={{ flex: 1, padding: 6, background: '#f59e0b', color: '#fff', border: 'none', borderRadius: 4, cursor: 'pointer', fontSize: 11 }}>
              Undo point
            </button>
            <button onClick={() => setWaypoints([])}
              style={{ flex: 1, padding: 6, background: '#dc2626', color: '#fff', border: 'none', borderRadius: 4, cursor: 'pointer', fontSize: 11 }}>
              Clear route
            </button>
          </div>
          <div style={{ fontSize: 10, color: '#6b7280', marginTop: 4 }}>
            The Pure Pursuit node drives the car along these points in order.
          </div>
        </div>

        {/* Place obstacles & signs */}
        <div>
          <label style={labelStyle}>5. Place Objects</label>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {Object.entries(ASSET_REGISTRY)
              .filter(([, info]) => info.type !== 'street')
              .map(([type, info]) => (
                <button key={type}
                  onClick={() => setSelectedType(selectedType === type ? null : type)}
                  style={{ padding: '6px 10px', textAlign: 'left', cursor: 'pointer', borderRadius: 4, border: 'none', fontSize: 12,
                    background: selectedType === type ? '#3b82f6' : '#374151', color: '#fff' }}>
                  {info.name}
                </button>
              ))}
          </div>
        </div>

        {/* Asset rotation */}
        <div>
          <label style={labelStyle}>6. Object Rotation (deg)</label>
          <input type="number" value={rotationAngle} step={45}
            onChange={e => setRotationAngle(Number(e.target.value))} style={inputStyle} />
        </div>

        {/* Undo / Clear */}
        <div style={{ display: 'flex', gap: 6 }}>
          <button onClick={() => setPlacedAssets(p => p.slice(0, -1))}
            style={{ flex: 1, padding: 7, background: '#f59e0b', color: '#fff', border: 'none', borderRadius: 4, cursor: 'pointer', fontSize: 12 }}>
            Undo
          </button>
          <button onClick={() => setPlacedAssets([])}
            style={{ flex: 1, padding: 7, background: '#dc2626', color: '#fff', border: 'none', borderRadius: 4, cursor: 'pointer', fontSize: 12 }}>
            Clear
          </button>
        </div>

        <button data-tour="map-save" onClick={handleSaveMap}
          style={{ padding: 10, background: '#10b981', color: '#fff', border: 'none', borderRadius: 4, cursor: 'pointer', fontWeight: 700, fontSize: 13 }}>
          💾 Save Map to IDE
        </button>
      </div>

      {/* ── 3D Canvas ───────────────────────────────────────────────────────── */}
      <div style={{ flex: 1, position: 'relative' }}>
        <Canvas camera={{ position: [0, fitDist, 0], fov: 50 }}>
          <ambientLight intensity={0.6} />
          <directionalLight position={[10, 10, 5]} intensity={1} castShadow />

          <CameraSync controlsRef={controlsRef} targetDist={fitKey > 0 ? fitDist : null} />

          <Grid
            args={[Math.max(imageWidth, imageHeight) * 2, Math.max(imageWidth, imageHeight) * 2]}
            position={[0, 0.001, 0]} sectionColor="#444" cellColor="#222"
          />

          {/* Invisible large ground plane so clicks register even beyond the
              floor image. Sits just below the image so the image wins hits
              where they overlap. */}
          <mesh
            rotation={[-Math.PI / 2, 0, 0]}
            position={[0, -0.001, 0]}
            onClick={handleFloorClick}
          >
            <planeGeometry args={[400, 400]} />
            <meshBasicMaterial transparent opacity={0} depthWrite={false} />
          </mesh>

          <Suspense fallback={null}>
            <FloorImage imageUrl={mapImage.url} onClick={handleFloorClick} width={imageWidth} height={imageHeight} />

            <PlacedAssets assets={placedAssets} />
            <SpawnIndicator x={spawnPoint.x} z={spawnPoint.z} yawDeg={spawnYaw} />
            {waypoints.map((w, i) => (
              <mesh key={i} position={[w.x, 0.06, w.z]}>
                <sphereGeometry args={[0.08, 14, 14]} />
                <meshStandardMaterial color={i === 0 ? '#22c55e' : '#22d3ee'} emissive={i === 0 ? '#16a34a' : '#0891b2'} emissiveIntensity={0.6} />
              </mesh>
            ))}
          </Suspense>

          <OrbitControls ref={controlsRef} makeDefault enableRotate={false} enablePan={true} enableZoom={true} target={[0, 0, 0]} />
        </Canvas>

        {/* HUD overlay */}
        <div style={{ position: 'absolute', top: 10, right: 10, background: 'rgba(0,0,0,0.65)', padding: '7px 11px', borderRadius: 6, pointerEvents: 'none', fontSize: 11 }}>
          <div style={{ color: isSpawnMode ? '#f59e0b' : selectedType && !selectedType.startsWith('__') ? '#3b82f6' : '#6b7280', fontWeight: 700, marginBottom: 3 }}>
            {isSpawnMode
              ? '🚗 Click to set spawn'
              : isWaypointMode
              ? '📍 Click to add waypoints'
              : selectedType
              ? `Placing: ${ASSET_REGISTRY[selectedType]?.name}`
              : 'No tool active'}
          </div>
          <div style={{ color: '#4b5563' }}>Right-drag · Scroll to zoom</div>
        </div>
      </div>
    </div>
  );
}
