import React from "react";
import { Position } from "@xyflow/react";
import {
  NodeCard,
  LabeledInput,
  StatGrid,
  HandleWithLabel,
} from "./components";

/**
 * URDF Assembly — groups links + joints into a sub-tree that can be wired
 * into a Robot block. Adds a name and a free-form description.
 */
export default function UrdfAssemblyNode({ id, data }) {
  const d = data || {};
  const edit = (patch) => d.onChange?.(id, patch);

  const links  = Array.isArray(d.links)  ? d.links  : [];
  const joints = Array.isArray(d.joints) ? d.joints : [];

  return (
    <NodeCard
      title="Assembly"
      size="xl"
      handles={
        <>
          <HandleWithLabel type="target" position={Position.Left}  id="links"    label="links"    color="green"  top="60%" />
          <HandleWithLabel type="target" position={Position.Left}  id="joints"   label="joints"   color="blue"   top="75%" />
          <HandleWithLabel type="source" position={Position.Right} id="assembly" label="assembly" color="purple" />
        </>
      }
    >
      <LabeledInput
        label="Assembly Name"
        value={d.name || ""}
        onChange={(v) => edit({ name: v })}
        placeholder="arm_assembly"
      />

      <LabeledInput
        label="Description"
        value={d.description || ""}
        onChange={(v) => edit({ description: v })}
        placeholder="Left arm assembly with 3 joints"
      />

      <StatGrid
        stats={[
          { value: links.length,  label: "Links",  color: "green" },
          { value: joints.length, label: "Joints", color: "blue" },
        ]}
      />
    </NodeCard>
  );
}
