import React from "react";
import { Position } from "@xyflow/react";
import {
  NodeCard,
  LabeledInput,
  StatGrid,
  HandleWithLabel,
} from "./components";

/**
 * URDF Link V2 — modular link that accepts Inertial / Visual / Collision
 * connections rather than embedding all three forms inline like the legacy node.
 */
export default function UrdfLinkNodeV2({ id, data }) {
  const d = data || {};
  const edit = (patch) => d.onChange?.(id, patch);

  const visuals     = Array.isArray(d.visuals)    ? d.visuals    : [];
  const collisions  = Array.isArray(d.collisions) ? d.collisions : [];
  const hasInertial = !!d.inertial;

  return (
    <NodeCard
      title="URDF Link"
      size="xl"
      handles={
        <>
          <HandleWithLabel type="target" position={Position.Left}  id="inertial"  label="inertial"  color="orange" top="55%" />
          <HandleWithLabel type="target" position={Position.Left}  id="visual"    label="visual"    color="blue"   top="70%" />
          <HandleWithLabel type="target" position={Position.Left}  id="collision" label="collision" color="red"    top="85%" />
          <HandleWithLabel type="source" position={Position.Right} id="link"      label={d.name ? `link: ${d.name}` : "link"} color="green" top="50%" />
        </>
      }
    >
      <LabeledInput
        label="Link Name"
        value={d.name || ""}
        onChange={(v) => edit({ name: v })}
        placeholder="base_link"
      />

      <StatGrid
        stats={[
          { value: hasInertial ? "✓" : "○",          label: "Inertial",  color: hasInertial          ? "orange" : "gray" },
          { value: visuals.length    || "○",         label: "Visual",    color: visuals.length    > 0 ? "blue"   : "gray" },
          { value: collisions.length || "○",         label: "Collision", color: collisions.length > 0 ? "red"    : "gray" },
        ]}
      />
    </NodeCard>
  );
}
