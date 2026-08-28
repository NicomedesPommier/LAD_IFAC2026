// src/levels/slidesVehicleDynamics/09-AdvancedTopics.jsx
import React from "react";

export const meta = {
  id: "vd-advanced",
  title: "Advanced Topics in Vehicle Dynamics",
  order: 9,
  objectiveCode: "vd-slide-advanced",
};

export default function AdvancedTopics({ meta, goNext, goPrev, isFirst }) {
  return (
    <div className="slide-wrap">
      <h2>{meta.title}</h2>

      <div className="slide-card">
        <div className="slide-card__title">Beyond the Basics</div>
        <p>
          While the bicycle model and linear tire models provide a solid foundation, real-world
          vehicle dynamics involve many additional complexities. Here are some advanced topics
          for further exploration.
        </p>
      </div>

      <div className="slide-columns">
        <div className="slide-card">
          <div className="slide-card__title">Full Vehicle Model (4-Wheel)</div>
          <p>
            The full vehicle model considers all four wheels independently, allowing analysis of:
          </p>
          <ul>
            <li>Individual wheel loads and tire forces</li>
            <li>Load transfer during acceleration/braking</li>
            <li>Left-right weight distribution in turns</li>
            <li>Differential effects and torque vectoring</li>
            <li>Independent suspension dynamics</li>
          </ul>
          <div className="slide-code" style={{ marginTop: ".75rem", fontSize: ".85rem" }}>
            {`State vector (13 states):
[x, y, z, φ, θ, ψ, vx, vy, vz, p, q, r, ωwheels]

Where:
• x,y,z: Position
• φ,θ,ψ: Roll, pitch, yaw
• vx,vy,vz: Velocities
• p,q,r: Angular rates`}
          </div>
        </div>

        <div className="slide-card">
          <div className="slide-card__title">Nonlinear Tire Models</div>
          <p>
            Real tires exhibit complex nonlinear behavior, especially at high slip angles and loads.
          </p>
          <ul>
            <li><b>Pacejka Magic Formula:</b> Empirical model with 20+ parameters</li>
            <li><b>Combined Slip:</b> Interaction between lateral and longitudinal forces</li>
            <li><b>Normal Load Sensitivity:</b> Tire forces depend on vertical load</li>
            <li><b>Temperature Effects:</b> Performance varies with tire temperature</li>
          </ul>
          <div className="slide-code" style={{ marginTop: ".75rem", fontSize: ".85rem" }}>
            {`Magic Formula (simplified):
Fy = D·sin(C·atan(B·α - E·(B·α - atan(B·α))))

• B: Stiffness factor
• C: Shape factor
• D: Peak value
• E: Curvature factor`}
          </div>
        </div>
      </div>

      <div className="slide-columns">
        <div className="slide-card">
          <div className="slide-card__title">Suspension Dynamics</div>
          <ul>
            <li>Spring and damper characteristics</li>
            <li>Anti-roll bars and sway control</li>
            <li>Kinematic effects (camber, toe changes)</li>
            <li>Roll center and pitch center analysis</li>
            <li>Active suspension systems</li>
          </ul>
          <div className="slide-callout slide-callout--info" style={{ marginTop: ".75rem" }}>
            Suspension affects load transfer, tire contact patches, and ultimately vehicle stability.
          </div>
        </div>

        <div className="slide-card">
          <div className="slide-card__title">Longitudinal Dynamics</div>
          <ul>
            <li>Traction and braking forces</li>
            <li>Powertrain modeling (engine, transmission)</li>
            <li>Aerodynamic drag: Fd = ½·ρ·Cd·A·v²</li>
            <li>Rolling resistance</li>
            <li>Grade effects (uphill/downhill)</li>
          </ul>
          <div className="slide-callout slide-callout--info" style={{ marginTop: ".75rem" }}>
            Essential for acceleration performance, fuel economy, and combined braking-steering scenarios.
          </div>
        </div>
      </div>

      <div className="slide-card">
        <div className="slide-card__title">Active Safety Systems</div>
        <div className="slide-columns">
          <div>
            <b>Electronic Stability Control (ESC):</b>
            <ul>
              <li>Detects loss of traction or oversteer/understeer</li>
              <li>Selectively brakes individual wheels</li>
              <li>Reduces engine torque if needed</li>
              <li>Uses yaw rate and lateral acceleration sensors</li>
            </ul>
          </div>
          <div>
            <b>Advanced Driver Assistance Systems (ADAS):</b>
            <ul>
              <li>Anti-lock Braking System (ABS)</li>
              <li>Traction Control System (TCS)</li>
              <li>Lane Keeping Assist (LKA)</li>
              <li>Adaptive Cruise Control (ACC)</li>
              <li>Automatic Emergency Braking (AEB)</li>
            </ul>
          </div>
        </div>
      </div>

      <div className="slide-card">
        <div className="slide-card__title">Modern Control Approaches</div>
        <div className="slide-columns">
          <div>
            <b>Model Predictive Control (MPC):</b>
            <ul>
              <li>Optimizes control over prediction horizon</li>
              <li>Handles multiple objectives and constraints</li>
              <li>Used in Tesla Autopilot and Waymo</li>
              <li>Requires fast solvers for real-time operation</li>
            </ul>
          </div>
          <div>
            <b>Machine Learning Approaches:</b>
            <ul>
              <li>Neural networks for tire model identification</li>
              <li>Reinforcement learning for optimal control</li>
              <li>End-to-end learning (perception to control)</li>
              <li>Hybrid physics-ML models</li>
            </ul>
          </div>
        </div>
      </div>

      <div className="slide-card">
        <div className="slide-card__title">Simulation Environments</div>
        <p>Testing and development require sophisticated simulation tools:</p>
        <div className="slide-columns">
          <div>
            <b>Simulation Software:</b>
            <ul>
              <li><b>CarSim/TruckSim:</b> Industry-standard vehicle dynamics</li>
              <li><b>IPG CarMaker:</b> Complete virtual test driving</li>
              <li><b>MATLAB/Simulink:</b> Control system design and analysis</li>
              <li><b>Gazebo/ROS:</b> Robotics and autonomous vehicle development</li>
              <li><b>CARLA:</b> Open-source autonomous driving simulator</li>
            </ul>
          </div>
          <div>
            <b>Hardware-in-the-Loop (HIL):</b>
            <ul>
              <li>Real ECUs with simulated vehicle and environment</li>
              <li>Test edge cases safely and repeatably</li>
              <li>Validate before expensive road testing</li>
              <li>Required for ISO 26262 safety certification</li>
            </ul>
          </div>
        </div>
      </div>

      <div className="slide-callout slide-callout--warn">
        <b>Safety Consideration:</b> As vehicle control systems become more complex and automated,
        rigorous testing, validation, and fail-safe mechanisms become critical. Always consider
        worst-case scenarios and edge cases in your designs.
      </div>

      <div className="slide-callout slide-callout--success">
        <b>Further Learning:</b> Consider studying multibody dynamics, optimal control theory,
        and modern estimation techniques (Kalman filtering, sensor fusion) to deepen your
        understanding of vehicle dynamics and autonomous systems.
      </div>

      <div className="slide-actions">
        {!isFirst && (
          <button className="btn" onClick={goPrev}>
            ⟨ Previous
          </button>
        )}
        <button className="btn" onClick={goNext}>
          Continue ⟩
        </button>
      </div>
    </div>
  );
}
