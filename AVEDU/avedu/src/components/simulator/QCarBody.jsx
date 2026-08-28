/**
 * QCarBody.jsx — Stable QCar physics via KinematicPositionBased body type.
 *
 * ─── WHY THE PREVIOUS DYNAMIC + REVOLUTE-JOINT APPROACH SPUN ────────────────
 *
 * The 5-body system (1 chassis + 4 wheels connected by RevoluteImpulseJoints)
 * creates a coupled constraint problem that Rapier's iterative solver cannot
 * always converge within a single timestep.  The leftover constraint error
 * manifests as asymmetric correction impulses on the chassis (RL joint is at
 * Z = −0.056, RR is at Z = +0.056 — they never cancel perfectly).  These
 * residual impulses sum to a net yaw torque that compounds every frame.
 * High angularDamping reduces but does NOT eliminate the problem because the
 * torque source is continuous, not a one-time impulse.
 *
 * ─── THE FIX: KinematicPositionBased ────────────────────────────────────────
 *
 * Decision 1 — Use `type="kinematicPosition"` (not "dynamic").
 *   We drive the QCar from /cmd_vel velocity commands, NOT from forces.
 *   A kinematic body lets us set the position/orientation directly each frame.
 *   Result: zero joint constraints → zero constraint oscillation → no spinning.
 *
 * Decision 2 — Eliminate separate wheel rigid bodies.
 *   Wheels are rendered as cosmetic child meshes (visually animated by speed).
 *   No physics bodies → no revolute joints → nothing to oscillate.
 *
 * Decision 3 — Single CuboidCollider, slightly inset from the visual mesh.
 *   Half-extents are 5 mm smaller than the visible box on each axis.
 *   This prevents the collider from "catching" on corners of obstacles when
 *   the visual mesh just barely grazes them.
 *
 * Decision 4 — Apply linX in the car's LOCAL forward direction.
 *   In Three.js (Y-up), with the car facing +X at yaw = 0:
 *     forward = ( cos(yaw),  0, −sin(yaw) )   [derived from Ry(yaw) × [1,0,0]]
 *   We NEVER accumulate raw linX into world-X directly.  Skipping this
 *   transform causes the car to drift in world-X regardless of heading.
 *
 * Decision 5 — angular.z from ROS maps directly to yaw rate around +Y.
 *   Proved in coordUtils.js: both frames use CCW-positive convention from
 *   above.  No sign flip, no axis swap.
 *
 * Decision 6 — Reset (overwrite) position each frame; never accumulate forces.
 *   setNextKinematicTranslation / setNextKinematicRotation replace the target
 *   each frame.  There is no "velocity" to accumulate — the previous target
 *   is discarded.  This is the canonical way to drive a kinematic body.
 *
 * Decision 7 — Clamp delta-time to ≤ 1/20 s.
 *   When the browser tab loses focus and regains it, `delta` can spike to
 *   several seconds, launching the car across the arena.  Clamping to 50 ms
 *   max prevents this without affecting normal 60 Hz operation.
 *
 * Decision 8 — Bounds clamping replaces wall collision for kinematic bodies.
 *   Rapier does NOT apply contact response between a kinematic body and a
 *   fixed (static) body — the kinematic body clips right through.  We prevent
 *   this by clamping the integrated position to stay inside the arena BEFORE
 *   calling setNextKinematicTranslation.  Dynamic obstacles ARE pushed away
 *   by the kinematic car (Rapier does handle kinematic–dynamic contacts).
 *
 * Decision 9 — Real meshes via ColladaLoader (DAE primary, STL fallback).
 *   DAE files include embedded materials from the QCar robot description.
 *   Three.js ColladaLoader auto-applies:
 *     • scene.rotation.x = -π/2  (Z_UP → Y_UP correction)
 *     • scene.scale *= 0.01       (centimetre units → metres)
 *   No additional scaling or axis correction is needed for DAE.
 *   STL fallback: apply scale={0.001} (millimetre → metre) manually.
 *   Per-part fallback instructions are in comments next to each <primitive>.
 *
 * Decision 10 — Chassis mesh rotation Math.PI around Y.
 *   The QCar DAE/STL was exported with the car nose pointing in −X.
 *   (URDF: front axle at x = −0.1425 from base_link.)
 *   We rotate 180° around Y so the nose faces +X (Three.js car forward).
 *   This applies equally to all sub-meshes (wheels, LiDAR, hubs) because
 *   their positions are already expressed in the flipped Three.js frame
 *   (confirmed: front wheel offsets at x = +0.12960).
 *   If any part renders backwards independently, add rotation y=π to that
 *   group while leaving others unchanged.
 *
 * ─── COORDINATE CONVENTIONS ─────────────────────────────────────────────────
 *
 *   Three.js:  Y-up,  car forward = +X,  left = +Z,  yaw CCW from above = +Y
 *   ROS:       Z-up,  car forward = +X,  left = +Y,  yaw CCW from above = +Z
 *
 *   cmd_vel.linear.x  → linX   (m/s,   forward speed, same sign both frames)
 *   cmd_vel.angular.z → angY   (rad/s, yaw rate,      same sign both frames)
 *
 * ─── EXPORTS ─────────────────────────────────────────────────────────────────
 *
 *   <QCarBody rigidBodyRef={ref} cmdRef={ref} [position] [arenaHalf] />
 *   CG_CHASSIS, CG_WHEEL, CG_WORLD   — collision group constants
 */

