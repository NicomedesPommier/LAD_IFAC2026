// src/components/gazebo/QCarPhysicsScene.jsx
//
// Browser-based Rapier physics scene for the Quanser QCar with ROS2 sensors.
//
// Features:
//   • QCar body + wheels loaded from local STL (public/models/qcar/)
//   • Rapier physics: car falls from Y=1.0, lands on fixed ground plane
//   • Test obstacles (6 boxes) for LiDAR returns
//   • Simulated LiDAR  → publishes sensor_msgs/LaserScan to /scan
//   • Simulated camera → publishes sensor_msgs/CompressedImage to /camera/image/compressed
//   • Debug overlay panel (ROS status, Hz, mini-map, camera preview)
//
// Navigate to /sim to view.

import React, { Suspense, useRef, useContext, useEffect, useState } from 'react';
import { Canvas, useLoader, useFrame } from '@react-three/fiber';
import { OrbitControls, Grid } from '@react-three/drei';
import { Physics, RigidBody, CuboidCollider, CylinderCollider, useRevoluteJoint, interactionGroups } from '@react-three/rapier';
import { STLLoader } from 'three/examples/jsm/loaders/STLLoader';

import { ROSProvider, ROSContext } from '../sim/ROSContext';
import TestObstacles                from '../sim/TestObstacles';
import LidarSensor                  from '../sim/LidarSensor';
import FrontCamera                  from '../sim/FrontCamera';
import SimDebugPanel                from '../sim/SimDebugPanel';
import RosRxPanel                   from '../sim/RosRxPanel';

// ── Constants (from qcar.urdf.xacro) ──────────────────────────────────────────
//
// URDF → three.js axis mapping: ROS X→X, ROS Z→Y(up), ROS Y→-Z
//
//   chassis_length = 0.425  →  BODY_HALF_X  = 0.2125
//   chassis_height = 0.182  →  BODY_HALF_Y  = 0.091
//   chassis_width  = 0.192  →  BODY_HALF_Z  = 0.096
//
//   tire_dia   = 0.053  →  WHEEL_RADIUS     = 0.0265
//   tire_width = 0.025  →  WHEEL_HALF_H     = 0.0125
//   wheel_mass = 0.035  kg
//   chassis_mass = 2.552 kg
//
// BODY_CENTER_Y: the CuboidCollider is offset ABOVE the RigidBody origin so
// the chassis belly never clips the ground.  Wheel bottoms sit at
// +0.03338 - 0.0265 = +0.0069 m above the RigidBody origin, so we need
// BODY_CENTER_Y - BODY_HALF_Y > 0.007.  Using 0.10 gives 2 mm clearance.

const STL_SCALE      = 0.001;
const BODY_HALF_X    = 0.2125;
const BODY_HALF_Y    = 0.091;
const BODY_HALF_Z    = 0.096;
const BODY_CENTER_Y  = 0.10;    // > BODY_HALF_Y so chassis never touches ground

const WHEEL_RADIUS   = 0.0265;  // tire_dia / 2
const WHEEL_HALF_H   = 0.0125;  // tire_width / 2
const WHEEL_MASS     = 0.035;   // kg
const CHASSIS_MASS   = 2.552;   // kg

// Half the rear track width (Z-distance of rear wheel centre from centreline).
// Used for differential-drive kinematics: ω = (v ± angZ * HALF_TRACK) / R
const HALF_TRACK     = 0.05610; // metres

// ── Collision groups ───────────────────────────────────────────────────────────
// Rapier format: upper 16 bits = membership, lower 16 bits = filter.
// Wheels and chassis MUST be in separate groups — their colliders overlap by
// ~53 mm at spawn, and without filtering Rapier resolves both the joint
// constraint AND the contact force simultaneously → explosive separation.
//
//  Group 0 = chassis body
//  Group 1 = wheels
//  Group 2 = static world (ground + obstacles)
//
export const CG_CHASSIS = 0x00010004; // [Group 0 | Mask 2] -> 0x0001 << 16 | 0x0004
export const CG_WHEEL   = 0x00020004; // [Group 1 | Mask 2] -> 0x0002 << 16 | 0x0004
export const CG_WORLD   = 0x00040003; // [Group 2 | Mask 0,1] -> 0x0004 << 16 | 0x0003

