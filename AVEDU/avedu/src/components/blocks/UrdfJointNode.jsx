import React, { useEffect, useState } from "react";
import { Position, useStore } from "@xyflow/react";
import {
  NodeCard,
  LabeledInput,
  LabeledSelect,
  CollapsibleField,
  HandleWithLabel,
} from "./components";

const JOINT_TYPES = ["fixed", "revolute", "continuous", "prismatic", "floating", "planar"];

const REQUIRED_BORDER = { borderColor: "#ff9800" };

export default function UrdfJointNode({ id, data }) {
  const d = data || {};
  const edit = (patch) => d.onChange?.(id, patch);

  const edges = useStore((state) => state.edges);
  const nodes = useStore((state) => state.nodes);

  const connectedHandles = edges
    .filter((e) => e.target === id)
    .map((e) => e.targetHandle);

  const isParentConnected = connectedHandles.includes("parent");
  const isChildConnected  = connectedHandles.includes("child");
  const isOriginConnected = connectedHandles.includes("origin");
  const isAxisConnected   = connectedHandles.includes("axis");

  const [parent, setParent] = useState(d.parent || "");
  const [child,  setChild]  = useState(d.child  || "");

  const origin = d.origin || { xyz: [0, 0, 0], rpy: [0, 0, 0] };
  const axis   = d.axis   || { xyz: [1, 0, 0] };

  useEffect(() => {
    const srcFor = (handleId) => {
      const edge = edges.find((e) => e.target === id && e.targetHandle === handleId);
      if (!edge) return null;
      return nodes.find((n) => n.id === edge.source);
    };

    const patch = {};

    // A connected source may be a URDF Link node (name in data.name) or a
    // plain String node (name in data.value). Accept either.
    const nameOf = (src) => src?.data?.name ?? src?.data?.value ?? null;

    if (isParentConnected) {
      const src = srcFor("parent");
      const name = nameOf(src);
      if (name && name !== parent) {
        setParent(name); patch.parent = name;
      }
    }
    if (isChildConnected) {
      const src = srcFor("child");
      const name = nameOf(src);
      if (name && name !== child) {
        setChild(name); patch.child = name;
      }
    }
    if (isOriginConnected) {
      const src = srcFor("origin");
      if (src?.data?.xyz || src?.data?.rpy) {
        const newOrigin = {
          xyz: src.data.xyz || origin.xyz,
          rpy: src.data.rpy || origin.rpy,
        };
        if (JSON.stringify(newOrigin) !== JSON.stringify(origin)) {
          patch.origin = newOrigin;
        }
      }
    }
    if (isAxisConnected) {
      const src = srcFor("axis");
      if (src?.data?.axis) {
        const newAxis = { xyz: src.data.axis };
        if (JSON.stringify(newAxis) !== JSON.stringify(axis)) {
          patch.axis = newAxis;
        }
      }
    }

    if (Object.keys(patch).length > 0) edit(patch);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [edges, nodes, isParentConnected, isChildConnected, isOriginConnected, isAxisConnected]);

  const isValid = d.name && d.type && parent && child;
  const unit = d.type === "prismatic" ? "(m)" : "(rad)";

  const title = (
    <>
      URDF Joint
      {!isValid && (
        <span style={{ marginLeft: "0.5rem", fontSize: "0.8em", color: "#ff9800", fontWeight: "normal" }}>
          ⚠ Incomplete
        </span>
      )}
    </>
  );

  return (
    <NodeCard
      title={title}
      size="lg"
      handles={
        <>
          <HandleWithLabel type="target" position={Position.Left}  id="parent" label="parent" color="blue"   top="24%" />
          <HandleWithLabel type="target" position={Position.Left}  id="child"  label="child"  color="blue"   top="38%" />
          <HandleWithLabel type="target" position={Position.Left}  id="origin" label="origin" color="purple" top="52%" />
          <HandleWithLabel type="target" position={Position.Left}  id="axis"   label="axis"   color="green"  top="66%" />
          <HandleWithLabel type="source" position={Position.Right} id="out"    label="joint"  color="blue" />
        </>
      }
    >
      {/* Connectable fields lead, in the same order as the target handles on
          the left edge, so each dot lines up with the field it feeds. */}
      <CollapsibleField
        label={
          <>
            <span className="rf-conn-dot rf-conn-dot--blue" />
            Parent Link {!parent && !isParentConnected && <span style={{ color: "#ff9800" }}>*</span>}
            {isParentConnected && <span style={{ marginLeft: 4, fontSize: "0.8em", color: "#2196f3" }}>↔ {parent || "link"}</span>}
          </>
        }
        collapsed={isParentConnected}
      >
        <input
          className="rf-input"
          value={parent}
          placeholder="base_link"
          onChange={(e) => { setParent(e.target.value); edit({ parent: e.target.value }); }}
          style={!parent && !isParentConnected ? REQUIRED_BORDER : undefined}
        />
      </CollapsibleField>

      <CollapsibleField
        label={
          <>
            <span className="rf-conn-dot rf-conn-dot--blue" />
            Child Link {!child && !isChildConnected && <span style={{ color: "#ff9800" }}>*</span>}
            {isChildConnected && <span style={{ marginLeft: 4, fontSize: "0.8em", color: "#2196f3" }}>↔ {child || "link"}</span>}
          </>
        }
        collapsed={isChildConnected}
      >
        <input
          className="rf-input"
          value={child}
          placeholder="link1"
          onChange={(e) => { setChild(e.target.value); edit({ child: e.target.value }); }}
          style={!child && !isChildConnected ? REQUIRED_BORDER : undefined}
        />
      </CollapsibleField>

      <CollapsibleField
        label={<><span className="rf-conn-dot rf-conn-dot--purple" />Origin Transform</>}
        collapsed={isOriginConnected}
      >
        <div style={{ fontSize: "0.85em", opacity: 0.7 }}>
          xyz: [{origin.xyz.join(", ")}] | rpy: [{origin.rpy.join(", ")}]
        </div>
      </CollapsibleField>

      <CollapsibleField
        label={<><span className="rf-conn-dot rf-conn-dot--green" />Axis</>}
        collapsed={isAxisConnected}
      >
        <div style={{ fontSize: "0.85em", opacity: 0.7 }}>
          [{axis.xyz.join(", ")}]
        </div>
      </CollapsibleField>

      <div className="rf-field">
        <label>
          Name {!d.name && <span style={{ color: "#ff9800" }}>*</span>}
        </label>
        <input
          className="rf-input"
          value={d.name || ""}
          placeholder="joint1"
          onChange={(e) => edit({ name: e.target.value })}
          style={!d.name ? REQUIRED_BORDER : undefined}
        />
      </div>

      <LabeledSelect
        label="Type"
        value={d.type || "fixed"}
        onChange={(v) => edit({ type: v })}
        options={JOINT_TYPES}
      />

      {(d.type === "revolute" || d.type === "prismatic") && (
        <details>
          <summary className="rf-field__summary">Joint Limits (optional)</summary>
          <div className="rf-stack" style={{ paddingLeft: "0.5rem", marginTop: "0.5rem" }}>
            <LabeledInput
              label={`Lower Limit ${unit}`}
              type="number" step="0.01"
              value={d.limit?.lower ?? ""}
              onChange={(v) => edit({ limit: { ...(d.limit || {}), lower: v } })}
              placeholder={d.type === "prismatic" ? "-1.0" : "-3.14"}
            />
            <LabeledInput
              label={`Upper Limit ${unit}`}
              type="number" step="0.01"
              value={d.limit?.upper ?? ""}
              onChange={(v) => edit({ limit: { ...(d.limit || {}), upper: v } })}
              placeholder={d.type === "prismatic" ? "1.0" : "3.14"}
            />
          </div>
        </details>
      )}
    </NodeCard>
  );
}
