import React, { useEffect, useMemo, useRef, useState } from "react";
import { Position, useStore } from "@xyflow/react";
import {
  NodeCard,
  LabeledInput,
  LabeledSelect,
  FormulaBox,
  InfoBadge,
  InfoCard,
  HandleWithLabel,
  useNotifier,
} from "./components";

const OUTPUT_MODE_OPTIONS = ["clamped", "unclamped"];

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

function clamp(value, minValue, maxValue) {
  const minN = toNumber(minValue, -Infinity);
  const maxN = toNumber(maxValue, Infinity);

  if (minN > maxN) return value;

  return Math.min(Math.max(value, minN), maxN);
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
    sourceData.error,
    sourceData.errorValue,
    sourceData.measurementValue,
    sourceData.setpointValue,
    sourceData.control,
    sourceData.action,
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

export default function PIDControllerNode({ id, data }) {
  const [kp, setKp] = useState(data.kp ?? "1.0");
  const [ki, setKi] = useState(data.ki ?? "0.0");
  const [kd, setKd] = useState(data.kd ?? "0.0");

  const [manualError, setManualError] = useState(
    data.error ?? data.manualError ?? "0.0"
  );

  const [dt, setDt] = useState(data.dt ?? "0.05");

  const [outputMode, setOutputMode] = useState(
    data.outputMode ?? "clamped"
  );

  const [outputMin, setOutputMin] = useState(
    data.outputMin ?? "-1.0"
  );

  const [outputMax, setOutputMax] = useState(
    data.outputMax ?? "1.0"
  );

  const [integralMin, setIntegralMin] = useState(
    data.integralMin ?? "-10.0"
  );

  const [integralMax, setIntegralMax] = useState(
    data.integralMax ?? "10.0"
  );

  const [expanded, setExpanded] = useState(data.expanded ?? true);

  const [runtime, setRuntime] = useState({
    action: toNumber(data.action ?? data.control, 0.0),
    rawAction: toNumber(data.rawAction ?? data.rawControl, 0.0),
    error: toNumber(data.error, 0.0),
    pTerm: toNumber(data.pTerm, 0.0),
    iTerm: toNumber(data.iTerm, 0.0),
    dTerm: toNumber(data.dTerm, 0.0),
    integral: toNumber(data.integral, 0.0),
    derivative: toNumber(data.derivative, 0.0),
    previousError: toNumber(data.previousError, 0.0),
  });

  const integralRef = useRef(toNumber(data.integral, 0.0));
  const previousErrorRef = useRef(toNumber(data.previousError, 0.0));
  const initializedRef = useRef(false);
  const lastCalcKeyRef = useRef("");

  const errorConnection = useStore((state) => {
    const edges = state.edges ?? [];
    const nodes = state.nodes ?? [];

    const edge = edges.find(
      (candidateEdge) =>
        candidateEdge.target === id &&
        candidateEdge.targetHandle === "error"
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

  const notify = useNotifier(id, data, () => ({
    inputType: "pidController",
    outputType: "number",
    controllerType: "PID",

    kp,
    ki,
    kd,

    error: manualError,
    manualError,
    dt,

    outputMode,
    outputMin,
    outputMax,
    integralMin,
    integralMax,

    expanded,

    value: String(runtime.action),
    numericValue: runtime.action,
    action: String(runtime.action),
    control: String(runtime.action),

    rawAction: String(runtime.rawAction),
    rawControl: String(runtime.rawAction),

    errorValue: String(runtime.error),
    pTerm: String(runtime.pTerm),
    iTerm: String(runtime.iTerm),
    dTerm: String(runtime.dTerm),
    integral: String(runtime.integral),
    derivative: String(runtime.derivative),
    previousError: String(runtime.previousError),

    errorConnected: errorConnection.connected,
    sourceErrorNodeId: errorConnection.sourceNodeId,
    sourceErrorHandle: errorConnection.sourceHandle,
  }));

  const connectedError = useMemo(() => {
    return extractNumericCandidate(errorConnection.sourceData);
  }, [errorConnection.sourceData]);

  const effectiveError = useMemo(() => {
    return Number.isFinite(connectedError)
      ? connectedError
      : toNumber(manualError, 0.0);
  }, [connectedError, manualError]);

  const effectiveDt = useMemo(() => {
    return Math.max(toNumber(dt, 0.05), 1e-6);
  }, [dt]);

  useEffect(() => {
    const kpN = toNumber(kp, 0.0);
    const kiN = toNumber(ki, 0.0);
    const kdN = toNumber(kd, 0.0);

    const outputMinN = toNumber(outputMin, -Infinity);
    const outputMaxN = toNumber(outputMax, Infinity);

    const integralMinN = toNumber(integralMin, -Infinity);
    const integralMaxN = toNumber(integralMax, Infinity);

    const calcKey = JSON.stringify({
      effectiveError,
      effectiveDt,
      kpN,
      kiN,
      kdN,
      outputMode,
      outputMinN,
      outputMaxN,
      integralMinN,
      integralMaxN,
    });

    if (lastCalcKeyRef.current === calcKey) {
      return;
    }

    lastCalcKeyRef.current = calcKey;

    let nextIntegral = integralRef.current + effectiveError * effectiveDt;
    nextIntegral = clamp(nextIntegral, integralMinN, integralMaxN);

    let derivative = 0.0;

    if (initializedRef.current) {
      derivative = (effectiveError - previousErrorRef.current) / effectiveDt;
    } else {
      derivative = 0.0;
      initializedRef.current = true;
    }

    const pTerm = kpN * effectiveError;
    const iTerm = kiN * nextIntegral;
    const dTerm = kdN * derivative;

    const rawAction = pTerm + iTerm + dTerm;

    const action = outputMode === "clamped"
      ? clamp(rawAction, outputMinN, outputMaxN)
      : rawAction;

    integralRef.current = nextIntegral;
    previousErrorRef.current = effectiveError;

    const nextRuntime = {
      action,
      rawAction,
      error: effectiveError,
      pTerm,
      iTerm,
      dTerm,
      integral: nextIntegral,
      derivative,
      previousError: effectiveError,
    };

    setRuntime(nextRuntime);

    notify({
      inputType: "pidController",
      outputType: "number",
      controllerType: "PID",

      kp,
      ki,
      kd,

      error: String(effectiveError),
      manualError,
      dt: String(effectiveDt),

      outputMode,
      outputMin,
      outputMax,
      integralMin,
      integralMax,

      value: String(action),
      numericValue: action,
      action: String(action),
      control: String(action),

      rawAction: String(rawAction),
      rawControl: String(rawAction),

      errorValue: String(effectiveError),
      pTerm: String(pTerm),
      iTerm: String(iTerm),
      dTerm: String(dTerm),
      integral: String(nextIntegral),
      derivative: String(derivative),
      previousError: String(effectiveError),

      errorConnected: errorConnection.connected,
      sourceErrorNodeId: errorConnection.sourceNodeId,
      sourceErrorHandle: errorConnection.sourceHandle,
    });
  }, [
    effectiveError,
    effectiveDt,
    kp,
    ki,
    kd,
    outputMode,
    outputMin,
    outputMax,
    integralMin,
    integralMax,
    manualError,
    notify,
    errorConnection.connected,
    errorConnection.sourceNodeId,
    errorConnection.sourceHandle,
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

  const resetInternalState = () => {
    integralRef.current = 0.0;
    previousErrorRef.current = 0.0;
    initializedRef.current = false;

    const nextRuntime = {
      ...runtime,
      integral: 0.0,
      derivative: 0.0,
      previousError: 0.0,
    };

    setRuntime(nextRuntime);

    notify({
      integral: "0.0",
      derivative: "0.0",
      previousError: "0.0",
    });
  };

  return (
    <NodeCard
      title={
        <ExpandableTitle
          label="PID Controller"
          icon="⊕"
          expanded={expanded}
          onToggle={onToggleExpanded}
        />
      }
      accent="orange"
      size="md"
      className="pid-controller-node"
      handles={
        <>
          <HandleWithLabel
            type="target"
            position={Position.Left}
            id="error"
            label="error"
            top="50%"
            color="orange"
          />

          <HandleWithLabel
            type="source"
            position={Position.Right}
            id="action"
            label="action"
            top="50%"
            color="orange"
          />
        </>
      }
    >
      <div className="rf-grid-3">
        <LabeledInput
          label="Kp"
          type="number"
          step="0.1"
          value={kp}
          onChange={onChange(setKp, "kp")}
        />

        <LabeledInput
          label="Ki"
          type="number"
          step="0.01"
          value={ki}
          onChange={onChange(setKi, "ki")}
        />

        <LabeledInput
          label="Kd"
          type="number"
          step="0.01"
          value={kd}
          onChange={onChange(setKd, "kd")}
        />
      </div>

      <LabeledInput
        label={
          errorConnection.connected
            ? "Error input connected"
            : "Manual error"
        }
        type="number"
        step="0.1"
        value={
          errorConnection.connected
            ? formatNumber(effectiveError)
            : manualError
        }
        onChange={onChange(setManualError, "manualError")}
        disabled={errorConnection.connected}
      />

      {expanded && (
        <>
          <div className="rf-grid-2">
            <LabeledInput
              label="dt [s]"
              type="number"
              step="0.01"
              min="0.000001"
              value={dt}
              onChange={onChange(setDt, "dt")}
            />

            <LabeledSelect
              label="Output mode"
              value={outputMode}
              onChange={onChange(setOutputMode, "outputMode")}
              options={OUTPUT_MODE_OPTIONS}
            />
          </div>

          <div className="rf-grid-2">
            <LabeledInput
              label="Action min"
              type="number"
              step="0.1"
              value={outputMin}
              onChange={onChange(setOutputMin, "outputMin")}
            />

            <LabeledInput
              label="Action max"
              type="number"
              step="0.1"
              value={outputMax}
              onChange={onChange(setOutputMax, "outputMax")}
            />
          </div>

          <div className="rf-grid-2">
            <LabeledInput
              label="Integral min"
              type="number"
              step="0.1"
              value={integralMin}
              onChange={onChange(setIntegralMin, "integralMin")}
            />

            <LabeledInput
              label="Integral max"
              type="number"
              step="0.1"
              value={integralMax}
              onChange={onChange(setIntegralMax, "integralMax")}
            />
          </div>

          <button
            type="button"
            className="rf-button"
            onClick={resetInternalState}
            style={{
              width: "100%",
              marginBottom: "0.5rem",
            }}
          >
            Reset integral memory
          </button>

          <FormulaBox>
            action = Kp&middot;e + Ki&middot;&int;e dt + Kd&middot;(de/dt)
          </FormulaBox>

          <InfoCard title="Controller output">
            <div>
              <code>action</code> ={" "}
              <strong>{formatNumber(runtime.action)}</strong>
            </div>

            <div style={{ marginTop: "0.35rem", fontSize: "0.85em", opacity: 0.8 }}>
              error = <code>{formatNumber(runtime.error)}</code>
            </div>

            <div style={{ marginTop: "0.35rem", fontSize: "0.85em", opacity: 0.8 }}>
              P = <code>{formatNumber(runtime.pTerm)}</code>,{" "}
              I = <code>{formatNumber(runtime.iTerm)}</code>,{" "}
              D = <code>{formatNumber(runtime.dTerm)}</code>
            </div>

            <div style={{ marginTop: "0.35rem", fontSize: "0.85em", opacity: 0.8 }}>
              integral memory = <code>{formatNumber(runtime.integral)}</code>
            </div>
          </InfoCard>

          <InfoBadge size="xs">
            This PID receives only <code>error</code> and outputs one controller <code>action</code>.
          </InfoBadge>
        </>
      )}
    </NodeCard>
  );
}