// src/levels/slidesSensing/02a-LidarSubscriberInteractive.jsx
import React, { useCallback } from "react";
import { useProgress } from "../../context/ProgressContext";
import EmbeddedIDE from "../../components/ide/EmbeddedIDE";
import LidarVisualizer from "../../components/visualization/LidarVisualizer";
import { useRoslib } from "../../hooks/useRoslib";
import ideTutorials from "../../config/ideTutorials";
import "../../styles/_rosflow.scss";

export const meta = {
  id: "lidar-subscriber-interactive",
  title: "Create LIDAR Subscriber (Interactive)",
  order: 2,
  objectiveCode: "SENSE_SUBSCRIBE_LIDAR",
};

export default function LidarSubscriberInteractive({ onObjectiveHit, goNext }) {
  const { hitObjective } = useProgress();
  const { ros, connected } = useRoslib();

  // Handle tutorial completion
  const handleTutorialComplete = useCallback(() => {
    console.log(`[Tutorial] Completed: LIDAR Subscriber`);

    // Mark objective as completed
    if (meta.objectiveCode && hitObjective) {
      hitObjective(meta.objectiveCode);
    }

    // Also call the lesson's onObjectiveHit if provided
    if (onObjectiveHit) {
      onObjectiveHit(meta.objectiveCode);
    }

    // Optionally move to next slide
    if (goNext) {
      setTimeout(() => goNext(), 1000);
    }
  }, [hitObjective, onObjectiveHit, goNext]);

  // Handle tutorial skip
  const handleTutorialSkip = useCallback(() => {
    console.log(`[Tutorial] Skipped: LIDAR Subscriber`);
  }, []);

  return (
    <div className="slide-wrap" style={{ width: "100%", maxWidth: "100%", padding: 0 }}>
      {/* LIDAR Visualization Panel */}
      <div style={{ marginBottom: "1.5rem" }}>
        <h3 style={{ marginBottom: "1rem", color: "#fff" }}>
          🎯 LIDAR Wall Detection Simulation
        </h3>
        <LidarVisualizer
          ros={ros.current}
          lidarTopic="/qcar/lidar/scan"
          fixedFrame="base_link"
          mode="both"
        />
      </div>

      {/* Interactive IDE Tutorial */}
      <div style={{ marginTop: "1.5rem" }}>
        <h3 style={{ marginBottom: "1rem", color: "#fff" }}>
          💻 Write Your LIDAR Subscriber
        </h3>
        <EmbeddedIDE
          workspaceName="sensing"
          tutorial={ideTutorials.createLidarSubscriber}
          onTutorialComplete={handleTutorialComplete}
          onTutorialSkip={handleTutorialSkip}
        />
      </div>
    </div>
  );
}
