// src/levels/slidesVehicleDynamics/06-LateralDynamics.jsx
import React, { useState } from "react";

export const meta = {
  id: "vd-lateral",
  title: "Lateral Dynamics & Stability",
  order: 6,
  objectiveCode: "vd-slide-lateral",
};

export default function LateralDynamics() {
  const [mass, setMass] = useState(1500);
  const [lf, setLf] = useState(1.2);
  const [lr, setLr] = useState(1.5);
  const [Cf, setCf] = useState(80000);
  const [Cr, setCr] = useState(80000);
  const [velocity, setVelocity] = useState(20);

  const L = lf + lr;
  const Iz = mass * (lf * lf + lr * lr) / 3; // Simplified moment of inertia

  // Stability analysis
  const understeerGradient = (mass / (L * L)) * (lf / Cf - lr / Cr);
  const criticalSpeed = Math.sqrt((L * L * Cf * Cr) / (mass * Math.abs(lf * Cr - lr * Cf)));

  let stabilityStatus = "Neutral Steer";
  let stabilityColor = "#7df9ff";
  if (understeerGradient > 0.001) {
    stabilityStatus = "Understeer";
    stabilityColor = "#4ade80";
  } else if (understeerGradient < -0.001) {
    stabilityStatus = "Oversteer";
    stabilityColor = "#ff5cf4";
  }

  return (
    <div className="slide">
      <h2>Lateral Dynamics & Stability</h2>

      <div className="slide-card">
        <div className="slide-card__title">Dynamic Bicycle Model Equations</div>
        <p>
          The dynamic bicycle model extends the kinematic model by including tire forces and lateral accelerations.
          This allows us to analyze vehicle stability and predict behavior during high-speed maneuvers.
        </p>
      </div>

      <div className="slide-columns">
        <div>
          <div className="slide-card">
            <div className="slide-card__title">Equations of Motion</div>
            <div className="slide-code">
              {`Lateral Force Balance:
m(dvy/dt + vx·r) = Fyf + Fyr

Yaw Moment Balance:
Iz·dr/dt = lf·Fyf - lr·Fyr

Tire Forces:
Fyf = -Cf·αf = -Cf·(δ - β - lf·r/vx)
Fyr = -Cr·αr = -Cr·(-β + lr·r/vx)

Where:
• m = Vehicle mass
• Iz = Yaw moment of inertia
• vy = Lateral velocity
• vx = Longitudinal velocity
• r = Yaw rate
• β = Sideslip angle = atan(vy/vx)
• αf, αr = Front/rear slip angles
• Cf, Cr = Front/rear cornering stiffness
• lf, lr = CG to front/rear axle distance`}
            </div>
          </div>

          <div className="slide-card" style={{ marginTop: ".75rem" }}>
            <div className="slide-card__title">Vehicle Parameters</div>
            <div style={{ display: "grid", gap: ".5rem" }}>
              <label style={{ display: "grid", gap: ".25rem" }}>
                <span>Mass: {mass} kg</span>
                <input
                  type="range"
                  min="1000"
                  max="2500"
                  step="100"
                  value={mass}
                  onChange={(e) => setMass(Number(e.target.value))}
                  style={{ width: "100%" }}
                />
              </label>

              <label style={{ display: "grid", gap: ".25rem" }}>
                <span>lf: {lf.toFixed(1)} m</span>
                <input
                  type="range"
                  min="0.8"
                  max="2.0"
                  step="0.1"
                  value={lf}
                  onChange={(e) => setLf(Number(e.target.value))}
                  style={{ width: "100%" }}
                />
              </label>

              <label style={{ display: "grid", gap: ".25rem" }}>
                <span>lr: {lr.toFixed(1)} m</span>
                <input
                  type="range"
                  min="0.8"
                  max="2.0"
                  step="0.1"
                  value={lr}
                  onChange={(e) => setLr(Number(e.target.value))}
                  style={{ width: "100%" }}
                />
              </label>

              <label style={{ display: "grid", gap: ".25rem" }}>
                <span>Cf (front): {Cf.toFixed(0)} N/rad</span>
                <input
                  type="range"
                  min="40000"
                  max="120000"
                  step="5000"
                  value={Cf}
                  onChange={(e) => setCf(Number(e.target.value))}
                  style={{ width: "100%" }}
                />
              </label>

              <label style={{ display: "grid", gap: ".25rem" }}>
                <span>Cr (rear): {Cr.toFixed(0)} N/rad</span>
                <input
                  type="range"
                  min="40000"
                  max="120000"
                  step="5000"
                  value={Cr}
                  onChange={(e) => setCr(Number(e.target.value))}
                  style={{ width: "100%" }}
                />
              </label>

              <label style={{ display: "grid", gap: ".25rem" }}>
                <span>Velocity: {velocity} m/s ({(velocity * 3.6).toFixed(0)} km/h)</span>
                <input
                  type="range"
                  min="5"
                  max="40"
                  step="1"
                  value={velocity}
                  onChange={(e) => setVelocity(Number(e.target.value))}
                  style={{ width: "100%" }}
                />
              </label>
            </div>
          </div>
        </div>

        <div>
          <div className="slide-card">
            <div className="slide-card__title">Stability Analysis</div>
            <div style={{ display: "grid", gap: ".75rem" }}>
              <div className="slide-code">
                {`Understeer Gradient:
K = (m/L²)·(lf/Cf - lr/Cr)

K > 0: Understeer (stable)
K = 0: Neutral steer
K < 0: Oversteer (unstable)`}
              </div>

              <div style={{
                padding: "1rem",
                borderRadius: "10px",
                border: `2px solid ${stabilityColor}`,
                background: `${stabilityColor}22`,
                textAlign: "center"
              }}>
                <div style={{ fontSize: "1.2rem", fontWeight: "bold", color: stabilityColor }}>
                  {stabilityStatus}
                </div>
                <div style={{ fontSize: "0.9rem", marginTop: ".5rem", opacity: 0.8 }}>
                  K = {understeerGradient.toFixed(6)} rad/m/s²
                </div>
              </div>

              <div className="slide-code" style={{ fontSize: "0.85rem" }}>
                <b>Calculated Values:</b>
                <br />• Wheelbase L = {L.toFixed(2)} m
                <br />• Yaw inertia Iz = {Iz.toFixed(0)} kg·m²
                <br />• Critical speed = {criticalSpeed.toFixed(1)} m/s ({(criticalSpeed * 3.6).toFixed(0)} km/h)
                <br />• Current speed: {velocity > criticalSpeed ? "⚠️ Above critical" : "✓ Below critical"}
              </div>

              <div className="slide-callout slide-callout--info">
                <b>Understeer:</b> Vehicle tends to go straight (plow) in corners. Front tires reach
                their limit first. More steering input needed. Stable and forgiving.
              </div>

              <div className="slide-callout slide-callout--warn">
                <b>Oversteer:</b> Vehicle tends to rotate more than intended. Rear tires reach limit first.
                Can lead to spin if not corrected. Requires skilled driver.
              </div>

              <div className="slide-callout" style={{ border: "1px solid #7df9ff", background: "rgba(125,249,255,0.1)" }}>
                <b>Neutral Steer:</b> Balanced behavior. Vehicle follows driver input precisely.
                Rare in practice, theoretical ideal.
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="slide-card" style={{ marginTop: ".75rem" }}>
        <div className="slide-card__title">Design Considerations</div>
        <div className="slide-columns">
          <div>
            <b>Promoting Understeer (Stability):</b>
            <ul>
              <li>Increase front cornering stiffness (Cf)</li>
              <li>Move CG forward (increase lf)</li>
              <li>Decrease rear cornering stiffness (Cr)</li>
              <li>Use wider front tires</li>
            </ul>
          </div>
          <div>
            <b>Promoting Oversteer (Agility):</b>
            <ul>
              <li>Increase rear cornering stiffness (Cr)</li>
              <li>Move CG rearward (increase lr)</li>
              <li>Decrease front cornering stiffness (Cf)</li>
              <li>Use wider rear tires</li>
            </ul>
          </div>
        </div>
      </div>

      <div className="slide-callout slide-callout--success">
        <b>Summary:</b> Most passenger cars are designed with mild understeer for safety and stability.
        Sports cars may have neutral or slight oversteer for agility. Electronic stability control (ESC)
        systems use these principles to selectively brake individual wheels and maintain stability.
      </div>
    </div>
  );
}
