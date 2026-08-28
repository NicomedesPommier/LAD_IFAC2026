import React, { useState, useEffect, useRef } from "react";
import { Handle, Position } from "@xyflow/react";

/**
 * LidarVisualizerNode - Visualizes LIDAR /scan data on the canvas
 * Displays a polar plot of distance measurements
 */
export default function LidarVisualizerNode({ id, data }) {
  const canvasRef = useRef(null);
  const [isConnected, setIsConnected] = useState(false);
  const [scanData, setScanData] = useState(null);
  const [topicName, setTopicName] = useState(data.topicName || "/scan");
  const [showGrid, setShowGrid] = useState(data.showGrid !== false);
  const [maxRange, setMaxRange] = useState(data.maxRange || 10.0);

  // Notify parent of data changes
  const notify = (updates) => {
    if (data.onChange) {
      data.onChange(id, { ...data, ...updates });
    }
  };

  // Simulate receiving scan data (in production, this would subscribe to ROS topic)
  useEffect(() => {
    // This would be replaced with actual ROS2 WebSocket/bridge connection
    const interval = setInterval(() => {
      // Simulate LIDAR scan data
      if (isConnected) {
        const ranges = Array.from({ length: 360 }, () =>
          Math.random() * maxRange
        );

        setScanData({
          ranges: ranges,
          angle_min: -Math.PI,
          angle_max: Math.PI,
          angle_increment: (2 * Math.PI) / 360,
          range_min: 0.1,
          range_max: maxRange,
        });
      }
    }, 100);

    return () => clearInterval(interval);
  }, [isConnected, maxRange]);

  // Draw LIDAR visualization
  useEffect(() => {
    if (!canvasRef.current || !scanData) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    const width = canvas.width;
    const height = canvas.height;
    const centerX = width / 2;
    const centerY = height / 2;
    const scale = Math.min(width, height) / 2 / maxRange * 0.9;

    // Clear canvas
    ctx.fillStyle = "rgba(0, 0, 0, 0.9)";
    ctx.fillRect(0, 0, width, height);

    // Draw grid if enabled
    if (showGrid) {
      ctx.strokeStyle = "rgba(125, 249, 255, 0.1)";
      ctx.lineWidth = 1;

      // Draw concentric circles
      for (let r = 1; r <= maxRange; r++) {
        ctx.beginPath();
        ctx.arc(centerX, centerY, r * scale, 0, 2 * Math.PI);
        ctx.stroke();

        // Draw range labels
        ctx.fillStyle = "rgba(125, 249, 255, 0.5)";
        ctx.font = "10px monospace";
        ctx.fillText(`${r}m`, centerX + 2, centerY - r * scale + 2);
      }

      // Draw angle lines (every 45 degrees)
      for (let angle = 0; angle < 360; angle += 45) {
        const rad = (angle * Math.PI) / 180;
        ctx.beginPath();
        ctx.moveTo(centerX, centerY);
        ctx.lineTo(
          centerX + Math.cos(rad) * maxRange * scale,
          centerY + Math.sin(rad) * maxRange * scale
        );
        ctx.stroke();
      }
    }

    // Draw LIDAR points
    const { ranges, angle_min, angle_increment } = scanData;

    ctx.fillStyle = "rgba(125, 249, 255, 0.8)";

    for (let i = 0; i < ranges.length; i++) {
      const range = ranges[i];

      // Skip invalid readings
      if (isNaN(range) || range < scanData.range_min || range > scanData.range_max) {
        continue;
      }

      const angle = angle_min + i * angle_increment;
      const x = centerX + Math.cos(angle) * range * scale;
      const y = centerY + Math.sin(angle) * range * scale;

      ctx.beginPath();
      ctx.arc(x, y, 2, 0, 2 * Math.PI);
      ctx.fill();
    }

    // Draw robot center
    ctx.fillStyle = "rgba(255, 95, 244, 0.8)";
    ctx.beginPath();
    ctx.arc(centerX, centerY, 4, 0, 2 * Math.PI);
    ctx.fill();

    // Draw robot direction indicator
    ctx.strokeStyle = "rgba(255, 95, 244, 0.8)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(centerX, centerY);
    ctx.lineTo(centerX, centerY - 15);
    ctx.stroke();

  }, [scanData, showGrid, maxRange]);

  const handleToggleConnection = () => {
    setIsConnected(!isConnected);
  };

  const handleTopicChange = (value) => {
    setTopicName(value);
    notify({ topicName: value });
  };

  const handleToggleGrid = () => {
    const newShowGrid = !showGrid;
    setShowGrid(newShowGrid);
    notify({ showGrid: newShowGrid });
  };

  const handleMaxRangeChange = (value) => {
    const newMax = parseFloat(value) || 10.0;
    setMaxRange(newMax);
    notify({ maxRange: newMax });
  };

  return (
    <div className="rf-card" style={{ minWidth: 400, maxWidth: 450 }}>
      <div className="rf-card__title">LIDAR Visualizer</div>

      <div className="rf-card__body" style={{ display: "grid", gap: ".5rem" }}>
        {/* Topic Input */}
        <div className="rf-field">
          <span className="rf-field__label">Topic</span>
          <input
            value={topicName}
            onChange={(e) => handleTopicChange(e.target.value)}
            placeholder="/scan"
            className="rf-input"
          />
        </div>

        {/* Max Range */}
        <div className="rf-field">
          <span className="rf-field__label">Max Range (m)</span>
          <input
            type="number"
            value={maxRange}
            onChange={(e) => handleMaxRangeChange(e.target.value)}
            min="1"
            max="50"
            step="0.5"
            className="rf-input"
          />
        </div>

        {/* Controls */}
        <div style={{ display: "flex", gap: ".5rem", marginTop: ".25rem" }}>
          <button
            className="btn"
            onClick={handleToggleConnection}
            style={{
              flex: 1,
              background: isConnected
                ? "rgba(0, 255, 0, 0.2)"
                : "rgba(255, 100, 100, 0.2)",
              color: isConnected ? "#00ff00" : "#ff6464",
              border: `1px solid ${isConnected ? "#00ff00" : "#ff6464"}`,
            }}
          >
            {isConnected ? "● Connected" : "○ Disconnected"}
          </button>

          <button
            className="btn"
            onClick={handleToggleGrid}
            style={{
              background: showGrid
                ? "rgba(125, 249, 255, 0.2)"
                : "rgba(255,255,255,0.1)",
            }}
            title={showGrid ? "Hide grid" : "Show grid"}
          >
            {showGrid ? "Grid ✓" : "Grid"}
          </button>
        </div>

        {/* Canvas Visualization */}
        <div style={{
          marginTop: ".5rem",
          border: "2px solid rgba(125, 249, 255, 0.3)",
          borderRadius: "8px",
          overflow: "hidden",
        }}>
          <canvas
            ref={canvasRef}
            width={380}
            height={380}
            style={{
              display: "block",
              width: "100%",
              height: "auto",
            }}
          />
        </div>

        {/* Status Info */}
        {scanData && (
          <div style={{
            fontSize: "11px",
            opacity: 0.7,
            padding: "6px 8px",
            background: "rgba(0,0,0,0.3)",
            borderRadius: "4px",
            marginTop: ".25rem",
          }}>
            Points: {scanData.ranges.length} |
            Range: {scanData.range_min.toFixed(1)}m - {scanData.range_max.toFixed(1)}m |
            Angle: {(scanData.angle_min * 180 / Math.PI).toFixed(0)}° to {(scanData.angle_max * 180 / Math.PI).toFixed(0)}°
          </div>
        )}

        {!isConnected && (
          <div style={{
            fontSize: "12px",
            opacity: 0.6,
            fontStyle: "italic",
            textAlign: "center",
            padding: "8px",
          }}>
            Click "Connect" to start receiving LIDAR data
          </div>
        )}
      </div>

      <Handle type="target" position={Position.Left} id="topic" />
    </div>
  );
}
