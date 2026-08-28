import React, { useState, useCallback } from "react";
import Editor from "@monaco-editor/react";
import { useCustomNodes } from "../../hooks/useCustomNodes";
import CustomNodeBuilder from "./CustomNodeBuilder";

function CodeEditorModal({ nodeDef, onSave, onClose }) {
  const [code, setCode] = useState(nodeDef.code || "");

  const handleSave = useCallback(() => {
    onSave({ ...nodeDef, code });
    onClose();
  }, [nodeDef, code, onSave, onClose]);

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
          width: 680,
          maxHeight: "88vh",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
          boxShadow: "0 24px 64px rgba(0,0,0,0.55), 0 0 0 1px rgba(125,249,255,0.08)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{
          padding: "0.9rem 1.25rem",
          borderBottom: "1px solid var(--border, rgba(125,249,255,0.18))",
          display: "flex", alignItems: "center", justifyContent: "space-between",
        }}>
          <div>
            <h3 style={{ margin: 0, fontSize: "1rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <span style={{ color: "var(--neon, #7df9ff)" }}>⬡</span>
              Edit — <span style={{ fontWeight: 400, opacity: 0.75 }}>{nodeDef.label}</span>
            </h3>
            {(nodeDef.inputs?.length > 0 || nodeDef.outputs?.length > 0) && (
              <div style={{ fontSize: "0.75rem", color: "var(--text-dim, #8899aa)", marginTop: "0.25rem" }}>
                {nodeDef.inputs?.length > 0 && <>inputs: <code style={{ opacity: 0.8 }}>{nodeDef.inputs.map(i => i.label).join(", ")}</code></>}
                {nodeDef.inputs?.length > 0 && nodeDef.outputs?.length > 0 && <span style={{ margin: "0 0.4rem" }}>·</span>}
                {nodeDef.outputs?.length > 0 && <>outputs: <code style={{ opacity: 0.8 }}>{nodeDef.outputs.map(o => o.label).join(", ")}</code></>}
              </div>
            )}
          </div>
          <button
            onClick={onClose}
            style={{ background: "none", border: "none", color: "var(--text-dim, #8899aa)", cursor: "pointer", fontSize: "1.2rem", lineHeight: 1 }}
          >
            ✕
          </button>
        </div>

        {/* Editor */}
        <div style={{ flex: 1 }}>
          <Editor
            height="420px"
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

        {/* Footer */}
        <div style={{
          padding: "0.9rem 1.25rem",
          borderTop: "1px solid var(--border, rgba(125,249,255,0.18))",
          display: "flex", justifyContent: "space-between", gap: "0.75rem",
        }}>
          <button className="rf-btn" onClick={onClose}>Cancel</button>
          <button className="rf-btn rf-btn--primary" onClick={handleSave}>Save</button>
        </div>
      </div>
    </div>
  );
}

export default function CategorizedPalette({ categories, defaultCategory }) {
  const { customNodes, saveNode, deleteNode } = useCustomNodes();
  const [showBuilder, setShowBuilder]       = useState(false);
  const [editingNode, setEditingNode]       = useState(null);
  const [activeCategory, setActiveCategory] = useState(defaultCategory || Object.keys(categories)[0]);

  const allCategories = {
    ...categories,
    Custom: customNodes.map((n) => ({
      type:       "customNode",
      label:      n.label,
      definition: n,
    })),
  };

  const activeNodes = allCategories[activeCategory] || [];

  return (
    <>
      <div className="rfp-palette rfp-palette--tabbed">
        {/* ── Tab row ── */}
        <div className="rfp-palette__tabs">
          {Object.keys(allCategories).map((cat) => (
            <div
              key={cat}
              data-category={cat}
              className={[
                "rfp-palette__tab",
                activeCategory === cat ? "rfp-palette__tab--active" : "",
                cat === "Custom"        ? "rfp-palette__tab--custom"  : "",
              ].join(" ")}
              onClick={() => setActiveCategory(cat)}
            >
              {cat === "Custom" ? "⬡ Custom" : cat}
            </div>
          ))}

          <button
            className="rfp-palette__tab rfp-palette__new-node-btn"
            onClick={() => setShowBuilder(true)}
            title="Create a new custom node"
          >
            + New Node
          </button>
        </div>

        {/* ── Node chips ── */}
        <div className="rfp-palette__inner">
          {activeCategory === "Custom" && customNodes.length === 0 ? (
            <span style={{ fontSize: "0.8rem", opacity: 0.45 }}>
              No custom nodes yet — click <strong>+ New Node</strong> to create one.
            </span>
          ) : (
            activeNodes.map((node, idx) => (
              <div
                key={node.definition?.id || node.type + idx}
                className="rf-chip"
                style={activeCategory === "Custom" ? { display: "flex", alignItems: "center", gap: "0.3rem" } : undefined}
                draggable
                title={
                  activeCategory === "Custom"
                    ? (node.definition?.description || `Drag to canvas · double-click to edit`)
                    : `Drag ${node.label} to canvas`
                }
                onDoubleClick={
                  activeCategory === "Custom" && node.definition
                    ? (e) => { e.stopPropagation(); setEditingNode(node.definition); }
                    : undefined
                }
                onDragStart={(e) => {
                  e.dataTransfer.setData("application/rf-node", node.type);
                  if (node.definition) {
                    e.dataTransfer.setData(
                      "application/rf-node-definition",
                      JSON.stringify(node.definition)
                    );
                  }
                  e.dataTransfer.effectAllowed = "move";
                }}
              >
                {activeCategory === "Custom" && <span style={{ fontSize: "0.7rem", opacity: 0.7 }}>⬡</span>}
                {node.label}

                {activeCategory === "Custom" && node.definition && (
                  <button
                    title="Delete this custom node"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (window.confirm(`Delete custom node "${node.label}"?`)) {
                        deleteNode(node.definition.id);
                      }
                    }}
                    style={{
                      marginLeft: "0.2rem",
                      background: "none",
                      border: "none",
                      color: "#f44336",
                      cursor: "pointer",
                      fontSize: "0.75rem",
                      lineHeight: 1,
                      padding: "0 0.1rem",
                      opacity: 0.7,
                    }}
                  >
                    ✕
                  </button>
                )}
              </div>
            ))
          )}
        </div>
      </div>

      {showBuilder && (
        <CustomNodeBuilder
          onSave={saveNode}
          onClose={() => setShowBuilder(false)}
        />
      )}

      {editingNode && (
        <CodeEditorModal
          nodeDef={editingNode}
          onSave={saveNode}
          onClose={() => setEditingNode(null)}
        />
      )}
    </>
  );
}
