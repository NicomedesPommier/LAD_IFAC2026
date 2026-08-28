// =============================================================
// FILE: src/components/sim/RoadMesh.jsx
// Renders one freeform road from its control points. Shared by MapCreator
// (live editing preview) and MapRunner (the running simulation). Roads are
// purely visual + drivable — the QCar drives over them like the floor image.
// =============================================================
import React, { useMemo } from 'react';
import { Line } from '@react-three/drei';
import { buildRoadGeometry, buildCenterLinePoints, buildEdgePoints, DEFAULT_ROAD_WIDTH } from './roadGeometry';

const ROAD_COLORS = {
  asphalt: '#2b2b2b',
  light:   '#444444',
  dirt:    '#6b5533',
};

export default function RoadMesh({
  road,
  selected = false,
  showMarkings = true,
}) {
  const { points = [], width = DEFAULT_ROAD_WIDTH, type = 'asphalt', curved = true } = road || {};

  const geom = useMemo(
    () => buildRoadGeometry(points, width, curved),
    [points, width, curved]
  );

  const edges = useMemo(
    () => (showMarkings ? buildEdgePoints(points, width, curved) : { left: [], right: [] }),
    [points, width, curved, showMarkings]
  );

  const centerPts = useMemo(
    () => (showMarkings ? buildCenterLinePoints(points, curved) : []),
    [points, curved, showMarkings]
  );

  if (!geom) return null;

  return (
    <group>
      {/* Asphalt surface */}
      <mesh geometry={geom} receiveShadow>
        <meshStandardMaterial
          color={ROAD_COLORS[type] || ROAD_COLORS.asphalt}
          roughness={0.95}
          metalness={0}
          polygonOffset
          polygonOffsetFactor={-1}
        />
      </mesh>

      {/* Lane markings */}
      {showMarkings && centerPts.length > 1 && (
        <Line points={centerPts} color="#f2c200" lineWidth={1.5} dashed dashSize={0.18} gapSize={0.14} />
      )}
      {showMarkings && edges.left.length > 1 && (
        <Line points={edges.left} color="#e8e8e8" lineWidth={1.2} />
      )}
      {showMarkings && edges.right.length > 1 && (
        <Line points={edges.right} color="#e8e8e8" lineWidth={1.2} />
      )}

      {/* Selection highlight outline */}
      {selected && edges.left.length > 1 && (
        <>
          <Line points={edges.left} color="#22d3ee" lineWidth={3} />
          <Line points={edges.right} color="#22d3ee" lineWidth={3} />
        </>
      )}
    </group>
  );
}
