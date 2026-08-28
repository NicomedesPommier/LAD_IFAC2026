import React, { useState } from "react";
import { Position } from "@xyflow/react";
import {
  NodeCard,
  LabeledInput,
  InfoBadge,
  HintText,
  HandleWithLabel,
  useNotifier,
} from "./components";
import roadmapImg from "./sdcs_roadmap_nodes.png";

export default function SDCSRoadmapNode({ id, data }) {
  const [nodeName,      setNodeName]      = useState(data.nodeName      ?? "sdcs_roadmap");
  const [nodeSequence,  setNodeSequence]  = useState(data.nodeSequence  ?? "10, 4, 20, 10");
  const [speed,         setSpeed]         = useState(data.speed         ?? 0.4);
  const [lookahead,     setLookahead]     = useState(data.lookahead     ?? 0.5);
  const [goalTolerance, setGoalTolerance] = useState(data.goalTolerance ?? 0.25);
  const [showMap, setShowMap] = useState(true);

  const notify = useNotifier(id, data, () => ({
    inputType: "sdcsRoadmap",
    nodeName, nodeSequence, speed, lookahead, goalTolerance,
  }));

  const onChange = (setter, key) => (v) => {
    setter(v);
    notify({ [key]: v });
  };

  return (
    <NodeCard
      title={<>&#128506; SDCS Roadmap</>}
      accent="green"
      size="md"
      handles={
        <HandleWithLabel type="source" position={Position.Right} id="out" label="code" top="50%" color="green" />
      }
    >
      <LabeledInput label="Node name"      value={nodeName}     onChange={onChange(setNodeName,     "nodeName")}     placeholder="sdcs_roadmap" />
      <LabeledInput
        label="Node sequence (right-hand map)"
        value={nodeSequence}
        onChange={onChange(setNodeSequence, "nodeSequence")}
        placeholder="10, 4, 20, 10"
      />
      <HintText>Route through SDCS graph nodes 0–23 (the red-numbered points). The car drives the real curved roads between them.</HintText>

      <button
        type="button"
        className="rf-chip"
        onClick={() => setShowMap((v) => !v)}
        style={{ cursor: "pointer", fontSize: 11, padding: "3px 8px" }}
      >
        {showMap ? "▾ Hide node map" : "▸ Show node map"}
      </button>
      {showMap && (
        <div style={{ marginTop: 4 }}>
          <img
            src={roadmapImg}
            alt="SDCS right-hand-traffic roadmap — numbered nodes 0–23"
            style={{ width: "100%", borderRadius: 6, display: "block", background: "#fff" }}
            className="nodrag"
            draggable={false}
          />
          <HintText>Pick node numbers from this map for your sequence above.</HintText>
        </div>
      )}
      <LabeledInput label="Cruise speed (m/s)" type="number" step="0.05" value={speed}         onChange={onChange(setSpeed,         "speed")} />
      <LabeledInput label="Lookahead (m)"      type="number" step="0.05" value={lookahead}     onChange={onChange(setLookahead,     "lookahead")} />
      <LabeledInput label="Goal tolerance (m)" type="number" step="0.05" value={goalTolerance} onChange={onChange(setGoalTolerance, "goalTolerance")} />

      <pre className="rf-formula" style={{ textAlign: "left", whiteSpace: "pre", margin: 0 }}>
        {`SDCS graph → path through ${nodeSequence}\n  /odom → pure pursuit → /cmd_vel`}
      </pre>

      <InfoBadge size="xs">Use with the SDCS Cityscape map. Connect &rarr; ConvertToCode</InfoBadge>
    </NodeCard>
  );
}
