import React, { useState } from "react";
import { Position } from "@xyflow/react";
import {
  NodeCard,
  LabeledInput,
  InfoBadge,
  HandleWithLabel,
  useNotifier,
} from "./components";

export default function PurePursuitNode({ id, data }) {
  const [nodeName,      setNodeName]      = useState(data.nodeName      ?? "pure_pursuit");
  const [odomTopic,     setOdomTopic]     = useState(data.odomTopic     ?? "/odom");
  const [pathTopic,     setPathTopic]     = useState(data.pathTopic     ?? "/planned_path");
  const [cmdVelTopic,   setCmdVelTopic]   = useState(data.cmdVelTopic   ?? "/cmd_vel");
  const [speed,         setSpeed]         = useState(data.speed         ?? 0.4);
  const [lookahead,     setLookahead]     = useState(data.lookahead     ?? 0.6);
  const [goalTolerance, setGoalTolerance] = useState(data.goalTolerance ?? 0.25);

  const notify = useNotifier(id, data, () => ({
    inputType: "purePursuit",
    nodeName, odomTopic, pathTopic, cmdVelTopic, speed, lookahead, goalTolerance,
  }));

  const onChange = (setter, key) => (v) => {
    setter(v);
    notify({ [key]: v });
  };

  return (
    <NodeCard
      title={<>&#9719; Pure Pursuit</>}
      accent="green"
      size="md"
      handles={
        <HandleWithLabel type="source" position={Position.Right} id="out" label="code" top="50%" color="green" />
      }
    >
      <LabeledInput label="Node name"               value={nodeName}    onChange={onChange(setNodeName,    "nodeName")}    placeholder="pure_pursuit" />
      <LabeledInput label="Odometry topic (pose in)" value={odomTopic}   onChange={onChange(setOdomTopic,   "odomTopic")}   placeholder="/odom" />
      <LabeledInput label="Path topic (route in)"     value={pathTopic}  onChange={onChange(setPathTopic,   "pathTopic")}   placeholder="/planned_path" />
      <LabeledInput label="cmd_vel topic (drive out)"  value={cmdVelTopic} onChange={onChange(setCmdVelTopic, "cmdVelTopic")} placeholder="/cmd_vel" />
      <LabeledInput label="Cruise speed (m/s)"  type="number" step="0.05" value={speed}         onChange={onChange(setSpeed,         "speed")} />
      <LabeledInput label="Lookahead (m)"       type="number" step="0.05" value={lookahead}     onChange={onChange(setLookahead,     "lookahead")} />
      <LabeledInput label="Goal tolerance (m)"  type="number" step="0.05" value={goalTolerance} onChange={onChange(setGoalTolerance, "goalTolerance")} />

      <pre className="rf-formula" style={{ textAlign: "left", whiteSpace: "pre", margin: 0 }}>
        {`${odomTopic} + ${pathTopic}\n  → pure pursuit → ${cmdVelTopic}`}
      </pre>

      <InfoBadge size="xs">Drive a route drawn in Map Creator. Connect &rarr; ConvertToCode</InfoBadge>
    </NodeCard>
  );
}
