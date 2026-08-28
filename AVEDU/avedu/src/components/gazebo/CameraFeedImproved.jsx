// src/components/gazebo/CameraFeedImproved.jsx
import React, { useEffect, useRef, useState } from "react";

export default function CameraFeedImproved({ connected, subscribeTopic, topicName = "/qcar/camera/image_raw", title = "Front Camera" }) {
  const canvasRef = useRef(null);
  const [fps, setFps] = useState(0);
  const [lastFrameTime, setLastFrameTime] = useState(Date.now());
  const [messageCount, setMessageCount] = useState(0);
  const [lastMessage, setLastMessage] = useState(null);
  const [error, setError] = useState(null);
  const fpsCounterRef = useRef(0);

  useEffect(() => {
    if (!connected || !subscribeTopic) {
      setError("Not connected to ROS");
      return;
    }

    setError(null);
    console.log(`[CameraFeed] Subscribing to ${topicName}`);

    const unsub = subscribeTopic(
      topicName,
      "sensor_msgs/Image",
      (msg) => {
        setMessageCount(c => c + 1);
        setLastMessage(msg);

        try {
          const canvas = canvasRef.current;
          if (!canvas) {
            console.warn("[CameraFeed] Canvas ref not available");
            return;
          }

          const ctx = canvas.getContext("2d");
          const width = msg.width;
          const height = msg.height;

          console.log(`[CameraFeed] Received image: ${width}x${height}, encoding: ${msg.encoding}, data length: ${msg.data?.length || 0}`);

          // Set canvas size if needed
          if (canvas.width !== width || canvas.height !== height) {
            canvas.width = width;
            canvas.height = height;
            console.log(`[CameraFeed] Canvas resized to ${width}x${height}`);
          }

          // Create ImageData
          const imageData = ctx.createImageData(width, height);
          const data = imageData.data;

          // Parse pixel data
          let pixelData;
          if (typeof msg.data === "string") {
            // Base64 encoded
            try {
              const binaryString = atob(msg.data);
              pixelData = new Uint8Array(binaryString.length);
              for (let i = 0; i < binaryString.length; i++) {
                pixelData[i] = binaryString.charCodeAt(i);
              }
              console.log(`[CameraFeed] Decoded base64 data: ${pixelData.length} bytes`);
            } catch (e) {
              console.error("[CameraFeed] Failed to decode base64:", e);
              setError("Failed to decode base64 image data");
              return;
            }
          } else if (Array.isArray(msg.data)) {
            pixelData = new Uint8Array(msg.data);
            console.log(`[CameraFeed] Using array data: ${pixelData.length} bytes`);
          } else if (msg.data instanceof Uint8Array) {
            pixelData = msg.data;
            console.log(`[CameraFeed] Using Uint8Array data: ${pixelData.length} bytes`);
          } else {
            console.error("[CameraFeed] Unknown data format:", typeof msg.data);
            setError(`Unknown image data format: ${typeof msg.data}`);
            return;
          }

          // Copy pixel data based on encoding
          const encoding = msg.encoding.toLowerCase();
          let bytesPerPixel = 3;

          if (encoding === "rgba8" || encoding === "bgra8") {
            bytesPerPixel = 4;
          } else if (encoding === "mono8" || encoding === "8uc1") {
            bytesPerPixel = 1;
          }

          const expectedSize = width * height * bytesPerPixel;
          if (pixelData.length < expectedSize) {
            console.error(`[CameraFeed] Data size mismatch. Expected ${expectedSize}, got ${pixelData.length}`);
            setError(`Image data size mismatch: expected ${expectedSize}, got ${pixelData.length}`);
            return;
          }

          for (let i = 0; i < width * height; i++) {
            const dstIdx = i * 4;

            if (encoding === "rgb8") {
              const srcIdx = i * 3;
              data[dstIdx] = pixelData[srcIdx];       // R
              data[dstIdx + 1] = pixelData[srcIdx + 1]; // G
              data[dstIdx + 2] = pixelData[srcIdx + 2]; // B
              data[dstIdx + 3] = 255; // A
            } else if (encoding === "bgr8") {
              const srcIdx = i * 3;
              data[dstIdx] = pixelData[srcIdx + 2];   // R (from B)
              data[dstIdx + 1] = pixelData[srcIdx + 1]; // G
              data[dstIdx + 2] = pixelData[srcIdx];   // B (from R)
              data[dstIdx + 3] = 255; // A
            } else if (encoding === "rgba8") {
              const srcIdx = i * 4;
              data[dstIdx] = pixelData[srcIdx];
              data[dstIdx + 1] = pixelData[srcIdx + 1];
              data[dstIdx + 2] = pixelData[srcIdx + 2];
              data[dstIdx + 3] = pixelData[srcIdx + 3];
            } else if (encoding === "bgra8") {
              const srcIdx = i * 4;
              data[dstIdx] = pixelData[srcIdx + 2];   // R (from B)
              data[dstIdx + 1] = pixelData[srcIdx + 1]; // G
              data[dstIdx + 2] = pixelData[srcIdx];   // B (from R)
              data[dstIdx + 3] = pixelData[srcIdx + 3]; // A
            } else if (encoding === "mono8" || encoding === "8uc1") {
              const gray = pixelData[i] || 0;
              data[dstIdx] = gray;
              data[dstIdx + 1] = gray;
              data[dstIdx + 2] = gray;
              data[dstIdx + 3] = 255; // A
            } else {
              // Fallback: try as RGB
              console.warn(`[CameraFeed] Unknown encoding '${encoding}', treating as RGB`);
              const srcIdx = i * 3;
              data[dstIdx] = pixelData[srcIdx] || 0;
              data[dstIdx + 1] = pixelData[srcIdx + 1] || 0;
              data[dstIdx + 2] = pixelData[srcIdx + 2] || 0;
              data[dstIdx + 3] = 255;
            }
          }

          ctx.putImageData(imageData, 0, 0);
          setError(null);

          // Update FPS
          fpsCounterRef.current++;
          const now = Date.now();
          if (now - lastFrameTime >= 1000) {
            setFps(fpsCounterRef.current);
            fpsCounterRef.current = 0;
            setLastFrameTime(now);
          }
        } catch (err) {
          console.error("[CameraFeed] Error rendering frame:", err);
          setError(`Rendering error: ${err.message}`);
        }
      },
      { throttle_rate: 33 } // ~30 FPS max
    );

    return () => {
      console.log(`[CameraFeed] Unsubscribing from ${topicName}`);
      unsub();
    };
  }, [connected, subscribeTopic, lastFrameTime, topicName]);

  return (
    <div className="camera-feed">
      <div className="camera-feed__header">
        <h3>📹 {title}</h3>
        <div className="camera-feed__fps">
          {fps > 0 ? `${fps} FPS` : "Waiting..."}
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
        ) : error ? (
          <div className="camera-feed__placeholder">
            <div className="camera-feed__message camera-feed__message--error">
              <span className="camera-feed__icon">⚠️</span>
              <p>Camera Error</p>
              <small>{error}</small>
            </div>
          </div>
        ) : (
          <>
            <canvas
              ref={canvasRef}
              className="camera-feed__canvas"
              width={640}
              height={480}
            />
            {messageCount === 0 && (
              <div className="camera-feed__overlay">
                <p>Waiting for camera data...</p>
                <small>Subscribed to {topicName}</small>
              </div>
            )}
          </>
        )}
      </div>

      <div className="camera-feed__info">
        <span>Topic: {topicName}</span>
        {lastMessage && (
          <>
            <span>Resolution: {lastMessage.width}x{lastMessage.height}</span>
            <span>Encoding: {lastMessage.encoding}</span>
          </>
        )}
        <span className={`status ${connected ? "connected" : "disconnected"}`}>
          {connected ? `● Live (${messageCount})` : "○ Offline"}
        </span>
      </div>
    </div>
  );
}
