import React, { useState, useEffect, useCallback } from "react";
import { Position } from "@xyflow/react";
import {
  NodeCard,
  LabeledInput,
  HintText,
  HandleWithLabel,
} from "./components";
import { listRosPackages, listRosExecutables, listRosParams } from "../../services/fileApi";

export default function LaunchExecutableNode({ id, data }) {
  const canvasId = data.canvasId;

  const [packages,         setPackages]         = useState([]);
  const [executables,      setExecutables]      = useState([]);
  const [discoveredParams, setDiscoveredParams] = useState([]);
  const [pkg,              setPkg]              = useState(data.package    || "");
  const [exe,              setExe]              = useState(data.executable || "");
  const [nodeName,         setNodeName]         = useState(data.nodeName   || "");
  const [namespace,        setNamespace]        = useState(data.namespace  || "");
  const [params,           setParams]           = useState(Array.isArray(data.params) ? data.params : []);
  const [newKey,           setNewKey]           = useState("");
  const [newVal,           setNewVal]           = useState("");
  const [loadingPkgs,      setLoadingPkgs]      = useState(false);
  const [loadingExes,      setLoadingExes]      = useState(false);
  const [loadingParams,    setLoadingParams]    = useState(false);
  const [sourceFile,       setSourceFile]       = useState("");

  const notify = useCallback(
    (next) => data.onChange?.(id, next),
    [data, id]
  );

  const fetchPackages = useCallback(() => {
    if (!canvasId) return;
    setLoadingPkgs(true);
    listRosPackages(canvasId)
      .then((res) => setPackages(res.packages || []))
      .catch(() => setPackages([]))
      .finally(() => setLoadingPkgs(false));
  }, [canvasId]);

  useEffect(() => { fetchPackages(); }, [fetchPackages]);

  useEffect(() => {
    if (!canvasId || !pkg) { setExecutables([]); return; }
    setLoadingExes(true);
    listRosExecutables(canvasId, pkg)
      .then((res) => setExecutables(res.executables || []))
      .catch(() => setExecutables([]))
      .finally(() => setLoadingExes(false));
  }, [canvasId, pkg]);

  useEffect(() => {
    if (!canvasId || !pkg || !exe) { setDiscoveredParams([]); setSourceFile(""); return; }
    setLoadingParams(true);
    listRosParams(canvasId, pkg, exe)
      .then((res) => {
        setDiscoveredParams(res.params || []);
        setSourceFile(res.source_file || "");
      })
      .catch(() => setDiscoveredParams([]))
      .finally(() => setLoadingParams(false));
  }, [canvasId, pkg, exe]);

  const pushParams = useCallback((next) => {
    setParams(next);
    notify({ package: pkg, executable: exe, nodeName, namespace, params: next });
  }, [pkg, exe, nodeName, namespace, notify]);

  const onPkgChange = (v) => {
    setPkg(v); setExe("");
    notify({ package: v, executable: "", nodeName, namespace, params });
  };
  const onExeChange       = (v) => { setExe(v);       notify({ package: pkg, executable: v, nodeName,     namespace, params }); };
  const onNodeNameChange  = (v) => { setNodeName(v);  notify({ package: pkg, executable: exe, nodeName: v, namespace, params }); };
  const onNamespaceChange = (v) => { setNamespace(v); notify({ package: pkg, executable: exe, nodeName, namespace: v, params }); };

  const addParam = (key = newKey, val = newVal) => {
    if (!key.trim()) return;
    const next = [...params, { key: key.trim(), value: val }];
    pushParams(next);
    setNewKey(""); setNewVal("");
  };
  const updateParamValue = (idx, val) => pushParams(params.map((p, i) => i === idx ? { ...p, value: val } : p));
  const updateParamKey   = (idx, key) => pushParams(params.map((p, i) => i === idx ? { ...p, key } : p));
  const removeParam      = (idx)      => pushParams(params.filter((_, i) => i !== idx));

  const addedKeys = new Set(params.map((p) => p.key));

  return (
    <NodeCard
      title="Launch Node"
      size="lg"
      handles={
        <HandleWithLabel type="source" position={Position.Right} id="out" label="node" top="50%" />
      }
    >
      {/* Package */}
      <div className="rf-field">
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <span className="rf-field__label">
            Package {loadingPkgs && <HintText>loading…</HintText>}
          </span>
          <button
            className="btn"
            onClick={fetchPackages}
            style={{ fontSize: 10, padding: "1px 6px" }}
            title="Refresh packages"
          >↺</button>
        </div>
        <select className="rf-input" value={pkg} onChange={(e) => onPkgChange(e.target.value)}>
          <option value="">— select package —</option>
          {packages.map((p) => <option key={p} value={p}>{p}</option>)}
        </select>
      </div>

      {/* Executable */}
      <div className="rf-field">
        <span className="rf-field__label">
          Executable {loadingExes && <HintText>loading…</HintText>}
        </span>
        <select
          className="rf-input"
          value={exe}
          onChange={(e) => onExeChange(e.target.value)}
          disabled={!pkg}
        >
          <option value="">— select executable —</option>
          {executables.map((e_) => <option key={e_} value={e_}>{e_}</option>)}
        </select>
        {pkg && !loadingExes && executables.length === 0 && (
          <HintText>No executables — build your package first</HintText>
        )}
      </div>

      <LabeledInput
        label={<>Node name <span style={{ opacity: 0.5, fontWeight: 400 }}>(optional override)</span></>}
        value={nodeName}
        onChange={onNodeNameChange}
        placeholder={exe || "my_node"}
      />

      <LabeledInput
        label={<>Namespace <span style={{ opacity: 0.5, fontWeight: 400 }}>(optional)</span></>}
        value={namespace}
        onChange={onNamespaceChange}
        placeholder="/robot_ns"
      />

      {/* Parameters */}
      <div className="rf-field">
        <span className="rf-field__label">Parameters</span>

        {/* Detected params — click to add */}
        {exe && !loadingParams && discoveredParams.length > 0 && (
          <div style={{ marginBottom: "0.35rem" }}>
            <HintText>Detected from {sourceFile || "source"} — click to add:</HintText>
            <div className="rf-chips">
              {discoveredParams
                .filter((dp) => !addedKeys.has(dp.name))
                .map((dp) => (
                  <span
                    key={dp.name}
                    className="rf-chip"
                    title={`type: ${dp.type}${dp.default ? ` · default: ${dp.default}` : ""}`}
                    onClick={() => addParam(dp.name, dp.default)}
                    style={{ cursor: "pointer" }}
                  >
                    + {dp.name}
                    {dp.default ? <span style={{ opacity: 0.55, marginLeft: "0.2rem" }}>={dp.default}</span> : null}
                  </span>
                ))}
            </div>
          </div>
        )}

        {/* Editable param rows */}
        {params.length > 0 && (
          <div style={{ display: "grid", gap: "0.3rem", marginBottom: "0.35rem" }}>
            {params.map((p, i) => (
              <div key={i} className="rf-row" style={{ alignItems: "center" }}>
                <input
                  className="rf-input"
                  value={p.key}
                  onChange={(e) => updateParamKey(i, e.target.value)}
                  style={{ flex: "0 0 42%", fontSize: "0.8rem" }}
                  placeholder="param_name"
                />
                <span style={{ opacity: 0.4, fontSize: "0.8rem" }}>=</span>
                <input
                  className="rf-input"
                  value={p.value}
                  onChange={(e) => updateParamValue(i, e.target.value)}
                  style={{ flex: 1, fontSize: "0.8rem" }}
                  placeholder="value"
                />
                <button
                  onClick={() => removeParam(i)}
                  title="Remove"
                  style={{
                    background: "none", border: "none", color: "#f44336",
                    cursor: "pointer", fontSize: "0.9rem", padding: "0 0.2rem", lineHeight: 1
                  }}
                >✕</button>
              </div>
            ))}
          </div>
        )}

        {/* Manual add row */}
        <div className="rf-row">
          <input
            className="rf-input"
            value={newKey}
            onChange={(e) => setNewKey(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && addParam()}
            placeholder="param_name"
            style={{ flex: 1 }}
          />
          <input
            className="rf-input"
            value={newVal}
            onChange={(e) => setNewVal(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && addParam()}
            placeholder="value"
            style={{ flex: 1 }}
          />
          <button className="btn" onClick={() => addParam()}>+</button>
        </div>

        {params.length === 0
          && discoveredParams.filter((dp) => !addedKeys.has(dp.name)).length === 0
          && !loadingParams && <HintText>No parameters</HintText>}
      </div>
    </NodeCard>
  );
}