const WHEEL_CONFIG = [
  { pos: [ 0.12960, 0.03338, -0.05590], mirror: true  }, // front-left
  { pos: [ 0.12960, 0.03338,  0.05590], mirror: false }, // front-right
  { pos: [-0.12765, 0.03338, -0.05610], mirror: true  }, // rear-left
  { pos: [-0.12765, 0.03338,  0.05610], mirror: false }, // rear-right
];

// ── QCar visual meshes ─────────────────────────────────────────────────────────

function QCarBodyMesh() {
  const geometry = useLoader(
    STLLoader,
    `${process.env.PUBLIC_URL}/models/qcar/QCarBody.stl`
  );
  return (
    <mesh
      geometry={geometry}
      scale={STL_SCALE}
      rotation={[-Math.PI / 2, 0, 0]}
      castShadow
    >
      <meshStandardMaterial color="#f06a10" metalness={0.3} roughness={0.7} />
    </mesh>
  );
}

function QCarWheelRigidBody({ bRef, pos, mirror, name }) {
  const geometry = useLoader(STLLoader, `${process.env.PUBLIC_URL}/models/qcar/QCarWheel.stl`);
  return (
    <RigidBody 
      ref={bRef} 
      type="dynamic" 
      colliders={false}
      collisionGroups={CG_WHEEL}
      position={pos} 
      mass={WHEEL_MASS} 
      friction={1.2} 
      linearDamping={0.1} 
      angularDamping={0.3}
      name={name}
      userData={{ name }}
      onCollisionEnter={(e) => {
        const otherName = e.other.rigidBodyObject?.name || e.other.colliderObject?.name || e.other.rigidBodyObject?.userData?.name || 'unknown';
        console.log(`[Collision] Wheel ${name} collided with ${otherName}`);
      }}
    >
      <CylinderCollider args={[WHEEL_HALF_H, WHEEL_RADIUS]} rotation={[Math.PI / 2, 0, 0]} collisionGroups={CG_WHEEL} solverGroups={CG_WHEEL} />
      <mesh geometry={geometry} scale={STL_SCALE} rotation={[-Math.PI / 2, mirror ? Math.PI : 0, 0]} castShadow>
        <meshStandardMaterial color="#cc2222" metalness={0.2} roughness={0.8} />
      </mesh>
    </RigidBody>
  );
}

// ── Custom Hooks for Vehicle ───────────────────────────────────────────────────

// QCar is 1/10th scale, max speed ~1.5 m/s.
// Wheel radius 0.0265 m  →  ω = v / r  →  1.5 / 0.0265 ≈ 56.6 rad/s max.
//
// Steering is implemented as DIFFERENTIAL DRIVE:
//   v_left  = linX - angZ * HALF_TRACK
//   v_right = linX + angZ * HALF_TRACK
//   ωi = vi / WHEEL_RADIUS
//
// This is the only physics-correct way to steer a differential-drive robot.
// DO NOT use setAngvel() on the chassis for steering — that overrides the
// physics velocity after the constraint solver has already run, which creates
// large joint-correction impulses on the next step and causes spinning.
//
// /cmd_vel coordinate mapping (ROS 2 Z-up → Three.js Y-up):
//   linear.x  → linX  (forward speed, same sign: +X = forward in both frames)
//   angular.z → angZ  (yaw rate, same sign: CCW-positive in both frames when
//                      viewed from above, i.e. turning left is positive)

const DRIVE_DAMP   = 4.0;   // Nm·s — damping when motors are active
const IDLE_DAMP    = 0.5;   // Nm·s — rolling resistance at idle (applied to ALL 4 wheels)
const MAX_LIN_VEL  = 1.5;   // m/s  — keyboard forward speed
const MAX_ANG_VEL  = 2.0;   // rad/s — keyboard yaw rate

