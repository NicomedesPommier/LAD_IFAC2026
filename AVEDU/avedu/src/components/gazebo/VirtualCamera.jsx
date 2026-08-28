// src/components/gazebo/VirtualCamera.jsx
import React, { useRef, useEffect, useMemo } from 'react';
import { useFrame, useThree, createPortal } from '@react-three/fiber';
import { PerspectiveCamera, useFBO } from '@react-three/drei';
import * as THREE from 'three';

/**
 * VirtualCamera - Renders what a robot camera sees to a texture
 *
 * This component creates a virtual camera attached to the robot that
 * renders its view to a texture which can be displayed on a canvas
 */
export default function VirtualCamera({
  cameraName,
  robotPosition,
  robotOrientation,
  onFrameRendered,
  width = 640,
  height = 480,
  fov = 75
}) {
  const { scene, gl } = useThree();
  const cameraRef = useRef();
  const virtualSceneRef = useRef();

  // Create a render target (frame buffer object) for off-screen rendering
  const renderTarget = useFBO(width, height, {
    minFilter: THREE.LinearFilter,
    magFilter: THREE.LinearFilter,
    format: THREE.RGBAFormat,
    type: THREE.UnsignedByteType,
  });

  // Camera offset configurations relative to robot base
  // These match the URDF camera joint positions
  const cameraConfig = useMemo(() => {
    const configs = {
      rgb: {
        position: [0.081686, 0.031547, 0.15445],
        rotation: [0, 0, 0],
        fov: 75
      },
      front: {
        position: [0.19236, -0.000475, 0.093029],
        rotation: [0, 0, 0],
        fov: 90
      },
      right: {
        position: [0.12887, -0.06755, 0.093029],
        rotation: [0, 0, -Math.PI / 2],
        fov: 90
      },
      back: {
        position: [-0.16669, -0.000578, 0.093029],
        rotation: [0, 0, Math.PI],
        fov: 90
      },
      left: {
        position: [0.12784, 0.052497, 0.093029],
        rotation: [0, 0, Math.PI / 2],
        fov: 90
      },
    };
    return configs[cameraName] || configs.rgb;
  }, [cameraName]);

  // Update camera position and render to texture every frame
  useFrame(() => {
    if (!cameraRef.current || !robotPosition || !robotOrientation) return;

    // Convert robot yaw from degrees to radians
    const yawRad = (robotOrientation.yaw * Math.PI) / 180;
    const pitchRad = (robotOrientation.pitch * Math.PI) / 180;
    const rollRad = (robotOrientation.roll * Math.PI) / 180;

    // Calculate camera world position using robot position and orientation
    const offset = cameraConfig.position;
    const cos = Math.cos(yawRad);
    const sin = Math.sin(yawRad);

    // Transform camera offset by robot rotation
    const worldX = robotPosition.x + offset[0] * cos - offset[1] * sin;
    const worldY = robotPosition.y + offset[0] * sin + offset[1] * cos;
    const worldZ = robotPosition.z + offset[2];

    cameraRef.current.position.set(worldX, worldY, worldZ);

    // Set camera orientation (robot orientation + camera offset)
    const camYaw = yawRad + cameraConfig.rotation[2];
    cameraRef.current.rotation.set(pitchRad, 0, 0);
    cameraRef.current.rotateOnAxis(new THREE.Vector3(0, 0, 1), camYaw);

    // Render scene from this camera's perspective to the render target
    const currentRenderTarget = gl.getRenderTarget();
    gl.setRenderTarget(renderTarget);
    gl.render(scene, cameraRef.current);
    gl.setRenderTarget(currentRenderTarget);

    // Notify parent component with the rendered texture
    if (onFrameRendered) {
      onFrameRendered(renderTarget.texture, cameraName);
    }
  });

  return (
    <perspectiveCamera
      ref={cameraRef}
      fov={cameraConfig.fov}
      aspect={width / height}
      near={0.01}
      far={100}
    />
  );
}

/**
 * CameraDisplay - Displays a camera feed from a render target texture
 */
export function CameraDisplay({ texture, cameraName, width = 320, height = 240 }) {
  const canvasRef = useRef();

  useEffect(() => {
    if (!canvasRef.current || !texture) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });

    // Read pixels from WebGL texture
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = texture.image?.width || 640;
    tempCanvas.height = texture.image?.height || 480;
    const tempCtx = tempCanvas.getContext('2d');

    // We need to extract the pixel data from the WebGL texture
    // This is a simplified visualization - actual pixel reading would need WebGL context
    if (texture.image) {
      try {
        tempCtx.drawImage(texture.image, 0, 0);
        ctx.drawImage(tempCanvas, 0, 0, canvas.width, canvas.height);
      } catch (e) {
        // Fallback: show camera name
        ctx.fillStyle = '#1a1a1a';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = '#7df9ff';
        ctx.font = 'bold 16px monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(`${cameraName.toUpperCase()}`, canvas.width / 2, canvas.height / 2 - 10);
        ctx.font = '12px monospace';
        ctx.fillStyle = '#888';
        ctx.fillText('Camera View', canvas.width / 2, canvas.height / 2 + 10);
      }
    }
  }, [texture, cameraName]);

  return (
    <canvas
      ref={canvasRef}
      width={width}
      height={height}
      style={{
        width: '100%',
        height: 'auto',
        display: 'block',
        background: '#000',
        imageRendering: 'crisp-edges'
      }}
    />
  );
}
