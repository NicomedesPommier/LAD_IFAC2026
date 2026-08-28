// src/components/visualization/LidarVisualizer.jsx
import React, { useEffect, useRef, useState } from 'react';
import ROSLIB from 'roslib';
import * as ROS3D from 'ros3d';
import * as THREE from 'three';

/**
 * LidarVisualizer Component
 *
 * Displays LIDAR data from a ROS2 simulation in both 3D and 2D views.
 * Uses ros3d and ros2d libraries for standard ROS visualization.
 * Shows a simple geometric representation of the robot.
 *
 * Props:
 * - ros: ROSLIB.Ros connection object
 * - lidarTopic: Topic name for LaserScan data (default: '/qcar/lidar/scan')
 * - fixedFrame: TF frame for visualization (default: 'base_link')
 * - mode: '3d' | '2d' | 'both' (default: 'both')
 */
export default function LidarVisualizer({
  ros,
  lidarTopic = '/qcar/lidar/scan',
  fixedFrame = 'base_link',
  mode = 'both'
}) {
  const viewer3dRef = useRef(null);
  const viewer2dRef = useRef(null);
  const [viewer3D, setViewer3D] = useState(null);
  const [viewer2D, setViewer2D] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [scanCount, setScanCount] = useState(0);
  const [currentScanData, setCurrentScanData] = useState(null);

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
    if (!isConnected || !viewer3dRef.current || (mode !== '3d' && mode !== 'both')) return;

    // Clear any existing viewer
    viewer3dRef.current.innerHTML = '';

    // Create pure THREE.js scene instead of ROS3D.Viewer to avoid WebGL issues
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x111111);

    // Create camera with Z-up orientation (ROS convention)
    const camera = new THREE.PerspectiveCamera(
      50,
      viewer3dRef.current.clientWidth / viewer3dRef.current.clientHeight,
      0.01,
      1000
    );
    camera.up.set(0, 0, 1); // Z is up (ROS convention)
    camera.position.set(5, 5, 5); // Position camera at angle to see the scene
    camera.lookAt(0, 0, 0);

    // Create renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(viewer3dRef.current.clientWidth, viewer3dRef.current.clientHeight);
    viewer3dRef.current.appendChild(renderer.domElement);

    // Add grid helper rotated to XY plane (Z up, matching ROS conventions)
    const gridHelper = new THREE.GridHelper(10, 20, 0x333333, 0x333333);
    gridHelper.rotation.x = Math.PI / 2; // Rotate 90° to make XY plane horizontal
    scene.add(gridHelper);

    // Add axes helper (X=Red, Y=Green, Z=Blue)
    const axesHelper = new THREE.AxesHelper(1);
    scene.add(axesHelper);

    // Create virtual environment with walls and obstacles (Z-up convention)
    const obstacles = [];

    // Room walls (10m x 8m) - BoxGeometry(X, Y, Z) with Z up
    const wallMaterial = new THREE.MeshBasicMaterial({ color: 0x888888, side: THREE.DoubleSide });

    // North wall (perpendicular to Y axis)
    const northWall = new THREE.Mesh(new THREE.BoxGeometry(10, 0.2, 2), wallMaterial);
    northWall.position.set(0, 4, 1);
    scene.add(northWall);
    obstacles.push(northWall);

    // South wall (perpendicular to Y axis)
    const southWall = new THREE.Mesh(new THREE.BoxGeometry(10, 0.2, 2), wallMaterial);
    southWall.position.set(0, -4, 1);
    scene.add(southWall);
    obstacles.push(southWall);

    // East wall (perpendicular to X axis)
    const eastWall = new THREE.Mesh(new THREE.BoxGeometry(0.2, 8, 2), wallMaterial);
    eastWall.position.set(5, 0, 1);
    scene.add(eastWall);
    obstacles.push(eastWall);

    // West wall (perpendicular to X axis)
    const westWall = new THREE.Mesh(new THREE.BoxGeometry(0.2, 8, 2), wallMaterial);
    westWall.position.set(-5, 0, 1);
    scene.add(westWall);
    obstacles.push(westWall);

    // Central obstacle (red cylinder) - CylinderGeometry is vertical along Y by default, rotate for Z-up
    const centralObstacle = new THREE.Mesh(
      new THREE.CylinderGeometry(0.5, 0.5, 1, 16),
      new THREE.MeshBasicMaterial({ color: 0xff0000 })
    );
    centralObstacle.rotation.x = Math.PI / 2; // Rotate to align with Z axis
    centralObstacle.position.set(2, 1, 0.5); // Moved from center to (2, 1)
    scene.add(centralObstacle);
    obstacles.push(centralObstacle);

    // Left obstacle (blue box)
    const leftObstacle = new THREE.Mesh(
      new THREE.BoxGeometry(0.6, 0.6, 0.6),
      new THREE.MeshBasicMaterial({ color: 0x0000ff })
    );
    leftObstacle.position.set(-2, 2, 0.3);
    scene.add(leftObstacle);
    obstacles.push(leftObstacle);

    // Right obstacle (green box)
    const rightObstacle = new THREE.Mesh(
      new THREE.BoxGeometry(0.6, 0.6, 0.6),
      new THREE.MeshBasicMaterial({ color: 0x00ff00 })
    );
    rightObstacle.position.set(2, -2, 0.3);
    scene.add(rightObstacle);
    obstacles.push(rightObstacle);

    // Create QCar model as a group
    const qcarGroup = new THREE.Group();

    // Main chassis (body) - orange/black
    const chassisGeometry = new THREE.BoxGeometry(0.4, 0.25, 0.08);
    const chassisMaterial = new THREE.MeshBasicMaterial({ color: 0xff6600 });
    const chassis = new THREE.Mesh(chassisGeometry, chassisMaterial);
    chassis.position.set(0, 0, 0.04);
    qcarGroup.add(chassis);

    // Front bumper
    const bumperGeometry = new THREE.BoxGeometry(0.05, 0.25, 0.03);
    const bumperMaterial = new THREE.MeshBasicMaterial({ color: 0x222222 });
    const frontBumper = new THREE.Mesh(bumperGeometry, bumperMaterial);
    frontBumper.position.set(0.225, 0, 0.015);
    qcarGroup.add(frontBumper);

    // Wheels (4 wheels)
    const wheelGeometry = new THREE.CylinderGeometry(0.05, 0.05, 0.03, 16);
    const wheelMaterial = new THREE.MeshBasicMaterial({ color: 0x1a1a1a });

    // Rotate wheel geometry to align with Y axis (for Z-up)
    const wheelRotation = new THREE.Euler(Math.PI / 2, 0, 0);

    // Front left wheel
    const wheelFL = new THREE.Mesh(wheelGeometry, wheelMaterial);
    wheelFL.rotation.copy(wheelRotation);
    wheelFL.position.set(0.15, 0.15, 0.05);
    qcarGroup.add(wheelFL);

    // Front right wheel
    const wheelFR = new THREE.Mesh(wheelGeometry, wheelMaterial);
    wheelFR.rotation.copy(wheelRotation);
    wheelFR.position.set(0.15, -0.15, 0.05);
    qcarGroup.add(wheelFR);

    // Rear left wheel
    const wheelRL = new THREE.Mesh(wheelGeometry, wheelMaterial);
    wheelRL.rotation.copy(wheelRotation);
    wheelRL.position.set(-0.15, 0.15, 0.05);
    qcarGroup.add(wheelRL);

    // Rear right wheel
    const wheelRR = new THREE.Mesh(wheelGeometry, wheelMaterial);
    wheelRR.rotation.copy(wheelRotation);
    wheelRR.position.set(-0.15, -0.15, 0.05);
    qcarGroup.add(wheelRR);

    // LIDAR sensor on top (cyan cylinder)
    const lidarSensorGeometry = new THREE.CylinderGeometry(0.04, 0.04, 0.06, 16);
    const lidarSensorMaterial = new THREE.MeshBasicMaterial({
      color: 0x00ffff,
      transparent: true,
      opacity: 0.8
    });
    const lidarSensor = new THREE.Mesh(lidarSensorGeometry, lidarSensorMaterial);
    lidarSensor.rotation.x = Math.PI / 2;
    lidarSensor.position.set(0, 0, 0.11);
    qcarGroup.add(lidarSensor);

    // LIDAR rotating top indicator (small spinning disc)
    const lidarTopGeometry = new THREE.CylinderGeometry(0.03, 0.03, 0.01, 16);
    const lidarTopMaterial = new THREE.MeshBasicMaterial({ color: 0x00aaaa });
    const lidarTop = new THREE.Mesh(lidarTopGeometry, lidarTopMaterial);
    lidarTop.rotation.x = Math.PI / 2;
    lidarTop.position.set(0, 0, 0.14);
    qcarGroup.add(lidarTop);

    // Direction indicator (red arrow on front)
    const arrowGeometry = new THREE.ConeGeometry(0.04, 0.12, 8);
    const arrowMaterial = new THREE.MeshBasicMaterial({ color: 0xff0000 });
    const arrow = new THREE.Mesh(arrowGeometry, arrowMaterial);
    arrow.rotation.set(Math.PI / 2, 0, -Math.PI / 2);
    arrow.position.set(0.25, 0, 0.04);
    qcarGroup.add(arrow);

    scene.add(qcarGroup);

    // Create TF client
    const tfClient = new ROSLIB.TFClient({
      ros: ros,
      angularThres: 0.01,
      transThres: 0.01,
      rate: 10.0,
      fixedFrame: fixedFrame
    });

    // LIDAR simulation setup
    const raycaster = new THREE.Raycaster();
    const lidarPosition = new THREE.Vector3(0, 0, 0.05); // LIDAR at robot center
    const numRays = 360; // 360 rays for full circle
    const maxRange = 12.0; // 12 meters max range
    const minRange = 0.12; // 12 cm min range
    const angleMin = -Math.PI; // -180 degrees
    const angleMax = Math.PI; // 180 degrees
    const angleIncrement = (angleMax - angleMin) / numRays;

    // Simulate LIDAR scan
    const simulateLidarScan = () => {
      const ranges = [];

      for (let i = 0; i < numRays; i++) {
        const angle = angleMin + i * angleIncrement;

        // Ray direction (in XY plane)
        const direction = new THREE.Vector3(
          Math.cos(angle),
          Math.sin(angle),
          0
        ).normalize();

        // Cast ray from LIDAR position
        raycaster.set(lidarPosition, direction);
        const intersects = raycaster.intersectObjects(obstacles, true);

        if (intersects.length > 0 && intersects[0].distance >= minRange) {
          ranges.push(intersects[0].distance);
        } else {
          ranges.push(Infinity); // No detection
        }
      }

      return ranges;
    };

    // Visualize LaserScan with custom colors
    const laserScanGeometry = new THREE.BufferGeometry();
    const laserScanMaterial = new THREE.PointsMaterial({
      size: 0.08,
      color: 0x00ffff,  // Cyan points
      sizeAttenuation: false
    });
    const laserScanPoints = new THREE.Points(laserScanGeometry, laserScanMaterial);
    scene.add(laserScanPoints);

    // Update LIDAR visualization
    const updateLidarVisualization = (ranges) => {
      const positions = [];
      let angle = angleMin;

      for (let i = 0; i < ranges.length; i++) {
        const range = ranges[i];

        if (range >= minRange && range <= maxRange && isFinite(range)) {
          const x = range * Math.cos(angle);
          const y = range * Math.sin(angle);
          const z = 0;
          positions.push(x, y, z);
        }

        angle += angleIncrement;
      }

      laserScanGeometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
      laserScanGeometry.computeBoundingSphere();
    };

    // Add simple orbit controls
    let isDragging = false;
    let previousMousePosition = { x: 0, y: 0 };
    let cameraRotation = { theta: Math.PI / 4, phi: Math.PI / 3 }; // Start at 45° angle
    let cameraDistance = 8;

    const updateCamera = () => {
      // Spherical coordinates with Z-up
      const x = cameraDistance * Math.sin(cameraRotation.phi) * Math.cos(cameraRotation.theta);
      const y = cameraDistance * Math.sin(cameraRotation.phi) * Math.sin(cameraRotation.theta);
      const z = cameraDistance * Math.cos(cameraRotation.phi);
      camera.position.set(x, y, z);
      camera.lookAt(0, 0, 0);
      camera.up.set(0, 0, 1); // Ensure Z stays up
    };

    // Initialize camera position
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
      cameraDistance = Math.max(1, Math.min(20, cameraDistance + e.deltaY * 0.01));
      updateCamera();
    };

    renderer.domElement.addEventListener('mousedown', onMouseDown);
    renderer.domElement.addEventListener('mousemove', onMouseMove);
    renderer.domElement.addEventListener('mouseup', onMouseUp);
    renderer.domElement.addEventListener('wheel', onWheel);

    // Animation loop with LIDAR simulation
    let animationFrameId;
    let lastScanTime = 0;
    const scanInterval = 100; // Run LIDAR scan every 100ms (10Hz)

    const animate = (time) => {
      animationFrameId = requestAnimationFrame(animate);

      // Rotate LIDAR sensor to show it's scanning
      if (lidarTop) {
        lidarTop.rotation.z += 0.05; // Spin the LIDAR top
      }

      // Run LIDAR scan at fixed interval
      if (time - lastScanTime >= scanInterval) {
        const ranges = simulateLidarScan();
        updateLidarVisualization(ranges);
        setScanCount(prev => prev + 1);

        // Save scan data for 2D view
        setCurrentScanData({
          ranges,
          angle_min: angleMin,
          angle_max: angleMax,
          angle_increment: angleIncrement,
          range_min: minRange,
          range_max: maxRange
        });

        lastScanTime = time;
      }

      renderer.render(scene, camera);
    };
    animate(0);

    setViewer3D({ scene, camera, renderer, tfClient, laserScanPoints });

    // Handle window resize
    const handleResize = () => {
      if (viewer3dRef.current) {
        camera.aspect = viewer3dRef.current.clientWidth / viewer3dRef.current.clientHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(viewer3dRef.current.clientWidth, viewer3dRef.current.clientHeight);
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

      renderer.dispose();

      // Clear scene children properly
      while(scene.children.length > 0) {
        scene.remove(scene.children[0]);
      }
    };
  }, [isConnected, ros, lidarTopic, fixedFrame, mode]);

  // Initialize 2D Canvas Viewer
  useEffect(() => {
    if (!isConnected || !viewer2dRef.current || (mode !== '2d' && mode !== 'both')) return;

    const canvas = viewer2dRef.current;
    const ctx = canvas.getContext('2d');

    // Set canvas size
    const width = 800;
    const height = 600;
    canvas.width = width;
    canvas.height = height;

    const scale = 40; // 40 pixels = 1 meter
    const centerX = width / 2;
    const centerY = height / 2;

    // Function to draw grid
    const drawGrid = () => {
      ctx.strokeStyle = 'rgba(100, 100, 100, 0.3)';
      ctx.lineWidth = 1;

      // Vertical lines
      for (let x = 0; x < width; x += scale) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
      }

      // Horizontal lines
      for (let y = 0; y < height; y += scale) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }

      // Center axes (brighter)
      ctx.strokeStyle = 'rgba(150, 150, 150, 0.5)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(centerX, 0);
      ctx.lineTo(centerX, height);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(0, centerY);
      ctx.lineTo(width, centerY);
      ctx.stroke();
    };

    // Function to draw robot (QCar from top view)
    const drawRobot = () => {
      // Main chassis (rectangle)
      ctx.fillStyle = '#FF6600';
      const carWidth = 10 * scale;  // 0.25m
      const carLength = 16 * scale; // 0.4m
      ctx.fillRect(centerX - carLength/2, centerY - carWidth/2, carLength, carWidth);

      // Wheels
      ctx.fillStyle = '#1a1a1a';
      const wheelWidth = 1.5 * scale;
      const wheelLength = 2 * scale;
      // Front left
      ctx.fillRect(centerX + 6*scale - wheelLength/2, centerY - carWidth/2 - wheelWidth, wheelLength, wheelWidth);
      // Front right
      ctx.fillRect(centerX + 6*scale - wheelLength/2, centerY + carWidth/2, wheelLength, wheelWidth);
      // Rear left
      ctx.fillRect(centerX - 6*scale - wheelLength/2, centerY - carWidth/2 - wheelWidth, wheelLength, wheelWidth);
      // Rear right
      ctx.fillRect(centerX - 6*scale - wheelLength/2, centerY + carWidth/2, wheelLength, wheelWidth);

      // LIDAR sensor (cyan circle)
      ctx.fillStyle = '#00FFFF';
      ctx.globalAlpha = 0.8;
      ctx.beginPath();
      ctx.arc(centerX, centerY, 1.6 * scale, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1.0;

      // Direction indicator (red arrow)
      ctx.fillStyle = '#FF0000';
      ctx.beginPath();
      ctx.moveTo(centerX + carLength/2, centerY);
      ctx.lineTo(centerX + carLength/2 + 3*scale, centerY - 2*scale);
      ctx.lineTo(centerX + carLength/2 + 3*scale, centerY + 2*scale);
      ctx.closePath();
      ctx.fill();
    };

    // Function to render the 2D view
    const render2D = (scanData) => {
      // Clear canvas
      ctx.fillStyle = '#0a0a0a';
      ctx.fillRect(0, 0, width, height);

      // Draw grid
      drawGrid();

      // Draw LIDAR points if we have scan data
      if (scanData && scanData.ranges) {
        ctx.fillStyle = '#00FFFF';
        let angle = scanData.angle_min;

        for (let i = 0; i < scanData.ranges.length; i++) {
          const range = scanData.ranges[i];

          // Only draw valid ranges
          if (range >= scanData.range_min && range <= scanData.range_max && isFinite(range)) {
            // Convert polar to Cartesian (ROS coordinates: X forward, Y left)
            const x = range * Math.cos(angle);
            const y = range * Math.sin(angle);

            // Convert to canvas coordinates
            const canvasX = centerX + (x * scale);
            const canvasY = centerY - (y * scale); // Invert Y for canvas

            // Draw point
            ctx.beginPath();
            ctx.arc(canvasX, canvasY, 2, 0, Math.PI * 2);
            ctx.fill();
          }

          angle += scanData.angle_increment;
        }
      }

      // Draw robot on top
      drawRobot();
    };

    // Initial draw
    render2D(currentScanData);

    setViewer2D({ render2D });

    return () => {
      // No cleanup needed for canvas
    };
  }, [isConnected, ros, lidarTopic, mode]);

  // Update 2D view when scan data changes
  useEffect(() => {
    if (viewer2D && viewer2D.render2D && currentScanData) {
      viewer2D.render2D(currentScanData);
    }
  }, [currentScanData, viewer2D]);

  // Render status message if not connected
  if (!isConnected) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: '400px',
        backgroundColor: '#1a1a1a',
        border: '1px solid #333',
        borderRadius: '8px',
        color: '#999'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>⚠️</div>
          <div>Not connected to ROS</div>
          <div style={{ fontSize: '12px', marginTop: '8px', opacity: 0.7 }}>
            Start the simulation to see LIDAR data
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      {/* Status bar */}
      <div style={{
        display: 'flex',
        gap: '1rem',
        padding: '0.5rem 1rem',
        backgroundColor: '#1a1a1a',
        border: '1px solid #333',
        borderRadius: '4px',
        fontSize: '14px',
        color: '#aaa'
      }}>
        <div>
          <span style={{ color: '#00ff00' }}>●</span> Connected
        </div>
        <div>Topic: <code style={{ color: '#00ffff' }}>{lidarTopic}</code></div>
        <div>Scans received: <strong>{scanCount}</strong></div>
        <div>Frame: <code>{fixedFrame}</code></div>
      </div>

      {/* Visualization panels */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: mode === 'both' ? '1fr 1fr' : '1fr',
        gap: '1rem'
      }}>
        {/* 3D View */}
        {(mode === '3d' || mode === 'both') && (
          <div style={{ position: 'relative' }}>
            <div style={{
              position: 'absolute',
              top: '8px',
              left: '8px',
              background: 'rgba(0,0,0,0.7)',
              padding: '4px 8px',
              borderRadius: '4px',
              fontSize: '12px',
              color: '#0ff',
              zIndex: 10
            }}>
              3D View
            </div>
            <div
              id="ros3d-viewer"
              ref={viewer3dRef}
              style={{
                width: '100%',
                height: '400px',
                border: '1px solid #333',
                borderRadius: '8px',
                backgroundColor: '#111'
              }}
            />
            <div style={{
              marginTop: '8px',
              fontSize: '12px',
              color: '#666',
              textAlign: 'center'
            }}>
              Use mouse to rotate, zoom, pan
            </div>
          </div>
        )}

        {/* 2D View */}
        {(mode === '2d' || mode === 'both') && (
          <div style={{ position: 'relative' }}>
            <div style={{
              position: 'absolute',
              top: '8px',
              left: '8px',
              background: 'rgba(0,0,0,0.7)',
              padding: '4px 8px',
              borderRadius: '4px',
              fontSize: '12px',
              color: '#0ff',
              zIndex: 10
            }}>
              2D Top-Down View
            </div>
            <canvas
              ref={viewer2dRef}
              style={{
                width: '100%',
                height: '400px',
                border: '1px solid #333',
                borderRadius: '8px',
                backgroundColor: '#0a0a0a',
                display: 'block'
              }}
            />
            <div style={{
              marginTop: '8px',
              fontSize: '12px',
              color: '#666',
              textAlign: 'center'
            }}>
              Orange = QCar chassis | Cyan = LIDAR sensor | Red = Direction
            </div>
          </div>
        )}
      </div>

      {/* Instructions */}
      <div style={{
        padding: '1rem',
        backgroundColor: '#1a1a1a',
        border: '1px solid #333',
        borderRadius: '4px',
        fontSize: '13px',
        color: '#aaa'
      }}>
        <strong style={{ color: '#fff' }}>💡 Client-Side LIDAR Simulation:</strong>
        <ul style={{ marginTop: '0.5rem', marginBottom: 0, paddingLeft: '1.5rem' }}>
          <li>🎮 Real-time browser-based simulation (no Gazebo needed!)</li>
          <li>🚗 QCar model with 4 wheels, chassis, and spinning LIDAR sensor on top</li>
          <li>🔵 Gray walls form a 10m x 8m room</li>
          <li>🔴 Red cylinder, 🔵 Blue box, 🟢 Green box obstacles</li>
          <li>🔷 Cyan LIDAR sensor actively scanning 360° (12m max range)</li>
          <li>🔷 Cyan points = Real-time LIDAR detections using raycasting</li>
          <li>🖱️ Drag to rotate, scroll to zoom in 3D view</li>
        </ul>
      </div>
    </div>
  );
}