/**
 * useDriveControl — unified keyboard + /cmd_vel drive for the QCar.
 *
 * Controls all 4 wheel joints:
 *  • Rear (RL/RR): driven via differential-drive motor velocities.
 *  • Front (FL/FR): always idle-damped (free-rolling, no motor input).
 *    This prevents undamped front-joint oscillation that would couple into yaw.
 *
 * /cmd_vel overrides keyboard when its linear.x or angular.z is non-zero.
 */
function useDriveControl(rlJoint, rrJoint, flJoint, frJoint) {
  const { subscribeTopic, connected } = useContext(ROSContext);
  const keys   = useRef({ w: false, a: false, s: false, d: false });
  const cmdVel = useRef({ linX: 0, angZ: 0 });

  // Keyboard listeners
  useEffect(() => {
    const down = (e) => { keys.current[e.key.toLowerCase()] = true; };
    const up   = (e) => { keys.current[e.key.toLowerCase()] = false; };
    window.addEventListener('keydown', down);
    window.addEventListener('keyup',   up);
    return () => {
      window.removeEventListener('keydown', down);
      window.removeEventListener('keyup',   up);
    };
  }, []);

  // /cmd_vel subscriber — throttle_rate:0 so drive commands are not delayed
  useEffect(() => {
    if (!connected) return;
    const unsub = subscribeTopic(
      '/cmd_vel',
      'geometry_msgs/Twist',
      (msg) => {
        cmdVel.current.linX = msg.linear?.x  ?? 0;
        cmdVel.current.angZ = msg.angular?.z ?? 0;
      },
      { throttle_rate: 0, queue_size: 1 }
    );
    return unsub;
  }, [connected, subscribeTopic]);

  useFrame(() => {
    const allReady =
      rlJoint.current && rrJoint.current &&
      flJoint.current && frJoint.current;
    if (!allReady) return;

    // ── Resolve command source ───────────────────────────────────────────────
    // /cmd_vel takes priority; keyboard used when cmd_vel is zero.
    let linX = 0;
    let angZ = 0;

    if (cmdVel.current.linX !== 0 || cmdVel.current.angZ !== 0) {
      linX = cmdVel.current.linX;
      angZ = cmdVel.current.angZ;
    } else {
      if (keys.current.w) linX =  MAX_LIN_VEL;
      if (keys.current.s) linX = -MAX_LIN_VEL;
      if (keys.current.a) angZ =  MAX_ANG_VEL; // turn left  = CCW = +angZ
      if (keys.current.d) angZ = -MAX_ANG_VEL; // turn right = CW  = -angZ
    }

    // ── Differential-drive kinematics → wheel angular velocities ────────────
    //
    // RL = rear-LEFT  (at Z = -HALF_TRACK)
    // RR = rear-RIGHT (at Z = +HALF_TRACK)
    //
    // Turning left (angZ > 0, CCW from above):
    //   right wheel faster  → v_right = linX + angZ * HALF_TRACK
    //   left  wheel slower  → v_left  = linX - angZ * HALF_TRACK
    //
    // Both use the same joint axis [0,0,1] (world Z = axle direction).
    // Positive ω = CCW from +Z view = contact patch moves +X = car moves forward.
    const rlAngVel = (linX - angZ * HALF_TRACK) / WHEEL_RADIUS; // rear-left
    const rrAngVel = (linX + angZ * HALF_TRACK) / WHEEL_RADIUS; // rear-right

    const driving = linX !== 0 || angZ !== 0;
    const damp    = driving ? DRIVE_DAMP : IDLE_DAMP;

    // Rear motors — differential drive
    rlJoint.current.configureMotorVelocity(rlAngVel, damp);
    rrJoint.current.configureMotorVelocity(rrAngVel, damp);

    // Front idlers — always idle-damped.
    // Even with target velocity 0, the damping term (IDLE_DAMP * current_ω)
    // provides rolling resistance that prevents undamped oscillation.
    flJoint.current.configureMotorVelocity(0, IDLE_DAMP);
    frJoint.current.configureMotorVelocity(0, IDLE_DAMP);
  });
}

