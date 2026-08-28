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
  id: "rf-run-turtlesim",
  title: "Correr Turtlesim con nodos conectados",
  order: 7,
  objectiveCode: "ros-slide-rf-run-turtlesim",
};

// ---- helpers ----
function computeRunData(nodes, edges) {
  const run = nodes.find((n) => n.type === "rosRun");
  if (!run) return { pkg: "", exe: "", ns: "", args: [], runId: null };

  const incoming = edges.filter((e) => e.target === run.id);
  const getSource = (handleId) => {
    const edge = incoming.find((e) => e.targetHandle === handleId);
    if (!edge) return undefined;
    const src = nodes.find((n) => n.id === edge.source);
    return src?.data;
  };

  const pkgData  = getSource("pkg");
  const exeData  = getSource("exe");
  const nsData   = getSource("ns");
  const argsData = getSource("args");

  return {
    pkg: String(pkgData?.value ?? run.data.pkg ?? ""),
    exe: String(exeData?.value ?? run.data.exe ?? ""),
    ns:  String(nsData?.value ?? run.data.ns ?? ""),
    args: Array.isArray(argsData?.args)
      ? argsData.args
      : Array.isArray(run.data.args) ? run.data.args : [],
    runId: run.id,
  };
}

function nodeToCode(node) {
  if (!node) return "";
  if (node.type === "rosRun") {
    const { pkg, exe, ns, args } = node.data;
    if (!pkg || !exe) return "";
    const nsPart = ns ? ` --ros-args -r __ns:=${ns}` : "";
    const argsPart = Array.isArray(args) && args.length ? ` ${args.join(" ")}` : "";
    return `ros2 run ${pkg} ${exe}${nsPart}${argsPart}`;
  }
  if (node.type === "createPackage") {
    const { pkgName, nodeName, buildType, deps } = node.data;
    if (!pkgName) return "";
    const depPart = Array.isArray(deps) && deps.length ? ` --dependencies ${deps.join(" ")}` : "";
    return `ros2 pkg create --build-type ${buildType} --node-name ${nodeName} ${pkgName}${depPart}`;
  }
  return "";
}

function computeToCodePreview(nodes, edges) {
  const toCode = nodes.find((n) => n.type === "toCode");
  if (!toCode) return { preview: "", inCount: 0 };

  const incoming = edges.filter((e) => e.target === toCode.id);
  const connectedNodes = incoming
    .map((e) => nodes.find((n) => n.id === e.source))
    .filter(Boolean);

  const lines = connectedNodes.map(nodeToCode).filter(Boolean);
  return { preview: lines.join("\n"), inCount: connectedNodes.length };
}