import { useEffect, useRef, useMemo, Suspense } from 'react';
import { useFrame, useLoader } from '@react-three/fiber';
import * as THREE from 'three';
import { RigidBody, CuboidCollider, ConvexHullCollider, interactionGroups } from '@react-three/rapier';
import { ColladaLoader } from 'three/examples/jsm/loaders/ColladaLoader';
// STL fallback loader — uncomment the import for any part you switch to STL:
// import { STLLoader }        from 'three/examples/jsm/loaders/STLLoader';
import { useOdomPublisher } from '../../hooks/useOdomPublisher';
import { useTfPublisher } from '../../hooks/useTfPublisher';

// ── Collision groups ───────────────────────────────────────────────────────────
// Group 0 = chassis   (collides only with world, group 2)
// Group 1 = wheels    (unused with kinematic approach — kept for SimulationWorld compat)
// Group 2 = world     (collides with chassis and wheels)
export const CG_CHASSIS = interactionGroups([0], [2]);
export const CG_WHEEL = interactionGroups([1], [2]);
export const CG_WORLD = interactionGroups([2], [0, 1]);

// ── QCar geometry constants (from qcar.urdf.xacro) ────────────────────────────
const BODY_HALF_X = 0.2075;   // 5 mm inset from URDF 0.2125 — Decision 3
const BODY_HALF_Y = 0.1;    // 5 mm inset from URDF 0.091
const BODY_HALF_Z = 0.091;    // 5 mm inset from URDF 0.096

const WHEEL_RADIUS = 0.0265;   // tyre radius (m), used for animation only
const WHEEL_HALF_H = 0.015;    // tyre half-width, visual only (30 mm)

const WHEELBASE = 0.265;    // m — distance between front and rear axles
const MAX_STEER = 0.5236;   // rad — maximum steering angle (30°)

// Car centre height above ground = collider half-height (box sitting flat on Y=0).
export const GROUND_Y = BODY_HALF_Y;   // 0.086 m

// The chassis DAE origin is at base_link (wheel-centre height above ground).
// Shift the visual mesh group down so base_link maps to wheel-centre height in world space.
const CHASSIS_Y_OFFSET = -(GROUND_Y);  // ≈ -0.0595 m

// Wheel lateral offset — matches actual QCar track width.
const WHEEL_TRACK_HALF = 0.065; // m, from centreline to wheel centre

// Visual-only wheel offsets from chassis centre (Three.js frame)
// These position the wheel groups relative to the RigidBody origin.
// x > 0 = front,  x < 0 = rear,  z > 0 = left,  z < 0 = right
const WHEEL_OFFSETS = [
  { id: 'fl', x: 0.12960, y: -(GROUND_Y - WHEEL_RADIUS), z: -WHEEL_TRACK_HALF },
  { id: 'fr', x: 0.12960, y: -(GROUND_Y - WHEEL_RADIUS), z: WHEEL_TRACK_HALF },
  { id: 'rl', x: -0.12765, y: -(GROUND_Y - WHEEL_RADIUS), z: -WHEEL_TRACK_HALF },
  { id: 'rr', x: -0.12765, y: -(GROUND_Y - WHEEL_RADIUS), z: WHEEL_TRACK_HALF },
];

