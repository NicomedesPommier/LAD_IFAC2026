// src/components/gazebo/KeyboardControl.jsx
import React, { useState, useEffect, useCallback, useRef } from "react";

const DEFAULT_LINEAR_SPEED = 0.5; // m/s
const DEFAULT_ANGULAR_SPEED = 0.5; // rad/s
const MAX_LINEAR_SPEED = 2.0;
const MAX_ANGULAR_SPEED = 1.5;
const SPEED_INCREMENT = 0.1;

export default function KeyboardControl({ connected, onVelocityChange }) {
  const [linearSpeed, setLinearSpeed] = useState(DEFAULT_LINEAR_SPEED);
  const [angularSpeed, setAngularSpeed] = useState(DEFAULT_ANGULAR_SPEED);
  const [activeKeys, setActiveKeys] = useState(new Set());

  const velocityRef = useRef({ linear: 0, angular: 0 });

  // Update velocity based on active keys
  const updateVelocity = useCallback(() => {
    let linear = 0;
    let angular = 0;

    // Forward/Backward
    if (activeKeys.has("w") || activeKeys.has("ArrowUp")) {
      linear = linearSpeed;
    } else if (activeKeys.has("s") || activeKeys.has("ArrowDown")) {
      linear = -linearSpeed;
    }

    // Left/Right
    if (activeKeys.has("a") || activeKeys.has("ArrowLeft")) {
      angular = angularSpeed;
    } else if (activeKeys.has("d") || activeKeys.has("ArrowRight")) {
      angular = -angularSpeed;
    }

    // Stop on space
    if (activeKeys.has(" ")) {
      linear = 0;
      angular = 0;
    }

    // Only publish if changed
    if (velocityRef.current.linear !== linear || velocityRef.current.angular !== angular) {
      velocityRef.current = { linear, angular };
      onVelocityChange?.(linear, angular);
    }
  }, [activeKeys, linearSpeed, angularSpeed, onVelocityChange]);

  // Handle key down
  useEffect(() => {
    const handleKeyDown = (e) => {
      const key = e.key.toLowerCase();

      // Prevent default for arrow keys and space
      if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", " "].includes(e.key)) {
        e.preventDefault();
      }

      // Speed control
      if (key === "=" || key === "+") {
        setLinearSpeed((s) => Math.min(s + SPEED_INCREMENT, MAX_LINEAR_SPEED));
        setAngularSpeed((s) => Math.min(s + SPEED_INCREMENT, MAX_ANGULAR_SPEED));
        return;
      }
      if (key === "-" || key === "_") {
        setLinearSpeed((s) => Math.max(s - SPEED_INCREMENT, 0.1));
        setAngularSpeed((s) => Math.max(s - SPEED_INCREMENT, 0.1));
        return;
      }

      // Movement keys
      if (["w", "a", "s", "d", "ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", " "].includes(key) ||
          ["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", " "].includes(e.key)) {
        setActiveKeys((keys) => {
          const newKeys = new Set(keys);
          newKeys.add(key === " " ? " " : (e.key.startsWith("Arrow") ? e.key : key));
          return newKeys;
        });
      }
    };

    const handleKeyUp = (e) => {
      const key = e.key.toLowerCase();
      setActiveKeys((keys) => {
        const newKeys = new Set(keys);
        newKeys.delete(key === " " ? " " : (e.key.startsWith("Arrow") ? e.key : key));
        return newKeys;
      });
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, []);

  // Update velocity when active keys or speeds change
  useEffect(() => {
    updateVelocity();
  }, [updateVelocity]);

  // Stop vehicle when component unmounts
  useEffect(() => {
    return () => {
      onVelocityChange?.(0, 0);
    };
  }, [onVelocityChange]);

  const isKeyActive = (key) => {
    if (Array.isArray(key)) {
      return key.some((k) => activeKeys.has(k));
    }
    return activeKeys.has(key);
  };

  return (
    <div className="keyboard-control">
      <h3>⌨️ Keyboard Control</h3>

      <div className="control-status">
        <div className={`status-badge ${connected ? "connected" : "disconnected"}`}>
          {connected ? "🟢 Ready" : "🔴 Disconnected"}
        </div>
      </div>

      {/* Speed Settings */}
      <div className="speed-controls">
        <div className="speed-item">
          <label>Linear Speed:</label>
          <span className="speed-value">{linearSpeed.toFixed(1)} m/s</span>
        </div>
        <div className="speed-item">
          <label>Angular Speed:</label>
          <span className="speed-value">{angularSpeed.toFixed(1)} rad/s</span>
        </div>
        <div className="speed-hint">
          Press <kbd>+</kbd> / <kbd>-</kbd> to adjust
        </div>
      </div>

      {/* Visual Keyboard */}
      <div className="virtual-keyboard">
        <div className="keyboard-row">
          <div className={`key ${isKeyActive(["w", "ArrowUp"]) ? "active" : ""}`}>
            W / ↑
            <span className="key-label">Forward</span>
          </div>
        </div>

        <div className="keyboard-row">
          <div className={`key ${isKeyActive(["a", "ArrowLeft"]) ? "active" : ""}`}>
            A / ←
            <span className="key-label">Left</span>
          </div>
          <div className={`key ${isKeyActive(["s", "ArrowDown"]) ? "active" : ""}`}>
            S / ↓
            <span className="key-label">Back</span>
          </div>
          <div className={`key ${isKeyActive(["d", "ArrowRight"]) ? "active" : ""}`}>
            D / →
            <span className="key-label">Right</span>
          </div>
        </div>

        <div className="keyboard-row">
          <div className={`key key-space ${isKeyActive([" "]) ? "active" : ""}`}>
            Space
            <span className="key-label">Stop</span>
          </div>
        </div>
      </div>

      {/* Current Velocity Display */}
      <div className="velocity-display">
        <div className="velocity-item">
          <span className="velocity-label">Linear:</span>
          <div className="velocity-bar">
            <div
              className="velocity-fill velocity-fill--linear"
              style={{
                width: `${Math.abs(velocityRef.current.linear / MAX_LINEAR_SPEED) * 100}%`,
              }}
            />
          </div>
          <span className="velocity-value">
            {velocityRef.current.linear.toFixed(2)} m/s
          </span>
        </div>

        <div className="velocity-item">
          <span className="velocity-label">Angular:</span>
          <div className="velocity-bar">
            <div
              className="velocity-fill velocity-fill--angular"
              style={{
                width: `${Math.abs(velocityRef.current.angular / MAX_ANGULAR_SPEED) * 100}%`,
              }}
            />
          </div>
          <span className="velocity-value">
            {velocityRef.current.angular.toFixed(2)} rad/s
          </span>
        </div>
      </div>

      {/* Emergency Stop Button */}
      <button
        className="emergency-stop"
        onClick={() => {
          setActiveKeys(new Set());
          onVelocityChange?.(0, 0);
        }}
        disabled={!connected}
      >
        🛑 Emergency Stop
      </button>
    </div>
  );
}
