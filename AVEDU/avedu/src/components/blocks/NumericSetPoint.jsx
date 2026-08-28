import React, { useMemo, useState } from "react";
import { Position } from "@xyflow/react";
import {
  NodeCard,
  LabeledInput,
  LabeledSelect,
  InfoCard,
  HandleWithLabel,
  useNotifier,
} from "./components";

const UNIT_OPTIONS = [
  "none",
  "m",
  "m/s",
  "rad",
  "deg",
  "rad/s",
  "Hz",
  "N",
  "Nm",
  "%",
  "PWM",
];

const MODE_OPTIONS = ["constant", "slider"];

function toNumber(value, fallback = 0.0) {
  const n = Number.parseFloat(value);
  return Number.isFinite(n) ? n : fallback;
}

function ExpandableTitle({ label, icon, expanded, onToggle }) {
  return (
    <div
      onClick={onToggle}
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        cursor: "pointer",
      }}
    >
      <span>{icon} {label}</span>
      <span style={{ fontSize: "0.75em" }}>{expanded ? "▼" : "▶"}</span>
    </div>
  );
}

export default function NumericSetpointNode({ id, data }) {
  const [value, setValue] = useState(
    data.value ?? data.setpointValue ?? "1.0"
  );

  const [unit, setUnit] = useState(data.unit ?? "none");
  const [mode, setMode] = useState(data.mode ?? "constant");

  const [minValue, setMinValue] = useState(data.minValue ?? "0.0");
  const [maxValue, setMaxValue] = useState(data.maxValue ?? "10.0");
  const [step, setStep] = useState(data.step ?? "0.1");

  const [expanded, setExpanded] = useState(data.expanded ?? true);

  const numericValue = useMemo(() => toNumber(value, 0.0), [value]);

  const notify = useNotifier(id, data, () => ({
    inputType: "numericSetpoint",
    outputType: "number",

    value,
    setpointValue: value,
    numericValue,

    unit,
    mode,
    minValue,
    maxValue,
    step,
    expanded,
  }));

  const onChange = (setter, key) => (v) => {
    setter(v);
    notify({ [key]: v });
  };

  const onValueChange = (v) => {
    const nextValue = String(v);
    const nextNumericValue = toNumber(nextValue, 0.0);

    setValue(nextValue);

    notify({
      value: nextValue,
      setpointValue: nextValue,
      numericValue: nextNumericValue,
      outputType: "number",
    });
  };

  const onToggleExpanded = () => {
    const nextExpanded = !expanded;
    setExpanded(nextExpanded);
    notify({ expanded: nextExpanded });
  };

  const unitLabel = unit === "none" ? "" : ` ${unit}`;

  return (
    <NodeCard
      title={
        <ExpandableTitle
          label="Numeric Setpoint"
          icon="🎯"
          expanded={expanded}
          onToggle={onToggleExpanded}
        />
      }
      accent="purple"
      size="md"
      className="numeric-setpoint-node"
      handles={
        <HandleWithLabel
          type="source"
          position={Position.Right}
          id="value"
          label="value"
          top="50%"
          color="purple"
        />
      }
    >
      <LabeledSelect
        label="Mode"
        value={mode}
        onChange={onChange(setMode, "mode")}
        options={MODE_OPTIONS}
      />

      {mode === "constant" && (
        <LabeledInput
          label="Setpoint value"
          type="number"
          step={step}
          value={value}
          onChange={onValueChange}
          placeholder="1.0"
        />
      )}

      {mode === "slider" && (
        <>
          <label className="rf-field">
            <span>Setpoint value</span>
            <input
              className="rf-input"
              type="range"
              min={toNumber(minValue, 0.0)}
              max={toNumber(maxValue, 10.0)}
              step={toNumber(step, 0.1)}
              value={numericValue}
              onChange={(e) => onValueChange(e.target.value)}
            />
          </label>

          <LabeledInput
            label="Current value"
            type="number"
            step={step}
            value={value}
            onChange={onValueChange}
            placeholder="1.0"
          />
        </>
      )}

      {expanded && (
        <>
          <div className="rf-grid-3">
            <LabeledInput
              label="Min"
              type="number"
              step={step}
              value={minValue}
              onChange={onChange(setMinValue, "minValue")}
              placeholder="0.0"
            />

            <LabeledInput
              label="Max"
              type="number"
              step={step}
              value={maxValue}
              onChange={onChange(setMaxValue, "maxValue")}
              placeholder="10.0"
            />

            <LabeledInput
              label="Step"
              type="number"
              step="0.01"
              value={step}
              onChange={onChange(setStep, "step")}
              placeholder="0.1"
            />
          </div>

          <LabeledSelect
            label="Unit"
            value={unit}
            onChange={onChange(setUnit, "unit")}
            options={UNIT_OPTIONS}
          />

          <InfoCard title="Output">
            <div>
              <code>value</code> ={" "}
              <strong>
                {numericValue}
                {unitLabel}
              </strong>
            </div>

            <div style={{ marginTop: "0.35rem", fontSize: "0.85em", opacity: 0.8 }}>
              This block outputs a scalar numeric reference for controllers.
            </div>
          </InfoCard>
        </>
      )}
    </NodeCard>
  );
}