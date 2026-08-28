// src/levels/UrdfFlowBuildSlide.jsx
import React, { useCallback, useEffect, useMemo } from "react";
import {
  ReactFlow,
  ReactFlowProvider,
  Background,
  Controls,
  addEdge,
  useEdgesState,
  useNodesState,
  useReactFlow,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";

import { nodeTypes, paletteCategorized, CategorizedPalette, defaultDataFor } from "../../components/blocks";
import {
  computeUrdfXml,
  syncUrdfDerived,
} from "../../components/blocks/urdf-helpers";
import "../../styles/_rosflow.scss";

export const meta = {
  id: "rf-build-urdf",
  title: "Construye un URDF con nodos conectados",
  order: 8,
  objectiveCode: "ros-slide-rf-build-urdf",
};

// ---- helpers ----
function Inner({ onObjectiveHit }) {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const { screenToFlowPosition } = useReactFlow();

  // Derivadas (XML desde el grafo)
  const urdfDeriv = useMemo(() => computeUrdfXml(nodes, edges), [nodes, edges]);

  // Sincroniza el XML generado hacia urdfRobot / urdfPreview / urdfViewer
  useEffect(() => {
    syncUrdfDerived(nodes, edges, setNodes);
  }, [nodes, edges, setNodes]);

  // Conexión
  const onConnect = useCallback(
    (p) => setEdges((eds) => addEdge({ ...p, type: "smoothstep" }, eds)),
    []
  );

  // Cambios de data de cada nodo (patrón onChange(id, patch))
  const onNodeDataChange = useCallback(
    (id, next) => {
      setNodes((nds) =>
        nds.map((n) => {
          if (n.id !== id) return n;
          const curr = n.data || {};
          let changed = false;
          for (const k of Object.keys(next)) {
            const a = curr[k];
            const b = next[k];
            const same =
              (Array.isArray(a) || Array.isArray(b))
                ? JSON.stringify(a) === JSON.stringify(b)
                : a === b;
            if (!same) {
              changed = true;
              break;
            }
          }
          if (!changed) return n;
          return { ...n, data: { ...curr, ...next } };
        })
      );
    },
    [setNodes]
  );

  // Semilla inicial: 2 links + 1 joint + robot + preview + viewer
  const initialNodes = useMemo(() => {
    const mk = (type, x, y, extra = {}) => ({
      id: `${type}-${Math.random().toString(36).slice(2, 8)}`,
      type,
      position: { x, y },
      data: { ...defaultDataFor(type), onChange: onNodeDataChange, ...extra },
    });

    return [
      mk("urdfLink", 80, 120, { name: "base_link" }),
      mk("urdfLink", 80, 260, { name: "link1" }),
      mk("urdfJoint", 360, 190, {
        name: "joint_base_to_link1",
        type: "fixed",
        parent: "base_link",
        child: "link1",
      }),
      mk("urdfRobot", 620, 190, { name: "my_robot" }),
      mk("urdfPreview", 920, 80, {}),
      mk("urdfViewer", 920, 300, {}),
    ];
  }, [onNodeDataChange]);

  useEffect(() => setNodes(initialNodes), [initialNodes, setNodes]);

  // DnD palette
  const onDrop = useCallback(
    (evt) => {
      evt.preventDefault();
      const t = evt.dataTransfer.getData("application/rf-node");
      if (!t) return;

      // Use screenToFlowPosition to properly convert screen coords to flow coords
      const position = screenToFlowPosition({
        x: evt.clientX,
        y: evt.clientY,
      });

      let type = t; // en paletteUrdf vienen tipos directos: urdfLink, urdfJoint, etc.
      setNodes((nds) => [
        ...nds,
        {
          id: `n-${Date.now()}`,
          type,
          position,
          data: { ...defaultDataFor(type), onChange: onNodeDataChange },
        },
      ]);
    },
    [screenToFlowPosition, setNodes, onNodeDataChange]
  );

  const onDragOver = useCallback((evt) => {
    evt.preventDefault();
    evt.dataTransfer.dropEffect = "move";
  }, []);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(urdfDeriv.xml || "");
    } catch {}
  };
  const markDone = () => onObjectiveHit?.(meta.objectiveCode);

  return (
    <div className="rfp-wrap">
      {/* FRANJA 1: PALETTE */}
      <CategorizedPalette
        categories={paletteCategorized}
        defaultCategory="URDF"
      />

      {/* FRANJA 2: Lienzo */}
      <div className="rfp-canvas">
        <ReactFlow
          className="rfp-canvas__inner"
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          nodeTypes={nodeTypes}
          onDrop={onDrop}
          onDragOver={onDragOver}
          fitView
          proOptions={{ hideAttribution: true }}
          deleteKeyCode={["Backspace", "Delete"]}
        >
          <Background />
          <Controls />
        </ReactFlow>
      </div>

      {/* FRANJA 3: Panel de XML */}
      <div className="rfp-terminal">
        <div className="rfp-terminal__title">URDF generado</div>
        <pre className="rfp-terminal__code" style={{ maxHeight: 180, overflow: "auto" }}>
{urdfDeriv.xml || "(vacío)"}
        </pre>
        <div className="rfp-terminal__actions">
          <button className="btn" onClick={copy}>Copiar XML</button>
          <button className="btn" onClick={markDone}>Marcar logrado</button>
        </div>
        <div className="rfp-terminal__hint">
          <strong>V2 Workflow (Modular):</strong> Create Inertial, Visual, and Collision nodes → Connect to Link V2 →
          Connect Links and Joints to Assembly (optional) → Connect to Robot → Connect to XML Preview or Viewer.
          <br /><br />
          <strong>Classic Workflow:</strong> Connect <b>URDF Link</b> nodes to <code>links</code> port and
          <b>URDF Joint</b> nodes to <code>joints</code> port of <b>URDF Robot</b>.
          Then connect <code>xml</code> output to <b>URDF XML</b> or <b>URDF Viewer</b>.
        </div>
      </div>
    </div>
  );
}

export default function UrdfFlowBuildSlide(props) {
  return (
    <ReactFlowProvider>
      <Inner {...props} />
    </ReactFlowProvider>
  );
}
