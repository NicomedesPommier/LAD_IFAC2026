import React, { useEffect, useRef, useState } from "react";
import { Position } from "@xyflow/react";
import {
  NodeCard,
  LabeledSelect,
  InfoCard,
  InfoBadge,
  HandleWithLabel,
  useNotifier,
} from "./components";

const MODE_OPTIONS = ["button", "toggle"];

function ExpandableTitle({ label, icon, expanded, onToggle }) {
  return (
    <div
      onClick={onToggle}
      style={{ display: "flex", justifyContent: "space-between", cursor: "pointer" }}
    >
      <span>{icon} {label}</span>
      <span style={{ fontSize: "0.75em" }}>{expanded ? "▼" : "▶"}</span>
    </div>
  );
}

export default function BooleanTriggerNode({ id, data }) {
  const [mode, setMode] = useState(data.mode ?? "button");
  const [value, setValue] = useState(data.value ?? false);
  const [commandId, setCommandId] = useState(data.commandId ?? 0);
  const [expanded, setExpanded] = useState(data.expanded ?? true);

  const timeoutRef = useRef(null);

  const notify = useNotifier(id, data, () => ({
    inputType: "booleanTrigger",
    outputType: "bool",

    mode,
    value,
    boolValue: value,
    numericValue: value ? 1.0 : 0.0,

    commandId,
    expanded,
  }));

  useEffect(() => {
    notify({
      inputType: "booleanTrigger",
      outputType: "bool",
      mode,
      value,
      boolValue: value,
      numericValue: value ? 1.0 : 0.0,
      commandId,
      expanded,
    });
  }, [mode, value, commandId, expanded, notify]);

  const onPress = () => {
    const nextCommandId = Date.now();

    if (mode === "button") {
      setValue(true);
      setCommandId(nextCommandId);

      notify({
        value: true,
        boolValue: true,
        numericValue: 1.0,
        commandId: nextCommandId,
        trigger: true,
      });

      if (timeoutRef.current) clearTimeout(timeoutRef.current);

      timeoutRef.current = setTimeout(() => {
        setValue(false);
        notify({
          value: false,
          boolValue: false,
          numericValue: 0.0,
          trigger: false,
        });
      }, 150);

      return;
    }

    const nextValue = !value;
    setValue(nextValue);
    setCommandId(nextCommandId);

    notify({
      value: nextValue,
      boolValue: nextValue,
      numericValue: nextValue ? 1.0 : 0.0,
      commandId: nextCommandId,
      trigger: nextValue,
    });
  };

  const onModeChange = (nextMode) => {
    setMode(nextMode);
    setValue(false);
    notify({
      mode: nextMode,
      value: false,
      boolValue: false,
      numericValue: 0.0,
    });
  };

  const onToggleExpanded = () => {
    const nextExpanded = !expanded;
    setExpanded(nextExpanded);
    notify({ expanded: nextExpanded });
  };

  return (
    <NodeCard
      title={
        <ExpandableTitle
          label="Boolean Trigger"
          icon="🔘"
          expanded={expanded}
          onToggle={onToggleExpanded}
        />
      }
      accent="purple"
      size="sm"
      className="boolean-trigger-node"
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
        onChange={onModeChange}
        options={MODE_OPTIONS}
      />

      <button
        type="button"
        className="rf-button"
        onClick={onPress}
        style={{ width: "100%", marginBottom: "0.5rem" }}
      >
        {mode === "button" ? "Trigger" : value ? "Turn OFF" : "Turn ON"}
      </button>

      {expanded && (
        <>
          <InfoCard title="Output">
            <div>
              value = <strong>{String(value)}</strong>
            </div>
            <div style={{ marginTop: "0.35rem", fontSize: "0.85em", opacity: 0.8 }}>
              command id = <code>{commandId}</code>
            </div>
          </InfoCard>

          <InfoBadge size="xs">
            Button mode sends a short pulse. Toggle mode keeps the value ON/OFF.
          </InfoBadge>
        </>
      )}
    </NodeCard>
  );
}