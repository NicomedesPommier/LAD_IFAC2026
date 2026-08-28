/**
 * SimulatorPage.jsx
 *
 * Full simulator layout with resizable panels:
 *
 *  ┌──────────────────────────────────────┬────────────────────┐
 *  │                                      │  ROS Camera Feed   │
 *  │        3-D Simulation Canvas         ├────────────────────┤
 *  │        + Debug / Physics overlays    │  Front Camera      │
 *  │                                      ├────────────────────┤
 *  │                                      │  LIDAR 2-D         │
 *  │                                      ├────────────────────┤
 *  │                                      │  ROS Parameters    │
 *  └──────────────────────────────────────┴────────────────────┘
 *
 * All pane boundaries are drag-resizable via react-resizable-panels.
 */

import { useRef, useState, useCallback, useEffect, memo } from 'react';
import { Canvas } from '@react-three/fiber';
import { Physics } from '@react-three/rapier';
import { OrbitControls } from '@react-three/drei';
import { Group as PanelGroup, Panel, Separator as PanelResizeHandle } from 'react-resizable-panels';

import { RosBridgeProvider, useRos } from '../hooks/useRosBridge';
import { useCmdVelSubscriber } from '../hooks/useCmdVelSubscriber';
import { useROS2Workspace } from '../hooks/useROS2Workspace';
import { SimulationWorld } from '../components/simulator/SimulationWorld';
import { QCarBody } from '../components/simulator/QCarBody';
import FrontCamera from '../components/sim/FrontCamera';
import RosRxPanel from '../components/sim/RosRxPanel';
import LidarWidget2D from '../components/sim/LidarWidget2D';
import RosParamPanel from '../components/sim/RosParamPanel';
import SimWidget from '../components/sim/SimWidget';
import { FaCamera } from "react-icons/fa6";
import { GiRadarSweep } from "react-icons/gi";
import { TbAdjustmentsAlt } from "react-icons/tb";

// ── Physics defaults ───────────────────────────────────────────────────────────
const PHYSICS_DEFAULTS = {
  maxSpeed: 1.5,
  maxTurn:  0.52,
  gravity:  9.81,
  timeStep: 1 / 60,
};

// ── Resize handle ──────────────────────────────────────────────────────────────

function ResizeHandle({ direction = 'horizontal' }) {
  const isH = direction === 'horizontal';
  return (
    <PanelResizeHandle style={{
      position:       'relative',
      background:     '#0d1a2a',
      flexShrink:     0,
      ...(isH
        ? { width: '5px', cursor: 'col-resize', borderLeft: '1px solid #1c2e3e', borderRight: '1px solid #1c2e3e' }
        : { height: '5px', cursor: 'row-resize', borderTop: '1px solid #1c2e3e', borderBottom: '1px solid #1c2e3e' }),
    }}>
      <div style={{
        position: 'absolute',
        ...(isH
          ? { top: '50%', left: '50%', transform: 'translate(-50%,-50%)', width: 3, height: 24, borderRadius: 2 }
          : { top: '50%', left: '50%', transform: 'translate(-50%,-50%)', height: 3, width: 24, borderRadius: 2 }),
        background: '#2a4a5e',
      }} />
    </PanelResizeHandle>
  );
}

// ── Debug panel ────────────────────────────────────────────────────────────────

function DebugPanel({ showCollider, onToggleCollider, inspectMode, onToggleInspect }) {
  const [open, setOpen] = useState(false);
  const row = (label, checked, onToggle) => (
    <label style={{ ...panelStyles.row, cursor: 'pointer', userSelect: 'none' }}>
      <span style={panelStyles.label}>{label}</span>
      <input type="checkbox" checked={checked} onChange={e => onToggle(e.target.checked)} style={{ cursor: 'pointer' }} />
      <span style={{ ...panelStyles.value, color: checked ? '#00ff88' : '#666' }}>{checked ? 'ON' : 'off'}</span>
    </label>
  );
  return (
    <div style={panelStyles.container}>
      <button onClick={() => setOpen(o => !o)} style={panelStyles.debugToggle}>
        [DEBUG] {open ? '▲' : '▼'}
      </button>
      {open && (
        <div style={panelStyles.body}>
          {row('Collider mesh', showCollider, onToggleCollider)}
          {row('Inspect cam',  inspectMode,  onToggleInspect)}
          {inspectMode && (
            <span style={{ fontSize: '0.65rem', color: '#888', paddingLeft: '2px' }}>drag · scroll · right-drag</span>
          )}
        </div>
      )}
    </div>
  );
}

// ── Physics panel ──────────────────────────────────────────────────────────────

