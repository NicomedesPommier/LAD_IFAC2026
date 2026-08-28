// components/ide/LidarVisualizer.jsx
import React, { useState, useEffect, useRef } from "react";
import PropTypes from "prop-types";
import "./LidarVisualizer.scss";

/**
 * LIDAR Visualizer Side Panel
 * Displays real-time LIDAR scan data from ROS2 /scan topic
 */
export function LidarVisualizer({ canvasId, isVisible }) {
  const canvasRef = useRef(null);
  const wsRef = useRef(null);
  const scanHistoryRef = useRef([]);
  const [isConnected, setIsConnected] = useState(false);
  const [scanData, setScanData] = useState(null);
  const [topicName, setTopicName] = useState("/qcar/lidar/scan");
  const [showGrid, setShowGrid] = useState(true);
  const [maxRange, setMaxRange] = useState(10.0);
  const [scansToKeep, setScansToKeep] = useState(5);
  const [connectionError, setConnectionError] = useState(null);
  const [stats, setStats] = useState({ messagesReceived: 0, lastUpdate: null, totalPoints: 0 });

  // Connect to rosbridge WebSocket
  useEffect(() => {
    if (!isConnected) return;

    // ROSBridge WebSocket URL (adjust based on your setup)
    const rosbridgeUrl = "ws://localhost:9090";

    try {
      const ws = new WebSocket(rosbridgeUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        console.log("[LIDAR Visualizer] WebSocket connected");
        setConnectionError(null);

        // Subscribe to the LIDAR topic
        const subscribeMsg = {
          op: "subscribe",
          topic: topicName,
          type: "sensor_msgs/LaserScan",
          throttle_rate: 100, // Limit to 10Hz
          queue_length: 1
        };

        ws.send(JSON.stringify(subscribeMsg));
        console.log(`[LIDAR Visualizer] Subscribed to ${topicName}`);
      };

      ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);

          if (message.op === "publish" && message.topic === topicName) {
            const msg = message.msg;

            // Check for valid ranges
            const validRanges = msg.ranges?.filter(r =>
              !isNaN(r) && isFinite(r) && r >= msg.range_min && r <= msg.range_max
            );
            const infinityCount = msg.ranges?.filter(r => r === Infinity || r === -Infinity).length;
            const nanCount = msg.ranges?.filter(r => isNaN(r)).length;

            console.log("[LIDAR Visualizer] Received scan:", {
              topic: topicName,
              ranges_count: msg.ranges?.length,
              valid_ranges: validRanges?.length,
              infinity_count: infinityCount,
              nan_count: nanCount,
              angle_min: msg.angle_min,
              angle_max: msg.angle_max,
              angle_increment: msg.angle_increment,
              range_min: msg.range_min,
              range_max: msg.range_max,
              sample_ranges: msg.ranges?.slice(0, 10),
              sample_valid_ranges: validRanges?.slice(0, 10)
            });

            const newScan = {
              ranges: msg.ranges,
              angle_min: msg.angle_min,
              angle_max: msg.angle_max,
              angle_increment: msg.angle_increment,
              range_min: msg.range_min,
              range_max: msg.range_max,
              timestamp: Date.now()
            };

            // Add to history and keep only last N scans
            scanHistoryRef.current.push(newScan);
            if (scanHistoryRef.current.length > scansToKeep) {
              scanHistoryRef.current.shift();
            }

            setScanData(newScan);

            // Count total valid points across all scans in history
            const totalPoints = scanHistoryRef.current.reduce((sum, scan) => {
              const validPoints = scan.ranges.filter(r =>
                !isNaN(r) && isFinite(r) && r >= scan.range_min && r <= scan.range_max
              ).length;
              return sum + validPoints;
            }, 0);

            console.log("[LIDAR Visualizer] Stats:", {
              scans_buffered: scanHistoryRef.current.length,
              total_points: totalPoints,
              valid_points_this_scan: newScan.ranges.filter(r =>
                !isNaN(r) && isFinite(r) && r >= newScan.range_min && r <= newScan.range_max
              ).length
            });

            setStats(prev => ({
              messagesReceived: prev.messagesReceived + 1,
              lastUpdate: new Date().toLocaleTimeString(),
              totalPoints
            }));
          }
        } catch (error) {
          console.error("[LIDAR Visualizer] Error parsing message:", error);
        }
      };

      ws.onerror = (error) => {
        console.error("[LIDAR Visualizer] WebSocket error:", error);
        setConnectionError("WebSocket connection error. Is rosbridge running?");
      };

      ws.onclose = () => {
        console.log("[LIDAR Visualizer] WebSocket disconnected");
        setIsConnected(false);
        setConnectionError("Connection closed");
      };

      return () => {
        if (ws.readyState === WebSocket.OPEN) {
          // Unsubscribe before closing
          const unsubscribeMsg = {
            op: "unsubscribe",
            topic: topicName
          };
          ws.send(JSON.stringify(unsubscribeMsg));
        }
        ws.close();
      };
    } catch (error) {
      console.error("[LIDAR Visualizer] Failed to create WebSocket:", error);
      setConnectionError("Failed to connect. Make sure rosbridge is running on ws://localhost:9090");
      setIsConnected(false);
    }
  }, [isConnected, topicName, scansToKeep]);

  // Clear history when scansToKeep changes
  useEffect(() => {
    if (scanHistoryRef.current.length > scansToKeep) {
      scanHistoryRef.current = scanHistoryRef.current.slice(-scansToKeep);
    }
  }, [scansToKeep]);

  // Draw LIDAR visualization
  useEffect(() => {
    if (!canvasRef.current || !scanData || !isVisible) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    const width = canvas.width;
    const height = canvas.height;
    const centerX = width / 2;
    const centerY = height / 2;
    const scale = Math.min(width, height) / 2 / maxRange * 0.85;

    // Clear canvas
    ctx.fillStyle = "rgba(11, 16, 32, 0.95)";
    ctx.fillRect(0, 0, width, height);

    // Draw grid if enabled
    if (showGrid) {
      ctx.strokeStyle = "rgba(125, 249, 255, 0.15)";
      ctx.lineWidth = 1;

      // Draw concentric circles
      for (let r = 1; r <= Math.floor(maxRange); r++) {
        ctx.beginPath();
        ctx.arc(centerX, centerY, r * scale, 0, 2 * Math.PI);
        ctx.stroke();

        // Draw range labels
        ctx.fillStyle = "rgba(125, 249, 255, 0.5)";
        ctx.font = "11px 'Fira Code', monospace";
        ctx.fillText(`${r}m`, centerX + 4, centerY - r * scale + 4);
      }

      // Draw angle lines (every 30 degrees)
      ctx.strokeStyle = "rgba(125, 249, 255, 0.1)";
      for (let angle = 0; angle < 360; angle += 30) {
        const rad = (angle * Math.PI) / 180;
        ctx.beginPath();
        ctx.moveTo(centerX, centerY);
        ctx.lineTo(
          centerX + Math.cos(rad - Math.PI / 2) * maxRange * scale,
          centerY + Math.sin(rad - Math.PI / 2) * maxRange * scale
        );
        ctx.stroke();

        // Draw angle labels
        ctx.fillStyle = "rgba(125, 249, 255, 0.6)";
        ctx.font = "10px 'Fira Code', monospace";
        const labelRadius = maxRange * scale * 0.92;
        const x = centerX + Math.cos(rad - Math.PI / 2) * labelRadius;
        const y = centerY + Math.sin(rad - Math.PI / 2) * labelRadius;
        ctx.fillText(`${angle}°`, x - 12, y + 4);
      }
    }

    // Draw LIDAR points from all scans in history
    const scans = scanHistoryRef.current;
    const numScans = scans.length;

    console.log("[LIDAR Visualizer] Drawing scans:", {
      num_scans: numScans,
      canvas_size: { width, height },
      center: { centerX, centerY },
      scale,
      maxRange
    });

    let totalPointsDrawn = 0;

    // Draw older scans first (with more transparency) and newer scans on top
    for (let scanIndex = 0; scanIndex < numScans; scanIndex++) {
      const scan = scans[scanIndex];
      const { ranges, angle_min, angle_increment } = scan;

      // Calculate opacity based on age (older = more transparent)
      const age = numScans - scanIndex;
      const opacity = 0.3 + (scanIndex / numScans) * 0.7; // Range from 0.3 to 1.0

      let pointsInThisScan = 0;

      for (let i = 0; i < ranges.length; i++) {
        const range = ranges[i];

        // Skip invalid readings (NaN, Infinity, or out of bounds)
        if (isNaN(range) || !isFinite(range) || range < scan.range_min || range > scan.range_max) {
          continue;
        }

        const angle = angle_min + i * angle_increment;
        const x = centerX + Math.cos(angle) * range * scale;
        const y = centerY + Math.sin(angle) * range * scale;

        // Color based on distance (closer = red, farther = cyan)
        const normalizedDist = range / maxRange;
        const red = Math.floor((1 - normalizedDist) * 255);
        const cyan = Math.floor(normalizedDist * 255);

        ctx.fillStyle = `rgba(${red}, ${cyan}, 255, ${opacity})`;
        ctx.beginPath();
        ctx.arc(x, y, 2, 0, 2 * Math.PI);
        ctx.fill();

        pointsInThisScan++;
        totalPointsDrawn++;
      }

      if (scanIndex === 0) {
        console.log("[LIDAR Visualizer] First scan details:", {
          angle_min,
          angle_increment,
          total_ranges: ranges.length,
          points_drawn: pointsInThisScan,
          sample_point: {
            range: ranges[0],
            angle: angle_min,
            x: centerX + Math.cos(angle_min) * ranges[0] * scale,
            y: centerY + Math.sin(angle_min) * ranges[0] * scale
          }
        });
      }
    }

    console.log("[LIDAR Visualizer] Total points drawn:", totalPointsDrawn);

    // Draw robot center
    ctx.fillStyle = "rgba(255, 95, 244, 0.9)";
    ctx.beginPath();
    ctx.arc(centerX, centerY, 5, 0, 2 * Math.PI);
    ctx.fill();

    // Draw robot direction indicator (forward = up)
    ctx.strokeStyle = "rgba(255, 95, 244, 0.9)";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(centerX, centerY);
    ctx.lineTo(centerX, centerY - 20);
    ctx.stroke();

    // Draw arrow head
    ctx.beginPath();
    ctx.moveTo(centerX, centerY - 20);
    ctx.lineTo(centerX - 5, centerY - 14);
    ctx.moveTo(centerX, centerY - 20);
    ctx.lineTo(centerX + 5, centerY - 14);
    ctx.stroke();

  }, [scanData, showGrid, maxRange, isVisible, scansToKeep]);

  const handleToggleConnection = () => {
    if (isConnected) {
      setIsConnected(false);
      setScanData(null);
      scanHistoryRef.current = [];
      setStats({ messagesReceived: 0, lastUpdate: null, totalPoints: 0 });
    } else {
      setConnectionError(null);
      scanHistoryRef.current = [];
      setIsConnected(true);
    }
  };

  if (!isVisible) return null;

  return (
    <div className="lidar-visualizer">
      <div className="lidar-visualizer__header">
        <h3 className="lidar-visualizer__title">LIDAR Visualizer</h3>
        <div className="lidar-visualizer__controls">
          <button
            className={`btn btn--small ${isConnected ? "btn--success" : "btn--default"}`}
            onClick={handleToggleConnection}
            title={isConnected ? "Disconnect from topic" : "Connect to topic"}
          >
            {isConnected ? "● Connected" : "○ Disconnected"}
          </button>
          <button
            className="btn btn--small"
            onClick={() => {
              scanHistoryRef.current = [];
              setStats(prev => ({ ...prev, totalPoints: 0 }));
            }}
            disabled={!isConnected || scanHistoryRef.current.length === 0}
            title="Clear scan history buffer"
          >
            Clear
          </button>
        </div>
      </div>

      <div className="lidar-visualizer__settings">
        <div className="lidar-visualizer__field">
          <label>Topic:</label>
          <input
            type="text"
            value={topicName}
            onChange={(e) => setTopicName(e.target.value)}
            disabled={isConnected}
            placeholder="/qcar/lidar/scan"
          />
        </div>

        <div className="lidar-visualizer__field lidar-visualizer__field--inline">
          <label>Max Range:</label>
          <input
            type="number"
            value={maxRange}
            onChange={(e) => setMaxRange(parseFloat(e.target.value) || 10.0)}
            min="1"
            max="50"
            step="0.5"
          />
          <span className="lidar-visualizer__unit">m</span>
        </div>

        <div className="lidar-visualizer__field lidar-visualizer__field--inline">
          <label>Scan History:</label>
          <input
            type="number"
            value={scansToKeep}
            onChange={(e) => {
              const newValue = parseInt(e.target.value) || 5;
              setScansToKeep(Math.max(1, Math.min(10, newValue)));
            }}
            min="1"
            max="10"
            step="1"
          />
          <span className="lidar-visualizer__unit">scans</span>
        </div>

        <div className="lidar-visualizer__field lidar-visualizer__field--checkbox">
          <label>
            <input
              type="checkbox"
              checked={showGrid}
              onChange={(e) => setShowGrid(e.target.checked)}
            />
            Show Grid
          </label>
        </div>
      </div>

      {connectionError && (
        <div className="lidar-visualizer__error">
          ⚠️ {connectionError}
          <div className="lidar-visualizer__help">
            Run: <code>ros2 launch rosbridge_server rosbridge_websocket_launch.xml</code>
          </div>
        </div>
      )}

      <div className="lidar-visualizer__canvas-container">
        <canvas
          ref={canvasRef}
          width={400}
          height={400}
          className="lidar-visualizer__canvas"
        />
      </div>

      {scanData && (
        <div className="lidar-visualizer__stats">
          <div className="lidar-visualizer__stat">
            <span className="lidar-visualizer__stat-label">Scans Buffered:</span>
            <span className="lidar-visualizer__stat-value">{scanHistoryRef.current.length}</span>
          </div>
          <div className="lidar-visualizer__stat">
            <span className="lidar-visualizer__stat-label">Total Points:</span>
            <span className="lidar-visualizer__stat-value">{stats.totalPoints}</span>
          </div>
          <div className="lidar-visualizer__stat">
            <span className="lidar-visualizer__stat-label">Range:</span>
            <span className="lidar-visualizer__stat-value">
              {scanData.range_min.toFixed(2)}m - {scanData.range_max.toFixed(2)}m
            </span>
          </div>
          <div className="lidar-visualizer__stat">
            <span className="lidar-visualizer__stat-label">Messages:</span>
            <span className="lidar-visualizer__stat-value">{stats.messagesReceived}</span>
          </div>
          {stats.lastUpdate && (
            <div className="lidar-visualizer__stat">
              <span className="lidar-visualizer__stat-label">Last Update:</span>
              <span className="lidar-visualizer__stat-value">{stats.lastUpdate}</span>
            </div>
          )}
        </div>
      )}

      {!isConnected && !connectionError && (
        <div className="lidar-visualizer__placeholder">
          <p>Click "Connect" to start receiving LIDAR data</p>
          <p className="lidar-visualizer__note">
            Make sure rosbridge_server is running and your LIDAR node is publishing to <code>{topicName}</code>
          </p>
          <p className="lidar-visualizer__note">
            Scan History accumulates multiple scans for a more complete visualization.
            Older scans appear more transparent.
          </p>
        </div>
      )}
    </div>
  );
}

LidarVisualizer.propTypes = {
  canvasId: PropTypes.string,
  isVisible: PropTypes.bool,
};

LidarVisualizer.defaultProps = {
  isVisible: true,
};
