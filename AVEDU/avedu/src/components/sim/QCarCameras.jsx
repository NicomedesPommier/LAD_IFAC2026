// src/components/sim/QCarCameras.jsx
//
// Renders all 5 QCar cameras inside the R3F Canvas.
// Positions from qcar_ros2.urdf.xacro, converted to Three.js (Y-up):
//   Three.js x = URDF x, Three.js y = URDF z, Three.js z = URDF y
//
// onFrames(camId, dataUrl, hz) is called whenever a new frame is ready.

import * as THREE from 'three';
import FrontCamera from './FrontCamera';

// Coordinate mapping from URDF (Z-up, +x forward) to Three.js (Y-up):
//   Three.js x = −URDF_x   ← sign flip; the QCar mesh faces −X in Three.js
//   Three.js y =  URDF_z
//   Three.js z =  URDF_y
// Only positions are corrected — facing directions (facingYaw) match the URDF yaw values as-is.

export const CAMS = [
  {
    id:           'front',
    camOffset:    new THREE.Vector3(0.180,  0.0, -0.0),
    facingYaw:    0,
    facingPitch:  0,
    facingRoll:   0,
    topicPath:    'camera/csi_front/image/compressed',
    frameId:      'camera_csi_front',
    publishEvery: 12,
  },
  {
    id:           'right',
    camOffset:    new THREE.Vector3(0.015,  0.0, -0.06),
    facingYaw:    -Math.PI / 2,
    facingPitch:  0,
    facingRoll:   0,
    topicPath:    'camera/csi_right/image/compressed',
    frameId:      'camera_csi_right',
    publishEvery: 18,
  },
  {
    id:           'back',
    camOffset:    new THREE.Vector3(-0.16669,   0.0, 0.0),
    facingYaw:    -Math.PI,
    facingPitch:  0,
    facingRoll:   0,
    topicPath:    'camera/csi_back/image/compressed',
    frameId:      'camera_csi_back',
    publishEvery: 18,
  },
  {
    id:           'left',
    camOffset:    new THREE.Vector3(0.01,  0.0,  0.065),
    facingYaw:    Math.PI / 2,
    facingPitch:  0,
    facingRoll:   0,
    topicPath:    'camera/csi_left/image/compressed',
    frameId:      'camera_csi_left',
    publishEvery: 18,
  },
  {
    id:           'rgb',
    camOffset:    new THREE.Vector3(0.081686, 0.06,   0.0),
    facingYaw:    0,
    facingPitch:  0,
    facingRoll:   0,
    topicPath:    'camera/rgb/image/compressed',
    frameId:      'camera_rgb',
    publishEvery: 12,
  },
];

export const CAM_IDS = CAMS.map(c => c.id);
export const CAM_LABELS = { front: 'Front', right: 'Right', back: 'Back', left: 'Left', rgb: 'RGB' };

export default function QCarCameras({ carRef, onFrames, namespace = '' }) {
  return (
    <>
      {CAMS.map((cam, idx) => (
        <FrontCamera
          key={cam.id}
          carRef={carRef}
          namespace={namespace}
          camOffset={cam.camOffset}
          facingYaw={cam.facingYaw}
          facingPitch={cam.facingPitch}
          facingRoll={cam.facingRoll}
          topicPath={cam.topicPath}
          frameId={cam.frameId}
          publishEvery={cam.publishEvery}
          publishPhase={idx}   // stagger encodes so the 5 cameras don't JPEG on the same frame
          onFrame={(url, hz) => onFrames?.(cam.id, url, hz)}
        />
      ))}
    </>
  );
}
