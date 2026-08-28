// src/components/gazebo/RVizSimulator.jsx
import React, { useRef, useEffect, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Grid, Sky, Stats } from '@react-three/drei';
import * as THREE from 'three';
import { useRoslib } from '../../hooks/useRoslib';
import URDFLoader from 'urdf-loader';
import { getStaticBase } from '../../ip';
import '../../styles/components/_gazebo.scss';

/**
 * RVizSimulator - Pure visualization using ROS topics (no Gazebo physics)
 *
 * This mimics RViz behavior: visualizes robot state from /tf and /odom topics
 * without requiring Gazebo physics simulation.
 */

/**
 * Robot component - Loads and renders the URDF model
 */
function Robot({ urdfPath, position, orientation, jointStates }) {
  const robotRef = useRef();
  const urdfContainerRef = useRef();
  const [robot, setRobot] = useState(null);
  const [trailPoints, setTrailPoints] = useState([]);

  // Load URDF model
  useEffect(() => {
    if (!urdfPath) return;

    const loader = new URDFLoader();
    loader.load(
      urdfPath,
      (urdfRobot) => {
        console.log('[RViz] URDF loaded successfully', urdfRobot);

        // Set up materials for better visualization
        urdfRobot.traverse((child) => {
          if (child.isMesh) {
            child.castShadow = true;
            child.receiveShadow = true;

            // Enhance materials
            if (child.material) {
              child.material.metalness = 0.2;
              child.material.roughness = 0.8;
            }
          }
        });

        setRobot(urdfRobot);
      },
      undefined,
      (error) => {
        console.error('[RViz] Error loading URDF:', error);
      }
    );
  }, [urdfPath]);

  // Update robot position and orientation from odometry
  useFrame(() => {
    if (robotRef.current && position && orientation) {
      // Update position - ROS uses Z-up, Three.js uses Y-up
      robotRef.current.position.set(position.x, position.z, position.y);

      // Apply yaw rotation only (rotation around vertical axis)
      robotRef.current.rotation.y = orientation.yaw * Math.PI / 180;

      // Add trail point
      if (Math.random() < 0.1) { // Only add occasionally to avoid too many points
        setTrailPoints(prev => {
          const newPoints = [...prev, { x: position.x, y: position.z, z: position.y }];
          return newPoints.slice(-50); // Keep last 50 points
        });
      }
    }

    // Update joint states if available
    if (robot && jointStates) {
      Object.keys(jointStates).forEach((jointName) => {
        const joint = robot.joints[jointName];
        if (joint) {
          joint.setJointValue(jointStates[jointName]);
        }
      });
    }
  });

  if (!robot) {
    return (
      <mesh ref={robotRef} position={[position?.x || 0, (position?.z || 0) + 0.1, position?.y || 0]}>
        <boxGeometry args={[0.4, 0.15, 0.2]} />
        <meshStandardMaterial color="#7df9ff" emissive="#7df9ff" emissiveIntensity={0.2} />
      </mesh>
    );
  }

  // Wrap URDF in a group for coordinate system conversion
  return (
    <>
      <group ref={robotRef}>
        <group ref={urdfContainerRef} rotation={[-Math.PI / 2, 0, 0]}>
          <primitive object={robot} />
        </group>
      </group>

      {/* Path trail */}
      {trailPoints.length > 1 && (
        <line>
          <bufferGeometry>
            <bufferAttribute
              attach="attributes-position"
              count={trailPoints.length}
              array={new Float32Array(trailPoints.flatMap(p => [p.x, p.y, p.z]))}
              itemSize={3}
            />
          </bufferGeometry>
          <lineBasicMaterial color="#7df9ff" linewidth={2} />
        </line>
      )}
    </>
  );
}

/**
 * Environment - Ground plane, axes, lighting
 */
