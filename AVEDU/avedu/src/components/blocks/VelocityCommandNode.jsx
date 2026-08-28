import React, { useState } from "react";
import { Position } from "@xyflow/react";
import {
  NodeCard,
  LabeledInput,
  InfoBadge,
  HandleWithLabel,
  useNotifier,
} from "./components";

export default function VelocityCommandNode({ id, data }) {
  const [nodeName,         setNodeName]         = useState(data.nodeName         ?? "velocity_command");
  const [linearTopic,      setLinearTopic]      = useState(data.linearTopic      ?? "/pid/correction");
  const [angularTopic,     setAngularTopic]     = useState(data.angularTopic     ?? "/steering/correction");
  const [cmdVelTopic,      setCmdVelTopic]      = useState(data.cmdVelTopic      ?? "/cmd_vel");
  const [publishFrequency, setPublishFrequency] = useState(data.publishFrequency ?? 20.0);
  const [stopTopic,        setStopTopic]        = useState(data.stopTopic        ?? "");

  const notify = useNotifier(id, data, () => ({
    inputType: "velocityCommand",
    nodeName, linearTopic, angularTopic, cmdVelTopic, publishFrequency, stopTopic,
  }));

  const onChange = (setter, key) => (v) => {
    setter(v);
    notify({ [key]: v });
  };

  return (
    <NodeCard
      title={<>&#8596; Velocity Command</>}
      accent="blue"
      size="md"
      handles={
        <HandleWithLabel type="source" position={Position.Right} id="out" label="code" top="50%" color="blue" />
      }
    >
      <LabeledInput label="Node name"                          value={nodeName}     onChange={onChange(setNodeName,     "nodeName")}     placeholder="velocity_command" />
      <LabeledInput label={<>Linear topic (Float32 &rarr; linear.x)</>}   value={linearTopic}  onChange={onChange(setLinearTopic,  "linearTopic")}  placeholder="/pid/correction" />
      <LabeledInput label={<>Angular topic (Float32 &rarr; angular.z)</>} value={angularTopic} onChange={onChange(setAngularTopic, "angularTopic")} placeholder="/steering/correction" />
      <LabeledInput label="cmd_vel topic (Twist output)"        value={cmdVelTopic}  onChange={onChange(setCmdVelTopic,  "cmdVelTopic")}  placeholder="/cmd_vel" />
      <LabeledInput
        label="Publish frequency (Hz)"
        type="number" step="1" min="1"
        value={publishFrequency}
        onChange={onChange(setPublishFrequency, "publishFrequency")}
      />
      <LabeledInput
        label={<>Stop topic (Bool, optional &mdash; emergency stop)</>}
        value={stopTopic}
        onChange={onChange(setStopTopic, "stopTopic")}
        placeholder="/obstacle/detected"
      />

      <pre className="rf-formula" style={{ textAlign: "left", whiteSpace: "pre", margin: 0 }}>
        {`geometry_msgs/Twist\n  linear.x  ← ${linearTopic}\n  angular.z ← ${angularTopic}\n${stopTopic ? `  stop      ← ${stopTopic}\n` : ""}  → ${cmdVelTopic}`}
      </pre>

      <InfoBadge size="xs">Connect output &rarr; ConvertToCode</InfoBadge>
    </NodeCard>
  );
}
