// src/components/gazebo/CameraFeedUniversal.jsx
// Supports both sensor_msgs/Image and sensor_msgs/CompressedImage
import React, { useEffect, useRef, useState } from "react";

export default function CameraFeedUniversal({
  connected,
  subscribeTopic,
  topicName = "/qcar/camera/image_raw",
  title = "Front Camera",
  compressed = false // Auto-detect or use this hint
}) {
  const canvasRef = useRef(null);
  const [fps, setFps] = useState(0);
  const [lastFrameTime, setLastFrameTime] = useState(Date.now());
  const [messageCount, setMessageCount] = useState(0);
  const [lastMessage, setLastMessage] = useState(null);
  const [error, setError] = useState(null);
  const [detectedFormat, setDetectedFormat] = useState(null);
  const fpsCounterRef = useRef(0);

  useEffect(() => {
    if (!connected || !subscribeTopic) {
      setError("Not connected to ROS");
      return;
    }

    setError(null);
    setDetectedFormat(null);
    console.log(`[CameraFeed] Subscribing to ${topicName}`);

    // Try raw image first, then compressed
    const messageType = compressed || topicName.includes("/compressed")
      ? "sensor_msgs/CompressedImage"
      : "sensor_msgs/Image";

    console.log(`[CameraFeed] Using message type: ${messageType}`);

    const unsub = subscribeTopic(
      topicName,
      messageType,
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

          // Handle compressed image
          if (messageType === "sensor_msgs/CompressedImage") {
            setDetectedFormat("compressed");
            handleCompressedImage(msg, canvas, ctx);
          } else {
            setDetectedFormat("raw");
            handleRawImage(msg, canvas, ctx);
          }

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
  }, [connected, subscribeTopic, lastFrameTime, topicName, compressed]);

  function handleCompressedImage(msg, canvas, ctx) {
    console.log(`[CameraFeed] Compressed image: ${msg.format}, data length: ${msg.data?.length || 0}`);

    // Convert data to blob
    let imageData;
    if (typeof msg.data === "string") {
      // Base64 encoded
      const binaryString = atob(msg.data);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      imageData = bytes;
    } else if (Array.isArray(msg.data)) {
      imageData = new Uint8Array(msg.data);
    } else if (msg.data instanceof Uint8Array) {
      imageData = msg.data;
    } else {
      throw new Error(`Unknown compressed data format: ${typeof msg.data}`);
    }

    // Create blob and load as image
    const blob = new Blob([imageData], { type: `image/${msg.format || "jpeg"}` });
    const url = URL.createObjectURL(blob);

    const img = new Image();
    img.onload = () => {
      // Resize canvas if needed
      if (canvas.width !== img.width || canvas.height !== img.height) {
        canvas.width = img.width;
        canvas.height = img.height;
        console.log(`[CameraFeed] Canvas resized to ${img.width}x${img.height}`);
      }

      ctx.drawImage(img, 0, 0);
      URL.revokeObjectURL(url);
    };

    img.onerror = (err) => {
      console.error("[CameraFeed] Failed to load compressed image:", err);
      setError("Failed to decode compressed image");
      URL.revokeObjectURL(url);
    };

    img.src = url;
  }

  function handleRawImage(msg, canvas, ctx) {
    const width = msg.width;
    const height = msg.height;
    const encoding = msg.encoding.toLowerCase();

    console.log(`[CameraFeed] Raw image: ${width}x${height}, encoding: ${encoding}, data length: ${msg.data?.length || 0}`);

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
      const binaryString = atob(msg.data);
      pixelData = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        pixelData[i] = binaryString.charCodeAt(i);
      }
      console.log(`[CameraFeed] Decoded base64 data: ${pixelData.length} bytes`);
    } else if (Array.isArray(msg.data)) {
      pixelData = new Uint8Array(msg.data);
      console.log(`[CameraFeed] Using array data: ${pixelData.length} bytes`);
    } else if (msg.data instanceof Uint8Array) {
      pixelData = msg.data;
      console.log(`[CameraFeed] Using Uint8Array data: ${pixelData.length} bytes`);
    } else {
      throw new Error(`Unknown image data format: ${typeof msg.data}`);
    }

    // Determine bytes per pixel
    let bytesPerPixel = 3;
    if (encoding === "rgba8" || encoding === "bgra8") {
      bytesPerPixel = 4;
    } else if (encoding === "mono8" || encoding === "8uc1") {
      bytesPerPixel = 1;
    } else if (encoding === "mono16" || encoding === "16uc1") {
      bytesPerPixel = 2;
    }

    const expectedSize = width * height * bytesPerPixel;
    if (pixelData.length < expectedSize) {
      console.error(`[CameraFeed] Data size mismatch. Expected ${expectedSize}, got ${pixelData.length}`);
      throw new Error(`Image data size mismatch: expected ${expectedSize}, got ${pixelData.length}`);
    }

    // Copy pixel data based on encoding
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
      } else if (encoding === "mono16" || encoding === "16uc1") {
        // 16-bit grayscale, take high byte
        const gray = pixelData[i * 2 + 1] || 0;
        data[dstIdx] = gray;
        data[dstIdx + 1] = gray;
        data[dstIdx + 2] = gray;
        data[dstIdx + 3] = 255;
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
  }

  return (
    <div className="camera-feed">
      <div className="camera-feed__header">
        <h3>📹 {title}</h3>
        <div className="camera-feed__fps">
          {fps > 0 ? `${fps} FPS` : "Waiting..."}
          {detectedFormat && (
            <span style={{ marginLeft: "0.5rem", fontSize: "0.8em", opacity: 0.7 }}>
              ({detectedFormat})
            </span>
          )}
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
              <div style={{ marginTop: "1rem", fontSize: "0.85em", textAlign: "left", maxWidth: "400px" }}>
                <strong>Try these:</strong>
                <ul style={{ marginTop: "0.5rem", paddingLeft: "1.5rem" }}>
                  <li>Check Debug Panel for message count</li>
                  <li>Try a different camera in tabs above</li>
                  <li>Verify topic with: <code>ros2 topic hz {topicName}</code></li>
                </ul>
              </div>
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
                <div style={{ marginTop: "1rem", fontSize: "0.85em" }}>
                  <strong>Troubleshooting:</strong>
                  <ul style={{ marginTop: "0.5rem", paddingLeft: "1.5rem", textAlign: "left" }}>
                    <li>Open Debug Panel (top-left) to check message count</li>
                    <li>If count is 0: Camera not publishing in Gazebo</li>
                    <li>If count &gt; 0: Check browser console (F12) for errors</li>
                  </ul>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      <div className="camera-feed__info">
        <span>Topic: {topicName}</span>
        {lastMessage && (
          <>
            {lastMessage.width && <span>Resolution: {lastMessage.width}x{lastMessage.height}</span>}
            {lastMessage.encoding && <span>Encoding: {lastMessage.encoding}</span>}
            {lastMessage.format && <span>Format: {lastMessage.format}</span>}
          </>
        )}
        <span className={`status ${connected ? "connected" : "disconnected"}`}>
          {connected ? `● Live (${messageCount})` : "○ Offline"}
        </span>
      </div>
    </div>
  );
}