function Environment() {
  return (
    <>
      {/* Lighting */}
      <ambientLight intensity={0.6} />
      <directionalLight
        position={[10, 10, 5]}
        intensity={1}
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-camera-far={50}
        shadow-camera-left={-10}
        shadow-camera-right={10}
        shadow-camera-top={10}
        shadow-camera-bottom={-10}
      />

      {/* Sky */}
      <Sky sunPosition={[100, 20, 100]} />

      {/* Ground Grid */}
      <Grid
        args={[100, 100]}
        cellSize={1}
        cellThickness={0.5}
        cellColor="#6b7280"
        sectionSize={5}
        sectionThickness={1}
        sectionColor="#3b82f6"
        fadeDistance={50}
        fadeStrength={1}
        followCamera={false}
      />

      {/* Ground plane for shadows */}
      <mesh receiveShadow rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, -0.01]}>
        <planeGeometry args={[100, 100]} />
        <meshStandardMaterial color="#1a1a1a" />
      </mesh>

      {/* Coordinate axes (RViz style) */}
      <primitive object={new THREE.AxesHelper(2)} />
    </>
  );
}

/**
 * Main RVizSimulator Component
 */
export default function RVizSimulator({ onObjectiveHit }) {
  const { ros, connected, subscribeTopic, advertise } = useRoslib();

  // Robot state
  const [position, setPosition] = useState({ x: 0, y: 0, z: 0.05 });
  const [orientation, setOrientation] = useState({ roll: 0, pitch: 0, yaw: 0 });
  const [velocity, setVelocity] = useState({ linear: 0, angular: 0 });
  const [jointStates, setJointStates] = useState({});

  // Use ref to track current orientation for physics simulation
  const orientationRef = useRef({ roll: 0, pitch: 0, yaw: 0 });

  // Control
  const [cmdVelPublisher, setCmdVelPublisher] = useState(null);
  const [keyPressed, setKeyPressed] = useState({});

  // URDF path (dynamically determined from network config)
  const urdfPath = `${getStaticBase()}/qcar_description/urdf/robot_runtime.urdf`;

  // Initialize cmd_vel publisher
  useEffect(() => {
    if (connected && !cmdVelPublisher) {
      const pub = advertise('/qcar/cmd_vel', 'geometry_msgs/Twist');
      setCmdVelPublisher(pub);
      console.log('[RViz] cmd_vel publisher ready');
    }
  }, [connected, advertise, cmdVelPublisher]);

  // Subscribe to odometry
  useEffect(() => {
    if (!connected) return;

    const unsub = subscribeTopic(
      '/qcar/odom',
      'nav_msgs/Odometry',
      (msg) => {
        setPosition({
          x: msg.pose.pose.position.x,
          y: msg.pose.pose.position.y,
          z: msg.pose.pose.position.z,
        });

        // Convert quaternion to euler
        const q = msg.pose.pose.orientation;
        const roll = Math.atan2(2 * (q.w * q.x + q.y * q.z), 1 - 2 * (q.x * q.x + q.y * q.y));
        const pitch = Math.asin(2 * (q.w * q.y - q.z * q.x));
        const yaw = Math.atan2(2 * (q.w * q.z + q.x * q.y), 1 - 2 * (q.y * q.y + q.z * q.z));

        const newOrientation = {
          roll: roll * 180 / Math.PI,
          pitch: pitch * 180 / Math.PI,
          yaw: yaw * 180 / Math.PI,
        };
        setOrientation(newOrientation);
        orientationRef.current = newOrientation;

        setVelocity({
          linear: msg.twist.twist.linear.x,
          angular: msg.twist.twist.angular.z,
        });
      },
      { throttle_rate: 50 }
    );

    return unsub;
  }, [connected, subscribeTopic]);

  // Subscribe to joint states (if available)
  useEffect(() => {
    if (!connected) return;

    const unsub = subscribeTopic(
      '/joint_states',
      'sensor_msgs/JointState',
      (msg) => {
        const states = {};
        msg.name.forEach((name, i) => {
          states[name] = msg.position[i];
        });
        setJointStates(states);
      },
      { throttle_rate: 100 }
    );

    return unsub;
  }, [connected, subscribeTopic]);

  // Keyboard controls
  useEffect(() => {
    const handleKeyDown = (e) => {
      setKeyPressed((prev) => ({ ...prev, [e.key.toLowerCase()]: true }));
    };

    const handleKeyUp = (e) => {
      setKeyPressed((prev) => ({ ...prev, [e.key.toLowerCase()]: false }));
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  // Publish velocity based on keyboard input AND simulate movement
  useEffect(() => {
    if (!cmdVelPublisher) return;

    const interval = setInterval(() => {
      let linear = 0;
      let angular = 0;

      if (keyPressed['w'] || keyPressed['arrowup']) linear += 1.0;
      if (keyPressed['s'] || keyPressed['arrowdown']) linear -= 1.0;
      if (keyPressed['a'] || keyPressed['arrowleft']) angular += 1.0;
      if (keyPressed['d'] || keyPressed['arrowright']) angular -= 1.0;
      if (keyPressed[' ']) { linear = 0; angular = 0; }

      // Publish to ROS
      cmdVelPublisher.publish({
        linear: { x: linear, y: 0, z: 0 },
        angular: { x: 0, y: 0, z: angular },
      });

      // SIMULATE MOVEMENT LOCALLY (since Gazebo physics isn't working)
      if (linear !== 0 || angular !== 0) {
        const dt = 0.1; // 100ms interval

        // Get current yaw from ref (stable, doesn't cause re-renders)
        const currentYawRad = orientationRef.current.yaw * Math.PI / 180;

        // Update position based on current orientation
        // ROS: X-forward, Y-left, Z-up; Yaw is rotation around Z (0° = facing +X direction)
        const dx = linear * Math.cos(currentYawRad) * dt;
        const dy = linear * Math.sin(currentYawRad) * dt;

        setPosition(prev => {
          const newPos = {
            x: prev.x + dx,
            y: prev.y + dy,
            z: prev.z,
          };
          console.log('[RViz Physics]', {
            yaw: orientationRef.current.yaw.toFixed(1),
            linear, angular,
            dx: dx.toFixed(3), dy: dy.toFixed(3),
            newX: newPos.x.toFixed(3), newY: newPos.y.toFixed(3)
          });
          return newPos;
        });

        // Update orientation for next iteration
        const newYaw = (orientationRef.current.yaw + angular * dt * 180 / Math.PI) % 360;
        const newOrientation = {
          ...orientationRef.current,
          yaw: newYaw,
        };
        setOrientation(newOrientation);
        orientationRef.current = newOrientation;

        setVelocity({ linear, angular });
      }
    }, 100);

    return () => clearInterval(interval);
  }, [cmdVelPublisher, keyPressed]);

  return (
    <div className="client-side-gazebo">
      {/* Connection Status */}
      <div className={`gazebo-status ${connected ? 'connected' : 'disconnected'}`}>
        <span className="status-dot" />
        <span>{connected ? 'ROS Connected - RViz Visualization' : 'Connecting...'}</span>
      </div>

      {/* Main 3D Viewport */}
      <div className="gazebo-viewport" style={{ height: '600px' }}>
        <Canvas shadows camera={{ position: [-5, -5, 3], fov: 60 }}>
          <Environment />
          <Robot
            urdfPath={urdfPath}
            position={position}
            orientation={orientation}
            jointStates={jointStates}
          />

          <OrbitControls
            enablePan
            enableZoom
            enableRotate
            target={[position.x, position.z, position.y]}
          />
          <Stats />
        </Canvas>
      </div>

      {/* Robot Telemetry */}
      <div className="gazebo-telemetry">
        <div>
          <strong>Position</strong>
          <div>X: {(position?.x ?? 0).toFixed(2)} m</div>
          <div>Y: {(position?.y ?? 0).toFixed(2)} m</div>
        </div>
        <div>
          <strong>Orientation</strong>
          <div>Yaw: {(orientation?.yaw ?? 0).toFixed(1)}°</div>
        </div>
        <div>
          <strong>Velocity</strong>
          <div>Linear: {(velocity?.linear ?? 0).toFixed(2)} m/s</div>
          <div>Angular: {(velocity?.angular ?? 0).toFixed(2)} rad/s</div>
        </div>
        <div>
          <strong>Controls</strong>
          <div><kbd>W</kbd><kbd>A</kbd><kbd>S</kbd><kbd>D</kbd> Move</div>
          <div><kbd>Space</kbd> Stop</div>
        </div>
      </div>
    </div>
  );
}
