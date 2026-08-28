// src/levels/IntroGettingStarted.jsx
import React, { useState } from "react";
import UnityWebGL from "../components/UnityWebGL";

export default function IntroGettingStarted({ onObjectiveHit, onLevelCompleted }) {
  const [gameLoaded, setGameLoaded] = useState(false);
  const [loadProgress, setLoadProgress] = useState(0);

  const handleGameLoaded = (unityInstance) => {
    console.log('Unity game loaded successfully!', unityInstance);
    setGameLoaded(true);
    // Hit the objective when the game loads
    onObjectiveHit?.('INTRO_TUTORIAL_COMPLETE');
  };

  const handleProgress = (progress) => {
    setLoadProgress(progress);
  };

  return (
    <div className="slide-wrap" style={{ padding: "2rem", maxWidth: "1200px", margin: "0 auto" }}>
      <h1 style={{ fontSize: "2.5rem", marginBottom: "1rem", textAlign: "center" }}>
        Getting Started Tutorial
      </h1>
      <h2 style={{ fontSize: "1.3rem", marginBottom: "2rem", textAlign: "center", opacity: 0.8 }}>
        Interactive Unity WebGL Mini-Game
      </h2>

      <div className="slide-card" style={{ marginBottom: "2rem" }}>
        <div className="slide-card__title">Welcome to Your First Interactive Tutorial!</div>
        <p style={{ lineHeight: "1.6" }}>
          This is a Unity WebGL mini-game integrated directly into the L.A.D platform.
          Experience interactive learning with engaging games and simulations!
        </p>
      </div>

      {/* Unity WebGL Game Container */}
      <div style={{ marginBottom: "2rem" }}>
        <UnityWebGL
          gamePath="RickTest"
          gameName="RickTest"
          width={960}
          height={600}
          onLoaded={handleGameLoaded}
          onProgress={handleProgress}
        />
      </div>

      {gameLoaded && (
        <div className="slide-callout slide-callout--success" style={{ marginBottom: "2rem" }}>
          <b>Game Loaded Successfully!</b> You can now interact with the Unity game above.
        </div>
      )}

      <div className="slide-card" style={{ marginBottom: "2rem" }}>
        <div className="slide-card__title">About Unity WebGL Integration</div>
        <ul style={{ lineHeight: "1.6" }}>
          <li>All Unity WebGL games are loaded directly in the browser</li>
          <li>No plugins or downloads required</li>
          <li>Games are fully interactive and responsive</li>
          <li>Progress is automatically tracked</li>
        </ul>
      </div>

      <div className="slide-actions" style={{ justifyContent: "center", marginTop: "2rem" }}>
        <button
          className="btn btn--primary"
          onClick={() => onLevelCompleted?.()}
          disabled={!gameLoaded}
          style={{ fontSize: "1.1rem", padding: ".75rem 2rem" }}
        >
          {gameLoaded ? '✓ Complete Level' : 'Loading Game...'}
        </button>
      </div>
    </div>
  );
}
