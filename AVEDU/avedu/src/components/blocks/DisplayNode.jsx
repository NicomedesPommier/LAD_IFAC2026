import React, { useMemo } from "react";
import { Position, useStore } from "@xyflow/react";
import { PiFlowArrowBold } from "react-icons/pi";
import { NodeCard, HandleWithLabel } from "./components";

/**
 * DisplayNode — a live readout / monitor block.
 *
 * Wire any block's output into the "in" handle and this node shows whatever
 * value that source exposes (a controller output, a PID error, a measurement,
 * a topic's latest message, …). It is a pure sink: it reads the connected
 * source node's data straight from the ReactFlow store and re-renders whenever
 * that data changes, so the readout updates live. It generates no ROS2 code.
 */

// Fields a source node might expose as its "value"/output, in priority order.
const VALUE_KEYS = [
  "numericValue", "value", "result",
  "error", "errorValue",
  "action", "control", "output", "data",
  "measurementValue", "setpointValue",
  "lastMessage", "latestMessage", "message", "msg",
  "preview", "status", "feedback",
];

const MAX_TEXT = 240;

function isEmpty(v) {
  return v === undefined || v === null || v === "";
}

// Returns a finite number, or null when the value is not purely numeric.
function asNumber(v) {
  if (typeof v === "number") return Number.isFinite(v) ? v : null;
  if (typeof v === "boolean") return v ? 1 : 0;
  if (typeof v === "string") {
    const t = v.trim();
    if (t === "") return null;
    const n = Number(t);
    return Number.isFinite(n) ? n : null;
  }
  return null;
}

// Pick the most meaningful value a source node exposes.
function readSourceValue(sourceData) {
  if (!sourceData) return { ok: false };

  for (const key of VALUE_KEYS) {
    const raw = sourceData[key];
    if (isEmpty(raw)) continue;

    if (typeof raw === "object") {
      // std_msgs-style wrappers: { data: ... }
      if (!isEmpty(raw.data)) {
        const n = asNumber(raw.data);
        return n !== null
          ? { ok: true, key, num: n, text: null }
          : { ok: true, key, num: null, text: JSON.stringify(raw.data) };
      }
      return { ok: true, key, num: null, text: JSON.stringify(raw) };
    }

    const n = asNumber(raw);
    return n !== null
      ? { ok: true, key, num: n, text: null }
      : { ok: true, key, num: null, text: String(raw) };
  }

  return { ok: false };
}

function formatNumber(n, digits) {
  return Number.isInteger(n) ? String(n) : n.toFixed(digits);
}

export default function DisplayNode({ id, data }) {
  const digits = Number.isFinite(data.digits) ? data.digits : 3;

  // Every edge that targets this node, paired with its source node's data.
  // A new array each render is intentional: it makes the readout re-render
  // (and re-read) whenever anything in the graph changes — i.e. live.
  const inputs = useStore((state) => {
    const edges = state.edges ?? [];
    const nodes = state.nodes ?? [];
    return edges
      .filter((e) => e.target === id)
      .map((e) => {
        const src = nodes.find((n) => n.id === e.source);
        return {
          edgeId: e.id,
          label: src?.data?.nodeName || src?.data?.label || src?.type || "input",
          data: src?.data ?? null,
        };
      });
  });

  const rows = useMemo(
    () =>
      inputs.map((inp) => {
        const v = readSourceValue(inp.data);
        let display;
        if (!v.ok) {
          display = "waiting…";
        } else if (v.num !== null) {
          display = formatNumber(v.num, digits);
        } else {
          display = v.text;
          if (typeof display === "string" && display.length > MAX_TEXT) {
            display = display.slice(0, MAX_TEXT) + "…";
          }
        }
        return { key: inp.edgeId, label: inp.label, field: v.ok ? v.key : null, display };
      }),
    [inputs, digits]
  );

  return (
    <NodeCard
      title={<><PiFlowArrowBold style={{ verticalAlign: "-2px" }} /> Display</>}
      accent="blue"
      size="sm"
      handles={
        <HandleWithLabel
          type="target"
          position={Position.Left}
          id="in"
          label="in"
          top="50%"
          color="blue"
        />
      }
    >
      {rows.length === 0 ? (
        <div style={{ fontSize: "0.78rem", opacity: 0.6, lineHeight: 1.5, padding: "2px 0" }}>
          Connect any block&apos;s output here to watch its value live
          <br />
          (e.g. PID error, controller output, a measurement).
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "0.3rem" }}>
          {rows.map((r) => (
            <div
              key={r.key}
              style={{
                display: "flex",
                alignItems: "baseline",
                justifyContent: "space-between",
                gap: "0.5rem",
                padding: "0.3rem 0.45rem",
                background: "rgba(0,0,0,0.25)",
                borderRadius: 6,
                border: "1px solid rgba(125,200,255,0.18)",
              }}
            >
              <span
                style={{ fontSize: "0.7rem", opacity: 0.7, whiteSpace: "nowrap" }}
                title={r.field ? `from field: ${r.field}` : undefined}
              >
                {r.label}
              </span>
              <span
                style={{
                  fontFamily: "monospace",
                  fontSize: "0.95rem",
                  fontWeight: 600,
                  color: "#7df9ff",
                  wordBreak: "break-all",
                  textAlign: "right",
                  maxWidth: "70%",
                }}
              >
                {r.display}
              </span>
            </div>
          ))}
        </div>
      )}
    </NodeCard>
  );
}
