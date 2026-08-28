// src/levels/slidesTransformations/06-BuildCarWithTF.jsx
import React, { useCallback, useState, useMemo, useEffect } from "react";
import { useProgress } from "../../context/ProgressContext";
import { useRoslib } from "../../hooks/useRoslib";
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
import {
  syncTfData,
  generateTfStaticCommand,
} from "../../components/blocks/tf-helpers";
import RVizTFViewer from "../../components/visualization/RVizTFViewer";
import ROSLIB from "roslib";
import "../../styles/_rosflow.scss";
import "../../styles/pages/_tf2-example.scss";

export const meta = {
  id: "build-car-with-tf",
  title: "Build a Car with TF Frames",
  order: 6,
  objectiveCode: "tf-sensor-alignment-3",
};

function Inner({ onObjectiveHit, goNext }) {
  const { ros, connected } = useRoslib();
  const { hitObjective } = useProgress();
  const [completed, setCompleted] = useState(false);
  const [instructionsCollapsed, setInstructionsCollapsed] = useState(false);

  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const { screenToFlowPosition } = useReactFlow();

  // Track detected TF frames
  const [detectedFrames, setDetectedFrames] = useState([]);

  // Compute URDF XML from graph
  const urdfDeriv = useMemo(() => computeUrdfXml(nodes, edges), [nodes, edges]);

  // Sync URDF XML to relevant nodes
  useEffect(() => {
    syncUrdfDerived(nodes, edges, setNodes);
  }, [nodes, edges, setNodes]);

  // Sync TF data (center of mass calculations, etc.)
  useEffect(() => {
    syncTfData(nodes, edges, setNodes);
  }, [nodes, edges, setNodes]);

  // Handle node connections
  const onConnect = useCallback(
    (p) => setEdges((eds) => addEdge({ ...p, type: "smoothstep" }, eds)),
    [setEdges]
  );

  // Handle node data changes
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

  // Initial nodes - empty canvas for student to build
  const initialNodes = useMemo(() => [], []);

  useEffect(() => setNodes(initialNodes), [initialNodes, setNodes]);

  // Handle drag and drop from palette
  const onDrop = useCallback(
    (evt) => {
      evt.preventDefault();
      const t = evt.dataTransfer.getData("application/rf-node");
      if (!t) return;

      const position = screenToFlowPosition({
        x: evt.clientX,
        y: evt.clientY,
      });

      setNodes((nds) => [
        ...nds,
        {
          id: `n-${Date.now()}`,
          type: t,
          position,
          data: { ...defaultDataFor(t), onChange: onNodeDataChange },
        },
      ]);
    },
    [screenToFlowPosition, setNodes, onNodeDataChange]
  );

  const onDragOver = useCallback((evt) => {
    evt.preventDefault();
    evt.dataTransfer.dropEffect = "move";
  }, []);

  // Handle TF frames update from RViz
  const handleFramesUpdate = useCallback((frames) => {
    setDetectedFrames(frames);
  }, []);

  // Broadcast TF frames to ROS when graph changes
  useEffect(() => {
    if (!ros?.current || !connected) return;

    // Extract TF frames from graph
    const tfFrameNodes = nodes.filter((n) =>
      n.type === "tfFrame" || n.type === "tfChild"
    );

    if (tfFrameNodes.length === 0) return;

    // Create TF static publisher for each frame
    const publishers = [];

    for (const tfNode of tfFrameNodes) {
      // Find parent frame
      let parentFrameId = "world";
      const parentEdges = edges.filter((e) =>
        e.target === tfNode.id && e.targetHandle === "parent_frame"
      );

      if (parentEdges.length > 0) {
        const parentNode = nodes.find((n) => n.id === parentEdges[0].source);
        if (parentNode) {
          if (parentNode.type === "tfWorld") {
            parentFrameId = parentNode.data?.frameId || "world";
          } else if (parentNode.type === "tfFrame") {
            parentFrameId = parentNode.data?.frameId || "world";
          }
        }
      }

      const frameId = tfNode.data?.childFrameId || tfNode.data?.frameId;
      if (!frameId) continue;

      const position = tfNode.data?.position || { x: 0, y: 0, z: 0 };
      const rotation = tfNode.data?.rotation || { roll: 0, pitch: 0, yaw: 0 };
      const broadcastType = tfNode.data?.broadcastType || "static";

      // Convert RPY to quaternion (simplified - using identity for now)
      // In production, would use tf_transformations library
      const quat = {
        x: Math.sin(rotation.roll / 2) * Math.cos(rotation.pitch / 2) * Math.cos(rotation.yaw / 2) -
           Math.cos(rotation.roll / 2) * Math.sin(rotation.pitch / 2) * Math.sin(rotation.yaw / 2),
        y: Math.cos(rotation.roll / 2) * Math.sin(rotation.pitch / 2) * Math.cos(rotation.yaw / 2) +
           Math.sin(rotation.roll / 2) * Math.cos(rotation.pitch / 2) * Math.sin(rotation.yaw / 2),
        z: Math.cos(rotation.roll / 2) * Math.cos(rotation.pitch / 2) * Math.sin(rotation.yaw / 2) -
           Math.sin(rotation.roll / 2) * Math.sin(rotation.pitch / 2) * Math.cos(rotation.yaw / 2),
        w: Math.cos(rotation.roll / 2) * Math.cos(rotation.pitch / 2) * Math.cos(rotation.yaw / 2) +
           Math.sin(rotation.roll / 2) * Math.sin(rotation.pitch / 2) * Math.sin(rotation.yaw / 2),
      };

      // Create TF message
      const topicName = broadcastType === "static" ? "/tf_static" : "/tf";
      const topic = new ROSLIB.Topic({
        ros: ros.current,
        name: topicName,
        messageType: "tf2_msgs/TFMessage",
      });

      const transform = {
        transforms: [{
          header: {
            frame_id: parentFrameId,
            stamp: { sec: 0, nanosec: 0 }, // Will be filled by publisher
          },
          child_frame_id: frameId,
          transform: {
            translation: {
              x: position.x,
              y: position.y,
              z: position.z,
            },
            rotation: quat,
          },
        }],
      };

      // Publish transform
      const message = new ROSLIB.Message(transform);
      topic.publish(message);

      publishers.push(topic);
    }

    // Cleanup
    return () => {
      publishers.forEach((pub) => pub.unadvertise());
    };
  }, [nodes, edges, ros, connected]);

  // Check completion: need at least 4 TF frames (world + car body + 2 wheels)
  const isObjectiveComplete = detectedFrames.length >= 4;

  // Handle completion
  const handleComplete = useCallback(() => {
    if (completed) return;

    console.log(`[Build Car with TF] Completed - Detected ${detectedFrames.length} frames`);
    setCompleted(true);

    if (meta.objectiveCode && hitObjective) {
      hitObjective(meta.objectiveCode);
    }

    if (onObjectiveHit) {
      onObjectiveHit(meta.objectiveCode);
    }

    if (goNext) {
      setTimeout(() => goNext(), 2000);
    }
  }, [completed, detectedFrames, hitObjective, onObjectiveHit, goNext]);

  // Auto-complete when objective is met
  useEffect(() => {
    if (isObjectiveComplete && !completed) {
      handleComplete();
    }
  }, [isObjectiveComplete, completed, handleComplete]);

  return (
    <div className="tf2-example">
      {/* Header */}
      <header className="tf2-example__header">
        <h2 className="tf2-example__title">Build a Car with TF Frames</h2>
        <div className="tf2-example__actions">
          <div style={{ fontSize: "0.85rem", marginRight: "1rem", opacity: 0.8 }}>
            TF Frames: <strong>{detectedFrames.length}/4+</strong>
            {isObjectiveComplete && " ✅"}
          </div>
          <button
            className={`btn btn--small ${completed ? 'btn--success' : isObjectiveComplete ? 'btn--primary' : ''}`}
            onClick={handleComplete}
            disabled={completed}
          >
            {completed ? '✅ Completed!' : isObjectiveComplete ? '✓ Complete' : '⏳ In Progress'}
          </button>
        </div>
      </header>

      {/* Instructions Row */}
      <section className={`tf2-example__instructions ${instructionsCollapsed ? 'collapsed' : ''}`}>
        <div className="tf2-example__instructions-header">
          <span className="tf2-example__panel-title">📝 Instructions</span>
          <button
            className="tf2-example__collapse-btn"
            onClick={() => setInstructionsCollapsed(!instructionsCollapsed)}
            title={instructionsCollapsed ? "Expand" : "Collapse"}
          >
            {instructionsCollapsed ? '▼' : '▲'}
          </button>
        </div>
        {!instructionsCollapsed && (
          <div className="tf2-example__instructions-content">
            <div className="tf2-example__instructions-grid">
              <div className="tf2-example__intro-section">
                <p className="tf2-example__intro">
                  Build a simple car robot using URDF blocks and add TF frames to visualize the transform hierarchy.
                  Create a car body and 2 wheels, then add TF frames for each component.
                </p>
              </div>

              <div className="tf2-example__steps-section">
                <ol className="tf2-example__steps">
                  <li>
                    <strong>Create Geometries:</strong>
                    <p className="hint">Drag 3 "Geometry" blocks: 1 box for car body, 2 cylinders for wheels</p>
                  </li>
                  <li>
                    <strong>Calculate Center of Mass:</strong>
                    <p className="hint">Connect each geometry to a "Center of Mass" block to find the center point</p>
                  </li>
                  <li>
                    <strong>Create TF World Frame:</strong>
                    <p className="hint">Drag a "World Frame" block - this is the root of your TF tree</p>
                  </li>
                  <li>
                    <strong>Add Car Body TF Frame:</strong>
                    <p className="hint">Connect "World Frame" → "TF Frame" → use center from car body geometry</p>
                  </li>
                  <li>
                    <strong>Add Wheel TF Frames:</strong>
                    <p className="hint">Use "Child Frame" blocks for each wheel, connected to car body frame</p>
                  </li>
                  <li>
                    <strong>Build URDF (Optional):</strong>
                    <p className="hint">Create Visual/Link/Assembly/Robot nodes to see the car in 3D</p>
                  </li>
                </ol>
              </div>

              <div className="tf2-example__concepts-section">
                <div className="tf2-example__concepts">
                  <h4>🧠 Key Concepts</h4>
                  <div className="tf2-example__concept">
                    <strong>🌍 World Frame:</strong> Root coordinate system for your robot
                  </div>
                  <div className="tf2-example__concept">
                    <strong>⚖️ Center of Mass:</strong> Extracts center point from geometry for TF positioning
                  </div>
                  <div className="tf2-example__concept">
                    <strong>📐 TF Frame:</strong> Transform frame with position and rotation
                  </div>
                  <div className="tf2-example__concept">
                    <strong>🔗 Child Frame:</strong> Frame positioned relative to parent frame
                  </div>
                  <div className="tf2-example__concept">
                    <strong>🎯 Objective:</strong> See 4+ frames in RViz viewer (world + body + 2 wheels)
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </section>

      {/* Main Layout - 2 Column: Block Canvas + RViz */}
      <div className="tf2-example__layout">
        {/* Left Column: Block Canvas */}
        <main className="tf2-example__ide-container">
          <div className="rfp-wrap" style={{ height: "100%", display: "flex", flexDirection: "column" }}>
            {/* Palette */}
            <CategorizedPalette
              categories={paletteCategorized}
              defaultCategory="TF"
            />

            {/* Block Canvas */}
            <div style={{ flex: 1, position: "relative", minHeight: 0 }}>
              <ReactFlow
                nodes={nodes}
                edges={edges}
                onNodesChange={onNodesChange}
                onEdgesChange={onEdgesChange}
                onConnect={onConnect}
                onDrop={onDrop}
                onDragOver={onDragOver}
                nodeTypes={nodeTypes}
                fitView
                fitViewOptions={{ padding: 0.2 }}
              >
                <Background color="#333" gap={16} />
                <Controls />
              </ReactFlow>
            </div>

            {/* Stats Bar */}
            <div style={{
              padding: "0.75rem",
              background: "var(--bg-secondary, #1a1a1a)",
              borderTop: "1px solid var(--border, #333)",
              display: "flex",
              gap: "1rem",
              fontSize: "0.85rem",
              flexShrink: 0
            }}>
              <div>
                <strong>Nodes:</strong> {nodes.length}
              </div>
              <div>
                <strong>Connections:</strong> {edges.length}
              </div>
              <div>
                <strong>TF Frames Detected:</strong> <span style={{ color: isObjectiveComplete ? "#00ff00" : "#7df9ff" }}>{detectedFrames.length}</span>
              </div>
            </div>
          </div>
        </main>

        {/* Right Column: RViz Visualizer */}
        <RVizTFViewer
          ros={ros?.current}
          connected={connected}
          fixedFrame="world"
          showGrid={true}
          showAxes={true}
          axisLength={0.3}
          showFrameControls={true}
          className="rviz-tf-viewer--sidebar"
          onFramesUpdate={handleFramesUpdate}
        />
      </div>
    </div>
  );
}

export default function BuildCarWithTF(props) {
  return (
    <ReactFlowProvider>
      <Inner {...props} />
    </ReactFlowProvider>
  );
}