// LiDAR dome position (Three.js frame, relative to RigidBody origin)
// From URDF: joint origin xyz="-0.056 0 0.060" (Z-up)
// → After Z_UP correction + π Y flip: x = +0.056, y = 0.060, z = 0
const LIDAR_POS = [-0.0125, 0.060, 0];

// Front steering hub positions.
// Y = wheel-centre height (same as WHEEL_OFFSETS y) so hubs are vertically centred on wheels.
const HUB_Y = -(GROUND_Y - WHEEL_RADIUS);   // ≈ -0.0595 m
const HUB_POS_L = [0.1296, HUB_Y, WHEEL_TRACK_HALF];
const HUB_POS_R = [0.1296, HUB_Y, -WHEEL_TRACK_HALF];

// Max drive parameters (keyboard fallback when /cmd_vel is zero)
const KB_LIN = 1.5;   // m/s
const KB_ANG = 2.0;   // rad/s

// ── Keyboard fallback hook ─────────────────────────────────────────────────────

function useKeyboard() {
  const keys = useRef({ w: false, a: false, s: false, d: false });
  useEffect(() => {
    const dn = (e) => { keys.current[e.key.toLowerCase()] = true; };
    const up = (e) => { keys.current[e.key.toLowerCase()] = false; };
    window.addEventListener('keydown', dn);
    window.addEventListener('keyup', up);
    return () => {
      window.removeEventListener('keydown', dn);
      window.removeEventListener('keyup', up);
    };
  }, []);
  return keys;
}

// ── QCarVisuals — all mesh loading (lives inside <Suspense>) ──────────────────
//
// Loads all 5 DAE files, clones them (required for multiple instances),
// and renders them as <primitive> objects.
//
// Per-part DAE→STL fallback instructions:
//   1. Comment out the ColladaLoader useLoader call for that part.
//   2. Uncomment the matching STLLoader line.
//   3. Swap <primitive> for the commented-out <mesh> in the JSX below.
//   STL uses scale={0.001} (mm→m); DAE handles scale automatically (cm→m).
//
// Props:
//   wheelGroupsRef      — Array(4) of refs for wheel spin groups (.rotation.z = roll).
//   steerGroupsRef      — Array(2) of refs for [leftHub, rightHub] (.rotation.y = steer).
//   frontWheelSteerRefs — Array(2) of refs for front-wheel steer wrappers so the
//                         front wheels angle together with their hubs.

