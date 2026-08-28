// src/levels/slidesVehicleDynamics/11-WeightDistribution.jsx
import React, { useState, useCallback, useEffect, useRef } from "react";

export const meta = {
  id: "weight-distribution",
  title: "Weight Distribution & Center of Gravity",
  order: 11,
  objectiveCode: "VD_WEIGHT_DIST",
};

export default function WeightDistribution() {
  const canvasRef = useRef(null);
  const [cgHeight, setCgHeight] = useState(0.5); // meters
  const [cgLongPos, setCgLongPos] = useState(0.45); // 0-1 (front to rear)
  const [wheelbase, setWheelbase] = useState(2.7); // meters
  const [totalWeight, setTotalWeight] = useState(1500); // kg

  // Calculate weight distribution
  const lf = wheelbase * cgLongPos;
  const lr = wheelbase * (1 - cgLongPos);
  const frontWeight = (lr / wheelbase) * totalWeight;
  const rearWeight = (lf / wheelbase) * totalWeight;
  const frontPercent = ((frontWeight / totalWeight) * 100).toFixed(1);
  const rearPercent = ((rearWeight / totalWeight) * 100).toFixed(1);

  // Draw vehicle visualization
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const W = canvas.width;
    const H = canvas.height;

    ctx.clearRect(0, 0, W, H);

    // Draw ground
    ctx.strokeStyle = "#555";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(50, H - 50);
    ctx.lineTo(W - 50, H - 50);
    ctx.stroke();

    // Scale factors
    const scale = 80;
    const carLength = wheelbase * scale;
    const carHeight = 60;
    const startX = (W - carLength) / 2;
    const groundY = H - 50;

    // Draw wheels
    ctx.fillStyle = "#333";
    ctx.beginPath();
    ctx.arc(startX, groundY, 20, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(startX + carLength, groundY, 20, 0, Math.PI * 2);
    ctx.fill();

    // Draw car body
    ctx.fillStyle = "rgba(125, 249, 255, 0.3)";
    ctx.strokeStyle = "#7df9ff";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(startX - 20, groundY - carHeight - 20, carLength + 40, carHeight, 10);
    ctx.fill();
    ctx.stroke();

    // Draw CG point
    const cgX = startX + cgLongPos * carLength;
    const cgY = groundY - 20 - (cgHeight * scale * 0.5);

    // CG vertical line
    ctx.strokeStyle = "rgba(255, 200, 87, 0.5)";
    ctx.setLineDash([5, 5]);
    ctx.beginPath();
    ctx.moveTo(cgX, groundY);
    ctx.lineTo(cgX, cgY);
    ctx.stroke();
    ctx.setLineDash([]);

    // CG point
    ctx.fillStyle = "#ffc857";
    ctx.beginPath();
    ctx.arc(cgX, cgY, 12, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#000";
    ctx.font = "bold 10px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("CG", cgX, cgY + 4);

    // Draw weight arrows
    const arrowScale = 0.15;

    // Front weight arrow
    ctx.fillStyle = "#4f4";
    ctx.strokeStyle = "#4f4";
    ctx.lineWidth = 3;
    const frontArrowLen = frontWeight * arrowScale;
    ctx.beginPath();
    ctx.moveTo(startX, groundY + 30);
    ctx.lineTo(startX, groundY + 30 + frontArrowLen);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(startX - 8, groundY + 30 + frontArrowLen - 10);
    ctx.lineTo(startX, groundY + 30 + frontArrowLen);
    ctx.lineTo(startX + 8, groundY + 30 + frontArrowLen - 10);
    ctx.fill();

    // Rear weight arrow
    ctx.fillStyle = "#f5f";
    ctx.strokeStyle = "#f5f";
    const rearArrowLen = rearWeight * arrowScale;
    ctx.beginPath();
    ctx.moveTo(startX + carLength, groundY + 30);
    ctx.lineTo(startX + carLength, groundY + 30 + rearArrowLen);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(startX + carLength - 8, groundY + 30 + rearArrowLen - 10);
    ctx.lineTo(startX + carLength, groundY + 30 + rearArrowLen);
    ctx.lineTo(startX + carLength + 8, groundY + 30 + rearArrowLen - 10);
    ctx.fill();

    // Labels
    ctx.fillStyle = "#fff";
    ctx.font = "12px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(`Front: ${frontWeight.toFixed(0)} kg`, startX, H - 15);
    ctx.fillText(`Rear: ${rearWeight.toFixed(0)} kg`, startX + carLength, H - 15);
    ctx.fillText(`h = ${cgHeight.toFixed(2)} m`, cgX + 50, cgY);

    // Wheelbase dimension
    ctx.strokeStyle = "#888";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(startX, groundY - carHeight - 40);
    ctx.lineTo(startX + carLength, groundY - carHeight - 40);
    ctx.stroke();
    ctx.fillStyle = "#888";
    ctx.fillText(`L = ${wheelbase.toFixed(2)} m`, startX + carLength / 2, groundY - carHeight - 50);

  }, [cgHeight, cgLongPos, wheelbase, totalWeight, frontWeight, rearWeight]);

  return (
    <div className="slide">
      <h2>Weight Distribution & Center of Gravity</h2>

      <div className="slide-card">
        <div className="slide-card__title">Why Weight Distribution Matters</div>
        <p>
          The <b>center of gravity (CG)</b> location determines how weight is distributed
          across the axles. This affects handling, traction, and stability in fundamental ways.
        </p>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginTop: "1rem" }}>
          <div style={{
            padding: "1rem",
            background: "rgba(125, 249, 255, 0.1)",
            borderRadius: "8px",
            border: "2px solid rgba(125, 249, 255, 0.3)"
          }}>
            <b>Longitudinal Position</b>
            <p style={{ fontSize: "0.9em", marginTop: "0.5rem" }}>
              Front/rear weight distribution affects understeer/oversteer balance,
              braking stability, and traction during acceleration.
            </p>
          </div>
          <div style={{
            padding: "1rem",
            background: "rgba(255, 95, 244, 0.1)",
            borderRadius: "8px",
            border: "2px solid rgba(255, 95, 244, 0.3)"
          }}>
            <b>CG Height</b>
            <p style={{ fontSize: "0.9em", marginTop: "0.5rem" }}>
              Higher CG increases roll during cornering and weight transfer during
              braking/acceleration. Critical for SUVs and trucks.
            </p>
          </div>
        </div>
      </div>

      <div className="slide-card">
        <div className="slide-card__title">Interactive Weight Distribution</div>
        <canvas
          ref={canvasRef}
          width={600}
          height={300}
          style={{ width: "100%", background: "rgba(0,0,0,0.2)", borderRadius: "8px" }}
        />
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginTop: "1rem" }}>
          <div>
            <label>CG Longitudinal Position: {(cgLongPos * 100).toFixed(0)}% from front</label>
            <input type="range" min="0.3" max="0.7" step="0.01" value={cgLongPos}
              onChange={(e) => setCgLongPos(parseFloat(e.target.value))} style={{ width: "100%" }} />
          </div>
          <div>
            <label>CG Height: {cgHeight.toFixed(2)} m</label>
            <input type="range" min="0.3" max="1.0" step="0.01" value={cgHeight}
              onChange={(e) => setCgHeight(parseFloat(e.target.value))} style={{ width: "100%" }} />
          </div>
          <div>
            <label>Wheelbase: {wheelbase.toFixed(2)} m</label>
            <input type="range" min="2.0" max="3.5" step="0.1" value={wheelbase}
              onChange={(e) => setWheelbase(parseFloat(e.target.value))} style={{ width: "100%" }} />
          </div>
          <div>
            <label>Total Weight: {totalWeight} kg</label>
            <input type="range" min="1000" max="2500" step="50" value={totalWeight}
              onChange={(e) => setTotalWeight(parseInt(e.target.value))} style={{ width: "100%" }} />
          </div>
        </div>
        <div style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: "1rem",
          marginTop: "1rem",
          textAlign: "center"
        }}>
          <div style={{ padding: "1rem", background: "rgba(100, 255, 100, 0.2)", borderRadius: "8px" }}>
            <b style={{ fontSize: "1.5em" }}>{frontPercent}%</b>
            <div>Front Axle</div>
          </div>
          <div style={{ padding: "1rem", background: "rgba(255, 100, 255, 0.2)", borderRadius: "8px" }}>
            <b style={{ fontSize: "1.5em" }}>{rearPercent}%</b>
            <div>Rear Axle</div>
          </div>
        </div>
      </div>

      <div className="slide-card">
        <div className="slide-card__title">Static Weight Distribution Formula</div>
        <div style={{
          background: "rgba(0,0,0,0.3)",
          padding: "1rem",
          borderRadius: "8px",
          fontFamily: "monospace"
        }}>
          <div style={{ marginBottom: "0.5rem" }}>
            <b>Front Axle Load:</b> W<sub>f</sub> = W · (l<sub>r</sub> / L)
          </div>
          <div style={{ marginBottom: "0.5rem" }}>
            <b>Rear Axle Load:</b> W<sub>r</sub> = W · (l<sub>f</sub> / L)
          </div>
          <div style={{ fontSize: "0.85em", opacity: 0.8, marginTop: "1rem" }}>
            Where: W = total weight, L = wheelbase, l<sub>f</sub> = CG to front, l<sub>r</sub> = CG to rear
          </div>
        </div>
      </div>

      <div className="slide-card slide-card--aside">
        <div>
          <div className="slide-card__title">Typical Weight Distributions</div>
          <ul>
            <li><b>Sports cars:</b> 50/50 or 48/52 (rear-biased for RWD traction)</li>
            <li><b>Front-engine FWD:</b> 60/40 to 65/35 (front-heavy)</li>
            <li><b>Mid-engine:</b> 40/60 to 45/55 (optimal balance)</li>
            <li><b>Pickup trucks:</b> 55/45 empty, 40/60 loaded</li>
          </ul>
        </div>
        <div className="slide-callout slide-callout--info">
          <b>CG Height Impact:</b> A sedan (~0.5m CG) vs SUV (~0.7m CG) can have
          40% more roll angle in the same corner due to the higher CG.
        </div>
      </div>
    </div>
  );
}
