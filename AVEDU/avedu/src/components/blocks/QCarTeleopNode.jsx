import React, { useState } from "react";
import { Position } from "@xyflow/react";
import {
  NodeCard,
  LabeledInput,
  LabeledRange,
  InfoBadge,
  KeyboardVisualizer,
  HandleWithLabel,
  useNotifier,
} from "./components";

const KEYBOARD_ROWS = [
  [{ label: "W" }],
  [{ label: "A" }, { label: "S" }, { label: "D" }],
  [{ label: "SPC", wide: true }],
];

const KEYBOARD_LEGEND = [
  { key: "W/S", action: "throttle ±" },
  { key: "A/D", action: "steer left/right" },
  { key: "SPC", action: "stop" },
];

export default function QCarTeleopNode({ id, data }) {
  const [throttleMax, setThrottleMax] = useState(data.throttleMax ?? 0.3);
  const [steeringMax, setSteeringMax] = useState(data.steeringMax ?? 0.4);
  const [nodeName,    setNodeName]    = useState(data.nodeName    ?? "qcar_teleop");

  const notify = useNotifier(id, data, () => ({
    inputType: "qcarTeleop",
    nodeName, throttleMax, steeringMax,
  }));

  const onChange = (setter, key) => (v) => {
    setter(v);
    notify({ [key]: v });
  };

  return (
    <NodeCard
      title={<>&#x1f697; QCar2 Teleop</>}
      accent="amber"
      size="md"
      bodyClassName="rf-card__body--stack-loose"
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
        placeholder="qcar_teleop"
      />

      <KeyboardVisualizer rows={KEYBOARD_ROWS} legend={KEYBOARD_LEGEND} />

      <LabeledRange
        label="Throttle max"
        unit="m/s"
        value={throttleMax}
        onChange={onChange(setThrottleMax, "throttleMax")}
        min={0.05} max={1.0} step={0.05}
      />

      <LabeledRange
        label="Steering max"
        unit="rad"
        value={steeringMax}
        onChange={onChange(setSteeringMax, "steeringMax")}
        min={0.1} max={0.8} step={0.05}
      />

      <InfoBadge>
        Publishes <code>qcar2_interfaces/MotorCommands</code> on{" "}
        <code>/qcar2_motor_speed_cmd</code>
      </InfoBadge>
    </NodeCard>
  );
}
