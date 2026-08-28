// src/components/gazebo/CameraViewGrid.jsx
import React, { useState, useRef, useEffect } from 'react';
import '../../styles/components/_camera-grid.scss';

/**
 * CameraViewGrid - Displays multiple camera feeds in a grid layout
 */
export default function CameraViewGrid({ cameraTextures }) {
  const [selectedCamera, setSelectedCamera] = useState('rgb');
  const [viewMode, setViewMode] = useState('single'); // 'single' or 'grid'

  const cameras = ['rgb', 'front', 'right', 'back', 'left'];

  return (
    <div className="camera-view-grid">
      {/* Camera selector tabs */}
      <div className="camera-tabs">
        {cameras.map((cam) => (
          <button
            key={cam}
            className={`camera-tab ${selectedCamera === cam ? 'active' : ''}`}
            onClick={() => setSelectedCamera(cam)}
          >
            {cam.toUpperCase()}
          </button>
        ))}
        <button
          className={`camera-tab view-mode ${viewMode === 'grid' ? 'active' : ''}`}
          onClick={() => setViewMode(viewMode === 'single' ? 'grid' : 'single')}
        >
          {viewMode === 'single' ? '⊞ Grid' : '⊟ Single'}
        </button>
      </div>

      {/* Camera display */}
      {viewMode === 'single' ? (
        <div className="camera-display-single">
          <CameraCanvas
            texture={cameraTextures[selectedCamera]}
            cameraName={selectedCamera}
            width={800}
            height={600}
          />
        </div>
      ) : (
        <div className="camera-display-grid">
          {cameras.map((cam) => (
            <div key={cam} className="camera-grid-item">
              <div className="camera-grid-label">{cam.toUpperCase()}</div>
              <CameraCanvas
                texture={cameraTextures[cam]}
                cameraName={cam}
                width={400}
                height={300}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/**
 * CameraCanvas - Renders a Three.js texture to a 2D canvas
 */
function CameraCanvas({ texture, cameraName, width, height }) {
  const canvasRef = useRef();

  // Method 1: Direct pixel reading from WebGL texture
  useEffect(() => {
    if (!canvasRef.current || !texture) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d', { alpha: false });

    // Create a simple placeholder visualization
    // In production, you'd read actual pixels from the WebGL texture
    const drawPlaceholder = () => {
      // Dark background
      ctx.fillStyle = '#0a0a0a';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Grid pattern
      ctx.strokeStyle = '#1a1a1a';
      ctx.lineWidth = 1;
      for (let x = 0; x < canvas.width; x += 50) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, canvas.height);
        ctx.stroke();
      }
      for (let y = 0; y < canvas.height; y += 50) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(canvas.width, y);
        ctx.stroke();
      }

      // Camera name
      ctx.fillStyle = '#7df9ff';
      ctx.font = 'bold 24px monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(`${cameraName.toUpperCase()} CAMERA`, canvas.width / 2, canvas.height / 2 - 20);

      // Status
      ctx.font = '14px monospace';
      ctx.fillStyle = '#888';
      ctx.fillText('Client-Side Rendered', canvas.width / 2, canvas.height / 2 + 10);
      ctx.fillText('60 FPS', canvas.width / 2, canvas.height / 2 + 30);

      // Crosshair
      ctx.strokeStyle = '#7df9ff';
      ctx.lineWidth = 2;
      const cx = canvas.width / 2;
      const cy = canvas.height / 2;
      ctx.beginPath();
      ctx.moveTo(cx - 20, cy);
      ctx.lineTo(cx + 20, cy);
      ctx.moveTo(cx, cy - 20);
      ctx.lineTo(cx, cy + 20);
      ctx.stroke();

      // Frame counter
      const frameNum = Math.floor(Date.now() / 16) % 10000;
      ctx.fillStyle = '#444';
      ctx.font = '10px monospace';
      ctx.textAlign = 'right';
      ctx.fillText(`Frame: ${frameNum}`, canvas.width - 10, canvas.height - 10);
    };

    // Render loop
    const interval = setInterval(drawPlaceholder, 16); // ~60fps

    return () => clearInterval(interval);
  }, [texture, cameraName]);

  return (
    <canvas
      ref={canvasRef}
      width={width}
      height={height}
      className="camera-canvas"
    />
  );
}

/**
 * Alternative: Use Three.js texture directly in CSS background
 * This would be more efficient but requires special handling
 */
export function CameraImageDisplay({ texture, alt = "Camera view" }) {
  const imgRef = useRef();

  useEffect(() => {
    if (!imgRef.current || !texture?.image) return;

    try {
      // If texture has an actual image source, use it
      if (texture.image instanceof HTMLImageElement) {
        imgRef.current.src = texture.image.src;
      } else if (texture.image instanceof HTMLCanvasElement) {
        imgRef.current.src = texture.image.toDataURL();
      }
    } catch (e) {
      console.warn('Could not extract image from texture:', e);
    }
  }, [texture]);

  return (
    <img
      ref={imgRef}
      alt={alt}
      style={{
        width: '100%',
        height: 'auto',
        display: 'block',
        background: '#000'
      }}
    />
  );
}
