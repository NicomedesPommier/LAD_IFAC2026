import { useState, useEffect, useCallback, useRef } from "react";
import { listRunningParams, setRosParam } from "../../services/fileApi";
import { useVisiblePolling } from "../../hooks/useVisiblePolling";

const POLL_MS = 15000;

function ParamRow({ canvasId, nodeName, param, onSetDone }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft]     = useState(param.value);
  const [status, setStatus]   = useState(null); // "ok" | "err" | null
  const inputRef = useRef(null);

  // Keep draft in sync when external value changes (poll refresh)
  useEffect(() => {
    if (!editing) setDraft(param.value);
  }, [param.value, editing]);

  useEffect(() => {
    if (editing) inputRef.current?.focus();
  }, [editing]);

  const commit = useCallback(async () => {
    setEditing(false);
    if (draft === param.value) return;
    setStatus(null);
    try {
      const res = await setRosParam(canvasId, nodeName, param.name, draft);
      setStatus(res.success ? "ok" : "err");
      onSetDone?.();
    } catch {
      setStatus("err");
    }
    setTimeout(() => setStatus(null), 2000);
  }, [draft, param.value, param.name, canvasId, nodeName, onSetDone]);

  const onKey = (e) => {
    if (e.key === "Enter") commit();
    if (e.key === "Escape") { setDraft(param.value); setEditing(false); }
  };

  return (
    <div style={{
      display: "flex", alignItems: "center", gap: "0.4rem",
      padding: "0.25rem 0.5rem",
      borderRadius: 6,
      background: status === "ok" ? "rgba(0,255,136,0.07)"
                : status === "err" ? "rgba(244,67,54,0.08)"
                : "transparent",
      transition: "background 0.3s",
    }}>
      {/* Param name */}
      <span style={{
        flex: "0 0 48%", fontSize: "0.75rem",
        color: "#8ab4cc", overflow: "hidden",
        textOverflow: "ellipsis", whiteSpace: "nowrap",
      }} title={param.name}>
        {param.name}
      </span>

      {/* Value — click to edit */}
      {editing ? (
        <input
          ref={inputRef}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={commit}
          onKeyDown={onKey}
          style={{
            flex: 1, background: "#0d2035", border: "1px solid #2a7fa8",
            borderRadius: 4, color: "#e6f1ff", fontSize: "0.75rem",
            padding: "0.15rem 0.3rem", outline: "none", minWidth: 0,
          }}
        />
      ) : (
        <span
          onClick={() => setEditing(true)}
          title="Click to edit"
          style={{
            flex: 1, fontSize: "0.75rem",
            color: status === "ok" ? "#00ff88"
                 : status === "err" ? "#f44336"
                 : "#e6f1ff",
            cursor: "text",
            background: "#0d2035",
            borderRadius: 4,
            padding: "0.15rem 0.35rem",
            overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
            border: "1px solid transparent",
          }}
        >
          {param.value || <span style={{ opacity: 0.35 }}>—</span>}
        </span>
      )}

      {/* Type badge */}
      <span style={{
        fontSize: "0.6rem", opacity: 0.4, flexShrink: 0,
        width: 30, textAlign: "right",
      }}>
        {param.type}
      </span>
    </div>
  );
}

