import React, { useEffect, useMemo, useRef, useState } from "react";
import { Position, useStore } from "@xyflow/react";
import {
  NodeCard,
  LabeledInput,
  LabeledSelect,
  InfoCard,
  HandleWithLabel,
  useNotifier,
} from "./components";
import { FaDivide, FaCaretDown, FaCaretRight } from "react-icons/fa6";

const OPERATOR_OPTIONS = ["+", "-", "*", "/"];

function toNumber(value, fallback = 0.0) {
  if (typeof value === "boolean") return value ? 1.0 : 0.0;

  if (typeof value === "number") {
    return Number.isFinite(value) ? value : fallback;
  }

  if (typeof value === "string") {
    const trimmed = value.trim();

    if (trimmed.toLowerCase() === "true") return 1.0;
    if (trimmed.toLowerCase() === "false") return 0.0;

    const n = Number.parseFloat(trimmed);
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
    sourceData.setpointValue,
    sourceData.measurementValue,
    sourceData.error,
    sourceData.errorValue,
    sourceData.action,
    sourceData.control,
    sourceData.output,
    sourceData.data,
    sourceData.lastMessage,
    sourceData.latestMessage,
    sourceData.message,
    sourceData.msg,
  ];

  for (const candidate of candidates) {
    if (
      candidate !== undefined &&
      candidate !== null &&
      candidate !== ""
    ) {
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

function compute(a, b, operator) {
  switch (operator) {
    case "+":
      return {
        value: a + b,
        valid: true,
      };

    case "-":
      return {
        value: a - b,
        valid: true,
      };

    case "*":
      return {
        value: a * b,
        valid: true,
      };

    case "/":
      if (Math.abs(b) < 1e-12) {
        return {
          value: 0.0,
          valid: false,
        };
      }

      return {
        value: a / b,
        valid: true,
      };

    default:
      return {
        value: 0.0,
        valid: false,
      };
  }
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
      <span style={{ fontSize: "0.75em" }}>{expanded ? <FaCaretDown /> : <FaCaretRight />}</span>
    </div>
  );
}

export default function ArithmeticOperatorNode({ id, data }) {
  const [operatorName, setOperatorName] = useState(
    data.operatorName ?? "numeric_operator"
  );

  const [operator, setOperator] = useState(data.operator ?? "-");
  const [manualA, setManualA] = useState(data.a ?? data.manualA ?? "0.0");
  const [manualB, setManualB] = useState(data.b ?? data.manualB ?? "0.0");
  const [expanded, setExpanded] = useState(data.expanded ?? true);

  const connectionInfo = useStore((state) => {
    const edges = state.edges ?? [];
    const nodes = state.nodes ?? [];

    const getInput = (targetHandle) => {
      const edge = edges.find(
        (candidateEdge) =>
          candidateEdge.target === id &&
          candidateEdge.targetHandle === targetHandle
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
    };

    return {
      a: getInput("a"),
      b: getInput("b"),
    };
  });

  const connectedA = useMemo(() => {
    return extractNumericCandidate(connectionInfo.a.sourceData);
  }, [connectionInfo.a.sourceData]);

  const connectedB = useMemo(() => {
    return extractNumericCandidate(connectionInfo.b.sourceData);
  }, [connectionInfo.b.sourceData]);

  const effectiveA = useMemo(() => {
    return Number.isFinite(connectedA)
      ? connectedA
      : toNumber(manualA, 0.0);
  }, [connectedA, manualA]);

  const effectiveB = useMemo(() => {
    return Number.isFinite(connectedB)
      ? connectedB
      : toNumber(manualB, 0.0);
  }, [connectedB, manualB]);

  const result = useMemo(() => {
    return compute(effectiveA, effectiveB, operator);
  }, [effectiveA, effectiveB, operator]);

  const notify = useNotifier(id, data, () => ({
    inputType: "arithmeticOperator",
    outputType: "number",

    operatorName,
    operator,

    a: String(effectiveA),
    b: String(effectiveB),
    manualA,
    manualB,

    value: String(result.value),
    numericValue: result.value,
    result: String(result.value),

    valid: result.valid,

    aConnected: connectionInfo.a.connected,
    bConnected: connectionInfo.b.connected,
    sourceANodeId: connectionInfo.a.sourceNodeId,
    sourceBNodeId: connectionInfo.b.sourceNodeId,

    expanded,
  }));

  const lastPublishedRef = useRef("");

  useEffect(() => {
    const payload = {
      inputType: "arithmeticOperator",
      outputType: "number",

      //operatorName,
      operator,

      a: String(effectiveA),
      b: String(effectiveB),
      manualA,
      manualB,

      value: String(result.value),
      numericValue: result.value,
      result: String(result.value),

      valid: result.valid,

      aConnected: connectionInfo.a.connected,
      bConnected: connectionInfo.b.connected,
      sourceANodeId: connectionInfo.a.sourceNodeId,
      sourceBNodeId: connectionInfo.b.sourceNodeId,

      expanded,
    };

    const key = JSON.stringify(payload);

    if (lastPublishedRef.current !== key) {
      lastPublishedRef.current = key;
      notify(payload);
    }
  }, [
    //operatorName,
    operator,
    effectiveA,
    effectiveB,
    manualA,
    manualB,
    result.value,
    result.valid,
    connectionInfo.a.connected,
    connectionInfo.b.connected,
    connectionInfo.a.sourceNodeId,
    connectionInfo.b.sourceNodeId,
    expanded,
    notify,
  ]);

  const onChange = (setter, key) => (v) => {
    setter(v);
    notify({ [key]: v });
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
          label="Arithmetic Operator"
          icon={<FaDivide style={{ verticalAlign: "-2px" }} />}
          expanded={expanded}
          onToggle={onToggleExpanded}
        />
      }
      accent="green"
      size="sm"
      className="arithmetic-operator-node"
      handles={
        <>
          <HandleWithLabel
            type="target"
            position={Position.Left}
            id="a"
            label="A"
            top="35%"
            color="green"
          />

          <HandleWithLabel
            type="target"
            position={Position.Left}
            id="b"
            label="B"
            top="65%"
            color="green"
          />

          <HandleWithLabel
            type="source"
            position={Position.Right}
            id="value"
            label="value"
            top="50%"
            color="green"
          />
        </>
      }
    >
      {/* <LabeledInput
        label="Operator name"
        value={operatorName}
        onChange={onChange(setOperatorName, "operatorName")}
        placeholder="error_calculator"
      /> */}

      <LabeledSelect
        label="Operator"
        value={operator}
        onChange={onChange(setOperator, "operator")}
        options={OPERATOR_OPTIONS}
      />

      {expanded && (
        <>
          {/*<div className="rf-grid-2">
            <LabeledInput
              label={connectionInfo.a.connected ? "A connected" : "Manual A"}
              type="number"
              step="0.1"
              value={
                connectionInfo.a.connected
                  ? formatNumber(effectiveA)
                  : manualA
              }
              onChange={onChange(setManualA, "manualA")}
              disabled={connectionInfo.a.connected}
            />

            <LabeledInput
              label={connectionInfo.b.connected ? "B connected" : "Manual B"}
              type="number"
              step="0.1"
              value={
                connectionInfo.b.connected
                  ? formatNumber(effectiveB)
                  : manualB
              }
              onChange={onChange(setManualB, "manualB")}
              disabled={connectionInfo.b.connected}
            />
          </div>*/}

          <InfoCard title="Operation">
            <div>
              <code>
                {formatNumber(effectiveA)} {operator} {formatNumber(effectiveB)}
              </code>
              {" = "}
              <strong>{formatNumber(result.value)}</strong>
            </div>

            <div style={{ marginTop: "0.35rem", fontSize: "0.85em", opacity: 0.8 }}>
              valid: <code>{String(result.valid)}</code>
            </div>
          </InfoCard>
        </>
      )}
    </NodeCard>
  );
}