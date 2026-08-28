import React, { useState, useEffect } from "react";
import { Position, useStore, useUpdateNodeInternals } from "@xyflow/react";
import {
  NodeCard,
  LabeledInput,
  HintText,
  HandleWithLabel,
} from "./components";

const MAX_INPUTS = 8;

export default function LaunchFileNode({ id, data }) {
  const edges = useStore((state) => state.edges);
  const updateNodeInternals = useUpdateNodeInternals();

  const [fileName, setFileName] = useState(data.fileName || "my_launch");
  const [visibleInputs, setVisibleInputs] = useState(
    typeof data.visibleInputs === "number" ? data.visibleInputs : 1
  );

  const connectedCount = edges.filter(
    (e) => e.target === id && e.targetHandle?.startsWith("node")
  ).length;

  // Always show at least one empty slot beyond what's connected
  const inputsToShow = Math.min(Math.max(visibleInputs, connectedCount + 1), MAX_INPUTS);

  // The number/position of input handles changes as nodes connect. ReactFlow
  // caches handle geometry, so without this the edges keep pointing at the OLD
  // handle positions ("lines don't follow the dots"). Re-measure on every change.
  useEffect(() => {
    updateNodeInternals(id);
  }, [id, inputsToShow, updateNodeInternals]);

  const notify = (next) => data.onChange?.(id, next);

  const onFileNameChange = (v) => {
    setFileName(v);
    notify({ fileName: v, visibleInputs });
  };

  const addSlot = () => {
    if (visibleInputs >= MAX_INPUTS) return;
    const next = visibleInputs + 1;
    setVisibleInputs(next);
    notify({ fileName, visibleInputs: next });
  };

  const handleTop = (i) => `${Math.round(((i + 1) / (inputsToShow + 1)) * 100)}%`;
  const displayName = fileName || "my_launch";

  const inputHandles = Array.from({ length: inputsToShow }).map((_, i) => (
    <HandleWithLabel
      key={`node${i}`}
      type="target"
      position={Position.Left}
      id={`node${i}`}
      label={`node ${i + 1}`}
      top={handleTop(i)}
    />
  ));

  return (
    <NodeCard
      title="Launch File"
      size="md"
      handles={
        <>
          {inputHandles}
          <HandleWithLabel type="source" position={Position.Right} id="out" label="output" top="50%" />
        </>
      }
    >
      <div className="rf-field">
        <LabeledInput
          label="File name"
          value={fileName}
          onChange={onFileNameChange}
          placeholder="my_launch"
        />
        <HintText>
          Saves as <code>{displayName}.launch.py</code>
        </HintText>
      </div>

      <HintText>
        {connectedCount === 0
          ? "Connect Launch Node blocks on the left"
          : `${connectedCount} node${connectedCount !== 1 ? "s" : ""} connected`}
      </HintText>

      {visibleInputs < MAX_INPUTS && (
        <button className="btn" onClick={addSlot} style={{ fontSize: 11, padding: "3px 8px" }}>
          + Add node slot
        </button>
      )}
    </NodeCard>
  );
}
