import React, { useEffect, useMemo, useRef, useState } from "react";
import { Position, useStore } from "@xyflow/react";
import {
  NodeCard,
  LabeledInput,
  InfoCard,
  InfoBadge,
  HandleWithLabel,
  useNotifier,
} from "./components";

function toNumber(value, fallback = 0.0) {
  if (typeof value === "boolean") return value ? 1.0 : 0.0;

  if (typeof value === "number") {
    return Number.isFinite(value) ? value : fallback;
  }

  if (typeof value === "string") {
    const n = Number.parseFloat(value.trim());
    return Number.isFinite(n) ? n : fallback;
  }

  return fallback;
}

function clamp(value, minValue, maxValue) {
  return Math.min(Math.max(value, minValue), maxValue);
}

function parseMaybeJson(value) {
  if (value === null || value === undefined) return undefined;
  if (typeof value === "object") return value;
  if (typeof value === "number") return value;
  if (typeof value === "boolean") return value;
  if (typeof value !== "string") return undefined;

  const trimmed = value.trim();
  if (trimmed.length === 0) return undefined;

  if (
    (trimmed.startsWith("{") && trimmed.endsWith("}")) ||
    (trimmed.startsWith("[") && trimmed.endsWith("]"))
  ) {
    try {
      return JSON.parse(trimmed);
    } catch {
      return trimmed;
    }
  }

  return trimmed;
}

function extractNumericCandidate(sourceData) {
  if (!sourceData) return undefined;

  const candidates = [
    sourceData.numericValue,
    sourceData.value,
    sourceData.filteredValue,
    sourceData.measurementValue,
    sourceData.rawValue,
    sourceData.action,
    sourceData.control,
    sourceData.output,
    sourceData.error,
    sourceData.errorValue,
    sourceData.setpointValue,
    sourceData.data,
    sourceData.lastMessage,
    sourceData.latestMessage,
    sourceData.message,
    sourceData.msg,
  ];

  for (const candidate of candidates) {
    if (candidate !== undefined && candidate !== null && candidate !== "") {
      const parsed = parseMaybeJson(candidate);

      if (typeof parsed === "object" && parsed !== null && "data" in parsed) {
        const n = toNumber(parsed.data, NaN);
        if (Number.isFinite(n)) return n;
      }

      const n = toNumber(parsed, NaN);
      if (Number.isFinite(n)) return n;
    }
  }

  return undefined;
}

