import React from "react";
import { Position } from "@xyflow/react";
import {
  NodeCard,
  LabeledInput,
  VectorInput,
  HandleWithLabel,
} from "./components";

const GEOMETRY_TYPES = ["mesh", "box", "cylinder", "sphere"];
const EMPTY_XYZ = [0, 0, 0];

/**
 * Legacy all-in-one URDF Link.
 *
 * Modern code paths should use `UrdfLinkNodeV2` which delegates to
 * Inertial / Visual / Collision sub-nodes. This component is kept for
 * backward-compatibility with saved graphs that still reference `urdfLink`.
 *
 * `data` shape:
 * {
 *   id, name,
 *   visuals: [{ geometry, origin, material? }],
 *   collisions: [{ geometry, origin }],
 *   inertial: { mass, inertia, origin },
 *   onChange(id, patch)
 * }
 */
export default function UrdfLinkNode({ id, data }) {
  const d = data || {};
  const visuals    = Array.isArray(d.visuals)    ? d.visuals    : [];
  const collisions = Array.isArray(d.collisions) ? d.collisions : [];
  const inertial   = d.inertial || {};
  const edit = (patch) => d.onChange?.(id, patch);

  const setInertial = (patch) => edit({ inertial: { ...(d.inertial || {}), ...patch } });

  const setItemOrigin = (list, key, i, originKey, value) => {
    const next = [...list];
    next[i] = {
      ...(next[i] || {}),
      origin: { ...((next[i] || {}).origin || {}), [originKey]: value },
    };
    edit({ [key]: next });
  };

  const setItemGeometry = (list, key, i, patch) => {
    const next = [...list];
    next[i] = {
      ...(next[i] || {}),
      geometry: { ...((next[i] || {}).geometry || {}), ...patch },
    };
    edit({ [key]: next });
  };

  // Renders one row of an array of {geometry, origin} sub-items (visuals or collisions).
  const renderGeomItem = (list, key, item, i) => (
    <div key={i} className="rf-box" style={{ display: "grid", gap: ".4rem" }}>
      <div className="rf-inline">
        <select
          className="rf-input"
          value={item.geometry?.type || "mesh"}
          onChange={(e) => {
            const type = e.target.value;
            setItemGeometry(list, key, i, {
              type,
              ...(type === "mesh" ? { filename: item.geometry?.filename || "" } : {}),
            });
          }}
        >
          {GEOMETRY_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
        </select>

        {item.geometry?.type === "mesh" && (
          <input
            className="rf-input"
            placeholder="package://path/to.dae | .stl"
            value={item.geometry?.filename || ""}
            onChange={(e) => setItemGeometry(list, key, i, { type: "mesh", filename: e.target.value })}
          />
        )}
      </div>

      <VectorInput
        label="Origin xyz"
        value={item.origin?.xyz || EMPTY_XYZ}
        onChange={(next) => setItemOrigin(list, key, i, "xyz", next)}
      />

      <VectorInput
        label="Origin rpy"
        value={item.origin?.rpy || EMPTY_XYZ}
        onChange={(next) => setItemOrigin(list, key, i, "rpy", next)}
      />

      <button
        className="btn danger"
        onClick={() => edit({ [key]: list.filter((_, j) => j !== i) })}
      >
        Eliminar {key === "visuals" ? "visual" : "collision"}
      </button>
    </div>
  );

  const addGeomItem = (key) => {
    const list = key === "visuals" ? visuals : collisions;
    edit({
      [key]: [
        ...list,
        { geometry: { type: "mesh", filename: "" }, origin: { xyz: [0, 0, 0], rpy: [0, 0, 0] } },
      ],
    });
  };

  return (
    <NodeCard
      title="URDF Link"
      size="xl"
      handles={
        <HandleWithLabel
          type="source"
          position={Position.Right}
          id="out"
          label={d.name ? `link: ${d.name}` : "link"}
          color="green"
        />
      }
    >
      <LabeledInput
        label="Name"
        value={d.name || ""}
        onChange={(v) => edit({ name: v })}
        placeholder="base_link"
      />

      <details>
        <summary className="rf-field__summary">Inertial</summary>

        <LabeledInput
          label="Mass"
          type="number" step="any"
          value={inertial.mass ?? ""}
          onChange={(v) => setInertial({ mass: v })}
          placeholder="1.0"
        />

        <VectorInput
          label="Inertia (ixx, iyy, izz)"
          value={[
            inertial.inertia?.ixx ?? 0,
            inertial.inertia?.iyy ?? 0,
            inertial.inertia?.izz ?? 0,
          ]}
          onChange={([ixx, iyy, izz]) =>
            setInertial({ inertia: { ...(inertial.inertia || {}), ixx, iyy, izz } })
          }
          step={0.001}
        />

        <VectorInput
          label="Origin xyz"
          value={inertial.origin?.xyz || EMPTY_XYZ}
          onChange={(next) =>
            setInertial({ origin: { ...(inertial.origin || {}), xyz: next } })
          }
        />

        <VectorInput
          label="Origin rpy"
          value={inertial.origin?.rpy || EMPTY_XYZ}
          onChange={(next) =>
            setInertial({ origin: { ...(inertial.origin || {}), rpy: next } })
          }
        />
      </details>

      <details open>
        <summary className="rf-field__summary">Visuals</summary>
        {visuals.map((v, i) => renderGeomItem(visuals, "visuals", v, i))}
        <button className="btn" onClick={() => addGeomItem("visuals")}>+ Visual</button>
      </details>

      <details>
        <summary className="rf-field__summary">Collision</summary>
        {collisions.map((c, i) => renderGeomItem(collisions, "collisions", c, i))}
        <button className="btn" onClick={() => addGeomItem("collisions")}>+ Collision</button>
      </details>
    </NodeCard>
  );
}