function useOdometryPublisher(chassisRef) {
  const { advertise, connected } = useContext(ROSContext);
  const odomPub = useRef(null);
  const frameCount = useRef(0);

  useEffect(() => {
    if (connected) {
      odomPub.current = advertise('/qcar/odom', 'nav_msgs/Odometry', { queue_size: 1 });
    }
    return () => {
      if (odomPub.current) odomPub.current.unadvertise();
    };
  }, [connected, advertise]);

  useFrame(() => {
    if (!chassisRef.current || !odomPub.current) return;
    frameCount.current++;
    if (frameCount.current % 2 !== 0) return; // 30Hz

    const t = chassisRef.current.translation();
    const r = chassisRef.current.rotation();

    const nowMs = performance.now();
    const sec = Math.floor(nowMs / 1000);
    const nanosec = Math.round((nowMs % 1000) * 1e6);

    odomPub.current.publish({
      header: { stamp: { sec, nanosec }, frame_id: "odom" },
      child_frame_id: "base_link",
      pose: {
        pose: {
          position: { x: t.x, y: -t.z, z: t.y },
          orientation: { x: r.x, y: -r.z, z: r.y, w: r.w }
        }
      },
      twist: { twist: { linear: {x:0,y:0,z:0}, angular: {x:0,y:0,z:0} } }
    });
  });
}

// ── QCar dynamic rigid body ───────────────────────────────────────────────────