function PhysicsPanel({ params, onChange }) {
  const [open, setOpen] = useState(false);
  const slider = (key, label, min, max, step, unit) => (
    <label style={panelStyles.row}>
      <span style={panelStyles.label}>{label}</span>
      <input type="range" min={min} max={max} step={step} value={params[key]}
        onChange={e => onChange(key, parseFloat(e.target.value))} style={panelStyles.slider} />
      <span style={panelStyles.value}>{params[key].toFixed(step < 0.01 ? 3 : 2)}{unit}</span>
    </label>
  );
  return (
    <div style={panelStyles.container}>
      <button onClick={() => setOpen(o => !o)} style={panelStyles.toggle}>⚙ Physics {open ? '▲' : '▼'}</button>
      {open && (
        <div style={panelStyles.body}>
          {slider('maxSpeed', 'Max speed',  0.1, 5.0,  0.1,    ' m/s')}
          {slider('maxTurn',  'Max steer',  0.05, 1.57, 0.01,  ' rad')}
          {slider('gravity',  'Gravity',    0,   20,   0.5,   ' m/s²')}
          {slider('timeStep', 'Time step',  1/120, 1/20, 1/240, ' s')}
          <button onClick={() => onChange('__reset__', null)} style={panelStyles.reset}>Reset defaults</button>
        </div>
      )}
    </div>
  );
}

// ── Status bar ─────────────────────────────────────────────────────────────────

function StatusBar({ scanCountRef }) {
  const { connected, error } = useRos();

  // Owns the 1 Hz scan-rate tick so the rest of SimulatorPage never re-renders
  // on it — keeping the 3-D canvas and every widget stable.
  const [scanHz, setScanHz] = useState(0);
  useEffect(() => {
    const id = setInterval(() => {
      setScanHz(scanCountRef.current);
      scanCountRef.current = 0;
    }, 1000);
    return () => clearInterval(id);
  }, [scanCountRef]);

  return (
    <div style={styles.statusBar}>
      <span style={{ ...styles.dot, background: connected ? '#22dd77' : '#dd4444' }} />
      <span style={styles.statusText}>
        {connected ? 'ROS connected' : error ? `Error: ${error.message}` : 'Connecting…'}
      </span>
      <span style={styles.divider}>|</span>
      <span style={styles.statusText}>/scan {scanHz.toFixed(1)} Hz</span>
      <span style={styles.divider}>|</span>
      <span style={{ ...styles.statusText, opacity: connected ? 1 : 0.4 }}>↑ /odom · /tf · /scan</span>
      <span style={styles.divider}>|</span>
      <span style={{ ...styles.statusText, opacity: connected ? 1 : 0.4 }}>↓ /cmd_vel</span>
    </div>
  );
}

// ── Front camera widget (DOM <img> fed from FrontCamera's onFrame) ─────────────

function FrontCamWidget({ dataUrl, hz }) {
  return (
    <div style={{ width: '100%', height: '100%', position: 'relative', background: '#050d14' }}>
      {dataUrl
        ? <img
            src={dataUrl}
            alt="front cam"
            style={{ width: '100%', height: '100%', objectFit: 'contain', display: 'block' }}
          />
        : <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#334', fontSize: 11, fontFamily: 'monospace' }}>
            Waiting for first frame…
          </div>
      }
      {hz != null && (
        <div style={{ position: 'absolute', bottom: 4, right: 6, fontSize: 9, fontFamily: 'monospace', color: 'rgba(0,229,255,0.6)', background: 'rgba(0,0,0,0.5)', padding: '1px 4px', borderRadius: 2 }}>
          {hz.toFixed(1)} Hz
        </div>
      )}
    </div>
  );
}

// ── Front camera widget (DOM <img> fed from FrontCamera's onFrame) ─────────────
// Kept as a self-contained component with its OWN state so that the 30 Hz
// image updates do NOT re-render SimulatorPage (and therefore do NOT trigger
// React StrictMode's effect re-invocation on the Physics/RigidBody tree).

function FrontCamBridge({ registerCallback }) {
  const [dataUrl, setDataUrl] = useState(null);
  const [hz,      setHz]      = useState(null);

  useEffect(() => {
    registerCallback((url, h) => {
      setDataUrl(url);
      if (h != null) setHz(h);
    });
    return () => registerCallback(null);
  }, [registerCallback]);

  return <FrontCamWidget dataUrl={dataUrl} hz={hz} />;
}

// ── Stable Canvas wrapper — memoized so it never re-renders from parent state
// changes that don't affect the 3-D world (e.g. frontCamUrl, scanHz updates).

const StableCanvas = memo(function StableCanvas({
  carRef, params, showCollider, inspectMode, namespace, scanRangesRef, onScan, onCamFrame,
}) {
  return (
    <Canvas
      style={{ width: '100%', height: '100%' }}
      shadows
      camera={{ position: [0, 2, -5], fov: 60, near: 0.05, far: 200 }}
      gl={{ antialias: true }}
    >
      <SimScene
        carRef={carRef}
        onScan={onScan}
        onCamFrame={onCamFrame}
        params={params}
        showCollider={showCollider}
        inspectMode={inspectMode}
        namespace={namespace}
        scanRangesRef={scanRangesRef}
      />
    </Canvas>
  );
});

