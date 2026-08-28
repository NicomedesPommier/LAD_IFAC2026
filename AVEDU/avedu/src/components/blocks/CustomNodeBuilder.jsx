import React, { useState } from "react";
import Editor from "@monaco-editor/react";

// ── template ──────────────────────────────────────────────────────────────────

function buildTemplate(label, inputs, outputs) {
  const toVar = (s) =>
    (s || "").toLowerCase().replace(/\s+/g, "_").replace(/[^a-z0-9_]/g, "") || "value";

  const inVars  = inputs.map((i)  => toVar(i.label));
  const outVars = outputs.map((o) => toVar(o.label));

  const inputDesc  = inputs.map((i)  => `#   - ${i.label || i.id}`).join("\n") || "#   (none)";
  const outputDesc = outputs.map((o) => `#   - ${o.label || o.id}`).join("\n") || "#   (none)";
  const paramStr   = inVars.join(", ");
  const returnStr  =
    outVars.length === 1 ? outVars[0]
    : outVars.length > 1 ? `(${outVars.join(", ")})`
    : "None";
  const initLines  = outVars.map((v) => `    ${v} = None`).join("\n") || "    result = None";

  return [
    `# Custom Node: ${label}`,
    `# ──────────────────────────────────────`,
    `# Inputs:`,
    inputDesc,
    `# Outputs:`,
    outputDesc,
    ``,
    `def run(${paramStr}):`,
    `    """`,
    `    Write the logic for "${label}" here.`,
    `    """`,
    initLines,
    ``,
    `    # ── your code here ──`,
    ``,
    `    return ${returnStr}`,
    ``,
  ].join("\n");
}

// ── sub-components ────────────────────────────────────────────────────────────

function HandleRow({ item, onChange, onRemove, placeholder }) {
  return (
    <div style={{ display: "flex", gap: "0.4rem", alignItems: "center" }}>
      <input
        className="rf-input"
        style={{ flex: 1, fontSize: "0.82rem" }}
        placeholder={placeholder}
        value={item.label}
        onChange={(e) => onChange(item.id, e.target.value)}
      />
      <button
        onClick={() => onRemove(item.id)}
        style={{ background: "none", border: "none", color: "#f44336", cursor: "pointer", fontSize: "1rem", lineHeight: 1, padding: "0 0.25rem" }}
        title="Remove"
      >
        ✕
      </button>
    </div>
  );
}

function PortsColumn({ title, items, onAdd, onChange, onRemove, placeholder }) {
  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.5rem" }}>
        <span style={{ fontSize: "0.85rem", fontWeight: 600 }}>{title}</span>
        <button className="rf-btn rf-btn--primary" style={{ padding: "0.15rem 0.5rem", fontSize: "0.75rem" }} onClick={onAdd}>
          + Add
        </button>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem", minHeight: 32 }}>
        {items.length === 0 && (
          <p style={{ fontSize: "0.75rem", opacity: 0.45, margin: 0 }}>None yet</p>
        )}
        {items.map((item) => (
          <HandleRow
            key={item.id}
            item={item}
            onChange={onChange}
            onRemove={onRemove}
            placeholder={placeholder}
          />
        ))}
      </div>
    </div>
  );
}

// ── main component ────────────────────────────────────────────────────────────