function formatNumber(value, digits = 4) {
  const n = toNumber(value, NaN);
  if (!Number.isFinite(n)) return "invalid";
  return n.toFixed(digits);
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

export default function LowPassFilterNode({ id, data }) {
  const [manualValue, setManualValue] = useState(
    data.manualValue ?? data.value ?? "0.0"
  );

  const [alpha, setAlpha] = useState(data.alpha ?? "0.2");
  const [expanded, setExpanded] = useState(data.expanded ?? true);

  const [filteredValue, setFilteredValue] = useState(
    toNumber(data.filteredValue ?? data.numericValue ?? data.value, 0.0)
  );

  const initializedRef = useRef(data.initialized ?? false);
  const filteredRef = useRef(
    toNumber(data.filteredValue ?? data.numericValue ?? data.value, 0.0)
  );

  const inputConnection = useStore((state) => {
    const edges = state.edges ?? [];
    const nodes = state.nodes ?? [];

    const edge = edges.find(
      (candidateEdge) =>
        candidateEdge.target === id &&
        candidateEdge.targetHandle === "value"
    );

    const sourceNode = edge
      ? nodes.find((node) => node.id === edge.source)
      : null;

    return {
      connected: Boolean(edge && sourceNode),
      sourceNodeId: sourceNode?.id ?? "",
      sourceHandle: edge?.sourceHandle ?? "",
      sourceData: sourceNode?.data ?? null,
    };
  });

  const connectedValue = useMemo(() => {
    return extractNumericCandidate(inputConnection.sourceData);
  }, [inputConnection.sourceData]);

  const rawValue = useMemo(() => {
    return Number.isFinite(connectedValue)
      ? connectedValue
      : toNumber(manualValue, 0.0);
  }, [connectedValue, manualValue]);

  const alphaN = useMemo(() => {
    return clamp(toNumber(alpha, 0.2), 0.0, 1.0);
  }, [alpha]);

  const notify = useNotifier(id, data, () => ({
    inputType: "lowPassFilter",
    outputType: "number",

    value: String(filteredValue),
    numericValue: filteredValue,
    filteredValue: String(filteredValue),

    rawValue: String(rawValue),
    alpha,

    manualValue,
    initialized: initializedRef.current,

    sourceConnected: inputConnection.connected,
    sourceNodeId: inputConnection.sourceNodeId,
    sourceHandle: inputConnection.sourceHandle,

    expanded,
  }));

  const lastPublishedRef = useRef("");

  useEffect(() => {
    let nextFilteredValue;

    if (!initializedRef.current) {
      nextFilteredValue = rawValue;
      initializedRef.current = true;
    } else {
      nextFilteredValue =
        alphaN * rawValue + (1.0 - alphaN) * filteredRef.current;
    }

    filteredRef.current = nextFilteredValue;
    setFilteredValue(nextFilteredValue);

    const payload = {
      inputType: "lowPassFilter",
      outputType: "number",

      value: String(nextFilteredValue),
      numericValue: nextFilteredValue,
      filteredValue: String(nextFilteredValue),

      rawValue: String(rawValue),
      alpha,

      manualValue,
      initialized: initializedRef.current,

      sourceConnected: inputConnection.connected,
      sourceNodeId: inputConnection.sourceNodeId,
      sourceHandle: inputConnection.sourceHandle,

      expanded,
    };

    const key = JSON.stringify(payload);

    if (lastPublishedRef.current !== key) {
      lastPublishedRef.current = key;
      notify(payload);
    }
  }, [
    rawValue,
    alphaN,
    alpha,
    manualValue,
    inputConnection.connected,
    inputConnection.sourceNodeId,
    inputConnection.sourceHandle,
    expanded,
    notify,
  ]);

  const onChange = (setter, key) => (value) => {
    setter(value);
    notify({ [key]: value });
  };

  const onToggleExpanded = () => {
    const nextExpanded = !expanded;
    setExpanded(nextExpanded);
    notify({ expanded: nextExpanded });
  };

  const resetFilterMemory = () => {
    initializedRef.current = true;
    filteredRef.current = rawValue;
    setFilteredValue(rawValue);

    notify({
      value: String(rawValue),
      numericValue: rawValue,
      filteredValue: String(rawValue),
      initialized: true,
    });
  };

  return (
    <NodeCard
      title={
        <ExpandableTitle
          label="Low Pass Filter"
          icon="〰️"
          expanded={expanded}
          onToggle={onToggleExpanded}
        />
      }
      accent="cyan"
      size="md"
      className="low-pass-filter-node"
      handles={
        <>
          <HandleWithLabel
            type="target"
            position={Position.Left}
            id="value"
            label="value"
            top="50%"
            color="cyan"
          />

          <HandleWithLabel
            type="source"
            position={Position.Right}
            id="value"
            label="value"
            top="50%"
            color="cyan"
          />
        </>
      }
    >
      <LabeledInput
        label={inputConnection.connected ? "Input connected" : "Manual value"}
        type="number"
        step="0.1"
        value={
          inputConnection.connected
            ? formatNumber(rawValue)
            : manualValue
        }
        onChange={onChange(setManualValue, "manualValue")}
        disabled={inputConnection.connected}
      />

      <LabeledInput
        label="Alpha"
        type="number"
        step="0.05"
        min="0.0"
        max="1.0"
        value={alpha}
        onChange={onChange(setAlpha, "alpha")}
      />

      {expanded && (
        <>
          <button
            type="button"
            className="rf-button"
            onClick={resetFilterMemory}
            style={{
              width: "100%",
              marginBottom: "0.5rem",
            }}
          >
            Reset filter memory
          </button>

          <InfoCard title="Filter output">
            <div>
              raw value = <code>{formatNumber(rawValue)}</code>
            </div>

            <div style={{ marginTop: "0.35rem" }}>
              filtered value = <strong>{formatNumber(filteredValue)}</strong>
            </div>

            <div style={{ marginTop: "0.35rem", fontSize: "0.85em", opacity: 0.8 }}>
              alpha = <code>{formatNumber(alphaN)}</code>
            </div>
          </InfoCard>

          <InfoBadge size="xs">
            Smaller <code>alpha</code> gives smoother but slower measurements.
            Larger <code>alpha</code> follows the input faster.
          </InfoBadge>
        </>
      )}
    </NodeCard>
  );
}