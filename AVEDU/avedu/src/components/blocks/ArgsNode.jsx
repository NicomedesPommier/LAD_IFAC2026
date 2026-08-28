import React, { useState } from "react";
import { Handle, Position } from "@xyflow/react";
import { NodeCard, ChipList } from "./components";

export default function ArgsNode({ id, data }) {
  const [raw, setRaw] = useState(
    Array.isArray(data.args) ? data.args.join(" ") : (data.default || "")
  );

  const update = (v) => {
    setRaw(v);
    const args = v.trim() ? v.trim().split(/\s+/) : [];
    data.onChange?.(id, { args });
  };

  const args = raw.trim() ? raw.trim().split(/\s+/) : [];

  return (
    <NodeCard
      title="Args"
      size="md"
      handles={<Handle type="source" position={Position.Right} id="out" />}
    >
      <input
        className="rf-input"
        value={raw}
        onChange={(e) => update(e.target.value)}
        placeholder="--ros-args -p background_r:=200"
      />
      <ChipList items={args} emptyLabel="Sin args" />
    </NodeCard>
  );
}
