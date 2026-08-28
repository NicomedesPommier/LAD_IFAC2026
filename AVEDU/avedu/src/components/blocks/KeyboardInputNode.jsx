import React, { useState } from "react";
import { Position } from "@xyflow/react";
import {
  NodeCard,
  LabeledInput,
  LabeledSelect,
  LabeledRange,
  InfoBadge,
  KeyboardVisualizer,
  HandleWithLabel,
  useNotifier,
} from "./components";

const KEY_MAPS = {
  wasd: {
    forward:  { key: "W",   action: "forward" },
    backward: { key: "S",   action: "backward" },
    left:     { key: "A",   action: "turn left" },
    right:    { key: "D",   action: "turn right" },
    stop:     { key: "SPC", action: "stop" },
  },
  arrows: {
    forward:  { key: "↑",   action: "forward" },
    backward: { key: "↓",   action: "backward" },
    left:     { key: "←",   action: "turn left" },
    right:    { key: "→",   action: "turn right" },
    stop:     { key: "SPC", action: "stop" },
  },
};

const KEY_MAP_OPTIONS = [
  { value: "wasd",   label: "WASD" },
  { value: "arrows", label: "Arrow keys" },
];

function keyboardRows(keys) {
  return [
    [{ label: keys.forward.key }],
    [{ label: keys.left.key }, { label: keys.backward.key }, { label: keys.right.key }],
    [{ label: keys.stop.key, wide: true }],
  ];
}

export default function KeyboardInputNode({ id, data }) {
  const [linearSpeed,  setLinearSpeed]  = useState(data.linearSpeed  ?? 0.5);
  const [angularSpeed, setAngularSpeed] = useState(data.angularSpeed ?? 0.5);
  const [keyMap,       setKeyMap]       = useState(data.keyMap       ?? "wasd");
  const [nodeName,     setNodeName]     = useState(data.nodeName     ?? "teleop_keyboard");

  const notify = useNotifier(id, data, () => ({
    inputType: "keyboard",
    nodeName, linearSpeed, angularSpeed, keyMap,
  }));

  const onChange = (setter, key) => (v) => {
    setter(v);
    notify({ [key]: v });
  };

  const keys = KEY_MAPS[keyMap];

  return (
    <NodeCard
      title={<>&#x2328; Keyboard Input</>}
      accent="green"
      size="md"
      bodyClassName="rf-card__body--stack-loose"
      handles={
        <HandleWithLabel
          type="source"
          position={Position.Right}
          id="out"
          label="Twist"
          top="50%"
        />
      }
    >
      <LabeledInput
        label="Node name"
        value={nodeName}
        onChange={onChange(setNodeName, "nodeName")}
        placeholder="teleop_keyboard"
      />

      <LabeledSelect
        label="Key map"
        value={keyMap}
        onChange={onChange(setKeyMap, "keyMap")}
        options={KEY_MAP_OPTIONS}
      />

      <KeyboardVisualizer
        rows={keyboardRows(keys)}
        legend={Object.values(keys)}
      />

      <LabeledRange
        label="Linear speed"
        unit="m/s"
        value={linearSpeed}
        onChange={onChange(setLinearSpeed, "linearSpeed")}
        min={0.1} max={2.0} step={0.05}
      />

      <LabeledRange
        label="Angular speed"
        unit="rad/s"
        value={angularSpeed}
        onChange={onChange(setAngularSpeed, "angularSpeed")}
        min={0.1} max={2.0} step={0.05}
      />

      <InfoBadge>
        Outputs <code>geometry_msgs/Twist</code> → connect to a Publisher on{" "}
        <code>/cmd_vel</code>
      </InfoBadge>
    </NodeCard>
  );
}
