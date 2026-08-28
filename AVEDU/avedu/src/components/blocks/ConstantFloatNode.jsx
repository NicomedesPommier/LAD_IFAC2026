import React, { useState } from "react";
import { Position } from "@xyflow/react";
import {
  NodeCard,
  LabeledInput,
  InfoBadge,
  HandleWithLabel,
  useNotifier,
} from "./components";

export default function ConstantFloatNode({ id, data }) {
  const [nodeName,         setNodeName]         = useState(data.nodeName         ?? "constant_float");
  const [outputTopic,      setOutputTopic]      = useState(data.outputTopic      ?? "/target_speed");
  const [value,            setValue]            = useState(data.value            ?? 0.5);
  const [publishFrequency, setPublishFrequency] = useState(data.publishFrequency ?? 20.0);

  const notify = useNotifier(id, data, () => ({
    inputType: "constantFloat",
    nodeName, outputTopic, value, publishFrequency,
  }));

  const onChange = (setter, key) => (v) => {
    setter(v);
    notify({ [key]: v });
  };

  return (
    <NodeCard
      title={<>&#935; Constant Float</>}
      accent="amber"
      size="md"
      handles={
        <HandleWithLabel type="source" position={Position.Right} id="out" label="code" top="50%" color="amber" />
      }
    >
      <LabeledInput label="Node name"            value={nodeName}    onChange={onChange(setNodeName,    "nodeName")}    placeholder="constant_float" />
      <LabeledInput label="Output topic (Float32)" value={outputTopic} onChange={onChange(setOutputTopic, "outputTopic")} placeholder="/target_speed" />
      <LabeledInput
        label="Value"
        type="number" step="0.1"
        value={value}
        onChange={onChange(setValue, "value")}
      />
      <LabeledInput
        label="Publish frequency (Hz)"
        type="number" step="1" min="1"
        value={publishFrequency}
        onChange={onChange(setPublishFrequency, "publishFrequency")}
      />

      <pre className="rf-formula" style={{ textAlign: "left", whiteSpace: "pre", margin: 0 }}>
        {`std_msgs/Float32 = ${value}\n  → ${outputTopic}`}
      </pre>

      <InfoBadge size="xs">Connect output &rarr; ConvertToCode</InfoBadge>
    </NodeCard>
  );
}
