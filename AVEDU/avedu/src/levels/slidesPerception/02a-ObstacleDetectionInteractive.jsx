// src/levels/slidesPerception/02a-ObstacleDetectionInteractive.jsx
import React, { useCallback, useEffect, useState } from "react";
import { useRoslib } from "../../hooks/useRoslib";
import { SlideCard, SlideGrid, SlideVisualization, SlideCallout } from "../../components/slides/SlideLayout";

export const meta = {
  id: "obstacle-detection-interactive",
  title: "Obstacle Detection (Interactive)",
  order: 2,
  objectiveCode: "PERC_OBSTACLE_DETECT",
};

export default function ObstacleDetectionInteractive({ onObjectiveHit }) {
  const { connected, subscribeTopic } = useRoslib();
  const [scanData, setScanData] = useState(null);
  const [obstacles, setObstacles] = useState([]);
  const [threshold, setThreshold] = useState(1.0);
  const [detectedCount, setDetectedCount] = useState(0);

  // Subscribe to LiDAR scan using the hook's subscribeTopic method
  useEffect(() => {
    if (!connected) return;

    const unsubscribe = subscribeTopic(
      "/scan",
      "sensor_msgs/msg/LaserScan",
      (msg) => {
        setScanData(msg);

        // Simple obstacle detection
        const detected = [];
        const angleMin = msg.angle_min;
        const angleInc = msg.angle_increment;

        for (let i = 0; i < msg.ranges.length; i++) {
          const range = msg.ranges[i];
          if (range > 0.1 && range < threshold) {
            const angle = angleMin + i * angleInc;
            detected.push({
              distance: range.toFixed(2),
              angle: (angle * 180 / Math.PI).toFixed(1),
              index: i,
            });
          }
        }
        setObstacles(detected);
        setDetectedCount(detected.length);
      },
      { throttle_rate: 100 }
    );

    return unsubscribe;
  }, [connected, subscribeTopic, threshold]);

  const handleCompleteObjective = useCallback(() => {
    if (detectedCount > 0) {
      onObjectiveHit?.("PERC_OBSTACLE_DETECT");
    }
  }, [detectedCount, onObjectiveHit]);

  return (
    <div className="slide">
      <h2>Obstacle Detection (Interactive)</h2>

      <div className="slide-card">
        <div className="slide-card__title">Connection Status</div>
        <div className={`slide-flex slide-items-center slide-gap-sm slide-p-sm slide-rounded ${connected ? "slide-bg-success-subtle slide-border-success" : "slide-bg-error-subtle slide-border-error"}`}>
          <div className={`slide-dot ${connected ? "slide-bg-success" : "slide-bg-error"}`} />
          <span>{connected ? "Connected to ROS" : "Disconnected from ROS"}</span>
        </div>
      </div>

      <div className="slide-card">
        <div className="slide-card__title">Detection Threshold</div>
        <p>Adjust the distance threshold to detect obstacles closer than this value (in meters):</p>
        <div className="slide-flex slide-items-center slide-gap-md slide-mt-sm">
          <input
            type="range"
            min="0.3"
            max="5"
            step="0.1"
            value={threshold}
            onChange={(e) => setThreshold(parseFloat(e.target.value))}
            className="slide-input-range slide-flex-1"
          />
          <span className="slide-badge slide-badge--info slide-font-mono slide-text-center slide-min-w-80">
            {threshold.toFixed(1)} m
          </span>
        </div>
      </div>

      <div className="slide-card">
        <div className="slide-card__title">
          Detected Obstacles: {detectedCount}
        </div>
        {!connected ? (
          <p className="slide-text-error">Connect to ROS to see obstacle detections.</p>
        ) : obstacles.length === 0 ? (
          <p className="slide-text-success">No obstacles detected within threshold distance.</p>
        ) : (
          <div className="slide-grid slide-grid--auto-fit slide-gap-sm slide-overflow-y-auto slide-max-h-200">
            {obstacles.slice(0, 20).map((obs, i) => (
              <div key={i} className="slide-item slide-item--error slide-text-sm">
                <div><b>Distance:</b> {obs.distance}m</div>
                <div><b>Angle:</b> {obs.angle}°</div>
              </div>
            ))}
            {obstacles.length > 20 && (
              <div className="slide-p-sm slide-opacity-70">
                ...and {obstacles.length - 20} more
              </div>
            )}
          </div>
        )}
      </div>

      <div className="slide-card">
        <div className="slide-card__title">LiDAR Visualization (Top-Down)</div>
        <SlideVisualization className="slide-h-300">
          {/* Simple top-down LiDAR visualization */}
          <svg viewBox="-5 -5 10 10" width="100%" height="100%">
            {/* Grid lines */}
            {[-4, -2, 0, 2, 4].map(x => (
              <line key={`vx${x}`} x1={x} y1={-5} x2={x} y2={5} stroke="rgba(255,255,255,0.1)" strokeWidth="0.05" />
            ))}
            {[-4, -2, 0, 2, 4].map(y => (
              <line key={`hy${y}`} x1={-5} y1={y} x2={5} y2={y} stroke="rgba(255,255,255,0.1)" strokeWidth="0.05" />
            ))}

            {/* Distance circles */}
            {[1, 2, 3, 4].map(r => (
              <circle key={r} cx={0} cy={0} r={r} fill="none" stroke="rgba(125, 249, 255, 0.2)" strokeWidth="0.03" />
            ))}

            {/* Robot position */}
            <circle cx={0} cy={0} r={0.15} fill="#7df9ff" />
            <polygon points="0,-0.3 0.1,0.1 -0.1,0.1" fill="#7df9ff" />

            {/* LiDAR points */}
            {scanData && scanData.ranges.map((range, i) => {
              if (range <= 0.1 || range > 5) return null;
              const angle = scanData.angle_min + i * scanData.angle_increment;
              const x = range * Math.cos(angle);
              const y = range * Math.sin(angle);
              const isObstacle = range < threshold;
              return (
                <circle
                  key={i}
                  cx={-y}
                  cy={-x}
                  r={0.05}
                  fill={isObstacle ? "#ff4444" : "#44ff44"}
                  opacity={isObstacle ? 1 : 0.4}
                />
              );
            })}
          </svg>

          {/* Legend */}
          <div className="slide-legend">
            <span><span className="slide-text-error">●</span> Obstacle</span>
            <span><span className="slide-text-success">●</span> Clear</span>
            <span><span className="slide-text-neon">▲</span> Robot</span>
          </div>
        </SlideVisualization>
      </div>

      <div className="slide-card slide-card--aside">
        <div>
          <div className="slide-card__title">Try It Out!</div>
          <ol>
            <li>Make sure the Gazebo simulation is running</li>
            <li>Adjust the detection threshold slider</li>
            <li>Observe obstacles appearing in red</li>
            <li>Move the robot to see dynamic obstacle detection</li>
          </ol>
        </div>
        <button
          className={`btn ${detectedCount > 0 ? "btn--success" : "btn--disabled"}`}
          onClick={handleCompleteObjective}
          disabled={detectedCount === 0}
          style={{ width: "100%", marginTop: "1rem" }}
        >
          {detectedCount > 0 ? "Complete Objective" : "Detect obstacles to complete"}
        </button>
      </div>
    </div>
  );
}

