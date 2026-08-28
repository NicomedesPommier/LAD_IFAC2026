// components/ide/BlockCanvas.jsx
import React, { useCallback, useEffect, useMemo } from "react";
import PropTypes from "prop-types";
import {
  ReactFlow,
  Background,
  Controls,
  addEdge,
  useEdgesState,
  useNodesState,
  useReactFlow,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";

import { nodeTypes, defaultDataFor } from "../blocks";
import { syncUrdfDerived, syncJointStates } from "../blocks/urdf-helpers";
import { syncRos2Commands } from "../blocks/ros2-helpers";
import "./BlockCanvas.scss";

/**
 * Reusable block-based programming canvas using ReactFlow
 *
 * @param {Object} props
 * @param {Array} props.initialNodes - Initial nodes to render
 * @param {Array} props.initialEdges - Initial edges to connect nodes
 * @param {Object} props.palette - Block palette (nodeTypes)
 * @param {Function} props.onGraphChange - Callback when graph changes
 * @param {Function} props.onCodeGenerated - Callback with generated code
 * @param {Function} props.codeGenerator - Function to generate code from graph
 * @param {boolean} props.readOnly - Disable editing
 * @param {string} props.canvasId - Canvas/workspace ID for file operations
 * @param {Function} props.onExecute - Callback for executing commands from ConvertToCodeNode
 * @param {string} props.currentFile - Currently open file path
 * @param {Function} props.onFileSaved - Callback when a file is saved from Convert2Code node
 */
export function BlockCanvas({
  initialNodes = [],
  initialEdges = [],
  palette = {},
  onGraphChange,
  onCodeGenerated,
  codeGenerator,
  readOnly = false,
  className = "",
  canvasId,
  onExecute,
  currentFile,
  onFileSaved,
  isQCarMode = false,
}) {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const { screenToFlowPosition } = useReactFlow();

  // Internal clipboard for copy/paste of selected blocks
  const clipboardRef = React.useRef({ nodes: [], edges: [] });

  // Store nodes and edges in a ref to avoid re-creating getGraphSnapshot constantly
  const graphRef = React.useRef({ nodes: [], edges: [] });
  React.useEffect(() => {
    graphRef.current = { nodes, edges };
  }, [nodes, edges]);

  // Function to get current graph snapshot (for saving block metadata)
  // Use useRef to keep the same function reference
  const getGraphSnapshot = React.useCallback(() => {
    const { nodes: currentNodes, edges: currentEdges } = graphRef.current;
    return {
      nodes: currentNodes.map(n => ({
        id: n.id,
        type: n.type,
        position: n.position,
        data: {
          // Only save the data properties, not the callbacks
          ...Object.keys(n.data || {}).reduce((acc, key) => {
            if (typeof n.data[key] !== 'function') {
              acc[key] = n.data[key];
            }
            return acc;
          }, {}),
        },
        style: n.style,
      })),
      edges: currentEdges.map(e => ({
        id: e.id,
        source: e.source,
        target: e.target,
        sourceHandle: e.sourceHandle,
        targetHandle: e.targetHandle,
        type: e.type,
      })),
    };
  }, []); // Empty deps - function never changes

  // Notify parent of graph changes
  useEffect(() => {
    if (onGraphChange) {
      onGraphChange({ nodes, edges });
    }
  }, [nodes, edges, onGraphChange]);

  // Generate code when graph changes
  useEffect(() => {
    if (codeGenerator && onCodeGenerated) {
      const code = codeGenerator(nodes, edges);
      onCodeGenerated(code);
    }
  }, [nodes, edges, codeGenerator, onCodeGenerated]);

  // Sync URDF XML to viewer nodes when graph changes
  useEffect(() => {
    syncUrdfDerived(nodes, edges, setNodes);
  }, [nodes, edges, setNodes]);

  // Sync joint states from control nodes to viewer nodes
  useEffect(() => {
    syncJointStates(nodes, edges, setNodes);
  }, [nodes, edges, setNodes]);

  // Sync ROS2 commands to toCode nodes when graph changes
  useEffect(() => {
    syncRos2Commands(nodes, edges, setNodes);
  }, [nodes, edges, setNodes]);

  // Connection handler
  const onConnect = useCallback(
    (params) => {
      if (readOnly) return;
      setEdges((eds) => addEdge({ ...params, type: "smoothstep" }, eds));
    },
    [readOnly, setEdges]
  );

  // Node data change handler
  const onNodeDataChange = useCallback(
    (id, patch) => {
      if (readOnly) return;
      setNodes((nds) =>
        nds.map((n) => {
          if (n.id !== id) return n;
          const curr = n.data || {};

          // Check if data actually changed
          let changed = false;
          for (const k of Object.keys(patch)) {
            const a = curr[k];
            const b = patch[k];
            const same =
              Array.isArray(a) || Array.isArray(b)
                ? JSON.stringify(a) === JSON.stringify(b)
                : a === b;
            if (!same) {
              changed = true;
              break;
            }
          }

          if (!changed) return n;
          return { ...n, data: { ...curr, ...patch } };
        })
      );
    },
    [readOnly, setNodes]
  );

  // Drag and drop handlers
  const onDrop = useCallback(
    (evt) => {
      if (readOnly) return;
      evt.preventDefault();

      const type = evt.dataTransfer.getData("application/rf-node");
      if (!type) return;

      const position = screenToFlowPosition({
        x: evt.clientX,
        y: evt.clientY,
      });

      // Create node with proper styling for nodes that need fixed dimensions
      let nodeStyle;
      if (type === "urdfViewer") {
        nodeStyle = { width: 600, height: 650 };
      } else if (type === "urdfXmlPreview") {
        nodeStyle = { width: 600, height: 550 };
      } else if (type === "urdfControl") {
        nodeStyle = { width: 450, height: 600 };
      }

      // Custom nodes carry their full definition in drag data
      let extraData = {};
      if (type === "customNode") {
        try {
          const raw = evt.dataTransfer.getData("application/rf-node-definition");
          if (raw) extraData = { definition: JSON.parse(raw) };
        } catch {}
      }

      setNodes((nds) => [
        ...nds,
        {
          id: `${type}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
          type,
          position,
          data: { ...defaultDataFor(type), ...extraData, onChange: onNodeDataChange, canvasId, onExecute, currentFile, onFileSaved, getGraphSnapshot, isQCarMode },
          style: nodeStyle,
        },
      ]);
    },
    [readOnly, screenToFlowPosition, setNodes, onNodeDataChange, canvasId, onExecute, currentFile, onFileSaved, getGraphSnapshot, isQCarMode]
  );

  // Also memoize the callback dependencies to prevent re-renders

  const onDragOver = useCallback(
    (evt) => {
      if (readOnly) return;
      evt.preventDefault();
      evt.dataTransfer.dropEffect = "move";
    },
    [readOnly]
  );

  // Copy currently-selected nodes (and edges between them) into the clipboard.
  // Strip runtime callbacks/non-serializable data so paste re-injects fresh ones.
  const copySelection = useCallback(() => {
    const { nodes: currentNodes, edges: currentEdges } = graphRef.current;
    const selected = currentNodes.filter((n) => n.selected);
    if (selected.length === 0) return;

    const selectedIds = new Set(selected.map((n) => n.id));
    clipboardRef.current = {
      nodes: selected.map((n) => ({
        type: n.type,
        position: n.position,
        style: n.style,
        data: Object.keys(n.data || {}).reduce((acc, key) => {
          if (typeof n.data[key] !== "function") acc[key] = n.data[key];
          return acc;
        }, {}),
        // original id is kept only to remap edges on paste
        _srcId: n.id,
      })),
      edges: currentEdges.filter(
        (e) => selectedIds.has(e.source) && selectedIds.has(e.target)
      ),
    };
  }, []);

  // Paste clipboard contents: new ids, offset position, re-injected callbacks,
  // and edges remapped onto the new ids. Pasted nodes become the new selection.
  const pasteClipboard = useCallback(() => {
    if (readOnly) return;
    const { nodes: clipNodes, edges: clipEdges } = clipboardRef.current;
    if (!clipNodes || clipNodes.length === 0) return;

    const OFFSET = 40;
    const idMap = new Map();
    const stamp = Date.now();

    const newNodes = clipNodes.map((n) => {
      const newId = `${n.type}-${stamp}-${Math.random().toString(36).slice(2, 8)}`;
      idMap.set(n._srcId, newId);
      return {
        id: newId,
        type: n.type,
        position: { x: n.position.x + OFFSET, y: n.position.y + OFFSET },
        style: n.style,
        selected: true,
        data: {
          ...n.data,
          onChange: onNodeDataChange,
          canvasId,
          onExecute,
          currentFile,
          onFileSaved,
          getGraphSnapshot,
          isQCarMode,
        },
      };
    });

    const newEdges = (clipEdges || []).map((e) => ({
      ...e,
      id: `edge-${stamp}-${Math.random().toString(36).slice(2, 8)}`,
      source: idMap.get(e.source),
      target: idMap.get(e.target),
      selected: false,
    }));

    // Deselect existing nodes so the pasted copies are the active selection.
    setNodes((nds) => [
      ...nds.map((n) => (n.selected ? { ...n, selected: false } : n)),
      ...newNodes,
    ]);
    if (newEdges.length > 0) setEdges((eds) => [...eds, ...newEdges]);
  }, [
    readOnly,
    onNodeDataChange,
    canvasId,
    onExecute,
    currentFile,
    onFileSaved,
    getGraphSnapshot,
    isQCarMode,
    setNodes,
    setEdges,
  ]);

  // Keyboard shortcuts: Ctrl/Cmd+C copy, Ctrl/Cmd+V paste.
  // Ignore when typing in an input/textarea/contentEditable inside a node.
  useEffect(() => {
    if (readOnly) return;
    const onKeyDown = (evt) => {
      const mod = evt.ctrlKey || evt.metaKey;
      if (!mod) return;

      const t = evt.target;
      const tag = t?.tagName;
      const isEditable =
        tag === "INPUT" ||
        tag === "TEXTAREA" ||
        tag === "SELECT" ||
        t?.isContentEditable;
      if (isEditable) return;

      const key = evt.key.toLowerCase();
      if (key === "c") {
        copySelection();
      } else if (key === "v") {
        evt.preventDefault();
        pasteClipboard();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [readOnly, copySelection, pasteClipboard]);

  // Update nodes when initialNodes change (for loading saved graphs)
  // Use a ref to track if we've already initialized to prevent loops
  const initializedRef = React.useRef(false);

  useEffect(() => {
    // Only update if initialNodes actually changed (not just a re-render)
    if (initialNodes.length > 0 && !initializedRef.current) {
      initializedRef.current = true;
      setNodes(
        initialNodes.map((n) => {
          // Ensure proper styling for nodes that need fixed dimensions
          let nodeStyle = n.style;
          if (!n.style) {
            if (n.type === "urdfViewer") {
              nodeStyle = { width: 600, height: 650 };
            } else if (n.type === "urdfXmlPreview") {
              nodeStyle = { width: 600, height: 550 };
            } else if (n.type === "urdfControl") {
              nodeStyle = { width: 450, height: 600 };
            }
          }

          return {
            ...n,
            data: { ...n.data, onChange: onNodeDataChange, canvasId, onExecute, currentFile, onFileSaved, getGraphSnapshot, isQCarMode },
            style: nodeStyle,
          };
        })
      );
    }
  }, [initialNodes.length]); // Only depend on length, not the whole array

  // Reset initialized flag when currentFile changes
  useEffect(() => {
    initializedRef.current = false;
  }, [currentFile]);

  useEffect(() => {
    if (initialEdges.length > 0) {
      setEdges(initialEdges);
    }
  }, [initialEdges.length]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className={`block-canvas ${className}`}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={readOnly ? undefined : onNodesChange}
        onEdgesChange={readOnly ? undefined : onEdgesChange}
        onConnect={onConnect}
        nodeTypes={nodeTypes}
        onDrop={onDrop}
        onDragOver={onDragOver}
        fitView
        minZoom={0.05}
        maxZoom={4}
        defaultViewport={{ x: 0, y: 0, zoom: 0.8 }}
        proOptions={{ hideAttribution: true }}
        deleteKeyCode={readOnly ? [] : ["Backspace", "Delete"]}
        nodesDraggable={!readOnly}
        nodesConnectable={!readOnly}
        elementsSelectable={!readOnly}
        className="block-canvas__inner"
      >
        <Background />
        <Controls showInteractive={!readOnly} />
      </ReactFlow>
    </div>
  );
}

BlockCanvas.propTypes = {
  initialNodes: PropTypes.array,
  initialEdges: PropTypes.array,
  palette: PropTypes.object,
  onGraphChange: PropTypes.func,
  onCodeGenerated: PropTypes.func,
  codeGenerator: PropTypes.func,
  readOnly: PropTypes.bool,
  className: PropTypes.string,
  canvasId: PropTypes.string,
  onExecute: PropTypes.func,
  currentFile: PropTypes.string,
  onFileSaved: PropTypes.func,
};

export default BlockCanvas;