function QCarVisuals({ wheelGroupsRef, steerGroupsRef, frontWheelSteerRefs }) {
  // ── Load all DAE files ────────────────────────────────────────────────────
  // ColladaLoader caches by URL — each call returns the same singleton scene.
  // We MUST clone before rendering (see Decision 9).

  const { scene: chassisScene } = useLoader(ColladaLoader, '/meshes/QCarBody.dae');
  const { scene: wheelScene } = useLoader(ColladaLoader, '/meshes/QCarWheel.dae');
  const { scene: lidarScene } = useLoader(ColladaLoader, '/meshes/QCarLidar.dae');
  const { scene: hubLScene } = useLoader(ColladaLoader, '/meshes/QCarSteeringHubL.dae');
  const { scene: hubRScene } = useLoader(ColladaLoader, '/meshes/QCarSteeringHubR.dae');

  // ── STL fallback loaders (uncomment to swap a specific part) ─────────────
  // const chassisGeo = useLoader(STLLoader, '/meshes/QCarBody.stl');
  // const wheelGeo   = useLoader(STLLoader, '/meshes/QCarWheel.stl');
  // const lidarGeo   = useLoader(STLLoader, '/meshes/QCarLidar.stl');
  // const hubLGeo    = useLoader(STLLoader, '/meshes/QCarSteeringHubL.stl');
  // const hubRGeo    = useLoader(STLLoader, '/meshes/QCarSteeringHubR.stl');

  // ── Clone each scene once per mount ──────────────────────────────────────
  // Wheel scenes: create 4 independent clones in a single useMemo so each
  // wheel group gets its own Three.js object hierarchy.
  const chassis = useMemo(() => {
    const c = chassisScene.clone(true);
    c.traverse(ch => { if (ch.isMesh) ch.castShadow = true; });
    return c;
  }, [chassisScene]);

  const wheelClones = useMemo(
    () => WHEEL_OFFSETS.map(() => {
      const c = wheelScene.clone(true);
      c.traverse(ch => { if (ch.isMesh) ch.castShadow = true; });
      return c;
    }),
    [wheelScene]
  );

  const lidar = useMemo(() => {
    const c = lidarScene.clone(true);
    c.traverse(ch => { if (ch.isMesh) ch.castShadow = true; });
    return c;
  }, [lidarScene]);

  const hubL = useMemo(() => hubLScene.clone(true), [hubLScene]);
  const hubR = useMemo(() => hubRScene.clone(true), [hubRScene]);

  return (
    <>
      {/* ── Chassis ─────────────────────────────────────────────────────────
       *  rotation y=π: flips nose from −X (URDF Z-UP convention) to +X.
       *  If the car renders backwards, change Math.PI to 0.
       *
       *  STL fallback — replace <primitive> line with:
       *    <mesh geometry={chassisGeo} scale={0.001} castShadow>
       *      <meshStandardMaterial color="#cc2200" metalness={0.3} roughness={0.5} />
       *    </mesh>
       */}
      <group position={[0, CHASSIS_Y_OFFSET, 0]} scale={0.1}>
        <primitive object={chassis} />
      </group>

      {/* ── Wheels (4×) ──────────────────────────────────────────────────────
       *  Each wheel group is positioned at WHEEL_OFFSETS[i] relative to the
       *  RigidBody origin.  The inner group receives the spinRef so the parent
       *  useFrame can animate rotation.z (rolling motion).
       *
       *  STL fallback — replace <primitive> with:
       *    <mesh geometry={wheelGeo} scale={0.001} castShadow>
       *      <meshStandardMaterial color="#333333" roughness={0.9} />
       *    </mesh>
       *  Note: STL cylinder may need rotation={[Math.PI/2, 0, 0]} if it
       *  renders standing upright instead of lying flat on the axle.
       */}
      {WHEEL_OFFSETS.map((w, i) => {
        const isFront = i < 2; // i=0 front-right, i=1 front-left
        const isLeft = w.z > 0; // Three.js: left = +Z
        const spinAndMesh = (
          <group ref={el => { wheelGroupsRef.current[i] = el; }}>
            {/* Wheel axle is along Z. Y=π flips rim from +Z to -Z (outward for right side).
                Left wheels need rim facing +Z (outward) so no Y rotation. */}
            <group rotation={isLeft ? [0, 0, 0] : [0, Math.PI, 0]} scale={0.1}>
              <primitive object={wheelClones[i]} />
            </group>
          </group>
        );
        return (
          <group key={w.id} position={[w.x, w.y, w.z]}>
            {isFront ? (
              <group ref={el => { frontWheelSteerRefs.current[i] = el; }}>
                {spinAndMesh}
              </group>
            ) : spinAndMesh}
          </group>
        );
      })}

      {/* ── LiDAR dome ───────────────────────────────────────────────────────
       *  Positioned above the chassis near the front (from URDF joint origin).
       *  rotation y=π matches chassis orientation.
       *
       *  STL fallback — replace <primitive> with:
       *    <mesh geometry={lidarGeo} scale={0.001} castShadow>
       *      <meshStandardMaterial color="#1155cc" metalness={0.4} />
       *    </mesh>
       */}
      <group position={LIDAR_POS} rotation={[0, 0, 0]} scale={0.1}>
        <primitive object={lidar} />
      </group>

      {/* ── Front steering hubs ──────────────────────────────────────────────
       *  Positioned at the front axle ends.  steerGroupsRef elements receive
       *  rotation.y from the parent useFrame for Ackermann steering animation.
       *
       *  If hub L/R appear on the wrong sides, swap HUB_POS_L and HUB_POS_R.
       *
       *  STL fallback — replace each <primitive> with:
       *    <mesh geometry={hubLGeo} scale={0.001} castShadow>
       *      <meshStandardMaterial color="#ff8800" />
       *    </mesh>
       */}
      {/* Ry(-π/2) turns the hub cylinder from pointing along X to pointing along +Z/-Z,
          so it faces outward toward each wheel rim.
          If one hub still faces the wrong way, swap its sign to +Math.PI/2. */}
      <group
        ref={el => { steerGroupsRef.current[0] = el; }}
        position={HUB_POS_L}
        rotation={[Math.PI, -Math.PI / 2, Math.PI]}
        scale={0.1}
      >
        <primitive object={hubL} />
      </group>
      <group
        ref={el => { steerGroupsRef.current[1] = el; }}
        position={HUB_POS_R}
        rotation={[Math.PI, Math.PI / 2, -Math.PI]}
        scale={0.1}
      >
        <primitive object={hubR} />
      </group>
    </>
  );
}

