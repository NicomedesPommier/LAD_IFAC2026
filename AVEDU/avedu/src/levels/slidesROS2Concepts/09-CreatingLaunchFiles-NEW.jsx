// src/levels/slidesROS2Concepts/09-CreatingLaunchFiles-NEW.jsx
import React, { useCallback } from "react";
import { useProgress } from "../../context/ProgressContext";
import EmbeddedIDE from "../../components/ide/EmbeddedIDE";
import ideTutorials from "../../config/ideTutorials";
import "../../styles/_rosflow.scss";

export const meta = {
  id: "creating-launch-files",
  title: "Creating Launch Files (Interactive)",
  order: 9,
  objectiveCode: "ros2-launch-create",
};

export default function CreatingLaunchFiles({ onObjectiveHit, goNext }) {
  const { hitObjective } = useProgress();

  const handleTutorialComplete = useCallback(() => {
    if (meta.objectiveCode && hitObjective) {
      hitObjective(meta.objectiveCode);
    }
    if (onObjectiveHit) {
      onObjectiveHit(meta.objectiveCode);
    }
    if (goNext) {
      setTimeout(() => goNext(), 1000);
    }
  }, [hitObjective, onObjectiveHit, goNext]);

  const handleTutorialSkip = useCallback(() => {
    console.log(`[Tutorial] Skipped: Creating Launch Files`);
  }, []);

  return (
    <div className="slide-wrap" style={{ width: "100%", maxWidth: "100%", padding: 0 }}>
      <EmbeddedIDE
        workspaceName="ros2concept"
        tutorial={ideTutorials.createLaunchFile}
        onTutorialComplete={handleTutorialComplete}
        onTutorialSkip={handleTutorialSkip}
      />
    </div>
  );
}
