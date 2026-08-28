import React, { useCallback, useMemo } from "react";
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
import "../../styles/_rosflow.scss";

export const meta = {
  id: "rf-create-package",
  title: "Crear paquete (React Flow)",
  order: 6,
  objectiveCode: "ros-slide-rf-create-package",
};

// ---- constantes/ayudas estables (fuera de componentes) ----
const DELETE_KEYS = ["Backspace", "Delete"];

// ===== helpers existentes =====
function buildCreatePkgCmd({ pkgName, nodeName, lang, buildType, deps }) {
  const bt = buildType || (lang === "cpp" ? "ament_cmake" : "ament_python");
  const depsList = (deps || []).filter(Boolean).join(" ");
  const depsPart = depsList ? ` --dependencies ${depsList}` : "";
  const nodePart = nodeName ? ` --node-name ${nodeName}` : "";
  const pkgPart = pkgName || "my_ros2_package";
  return `ros2 pkg create --build-type ${bt}${nodePart} ${pkgPart}${depsPart}`;
}

// leer datos de createPackage via conexiones
function computePackageDataFor(id, nodes, edges) {
  const pkgNode = nodes.find((n) => n.id === id);
  if (!pkgNode) return null;
  const incoming = edges.filter((e) => e.target === id);

  const srcFor = (handleId) => {
    const ed = incoming.find((e) => e.targetHandle === handleId);
    if (!ed) return undefined;
    return nodes.find((n) => n.id === ed.source);
  };

  const base = pkgNode.data || {};
  let pkgName = base.pkgName || "";
  let nodeName = base.nodeName || "";
  let deps = Array.isArray(base.deps) ? base.deps : [];
  const lang = base.lang || "python";
  const buildType = base.buildType || (lang === "cpp" ? "ament_cmake" : "ament_python");

  const pkgSrc = srcFor("pkgName");
  if (pkgSrc?.type === "string" && pkgSrc.data?.value) pkgName = String(pkgSrc.data.value);

  const nodeSrc = srcFor("nodeName");
  if (nodeSrc?.type === "string" && nodeSrc.data?.value) nodeName = String(nodeSrc.data.value);

  const depsSrc = srcFor("deps");
  if (depsSrc?.type === "listDeps" && Array.isArray(depsSrc.data?.deps)) deps = depsSrc.data.deps;

  return { pkgName, nodeName, deps, lang, buildType };
}

// convertir cualquier nodo a “línea(s) de código”
function nodeToCode(n, nodes, edges) {
  if (!n) return "";
  if (n.type === "createPackage") {
    const data = computePackageDataFor(n.id, nodes, edges);
    if (!data) return "";
    return buildCreatePkgCmd(data);
  }
  if (n.type === "rosRun") {
    const d = n.data || {};
    const ns = d.ns ? ` --ros-args --remap __ns:=${d.ns}` : "";
    const args = Array.isArray(d.args) && d.args.length ? ` ${d.args.join(" ")}` : "";
    if (!d.pkg || !d.exe) return "";
    return `ros2 run ${d.pkg} ${d.exe}${ns}${args}`;
  }
  return "";
}

// Construye el texto final desde el/los Convert2Code y cuenta entradas
function computeConvert2CodeText(nodes, edges) {
  const codeNodes = nodes.filter((n) => n.type === "toCode");
  if (!codeNodes.length) return { linesText: "", counts: {} };

  const target = codeNodes[0];
  const incoming = edges.filter((e) => e.target === target.id);

  const sources = incoming
    .map((e) => nodes.find((n) => n.id === e.source))
    .filter(Boolean)
    .sort((a, b) => a.position.y - b.position.y);

  const lines = sources
    .map((n) => nodeToCode(n, nodes, edges))
    .filter((s) => s && s.trim().length > 0);

  const counts = { [target.id]: incoming.length };
  return { linesText: lines.join("\n"), counts };
}

export default function PackageCreatorFlowSlide(props) {
  return (
    <ReactFlowProvider>
      <Inner {...props} />
    </ReactFlowProvider>
  );
}

