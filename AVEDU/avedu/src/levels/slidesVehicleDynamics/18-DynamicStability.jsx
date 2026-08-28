// src/levels/slidesVehicleDynamics/18-DynamicStability.jsx
import React, { useState, useEffect, useRef } from "react";

export const meta = {
  id: "dynamic-stability",
  title: "Dynamic Stability Concepts",
  order: 18,
  objectiveCode: "VD_STABILITY",
};

export default function DynamicStability() {
  const phaseCanvasRef = useRef(null);
  const [understeerGradient, setUndersteerGradient] = useState(0.002); // rad/m/s²
  const [velocity, setVelocity] = useState(20); // m/s
  const [showTrajectory, setShowTrajectory] = useState(true);

  // Vehicle parameters
  const mass = 1500;
  const Iz = 2500; // yaw inertia
  const lf = 1.2;
  const lr = 1.5;
  const L = lf + lr;
  const Cf = 80000; // front cornering stiffness
  const Cr = 90000; // rear cornering stiffness

  // Calculate stability metrics
  const K = (mass / (L * L)) * (lf / Cf - lr / Cr); // understeer gradient approximation
  const Vcrit = K < 0 ? Math.sqrt(-Cf * Cr * L * L / (mass * (lr * Cf - lf * Cr))) : Infinity;
  const isOversteer = understeerGradient < 0;
  const isUnstable = isOversteer && velocity > Vcrit;

  // Yaw damping coefficient (simplified)
  const yawDamping = (Cf * lf * lf + Cr * lr * lr) / (Iz * velocity);

  useEffect(() => {
    const canvas = phaseCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const W = canvas.width;
    const H = canvas.height;

    ctx.clearRect(0, 0, W, H);

    const cx = W / 2;
    const cy = H / 2;
    const scale = 8; // pixels per unit

    // Draw axes
    ctx.strokeStyle = "#555";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, cy);
    ctx.lineTo(W, cy);
    ctx.moveTo(cx, 0);
    ctx.lineTo(cx, H);
    ctx.stroke();

    // Axis labels
    ctx.fillStyle = "#888";
    ctx.font = "12px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("Sideslip Angle β (deg)", cx, H - 5);
    ctx.save();
    ctx.translate(15, cy);
    ctx.rotate(-Math.PI / 2);
    ctx.fillText("Yaw Rate r (deg/s)", 0, 0);
    ctx.restore();

    // Draw stability region
    const maxBeta = 15; // degrees
    const maxR = 30; // deg/s

    // Phase portrait - simplified linear system
    // β̇ = -a₁β - a₂r + steering
    // ṙ = -b₁β - b₂r + steering
    // For visualization, we show the vector field

    ctx.globalAlpha = 0.6;
    for (let bx = -maxBeta; bx <= maxBeta; bx += 3) {
      for (let ry = -maxR; ry <= maxR; ry += 5) {
        const beta = bx * Math.PI / 180;
        const r = ry * Math.PI / 180;

        // Simplified dynamics (linearized)
        const a1 = (Cf + Cr) / (mass * velocity);
        const a2 = 1 + (Cf * lf - Cr * lr) / (mass * velocity * velocity);
        const b1 = (Cf * lf - Cr * lr) / Iz;
        const b2 = (Cf * lf * lf + Cr * lr * lr) / (Iz * velocity);

        // State derivatives (with understeer gradient effect)
        const kMod = understeerGradient * 100; // scaled for visualization
        let betaDot = -a1 * beta - (a2 + kMod) * r;
        let rDot = -b1 * beta - b2 * r;

        // Convert to screen coordinates
        const px = cx + bx * scale;
        const py = cy - ry * scale;
        const arrowLen = 15;
        const mag = Math.sqrt(betaDot * betaDot + rDot * rDot);
        const nx = betaDot / (mag + 0.001);
        const ny = rDot / (mag + 0.001);

        // Color based on stability
        const convergent = betaDot * beta + rDot * r < 0;
        ctx.strokeStyle = convergent ? "#4f4" : "#f44";
        ctx.lineWidth = 1;

        ctx.beginPath();
        ctx.moveTo(px, py);
        ctx.lineTo(px + nx * arrowLen * scale / 10, py - ny * arrowLen * scale / 10);
        ctx.stroke();
      }
    }
    ctx.globalAlpha = 1;

    // Draw sample trajectory
    if (showTrajectory) {
      ctx.strokeStyle = "#7df9ff";
      ctx.lineWidth = 2;
      ctx.beginPath();

      let beta = 5 * Math.PI / 180; // initial sideslip
      let r = 10 * Math.PI / 180; // initial yaw rate
      const dt = 0.05;

      ctx.moveTo(cx + beta * 180 / Math.PI * scale, cy - r * 180 / Math.PI * scale);

      for (let t = 0; t < 5; t += dt) {
        const a1 = (Cf + Cr) / (mass * velocity);
        const a2 = 1 + (Cf * lf - Cr * lr) / (mass * velocity * velocity);
        const b1 = (Cf * lf - Cr * lr) / Iz;
        const b2 = (Cf * lf * lf + Cr * lr * lr) / (Iz * velocity);

        const kMod = understeerGradient * 100;
        const betaDot = -a1 * beta - (a2 + kMod) * r;
        const rDot = -b1 * beta - b2 * r;

        beta += betaDot * dt;
        r += rDot * dt;

        const px = cx + beta * 180 / Math.PI * scale;
        const py = cy - r * 180 / Math.PI * scale;

        if (px > 0 && px < W && py > 0 && py < H) {
          ctx.lineTo(px, py);
        }
      }
      ctx.stroke();

      // Starting point
      ctx.fillStyle = "#7df9ff";
      ctx.beginPath();
      ctx.arc(cx + 5 * scale, cy - 10 * scale, 5, 0, Math.PI * 2);
      ctx.fill();
    }

    // Legend
    ctx.fillStyle = "#4f4";
    ctx.fillRect(W - 120, 10, 10, 10);
    ctx.fillStyle = "#f44";
    ctx.fillRect(W - 120, 25, 10, 10);
    ctx.fillStyle = "#7df9ff";
    ctx.fillRect(W - 120, 40, 10, 10);

    ctx.fillStyle = "#fff";
    ctx.font = "10px sans-serif";
    ctx.textAlign = "left";
    ctx.fillText("Converging", W - 105, 18);
    ctx.fillText("Diverging", W - 105, 33);
    ctx.fillText("Trajectory", W - 105, 48);

  }, [understeerGradient, velocity, showTrajectory, Cf, Cr, lf, lr, mass, Iz]);

  return (
    <div className="slide">
      <h2>Dynamic Stability Concepts</h2>

      <div className="slide-card">
        <div className="slide-card__title">Understeer vs Oversteer</div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "1rem" }}>
          <div style={{
            padding: "1rem",
            background: "rgba(100, 255, 100, 0.1)",
            borderRadius: "8px",
            border: "2px solid rgba(100, 255, 100, 0.3)",
          }}>
            <b>Understeer (K {">"} 0)</b>
            <p style={{ fontSize: "0.85em", marginTop: "0.5rem" }}>
              Vehicle turns less than steering input. Front tires saturate first.
              <b> Stable</b> - self-correcting. Feels "safe" but limits agility.
            </p>
            <div style={{ marginTop: "0.5rem", fontSize: "0.8em", opacity: 0.8 }}>
              Cause: Front-heavy, soft front tires
            </div>
          </div>
          <div style={{
            padding: "1rem",
            background: "rgba(255, 200, 87, 0.1)",
            borderRadius: "8px",
            border: "2px solid rgba(255, 200, 87, 0.3)",
          }}>
            <b>Neutral (K = 0)</b>
            <p style={{ fontSize: "0.85em", marginTop: "0.5rem" }}>
              Vehicle turns exactly as commanded. Ideal but difficult to maintain.
              <b> Marginally stable</b> - small changes can tip either way.
            </p>
            <div style={{ marginTop: "0.5rem", fontSize: "0.8em", opacity: 0.8 }}>
              Rare in practice
            </div>
          </div>
          <div style={{
            padding: "1rem",
            background: "rgba(255, 100, 100, 0.1)",
            borderRadius: "8px",
            border: "2px solid rgba(255, 100, 100, 0.3)",
          }}>
            <b>Oversteer (K {"<"} 0)</b>
            <p style={{ fontSize: "0.85em", marginTop: "0.5rem" }}>
              Vehicle turns more than steering input. Rear tires saturate first.
              <b> Unstable above V<sub>crit</sub></b> - can spin without correction.
            </p>
            <div style={{ marginTop: "0.5rem", fontSize: "0.8em", opacity: 0.8 }}>
              Cause: Rear-heavy, stiff rear, RWD power
            </div>
          </div>
        </div>
      </div>

      <div className="slide-card">
        <div className="slide-card__title">Phase Plane Analysis</div>
        <p style={{ marginBottom: "0.5rem" }}>
          The phase plane shows vehicle state (sideslip β vs yaw rate r) and how it evolves.
          Green arrows indicate convergence to equilibrium (stable), red indicates divergence (unstable).
        </p>
        <canvas
          ref={phaseCanvasRef}
          width={400}
          height={300}
          style={{ width: "100%", maxWidth: "400px", margin: "0 auto", display: "block", background: "rgba(0,0,0,0.2)", borderRadius: "8px" }}
        />
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginTop: "1rem" }}>
          <div>
            <label>Understeer Gradient: {(understeerGradient * 1000).toFixed(1)} mrad/m/s²</label>
            <input type="range" min="-0.005" max="0.005" step="0.0005" value={understeerGradient}
              onChange={(e) => setUndersteerGradient(parseFloat(e.target.value))} style={{ width: "100%" }} />
            <div style={{
              fontSize: "0.8em",
              padding: "0.25rem 0.5rem",
              borderRadius: "4px",
              marginTop: "0.25rem",
              background: understeerGradient > 0 ? "rgba(100, 255, 100, 0.2)" : understeerGradient < 0 ? "rgba(255, 100, 100, 0.2)" : "rgba(255, 200, 87, 0.2)",
            }}>
              {understeerGradient > 0 ? "UNDERSTEER" : understeerGradient < 0 ? "OVERSTEER" : "NEUTRAL"}
            </div>
          </div>
          <div>
            <label>Velocity: {velocity} m/s ({(velocity * 3.6).toFixed(0)} km/h)</label>
            <input type="range" min="10" max="40" step="1" value={velocity}
              onChange={(e) => setVelocity(parseInt(e.target.value))} style={{ width: "100%" }} />
            <label style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginTop: "0.5rem", fontSize: "0.9em" }}>
              <input type="checkbox" checked={showTrajectory} onChange={(e) => setShowTrajectory(e.target.checked)} />
              Show sample trajectory
            </label>
          </div>
        </div>
      </div>

      <div className="slide-card">
        <div className="slide-card__title">Critical Speed & Yaw Damping</div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
          <div style={{ padding: "1rem", background: "rgba(0,0,0,0.2)", borderRadius: "8px" }}>
            <b>Critical Speed (V<sub>crit</sub>)</b>
            <div style={{
              fontSize: "1.5em",
              margin: "0.5rem 0",
              fontFamily: "monospace",
              color: isOversteer ? (isUnstable ? "#f44" : "#ff0") : "#4f4",
            }}>
              {isOversteer ? `${(Vcrit * 3.6).toFixed(0)} km/h` : "∞ (stable)"}
            </div>
            <p style={{ fontSize: "0.85em" }}>
              {isOversteer
                ? isUnstable
                  ? "DANGER: Current speed exceeds critical speed!"
                  : "Speed is below critical - vehicle is controllable."
                : "Understeer vehicles have no critical speed limitation."}
            </p>
          </div>
          <div style={{ padding: "1rem", background: "rgba(0,0,0,0.2)", borderRadius: "8px" }}>
            <b>Yaw Damping</b>
            <div style={{
              fontSize: "1.5em",
              margin: "0.5rem 0",
              fontFamily: "monospace",
              color: yawDamping > 2 ? "#4f4" : yawDamping > 1 ? "#ff0" : "#f44",
            }}>
              {yawDamping.toFixed(2)} rad/s
            </div>
            <p style={{ fontSize: "0.85em" }}>
              {yawDamping > 2
                ? "Well damped - vehicle feels stable and composed."
                : yawDamping > 1
                  ? "Moderately damped - some oscillation may occur."
                  : "Lightly damped - vehicle may feel nervous."}
            </p>
          </div>
        </div>
      </div>

      <div className="slide-card slide-card--aside">
        <div>
          <div className="slide-card__title">Stability Detection in AVs</div>
          <ul>
            <li><b>Yaw rate sensor:</b> Compares actual vs expected yaw rate</li>
            <li><b>Sideslip estimation:</b> From GPS, IMU, and wheel speeds</li>
            <li><b>ESC intervention:</b> Brakes individual wheels to correct yaw</li>
            <li><b>Envelope control:</b> Keeps vehicle within stable region</li>
          </ul>
        </div>
        <div className="slide-callout slide-callout--info">
          <b>Design Philosophy:</b> Most production vehicles are designed to understeer
          because untrained drivers can't recover from oversteer. AVs can potentially
          handle oversteer but still prefer understeer for passenger comfort.
        </div>
      </div>
    </div>
  );
}