function Inner({ onObjectiveHit }) {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const { screenToFlowPosition } = useReactFlow();

  // Memoizamos derivadas para no recrearlas en cada render
  const runData = useMemo(() => computeRunData(nodes, edges), [nodes, edges]);
  const toCodeDeriv = useMemo(() => computeToCodePreview(nodes, edges), [nodes, edges]);

  // Espejo: sólo si cambia algún primitivo
  React.useEffect(() => {
    if (!runData.runId) return;
    const next = { pkg: runData.pkg, exe: runData.exe, ns: runData.ns, args: runData.args };

    setNodes((prev) => {
      let touched = false;
      const out = prev.map((n) => {
        if (n.id !== runData.runId) return n;
        const curr = n.data || {};
        const same =
          curr.pkg === next.pkg &&
          curr.exe === next.exe &&
          curr.ns === next.ns &&
          JSON.stringify(curr.args) === JSON.stringify(next.args);
        if (same) return n;
        touched = true;
        return { ...n, data: { ...curr, ...next } };
      });
      return touched ? out : prev;
    });
  }, [runData.runId, runData.pkg, runData.exe, runData.ns, JSON.stringify(runData.args), setNodes]);

  // Actualizar Convert2Code sólo si preview/inCount difieren
  React.useEffect(() => {
    setNodes((prev) => {
      let changed = false;
      const out = prev.map((n) => {
        if (n.type !== "toCode") return n;
        const curr = n.data || {};
        if (curr.preview === toCodeDeriv.preview && (curr.inCount || 0) === toCodeDeriv.inCount) {
          return n;
        }
        changed = true;
        return { ...n, data: { ...curr, preview: toCodeDeriv.preview, inCount: toCodeDeriv.inCount } };
      });
      return changed ? out : prev;
    });
  }, [toCodeDeriv.preview, toCodeDeriv.inCount, setNodes]);

  const onConnect = useCallback(
    (p) => setEdges((eds) => addEdge({ ...p, type: "smoothstep" }, eds)),
    []
  );

  const onNodeDataChange = useCallback((id, next) => {
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
          if (!same) { changed = true; break; }
        }
        if (!changed) return n;
        return { ...n, data: { ...curr, ...next } };
      })
    );
  }, [setNodes]);

  // Semilla
  const initialNodes = useMemo(() => {
    const mk = (type, x, y, extra = {}) => ({
      id: `${type}-${Math.random().toString(36).slice(2, 8)}`,
      type,
      position: { x, y },
      data: { ...defaultDataFor(type), onChange: onNodeDataChange, ...extra },
    });
    return [
      mk("string", 80, 80,  { label: "Package",    value: "turtlesim" }),
      mk("string", 80, 160, { label: "Executable", value: "turtlesim_node" }),
      mk("listArgs", 80, 240, {}),
      { id: "run-1", type: "rosRun", position: { x: 400, y: 150 }, data: { pkg: "", exe: "", ns: "", args: [] } },
      { id: "to-1",  type: "toCode", position: { x: 700, y: 200 }, data: { inCount: 0, preview: "" } },
    ];
  }, [onNodeDataChange]);

  React.useEffect(() => setNodes(initialNodes), [initialNodes, setNodes]);

  // Texto terminal = preview del Convert2Code
  const cmd = toCodeDeriv.preview;

  // DnD palette
  const onDrop = useCallback((evt) => {
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
      if (kind === "pkg") extra = { label: "Package", placeholder: "turtlesim" };
      if (kind === "exe") extra = { label: "Executable", placeholder: "turtlesim_node" };
      if (kind === "ns")  extra = { label: "Namespace", placeholder: "/demo" };
    }

    setNodes((nds) => [
      ...nds,
      { id: `n-${Date.now()}`, type, position, data: { ...defaultDataFor(t), onChange: onNodeDataChange, ...extra } },
    ]);
  }, [screenToFlowPosition, setNodes, onNodeDataChange]);

  const onDragOver = useCallback((evt) => { evt.preventDefault(); evt.dataTransfer.dropEffect = "move"; }, []);

  const copy = async () => { try { await navigator.clipboard.writeText(cmd); } catch {} };
  const markDone = () => onObjectiveHit?.(meta.objectiveCode);

  return (
    <div className="rfp-wrap">
      {/* FRANJA 1: PALETTE */}
      <CategorizedPalette
        categories={paletteCategorized}
        defaultCategory="ROS"
      />

      {/* FRANJA 2 */}
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

      {/* FRANJA 3 */}
      <div className="rfp-terminal">
        <div className="rfp-terminal__title">Comando generado</div>
        <pre className="rfp-terminal__code">{cmd || "(vacío)"}</pre>
        <div className="rfp-terminal__actions">
          <button className="btn" onClick={copy}>Copiar</button>
          <button className="btn" onClick={markDone}>Marcar logrado</button>
        </div>
        <div className="rfp-terminal__hint">
          <strong>Workflow:</strong> Drag <b>Package</b>, <b>Executable</b>, <b>Namespace</b>, and <b>Args</b> blocks
          and connect them to <b>ROS Run</b> block. Then connect to <b>Convert2Code</b> to generate the command.
          <br />
          The terminal shows the command generated by the <b>Convert2Code</b> block.
        </div>
      </div>
    </div>
  );
}

export default function RunTurtlesimFlowSlide(props) {
  return (
    <ReactFlowProvider>
      <Inner {...props} />
    </ReactFlowProvider>
  );
}
