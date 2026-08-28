// src/levels/slidesPerception/03a-LaneDetectionInteractive.jsx
import React, { useCallback, useEffect, useRef, useState } from "react";
import { useRoslib } from "../../hooks/useRoslib";
import { SlideCard, SlideVisualization } from "../../components/slides/SlideLayout";

export const meta = {
  id: "lane-detection-interactive",
  title: "Lane Detection (Interactive)",
  order: 2,
  objectiveCode: "PERC_LANE_DETECT",
};

export default function LaneDetectionInteractive({ onObjectiveHit }) {
  const { connected, subscribeTopic } = useRoslib();
  const [imageData, setImageData] = useState(null);
  const [cannyLow, setCannyLow] = useState(50);
  const [cannyHigh, setCannyHigh] = useState(150);
  const [showEdges, setShowEdges] = useState(false);
  const canvasRef = useRef(null);

  // Subscribe to camera topic using the hook's subscribeTopic method
  useEffect(() => {
    if (!connected) return;

    const unsubscribe = subscribeTopic(
      "/camera/image_raw/compressed",
      "sensor_msgs/msg/CompressedImage",
      (msg) => {
        setImageData(`data:image/jpeg;base64,${msg.data}`);
      },
      { throttle_rate: 100 }
    );

    return unsubscribe;
  }, [connected, subscribeTopic]);

  // Simple edge detection visualization on canvas
  useEffect(() => {
    if (!imageData || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    const img = new Image();

    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      ctx.drawImage(img, 0, 0);

      if (showEdges) {
        // Get image data
        const imageDataObj = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageDataObj.data;

        // Simple grayscale conversion and edge visualization
        const gray = new Uint8ClampedArray(canvas.width * canvas.height);
        for (let i = 0; i < data.length; i += 4) {
          gray[i / 4] = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
        }

        // Simple edge detection (Sobel-like)
        const edges = new Uint8ClampedArray(canvas.width * canvas.height);
        for (let y = 1; y < canvas.height - 1; y++) {
          for (let x = 1; x < canvas.width - 1; x++) {
            const idx = y * canvas.width + x;
            const gx = -gray[idx - canvas.width - 1] + gray[idx - canvas.width + 1]
              - 2 * gray[idx - 1] + 2 * gray[idx + 1]
              - gray[idx + canvas.width - 1] + gray[idx + canvas.width + 1];
            const gy = -gray[idx - canvas.width - 1] - 2 * gray[idx - canvas.width] - gray[idx - canvas.width + 1]
              + gray[idx + canvas.width - 1] + 2 * gray[idx + canvas.width] + gray[idx + canvas.width + 1];
            const magnitude = Math.sqrt(gx * gx + gy * gy);
            edges[idx] = magnitude > cannyLow && magnitude < cannyHigh * 2 ? 255 : 0;
          }
        }

        // Draw edges overlay
        for (let i = 0; i < edges.length; i++) {
          if (edges[i] > 0) {
            const py = Math.floor(i / canvas.width);
            // Only show in ROI (lower half, trapezoidal)
            const roiTop = canvas.height * 0.5;
            if (py > roiTop) {
              const x = i * 4;
              data[x] = 0;       // R
              data[x + 1] = 255; // G
              data[x + 2] = 0;   // B
            }
          }
        }

        ctx.putImageData(imageDataObj, 0, 0);

        // Draw ROI overlay
        ctx.strokeStyle = "rgba(125, 249, 255, 0.5)";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(canvas.width * 0.1, canvas.height);
        ctx.lineTo(canvas.width * 0.4, canvas.height * 0.5);
        ctx.lineTo(canvas.width * 0.6, canvas.height * 0.5);
        ctx.lineTo(canvas.width * 0.9, canvas.height);
        ctx.closePath();
        ctx.stroke();
      }
    };

    img.src = imageData;
  }, [imageData, showEdges, cannyLow, cannyHigh]);

  const handleCompleteObjective = useCallback(() => {
    onObjectiveHit?.("PERC_LANE_DETECT");
  }, [onObjectiveHit]);

  return (
    <div className="slide">
      <h2>Lane Detection (Interactive)</h2>

      <div className="slide-card">
        <div className="slide-card__title">Connection Status</div>
        <div className={`slide-flex slide-items-center slide-gap-sm slide-p-sm slide-rounded ${connected ? "slide-bg-success-subtle slide-border-success" : "slide-bg-error-subtle slide-border-error"}`}>
          <div className={`slide-dot ${connected ? "slide-bg-success" : "slide-bg-error"}`} />
          <span>{connected ? "Connected to ROS" : "Disconnected from ROS"}</span>
        </div>
      </div>

      <div className="slide-card">
        <div className="slide-card__title">Edge Detection Parameters</div>
        <div className="slide-grid slide-grid--2 slide-gap-md">
          <div className="slide-form-group">
            <label className="slide-label">Canny Low Threshold: {cannyLow}</label>
            <input
              type="range"
              min="10"
              max="100"
              value={cannyLow}
              onChange={(e) => setCannyLow(parseInt(e.target.value))}
              className="slide-input-range"
            />
          </div>
          <div className="slide-form-group">
            <label className="slide-label">Canny High Threshold: {cannyHigh}</label>
            <input
              type="range"
              min="100"
              max="300"
              value={cannyHigh}
              onChange={(e) => setCannyHigh(parseInt(e.target.value))}
              className="slide-input-range"
            />
          </div>
        </div>
        <div className="slide-mt-md">
          <label className="slide-checkbox-label">
            <input
              type="checkbox"
              checked={showEdges}
              onChange={(e) => setShowEdges(e.target.checked)}
              className="slide-checkbox"
            />
            Show Edge Detection Overlay
          </label>
        </div>
      </div>

      <div className="slide-card">
        <div className="slide-card__title">Camera Feed with Lane Detection</div>
        <SlideVisualization className="slide-min-h-300 slide-flex slide-items-center slide-justify-center">
          {!connected ? (
            <p className="slide-text-error">Connect to ROS to see camera feed.</p>
          ) : !imageData ? (
            <p className="slide-text-muted">Waiting for camera data...</p>
          ) : (
            <canvas
              ref={canvasRef}
              className="slide-w-full slide-max-h-400"
            />
          )}

          {/* Legend */}
          {showEdges && (
            <div className="slide-legend">
              <span><span className="slide-text-success">■</span> Detected Edges</span>
              <span><span className="slide-text-neon">—</span> Region of Interest</span>
            </div>
          )}
        </SlideVisualization>
      </div>

      <div className="slide-card slide-card--aside">
        <div>
          <div className="slide-card__title">Lane Detection Tips</div>
          <ul>
            <li>Adjust Canny thresholds to filter noise vs detect faint lines</li>
            <li>Lower thresholds detect more edges (may include noise)</li>
            <li>Higher thresholds detect only strong edges</li>
            <li>The ROI focuses on the road area in front of the vehicle</li>
          </ul>
        </div>
        <div className="slide-callout slide-callout--info">
          <b>Note:</b> This is a simplified edge detection demo. Real lane detection
          would use Hough Transform or deep learning to fit actual lane lines.
        </div>
      </div>

      <div className="slide-card">
        <div className="slide-card__title">Complete This Level</div>
        <p>
          Experiment with the edge detection parameters and observe how they affect
          lane line detection. When you're ready, mark this objective as complete.
        </p>
        <button
          className="btn btn--primary slide-w-full slide-mt-md"
          onClick={handleCompleteObjective}
        >
          Complete Lane Detection Objective
        </button>
      </div>
    </div>
  );
}

