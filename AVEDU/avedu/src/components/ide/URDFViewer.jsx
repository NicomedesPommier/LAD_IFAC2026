// =============================================================
// FILE: src/components/ide/URDFViewer.jsx
// URDF 3D Viewer component for IDE sidebar
// =============================================================
import React, { useEffect, useRef, useState, useCallback } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, Grid } from "@react-three/drei";
import * as THREE from "three";
import URDFLoader from "urdf-loader";
import ROSLIB from "roslib";
import { API_BASE } from "../../config";
import "../../styles/components/_urdf-viewer.scss";

/**
 * URDF Viewer - 3D visualization of URDF robot description for IDE sidebar
 * Displays the generated URDF XML code as a 3D model
 *
 * @param {string} xmlCode - URDF XML code to visualize
 * @param {object} ros - ROSLIB.Ros connection object for TF visualization
 */
export function URDFViewer({ xmlCode, ros }) {
  const [error, setError] = useState(null);
  const [showTF, setShowTF] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [tfAxisLength, setTfAxisLength] = useState(0.15);
  const [showTFLabels, setShowTFLabels] = useState(true);
  const [tfFrames, setTfFrames] = useState({});
  const [visibleFrames, setVisibleFrames] = useState({});
  const [isConnected, setIsConnected] = useState(false);

  // Monitor ROS connection status
  useEffect(() => {
    if (!ros) return;

    const handleConnection = () => setIsConnected(true);
    const handleClose = () => setIsConnected(false);

    ros.on('connection', handleConnection);
    ros.on('close', handleClose);

    if (ros.isConnected) {
      setIsConnected(true);
    }

    return () => {
      ros.off('connection', handleConnection);
      ros.off('close', handleClose);
    };
  }, [ros]);

  // Subscribe to TF topics
  useEffect(() => {
    if (!ros || !isConnected || !showTF) return;

    const tfSubscription = new ROSLIB.Topic({
      ros: ros,
      name: '/tf',
      messageType: 'tf2_msgs/TFMessage',
      throttle_rate: 100
    });

    const tfStaticSubscription = new ROSLIB.Topic({
      ros: ros,
      name: '/tf_static',
      messageType: 'tf2_msgs/TFMessage'
    });

    const handleTFMessage = (message) => {
      if (message.transforms) {
        setTfFrames(prev => {
          const updated = { ...prev };
          message.transforms.forEach(transform => {
            const frameName = transform.child_frame_id;
            updated[frameName] = {
              name: frameName,
              parent: transform.header.frame_id,
              translation: transform.transform.translation,
              rotation: transform.transform.rotation,
              lastUpdate: Date.now()
            };
          });
          return updated;
        });
      }
    };

    tfSubscription.subscribe(handleTFMessage);
    tfStaticSubscription.subscribe(handleTFMessage);

    return () => {
      tfSubscription.unsubscribe();
      tfStaticSubscription.unsubscribe();
    };
  }, [ros, isConnected, showTF]);

  // Auto-enable newly discovered frames
  useEffect(() => {
    const frameNames = Object.keys(tfFrames);
    if (frameNames.length === 0) return;

    setVisibleFrames(prev => {
      const updated = { ...prev };
      frameNames.forEach(name => {
        if (!(name in updated)) {
          updated[name] = true; // Enable new frames by default
        }
      });
      return updated;
    });
  }, [tfFrames]);

  const toggleFrame = useCallback((frameName) => {
    setVisibleFrames(prev => ({
      ...prev,
      [frameName]: !prev[frameName]
    }));
  }, []);

  const toggleAllFrames = useCallback((visible) => {
    const frameNames = Object.keys(tfFrames);
    const updated = {};
    frameNames.forEach(name => {
      updated[name] = visible;
    });
    setVisibleFrames(updated);
  }, [tfFrames]);

  return (
    <div className="urdf-viewer">
      <div className="urdf-viewer__header">
        <span className="urdf-viewer__title">URDF Viewer</span>
        <div className="urdf-viewer__header-actions">
          <button
            className={`urdf-viewer__toggle-btn ${showTF ? 'urdf-viewer__toggle-btn--active' : ''}`}
            onClick={() => setShowTF(!showTF)}
            title={showTF ? "Hide TF frames" : "Show TF frames"}
          >
            📐 TF
          </button>
          <button
            className="urdf-viewer__settings-btn"
            onClick={() => setShowSettings(!showSettings)}
            title="Settings"
          >
            ⚙️
          </button>
        </div>
      </div>
      {showSettings && (
        <div className="urdf-viewer__settings">
          <label className="urdf-viewer__setting">
            <input
              type="checkbox"
              checked={showTF}
              onChange={(e) => setShowTF(e.target.checked)}
            />
            <span>Show TF Frames</span>
          </label>
          <label className="urdf-viewer__setting">
            <input
              type="checkbox"
              checked={showTFLabels}
              onChange={(e) => setShowTFLabels(e.target.checked)}
              disabled={!showTF}
            />
            <span>Show Frame Labels</span>
          </label>
          <label className="urdf-viewer__setting">
            <span>Axis Length: {tfAxisLength.toFixed(2)}m</span>
            <input
              type="range"
              min="0.05"
              max="0.5"
              step="0.05"
              value={tfAxisLength}
              onChange={(e) => setTfAxisLength(parseFloat(e.target.value))}
              disabled={!showTF}
            />
          </label>

          {showTF && Object.keys(tfFrames).length > 0 && (
            <div className="urdf-viewer__frames-section">
              <div className="urdf-viewer__frames-header">
                <span>TF Frames ({Object.keys(tfFrames).length})</span>
                <div className="urdf-viewer__frames-actions">
                  <button
                    className="urdf-viewer__frame-action-btn"
                    onClick={() => toggleAllFrames(true)}
                    title="Show all frames"
                  >
                    All
                  </button>
                  <button
                    className="urdf-viewer__frame-action-btn"
                    onClick={() => toggleAllFrames(false)}
                    title="Hide all frames"
                  >
                    None
                  </button>
                </div>
              </div>
              <div className="urdf-viewer__frames-list">
                {Object.keys(tfFrames).sort().map(frameName => (
                  <label key={frameName} className="urdf-viewer__frame-item">
                    <input
                      type="checkbox"
                      checked={visibleFrames[frameName] || false}
                      onChange={() => toggleFrame(frameName)}
                    />
                    <span className="urdf-viewer__frame-name">{frameName}</span>
                    <span className="urdf-viewer__frame-parent">→ {tfFrames[frameName].parent}</span>
                  </label>
                ))}
              </div>
            </div>
          )}

          {showTF && !isConnected && (
            <div className="urdf-viewer__frames-message">
              ⚠️ Not connected to ROS - TF frames unavailable
            </div>
          )}

          {showTF && isConnected && Object.keys(tfFrames).length === 0 && (
            <div className="urdf-viewer__frames-message">
              🔍 Listening for TF frames...
            </div>
          )}
        </div>
      )}
      <div className="urdf-viewer__canvas">
        {error ? (
          <div className="urdf-viewer__message urdf-viewer__message--error">
            {error}
          </div>
        ) : xmlCode && xmlCode.trim() !== "" ? (
          <UrdfCanvas
            xmlCode={xmlCode}
            onError={setError}
            showTF={showTF}
            tfAxisLength={tfAxisLength}
            showTFLabels={showTFLabels}
            tfFrames={tfFrames}
            visibleFrames={visibleFrames}
          />
        ) : (
          <div className="urdf-viewer__message">
            <div className="urdf-viewer__icon">🤖</div>
            <div>Add blocks to canvas to see robot preview</div>
          </div>
        )}
      </div>
    </div>
  );
}

