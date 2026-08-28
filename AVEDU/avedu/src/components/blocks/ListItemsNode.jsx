import React, { useMemo, useRef, useState } from "react";
import { Handle, Position } from "@xyflow/react";
import { NodeCard } from "./components";

// Spreadsheet-style row labels: A, B, ... Z, AA, AB, ...
const alphaLabel = (i) => {
  const A = "A".charCodeAt(0);
  let n = i, s = "";
  do {
    s = String.fromCharCode(A + (n % 26)) + s;
    n = Math.floor(n / 26) - 1;
  } while (n >= 0);
  return s;
};

export default function ListItemsNode({ id, data }) {
  // data.title       — heading ("Args" / "Dependencies")
  // data.keyName     — emit key on data.onChange ("args" | "deps")
  // data.placeholder — input placeholder
  // data.items       — string[]
  const keyName = data.keyName || "items";
  const [items, setItems] = useState(Array.isArray(data.items) ? data.items : []);
  const inputRefs = useRef({});

  const emit = (next) => data.onChange?.(id, { [keyName]: next });

  const addRow = (idx) => {
    const next = [...items];
    const at = typeof idx === "number" ? idx + 1 : items.length;
    next.splice(at, 0, "");
    setItems(next);
    emit(next);
    setTimeout(() => inputRefs.current[`row-${at}`]?.focus(), 0);
  };

  const removeRow = (idx) => {
    const next = items.filter((_, i) => i !== idx);
    setItems(next);
    emit(next);
  };

  const setRow = (idx, v) => {
    const next = items.map((it, i) => (i === idx ? v : it));
    setItems(next);
    emit(next);
  };

  const rows = useMemo(
    () => items.map((v, i) => ({ label: alphaLabel(i), value: v, i })),
    [items]
  );

  const placeholder = data.placeholder || (keyName === "args" ? "--ros-args ..." : "std_msgs");

  return (
    <NodeCard
      title={data.title || "List"}
      size="lg"
      handles={<Handle type="source" position={Position.Right} id="out" />}
    >
      {rows.map(({ label, value, i }) => (
        <div key={i} className="rf-row" style={{ alignItems: "center" }}>
          <div style={{ width: 24, textAlign: "center", opacity: 0.8 }}>{label}</div>
          <input
            ref={(el) => (inputRefs.current[`row-${i}`] = el)}
            className="rf-input"
            value={value}
            onChange={(e) => setRow(i, e.target.value)}
            placeholder={placeholder}
            style={{ flex: 1 }}
          />
          <button className="btn" title="Agregar debajo" onClick={() => addRow(i)}>+</button>
          <button className="btn danger" title="Eliminar" onClick={() => removeRow(i)}>✕</button>
        </div>
      ))}

      {rows.length === 0 && (
        <div className="rf-row" style={{ alignItems: "center" }}>
          <div style={{ width: 24, textAlign: "center", opacity: 0.6 }}>–</div>
          <span className="rf-chip rf-chip--ghost">Sin ítems</span>
          <button className="btn" onClick={() => addRow()}>+ agregar</button>
        </div>
      )}
    </NodeCard>
  );
}
