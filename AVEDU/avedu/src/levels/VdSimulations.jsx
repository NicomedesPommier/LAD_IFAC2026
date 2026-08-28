// src/levels/VdSimulations.jsx
import React, { useState } from "react";
import UnityWebGL from "../components/UnityWebGL";

export default function VdSimulations({ onObjectiveHit, onLevelCompleted }) {
  const [gameLoaded, setGameLoaded] = useState(false);
  const [selectedGame, setSelectedGame] = useState("game1");

  const handleGameLoaded = (unityInstance) => {
    console.log('Vehicle dynamics simulation loaded!', unityInstance);
    setGameLoaded(true);
  };

  const handleComplete = () => {
    onObjectiveHit?.('VD_SIMULATION_COMPLETE');
    onLevelCompleted?.();
  };

  return (
    <div className="slide-wrap" style={{ padding: "2rem", maxWidth: "1200px", margin: "0 auto" }}>
      <h1 style={{ fontSize: "2.5rem", marginBottom: "1rem", textAlign: "center" }}>
        Vehicle Dynamics Simulations
      </h1>
      <h2 style={{ fontSize: "1.3rem", marginBottom: "2rem", textAlign: "center", opacity: 0.8 }}>
        Interactive Unity WebGL Simulations
      </h2>

      <div className="slide-card" style={{ marginBottom: "2rem" }}>
        <div className="slide-card__title">Apply Your Knowledge</div>
        <p style={{ lineHeight: "1.6" }}>
          Now it's time to put your understanding of vehicle dynamics into practice! These interactive
          simulations let you experiment with steering control, path following, and vehicle behavior
          in real-time scenarios.
        </p>
      </div>

      <div className="slide-columns" style={{ marginBottom: "2rem" }}>
        <div className="slide-card">
          <div className="slide-card__title">What You'll Practice</div>
          <ul style={{ lineHeight: "1.6" }}>
            <li>Steering control and vehicle maneuvering</li>
            <li>Path following using bicycle model</li>
            <li>Understanding turning radius and ICR</li>
            <li>Ackermann steering in action</li>
            <li>Speed and steering angle effects</li>
          </ul>
        </div>

        <div className="slide-card">
          <div className="slide-card__title">Simulation Features</div>
          <ul style={{ lineHeight: "1.6" }}>
            <li>Real-time physics simulation</li>
            <li>Interactive vehicle control</li>
            <li>Visual feedback and metrics</li>
            <li>Multiple challenge scenarios</li>
            <li>Automatic progress tracking</li>
          </ul>
        </div>
      </div>

      {/* Placeholder for Unity WebGL Game */}
      <div style={{ marginBottom: "2rem" }}>
        <div className="slide-card">
          <div className="slide-card__title">Vehicle Dynamics Simulation</div>
          <div style={{
            background: 'linear-gradient(135deg, rgba(125,249,255,0.1), rgba(255,92,244,0.1))',
            border: '2px dashed var(--border)',
            borderRadius: '12px',
            padding: '3rem',
            textAlign: 'center',
            minHeight: '400px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>🚗</div>
            <h3 style={{ fontSize: '1.5rem', marginBottom: '1rem', color: 'var(--neon)' }}>
              Unity WebGL Simulation Placeholder
            </h3>
            <p style={{ maxWidth: '500px', opacity: 0.8, lineHeight: '1.6' }}>
              Your Unity WebGL vehicle dynamics simulation will be integrated here.
              This is where students will interact with the vehicle physics concepts
              they've learned through hands-on practice.
            </p>
            <div style={{ marginTop: '2rem', fontSize: '.9rem', opacity: 0.6 }}>
              Game path: <code style={{ background: 'rgba(0,0,0,0.3)', padding: '.25rem .5rem', borderRadius: '4px' }}>RickTest</code>
            </div>
          </div>
        </div>

        {/* Uncomment when you have the Unity game ready */}
        {/*
        <UnityWebGL
          gamePath="VehicleDynamicsGame"
          gameName="Vehicle Dynamics Simulation"
          width={960}
          height={600}
          onLoaded={handleGameLoaded}
        />
        */}
      </div>

      <div className="slide-card" style={{ marginBottom: "2rem" }}>
        <div className="slide-card__title">Review: Key Concepts</div>
        <div className="slide-columns">
          <div>
            <h4 style={{ color: 'var(--neon)', marginBottom: '.5rem' }}>Kinematics</h4>
            <ul style={{ fontSize: '.9rem', lineHeight: '1.5' }}>
              <li>Bicycle model: ẋ = v·cos(θ), ẏ = v·sin(θ), θ̇ = (v/L)·tan(δ)</li>
              <li>Turning radius: R = L / tan(δ)</li>
              <li>No tire slip assumption</li>
            </ul>
          </div>
          <div>
            <h4 style={{ color: 'var(--neon)', marginBottom: '.5rem' }}>Geometry</h4>
            <ul style={{ fontSize: '.9rem', lineHeight: '1.5' }}>
              <li>ICR: Point of instantaneous rotation</li>
              <li>Ackermann: Inner wheel steers more than outer</li>
              <li>Wheelbase and track width effects</li>
            </ul>
          </div>
        </div>
      </div>

      <div className="slide-callout slide-callout--success" style={{ marginBottom: "2rem" }}>
        <b>Congratulations!</b> You've completed the vehicle dynamics learning path. You now understand
        the fundamental principles that govern vehicle motion, from basic physics to steering geometry
        and kinematic models. These concepts are essential for autonomous vehicle development,
        simulation, and control system design.
      </div>

      <div className="slide-callout slide-callout--info" style={{ marginBottom: "2rem" }}>
        <b>Next Steps:</b> Continue your learning journey with advanced topics like dynamic models with
        tire forces, Model Predictive Control (MPC), and path planning algorithms. Check out the ROS 2
        and Simulation units to see how these concepts integrate with real autonomous systems!
      </div>

      <div className="slide-actions" style={{ justifyContent: "center", marginTop: "2rem" }}>
        <button
          className="btn btn--primary"
          onClick={handleComplete}
          style={{ fontSize: "1.1rem", padding: ".75rem 2rem" }}
        >
          ✓ Complete Vehicle Dynamics Unit
        </button>
      </div>
    </div>
  );
}