function UrdfCanvas({ xmlCode, onError, showTF, tfAxisLength, showTFLabels, tfFrames, visibleFrames }) {
  return (
    <Canvas
      style={{ width: "100%", height: "100%" }}
      camera={{ fov: 50, near: 0.0005, far: 5000, position: [2, 2, 2] }}
      gl={{ antialias: true, logarithmicDepthBuffer: true }}
    >
      <ambientLight intensity={0.65} />
      <directionalLight position={[5, 6, 8]} intensity={0.9} />
      {/* Z-up: floor in XY => rotate grid +90° in X */}
      <Grid
        args={[20, 40]}
        rotation={[Math.PI / 2, 0, 0]}
        position={[0, 0, 0]}
        cellColor="#00f6ff"
        sectionColor="#00c3ff"
        fadeDistance={30}
        fadeStrength={1}
      />
      <RobotFromXml
        xmlCode={xmlCode}
        onError={onError}
        showTF={showTF}
        tfAxisLength={tfAxisLength}
        showTFLabels={showTFLabels}
        tfFrames={tfFrames}
        visibleFrames={visibleFrames}
      />
      <OrbitControls
        makeDefault
        enableDamping
        dampingFactor={0.08}
        minDistance={0.01}
        maxDistance={2000}
      />
    </Canvas>
  );
}

