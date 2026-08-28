// src/levels/slidesROS2Concepts/03-CreatingPackageInteractive.jsx
import React, { useCallback } from "react";
import { useProgress } from "../../context/ProgressContext";
import EmbeddedIDE from "../../components/ide/EmbeddedIDE";
import ideTutorials from "../../config/ideTutorials";
import "../../styles/_rosflow.scss";

export const meta = {
  id: "creating-package-interactive",
  title: "Create Your First Package (Interactive)",
  order: 3,
  objectiveCode: "ros2-package-creating",
};

export default function CreatingPackageInteractive({ onObjectiveHit, goNext }) {
  const { hitObjective } = useProgress();

  // Handle tutorial completion
  const handleTutorialComplete = useCallback(() => {
    console.log(`[Tutorial] Completed: Creating Package`);

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
    console.log(`[Tutorial] Skipped: Creating Package`);
    // Don't mark objective, just allow user to continue
  }, []);

  return (
    <div className="slide-wrap" style={{ width: "100%", maxWidth: "100%", padding: 0 }}>
      <EmbeddedIDE
        workspaceName="ros2concept"
        tutorial={ideTutorials.createPackage}
        onTutorialComplete={handleTutorialComplete}
        onTutorialSkip={handleTutorialSkip}
      />
    </div>
  );
}
