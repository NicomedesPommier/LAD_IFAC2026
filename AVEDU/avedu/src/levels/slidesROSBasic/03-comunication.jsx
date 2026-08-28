import React, { useCallback, useEffect, useState, useMemo } from "react";
import {
  ReactFlow,
  Background,
  Controls,
  Handle,
  addEdge,
  useEdgesState,
  useNodesState,
  MarkerType,
  BaseEdge,
  getSmoothStepPath,
  Position,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import "../../styles/_rosflow.scss";

export const meta = {
  id: "connect-game",
  title: "Mini game: Connect the flow",
  order: 3,
  objectiveCode: "ros-slide-connect-game",
};

/** Arista simple sin pelota */
function SimpleEdge(props) {
  const { id, sourceX, sourceY, targetX, targetY, sourcePosition, targetPosition } = props;
  const [edgePath] = getSmoothStepPath({
    sourceX,
    sourceY,
    targetX,
    targetY,
    sourcePosition,
    targetPosition,
  });
  return <BaseEdge id={id} path={edgePath} />;
}

/** Arista “fantasma” que renderiza UNA sola pelota siguiendo P→N y, si existe, N→S */
function PacketEdge(props) {
  const { id, data } = props;
  const { p, n, s, hasPubToNode, hasNodeToSub } = data || {};

  if (!hasPubToNode) return null;

  const [pathPN] = getSmoothStepPath({
    sourceX: p.x,
    sourceY: p.y,
    targetX: n.x,
    targetY: n.y,
    sourcePosition: Position.Right,
    targetPosition: Position.Left,
  });

  let combinedPath = pathPN;
  if (hasNodeToSub) {
    const [pathNS] = getSmoothStepPath({
      sourceX: n.x,
      sourceY: n.y,
      targetX: s.x,
      targetY: s.y,
      sourcePosition: Position.Right,
      targetPosition: Position.Left,
    });
    combinedPath = `${pathPN} ${pathNS}`;
  }

  return (
    <>
      <BaseEdge id={`${id}-invisible`} path={combinedPath} style={{ stroke: "transparent" }} />
      <circle r="8" fill="url(#pktGrad)">
        <animateMotion dur="2s" repeatCount="indefinite" path={combinedPath} />
      </circle>
      <defs>
        <linearGradient id="pktGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#7df9ff" />
          <stop offset="100%" stopColor="#ff5cf4" />
        </linearGradient>
      </defs>
    </>
  );
}

function IoNode({ data, isConnectable }) {
  return (
    <div className="io-node">
      <div>{data.label}</div>
      {data.showLeft && <Handle type="target" position="left" id="left" isConnectable={isConnectable} />}
      {data.showRight && <Handle type="source" position="right" id="right" isConnectable={isConnectable} />}
    </div>
  );
}

const nodeTypes = { ioNode: IoNode };
const edgeTypes = { simple: SimpleEdge, packet: PacketEdge };

export default function Game({ onObjectiveHit }) {
  const P = { x: 50, y: 100 };
  const N = { x: 300, y: 100 };
  const S = { x: 560, y: 100 };

  const initialNodes = useMemo(() => ([
    { id: "pub", type: "ioNode", position: P, data: { label: "Publisher", showRight: true } },
    { id: "node", type: "ioNode", position: N, data: { label: "Node", showLeft: true, showRight: true } },
    { id: "sub", type: "ioNode", position: S, data: { label: "Subscriber", showLeft: true } },
  ]), []);

  // 🔹 Solo guardamos en estado LAS CONEXIONES reales del usuario
  const [nodes, , onNodesChange] = useNodesState(initialNodes);
  const [connEdges, setConnEdges, onEdgesChange] = useEdgesState([]); // no incluye la arista "packet"
  const [canSend, setCanSend] = useState(false);
  const [validated, setValidated] = useState(false);

  const onConnect = useCallback(
    (params) => {
      setConnEdges((eds) =>
        addEdge(
          {
            ...params,
            type: "simple",
            markerEnd: { type: MarkerType.ArrowClosed, width: 18, height: 18 },
            style: { stroke: "rgba(255,255,255,.65)", strokeWidth: 2 },
          },
          eds
        )
      );
    },
    [setConnEdges]
  );

  // 🔹 Derivamos flags y posiciones SIN setState en edges
  const { hasPubToNode, hasNodeToSub, pPos, nPos, sPos } = useMemo(() => {
    const hasP2N = connEdges.some((e) => e.source === "pub" && e.target === "node");
    const hasN2S = connEdges.some((e) => e.source === "node" && e.target === "sub");
    const pub = nodes.find((n) => n.id === "pub")?.position ?? P;
    const nod = nodes.find((n) => n.id === "node")?.position ?? N;
    const sub = nodes.find((n) => n.id === "sub")?.position ?? S;
    return { hasPubToNode: hasP2N, hasNodeToSub: hasN2S, pPos: pub, nPos: nod, sPos: sub };
  }, [connEdges, nodes]);

  useEffect(() => {
    setCanSend(hasPubToNode && hasNodeToSub);
  }, [hasPubToNode, hasNodeToSub]);

  // 🔹 Construimos la arista "packet" como derivada (no en estado)
  const packetEdge = useMemo(
    () => ({
      id: "packet",
      source: "pub",
      target: "sub",
      type: "packet",
      style: { stroke: "transparent" },
      data: {
        p: pPos,
        n: nPos,
        s: sPos,
        hasPubToNode,
        hasNodeToSub,
      },
    }),
    [pPos, nPos, sPos, hasPubToNode, hasNodeToSub]
  );

  const handleValidate = () => {
    if (!canSend) return;
    if (!validated) {
      setValidated(true);
      onObjectiveHit?.(meta.objectiveCode);
    }
  };

  return (
    <div className="slide-wrap slide-gap-md">
      <h2>{meta.title}</h2>
      <div className="slide-card slide-card--highlight slide-p-0 slide-overflow-hidden slide-h-300">
        <ReactFlow
          nodes={nodes}
          edges={[...connEdges, packetEdge]}  // 👈 renderizamos conexiones + la arista derivada
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          nodeTypes={nodeTypes}
          edgeTypes={edgeTypes}
          fitView
          fitViewOptions={{ padding: 0.18 }}
          className="bg-dots"
        >
          <Background color="rgba(255, 255, 255, 0.1)" gap={20} />
          <Controls className="react-flow__controls-dark" />
        </ReactFlow>
      </div>

      <div className="slide-flex slide-gap-sm slide-items-center slide-flex--wrap">
        <button
          className="btn btn--primary"
          onClick={handleValidate}
          disabled={!canSend}
        >
          {validated ? "¡Conexión validada!" : "Validar y enviar"}
        </button>
        {!canSend && (
          <span className="slide-muted slide-text--sm">
            Conecta <b>Publisher → Node</b> y <b>Node → Subscriber</b>.
          </span>
        )}
      </div>

      {validated && (
        <div className="slide-card slide-card--success slide-mt-md">
          <div className="slide-card__title">¡Excelente!</div>
          <p>
            Has conectado los nodos correctamente. Observa cómo el mensaje viaja del Publicador al Suscriptor.
          </p>
        </div>
      )}
    </div>
  );
}

