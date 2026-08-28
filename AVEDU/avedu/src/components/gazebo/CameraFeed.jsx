// src/components/gazebo/CameraFeed.jsx
import React, { useEffect, useRef, useState } from "react";

export default function CameraFeed({ connected, subscribeTopic }) {
  const canvasRef = useRef(null);
  const [fps, setFps] = useState(0);
  const [lastFrameTime, setLastFrameTime] = useState(Date.now());
  const fpsCounterRef = useRef(0);

  useEffect(() => {
    if (!connected || !subscribeTopic) return;

    const unsub = subscribeTopic(
      "/qcar/camera/image_raw",
      "sensor_msgs/Image",
      (msg) => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext("2d");
        const width = msg.width;
        const height = msg.height;

        // Set canvas size if needed
        if (canvas.width !== width || canvas.height !== height) {
          canvas.width = width;
          canvas.height = height;
        }

        // Create ImageData from ROS message
        // Assuming RGB8 encoding
        const imageData = ctx.createImageData(width, height);
        const data = imageData.data;

        // Convert from ROS Image message data (base64 or array)
        let pixelData;
        if (typeof msg.data === "string") {
          // Base64 encoded
          const binaryString = atob(msg.data);
          pixelData = new Uint8Array(binaryString.length);
          for (let i = 0; i < binaryString.length; i++) {
            pixelData[i] = binaryString.charCodeAt(i);
          }
        } else {
          pixelData = new Uint8Array(msg.data);
        }

        // Copy pixel data to ImageData (RGB to RGBA)
        for (let i = 0; i < width * height; i++) {
          const srcIdx = i * 3;
          const dstIdx = i * 4;

          if (msg.encoding === "rgb8") {
            data[dstIdx] = pixelData[srcIdx];       // R
            data[dstIdx + 1] = pixelData[srcIdx + 1]; // G
            data[dstIdx + 2] = pixelData[srcIdx + 2]; // B
          } else if (msg.encoding === "bgr8") {
            data[dstIdx] = pixelData[srcIdx + 2];   // R (from B)
            data[dstIdx + 1] = pixelData[srcIdx + 1]; // G
            data[dstIdx + 2] = pixelData[srcIdx];   // B (from R)
          } else {
            // Fallback: grayscale or unknown
            const gray = pixelData[srcIdx] || 0;
            data[dstIdx] = gray;
            data[dstIdx + 1] = gray;
            data[dstIdx + 2] = gray;
          }

          data[dstIdx + 3] = 255; // Alpha
        }

        ctx.putImageData(imageData, 0, 0);

        // Update FPS
        fpsCounterRef.current++;
        const now = Date.now();
        if (now - lastFrameTime >= 1000) {
          setFps(fpsCounterRef.current);
          fpsCounterRef.current = 0;
          setLastFrameTime(now);
        }
      },
      { throttle_rate: 33 } // ~30 FPS max
    );

    return unsub;
  }, [connected, subscribeTopic, lastFrameTime]);

  return (
    <div className="camera-feed">
      <div className="camera-feed__header">
        <h3>📹 Front Camera</h3>
        <div className="camera-feed__fps">
          {fps} FPS
        </div>
      </div>

      <div className="camera-feed__container">
        {!connected ? (
          <div className="camera-feed__placeholder">
            <div className="camera-feed__message">
              <span className="camera-feed__icon">📡</span>
              <p>Waiting for ROS connection...</p>
              <small>Make sure Gazebo is running in Docker</small>
            </div>
          </div>
        ) : (
          <canvas
            ref={canvasRef}
            className="camera-feed__canvas"
            width={640}
            height={480}
          />
        )}
      </div>

      <div className="camera-feed__info">
        <span>Resolution: 640x480</span>
        <span>Topic: /camera/image_raw</span>
        <span className={`status ${connected ? "connected" : "disconnected"}`}>
          {connected ? "● Live" : "○ Offline"}
        </span>
      </div>
    </div>
  );
}
