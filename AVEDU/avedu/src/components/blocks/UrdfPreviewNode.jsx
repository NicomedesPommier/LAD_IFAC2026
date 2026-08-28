// components/blocks/UrdfPreviewNode.jsx
import React from "react";
import { Handle, Position } from "@xyflow/react";

/**
 * URDF Preview
 * Muestra el XML recibido por el puerto 'xml'.
 * data esperada:
 * { xml?: string }
 */
export default function UrdfPreviewNode({ data }) {
  const xml = data?.xml || "";

  return (
    <div className="rf-card" style={{ minWidth: 460 }}>
      <div className="rf-card__title">URDF XML</div>

      <div className="rf-card__body" style={{ display: "grid", gap: ".5rem" }}>
        <pre
          className="rf-terminal__code"
          style={{ maxHeight: 240, overflow: "auto", margin: 0, whiteSpace: "pre" }}
        >
{xml || "(vacío)"}
        </pre>
      </div>

      {/* entrada: recibe xml */}
      <Handle type="target" position={Position.Left} id="xml" />
    </div>
  );
}
