// src/levels/slidesSensing/02b-CameraSubscriberInteractive.jsx
import React, { useCallback } from "react";
import { useProgress } from "../../context/ProgressContext";
import EmbeddedIDE from "../../components/ide/EmbeddedIDE";
import ideTutorials from "../../config/ideTutorials";
import "../../styles/_rosflow.scss";

export const meta = {
  id: "camera-subscriber-interactive",
  title: "Create Camera Subscriber (Interactive)",
  order: 3,
  objectiveCode: "SENSE_SUBSCRIBE_CAMERA",
};

export default function CameraSubscriberInteractive({ onObjectiveHit, goNext }) {
  const { hitObjective } = useProgress();

  // Handle tutorial completion
  const handleTutorialComplete = useCallback(() => {
    console.log(`[Tutorial] Completed: Camera Subscriber`);

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
    console.log(`[Tutorial] Skipped: Camera Subscriber`);
  }, []);

  return (
    <div className="slide-wrap" style={{ width: "100%", maxWidth: "100%", padding: 0 }}>
      <EmbeddedIDE
        workspaceName="sensing"
        tutorial={ideTutorials.createCameraSubscriber}
        onTutorialComplete={handleTutorialComplete}
        onTutorialSkip={handleTutorialSkip}
      />
    </div>
  );
}