// ── Mesh-based convex-hull collider ───────────────────────────────────────────
// Loads QCarBody.dae, extracts all vertices, applies the same transform as the
// visual chassis group (CHASSIS_Y_OFFSET + scale 0.1), and passes them to Rapier's
// ConvexHullCollider so the physics shape matches the real body mesh.
// Falls back to CuboidCollider until the DAE finishes loading (Suspense).

function QCarMeshCollider({ showCollider }) {
  const { scene: chassisScene } = useLoader(ColladaLoader, '/meshes/QCarBody.dae');

  const hullPositions = useMemo(() => {
    chassisScene.updateWorldMatrix(true, true);
    // Mirror the visual group transform: T(CHASSIS_Y_OFFSET) × S(0.1)
    const extraMat = new THREE.Matrix4()
      .makeTranslation(0, CHASSIS_Y_OFFSET, 0)
      .multiply(new THREE.Matrix4().makeScale(0.1, 0.1, 0.1));
    const verts = [];
    const v = new THREE.Vector3();
    chassisScene.traverse(child => {
      if (!child.isMesh || !child.geometry?.attributes?.position) return;
      child.updateWorldMatrix(true, false);
      const combined = new THREE.Matrix4().multiplyMatrices(extraMat, child.matrixWorld);
      const pos = child.geometry.attributes.position;
      for (let j = 0; j < pos.count; j++) {
        v.fromBufferAttribute(pos, j).applyMatrix4(combined);
        verts.push(v.x, v.y, v.z);
      }
    });
    return new Float32Array(verts);
  }, [chassisScene]);

  const debugScene = useMemo(() => {
    const clone = chassisScene.clone(true);
    clone.traverse(ch => {
      if (ch.isMesh) ch.material = new THREE.MeshStandardMaterial({ color: '#00ff88', wireframe: true });
    });
    return clone;
  }, [chassisScene]);

  return (
    <>
      <ConvexHullCollider args={[hullPositions]} collisionGroups={CG_CHASSIS} />
      {showCollider && (
        <group position={[0, CHASSIS_Y_OFFSET, 0]} scale={0.1}>
          <primitive object={debugScene} />
        </group>
      )}
    </>
  );
}

// ── Box placeholder shown while meshes are loading ────────────────────────────
// Renders a simple blue box + orange roof stripe so the car is visible
// immediately even before the DAE files finish loading.

function LoadingPlaceholder() {
  return (
    <>
      <mesh castShadow>
        <boxGeometry args={[BODY_HALF_X * 2, BODY_HALF_Y * 2, BODY_HALF_Z * 2]} />
        <meshStandardMaterial color="#1a6bbd" metalness={0.35} roughness={0.55} wireframe />
      </mesh>
      <mesh position={[0.05, BODY_HALF_Y + 0.002, 0]}>
        <boxGeometry args={[BODY_HALF_X * 0.6, 0.005, BODY_HALF_Z * 0.7]} />
        <meshStandardMaterial color="#ff6600" />
      </mesh>
    </>
  );
}

// ── Main component ─────────────────────────────────────────────────────────────

/**
 * QCarBody
 *
 * @param {React.MutableRefObject}              rigidBodyRef
 *   Ref that will be populated with the Rapier RigidBody handle.
 *   Pass to useLidarSim, etc., so sensors can read pose each frame.
 *
 * @param {React.MutableRefObject<{linX,angY}>} cmdRef
 *   From useCmdVelSubscriber().  Values are in Three.js convention:
 *   linX (m/s, forward +) and angY (rad/s, left/CCW +).
 *
 * @param {[x, y, z]} [position=[0, GROUND_Y, 0]]
 *   World-space spawn position.  Y is overridden to GROUND_Y regardless.
 *
 * @param {number} [arenaHalf=4.7]
 *   Half-side of the square arena (m).  Car centre is clamped to ±arenaHalf
 *   to prevent kinematic clipping through perimeter walls.  Set to Infinity
 *   to disable (e.g., if you use a different wall-collision strategy).
 *
 * @param {boolean} [showCollider=false]
 *   When true, renders a semi-transparent green wireframe box that exactly
 *   matches the CuboidCollider extents.  Useful for debugging physics alignment.
 *
 * @param {number} [maxSpeed=1.5]
 *   Maximum keyboard drive speed (m/s).  /cmd_vel from ROS ignores this cap.
 *
 * @param {number} [maxTurn=2.0]
 *   Maximum keyboard turn rate (rad/s).  /cmd_vel from ROS ignores this cap.
 */