export function QCarBody({ rigidBodyRef }) {
  const flWheelRef = useRef();
  const frWheelRef = useRef();
  const rlWheelRef = useRef();
  const rrWheelRef = useRef();

  // At rest: chassisRB.y = WHEEL_RADIUS - 0.03338 = 0.0265 - 0.03338 = -0.0069
  // Spawn 2 cm above that for a gentle drop.
  const chassisPos = [0, 0.013, 0];
  const getWorldPos = (localPos) => [
    chassisPos[0] + localPos[0],
    chassisPos[1] + localPos[1],
    chassisPos[2] + localPos[2],
  ];

  // Rear drive joints (motor-powered via differential drive)
  const rlJoint = useRevoluteJoint(rigidBodyRef, rlWheelRef, [
    [-0.12765, 0.03338, -0.05610], [0, 0, 0], [0, 0, 1]
  ]);
  const rrJoint = useRevoluteJoint(rigidBodyRef, rrWheelRef, [
    [-0.12765, 0.03338,  0.05610], [0, 0, 0], [0, 0, 1]
  ]);

  // Front idler joints — store refs so we can add idle damping (prevents
  // undamped oscillation that couples into chassis yaw at spawn/impact).
  const flJoint = useRevoluteJoint(rigidBodyRef, flWheelRef, [
    [0.12960, 0.03338, -0.05590], [0, 0, 0], [0, 0, 1]
  ]);
  const frJoint = useRevoluteJoint(rigidBodyRef, frWheelRef, [
    [0.12960, 0.03338,  0.05590], [0, 0, 0], [0, 0, 1]
  ]);

  // Unified keyboard + /cmd_vel control via differential drive.
  // setAngvel() is NOT used for steering — see useDriveControl for explanation.
  useDriveControl(rlJoint, rrJoint, flJoint, frJoint);
  useOdometryPublisher(rigidBodyRef);

  const lastLogTime = useRef(0);
  useFrame(() => {
    const now = performance.now();
    if (now - lastLogTime.current > 500) { // Log twice a second
      lastLogTime.current = now;
      
      let logStr = "[Physics Debug] ";
      if (rigidBodyRef.current) {
         const t = rigidBodyRef.current.translation();
         const r = rigidBodyRef.current.rotation();
         logStr += `Chassis Pos: [${t.x.toFixed(3)}, ${t.y.toFixed(3)}, ${t.z.toFixed(3)}] Rot: [${r.x.toFixed(3)}, ${r.y.toFixed(3)}, ${r.z.toFixed(3)}, ${r.w.toFixed(3)}] `;
      }
      const wheels = { FL_Wheel: flWheelRef, FR_Wheel: frWheelRef, RL_Wheel: rlWheelRef, RR_Wheel: rrWheelRef };
      Object.entries(wheels).forEach(([wName, ref]) => {
        if (ref.current) {
           const t = ref.current.translation();
           const r = ref.current.rotation();
           logStr += `| ${wName} Pos: [${t.x.toFixed(3)}, ${t.y.toFixed(3)}, ${t.z.toFixed(3)}] Rot: [${r.x.toFixed(3)}, ${r.y.toFixed(3)}, ${r.z.toFixed(3)}, ${r.w.toFixed(3)}] `;
        }
      });
      console.log(logStr);
    }
  });

  return (
    <group>
      {/* Chassis */}
      <RigidBody
        ref={rigidBodyRef}
        type="dynamic"
        colliders={false}
        collisionGroups={CG_CHASSIS}
        position={chassisPos}
        mass={CHASSIS_MASS}
        linearDamping={0.3}
        angularDamping={1.0}
        name="Chassis"
        userData={{ name: "Chassis" }}
        onCollisionEnter={(e) => {
          const otherName = e.other.rigidBodyObject?.name || e.other.colliderObject?.name || e.other.rigidBodyObject?.userData?.name || 'unknown';
          console.log(`[Collision] Chassis collided with ${otherName}`);
        }}
      >
        <CuboidCollider
          args={[BODY_HALF_X, BODY_HALF_Y, BODY_HALF_Z]}
          position={[0, BODY_CENTER_Y, 0]}
          collisionGroups={CG_CHASSIS}
          solverGroups={CG_CHASSIS}
        />
        <Suspense fallback={null}>
          <QCarBodyMesh />
        </Suspense>
      </RigidBody>

      {/* All 4 wheels directly jointed to chassis — no intermediate knuckle bodies */}
      <QCarWheelRigidBody bRef={flWheelRef} pos={getWorldPos([ 0.12960, 0.03338, -0.05590])} mirror={true} name="FL_Wheel" />
      <QCarWheelRigidBody bRef={frWheelRef} pos={getWorldPos([ 0.12960, 0.03338,  0.05590])} mirror={false} name="FR_Wheel" />
      <QCarWheelRigidBody bRef={rlWheelRef} pos={getWorldPos([-0.12765, 0.03338, -0.05610])} mirror={true} name="RL_Wheel" />
      <QCarWheelRigidBody bRef={rrWheelRef} pos={getWorldPos([-0.12765, 0.03338,  0.05610])} mirror={false} name="RR_Wheel" />
    </group>
  );
}

// ── Fixed ground plane ─────────────────────────────────────────────────────────

function Ground() {
  return (
    <RigidBody type="fixed" colliders={false} collisionGroups={CG_WORLD} restitution={0.1} friction={0.8} name="Ground" userData={{ name: "Ground" }}>
      <CuboidCollider args={[50, 0.05, 50]} position={[0, -0.05, 0]} collisionGroups={CG_WORLD} solverGroups={CG_WORLD} />
      <mesh receiveShadow rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]}>
        <planeGeometry args={[100, 100]} />
        <meshStandardMaterial color="#777777" />
      </mesh>
    </RigidBody>
  );
}

// ── Physics debug HUD ──────────────────────────────────────────────────────────
// PhysicsHUDCapture runs inside the Canvas and writes car state to a shared ref.
// PhysicsDebugHUD is an HTML overlay outside the Canvas that renders the state.

function PhysicsHUDCapture({ carRef, stateRef }) {
  useFrame(() => {
    if (!carRef.current || !stateRef) return;
    const t  = carRef.current.translation();
    const lv = carRef.current.linvel();
    const av = carRef.current.angvel();
    stateRef.current.dbg = {
      pos:       t,
      linvelMag: Math.sqrt(lv.x**2 + lv.y**2 + lv.z**2),
      angvelMag: Math.sqrt(av.x**2 + av.y**2 + av.z**2),
      sleeping:  carRef.current.isSleeping(),
    };
  });
  return null;
}

