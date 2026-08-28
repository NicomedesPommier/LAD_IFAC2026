import React, { useState } from "react";
import { Position } from "@xyflow/react";
import HandleWithLabel from "./HandleWithLabel";

const HANDLE_GAP = 30;
const HEADER_H  = 38;

export default function CustomNodeRenderer({ id, data }) {
  const def = data.definition || {};
  const inputs  = def.inputs  || [];
  const outputs = def.outputs || [];
  const [codeOpen, setCodeOpen] = useState(false);

  const bodyRows = Math.max(inputs.length, outputs.length, 1);
  const bodyMin  = bodyRows * HANDLE_GAP + 12;

  return (
    <div className="rf-card" style={{ minWidth: 200, position: "relative" }}>
      {/* Header */}
      <div
        className="rf-card__title"
        style={{
          background: "linear-gradient(135deg, rgba(125,249,255,0.18), rgba(125,249,255,0.05))",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "0.5rem",
        }}
      >
        <span style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
          <span style={{ fontSize: "0.75rem", opacity: 0.8 }}>⬡</span>
          {def.label || "Custom Node"}
        </span>
        {def.code && (
          <button
            onClick={() => setCodeOpen((v) => !v)}
            title={codeOpen ? "Hide code" : "Show code"}
            style={{
              background: "none", border: "none", cursor: "pointer",
              color: "var(--neon, #7df9ff)", fontSize: "0.7rem", padding: 0, opacity: 0.7,
            }}
          >
            {codeOpen ? "▲ code" : "▼ code"}
          </button>
        )}
      </div>

      {/* Body — sized to fit all handles */}
      <div
        className="rf-card__body"
        style={{ minHeight: bodyMin, padding: "0.35rem 2.2rem", display: "flex", flexDirection: "column", gap: "0.2rem" }}
      >
        {def.description && (
          <p style={{ margin: 0, fontSize: "0.72rem", opacity: 0.55 }}>{def.description}</p>
        )}

        <div style={{ display: "flex", justifyContent: "space-between", flex: 1 }}>
          <div style={{ display: "flex", flexDirection: "column", gap: `${HANDLE_GAP - 16}px` }}>
            {inputs.map((inp) => (
              <span key={inp.id} style={{ fontSize: "0.7rem", color: "var(--text-dim, #8899aa)", lineHeight: "16px" }}>
                {inp.label}
              </span>
            ))}
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: `${HANDLE_GAP - 16}px`, alignItems: "flex-end" }}>
            {outputs.map((out) => (
              <span key={out.id} style={{ fontSize: "0.7rem", color: "var(--text-dim, #8899aa)", lineHeight: "16px" }}>
                {out.label}
              </span>
            ))}
          </div>
        </div>

        {codeOpen && def.code && (
          <pre
            style={{
              fontSize: "0.68rem", margin: "0.4rem 0 0", padding: "0.5rem",
              background: "#0b1020", borderRadius: 6, maxHeight: 180,
              overflow: "auto", color: "#e6f1ff", border: "1px solid rgba(125,249,255,0.15)",
            }}
          >
            {def.code}
          </pre>
        )}
      </div>

      {/* Input handles */}
      {inputs.map((inp, i) => (
        <HandleWithLabel
          key={inp.id}
          type="target"
          position={Position.Left}
          id={inp.id}
          label={inp.label}
          top={`${HEADER_H + 8 + i * HANDLE_GAP}px`}
          color="blue"
        />
      ))}

      {/* Output handles */}
      {outputs.map((out, i) => (
        <HandleWithLabel
          key={out.id}
          type="source"
          position={Position.Right}
          id={out.id}
          label={out.label}
          top={`${HEADER_H + 8 + i * HANDLE_GAP}px`}
          color="neon"
        />
      ))}
    </div>
  );
}
