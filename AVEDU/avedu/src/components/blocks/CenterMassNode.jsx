import React from "react";
import { Position } from "@xyflow/react";
import {
  NodeCard,
  LabeledInput,
  VectorInput,
  InfoCard,
  HandleWithLabel,
} from "./components";

const XYZ_KEYS = ["x", "y", "z"];

/**
 * Center of Mass Node — extracts a center point from connected geometry
 * and optionally applies a manual offset. Outputs center + rotation.
 */
export default function CenterMassNode({ id, data }) {
  const d = data || {};
  const edit = (patch) => d.onChange?.(id, patch);

  const center = d.center || { x: 0, y: 0, z: 0 };
  const useOffset = d.useOffset || false;
  const offset = d.offset || { x: 0, y: 0, z: 0 };

  return (
    <NodeCard
      title={<>&#9878; Center of Mass</>}
      accent="orange"
      size="lg"
      handles={
        <>
          <HandleWithLabel type="target" position={Position.Left}  id="geometry"     label="geometry" color="yellow" />
          <HandleWithLabel type="source" position={Position.Right} id="center_out"   label="center"   color="orange" top="40%" />
          <HandleWithLabel type="source" position={Position.Right} id="rotation_out" label="rotation" color="orange" top="60%" />
        </>
      }
    >
      <LabeledInput
        label="Geometry Source"
        value={d.geometryName || ""}
        onChange={() => {}}
        placeholder="Connected geometry"
        inputProps={{ disabled: true, style: { opacity: 0.6 } }}
      />

      <InfoCard title={<>&#x1f4cd; Calculated Center</>}>
        <div className="rf-vector-readout">
          {XYZ_KEYS.map((k) => (
            <div key={k} className="rf-vector-readout__cell">
              <div className="rf-vector-readout__label">{k.toUpperCase()}</div>
              <div className="rf-vector-readout__value">{(center[k] ?? 0).toFixed(3)}m</div>
            </div>
          ))}
        </div>
      </InfoCard>

      <div className="rf-field">
        <label>
          Offset (optional)
          <input
            type="checkbox"
            checked={useOffset}
            onChange={(e) => edit({ useOffset: e.target.checked })}
            style={{ marginLeft: "0.5rem" }}
          />
        </label>
        {useOffset && (
          <VectorInput
            value={offset}
            keys={XYZ_KEYS}
            onChange={(next) => edit({ offset: next })}
            placeholders={["+X", "+Y", "+Z"]}
            step={0.01}
          />
        )}
      </div>

      <InfoCard tone="cyan">
        Automatically calculates the center point of connected geometry
      </InfoCard>
    </NodeCard>
  );
}
