// src/levels/slidesVehicleDynamics/12-LoadTransfer.jsx
import React, { useState, useEffect, useRef } from "react";

export const meta = {
  id: "load-transfer",
  title: "Load Transfer Dynamics",
  order: 12,
  objectiveCode: "VD_LOAD_TRANSFER",
};

export default function LoadTransfer() {
  const canvasRef = useRef(null);
  const [acceleration, setAcceleration] = useState(0); // m/s² (positive = accel, negative = brake)
  const [lateralAccel, setLateralAccel] = useState(0); // m/s² (positive = right turn)
  const [cgHeight, setCgHeight] = useState(0.5);
  const [wheelbase, setWheelbase] = useState(2.7);
  const [trackWidth, setTrackWidth] = useState(1.6);
  const [mass, setMass] = useState(1500);

  const g = 9.81;
  const staticFront = mass * g * 0.5; // Assume 50/50 base
  const staticRear = mass * g * 0.5;

  // Longitudinal load transfer
  const longTransfer = (mass * acceleration * cgHeight) / wheelbase;
  const frontLoad = staticFront - longTransfer;
  const rearLoad = staticRear + longTransfer;

  // Lateral load transfer (per axle, simplified)
  const latTransfer = (mass * lateralAccel * cgHeight) / trackWidth;
  const leftLoad = (frontLoad + rearLoad) / 2 + latTransfer;
  const rightLoad = (frontLoad + rearLoad) / 2 - latTransfer;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const W = canvas.width;
    const H = canvas.height;

    ctx.clearRect(0, 0, W, H);

    // Draw top-down vehicle view
    const carW = 120;
    const carH = 200;
    const cx = W / 2;
    const cy = H / 2;

    // Car body
    ctx.fillStyle = "rgba(125, 249, 255, 0.2)";
    ctx.strokeStyle = "#7df9ff";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(cx - carW / 2, cy - carH / 2, carW, carH, 15);
    ctx.fill();
    ctx.stroke();

    // Direction arrow
    ctx.fillStyle = "#7df9ff";
    ctx.beginPath();
    ctx.moveTo(cx, cy - carH / 2 + 20);
    ctx.lineTo(cx - 15, cy - carH / 2 + 50);
    ctx.lineTo(cx + 15, cy - carH / 2 + 50);
    ctx.closePath();
    ctx.fill();

    // Wheels with load indication
    const wheelPositions = [
      { x: cx - carW / 2 - 10, y: cy - carH / 2 + 30, load: frontLoad / 2 + latTransfer / 2 },
      { x: cx + carW / 2 + 10, y: cy - carH / 2 + 30, load: frontLoad / 2 - latTransfer / 2 },
      { x: cx - carW / 2 - 10, y: cy + carH / 2 - 30, load: rearLoad / 2 + latTransfer / 2 },
      { x: cx + carW / 2 + 10, y: cy + carH / 2 - 30, load: rearLoad / 2 - latTransfer / 2 },
    ];

    const maxLoad = mass * g * 0.4;
    wheelPositions.forEach((wheel, i) => {
      const loadRatio = Math.max(0.1, Math.min(1, wheel.load / maxLoad));
      const wheelSize = 15 + loadRatio * 15;

      // Load intensity color
      const r = Math.min(255, Math.floor(loadRatio * 255));
      const g = Math.min(255, Math.floor((1 - loadRatio) * 200));
      ctx.fillStyle = `rgb(${r}, ${g}, 100)`;
      ctx.strokeStyle = "#fff";
      ctx.lineWidth = 2;

      ctx.beginPath();
      ctx.ellipse(wheel.x, wheel.y, 12, wheelSize, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Load value
      ctx.fillStyle = "#fff";
      ctx.font = "10px sans-serif";
      ctx.textAlign = "center";
      ctx.fillText(`${(wheel.load / 1000).toFixed(1)}kN`, wheel.x, wheel.y + wheelSize + 15);
    });

    // Acceleration arrow
    if (Math.abs(acceleration) > 0.1) {
      const arrowLen = Math.abs(acceleration) * 20;
      ctx.strokeStyle = acceleration > 0 ? "#4f4" : "#f44";
      ctx.fillStyle = acceleration > 0 ? "#4f4" : "#f44";
      ctx.lineWidth = 4;
      const arrowY = acceleration > 0 ? cy - carH / 2 - 30 : cy + carH / 2 + 30;
      const dir = acceleration > 0 ? -1 : 1;

      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(cx, arrowY);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(cx - 10, arrowY + dir * 15);
      ctx.lineTo(cx, arrowY);
      ctx.lineTo(cx + 10, arrowY + dir * 15);
      ctx.fill();

      ctx.fillStyle = "#fff";
      ctx.font = "12px sans-serif";
      ctx.fillText(acceleration > 0 ? "ACCEL" : "BRAKE", cx, arrowY + dir * 30);
    }

    // Lateral acceleration arrow
    if (Math.abs(lateralAccel) > 0.1) {
      ctx.strokeStyle = "#f5f";
      ctx.fillStyle = "#f5f";
      ctx.lineWidth = 4;
      const arrowX = lateralAccel > 0 ? cx + carW / 2 + 50 : cx - carW / 2 - 50;
      const dir = lateralAccel > 0 ? 1 : -1;

      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(arrowX, cy);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(arrowX - dir * 15, cy - 10);
      ctx.lineTo(arrowX, cy);
      ctx.lineTo(arrowX - dir * 15, cy + 10);
      ctx.fill();

      ctx.fillStyle = "#fff";
      ctx.fillText("TURN", arrowX + dir * 20, cy);
    }

  }, [acceleration, lateralAccel, frontLoad, rearLoad, latTransfer, mass]);

  return (
    <div className="slide">
      <h2>Load Transfer Dynamics</h2>

      <div className="slide-card">
        <div className="slide-card__title">What is Load Transfer?</div>
        <p>
          <b>Load transfer</b> is the shift of vertical tire loads during acceleration,
          braking, and cornering. It's caused by inertial forces acting through the CG,
          creating moments that redistribute weight across the tires.
        </p>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginTop: "1rem" }}>
          <div style={{
            padding: "1rem",
            background: "rgba(100, 255, 100, 0.1)",
            borderRadius: "8px",
            border: "2px solid rgba(100, 255, 100, 0.3)"
          }}>
            <b>Longitudinal Transfer</b>
            <p style={{ fontSize: "0.9em", marginTop: "0.5rem" }}>
              During braking: weight shifts forward (nose dive)<br />
              During acceleration: weight shifts rearward (squat)
            </p>
          </div>
          <div style={{
            padding: "1rem",
            background: "rgba(255, 95, 244, 0.1)",
            borderRadius: "8px",
            border: "2px solid rgba(255, 95, 244, 0.3)"
          }}>
            <b>Lateral Transfer</b>
            <p style={{ fontSize: "0.9em", marginTop: "0.5rem" }}>
              During cornering: weight shifts to outside wheels (body roll)<br />
              Inside wheels become unloaded
            </p>
          </div>
        </div>
      </div>

      <div className="slide-card">
        <div className="slide-card__title">Interactive Load Transfer Visualization</div>
        <canvas
          ref={canvasRef}
          width={400}
          height={350}
          style={{ width: "100%", maxWidth: "400px", margin: "0 auto", display: "block", background: "rgba(0,0,0,0.2)", borderRadius: "8px" }}
        />
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginTop: "1rem" }}>
          <div>
            <label>Longitudinal Accel: {acceleration.toFixed(1)} m/s² ({(acceleration / g).toFixed(2)}g)</label>
            <input type="range" min="-10" max="5" step="0.5" value={acceleration}
              onChange={(e) => setAcceleration(parseFloat(e.target.value))} style={{ width: "100%" }} />
            <div style={{ fontSize: "0.8em", opacity: 0.7 }}>Negative = Braking, Positive = Acceleration</div>
          </div>
          <div>
            <label>Lateral Accel: {lateralAccel.toFixed(1)} m/s² ({(lateralAccel / g).toFixed(2)}g)</label>
            <input type="range" min="-8" max="8" step="0.5" value={lateralAccel}
              onChange={(e) => setLateralAccel(parseFloat(e.target.value))} style={{ width: "100%" }} />
            <div style={{ fontSize: "0.8em", opacity: 0.7 }}>Positive = Right Turn</div>
          </div>
          <div>
            <label>CG Height: {cgHeight.toFixed(2)} m</label>
            <input type="range" min="0.3" max="1.0" step="0.05" value={cgHeight}
              onChange={(e) => setCgHeight(parseFloat(e.target.value))} style={{ width: "100%" }} />
          </div>
          <div>
            <label>Vehicle Mass: {mass} kg</label>
            <input type="range" min="1000" max="2500" step="100" value={mass}
              onChange={(e) => setMass(parseInt(e.target.value))} style={{ width: "100%" }} />
          </div>
        </div>
      </div>

      <div className="slide-card">
        <div className="slide-card__title">Load Transfer Formulas</div>
        <div style={{
          background: "rgba(0,0,0,0.3)",
          padding: "1rem",
          borderRadius: "8px",
          fontFamily: "monospace"
        }}>
          <div style={{ marginBottom: "1rem" }}>
            <b>Longitudinal Load Transfer:</b>
            <div style={{ marginTop: "0.5rem" }}>ΔW<sub>x</sub> = (m · a<sub>x</sub> · h) / L</div>
          </div>
          <div style={{ marginBottom: "1rem" }}>
            <b>Lateral Load Transfer:</b>
            <div style={{ marginTop: "0.5rem" }}>ΔW<sub>y</sub> = (m · a<sub>y</sub> · h) / t</div>
          </div>
          <div style={{ fontSize: "0.85em", opacity: 0.8 }}>
            m = mass, a = acceleration, h = CG height, L = wheelbase, t = track width
          </div>
        </div>
      </div>

      <div className="slide-card slide-card--aside">
        <div>
          <div className="slide-card__title">Tire Load Sensitivity</div>
          <p>
            <b>Critical concept:</b> Tires generate less force per unit of load as load increases.
            This is called <b>load sensitivity</b>.
          </p>
          <ul style={{ marginTop: "0.5rem" }}>
            <li>Doubling tire load does NOT double grip</li>
            <li>Two lightly loaded tires grip better than one heavily loaded tire</li>
            <li>This is why load transfer reduces total vehicle grip</li>
          </ul>
        </div>
        <div className="slide-callout slide-callout--warning">
          <b>Why it matters:</b> During hard cornering, the heavily loaded outside tires
          lose efficiency while the lightly loaded inside tires contribute less force.
          Total lateral grip is reduced compared to straight-line driving.
        </div>
      </div>
    </div>
  );
}