function Inner({ onObjectiveHit }) {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const { screenToFlowPosition } = useReactFlow();

  const onConnect = useCallback(
    (params) => setEdges((eds) => addEdge({ ...params, type: "smoothstep" }, eds)),
    []
  );

  const onNodeDataChange = useCallback(
    (id, next) => {
      setNodes((nds) =>
        nds.map((n) => {
          if (n.id !== id) return n;
          const curr = n.data || {};
          // sólo actualizar si realmente cambió algo
          const changed = Object.keys(next).some((k) => {
            const a = curr[k];
            const b = next[k];
            return Array.isArray(a) || Array.isArray(b)
              ? JSON.stringify(a) !== JSON.stringify(b)
              : a !== b;
          });
          return changed ? { ...n, data: { ...curr, ...next } } : n;
        })
      );
    },
    [setNodes]
  );

  const initialNodes = useMemo(
    () => [
      {
        id: "pkg-1",
        type: "createPackage",
        position: { x: 380, y: 120 },
        data: { ...defaultDataFor("createPackage"), onChange: onNodeDataChange },
      },
      {
        id: "code-1",
        type: "toCode",
        position: { x: 740, y: 160 },
        data: { ...defaultDataFor("toCode"), onChange: onNodeDataChange },
      },
    ],
    [onNodeDataChange]
  );

  React.useEffect(() => {
    setNodes(initialNodes);
  }, [initialNodes, setNodes]);

  // ==== texto para Convert2Code + contador ====
  const { linesText, counts } = computeConvert2CodeText(nodes, edges);

  // Actualiza SOLO los toCode si cambió inCount o preview
  React.useEffect(() => {
    setNodes((nds) => {
      let changed = false;
      const next = nds.map((n) => {
        if (n.type !== "toCode") return n;
        const nextCount = counts[n.id] || 0;
        const prevCount = Number(n.data?.inCount || 0);
        const prevPreview = n.data?.preview || "";
        const nextPreview = linesText;

        if (prevCount !== nextCount || prevPreview !== nextPreview) {
          changed = true;
          return {
            ...n,
            data: { ...(n.data || {}), inCount: nextCount, preview: nextPreview },
          };
        }
        return n;
      });
      return changed ? next : nds;
    });
  }, [counts, linesText, setNodes]);

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

      let type = t;
      let extra = {};
      if (t.startsWith("string:")) {
        type = "string";
        const kind = t.split(":")[1];
        if (kind === "pkgName") extra = { label: "Package Name", placeholder: "my_ros2_package" };
        if (kind === "nodeName") extra = { label: "Node Name", placeholder: "my_node" };
      }
      if (t === "listDeps")
        extra = { title: "Dependencies", keyName: "deps", items: [], placeholder: "rclpy" };

      setNodes((nds) => [
        ...nds,
        {
          id: `n-${Date.now()}`,
          type,
          position,
          data: { ...defaultDataFor(type), ...extra, onChange: onNodeDataChange },
        },
      ]);
    },
    [screenToFlowPosition, setNodes, onNodeDataChange]
  );

  const onDragOver = useCallback((evt) => {
    evt.preventDefault();
    evt.dataTransfer.dropEffect = "move";
  }, []);

  // Terminal: refleja EXACTAMENTE el preview del primer toCode
  const toCodeNode = nodes.find((n) => n.type === "toCode");
  const cmd = toCodeNode?.data?.preview || "";
  const hasToCode = !!toCodeNode;
  const placeholder =
    "Arrastra un bloque Convert2Code y conéctale bloques para ver el comando.";

  const copy = async () => {
    try {
      if (cmd) await navigator.clipboard.writeText(cmd);
    } catch {}
  };
  const markDone = () => onObjectiveHit?.(meta.objectiveCode);

  return (
    <div className="rfp-wrap">
      {/* FRANJA 1: PALETTE */}
      <CategorizedPalette
        categories={paletteCategorized}
        defaultCategory="ROS"
      />

      {/* FRANJA 2: CANVAS */}
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
          deleteKeyCode={DELETE_KEYS}
        >
          <Background />
          <Controls />
        </ReactFlow>
      </div>

      {/* FRANJA 3: TERMINAL */}
      <div className="rfp-terminal">
        <div className="rfp-terminal__title">Comando</div>
        <pre className="rfp-terminal__code">
          {cmd || (hasToCode ? "# Conecta bloques al Convert2Code…" : `# ${placeholder}`)}
        </pre>
        <div className="rfp-terminal__actions">
          <button className="btn" onClick={copy} disabled={!cmd}>
            Copiar
          </button>
          <button className="btn" onClick={markDone} disabled={!cmd}>
            Marcar logrado
          </button>
        </div>
        <div className="rfp-terminal__hint">
          <strong>Workflow:</strong> Drag <b>Package Name</b>, <b>Node Name</b>, and <b>Dependencies</b> blocks
          and connect them to <b>Create Package</b> block. Then connect to <b>Convert2Code</b> to see the final command.
          <br />
          The terminal reflects exactly the content of the <b>Convert2Code</b> block.
        </div>
      </div>
    </div>
  );
}
