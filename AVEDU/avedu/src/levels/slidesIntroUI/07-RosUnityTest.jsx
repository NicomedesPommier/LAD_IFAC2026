// src/levels/slidesIntroUI/07-RosUnityTest.jsx
import { useState } from 'react';
import UnityWebGL from '../../components/UnityWebGL';

export const meta = {
  id: "ros-unity-test",
  title: "ROS Unity Integration",
  order: 7,
  objectiveCode: "INTRO_UI_ROS_UNITY",
};

export default function RosUnityTest({ meta, onObjectiveHit }) {
  const [gameLoaded, setGameLoaded] = useState(false);
  const [loadProgress, setLoadProgress] = useState(0);

  const handleGameLoaded = (unityInstance) => {
    console.log('[RosUnityTest] Unity game loaded successfully!', unityInstance);
    setGameLoaded(true);
    // Hit the objective when the game loads
    onObjectiveHit?.(meta.objectiveCode);
  };

  const handleProgress = (progress) => {
    setLoadProgress(progress);
  };

  return (
    <div className="slide" style={{ padding: "2rem" }}>
      <h2>{meta.title}</h2>

      <p style={{ fontSize: "1.1rem", marginBottom: "2rem" }}>
        Experience ROS integration with Unity WebGL! This interactive simulation demonstrates
        real-time communication between ROS and Unity for robotics visualization and control.
      </p>

      <div className="slide-card" style={{ marginBottom: "2rem" }}>
        <div className="slide-card__title">About This Demo</div>
        <ul style={{ lineHeight: "1.6" }}>
          <li><b>Real-time ROS Integration:</b> Unity communicates with ROS nodes via WebSocket</li>
          <li><b>Interactive Simulation:</b> Control and visualize robotics scenarios</li>
          <li><b>Educational Tool:</b> Learn ROS concepts through interactive 3D visualization</li>
          <li><b>Browser-based:</b> No installation required, runs directly in your browser</li>
        </ul>
      </div>

      {/* Unity WebGL Game Container */}
      <div style={{ marginBottom: "2rem", display: "flex", justifyContent: "center" }}>
        <UnityWebGL
          gamePath="RosUnityTest"
          gameName="RosUnityTest"
          width={960}
          height={600}
          onLoaded={handleGameLoaded}
          onProgress={handleProgress}
          className="unity-game-ros-test"
        />
      </div>

      {gameLoaded && (
        <div className="slide-callout slide-callout--success" style={{ marginBottom: "1.5rem" }}>
          <b>Simulation Ready!</b> The ROS Unity integration is now active. Interact with the simulation above
          to explore ROS concepts in 3D.
        </div>
      )}

      {!gameLoaded && loadProgress > 0 && (
        <div className="slide-callout" style={{ marginBottom: "1.5rem" }}>
          Loading simulation... {Math.round(loadProgress * 100)}%
        </div>
      )}

      <div className="slide-card slide-card--highlight">
        <div className="slide-card__title">What You'll Learn</div>
        <ul style={{ lineHeight: "1.6" }}>
          <li>How ROS nodes communicate with visualization tools</li>
          <li>Real-time data streaming between ROS and Unity</li>
          <li>Interactive 3D robotics simulation</li>
          <li>WebSocket-based ROS communication protocols</li>
        </ul>
      </div>

      <div className="slide-callout slide-callout--tip" style={{ marginTop: "1.5rem" }}>
        <b>Pro Tip:</b> This type of integration is commonly used in robotics development for
        visualization, simulation, and testing before deploying to real hardware.
      </div>
    </div>
  );
}
