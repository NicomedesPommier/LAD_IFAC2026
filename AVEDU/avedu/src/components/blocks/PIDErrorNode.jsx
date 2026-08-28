import React, { useState } from "react";
import { Position } from "@xyflow/react";
import {
  NodeCard,
  LabeledInput,
  LabeledSelect,
  FormulaBox,
  InfoBadge,
  HandleWithLabel,
  useNotifier,
} from "./components";

const SETPOINT_MODES = [
  { value: "constant", label: "Constant value" },
  { value: "topic",    label: "Subscribe to topic" },
];

export default function PIDErrorNode({ id, data }) {
  const [nodeName,      setNodeName]      = useState(data.nodeName      ?? "pid_error_node");
  const [measuredTopic, setMeasuredTopic] = useState(data.measuredTopic ?? "/measured");
  const [setpointMode,  setSetpointMode]  = useState(data.setpointMode  ?? "constant");
  const [setpointValue, setSetpointValue] = useState(data.setpointValue ?? 0.0);
  const [setpointTopic, setSetpointTopic] = useState(data.setpointTopic ?? "/setpoint");
  const [outputTopic,   setOutputTopic]   = useState(data.outputTopic   ?? "/pid/error");

  const notify = useNotifier(id, data, () => ({
    inputType: "pidError",
    nodeName, measuredTopic, setpointMode, setpointValue, setpointTopic, outputTopic,
  }));

  const onChange = (setter, key) => (v) => {
    setter(v);
    notify({ [key]: v });
  };

  return (
    <NodeCard
      title={<>&#x2296; PID Error</>}
      accent="orange"
      size="md"
      handles={
        <HandleWithLabel
          type="source"
          position={Position.Right}
          id="out"
          label="code"
          top="50%"
          color="orange"
        />
      }
    >
      <LabeledInput
        label="Node name"
        value={nodeName}
        onChange={onChange(setNodeName, "nodeName")}
        placeholder="pid_error_node"
      />

      <LabeledInput
        label="Measured topic"
        value={measuredTopic}
        onChange={onChange(setMeasuredTopic, "measuredTopic")}
        placeholder="/measured"
      />

      <LabeledSelect
        label="Setpoint mode"
        value={setpointMode}
        onChange={onChange(setSetpointMode, "setpointMode")}
        options={SETPOINT_MODES}
      />

      {setpointMode === "constant" ? (
        <LabeledInput
          label="Setpoint value"
          type="number"
          step="0.1"
          value={setpointValue}
          onChange={onChange(setSetpointValue, "setpointValue")}
        />
      ) : (
        <LabeledInput
          label="Setpoint topic"
          value={setpointTopic}
          onChange={onChange(setSetpointTopic, "setpointTopic")}
          placeholder="/setpoint"
        />
      )}

      <LabeledInput
        label="Output topic"
        value={outputTopic}
        onChange={onChange(setOutputTopic, "outputTopic")}
        placeholder="/pid/error"
      />

      <FormulaBox>error = setpoint &minus; measured</FormulaBox>

      <InfoBadge size="xs">
        Subscribes <code>{measuredTopic}</code>
        {setpointMode === "topic" && <> &amp; <code>{setpointTopic}</code></>}
        &nbsp;&rarr; Publishes <code>{outputTopic}</code> (Float32)
      </InfoBadge>
    </NodeCard>
  );
}
