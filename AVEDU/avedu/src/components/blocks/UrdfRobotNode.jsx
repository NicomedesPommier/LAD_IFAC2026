import React from "react";
import { Position } from "@xyflow/react";
import {
  NodeCard,
  LabeledInput,
  StatGrid,
  InfoCard,
  HandleWithLabel,
} from "./components";

/**
 * URDF Robot — root that aggregates links, joints, and assemblies into a
 * complete URDF XML output. Surfaces validation warnings when child blocks
 * are missing required fields.
 */
export default function UrdfRobotNode({ id, data }) {
  const change = (key, value) => data?.onChange?.(id, { [key]: value });

  const links  = Array.isArray(data?.links)  ? data.links  : [];
  const joints = Array.isArray(data?.joints) ? data.joints : [];

  const linksCount  = links.length;
  const jointsCount = joints.length;

  const invalidLinks = links.filter((l) => !l?.name);
  const invalidJoints = joints.filter((j) => !j?.name || !j.parent || !j.child || !j.type);
  const validJointsCount = jointsCount - invalidJoints.length;

  return (
    <NodeCard
      title="URDF Robot"
      size="xl"
      handles={
        <>
          <HandleWithLabel type="target" position={Position.Left}  id="links"      label="links"      color="green"  top="50%" />
          <HandleWithLabel type="target" position={Position.Left}  id="joints"     label="joints"     color="blue"   top="65%" />
          <HandleWithLabel type="target" position={Position.Left}  id="assemblies" label="assemblies" color="purple" top="80%" />
          <HandleWithLabel type="source" position={Position.Right} id="xml"        label="xml"        color="red"    top="50%" />
        </>
      }
    >
      <LabeledInput
        label="Robot Name"
        value={data?.name || ""}
        onChange={(v) => change("name", v)}
        placeholder="my_robot"
      />

      <StatGrid
        stats={[
          {
            value: linksCount,
            label: "Links",
            color: linksCount > 0 ? "green" : "gray",
            note: invalidLinks.length > 0 ? `${invalidLinks.length} missing name` : undefined,
          },
          {
            value: jointsCount,
            label: "Joints",
            color: validJointsCount > 0 ? "blue" : "gray",
            note: invalidJoints.length > 0 ? `${invalidJoints.length} incomplete` : undefined,
          },
          {
            value: data?.xml ? "✓" : "○",
            label: "XML",
            color: data?.xml ? "green" : "gray",
          },
        ]}
      />

      {(invalidJoints.length > 0 || invalidLinks.length > 0) && (
        <InfoCard title={<>&#9888; Validation Issues:</>} tone="orange">
          {invalidLinks.length > 0 && (
            <div>• {invalidLinks.length} link(s) missing name</div>
          )}
          {invalidJoints.length > 0 && (
            <div>• {invalidJoints.length} joint(s) missing required fields (name, parent, child, or type)</div>
          )}
        </InfoCard>
      )}

      {data?.xml && (
        <details>
          <summary className="rf-field__summary">View Generated XML</summary>
          <pre
            className="rfp-terminal__code"
            style={{ maxHeight: 200, overflow: "auto", margin: "0.5rem 0 0 0", fontSize: "0.8em" }}
          >
            {data.xml}
          </pre>
        </details>
      )}
    </NodeCard>
  );
}
