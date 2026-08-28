import React from "react";
import { Position } from "@xyflow/react";
import { NodeCard, VectorInput, HandleWithLabel } from "./components";

/**
 * Reusable XYZ + RPY coordinates block. Wires into origin transforms,
 * URDF link positions, etc.
 */
export default function CoordinatesNode({ id, data }) {
  const d = data || {};
  const edit = (patch) => d.onChange?.(id, patch);

  const xyz = d.xyz || [0, 0, 0];
  const rpy = d.rpy || [0, 0, 0];

  return (
    <NodeCard
      title="Coordinates"
      size="lg"
      handles={
        <HandleWithLabel
          type="source"
          position={Position.Right}
          id="coordinates"
          label="coordinates"
          color="purple"
        />
      }
    >
      <VectorInput
        label="Position (xyz)"
        value={xyz}
        onChange={(next) => edit({ xyz: next })}
        placeholders={["x", "y", "z"]}
        step={0.01}
      />

      <VectorInput
        label="Rotation (rpy)"
        value={rpy}
        onChange={(next) => edit({ rpy: next })}
        placeholders={["r", "p", "y"]}
        step={0.01}
      />
    </NodeCard>
  );
}
