// src/components/sim/FrontCamera.jsx
//
// Generic off-screen camera sensor for the QCar simulation.
// Renders the scene from a car-relative viewpoint, JPEG-encodes the frame,
// and publishes sensor_msgs/CompressedImage to a ROS topic.
//
// Coordinate convention: Three.js Y-up, car forward=+X, left=+Z.
// camOffset is in car-local frame (URDF: Three.js x=x, y=z_urdf, z=y_urdf).
// facingYaw is relative to the car's forward direction (radians).
//
// Must be inside <Canvas> so useThree() / useFrame() work.

import { useEffect, useRef, useContext } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { ROSContext } from './ROSContext';

// ── Constants ───────────────────────────────────────────────────────────────

const CAM_W              = 320;
const CAM_H              = 240;
const DEFAULT_PUBLISH_EVERY = 12;  // frames ≈ 5 Hz @ 60 fps
const JPEG_QUALITY       = 0.75;
const CAM_FOV            = 70;     // degrees (QCar datasheet)

// Default = front CSI camera (URDF xyz="0.19236 -0.000475 0.093029")
const DEFAULT_OFFSET = new THREE.Vector3(0.19236, 0.093029, -0.000475);

// ── Component ───────────────────────────────────────────────────────────────

export default function FrontCamera({
  carRef,
  onFrame,
  namespace = '',
  // Camera placement (car-local frame)
  camOffset = DEFAULT_OFFSET,
  facingYaw   = 0,   // radians: pan left/right (Y-axis)
  facingPitch = 0,   // radians: tilt up/down  (X-axis, applied in camera-local space)
  facingRoll  = 0,   // radians: twist/roll    (Z-axis, applied in camera-local space)
  // ROS topic config
  topicPath = 'camera/image/compressed',
  frameId = 'front_camera',
  publishEvery = DEFAULT_PUBLISH_EVERY,
  publishPhase = 0,   // frame offset so sibling cameras don't all encode on the same frame
}) {
  const { gl, scene } = useThree();
  const { advertise, connected } = useContext(ROSContext);

  const fullTopic = namespace ? `${namespace}/${topicPath}` : `/${topicPath}`;

  const topicRef   = useRef(null);
  const frameCount = useRef(0);
  const targetRef  = useRef(null);
  const camRef     = useRef(null);
  const canvasRef  = useRef(null);
  const ctxRef     = useRef(null);
  const pixBufRef  = useRef(null);
  const hzCountRef = useRef(0);
  const hzTimeRef  = useRef(performance.now());

  const _quat  = useRef(new THREE.Quaternion());
  const _euler = useRef(new THREE.Euler());
  const _pos   = useRef(new THREE.Vector3());
  const _lookAt = useRef(new THREE.Vector3());

  // ── Setup render target + off-screen camera ─────────────────────────────
  useEffect(() => {
    const target = new THREE.WebGLRenderTarget(CAM_W, CAM_H, {
      minFilter: THREE.LinearFilter,
      magFilter: THREE.LinearFilter,
      format:    THREE.RGBAFormat,
      type:      THREE.UnsignedByteType,
    });

    const cam = new THREE.PerspectiveCamera(CAM_FOV, CAM_W / CAM_H, 0.05, 100);

    const canvas = document.createElement('canvas');
    canvas.width  = CAM_W;
    canvas.height = CAM_H;
    const ctx = canvas.getContext('2d');

    targetRef.current  = target;
    camRef.current     = cam;
    canvasRef.current  = canvas;
    ctxRef.current     = ctx;
    pixBufRef.current  = new Uint8Array(CAM_W * CAM_H * 4);

    return () => {
      target.dispose();
      targetRef.current = null;
    };
  }, []);

  // ── Advertise ROS topic ─────────────────────────────────────────────────
  useEffect(() => {
    if (!connected) return;
    const t = advertise(fullTopic, 'sensor_msgs/CompressedImage', { queue_size: 1 });
    topicRef.current = t;
    return () => {
      t.unadvertise();
      topicRef.current = null;
    };
  }, [connected, advertise, fullTopic]);

  // ── Per-frame render ────────────────────────────────────────────────────
  useFrame(() => {
    if (!carRef?.current || !targetRef.current || !camRef.current) return;

    frameCount.current += 1;
    if ((frameCount.current + publishPhase) % publishEvery !== 0) return;

    // Guard against unmount-race reads on a disposed Rapier body.
    let trans, rot;
    try {
      trans = carRef.current.translation();
      rot   = carRef.current.rotation();
    } catch {
      return;
    }

    _quat.current.set(rot.x, rot.y, rot.z, rot.w);
    _euler.current.setFromQuaternion(_quat.current, 'YXZ');
    const carYaw = -_euler.current.y;

    // Rotate offset from car-local to world frame (XZ plane)
    const cosY = Math.cos(carYaw);
    const sinY = Math.sin(carYaw);
    const cx = trans.x + camOffset.x * cosY - camOffset.z * sinY;
    const cy = trans.y + camOffset.y;
    const cz = trans.z + camOffset.x * sinY + camOffset.z * cosY;

    camRef.current.position.set(cx, cy, cz);

    // Look in the camera's facing direction (car yaw + relative offset)
    const totalYaw = carYaw + facingYaw;
    _lookAt.current.set(
      cx + Math.cos(totalYaw),
      cy,
      cz + Math.sin(totalYaw)
    );
    camRef.current.lookAt(_lookAt.current);

    // Apply pitch (tilt up/down) and roll (twist) in camera-local space
    if (facingPitch !== 0) camRef.current.rotateX(facingPitch);
    if (facingRoll  !== 0) camRef.current.rotateZ(facingRoll);

    camRef.current.updateMatrixWorld();

    // Render to off-screen target
    gl.setRenderTarget(targetRef.current);
    gl.render(scene, camRef.current);
    gl.setRenderTarget(null);

    // Read pixels (WebGL: bottom-up) → flip vertically
    gl.readRenderTargetPixels(targetRef.current, 0, 0, CAM_W, CAM_H, pixBufRef.current);
    const imgData = ctxRef.current.createImageData(CAM_W, CAM_H);
    for (let row = 0; row < CAM_H; row++) {
      const srcRow = CAM_H - 1 - row;
      imgData.data.set(
        pixBufRef.current.subarray(srcRow * CAM_W * 4, (srcRow + 1) * CAM_W * 4),
        row * CAM_W * 4
      );
    }
    ctxRef.current.putImageData(imgData, 0, 0);

    // Encode JPEG and publish
    const dataUrl = canvasRef.current.toDataURL('image/jpeg', JPEG_QUALITY);
    const base64  = dataUrl.split(',')[1];

    if (topicRef.current) {
      const nowMs = performance.now();
      const sec   = Math.floor(nowMs / 1000);
      const nsec  = Math.round((nowMs % 1000) * 1e6);

      topicRef.current.publish({
        header: { stamp: { sec, nanosec: nsec }, frame_id: frameId },
        format: 'jpeg',
        data:   base64,
      });

      hzCountRef.current += 1;
      const elapsed = nowMs - hzTimeRef.current;
      let hz = null;
      if (elapsed >= 1000) {
        hz = (hzCountRef.current / elapsed) * 1000;
        hzCountRef.current = 0;
        hzTimeRef.current  = nowMs;
      }
      onFrame?.(dataUrl, hz);
    }
  });

  return null;
}