function RobotFromXml({ xmlCode, onError, showTF, tfAxisLength, showTFLabels, tfFrames, visibleFrames }) {
  const [obj, setObj] = useState(null);
  const loaderRef = useRef(null);
  const groupRef = useRef(null);

  // Load URDF model
  useEffect(() => {
    if (!xmlCode) return;

    const manager = new THREE.LoadingManager();
    const loader = new URDFLoader(manager);
    loaderRef.current = loader;

    // Configure package path resolution
    loader.packages = (packageName) => {
      return `${API_BASE}/workspace/${packageName}`;
    };

    try {
      const urdf = loader.parse(xmlCode);

      if (urdf) {
        urdf.scale.set(1, 1, 1);
        urdf.frustumCulled = false;
        urdf.traverse((o) => (o.frustumCulled = false));
        setObj(urdf);
      }
    } catch (err) {
      console.error("URDF parse error:", err);
      onError?.("Failed to parse URDF");
    }

    return () => {
      loaderRef.current = null;
      setObj(null);
    };
  }, [xmlCode, onError]);

  // Visualize TF frames from ROS
  useEffect(() => {
    if (!groupRef.current || !showTF || Object.keys(tfFrames).length === 0) {
      // Clear existing TF visualizations if TF is off
      if (groupRef.current) {
        const existingTFs = groupRef.current.children.filter(
          child => child.userData && child.userData.isTFFrame
        );
        existingTFs.forEach(tf => groupRef.current.remove(tf));
      }
      return;
    }

    // Clear existing TF visualizations
    const existingTFs = groupRef.current.children.filter(
      child => child.userData && child.userData.isTFFrame
    );
    existingTFs.forEach(tf => groupRef.current.remove(tf));

    // Add TF frame visualizations for visible frames only
    Object.keys(tfFrames).forEach(frameName => {
      // Skip if frame is not visible
      if (!visibleFrames[frameName]) return;

      const frame = tfFrames[frameName];
      const tfGroup = new THREE.Group();
      tfGroup.userData.isTFFrame = true;
      tfGroup.userData.frameName = frameName;

      // Set position and rotation from ROS TF data
      tfGroup.position.set(
        frame.translation.x,
        frame.translation.y,
        frame.translation.z
      );

      tfGroup.quaternion.set(
        frame.rotation.x,
        frame.rotation.y,
        frame.rotation.z,
        frame.rotation.w
      );

      // Add axes helper (Red=X, Green=Y, Blue=Z)
      const axes = new THREE.AxesHelper(tfAxisLength);
      tfGroup.add(axes);

      // Add label if enabled
      if (showTFLabels) {
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        canvas.width = 256;
        canvas.height = 64;

        // Background
        context.fillStyle = 'rgba(0, 0, 0, 0.7)';
        context.fillRect(0, 0, canvas.width, canvas.height);

        // Text
        context.fillStyle = '#7df9ff';
        context.font = 'Bold 20px Arial';
        context.textAlign = 'center';
        context.fillText(frameName, canvas.width / 2, 40);

        const texture = new THREE.CanvasTexture(canvas);
        const spriteMaterial = new THREE.SpriteMaterial({ map: texture });
        const sprite = new THREE.Sprite(spriteMaterial);
        sprite.scale.set(0.2, 0.05, 1);
        sprite.position.set(0, 0, tfAxisLength + 0.05);
        tfGroup.add(sprite);
      }

      groupRef.current.add(tfGroup);
    });
  }, [showTF, tfAxisLength, showTFLabels, tfFrames, visibleFrames]);

  return (
    <group ref={groupRef}>
      {obj && <primitive object={obj} />}
    </group>
  );
}