function PhysicsDebugHUD({ stateRef }) {
  const posRef     = useRef(null);
  const linvelRef  = useRef(null);
  const angvelRef  = useRef(null);
  const sleepRef   = useRef(null);

  useEffect(() => {
    const id = setInterval(() => {
      const dbg = stateRef?.current?.dbg;
      if (!dbg) return;

      if (posRef.current && dbg.pos)
        posRef.current.textContent =
          `${dbg.pos.x.toFixed(3)}  ${dbg.pos.y.toFixed(3)}  ${dbg.pos.z.toFixed(3)}`;

      if (linvelRef.current) {
        linvelRef.current.textContent = `${dbg.linvelMag.toFixed(2)} m/s`;
        linvelRef.current.style.color = dbg.linvelMag > 3 ? '#ff4444' : '#7aff7a';
      }
      if (angvelRef.current) {
        angvelRef.current.textContent = `${dbg.angvelMag.toFixed(2)} rad/s`;
        angvelRef.current.style.color = dbg.angvelMag > 5 ? '#ff4444' : '#7aff7a';
      }
      if (sleepRef.current) {
        sleepRef.current.textContent   = dbg.sleeping ? 'SLEEPING' : 'ACTIVE';
        sleepRef.current.style.color   = dbg.sleeping ? '#888' : '#4af';
      }
    }, 100);
    return () => clearInterval(id);
  }, [stateRef]);

  return (
    <div style={{
      position: 'absolute', bottom: 70, right: 16, zIndex: 20,
      background: 'rgba(0,0,0,0.75)', border: '1px solid #334',
      borderRadius: 6, padding: '8px 12px', fontFamily: 'monospace',
      fontSize: 11, color: '#aac', lineHeight: 1.8, minWidth: 200,
      pointerEvents: 'none',
    }}>
      <div style={{ color: '#556', marginBottom: 4 }}>⬡ PHYSICS DEBUG</div>
      <div style={{ display: 'grid', gridTemplateColumns: '68px 1fr', gap: '0 8px' }}>
        <span style={{ color: '#667' }}>POS</span>
        <span ref={posRef} style={{ color: '#aac' }}>--</span>
        <span style={{ color: '#667' }}>LINVEL</span>
        <span ref={linvelRef}>--</span>
        <span style={{ color: '#667' }}>ANGVEL</span>
        <span ref={angvelRef}>--</span>
        <span style={{ color: '#667' }}>STATUS</span>
        <span ref={sleepRef}>--</span>
      </div>
      <div style={{ marginTop: 6, color: '#334', fontSize: 10 }}>
        ` toggle  •  D dump to console
      </div>
    </div>
  );
}

// ── Inner scene (inside Canvas, has access to ROSContext) ─────────────────────

function SimScene({ carRef, simStateRef, resetKey }) {
  const { connected } = useContext(ROSContext);

  // Keep connection state in the shared ref for the debug panel.
  simStateRef.current.connected = connected;

  const handleScan = (ranges, hz) => {
    simStateRef.current.lidarRanges = ranges;
    if (hz != null) simStateRef.current.lidarHz = hz;
  };

  const handleFrame = (dataUrl, hz) => {
    simStateRef.current.cameraDataUrl = dataUrl;
    if (hz != null) simStateRef.current.cameraHz = hz;
  };

  return (
    <>
      {/* Lighting */}
      <ambientLight intensity={0.5} />
      <directionalLight
        position={[6, 12, 6]}
        intensity={1.2}
        castShadow
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
        shadow-camera-near={0.5}
        shadow-camera-far={60}
        shadow-camera-left={-8}
        shadow-camera-right={8}
        shadow-camera-top={8}
        shadow-camera-bottom={-8}
      />

      {/* Grid overlay at ground level */}
      <Grid
        args={[20, 20]}
        position={[0, 0.002, 0]}
        cellColor="#555555"
        sectionColor="#888888"
      />

      {/* Rapier physics world — key forces full remount on reset */}
      <Physics key={resetKey} gravity={[0, -9.81, 0]}>
        <Ground />
        <TestObstacles />
        <QCarBody rigidBodyRef={carRef} />

        {/* LiDAR must be inside <Physics> for useRapier() */}
        <LidarSensor carRef={carRef} onScan={handleScan} />

        {/* Captures physics state for the debug HUD each frame */}
        <PhysicsHUDCapture carRef={carRef} stateRef={simStateRef} />
      </Physics>

      {/* Front camera — outside Physics, inside Canvas */}
      <FrontCamera carRef={carRef} onFrame={handleFrame} />

      {/* Orbit camera */}
      <OrbitControls
        makeDefault
        enableDamping
        dampingFactor={0.05}
        minDistance={0.3}
        maxDistance={50}
        target={[0, 0.1, 0]}
      />
    </>
  );
}

// ── Main scene export ─────────────────────────────────────────────────────────

export default function QCarPhysicsScene() {
  // Shared mutable state between Canvas components and HTML overlay.
  const carRef     = useRef(null);
  const simStateRef = useRef({
    connected:     false,
    lidarHz:       0,
    cameraHz:      0,
    lidarRanges:   [],
    cameraDataUrl: null,
    dbg:           null,
  });

  // Incrementing this key remounts the entire Physics world, resetting all bodies.
  const [resetKey, setResetKey] = useState(0);

  // Backtick toggles the physics debug HUD; D dumps state to console.
  const [showDebug, setShowDebug] = useState(false);
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === '`') setShowDebug(v => !v);
      if (e.key === 'd' || e.key === 'D') {
        console.log('[PhysicsDebug]', JSON.stringify(simStateRef.current?.dbg, null, 2));
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  return (
    <ROSProvider>
      <div style={{ position: 'relative', width: '100%', height: '100vh' }}>
        <Canvas
          shadows
          camera={{ position: [3, 3, 3], fov: 45, near: 0.01, far: 500 }}
          style={{ width: '100%', height: '100%', background: '#1a1a2e' }}
        >
          <SimScene carRef={carRef} simStateRef={simStateRef} resetKey={resetKey} />
        </Canvas>

        {/* HTML debug overlay — outside Canvas, polls simStateRef */}
        <SimDebugPanel stateRef={simStateRef} />

        {/* New RX Panel (Subscribes to ROS loopback) */}
        <RosRxPanel />

        {/* Physics debug HUD — toggle with backtick key */}
        {showDebug && <PhysicsDebugHUD stateRef={simStateRef} />}

        {/* Reset button — bottom-center overlay */}
        <div style={{
          position: 'absolute',
          bottom: 24,
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 20,
          display: 'flex',
          gap: 10,
          alignItems: 'center',
        }}>
          <button
            onClick={() => setResetKey(k => k + 1)}
            style={{
              padding: '8px 22px',
              borderRadius: 6,
              border: '1px solid rgba(255,160,50,0.5)',
              background: 'rgba(20,10,0,0.85)',
              color: '#f90',
              fontFamily: 'monospace',
              fontSize: 13,
              fontWeight: 'bold',
              cursor: 'pointer',
              letterSpacing: '0.05em',
              boxShadow: '0 0 10px rgba(255,140,0,0.3)',
              transition: 'background 0.15s',
            }}
            onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,120,0,0.25)'}
            onMouseLeave={e => e.currentTarget.style.background = 'rgba(20,10,0,0.85)'}
          >
            ↺ Reset Simulation
          </button>
          <span style={{
            color: 'rgba(200,200,200,0.45)',
            fontFamily: 'monospace',
            fontSize: 11,
            pointerEvents: 'none',
          }}>
            #{resetKey}
          </span>
        </div>
      </div>
    </ROSProvider>
  );
}
