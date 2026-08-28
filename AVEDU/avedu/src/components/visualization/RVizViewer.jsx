// src/components/visualization/RVizViewer.jsx
import React, { useEffect, useRef, useState, useCallback } from 'react';
import ROSLIB from 'roslib';
import * as THREE from 'three';
import '../../styles/components/_rviz-viewer.scss';

/**
 * RVizViewer Component
 *
 * RViz2-like 3D visualization for TF frames in ROS2.
 * Displays coordinate frames with axes and labels.
 * Can be expanded to fullscreen popup with configuration options.
 *
 * Props:
 * - ros: ROSLIB.Ros connection object
 * - fixedFrame: Base TF frame (default: 'world')
 * - showGrid: Show grid (default: true)
 * - showAxes: Show axes helper (default: true)
 * - axisLength: Length of TF axes in meters (default: 0.2)
 * - visibleFrames: Array of frame names to show (default: all frames)
 * - onFramesUpdate: Callback when frame list changes (optional)
 * - onExpandToggle: Callback for expand/collapse (optional)
 */
export default function RVizViewer({
  ros,
  fixedFrame = 'world',
  showGrid = true,
  showAxes = true,
  axisLength = 0.2,
  visibleFrames = null,
  onFramesUpdate,
  onExpandToggle
}) {
  const viewerRef = useRef(null);
  const [viewer, setViewer] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [tfFrames, setTfFrames] = useState([]);
  const [settings, setSettings] = useState({
    showGrid,
    showAxes,
    showFrameLabels: true,
    axisLength,
    fixedFrame
  });

  // Initialize ROS connection status
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

  // Initialize 3D Viewer
  useEffect(() => {
    if (!isConnected || !viewerRef.current) return;

    // Clear any existing viewer
    viewerRef.current.innerHTML = '';

    // Create THREE.js scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x222222);

    // Create camera with Z-up orientation (ROS convention)
    const camera = new THREE.PerspectiveCamera(
      50,
      viewerRef.current.clientWidth / viewerRef.current.clientHeight,
      0.01,
      1000
    );
    camera.up.set(0, 0, 1); // Z is up (ROS convention)
    camera.position.set(2, 2, 2);
    camera.lookAt(0, 0, 0);

    // Create renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(viewerRef.current.clientWidth, viewerRef.current.clientHeight);
    viewerRef.current.appendChild(renderer.domElement);

    // Add grid helper (rotated to XY plane, Z-up)
    const gridHelper = new THREE.GridHelper(10, 20, 0x444444, 0x222222);
    gridHelper.rotation.x = Math.PI / 2;
    gridHelper.visible = settings.showGrid;
    scene.add(gridHelper);

    // Add world axes helper (X=Red, Y=Green, Z=Blue)
    const worldAxes = new THREE.AxesHelper(0.5);
    worldAxes.visible = settings.showAxes;
    scene.add(worldAxes);

    // TF Frames container
    const tfFramesGroup = new THREE.Group();
    scene.add(tfFramesGroup);

    // Create TF client
    const tfClient = new ROSLIB.TFClient({
      ros: ros,
      angularThres: 0.01,
      transThres: 0.01,
      rate: 10.0,
      fixedFrame: settings.fixedFrame
    });

    // Store TF frame objects for updates
    const frameObjects = {};

    // Function to create or update a TF frame visualization
    const updateTFFrame = (frameName, transform) => {
      if (!frameObjects[frameName]) {
        // Create new frame visualization
        const frameGroup = new THREE.Group();
        frameGroup.name = frameName;

        // Create axes for this frame (RGB = XYZ)
        const axes = new THREE.AxesHelper(settings.axisLength);
        frameGroup.add(axes);

        // Create frame label
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        canvas.width = 256;
        canvas.height = 64;
        context.fillStyle = '#ffffff';
        context.font = 'Bold 24px Arial';
        context.fillText(frameName, 10, 40);

        const texture = new THREE.CanvasTexture(canvas);
        const spriteMaterial = new THREE.SpriteMaterial({ map: texture });
        const sprite = new THREE.Sprite(spriteMaterial);
        sprite.scale.set(0.3, 0.075, 1);
        sprite.position.set(0, 0, 0.15);
        if (settings.showFrameLabels) {
          frameGroup.add(sprite);
        }

        tfFramesGroup.add(frameGroup);
        frameObjects[frameName] = { group: frameGroup, axes, sprite };
      }

      // Update transform
      const frameObj = frameObjects[frameName];
      const { translation, rotation } = transform;

      frameObj.group.position.set(
        translation.x,
        translation.y,
        translation.z
      );

      frameObj.group.quaternion.set(
        rotation.x,
        rotation.y,
        rotation.z,
        rotation.w
      );

      // Update visibility based on settings
      frameObj.axes.visible = settings.showAxes;
      frameObj.sprite.visible = settings.showFrameLabels;

      // Update axes length
      frameObj.axes.scale.set(
        settings.axisLength / 0.2,
        settings.axisLength / 0.2,
        settings.axisLength / 0.2
      );
    };

    // Handler for TF messages (shared by both /tf and /tf_static)
    const handleTFMessage = (message) => {
      if (message.transforms) {
        message.transforms.forEach((transform) => {
          const frameName = transform.child_frame_id;
          const transformData = {
            translation: transform.transform.translation,
            rotation: transform.transform.rotation
          };
          updateTFFrame(frameName, transformData);
        });

        // Update frame list
        const currentFrames = Object.keys(frameObjects);
        setTfFrames(currentFrames);

        // Notify parent component of frame updates
        if (onFramesUpdate) {
          onFramesUpdate(currentFrames);
        }
      }
    };

    // Subscribe to dynamic TF updates (/tf)
    const tfSubscription = new ROSLIB.Topic({
      ros: ros,
      name: '/tf',
      messageType: 'tf2_msgs/TFMessage',
      throttle_rate: 100
    });
    tfSubscription.subscribe(handleTFMessage);

    // Subscribe to static TF updates (/tf_static)
    const tfStaticSubscription = new ROSLIB.Topic({
      ros: ros,
      name: '/tf_static',
      messageType: 'tf2_msgs/TFMessage',
      throttle_rate: 100
    });
    tfStaticSubscription.subscribe(handleTFMessage);

    // Add orbit controls
    let isDragging = false;
    let previousMousePosition = { x: 0, y: 0 };
    let cameraRotation = { theta: Math.PI / 4, phi: Math.PI / 3 };
    let cameraDistance = 3;

    const updateCamera = () => {
      const x = cameraDistance * Math.sin(cameraRotation.phi) * Math.cos(cameraRotation.theta);
      const y = cameraDistance * Math.sin(cameraRotation.phi) * Math.sin(cameraRotation.theta);
      const z = cameraDistance * Math.cos(cameraRotation.phi);
      camera.position.set(x, y, z);
      camera.lookAt(0, 0, 0);
      camera.up.set(0, 0, 1);
    };

    updateCamera();

    const onMouseDown = (e) => {
      isDragging = true;
      previousMousePosition = { x: e.clientX, y: e.clientY };
    };

    const onMouseMove = (e) => {
      if (!isDragging) return;
      const deltaX = e.clientX - previousMousePosition.x;
      const deltaY = e.clientY - previousMousePosition.y;

      cameraRotation.theta += deltaX * 0.01;
      cameraRotation.phi = Math.max(0.1, Math.min(Math.PI - 0.1, cameraRotation.phi + deltaY * 0.01));

      previousMousePosition = { x: e.clientX, y: e.clientY };
      updateCamera();
    };

    const onMouseUp = () => {
      isDragging = false;
    };

    const onWheel = (e) => {
      e.preventDefault();
      cameraDistance = Math.max(0.5, Math.min(20, cameraDistance + e.deltaY * 0.01));
      updateCamera();
    };

    renderer.domElement.addEventListener('mousedown', onMouseDown);
    renderer.domElement.addEventListener('mousemove', onMouseMove);
    renderer.domElement.addEventListener('mouseup', onMouseUp);
    renderer.domElement.addEventListener('wheel', onWheel);

    // Animation loop
    let animationFrameId;
    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      renderer.render(scene, camera);
    };
    animate();

    setViewer({
      scene,
      camera,
      renderer,
      tfClient,
      tfFramesGroup,
      gridHelper,
      worldAxes,
      updateCamera
    });

    // Handle window resize
    const handleResize = () => {
      if (viewerRef.current) {
        camera.aspect = viewerRef.current.clientWidth / viewerRef.current.clientHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(viewerRef.current.clientWidth, viewerRef.current.clientHeight);
      }
    };
    window.addEventListener('resize', handleResize);

    return () => {
      // Cleanup
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationFrameId);

      renderer.domElement.removeEventListener('mousedown', onMouseDown);
      renderer.domElement.removeEventListener('mousemove', onMouseMove);
      renderer.domElement.removeEventListener('mouseup', onMouseUp);
      renderer.domElement.removeEventListener('wheel', onWheel);

      tfSubscription.unsubscribe();
      tfStaticSubscription.unsubscribe();
      renderer.dispose();

      while (scene.children.length > 0) {
        scene.remove(scene.children[0]);
      }
    };
  }, [isConnected, ros, settings]);

  // Update viewer settings
  useEffect(() => {
    if (!viewer) return;

    viewer.gridHelper.visible = settings.showGrid;
    viewer.worldAxes.visible = settings.showAxes;
  }, [viewer, settings]);

  // Update frame visibility based on visibleFrames prop
  useEffect(() => {
    if (!viewer || !viewer.tfFramesGroup) return;

    // Get all frame objects from the scene
    const frameObjects = viewer.tfFramesGroup.children;

    frameObjects.forEach((frameGroup) => {
      const frameName = frameGroup.name;

      // If visibleFrames is null/undefined, show all frames
      // Otherwise, show only frames in the visibleFrames array
      if (visibleFrames === null || visibleFrames === undefined) {
        frameGroup.visible = true;
      } else {
        frameGroup.visible = visibleFrames.includes(frameName);
      }
    });
  }, [viewer, visibleFrames]);

  // Handle expand/collapse
  const handleExpandToggle = useCallback(() => {
    setIsExpanded(!isExpanded);
    onExpandToggle?.(!isExpanded);

    // Allow time for CSS transition, then trigger resize
    setTimeout(() => {
      if (viewer && viewer.camera && viewer.renderer && viewerRef.current) {
        viewer.camera.aspect = viewerRef.current.clientWidth / viewerRef.current.clientHeight;
        viewer.camera.updateProjectionMatrix();
        viewer.renderer.setSize(viewerRef.current.clientWidth, viewerRef.current.clientHeight);
      }
    }, 100);
  }, [isExpanded, onExpandToggle, viewer]);

  // Render status message if not connected
  if (!isConnected) {
    return (
      <div className="rviz-viewer rviz-viewer--disconnected">
        <div className="rviz-viewer__header">
          <span className="rviz-viewer__title">RViz - TF Viewer</span>
        </div>
        <div className="rviz-viewer__message">
          <div className="rviz-viewer__icon">⚠️</div>
          <div>Not connected to ROS</div>
          <div style={{ fontSize: '12px', marginTop: '8px', opacity: 0.7 }}>
            Start the ROS bridge to visualize TF frames
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Main viewer container */}
      <div className={`rviz-viewer ${isExpanded ? 'rviz-viewer--expanded' : ''}`}>
        {/* Header */}
        <div className="rviz-viewer__header">
          <span className="rviz-viewer__title">RViz - TF Viewer</span>
          <button
            className="rviz-viewer__expand-btn"
            onClick={handleExpandToggle}
            title={isExpanded ? "Collapse" : "Expand to fullscreen"}
          >
            {isExpanded ? '🗗' : '🗖'}
          </button>
        </div>

        {/* 3D Canvas */}
        <div className="rviz-viewer__canvas" ref={viewerRef} onDoubleClick={handleExpandToggle} />

        {/* Settings Panel (only in expanded mode) */}
        {isExpanded && (
          <div className="rviz-viewer__settings">
            <div className="rviz-viewer__settings-section">
              <h3>Display Options</h3>
              <label>
                <input
                  type="checkbox"
                  checked={settings.showGrid}
                  onChange={(e) => setSettings({ ...settings, showGrid: e.target.checked })}
                />
                Show Grid
              </label>
              <label>
                <input
                  type="checkbox"
                  checked={settings.showAxes}
                  onChange={(e) => setSettings({ ...settings, showAxes: e.target.checked })}
                />
                Show TF Axes
              </label>
              <label>
                <input
                  type="checkbox"
                  checked={settings.showFrameLabels}
                  onChange={(e) => setSettings({ ...settings, showFrameLabels: e.target.checked })}
                />
                Show Frame Labels
              </label>
            </div>

            <div className="rviz-viewer__settings-section">
              <h3>TF Configuration</h3>
              <label>
                Axis Length (m):
                <input
                  type="range"
                  min="0.1"
                  max="1.0"
                  step="0.05"
                  value={settings.axisLength}
                  onChange={(e) => setSettings({ ...settings, axisLength: parseFloat(e.target.value) })}
                />
                <span>{settings.axisLength.toFixed(2)}m</span>
              </label>
              <label>
                Fixed Frame:
                <input
                  type="text"
                  value={settings.fixedFrame}
                  onChange={(e) => setSettings({ ...settings, fixedFrame: e.target.value })}
                  placeholder="world"
                />
              </label>
            </div>

            <div className="rviz-viewer__settings-section">
              <h3>TF Frames ({tfFrames.length})</h3>
              <div className="rviz-viewer__frames-list">
                {tfFrames.length > 0 ? (
                  tfFrames.map((frame) => (
                    <div key={frame} className="rviz-viewer__frame-item">
                      📐 {frame}
                    </div>
                  ))
                ) : (
                  <div style={{ opacity: 0.5, fontSize: '12px' }}>No TF frames detected yet</div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Status bar */}
        <div className="rviz-viewer__status">
          <div className="rviz-viewer__status-item">
            <span className="rviz-viewer__status-dot rviz-viewer__status-dot--connected" />
            Connected
          </div>
          <div className="rviz-viewer__status-item">
            Fixed Frame: <code>{settings.fixedFrame}</code>
          </div>
          <div className="rviz-viewer__status-item">
            TF Frames: <strong>{tfFrames.length}</strong>
          </div>
          {!isExpanded && (
            <div className="rviz-viewer__status-hint">
              Double-click to expand
            </div>
          )}
        </div>
      </div>

      {/* Expanded overlay backdrop */}
      {isExpanded && (
        <div className="rviz-viewer__backdrop" onClick={handleExpandToggle} />
      )}
    </>
  );
}