// ── 3-D scene (must be inside Canvas) ─────────────────────────────────────────

function SimScene({ carRef, onScan, onCamFrame, params, showCollider, inspectMode, namespace, scanRangesRef }) {
  const cmdRef = useCmdVelSubscriber(namespace);

  return (
    <>
      {inspectMode && (
        <OrbitControls makeDefault enableDamping dampingFactor={0.1} minDistance={0.3} maxDistance={20} />
      )}
      <Physics timeStep={params.timeStep} gravity={[0, -params.gravity, 0]} interpolate>
        <SimulationWorld
          carRef={carRef}
          onScan={(ranges) => {
            scanRangesRef.current = ranges;
            onScan?.();
          }}
          namespace={namespace}
          chaseCamera={!inspectMode}
          showScan
        />
        <QCarBody
          rigidBodyRef={carRef}
          cmdRef={cmdRef}
          namespace={namespace}
          showCollider={showCollider}
          maxSpeed={params.maxSpeed}
          maxTurn={params.maxTurn}
        />
        <FrontCamera carRef={carRef} onFrame={onCamFrame} namespace={namespace} />
      </Physics>
    </>
  );
}

// ── Page ───────────────────────────────────────────────────────────────────────

export default function SimulatorPage() {
  const carRef       = useRef(null);
  const { canvasId } = useROS2Workspace();
  const namespace    = canvasId ? `/ws_${canvasId.replace(/-/g, '_')}` : '';

  // Scan Hz counter (incremented per /scan; StatusBar reads it on a 1 Hz tick)
  const scanCountRef = useRef(0);
  const scanRangesRef = useRef([]);

  // Physics params
  const [params, setParams]             = useState({ ...PHYSICS_DEFAULTS });
  const [showCollider, setShowCollider] = useState(false);
  const [inspectMode, setInspectMode]   = useState(false);

  // Camera callback ref — FrontCamBridge registers here so cam updates
  // never cause SimulatorPage to re-render (no state lifted here).
  const camCallbackRef     = useRef(null);
  const registerCamCallback = useCallback(cb => { camCallbackRef.current = cb; }, []);
  const handleCamFrame      = useCallback((url, hz) => { camCallbackRef.current?.(url, hz); }, []);

  const handleParamChange = useCallback((key, value) => {
    if (key === '__reset__') setParams({ ...PHYSICS_DEFAULTS });
    else setParams(prev => ({ ...prev, [key]: value }));
  }, []);

  const handleScan = useCallback(() => { scanCountRef.current++; }, []);

  return (
    <RosBridgeProvider>
      <div style={styles.page}>
        {/* ── Status bar ──────────────────────────────────────────────── */}
        <StatusBar scanCountRef={scanCountRef} />

        {/* ── Main resizable area: sim + widgets ───────────────────────── */}
        <PanelGroup orientation="horizontal" style={{ flex: 1, minHeight: 0 }}>

          {/* 3-D canvas */}
          <Panel defaultSize={65} minSize={25} style={{ position: 'relative' }}>
            <StableCanvas
              carRef={carRef}
              onScan={handleScan}
              onCamFrame={handleCamFrame}
              params={params}
              showCollider={showCollider}
              inspectMode={inspectMode}
              namespace={namespace}
              scanRangesRef={scanRangesRef}
            />

            {/* Canvas overlays: debug + physics panels */}
            <div style={styles.panelOverlay}>
              <DebugPanel
                showCollider={showCollider}
                onToggleCollider={setShowCollider}
                inspectMode={inspectMode}
                onToggleInspect={setInspectMode}
              />
              <div style={{ marginTop: '0.4rem' }}>
                <PhysicsPanel params={params} onChange={handleParamChange} />
              </div>
            </div>
          </Panel>

          <ResizeHandle orientation="horizontal" />

          {/* Right widgets column */}
          <Panel defaultSize={35} minSize={18} style={{ display: 'flex', flexDirection: 'column' }}>
            <PanelGroup orientation="vertical" style={{ flex: 1 }}>

              {/* ROS Camera Feed */}
              <Panel defaultSize={30} minSize={12}>
                <SimWidget title="ROS Camera Feed" icon={<FaCamera />}>
                  <RosRxPanel fill />
                </SimWidget>
              </Panel>

              <ResizeHandle orientation="vertical" />

              {/* Front Camera (direct render, no ROS round-trip) */}
              <Panel defaultSize={25} minSize={12}>
                <SimWidget title="Front Camera (sim)" icon={<FaCamera />}>
                  <FrontCamBridge registerCallback={registerCamCallback} />
                </SimWidget>
              </Panel>

              <ResizeHandle orientation="vertical" />

              {/* LIDAR 2-D */}
              <Panel defaultSize={22} minSize={12}>
                <SimWidget title="LIDAR 2D" icon={<GiRadarSweep />}>
                  <LidarWidget2D rangesRef={scanRangesRef} />
                </SimWidget>
              </Panel>

              <ResizeHandle orientation="vertical" />

              {/* ROS Parameter Control */}
              <Panel defaultSize={23} minSize={12}>
                <SimWidget title="ROS Parameters" icon={<TbAdjustmentsAlt />}>
                  <RosParamPanel canvasId={canvasId} />
                </SimWidget>
              </Panel>

            </PanelGroup>
          </Panel>

        </PanelGroup>

        {/* ── Bottom hint bar ──────────────────────────────────────────── */}
        <div style={styles.keyHint}>
          <b>WASD</b> — keyboard drive &nbsp;|&nbsp; ROS /cmd_vel overrides when non-zero
        </div>
      </div>
    </RosBridgeProvider>
  );
}

