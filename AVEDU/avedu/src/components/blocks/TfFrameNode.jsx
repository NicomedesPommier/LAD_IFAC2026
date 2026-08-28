import React from "react";
import { Position } from "@xyflow/react";
import {
  NodeCard,
  LabeledInput,
  LabeledSelect,
  VectorInput,
  HandleWithLabel,
} from "./components";

const BROADCAST_OPTIONS = [
  { value: "static",  label: "Static (tf_static)" },
  { value: "dynamic", label: "Dynamic (tf)" },
];

const XYZ_KEYS = ["x", "y", "z"];
const RPY_KEYS = ["roll", "pitch", "yaw"];

/**
 * TF Frame Node — positions a frame relative to a parent. Supports
 * receiving center-of-mass input via the "center" handle.
 */
export default function TfFrameNode({ id, data }) {
  const d = data || {};
  const edit = (patch) => d.onChange?.(id, patch);

  const position = d.position || { x: 0, y: 0, z: 0 };
  const rotation = d.rotation || { roll: 0, pitch: 0, yaw: 0 };

  return (
    <NodeCard
      title={<>&#x1f4d0; TF Frame</>}
      size="lg"
      handles={
        <>
          <HandleWithLabel type="target" position={Position.Left}  id="parent_frame" label="parent" color="cyan"   top="30%" />
          <HandleWithLabel type="target" position={Position.Left}  id="center_mass"  label="center" color="orange" top="70%" />
          <HandleWithLabel type="source" position={Position.Right} id="frame_out"    label="frame"  color="cyan" />
        </>
      }
    >
      <LabeledInput
        label="Frame ID"
        value={d.frameId || ""}
        onChange={(v) => edit({ frameId: v })}
        placeholder="base_link"
      />

      <VectorInput
        label="Position (m)"
        value={position}
        keys={XYZ_KEYS}
        onChange={(next) => edit({ position: next })}
        placeholders={["X", "Y", "Z"]}
      />

      <VectorInput
        label="Rotation (rad)"
        value={rotation}
        keys={RPY_KEYS}
        onChange={(next) => edit({ rotation: next })}
        placeholders={["Roll", "Pitch", "Yaw"]}
      />

      <LabeledSelect
        label="Broadcast Type"
        value={d.broadcastType || "static"}
        onChange={(v) => edit({ broadcastType: v })}
        options={BROADCAST_OPTIONS}
      />
    </NodeCard>
  );
}
