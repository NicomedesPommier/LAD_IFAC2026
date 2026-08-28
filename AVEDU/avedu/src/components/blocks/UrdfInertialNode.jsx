import React, { useEffect } from "react";
import { Position, useStore } from "@xyflow/react";
import {
  NodeCard,
  LabeledInput,
  CollapsibleField,
  VectorInput,
  HandleWithLabel,
} from "./components";

/**
 * URDF Inertial — link mass + inertia tensor + origin. Origin can be wired
 * in from a Coordinates node (collapses the readout when connected).
 */
export default function UrdfInertialNode({ id, data }) {
  const d = data || {};
  const edit = (patch) => d.onChange?.(id, patch);

  const edges = useStore((state) => state.edges);
  const nodes = useStore((state) => state.nodes);

  const isOriginConnected = edges
    .some((e) => e.target === id && e.targetHandle === "origin");

  const inertia = d.inertia || {};
  const origin = d.origin || { xyz: [0, 0, 0], rpy: [0, 0, 0] };

  useEffect(() => {
    if (!isOriginConnected) return;
    const edge = edges.find((e) => e.target === id && e.targetHandle === "origin");
    if (!edge) return;
    const originSrc = nodes.find((n) => n.id === edge.source);
    if (!originSrc?.data?.xyz && !originSrc?.data?.rpy) return;
    const newOrigin = {
      xyz: originSrc.data.xyz || origin.xyz,
      rpy: originSrc.data.rpy || origin.rpy,
    };
    if (JSON.stringify(newOrigin) !== JSON.stringify(origin)) {
      edit({ origin: newOrigin });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [edges, nodes, isOriginConnected]);

  const setInertia = (patch) => edit({ inertia: { ...inertia, ...patch } });

  return (
    <NodeCard
      title="Inertial"
      size="lg"
      handles={
        <>
          <HandleWithLabel type="target" position={Position.Left}  id="origin"   label="origin"   color="purple" top="65%" />
          <HandleWithLabel type="source" position={Position.Right} id="inertial" label="inertial" color="orange" />
        </>
      }
    >
      <LabeledInput
        label="Mass (kg)"
        type="number" step="0.01"
        value={d.mass ?? ""}
        onChange={(v) => edit({ mass: v || 0 })}
        placeholder="1.0"
      />

      <div className="rf-field">
        <label>Inertia Tensor</label>
        <VectorInput
          value={[inertia.ixx ?? 0, inertia.iyy ?? 0, inertia.izz ?? 0]}
          onChange={([ixx, iyy, izz]) => setInertia({ ixx, iyy, izz })}
          placeholders={["ixx", "iyy", "izz"]}
          step={0.001}
        />
        <VectorInput
          value={[inertia.ixy ?? 0, inertia.ixz ?? 0, inertia.iyz ?? 0]}
          onChange={([ixy, ixz, iyz]) => setInertia({ ixy, ixz, iyz })}
          placeholders={["ixy", "ixz", "iyz"]}
          step={0.001}
        />
      </div>

      <CollapsibleField label="Origin Transform" collapsed={isOriginConnected}>
        <div style={{ fontSize: "0.85em", opacity: 0.7 }}>
          xyz: [{origin.xyz.join(", ")}] | rpy: [{origin.rpy.join(", ")}]
        </div>
      </CollapsibleField>
    </NodeCard>
  );
}
