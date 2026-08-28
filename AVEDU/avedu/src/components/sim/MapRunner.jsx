/**
 * MapRunner.jsx — tiling panel layout
 *
 * Widgets occupy real space in the layout (not canvas overlays).
 *
 * Layout:
 *   ┌──────────────────────────────────────────────────┐
 *   │  Panel Dock  (toggle + zone controls)            │
 *   ├──────────────────────────┬───────────────────────┤
 *   │                          │  right-zone widget    │
 *   │   3-D Simulation         ├───────────────────────┤  ← resize handle
 *   │                          │  right-zone widget    │
 *   ├──────────────────────────┴───────────────────────┤  ← resize handle
 *   │         bottom-zone widget (via dock zone control)│
 *   └──────────────────────────────────────────────────┘
 *
 * Drag resize handles to adjust proportions.
 * Use the dock bar to open/close panels or move them between zones.
 *
 * The presentational pieces (dock, widget shell, camera grid, sidebar, resize
 * handles, toggle pills) live in ./mapRunner/*; the 3-D scene is in
 * ./mapRunner/RunnerSimScene. This file orchestrates state + layout.
 */

import React, { useState, useEffect, useRef, Suspense, useCallback } from 'react';
import { Group as PanelGroup, Panel } from 'react-resizable-panels';
import { Canvas } from '@react-three/fiber';

import fileApi from '../../services/fileApi';
import { BASE_MAPS, getBaseMap } from './baseMaps';
import { ROSProvider } from './ROSContext';
import CameraFrustumViz, { CameraFrustumLegend } from './CameraFrustumViz';
import LidarRayViz, { LidarRayLegend } from './LidarRayViz';
import RosRxPanel from './RosRxPanel';
import LidarWidget2D from './LidarWidget2D';
import RosParamPanel from './RosParamPanel';
import { RosBridgeProvider } from '../../hooks/useRosBridge';

import ResizeHandle from './mapRunner/ResizeHandle';
import WidgetShell from './mapRunner/WidgetShell';
import PanelDock from './mapRunner/PanelDock';
import TogglePill from './mapRunner/TogglePill';
import MultiCameraWidget from './mapRunner/MultiCameraWidget';
import MapSidebar from './mapRunner/MapSidebar';
import RunnerSimScene from './mapRunner/RunnerSimScene';

import '../../styles/components/_map-runner.scss';

// ── Main export ────────────────────────────────────────────────────────────────

