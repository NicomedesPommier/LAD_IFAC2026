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
    sourceData.action,
    sourceData.control,
    sourceData.output,
    sourceData.error,
    sourceData.errorValue,
    sourceData.measurementValue,
    sourceData.setpointValue,
    sourceData.rawValue,
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

function clamp(value, minValue, maxValue) {
  if (minValue > maxValue) return value;
  return Math.min(Math.max(value, minValue), maxValue);
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

export default function SaturationNode({ id, data }) {
  const [manualValue, setManualValue] = useState(
    data.manualValue ?? data.value ?? "0.0"
  );

  const [minValue, setMinValue] = useState(data.minValue ?? "-1.0");
  const [maxValue, setMaxValue] = useState(data.maxValue ?? "1.0");
  const [expanded, setExpanded] = useState(data.expanded ?? true);

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

  const minN = useMemo(() => toNumber(minValue, -1.0), [minValue]);
  const maxN = useMemo(() => toNumber(maxValue, 1.0), [maxValue]);

  const saturatedValue = useMemo(() => {
    return clamp(rawValue, minN, maxN);
  }, [rawValue, minN, maxN]);

  const isSaturated = useMemo(() => {
    return Math.abs(rawValue - saturatedValue) > 1e-9;
  }, [rawValue, saturatedValue]);

  const notify = useNotifier(id, data, () => ({
    inputType: "saturation",
    outputType: "number",

    value: String(saturatedValue),
    numericValue: saturatedValue,

    rawValue: String(rawValue),
    minValue,
    maxValue,

    saturated: isSaturated,
    manualValue,

    sourceConnected: inputConnection.connected,
    sourceNodeId: inputConnection.sourceNodeId,
    sourceHandle: inputConnection.sourceHandle,

    expanded,
  }));

  const lastPublishedRef = useRef("");

  useEffect(() => {
    const payload = {
      inputType: "saturation",
      outputType: "number",

      value: String(saturatedValue),
      numericValue: saturatedValue,

      rawValue: String(rawValue),
      minValue,
      maxValue,

      saturated: isSaturated,
      manualValue,

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
    saturatedValue,
    rawValue,
    minValue,
    maxValue,
    isSaturated,
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

  return (
    <NodeCard
      title={
        <ExpandableTitle
          label="Saturation"
          icon="⛔"
          expanded={expanded}
          onToggle={onToggleExpanded}
        />
      }
      accent="red"
      size="md"
      className="saturation-node"
      handles={
        <>
          <HandleWithLabel
            type="target"
            position={Position.Left}
            id="value"
            label="value"
            top="50%"
            color="red"
          />

          <HandleWithLabel
            type="source"
            position={Position.Right}
            id="value"
            label="value"
            top="50%"
            color="red"
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

      <div className="rf-grid-2">
        <LabeledInput
          label="Min"
          type="number"
          step="0.1"
          value={minValue}
          onChange={onChange(setMinValue, "minValue")}
        />

        <LabeledInput
          label="Max"
          type="number"
          step="0.1"
          value={maxValue}
          onChange={onChange(setMaxValue, "maxValue")}
        />
      </div>

      {expanded && (
        <>
          <InfoCard title="Saturation output">
            <div>
              raw value = <code>{formatNumber(rawValue)}</code>
            </div>

            <div style={{ marginTop: "0.35rem" }}>
              output value = <strong>{formatNumber(saturatedValue)}</strong>
            </div>

            <div style={{ marginTop: "0.35rem", fontSize: "0.85em", opacity: 0.8 }}>
              saturated = <code>{String(isSaturated)}</code>
            </div>
          </InfoCard>

          <InfoBadge size="xs">
            Limits a numeric signal between <code>min</code> and <code>max</code>.
          </InfoBadge>
        </>
      )}
    </NodeCard>
  );
}