function NodeSection({ canvasId, node, onSetDone }) {
  const [collapsed, setCollapsed] = useState(false);
  const shortName = node.name.replace(/^\//, "");

  return (
    <div style={{ marginBottom: "0.5rem" }}>
      {/* Node header */}
      <div
        onClick={() => setCollapsed(v => !v)}
        style={{
          display: "flex", alignItems: "center", gap: "0.35rem",
          padding: "0.25rem 0.5rem",
          background: "rgba(125,249,255,0.06)",
          borderRadius: 6,
          cursor: "pointer",
          userSelect: "none",
          fontSize: "0.78rem",
          fontWeight: 700,
          color: "#7df9ff",
          borderLeft: "2px solid rgba(125,249,255,0.4)",
        }}
      >
        <span style={{ fontSize: "0.6rem", opacity: 0.7 }}>{collapsed ? "▶" : "▼"}</span>
        <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {shortName}
        </span>
        <span style={{ marginLeft: "auto", fontSize: "0.65rem", opacity: 0.45, fontWeight: 400 }}>
          {node.params.length} param{node.params.length !== 1 ? "s" : ""}
        </span>
      </div>

      {/* Params */}
      {!collapsed && (
        <div style={{ marginTop: "0.2rem" }}>
          {node.params.map((p) => (
            <ParamRow
              key={p.name}
              canvasId={canvasId}
              nodeName={node.name}
              param={p}
              onSetDone={onSetDone}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default function RosParamPanel({ canvasId }) {
  const [nodes, setNodes]       = useState([]);
  const [loading, setLoading]   = useState(false);
  const [lastPoll, setLastPoll] = useState(null);
  const [filter, setFilter]     = useState("");
  const inFlightRef = useRef(false);

  const poll = useCallback(async () => {
    // Skip if there's no canvas or a poll is already in flight (so a slow backend
    // can't let requests stack up). Visibility gating lives in useVisiblePolling.
    if (!canvasId || inFlightRef.current) return;
    inFlightRef.current = true;
    setLoading(true);
    try {
      const res = await listRunningParams(canvasId);
      setNodes(res.nodes || []);
      setLastPoll(new Date());
    } catch {
      // keep stale data
    } finally {
      inFlightRef.current = false;
      setLoading(false);
    }
  }, [canvasId]);

  // Poll every POLL_MS while the tab is visible (a backend ROS-introspection
  // sweep runs per poll, so background tabs must not keep hammering it).
  useVisiblePolling(poll, POLL_MS);

  // Filter nodes/params by search string
  const q = filter.trim().toLowerCase();
  const filtered = nodes
    .map((n) => ({
      ...n,
      params: q
        ? n.params.filter((p) => p.name.toLowerCase().includes(q) || p.value.toLowerCase().includes(q))
        : n.params,
    }))
    .filter((n) => !q || n.name.toLowerCase().includes(q) || n.params.length > 0);

  return (
    <div style={{
      display: "flex", flexDirection: "column", height: "100%",
      background: "#080f1a", color: "#ccc",
    }}>
      {/* Toolbar */}
      <div style={{
        display: "flex", alignItems: "center", gap: "0.4rem",
        padding: "0.4rem 0.6rem",
        borderBottom: "1px solid #1c2e3e",
        flexShrink: 0,
      }}>
        <input
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          placeholder="Filter params…"
          style={{
            flex: 1, background: "#0d2035", border: "1px solid #1c3a52",
            borderRadius: 6, color: "#e6f1ff", fontSize: "0.75rem",
            padding: "0.25rem 0.5rem", outline: "none",
          }}
        />
        <button
          onClick={poll}
          title="Refresh now"
          style={{
            background: "none", border: "1px solid #1c3a52",
            borderRadius: 6, color: "#7df9ff",
            cursor: "pointer", fontSize: "0.75rem",
            padding: "0.2rem 0.45rem", flexShrink: 0,
          }}
        >
          {loading ? "…" : "↺"}
        </button>
      </div>

      {/* Status line */}
      <div style={{
        padding: "0.2rem 0.6rem",
        fontSize: "0.65rem", opacity: 0.4,
        borderBottom: "1px solid #1c2e3e",
        flexShrink: 0,
      }}>
        {nodes.length === 0 && !loading
          ? "No running nodes found"
          : `${nodes.length} node${nodes.length !== 1 ? "s" : ""} · refreshes every ${POLL_MS / 1000}s`}
        {lastPoll && ` · ${lastPoll.toLocaleTimeString()}`}
      </div>

      {/* Node list */}
      <div style={{ flex: 1, overflowY: "auto", padding: "0.5rem 0.4rem" }}>
        {filtered.length === 0 && !loading && (
          <div style={{ padding: "1rem", textAlign: "center", fontSize: "0.75rem", opacity: 0.4 }}>
            {nodes.length === 0
              ? "Start a ROS2 node to see its parameters here."
              : "No params match the filter."}
          </div>
        )}
        {filtered.map((node) => (
          <NodeSection
            key={node.name}
            canvasId={canvasId}
            node={node}
            onSetDone={poll}
          />
        ))}
      </div>
    </div>
  );
}