export default function MapRunner({ canvasId, hideMenus, onStartSim }) {
  const [mapFiles, setMapFiles]         = useState([]);
  const [selectedMapPath, setSelectedPath] = useState('');
  const [mapData, setMapData]           = useState(null);
  const [resetKey, setResetKey]         = useState(0);
  const [showCamViz, setShowCamViz]     = useState(false);
  const [showLidarViz, setShowLidarViz] = useState(false);

  // Which widgets are open and in which zone
  const [openWidgets, setOpenWidgets]   = useState(['cameras', 'lidar', 'ros-params']);
  const [zones, setZones]               = useState({
    'camera-ros': 'right',
    'cameras':    'right',
    'lidar':      'right',
    'ros-params': 'right',
  });

  // Sensor data — one frame entry per camera id
  const camFramesRef                    = useRef({});     // { front: {url, hz}, ... } — read on a timer by MultiCameraWidget
  const scanRangesRef                   = useRef([]);

  const namespace = canvasId ? `/ws_${canvasId.replace(/-/g, '_')}` : '';
  const carRef    = useRef(null);

  useEffect(() => {
    if (!canvasId) return;
    fileApi.listFiles(canvasId)
      .then(files => setMapFiles(files.filter(f => f.path.endsWith('.json'))))
      .catch(console.error);
  }, [canvasId]);

  // Auto-load the built-in base map on first mount so the Simulation tab shows a
  // drivable map immediately instead of a blank "— Choose map —" screen.
  useEffect(() => {
    const base = BASE_MAPS[0];
    if (base) {
      setSelectedPath(base.id);
      setMapData(base.data);
    }
    // run once on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleLoadMap = async () => {
    if (!selectedMapPath) return;
    // Built-in base maps (e.g. SDCS Cityscape) load directly — no workspace file.
    const base = getBaseMap(selectedMapPath);
    if (base) {
      setMapData(base.data);
      onStartSim?.();
      return;
    }
    try {
      const file = await fileApi.readFromDocker(canvasId, selectedMapPath);
      setMapData(JSON.parse(file.content));
      onStartSim?.();
    } catch (e) {
      alert('Failed to parse map: ' + e.message);
    }
  };

  const handleScan   = useCallback((r) => { scanRangesRef.current = r; }, []);
  const handleFrames = useCallback((camId, url, hz) => {
    // Write into a ref (no setState) so ~20 camera frames/sec don't re-render the
    // whole component tree; MultiCameraWidget reads this ref on a timer.
    const prev = camFramesRef.current[camId];
    camFramesRef.current[camId] = { url, hz: hz != null ? hz : prev?.hz ?? null };
  }, []);

  // Toggle a widget open / closed
  const handleToggle = useCallback((id) => {
    setOpenWidgets(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  }, []);

  // Move a widget to a different zone
  const handleMoveZone = useCallback((id, zone) => {
    setZones(prev => ({ ...prev, [id]: zone }));
  }, []);

  // Close (same as toggle off)
  const handleClose = useCallback((id) => {
    setOpenWidgets(prev => prev.filter(x => x !== id));
  }, []);

  // Render widget content by id
  const renderContent = (id) => {
    switch (id) {
      case 'camera-ros': return <RosRxPanel fill />;
      case 'cameras':    return <MultiCameraWidget framesRef={camFramesRef} />;
      case 'lidar':      return <LidarWidget2D rangesRef={scanRangesRef} />;
      case 'ros-params': return <RosParamPanel canvasId={canvasId} />;
      default: return null;
    }
  };

  // Separate widgets by zone
  const rightWidgets  = openWidgets.filter(id => zones[id] === 'right');
  const bottomWidgets = openWidgets.filter(id => zones[id] === 'bottom');
  const hasRight  = rightWidgets.length  > 0;
  const hasBottom = bottomWidgets.length > 0;

  return (
    <div className="map-runner">

      {/* ── Map selector sidebar ───────────────────────────────────────── */}
      {!hideMenus && (
        <MapSidebar
          mapFiles={mapFiles}
          selectedMapPath={selectedMapPath}
          onSelectPath={setSelectedPath}
          mapData={mapData}
          canvasId={canvasId}
          onLoadMap={handleLoadMap}
          onReset={() => setResetKey(k => k + 1)}
        />
      )}

      {/* ── Right section: dock + tiled layout ────────────────────────── */}
      <div className="map-runner__main">

        {/* Dock bar */}
        <PanelDock
          openWidgets={openWidgets}
          onToggle={handleToggle}
          extraControls={
            <>
              <TogglePill
                accent="cam"
                active={showCamViz}
                onClick={() => setShowCamViz(v => !v)}
                title={showCamViz ? 'Hide camera FOV overlay' : 'Show camera positions & FOV cones'}
                icon="📷"
                label="Cam Viz"
              />
              <TogglePill
                accent="lidar"
                active={showLidarViz}
                onClick={() => setShowLidarViz(v => !v)}
                title={showLidarViz ? 'Hide LIDAR ray overlay' : 'Show LIDAR scan rays in 3-D'}
                icon="📡"
                label="Lidar Viz"
              />
            </>
          }
        />

        {/* Tiled panels */}
        {mapData ? (
          <RosBridgeProvider>
            <ROSProvider>
              {/* Outer: vertical split between (canvas+right) and bottom */}
              <PanelGroup
                orientation="vertical"
                key={`v-${hasBottom}`}
                style={{ flex: 1, minHeight: 0 }}
              >
                {/* Top row */}
                <Panel minSize={20}>
                  {/* Inner: horizontal split between canvas and right widgets */}
                  <PanelGroup
                    orientation="horizontal"
                    key={`h-${hasRight}-${rightWidgets.join(',')}`}
                    style={{ height: '100%' }}
                  >
                    {/* 3-D canvas */}
                    <Panel minSize={20} className="map-runner__canvas-panel">
                      <Canvas shadows camera={{ position: [0, 6, 8], fov: 45 }}
                        style={{ position: 'absolute', inset: 0, background: '#1a1a2e' }}>
                        <Suspense fallback={null}>
                          <RunnerSimScene
                            key={namespace}
                            mapData={mapData}
                            carRef={carRef}
                            onScan={handleScan}
                            onFrames={handleFrames}
                            resetKey={resetKey}
                            namespace={namespace}
                          />
                          {showCamViz && <CameraFrustumViz carRef={carRef} />}
                          {showLidarViz && <LidarRayViz carRef={carRef} rangesRef={scanRangesRef} />}
                        </Suspense>
                      </Canvas>

                      {/* Camera FOV legend */}
                      {showCamViz && <CameraFrustumLegend />}

                      {/* LIDAR ray legend */}
                      {showLidarViz && <LidarRayLegend />}

                      {/* cmd_vel badge on canvas */}
                      <div className={`map-runner__cmdvel-badge${namespace ? '' : ' map-runner__cmdvel-badge--inactive'}`}>
                        {namespace ? `${namespace}/cmd_vel` : '/cmd_vel'}
                      </div>
                    </Panel>

                    {/* Right widget stack */}
                    {hasRight && <>
                      <ResizeHandle orientation="horizontal" />
                      <Panel defaultSize={35} minSize={15}>
                        <PanelGroup orientation="vertical" style={{ height: '100%' }}>
                          {rightWidgets.map((id, i) => (
                            <React.Fragment key={id}>
                              {i > 0 && <ResizeHandle orientation="vertical" />}
                              <Panel minSize={10}>
                                <WidgetShell id={id} zone="right" onClose={handleClose} onMoveZone={handleMoveZone}>
                                  {renderContent(id)}
                                </WidgetShell>
                              </Panel>
                            </React.Fragment>
                          ))}
                        </PanelGroup>
                      </Panel>
                    </>}
                  </PanelGroup>
                </Panel>

                {/* Bottom widget strip */}
                {hasBottom && <>
                  <ResizeHandle orientation="vertical" />
                  <Panel defaultSize={30} minSize={8} collapsible collapsedSize={0}>
                    <PanelGroup orientation="horizontal" style={{ height: '100%' }}>
                      {bottomWidgets.map((id, i) => (
                        <React.Fragment key={id}>
                          {i > 0 && <ResizeHandle orientation="horizontal" />}
                          <Panel minSize={15}>
                            <WidgetShell id={id} zone="bottom" onClose={handleClose} onMoveZone={handleMoveZone}>
                              {renderContent(id)}
                            </WidgetShell>
                          </Panel>
                        </React.Fragment>
                      ))}
                    </PanelGroup>
                  </Panel>
                </>}
              </PanelGroup>
            </ROSProvider>
          </RosBridgeProvider>
        ) : (
          <div className="map-runner__empty">
            <p className="map-runner__empty-text">Select and load a map to start the simulation.</p>
          </div>
        )}
      </div>
    </div>
  );
}
