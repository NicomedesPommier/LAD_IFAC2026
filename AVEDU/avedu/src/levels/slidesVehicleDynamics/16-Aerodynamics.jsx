// src/levels/slidesVehicleDynamics/16-Aerodynamics.jsx
import React, { useState, useEffect, useRef } from "react";

export const meta = {
  id: "aerodynamics",
  title: "Aerodynamics Basics",
  order: 16,
  objectiveCode: "VD_AERO",
};

export default function Aerodynamics() {
  const canvasRef = useRef(null);
  const [speed, setSpeed] = useState(30); // m/s
  const [cd, setCd] = useState(0.3); // drag coefficient
  const [frontalArea, setFrontalArea] = useState(2.2); // m²

  const rho = 1.225; // air density kg/m³
  const dragForce = 0.5 * rho * cd * frontalArea * speed * speed;
  const dragPower = dragForce * speed / 1000; // kW

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const W = canvas.width;
    const H = canvas.height;

    ctx.clearRect(0, 0, W, H);

    // Draw car silhouette
    const carX = 100;
    const carY = H / 2;

    // Simplified car shape
    ctx.fillStyle = "rgba(125, 249, 255, 0.3)";
    ctx.strokeStyle = "#7df9ff";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(carX, carY + 20);
    ctx.lineTo(carX + 20, carY + 20);
    ctx.lineTo(carX + 30, carY);
    ctx.lineTo(carX + 80, carY - 10);
    ctx.lineTo(carX + 140, carY - 10);
    ctx.lineTo(carX + 160, carY);
    ctx.lineTo(carX + 180, carY + 20);
    ctx.lineTo(carX + 180, carY + 30);
    ctx.lineTo(carX, carY + 30);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Wheels
    ctx.fillStyle = "#333";
    ctx.beginPath();
    ctx.arc(carX + 40, carY + 30, 15, 0, Math.PI * 2);
    ctx.arc(carX + 150, carY + 30, 15, 0, Math.PI * 2);
    ctx.fill();

    // Air flow lines
    const numLines = 8;
    const flowIntensity = Math.min(1, speed / 50);

    for (let i = 0; i < numLines; i++) {
      const y = carY - 50 + i * 15;
      const lineLen = 60 + flowIntensity * 40;

      ctx.strokeStyle = `rgba(100, 200, 255, ${0.3 + flowIntensity * 0.4})`;
      ctx.lineWidth = 1 + flowIntensity;
      ctx.beginPath();

      // Streamlines that curve around car
      if (y < carY - 20 || y > carY + 35) {
        // Above or below car - straight through
        ctx.moveTo(carX - 50, y);
        ctx.lineTo(carX + 200, y);
      } else {
        // Around the car
        ctx.moveTo(carX - 50, y);
        ctx.quadraticCurveTo(carX + 90, y < carY ? carY - 40 : carY + 60, carX + 200, y);
      }
      ctx.stroke();

      // Flow arrows
      ctx.fillStyle = `rgba(100, 200, 255, ${0.5 + flowIntensity * 0.3})`;
      const arrowX = carX - 30;
      ctx.beginPath();
      ctx.moveTo(arrowX, y);
      ctx.lineTo(arrowX - 8, y - 4);
      ctx.lineTo(arrowX - 8, y + 4);
      ctx.closePath();
      ctx.fill();
    }

    // Drag force arrow
    const dragArrowLen = Math.min(100, dragForce / 50);
    ctx.strokeStyle = "#f44";
    ctx.fillStyle = "#f44";
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(carX + 90, carY + 10);
    ctx.lineTo(carX + 90 - dragArrowLen, carY + 10);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(carX + 90 - dragArrowLen, carY + 10);
    ctx.lineTo(carX + 90 - dragArrowLen + 12, carY + 5);
    ctx.lineTo(carX + 90 - dragArrowLen + 12, carY + 15);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = "#f44";
    ctx.font = "12px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(`Drag: ${dragForce.toFixed(0)} N`, carX + 90 - dragArrowLen / 2, carY - 5);

    // Lift/downforce arrows (small)
    ctx.strokeStyle = "#ff0";
    ctx.fillStyle = "#ff0";
    ctx.lineWidth = 2;

    // Front lift
    ctx.beginPath();
    ctx.moveTo(carX + 50, carY - 15);
    ctx.lineTo(carX + 50, carY - 35);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(carX + 50, carY - 35);
    ctx.lineTo(carX + 45, carY - 28);
    ctx.lineTo(carX + 55, carY - 28);
    ctx.closePath();
    ctx.fill();

    // Rear lift (smaller, or downforce with spoiler)
    ctx.beginPath();
    ctx.moveTo(carX + 150, carY - 15);
    ctx.lineTo(carX + 150, carY - 30);
    ctx.stroke();

    ctx.fillStyle = "#ff0";
    ctx.font = "10px sans-serif";
    ctx.fillText("Lift", carX + 50, carY - 40);

    // Speed indicator
    ctx.fillStyle = "#fff";
    ctx.font = "14px sans-serif";
    ctx.textAlign = "left";
    ctx.fillText(`Speed: ${speed} m/s (${(speed * 3.6).toFixed(0)} km/h)`, W - 180, 30);

    // Wake turbulence
    ctx.strokeStyle = "rgba(255, 100, 100, 0.3)";
    ctx.lineWidth = 1;
    for (let i = 0; i < 5; i++) {
      const startX = carX + 185 + i * 20;
      ctx.beginPath();
      ctx.arc(startX, carY + 10, 10 + i * 5, 0, Math.PI * 2);
      ctx.stroke();
    }

  }, [speed, cd, frontalArea, dragForce]);

  return (
    <div className="slide">
      <h2>Aerodynamics Basics</h2>

      <div className="slide-card">
        <div className="slide-card__title">Aerodynamic Forces Visualization</div>
        <canvas
          ref={canvasRef}
          width={500}
          height={200}
          style={{ width: "100%", background: "rgba(0,0,0,0.2)", borderRadius: "8px" }}
        />
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "1rem", marginTop: "1rem" }}>
          <div>
            <label>Speed: {speed} m/s ({(speed * 3.6).toFixed(0)} km/h)</label>
            <input type="range" min="5" max="50" step="1" value={speed}
              onChange={(e) => setSpeed(parseInt(e.target.value))} style={{ width: "100%" }} />
          </div>
          <div>
            <label>Drag Coefficient (C<sub>d</sub>): {cd.toFixed(2)}</label>
            <input type="range" min="0.2" max="0.5" step="0.01" value={cd}
              onChange={(e) => setCd(parseFloat(e.target.value))} style={{ width: "100%" }} />
          </div>
          <div>
            <label>Frontal Area: {frontalArea.toFixed(1)} m²</label>
            <input type="range" min="1.8" max="3.0" step="0.1" value={frontalArea}
              onChange={(e) => setFrontalArea(parseFloat(e.target.value))} style={{ width: "100%" }} />
          </div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginTop: "1rem", textAlign: "center" }}>
          <div style={{ padding: "0.75rem", background: "rgba(255, 100, 100, 0.2)", borderRadius: "8px" }}>
            <b>Drag Force:</b> {dragForce.toFixed(0)} N
          </div>
          <div style={{ padding: "0.75rem", background: "rgba(255, 200, 87, 0.2)", borderRadius: "8px" }}>
            <b>Power to overcome drag:</b> {dragPower.toFixed(1)} kW ({(dragPower * 1.34).toFixed(0)} hp)
          </div>
        </div>
      </div>

      <div className="slide-card">
        <div className="slide-card__title">Drag Formula</div>
        <div style={{
          background: "rgba(0,0,0,0.3)",
          padding: "1rem",
          borderRadius: "8px",
          fontFamily: "monospace",
          textAlign: "center",
          fontSize: "1.2em"
        }}>
          F<sub>drag</sub> = ½ · ρ · C<sub>d</sub> · A · v²
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "0.5rem", marginTop: "1rem", fontSize: "0.85em" }}>
          <div style={{ padding: "0.5rem", background: "rgba(0,0,0,0.2)", borderRadius: "4px", textAlign: "center" }}>
            <b>ρ</b><br />Air density<br />1.225 kg/m³
          </div>
          <div style={{ padding: "0.5rem", background: "rgba(0,0,0,0.2)", borderRadius: "4px", textAlign: "center" }}>
            <b>C<sub>d</sub></b><br />Drag coeff.<br />0.25-0.45
          </div>
          <div style={{ padding: "0.5rem", background: "rgba(0,0,0,0.2)", borderRadius: "4px", textAlign: "center" }}>
            <b>A</b><br />Frontal area<br />1.8-2.5 m²
          </div>
          <div style={{ padding: "0.5rem", background: "rgba(0,0,0,0.2)", borderRadius: "4px", textAlign: "center" }}>
            <b>v²</b><br />Velocity squared<br />(key factor!)
          </div>
        </div>
      </div>

      <div className="slide-card">
        <div className="slide-card__title">Aerodynamic Effects on Dynamics</div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "1rem" }}>
          <div style={{
            padding: "1rem",
            background: "rgba(255, 100, 100, 0.1)",
            borderRadius: "8px",
            border: "2px solid rgba(255, 100, 100, 0.3)"
          }}>
            <b>Drag</b>
            <p style={{ fontSize: "0.85em", marginTop: "0.5rem" }}>
              Resists forward motion. Quadratic with speed - doubling speed = 4x drag.
              Dominates at highway speeds.
            </p>
          </div>
          <div style={{
            padding: "1rem",
            background: "rgba(255, 200, 87, 0.1)",
            borderRadius: "8px",
            border: "2px solid rgba(255, 200, 87, 0.3)"
          }}>
            <b>Lift/Downforce</b>
            <p style={{ fontSize: "0.85em", marginTop: "0.5rem" }}>
              Most cars generate lift at speed, reducing tire grip.
              Sports cars use spoilers/diffusers for downforce.
            </p>
          </div>
          <div style={{
            padding: "1rem",
            background: "rgba(125, 249, 255, 0.1)",
            borderRadius: "8px",
            border: "2px solid rgba(125, 249, 255, 0.3)"
          }}>
            <b>Crosswind</b>
            <p style={{ fontSize: "0.85em", marginTop: "0.5rem" }}>
              Side winds create lateral forces and yaw moments.
              Tall vehicles (trucks, SUVs) are more sensitive.
            </p>
          </div>
        </div>
      </div>

      <div className="slide-card slide-card--aside">
        <div>
          <div className="slide-card__title">Typical Drag Coefficients</div>
          <ul>
            <li><b>Tesla Model S:</b> 0.208 (very low)</li>
            <li><b>Toyota Prius:</b> 0.24</li>
            <li><b>Typical sedan:</b> 0.27-0.32</li>
            <li><b>SUV:</b> 0.35-0.45</li>
            <li><b>Pickup truck:</b> 0.40-0.50</li>
            <li><b>Semi truck:</b> 0.60-0.80</li>
          </ul>
        </div>
        <div className="slide-callout slide-callout--info">
          <b>For AVs:</b> Aerodynamic effects become significant above 50 km/h. At highway speeds,
          drag is the dominant resistance force. Crosswinds require active steering compensation.
        </div>
      </div>
    </div>
  );
}
