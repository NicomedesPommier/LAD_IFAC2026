// src/levels/slidesTransformations/04-TF2Example.jsx
import React, { useCallback, useState } from "react";
import { useProgress } from "../../context/ProgressContext";
import { useRoslib } from "../../hooks/useRoslib";
import EmbeddedIDE from "../../components/ide/EmbeddedIDE";
import RVizTFViewer from "../../components/visualization/RVizTFViewer";
import "../../styles/_rosflow.scss";
import "../../styles/pages/_tf2-example.scss";

export const meta = {
  id: "tf2-example",
  title: "TF2 Interactive Example",
  order: 4,
  objectiveCode: "tf-importance-4",
};

export default function TF2Example({ onObjectiveHit, goNext }) {
  const { ros, connected } = useRoslib();
  const { hitObjective } = useProgress();
  const [completed, setCompleted] = useState(false);
  const [instructionsCollapsed, setInstructionsCollapsed] = useState(false);

  // Handle completion
  const handleComplete = useCallback(() => {
    if (completed) return;

    console.log(`[TF2 Example] Completed`);
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
  }, [completed, hitObjective, onObjectiveHit, goNext]);

  return (
    <div className="tf2-example">
      {/* Header */}
      <header className="tf2-example__header">
        <h2 className="tf2-example__title">TF2 Interactive Example</h2>
        <div className="tf2-example__actions">
          <button
            className={`btn btn--small ${completed ? 'btn--success' : ''}`}
            onClick={handleComplete}
            disabled={completed}
          >
            {completed ? '✅ Completed!' : '✓ Complete'}
          </button>
        </div>
      </header>

      {/* Instructions Row - Full Width at Top */}
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
                  Create a practical TF2 example with parent and child frames.
                  Use the terminal and file editor to build TF broadcasters.
                </p>
              </div>

              <div className="tf2-example__steps-section">
                <ol className="tf2-example__steps">
                  <li>
                    <strong>Create static TF broadcaster:</strong>
                    <div className="code-block">
                      <code>ros2 run tf2_ros static_transform_publisher 1 0 0 0 0 0 world parent_frame</code>
                    </div>
                    <p className="hint">Broadcasts transform from "world" to "parent_frame" at (1,0,0)</p>
                  </li>
                  <li>
                    <strong>Create child TF broadcaster:</strong>
                    <div className="code-block">
                      <code>ros2 run tf2_ros static_transform_publisher 0 0.5 0 0 0 0 parent_frame child_frame</code>
                    </div>
                    <p className="hint">Broadcasts from "parent_frame" to "child_frame" at (0,0.5,0)</p>
                  </li>
                  <li>
                    <strong>View the TF tree:</strong>
                    <div className="code-block">
                      <code>ros2 run tf2_tools view_frames</code>
                    </div>
                    <p className="hint">Generates a PDF showing TF tree structure</p>
                  </li>
                  <li>
                    <strong>Echo a transform:</strong>
                    <div className="code-block">
                      <code>ros2 run tf2_ros tf2_echo world child_frame</code>
                    </div>
                    <p className="hint">Shows combined transform from world to child_frame</p>
                  </li>
                </ol>
              </div>

              <div className="tf2-example__concepts-section">
                <div className="tf2-example__concepts">
                  <h4>🧠 Key Concepts</h4>
                  <div className="tf2-example__concept">
                    <strong>🌍 World Frame:</strong> Root coordinate system
                  </div>
                  <div className="tf2-example__concept">
                    <strong>📐 Parent Frame:</strong> Frame at (1,0,0) relative to world
                  </div>
                  <div className="tf2-example__concept">
                    <strong>🎯 Child Frame:</strong> Frame at (0,0.5,0) relative to parent
                  </div>
                  <div className="tf2-example__concept">
                    <strong>🔗 TF Tree:</strong> Hierarchical structure of all frames
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </section>

      {/* Main Layout - 2 Column: IDE + RViz */}
      <div className="tf2-example__layout">
        {/* Left Column: Embedded IDE */}
        <main className="tf2-example__ide-container">
          <EmbeddedIDE
            workspaceName="tf2_workspace"
            showVisualizer={false}
          />
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
        />
      </div>
    </div>
  );
}
