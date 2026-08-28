// src/levels/slidesVehicleDynamics/10-Summary.jsx
import React from "react";

export const meta = {
  id: "vd-summary",
  title: "Summary & Next Steps",
  order: 10,
  objectiveCode: "vd-slide-summary",
};

export default function Summary({ meta, goPrev, isFirst, isLast, onLevelCompleted }) {
  const handleComplete = () => {
    if (onLevelCompleted) {
      onLevelCompleted();
    }
  };

  return (
    <div className="slide-wrap">
      <h2>{meta.title}</h2>

      <div className="slide-card">
        <div className="slide-card__title">What You've Learned</div>
        <p>
          Congratulations! You've completed the Vehicle Dynamics module. Let's review the key concepts
          you've learned.
        </p>
      </div>

      <div className="slide-columns">
        <div className="slide-card">
          <div className="slide-card__title">Core Concepts</div>
          <ul>
            <li><b>Instantaneous Center of Rotation (ICR):</b> The point about which a vehicle rotates at any instant</li>
            <li><b>Ackermann Steering:</b> Geometric relationship ensuring all wheels follow circular paths around a common center</li>
            <li><b>Bicycle Model:</b> Simplified 2-wheel representation for analyzing vehicle motion</li>
            <li><b>Tire Slip Angles:</b> Difference between tire's direction and actual travel direction</li>
            <li><b>Lateral Dynamics:</b> Side-to-side motion and stability characteristics</li>
          </ul>
        </div>

        <div className="slide-card">
          <div className="slide-card__title">Control & Planning</div>
          <ul>
            <li><b>PID Control:</b> Feedback control using proportional, integral, and derivative terms</li>
            <li><b>Pure Pursuit:</b> Geometric path following algorithm using lookahead points</li>
            <li><b>Stability Analysis:</b> Understanding understeer, oversteer, and neutral steer behavior</li>
            <li><b>Advanced Methods:</b> MPC, Stanley controller, and machine learning approaches</li>
          </ul>
        </div>
      </div>

      <div className="slide-card">
        <div className="slide-card__title">Key Equations Reference</div>
        <div className="slide-code">
          {`Bicycle Model Kinematics:
ẋ = v·cos(θ)
ẏ = v·sin(θ)
θ̇ = (v/L)·tan(δ)

Lateral Dynamics:
m(dvy/dt + vx·r) = Fyf + Fyr
Iz·dr/dt = lf·Fyf - lr·Fyr

Tire Forces:
Fyf = -Cf·αf
Fyr = -Cr·αr

Understeer Gradient:
K = (m/L²)·(lf/Cf - lr/Cr)

Pure Pursuit:
δ = atan(2·L·sin(α)/Ld)`}
        </div>
      </div>

      <div className="slide-card">
        <div className="slide-card__title">Practical Applications</div>
        <div className="slide-columns">
          <div>
            <b>Autonomous Vehicles:</b>
            <ul>
              <li>Path planning and trajectory optimization</li>
              <li>Lane keeping and lane change execution</li>
              <li>Obstacle avoidance maneuvers</li>
              <li>Parking automation</li>
            </ul>
          </div>
          <div>
            <b>Vehicle Safety:</b>
            <ul>
              <li>Electronic Stability Control (ESC)</li>
              <li>Anti-lock Braking System (ABS)</li>
              <li>Traction Control System (TCS)</li>
              <li>Advanced Driver Assistance Systems (ADAS)</li>
            </ul>
          </div>
        </div>
      </div>

      <div className="slide-card">
        <div className="slide-card__title">Next Steps & Resources</div>
        <div className="slide-columns">
          <div>
            <b>Hands-On Practice:</b>
            <ul>
              <li>Implement vehicle models in Python/MATLAB</li>
              <li>Experiment with simulators (Gazebo, CARLA)</li>
              <li>Build and tune controllers</li>
              <li>Try different path following algorithms</li>
              <li>Analyze real vehicle data</li>
            </ul>
          </div>
          <div>
            <b>Further Study:</b>
            <ul>
              <li>Nonlinear tire models (Pacejka)</li>
              <li>Optimal control theory</li>
              <li>State estimation (Kalman filters)</li>
              <li>Sensor fusion techniques</li>
              <li>Motion planning algorithms</li>
            </ul>
          </div>
        </div>
      </div>

      <div className="slide-card">
        <div className="slide-card__title">Recommended Reading</div>
        <ul>
          <li><b>"Vehicle Dynamics and Control"</b> by Rajesh Rajamani</li>
          <li><b>"Race Car Vehicle Dynamics"</b> by Milliken & Milliken</li>
          <li><b>"Fundamentals of Vehicle Dynamics"</b> by Thomas Gillespie</li>
          <li><b>"Planning Algorithms"</b> by Steven LaValle (for path planning)</li>
          <li><b>Research Papers:</b> IEEE Transactions on Intelligent Transportation Systems</li>
        </ul>
      </div>

      <div className="slide-callout slide-callout--success">
        <b>You're Ready!</b> You now have a solid foundation in vehicle dynamics. Whether you're
        working on autonomous vehicles, vehicle control systems, or simulation, these concepts
        will serve as essential building blocks for your work.
      </div>

      <div className="slide-callout slide-callout--info">
        <b>Interactive Practice:</b> Try the Unity WebGL games in the next sections to apply
        these concepts in interactive scenarios. Experiment with different parameters and see
        how they affect vehicle behavior in real-time simulations.
      </div>

      <div className="slide-actions">
        {!isFirst && (
          <button className="btn" onClick={goPrev}>
            ⟨ Previous
          </button>
        )}
        {isLast && (
          <button
            className="btn btn--primary"
            onClick={handleComplete}
            style={{ background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)" }}
          >
            Complete Module ✓
          </button>
        )}
      </div>
    </div>
  );
}