export default function CustomNodeBuilder({ onSave, onClose }) {
  const [step, setStep]               = useState(1);
  const [label, setLabel]             = useState("");
  const [description, setDescription] = useState("");
  const [inputs, setInputs]           = useState([]);
  const [outputs, setOutputs]         = useState([]);
  const [code, setCode]               = useState("");

  // ── ports helpers ──────────────────────────────────────────────────────────

  const makeId = (prefix) => `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;

  const addInput  = () => setInputs((p)  => [...p,  { id: makeId("in"),  label: "" }]);
  const addOutput = () => setOutputs((p) => [...p,  { id: makeId("out"), label: "" }]);

  const updateInput  = (id, val) => setInputs((p)  => p.map((i) => (i.id === id ? { ...i, label: val } : i)));
  const updateOutput = (id, val) => setOutputs((p) => p.map((o) => (o.id === id ? { ...o, label: val } : o)));

  const removeInput  = (id) => setInputs((p)  => p.filter((i) => i.id !== id));
  const removeOutput = (id) => setOutputs((p) => p.filter((o) => o.id !== id));

  // ── step navigation ────────────────────────────────────────────────────────

  const goToCode = () => {
    setCode(buildTemplate(label.trim(), inputs, outputs));
    setStep(2);
  };

  const handleSave = () => {
    onSave({
      id:          `custom_${Date.now()}`,
      label:       label.trim(),
      description: description.trim(),
      inputs,
      outputs,
      code,
    });
    onClose();
  };

  // ── render ─────────────────────────────────────────────────────────────────

  const isWide  = step === 2;
  const canNext = label.trim().length > 0;

  return (
    <div
      style={{
        position: "fixed", inset: 0,
        background: "rgba(0,0,0,0.72)",
        display: "flex", alignItems: "center", justifyContent: "center",
        zIndex: 9999,
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: "var(--bg-surface, #0f1929)",
          border: "1px solid var(--border, rgba(125,249,255,0.22))",
          borderRadius: 16,
          width: isWide ? 720 : 500,
          maxHeight: "90vh",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
          boxShadow: "0 24px 64px rgba(0,0,0,0.55), 0 0 0 1px rgba(125,249,255,0.08)",
          transition: "width 0.25s ease",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* ── Header ── */}
        <div
          style={{
            padding: "1rem 1.25rem",
            borderBottom: "1px solid var(--border, rgba(125,249,255,0.18))",
            display: "flex", alignItems: "center", justifyContent: "space-between",
          }}
        >
          <div>
            <h3 style={{ margin: 0, fontSize: "1rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <span style={{ color: "var(--neon, #7df9ff)" }}>⬡</span>
              {step === 1 ? "Create Custom Node" : "Write Node Logic"}
            </h3>
            <div style={{ display: "flex", gap: "0.5rem", marginTop: "0.35rem" }}>
              {[1, 2].map((s) => (
                <div
                  key={s}
                  style={{
                    height: 3, width: 36, borderRadius: 2,
                    background: s <= step ? "var(--neon, #7df9ff)" : "var(--border, rgba(125,249,255,0.2))",
                    transition: "background 0.2s",
                  }}
                />
              ))}
            </div>
          </div>
          <button
            onClick={onClose}
            style={{ background: "none", border: "none", color: "var(--text-dim, #8899aa)", cursor: "pointer", fontSize: "1.2rem", lineHeight: 1 }}
          >
            ✕
          </button>
        </div>

        {/* ── Body ── */}
        <div style={{ flex: 1, overflowY: "auto", padding: step === 2 ? 0 : "1.25rem" }}>

          {/* Step 1 — configuration */}
          {step === 1 && (
            <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              {/* Name */}
              <div>
                <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, marginBottom: "0.4rem" }}>
                  Node Name <span style={{ color: "#f44336" }}>*</span>
                </label>
                <input
                  className="rf-input"
                  style={{ width: "100%", boxSizing: "border-box" }}
                  placeholder="e.g. Speed Controller"
                  value={label}
                  onChange={(e) => setLabel(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && canNext && goToCode()}
                  autoFocus
                />
              </div>

              {/* Description */}
              <div>
                <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, marginBottom: "0.4rem" }}>
                  Description <span style={{ opacity: 0.5, fontWeight: 400 }}>(optional)</span>
                </label>
                <input
                  className="rf-input"
                  style={{ width: "100%", boxSizing: "border-box" }}
                  placeholder="What does this node do?"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>

              {/* Ports */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.25rem" }}>
                <PortsColumn
                  title="Inputs"
                  items={inputs}
                  onAdd={addInput}
                  onChange={updateInput}
                  onRemove={removeInput}
                  placeholder="e.g. speed"
                />
                <PortsColumn
                  title="Outputs"
                  items={outputs}
                  onAdd={addOutput}
                  onChange={updateOutput}
                  onRemove={removeOutput}
                  placeholder="e.g. cmd_vel"
                />
              </div>

              {/* Preview */}
              {(inputs.length > 0 || outputs.length > 0) && (
                <div
                  style={{
                    padding: "0.65rem 0.9rem",
                    background: "rgba(125,249,255,0.05)",
                    border: "1px solid rgba(125,249,255,0.15)",
                    borderRadius: 10,
                    fontSize: "0.78rem",
                    opacity: 0.85,
                  }}
                >
                  <span style={{ fontWeight: 600, color: "var(--neon, #7df9ff)" }}>Preview: </span>
                  <span style={{ opacity: 0.6 }}>
                    {inputs.map((i) => i.label || "…").join(", ") || "—"}
                    {" → "}
                    <strong>{label || "Node"}</strong>
                    {" → "}
                    {outputs.map((o) => o.label || "…").join(", ") || "—"}
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Step 2 — code editor */}
          {step === 2 && (
            <div style={{ display: "flex", flexDirection: "column" }}>
              <div
                style={{
                  padding: "0.6rem 1.25rem",
                  borderBottom: "1px solid var(--border, rgba(125,249,255,0.15))",
                  fontSize: "0.8rem",
                  color: "var(--text-dim, #8899aa)",
                }}
              >
                Logic for <strong style={{ color: "var(--text, #e6f1ff)" }}>{label}</strong> — inputs/outputs are shown in the comments above{" "}
                <code style={{ fontSize: "0.75rem", opacity: 0.7 }}>run()</code>.
              </div>
              <Editor
                height="380px"
                language="python"
                value={code}
                onChange={(v) => setCode(v ?? "")}
                theme="vs-dark"
                options={{
                  minimap: { enabled: false },
                  fontSize: 13,
                  lineNumbers: "on",
                  scrollBeyondLastLine: false,
                  automaticLayout: true,
                  tabSize: 4,
                }}
              />
            </div>
          )}
        </div>

        {/* ── Footer ── */}
        <div
          style={{
            padding: "0.9rem 1.25rem",
            borderTop: "1px solid var(--border, rgba(125,249,255,0.18))",
            display: "flex",
            justifyContent: step === 1 ? "space-between" : "space-between",
            gap: "0.75rem",
          }}
        >
          {step === 1 ? (
            <>
              <button className="rf-btn" onClick={onClose}>Cancel</button>
              <button className="rf-btn rf-btn--primary" onClick={goToCode} disabled={!canNext}>
                Next →
              </button>
            </>
          ) : (
            <>
              <button className="rf-btn" onClick={() => setStep(1)}>← Back</button>
              <button className="rf-btn rf-btn--primary" onClick={handleSave}>
                Save Node
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
