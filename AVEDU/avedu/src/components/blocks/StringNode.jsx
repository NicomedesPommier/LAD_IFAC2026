import React, { useState } from "react";
import { Position } from "@xyflow/react";
import { NodeCard, HandleWithLabel } from "./components";

/**
 * Generic text input node — used for package names, executable names,
 * namespaces, and any other free-form string field.
 */
export default function TextNode({ id, data }) {
  const [value, setValue] = useState(String(data.value ?? ""));

  const change = (v) => {
    setValue(v);
    data.onChange?.(id, { value: v });
  };

  return (
    <NodeCard
      title={data.label || "Text"}
      size="sm"
      handles={
        <HandleWithLabel
          type="source"
          position={Position.Right}
          id="out"
          label="text"
        />
      }
    >
      <input
        className="rf-input"
        value={value}
        onChange={(e) => change(e.target.value)}
        placeholder={data.placeholder || "enter text..."}
      />
    </NodeCard>
  );
}

// Keep StringNode as an alias for backward compatibility
export { TextNode as StringNode };
