// src/levels/slidesVehicleDynamics/13-SuspensionBasics.jsx
import React, { useState, useEffect, useRef } from "react";

export const meta = {
  id: "suspension-basics",
  title: "Suspension Basics",
  order: 13,
  objectiveCode: "VD_SUSPENSION",
};

export default function SuspensionBasics() {
  const canvasRef = useRef(null);
  const [springRate, setSpringRate] = useState(30000); // N/m
  const [dampingRate, setDampingRate] = useState(2000); // Ns/m
  const [roadInput, setRoadInput] = useState(0);
  const [time, setTime] = useState(0);
  const animRef = useRef(null);

  // Simple spring-mass-damper simulation
  const mass = 400; // kg (quarter car)
  const naturalFreq = Math.sqrt(springRate / mass) / (2 * Math.PI);
  const dampingRatio = dampingRate / (2 * Math.sqrt(springRate * mass));

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const W = canvas.width;
    const H = canvas.height;

    let t = 0;
    let bodyPos = 0;
    let bodyVel = 0;
    const dt = 0.016;

    const animate = () => {
      ctx.clearRect(0, 0, W, H);

      // Road input (bump)
      const roadY = roadInput * Math.sin(t * 5) * Math.exp(-t * 2);

      // Spring-mass-damper response
      const springForce = -springRate * (bodyPos - roadY);
      const dampingForce = -dampingRate * bodyVel;
      const accel = (springForce + dampingForce) / mass;
      bodyVel += accel * dt;
      bodyPos += bodyVel * dt;

      // Draw
      const groundY = H - 50;
      const wheelY = groundY - 30 - roadY * 100;
      const bodyY = groundY - 100 - bodyPos * 100;

      // Ground
      ctx.strokeStyle = "#555";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(0, groundY);
      ctx.lineTo(W, groundY);
      ctx.stroke();

      // Bump on road
      if (Math.abs(roadY) > 0.001) {
        ctx.fillStyle = "#666";
        ctx.beginPath();
        ctx.arc(W / 2, groundY, 20 + roadY * 50, 0, Math.PI, true);
        ctx.fill();
      }

      // Wheel
      ctx.fillStyle = "#333";
      ctx.strokeStyle = "#555";
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(W / 2, wheelY, 25, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Spring (zigzag)
      const springTop = bodyY + 20;
      const springBot = wheelY - 10;
      const springMid = (springTop + springBot) / 2;
      const coils = 6;
      const coilHeight = (springBot - springTop) / coils;

      ctx.strokeStyle = "#7df9ff";
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(W / 2 - 30, springTop);
      for (let i = 0; i < coils; i++) {
        const y1 = springTop + i * coilHeight + coilHeight * 0.25;
        const y2 = springTop + i * coilHeight + coilHeight * 0.75;
        ctx.lineTo(W / 2 - 30 + (i % 2 === 0 ? 15 : -15), y1);
        ctx.lineTo(W / 2 - 30 + (i % 2 === 0 ? -15 : 15), y2);
      }
      ctx.lineTo(W / 2 - 30, springBot);
      ctx.stroke();

      // Damper
      ctx.strokeStyle = "#f5f";
      ctx.lineWidth = 2;
      ctx.fillStyle = "rgba(255, 95, 244, 0.3)";
      ctx.beginPath();
      ctx.rect(W / 2 + 15, springMid - 30, 30, 60);
      ctx.fill();
      ctx.stroke();
      // Damper piston
      ctx.fillStyle = "#f5f";
      ctx.fillRect(W / 2 + 25, springTop, 10, springMid - springTop - 25);

      // Body (quarter car)
      ctx.fillStyle = "rgba(125, 249, 255, 0.3)";
      ctx.strokeStyle = "#7df9ff";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.roundRect(W / 2 - 60, bodyY - 40, 120, 60, 10);
      ctx.fill();
      ctx.stroke();

      // Labels
      ctx.fillStyle = "#fff";
      ctx.font = "12px sans-serif";
      ctx.textAlign = "left";
      ctx.fillText("Body Mass (Sprung)", W / 2 + 70, bodyY - 10);
      ctx.fillText("Spring", W / 2 - 80, springMid);
      ctx.fillText("Damper", W / 2 + 50, springMid);
      ctx.fillText("Wheel (Unsprung)", W / 2 + 35, wheelY);

      t += dt;
      setTime(t);
      animRef.current = requestAnimationFrame(animate);
    };

    animate();
    return () => cancelAnimationFrame(animRef.current);
  }, [springRate, dampingRate, roadInput]);

  const triggerBump = () => {
    setRoadInput(prev => prev === 0 ? 0.5 : 0);
    setTimeout(() => setRoadInput(0), 100);
  };

  return (
    <div className="slide">
      <h2>Suspension Basics</h2>

      <div className="slide-card">
        <div className="slide-card__title">What Does Suspension Do?</div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "1rem" }}>
          <div style={{
            padding: "1rem",
            background: "rgba(125, 249, 255, 0.1)",
            borderRadius: "8px",
            border: "2px solid rgba(125, 249, 255, 0.3)",
            textAlign: "center"
          }}>
            <b>Isolate the Body</b>
            <p style={{ fontSize: "0.85em", marginTop: "0.5rem" }}>
              Filters road vibrations for passenger comfort
            </p>
          </div>
          <div style={{
            padding: "1rem",
            background: "rgba(255, 95, 244, 0.1)",
            borderRadius: "8px",
            border: "2px solid rgba(255, 95, 244, 0.3)",
            textAlign: "center"
          }}>
            <b>Maintain Contact</b>
            <p style={{ fontSize: "0.85em", marginTop: "0.5rem" }}>
              Keeps tires in contact with the road surface
            </p>
          </div>
          <div style={{
            padding: "1rem",
            background: "rgba(255, 200, 87, 0.1)",
            borderRadius: "8px",
            border: "2px solid rgba(255, 200, 87, 0.3)",
            textAlign: "center"
          }}>
            <b>Control Motion</b>
            <p style={{ fontSize: "0.85em", marginTop: "0.5rem" }}>
              Manages roll, pitch, and heave during maneuvers
            </p>
          </div>
        </div>
      </div>

      <div className="slide-card">
        <div className="slide-card__title">Quarter-Car Model Simulation</div>
        <canvas
          ref={canvasRef}
          width={400}
          height={300}
          style={{ width: "100%", maxWidth: "400px", margin: "0 auto", display: "block", background: "rgba(0,0,0,0.2)", borderRadius: "8px" }}
        />
        <div style={{ textAlign: "center", marginTop: "1rem" }}>
          <button className="btn" onClick={triggerBump} style={{ padding: "0.75rem 2rem" }}>
            Trigger Road Bump
          </button>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginTop: "1rem" }}>
          <div>
            <label>Spring Rate: {(springRate / 1000).toFixed(0)} kN/m</label>
            <input type="range" min="15000" max="60000" step="1000" value={springRate}
              onChange={(e) => setSpringRate(parseInt(e.target.value))} style={{ width: "100%" }} />
          </div>
          <div>
            <label>Damping Rate: {dampingRate} Ns/m</label>
            <input type="range" min="500" max="5000" step="100" value={dampingRate}
              onChange={(e) => setDampingRate(parseInt(e.target.value))} style={{ width: "100%" }} />
          </div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginTop: "0.5rem", textAlign: "center" }}>
          <div style={{ padding: "0.5rem", background: "rgba(0,0,0,0.2)", borderRadius: "4px" }}>
            Natural Freq: <b>{naturalFreq.toFixed(2)} Hz</b>
          </div>
          <div style={{ padding: "0.5rem", background: "rgba(0,0,0,0.2)", borderRadius: "4px" }}>
            Damping Ratio: <b>{dampingRatio.toFixed(2)}</b>
            <span style={{ fontSize: "0.8em", marginLeft: "0.5rem" }}>
              ({dampingRatio < 0.3 ? "Underdamped" : dampingRatio < 0.8 ? "Optimal" : "Overdamped"})
            </span>
          </div>
        </div>
      </div>

      <div className="slide-card">
        <div className="slide-card__title">Body Motions</div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "1rem" }}>
          <div style={{ padding: "1rem", background: "rgba(0,0,0,0.2)", borderRadius: "8px", textAlign: "center" }}>
            <div style={{ fontSize: "2em" }}>↻</div>
            <b>Roll</b>
            <p style={{ fontSize: "0.85em", marginTop: "0.5rem" }}>
              Rotation about longitudinal axis (cornering)
            </p>
          </div>
          <div style={{ padding: "1rem", background: "rgba(0,0,0,0.2)", borderRadius: "8px", textAlign: "center" }}>
            <div style={{ fontSize: "2em" }}>⤵</div>
            <b>Pitch</b>
            <p style={{ fontSize: "0.85em", marginTop: "0.5rem" }}>
              Rotation about lateral axis (braking/accel)
            </p>
          </div>
          <div style={{ padding: "1rem", background: "rgba(0,0,0,0.2)", borderRadius: "8px", textAlign: "center" }}>
            <div style={{ fontSize: "2em" }}>↕</div>
            <b>Heave</b>
            <p style={{ fontSize: "0.85em", marginTop: "0.5rem" }}>
              Vertical translation (bumps)
            </p>
          </div>
        </div>
      </div>

      <div className="slide-card slide-card--aside">
        <div>
          <div className="slide-card__title">Suspension Compliance Effects</div>
          <p>Under load, suspension geometry changes, affecting handling:</p>
          <ul style={{ marginTop: "0.5rem" }}>
            <li><b>Camber change:</b> Wheel angle varies with suspension travel</li>
            <li><b>Toe change:</b> Steering angle varies under braking/cornering</li>
            <li><b>Roll center migration:</b> Affects load transfer path</li>
            <li><b>Anti-dive/squat:</b> Geometry can reduce pitch motions</li>
          </ul>
        </div>
        <div className="slide-callout slide-callout--info">
          <b>Typical values:</b> Passenger cars: 1-1.5 Hz natural frequency,
          0.2-0.4 damping ratio. Sports cars: higher frequencies and damping.
        </div>
      </div>
    </div>
  );
}
