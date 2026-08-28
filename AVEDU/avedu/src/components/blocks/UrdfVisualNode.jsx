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
 * URDF Visual — geometry + origin + optional material. Geometry and origin
 * can be wired in from Geometry / Coordinates blocks (collapses the readout).
 */
export default function UrdfVisualNode({ id, data }) {
  const d = data || {};
  const edit = (patch) => d.onChange?.(id, patch);

  const edges = useStore((state) => state.edges);
  const nodes = useStore((state) => state.nodes);

  const connectedHandles = edges
    .filter((e) => e.target === id)
    .map((e) => e.targetHandle);

  const isGeometryConnected = connectedHandles.includes("geometry");
  const isOriginConnected   = connectedHandles.includes("origin");

  const geometry = d.geometry || { type: "box", size: [1, 1, 1] };
  const origin   = d.origin   || { xyz: [0, 0, 0], rpy: [0, 0, 0] };
  const material = d.material || {};

  useEffect(() => {
    const srcFor = (handleId) => {
      const edge = edges.find((e) => e.target === id && e.targetHandle === handleId);
      if (!edge) return null;
      return nodes.find((n) => n.id === edge.source);
    };

    const patch = {};

    if (isGeometryConnected) {
      const geomSrc = srcFor("geometry");
      if (geomSrc?.data?.geometry && JSON.stringify(geomSrc.data.geometry) !== JSON.stringify(geometry)) {
        patch.geometry = geomSrc.data.geometry;
      }
    }

    if (isOriginConnected) {
      const originSrc = srcFor("origin");
      if (originSrc?.data?.xyz || originSrc?.data?.rpy) {
        const newOrigin = {
          xyz: originSrc.data.xyz || origin.xyz,
          rpy: originSrc.data.rpy || origin.rpy,
        };
        if (JSON.stringify(newOrigin) !== JSON.stringify(origin)) {
          patch.origin = newOrigin;
        }
      }
    }

    if (Object.keys(patch).length > 0) edit(patch);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [edges, nodes, isGeometryConnected, isOriginConnected]);

  const setMaterialColor = (i, value) => {
    const color = [...(material.color || [0.5, 0.5, 0.5, 1])];
    color[i] = value;
    edit({ material: { ...material, color } });
  };

  return (
    <NodeCard
      title="Visual Geometry"
      size="lg"
      handles={
        <>
          <HandleWithLabel type="target" position={Position.Left}  id="geometry" label="geometry" color="blue"   top="30%" />
          <HandleWithLabel type="target" position={Position.Left}  id="origin"   label="origin"   color="purple" top="50%" />
          <HandleWithLabel type="source" position={Position.Right} id="visual"   label="visual"   color="blue" />
        </>
      }
    >
      <CollapsibleField label="Geometry" collapsed={isGeometryConnected}>
        <div style={{ fontSize: "0.85em", opacity: 0.7 }}>
          {geometry.type}{" "}
          {geometry.type === "mesh" && geometry.filename && `(${geometry.filename.split("/").pop()})`}
        </div>
      </CollapsibleField>

      <CollapsibleField label="Origin Transform" collapsed={isOriginConnected}>
        <div style={{ fontSize: "0.85em", opacity: 0.7 }}>
          xyz: [{origin.xyz.join(", ")}] | rpy: [{origin.rpy.join(", ")}]
        </div>
      </CollapsibleField>

      <details>
        <summary className="rf-field__summary">Material</summary>

        <LabeledInput
          label="Material Name"
          value={material.name || ""}
          onChange={(v) => edit({ material: { ...material, name: v } })}
          placeholder="blue_material"
        />

        <div className="rf-field">
          <label>Color (RGBA)</label>
          <VectorInput
            value={[
              material.color?.[0] ?? 0.5,
              material.color?.[1] ?? 0.5,
              material.color?.[2] ?? 0.5,
              material.color?.[3] ?? 1,
            ]}
            onChange={(next) => edit({ material: { ...material, color: next } })}
            placeholders={["r", "g", "b", "a"]}
            step={0.1}
            size={4}
          />
        </div>
      </details>
    </NodeCard>
  );
}
