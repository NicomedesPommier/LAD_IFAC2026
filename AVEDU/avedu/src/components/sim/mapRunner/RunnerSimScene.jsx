// RunnerSimScene — the R3F scene graph for the Map Runner: floor/road meshes,
// physics world, the QCar, its sensors (LIDAR, cameras), and path visualizers.
//
// Pure Three.js / react-three-fiber — no DOM styling lives here.

import React, { Suspense } from 'react';
import { OrbitControls, Grid, useTexture } from '@react-three/drei';
import { Physics, RigidBody, CuboidCollider } from '@react-three/rapier';

import { ASSET_REGISTRY } from '../assets/AssetLibrary';
import RoadMesh from '../RoadMesh';
import { RoadFeatures } from '../RoadFeatures';
import { findIntersections } from '../roadGeometry';
import RoadView from '../road/RoadView';
import OdomPathPublisher from '../OdomPathPublisher';
import PlannedPathViz from '../PlannedPathViz';
import LidarSensor from '../LidarSensor';
import QCarCameras from '../QCarCameras';
import { QCarBody, CG_WORLD, GROUND_Y } from '../../simulator/QCarBody';
import { useCmdVelSubscriber } from '../../../hooks/useCmdVelSubscriber';

// ── Floor image texture ──────────────────────────────────────────────────────────

function FloorImageMesh({ imageUrl, width = 20, height = 20 }) {
  const texture = useTexture(imageUrl);
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.001, 0]} receiveShadow>
      <planeGeometry args={[width, height]} />
      <meshStandardMaterial map={texture} />
    </mesh>
  );
}

// ── Map colliders ────────────────────────────────────────────────────────────────

function GeneratedMapColliders({ assets }) {
  return (
    <>
      {assets.map((item, i) => {
        const AssetInfo = ASSET_REGISTRY[item.type];
        if (!AssetInfo) return null;
        const Cmp = AssetInfo.component;
        const pos = item.position || [0, 0, 0];
        const rot = item.rotation || [0, 0, 0];
        const sc  = item.scale    || [1, 1, 1];
        return AssetInfo.type === 'obstacle'
          ? <RigidBody key={i} type="fixed" position={pos} rotation={rot} collisionGroups={CG_WORLD}><Cmp scale={sc} /></RigidBody>
          : <Cmp key={i} position={pos} rotation={rot} scale={sc} />;
      })}
    </>
  );
}

function Ground() {
  return (
    <RigidBody type="fixed" restitution={0.1} friction={0.8}>
      <CuboidCollider args={[50, 0.05, 50]} position={[0, -0.05, 0]} collisionGroups={CG_WORLD} />
      <mesh receiveShadow rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[100, 100]} />
        <meshStandardMaterial color="#333333" transparent opacity={0.1} />
      </mesh>
    </RigidBody>
  );
}

export default function RunnerSimScene({ mapData, carRef, onScan, onFrames, resetKey, namespace }) {
  const cmdRef = useCmdVelSubscriber(namespace);
  const imgW      = mapData?.imageSize?.width  ?? 20;
  const imgH      = mapData?.imageSize?.height ?? 20;
  const arenaHalf = Math.max(imgW, imgH) / 2 + 2;
  const spawnPos  = mapData?.spawnPoint
    ? [mapData.spawnPoint.x, GROUND_Y, mapData.spawnPoint.z]
    : [0, GROUND_Y, 0];
  const spawnYaw  = mapData?.spawnPoint?.yaw ?? 0;
  return (
    <>
      <ambientLight intensity={0.5} />
      <directionalLight position={[6, 12, 6]} intensity={1.2} castShadow
        shadow-mapSize-width={1024} shadow-mapSize-height={1024} />
      <Grid args={[40, 40]} position={[0, 0.002, 0]} cellColor="#555" />
      {mapData?.imageData && (
        <Suspense fallback={null}>
          <FloorImageMesh imageUrl={mapData.imageData} width={imgW} height={imgH} />
        </Suspense>
      )}
      {/* New PathPhalt-style road model (Road Designer) */}
      {mapData?.roadModel && (
        <Suspense fallback={null}>
          <RoadView model={mapData.roadModel} />
        </Suspense>
      )}
      {/* Legacy roads from the old Map Creator (backward compatible) */}
      {(mapData?.roads || []).map((road) => (
        <RoadMesh key={road.id} road={road} />
      ))}
      <RoadFeatures
        intersections={findIntersections(mapData?.roads || [])}
        features={mapData?.roadFeatures || []}
      />
      <Physics key={resetKey} gravity={[0, -9.81, 0]}>
        <Ground />
        {mapData && <GeneratedMapColliders assets={mapData.assets || []} />}
        <QCarBody rigidBodyRef={carRef} cmdRef={cmdRef} namespace={namespace}
          position={spawnPos} yaw={spawnYaw} arenaHalf={arenaHalf} />
        <LidarSensor carRef={carRef} onScan={onScan} namespace={namespace} />
        <OdomPathPublisher carRef={carRef} namespace={namespace} waypoints={mapData?.waypoints || []} />
      </Physics>
      {(mapData?.waypoints || []).map((w, i) => (
        <mesh key={i} position={[w.x, GROUND_Y + 0.05, w.z]}>
          <sphereGeometry args={[0.06, 12, 12]} />
          <meshStandardMaterial color="#22d3ee" emissive="#0891b2" emissiveIntensity={0.6} />
        </mesh>
      ))}
      {/* Live path the follower is tracking (orange line) — debug visualizer */}
      <PlannedPathViz namespace={namespace} />
      <QCarCameras carRef={carRef} onFrames={onFrames} namespace={namespace} />
      <OrbitControls makeDefault enableDamping minDistance={0.3} maxDistance={50} target={[0, 0.1, 0]} />
    </>
  );
}