export function QCarBody({
  rigidBodyRef,
  cmdRef,
  namespace = '',
  position = [0, GROUND_Y, 0],
  yaw = 0,
  arenaHalf = 4.7,
  showCollider = false,
  maxSpeed = KB_LIN,
  maxTurn = MAX_STEER,   // max steering angle (rad) — capped at physical MAX_STEER
}) {
  // ── Integration state (plain refs — no React state to avoid re-renders) ──
  const yawRef = useRef(yaw);
  const posRef = useRef({ x: position[0], y: GROUND_Y, z: position[2] });

  // Cosmetic wheel spin angle (radians, accumulated)
  const wheelAngleRef = useRef(0);

  // Refs to the four wheel spin groups (set by QCarVisuals callback refs)
  // wheelGroupsRef.current[i] is null until QCarVisuals mounts (after load)
  const wheelGroupsRef = useRef([null, null, null, null]);

  // Refs to the two front steering hub groups (set by QCarVisuals callback refs)
  const steerGroupsRef = useRef([null, null]);

  // Refs to steer wrappers around each front wheel (i=0 right, i=1 left)
  const frontWheelSteerRefs = useRef([null, null]);

  // Keyboard input (overridden by cmdRef when non-zero)
  const keysRef = useKeyboard();

  // ── Physics integration loop ─────────────────────────────────────────────
  useFrame((_, delta) => {
    if (!rigidBodyRef.current) return;

    // Decision 7 — clamp delta so a tab-focus spike doesn't teleport the car
    const dt = Math.min(delta, 1 / 20);

    // ── 1. Resolve input source ───────────────────────────────────────────
    // /cmd_vel takes priority over keyboard when either component is non-zero.
    let linX, angY, visualSteer;
    if (cmdRef.current.linX !== 0 || cmdRef.current.angY !== 0) {
      // ROS autonomous / teleoperation command — use directly.
      linX = cmdRef.current.linX;
      angY = cmdRef.current.angY;
      // Derive visual steer from speed and angular rate.
      const spd = Math.max(Math.abs(linX), 0.05);
      visualSteer = Math.atan2(angY * WHEELBASE, spd);
    } else {
      // Keyboard — Ackermann model: A/D set a steering angle; yaw rate is
      // v × tan(δ) / L.  When stationary the car does NOT spin, but the wheels
      // still animate so the driver gets visual feedback.
      linX = keysRef.current.w ? maxSpeed : keysRef.current.s ? -maxSpeed : 0;
      const steerCap = Math.min(Math.abs(maxTurn), MAX_STEER);
      visualSteer = keysRef.current.a ? steerCap
        : keysRef.current.d ? -steerCap : 0;
      angY = linX !== 0 ? (linX * Math.tan(visualSteer)) / WHEELBASE : 0;
    }

    // ── 2. Integrate yaw ─────────────────────────────────────────────────
    // Decision 5 — angular.z maps directly to yaw rate around +Y.
    // angY is already in Three.js convention (CCW from above = positive).
    yawRef.current += angY * dt;

    // ── 3. Integrate position in local forward direction ──────────────────
    // Decision 4 — transform linX by the car's current heading BEFORE applying
    // to world position.  This is "apply velocity in local space."
    //
    // In Three.js Y-up, car forward = +X at yaw=0.
    // Ry(yaw) applied to [1,0,0] gives: ( cos(yaw), 0, −sin(yaw) )
    //
    //   new_x = x + linX × cos(yaw) × dt
    //   new_z = z + linX × (−sin(yaw)) × dt   ← note the minus sign
    //
    // Without this transform, linX would always push the car along WORLD +X
    // regardless of where it's pointing — a common and confusing bug.
    const cosY = Math.cos(yawRef.current);
    const sinY = Math.sin(yawRef.current);

    posRef.current.x += linX * cosY * dt;
    posRef.current.z -= linX * sinY * dt;  // −sin because forward-Z = −sin(yaw)
    posRef.current.y = GROUND_Y;          // pin to ground — no vertical drift

    // ── 4. Bounds clamping (Decision 8) ──────────────────────────────────
    // Kinematic bodies pass through static colliders.  Clamp the integrated
    // position to the arena boundary instead.  The car's half-extent on X is
    // BODY_HALF_X; on Z is BODY_HALF_Z — subtract them from the arena limit
    // so the EDGE of the car stops at the wall, not the centre.
    posRef.current.x = Math.max(
      -(arenaHalf - BODY_HALF_X),
      Math.min(arenaHalf - BODY_HALF_X, posRef.current.x)
    );
    posRef.current.z = Math.max(
      -(arenaHalf - BODY_HALF_Z),
      Math.min(arenaHalf - BODY_HALF_Z, posRef.current.z)
    );

    // ── 5. Push kinematic targets to Rapier (Decision 6) ─────────────────
    // setNextKinematic* REPLACES the target each frame — no accumulation.
    // Rapier moves the body to exactly this position on the next physics step.
    //
    // Guard: React 18 StrictMode unmounts/remounts effects during panel
    // interactions, causing world.removeRigidBody() to zero out the raw
    // Rapier ptr BEFORE the ref is cleared.  Catch the resulting WASM panic
    // and bail — the next frame will have a fresh, valid body.
    const halfYaw = yawRef.current / 2;
    try {
      rigidBodyRef.current.setNextKinematicTranslation(posRef.current);
      rigidBodyRef.current.setNextKinematicRotation({
        x: 0,
        y: Math.sin(halfYaw),
        z: 0,
        w: Math.cos(halfYaw),
      });
    } catch {
      return;
    }

    // ── 6. Animate cosmetic wheels ────────────────────────────────────────
    // Angular velocity = linear speed / wheel radius.
    // Wheel mesh rotation.z drives the spin.
    wheelAngleRef.current += (linX / WHEEL_RADIUS) * dt;
    for (const g of wheelGroupsRef.current) {
      if (g) g.rotation.z = -wheelAngleRef.current;  // − = roll forward
    }

    // ── 7. Animate cosmetic steering hubs ────────────────────────────────
    // For keyboard: visualSteer is the raw A/D angle — shown even when stationary.
    // For ROS: visualSteer was derived from angY and speed in step 1.
    const clampedSteer = Math.max(-MAX_STEER, Math.min(MAX_STEER, visualSteer));
    for (const g of steerGroupsRef.current) {
      if (g) g.rotation.y = clampedSteer;
    }
    for (const g of frontWheelSteerRefs.current) {
      if (g) g.rotation.y = clampedSteer;
    }
  });

  // ── ROS publishers (run inside Canvas via their own useFrame loops) ──────
  useOdomPublisher(rigidBodyRef, 20, namespace);
  useTfPublisher(rigidBodyRef, 20, namespace);

  // ── JSX ──────────────────────────────────────────────────────────────────
  return (
    // Decision 1 — kinematicPosition: we control the transform; Rapier only
    // handles collision detection and contact events (no force integration).
    <RigidBody
      ref={rigidBodyRef}
      type="kinematicPosition"
      position={[posRef.current.x, GROUND_Y, posRef.current.z]}
      collisionGroups={CG_CHASSIS}
    >
      {/* Mesh-based convex hull — falls back to box until the DAE is loaded. */}
      <Suspense fallback={
        <CuboidCollider args={[BODY_HALF_X, BODY_HALF_Y, BODY_HALF_Z]} collisionGroups={CG_CHASSIS} />
      }>
        <QCarMeshCollider showCollider={showCollider} />
      </Suspense>

      {/*
       * Decision 9 — Mesh loading is suspended so the RigidBody and its
       * collider are always present in the physics world, even while assets
       * are streaming.  The car is physically active (responds to cmd_vel,
       * publishes odom/tf, is hit-tested by LiDAR) from frame 0.
       * Visuals appear as a wireframe box until all 5 DAE files finish loading,
       * then QCarVisuals replaces the placeholder automatically.
       */}
      <Suspense fallback={<LoadingPlaceholder />}>
        <QCarVisuals
          wheelGroupsRef={wheelGroupsRef}
          steerGroupsRef={steerGroupsRef}
          frontWheelSteerRefs={frontWheelSteerRefs}
        />
      </Suspense>
    </RigidBody>
  );
}
