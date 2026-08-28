// src/components/sim/SimDebugPanel.jsx
//
// HTML overlay that floats over the 3-D canvas.
// Reads from a shared stateRef object that is updated by the sensor
// components inside the Canvas — no React re-renders inside the loop.
//
// Layout (top-left corner):
//   ● ROS: CONNECTED / DISCONNECTED
//   LIDAR  X.X Hz
//   CAM    X.X Hz
//   [LiDAR mini-map 160×160]
//   [Camera preview 160×120]

import React, { useEffect, useRef } from 'react';

const PANEL_STYLE = {
  position: 'absolute',
  top: 16,
  left: 16,
  zIndex: 10,
  background: 'rgba(10,10,30,0.82)',
  border: '1px solid rgba(100,150,255,0.35)',
  borderRadius: 8,
  padding: '10px 14px',
  color: '#cce',
  fontFamily: 'monospace',
  fontSize: 12,
  lineHeight: '1.7',
  pointerEvents: 'none',
  userSelect: 'none',
  minWidth: 180,
};

const DOT = (connected) => ({
  display: 'inline-block',
  width: 8,
  height: 8,
  borderRadius: '50%',
  background: connected ? '#44ff88' : '#ff4444',
  marginRight: 6,
  verticalAlign: 'middle',
  boxShadow: connected ? '0 0 6px #44ff88' : '0 0 6px #ff4444',
});

const MAP_SIZE  = 160;   // px
const MAP_SCALE = 14;    // px per metre
const NUM_RAYS  = 72;

function drawMiniMap(canvas, ranges) {
  if (!canvas || !ranges?.length) return;
  const ctx  = canvas.getContext('2d');
  const cx   = MAP_SIZE / 2;
  const cy   = MAP_SIZE / 2;

  // Background
  ctx.fillStyle = '#0a0a1e';
  ctx.fillRect(0, 0, MAP_SIZE, MAP_SIZE);

  // Radial guides at 2, 4, 6 m
  ctx.strokeStyle = 'rgba(80,80,140,0.5)';
  ctx.lineWidth   = 1;
  [2, 4, 6].forEach((r) => {
    ctx.beginPath();
    ctx.arc(cx, cy, r * MAP_SCALE, 0, 2 * Math.PI);
    ctx.stroke();
  });

  // Car icon
  ctx.fillStyle = '#f06a10';
  ctx.fillRect(cx - 4, cy - 6, 8, 12);

  // Ray returns
  const angleStep = (2 * Math.PI) / NUM_RAYS;
  ctx.fillStyle = '#44aaff';
  for (let i = 0; i < NUM_RAYS; i++) {
    const a   = i * angleStep;
    const r   = Math.min(ranges[i] ?? 12, 12);
    const px  = cx + r * MAP_SCALE * Math.cos(a);
    const py  = cy + r * MAP_SCALE * Math.sin(a);
    ctx.fillRect(px - 1.5, py - 1.5, 3, 3);
  }
}

export default function SimDebugPanel({ stateRef }) {
  const mapCanvasRef = useRef(null);
  const rosLabelRef  = useRef(null);
  const rosDotRef    = useRef(null);
  const lidarHzRef   = useRef(null);
  const camHzRef     = useRef(null);
  const imgRef       = useRef(null);

  // Poll the shared stateRef at 5 Hz to update the DOM directly
  // (avoids React re-render inside the animation loop).
  useEffect(() => {
    const id = setInterval(() => {
      const s = stateRef?.current;
      if (!s) return;

      const ok = s.connected;
      if (rosLabelRef.current) {
        rosLabelRef.current.textContent = ok ? 'CONNECTED' : 'DISCONNECTED';
        rosLabelRef.current.style.color  = ok ? '#44ff88' : '#ff5555';
      }
      if (rosDotRef.current) {
        rosDotRef.current.style.background  = ok ? '#44ff88' : '#ff4444';
        rosDotRef.current.style.boxShadow   = ok ? '0 0 6px #44ff88' : '0 0 6px #ff4444';
      }
      if (lidarHzRef.current && s.lidarHz != null) {
        lidarHzRef.current.textContent = `${s.lidarHz.toFixed(1)} Hz`;
      }
      if (camHzRef.current && s.cameraHz != null) {
        camHzRef.current.textContent = `${s.cameraHz.toFixed(1)} Hz`;
      }
      if (s.lidarRanges?.length) {
        drawMiniMap(mapCanvasRef.current, s.lidarRanges);
      }
      if (imgRef.current && s.cameraDataUrl) {
        imgRef.current.src = s.cameraDataUrl;
      }
    }, 200);
    return () => clearInterval(id);
  }, [stateRef]);

  return (
    <div style={PANEL_STYLE}>
      {/* Connection status */}
      <div style={{ marginBottom: 6 }}>
        <span ref={rosDotRef} style={DOT(false)} />
        ROS: <span ref={rosLabelRef} style={{ color: '#ff5555' }}>
          DISCONNECTED
        </span>
      </div>

      {/* Sensor Hz */}
      <div style={{ display: 'grid', gridTemplateColumns: '56px 1fr', gap: '2px 8px' }}>
        <span style={{ color: '#7af' }}>LIDAR</span>
        <span ref={lidarHzRef} style={{ color: '#cce' }}>— Hz</span>
        <span style={{ color: '#7af' }}>CAM</span>
        <span ref={camHzRef}   style={{ color: '#cce' }}>— Hz</span>
      </div>

      {/* LiDAR mini-map */}
      <div style={{ marginTop: 10, marginBottom: 4, color: '#556', fontSize: 11 }}>
        LiDAR (12 m max)
      </div>
      <canvas
        ref={mapCanvasRef}
        width={MAP_SIZE}
        height={MAP_SIZE}
        style={{ display: 'block', borderRadius: 4, border: '1px solid #223' }}
      />

      {/* Camera preview */}
      <div style={{ marginTop: 10, marginBottom: 4, color: '#556', fontSize: 11 }}>
        Front camera
      </div>
      <img
        ref={imgRef}
        alt="front camera"
        width={160}
        height={120}
        style={{ display: 'block', borderRadius: 4, border: '1px solid #223', objectFit: 'cover' }}
      />
    </div>
  );
}