// ── Inline styles ──────────────────────────────────────────────────────────────

const styles = {
  page: {
    width:         '100%',
    height:        '100vh',
    display:       'flex',
    flexDirection: 'column',
    background:    '#0a0e18',
    fontFamily:    'monospace',
    color:         '#ccc',
    overflow:      'hidden',
  },
  panelOverlay: {
    position:      'absolute',
    top:           '0.75rem',
    right:         '0.75rem',
    zIndex:        10,
    pointerEvents: 'auto',
  },
  statusBar: {
    height:        '2rem',
    display:       'flex',
    alignItems:    'center',
    gap:           '0.5rem',
    padding:       '0 1rem',
    background:    '#0d1a2a',
    borderBottom:  '1px solid #1c2e3e',
    flexShrink:    0,
    fontSize:      '0.75rem',
  },
  dot: {
    width:         '0.55rem',
    height:        '0.55rem',
    borderRadius:  '50%',
    display:       'inline-block',
    flexShrink:    0,
  },
  statusText: {
    whiteSpace:    'nowrap',
  },
  divider: {
    opacity:       0.3,
  },
  keyHint: {
    height:        '1.8rem',
    display:       'flex',
    alignItems:    'center',
    justifyContent:'center',
    background:    '#0d1a2a',
    borderTop:     '1px solid #1c2e3e',
    fontSize:      '0.7rem',
    opacity:       0.7,
    flexShrink:    0,
  },
};

const panelStyles = {
  container: {
    fontFamily:    'monospace',
    fontSize:      '0.72rem',
    color:         '#ccc',
    userSelect:    'none',
  },
  debugToggle: {
    background:    'rgba(0,30,10,0.95)',
    border:        '1px solid #00ff88',
    borderRadius:  '6px',
    color:         '#00ff88',
    padding:       '0.3rem 0.7rem',
    cursor:        'pointer',
    fontSize:      '0.72rem',
    fontFamily:    'monospace',
    backdropFilter:'blur(4px)',
    width:         '100%',
    textAlign:     'left',
    fontWeight:    'bold',
    boxShadow:     '0 0 6px rgba(0,255,136,0.4)',
  },
  toggle: {
    background:    'rgba(26,26,46,0.92)',
    border:        '1px solid #444',
    borderRadius:  '6px',
    color:         '#aad4ff',
    padding:       '0.3rem 0.7rem',
    cursor:        'pointer',
    fontSize:      '0.72rem',
    fontFamily:    'monospace',
    backdropFilter:'blur(4px)',
    width:         '100%',
    textAlign:     'left',
  },
  body: {
    background:    'rgba(16,16,32,0.92)',
    border:        '1px solid #333',
    borderRadius:  '0 0 6px 6px',
    padding:       '0.5rem 0.7rem',
    display:       'flex',
    flexDirection: 'column',
    gap:           '0.45rem',
    minWidth:      '220px',
    backdropFilter:'blur(4px)',
  },
  row: {
    display:       'flex',
    alignItems:    'center',
    gap:           '0.5rem',
  },
  label: {
    width:         '80px',
    color:         '#aaa',
    flexShrink:    0,
  },
  slider: {
    flex:          1,
    accentColor:   '#00ff88',
    cursor:        'pointer',
  },
  value: {
    width:         '54px',
    textAlign:     'right',
    color:         '#eee',
    fontVariantNumeric: 'tabular-nums',
  },
  reset: {
    marginTop:     '0.2rem',
    background:    'transparent',
    border:        '1px solid #444',
    borderRadius:  '4px',
    color:         '#888',
    padding:       '0.2rem 0.5rem',
    cursor:        'pointer',
    fontSize:      '0.68rem',
    fontFamily:    'monospace',
    alignSelf:     'flex-end',
  },
};
