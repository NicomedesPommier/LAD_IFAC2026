import React from "react";
import { Position } from "@xyflow/react";
import {
  NodeCard,
  LabeledInput,
  InfoCard,
  HintText,
  HandleWithLabel,
} from "./components";

/**
 * TF World Node — root world frame for the TF tree. All other frames
 * are positioned relative to this one.
 */
export default function TfWorldNode({ id, data }) {
  const d = data || {};
  const edit = (patch) => d.onChange?.(id, patch);

  return (
    <NodeCard
      title={<>&#x1f30d; TF World Frame</>}
      size="lg"
      handles={
        <HandleWithLabel
          type="source"
          position={Position.Right}
          id="world_frame"
          label="world"
          color="cyan"
        />
      }
    >
      <div className="rf-field">
        <label>Frame ID</label>
        <LabeledInput
          value={d.frameId || "world"}
          onChange={(v) => edit({ frameId: v })}
          placeholder="world"
        />
        <HintText>Root frame for the TF tree (typically 'world' or 'map')</HintText>
      </div>

      <InfoCard title={<>&#x1f4cc; World Frame</>} tone="cyan">
        This is the root of your TF tree. All other frames will be positioned
        relative to this frame.
      </InfoCard>
    </NodeCard>
  );
}
