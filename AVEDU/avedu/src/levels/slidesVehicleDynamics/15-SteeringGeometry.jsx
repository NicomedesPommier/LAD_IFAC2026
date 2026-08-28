// src/levels/slidesVehicleDynamics/15-SteeringGeometry.jsx
import React, { useState, useEffect, useRef } from "react";

export const meta = {
  id: "steering-geometry",
  title: "Steering Geometry: Toe, Camber, Caster",
  order: 15,
  objectiveCode: "VD_STEERING_GEOM",
};

export default function SteeringGeometry() {
  const canvasRef = useRef(null);
  const [toe, setToe] = useState(0); // degrees, positive = toe-in
  const [camber, setCamber] = useState(0); // degrees, negative = negative camber
  const [caster, setCaster] = useState(5); // degrees

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const W = canvas.width;
    const H = canvas.height;

    ctx.clearRect(0, 0, W, H);

    // Draw three views
    const viewWidth = W / 3;

    // === TOP VIEW (Toe) ===
    const topCx = viewWidth / 2;
    const topCy = H / 2;

    ctx.fillStyle = "#fff";
    ctx.font = "14px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("TOP VIEW (Toe)", topCx, 25);

    // Car body outline
    ctx.strokeStyle = "rgba(125, 249, 255, 0.3)";
    ctx.lineWidth = 1;
    ctx.strokeRect(topCx - 30, topCy - 60, 60, 120);

    // Direction arrow
    ctx.fillStyle = "#7df9ff";
    ctx.beginPath();
    ctx.moveTo(topCx, topCy - 70);
    ctx.lineTo(topCx - 8, topCy - 55);
    ctx.lineTo(topCx + 8, topCy - 55);
    ctx.closePath();
    ctx.fill();

    // Wheels with toe angle
    const toeRad = (toe * Math.PI) / 180;
    const wheelLen = 35;

    // Left wheel
    ctx.save();
    ctx.translate(topCx - 45, topCy - 40);
    ctx.rotate(toeRad);
    ctx.fillStyle = toe > 0 ? "#4f4" : toe < 0 ? "#f44" : "#888";
    ctx.fillRect(-5, -wheelLen / 2, 10, wheelLen);
    ctx.restore();

    // Right wheel
    ctx.save();
    ctx.translate(topCx + 45, topCy - 40);
    ctx.rotate(-toeRad);
    ctx.fillStyle = toe > 0 ? "#4f4" : toe < 0 ? "#f44" : "#888";
    ctx.fillRect(-5, -wheelLen / 2, 10, wheelLen);
    ctx.restore();

    // Toe lines extended
    if (Math.abs(toe) > 0.1) {
      ctx.strokeStyle = toe > 0 ? "rgba(100, 255, 100, 0.5)" : "rgba(255, 100, 100, 0.5)";
      ctx.setLineDash([5, 5]);
      ctx.beginPath();
      ctx.moveTo(topCx - 45, topCy - 40);
      ctx.lineTo(topCx - 45 + Math.sin(toeRad) * 80, topCy - 40 - Math.cos(toeRad) * 80);
      ctx.moveTo(topCx + 45, topCy - 40);
      ctx.lineTo(topCx + 45 - Math.sin(toeRad) * 80, topCy - 40 - Math.cos(toeRad) * 80);
      ctx.stroke();
      ctx.setLineDash([]);
    }

    ctx.fillStyle = "#fff";
    ctx.font = "11px sans-serif";
    ctx.fillText(toe > 0 ? "TOE-IN" : toe < 0 ? "TOE-OUT" : "ZERO TOE", topCx, H - 20);

    // === FRONT VIEW (Camber) ===
    const frontCx = viewWidth + viewWidth / 2;
    const frontCy = H / 2 + 20;

    ctx.fillStyle = "#fff";
    ctx.font = "14px sans-serif";
    ctx.fillText("FRONT VIEW (Camber)", frontCx, 25);

    // Ground line
    ctx.strokeStyle = "#555";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(viewWidth + 20, frontCy + 50);
    ctx.lineTo(viewWidth * 2 - 20, frontCy + 50);
    ctx.stroke();

    // Vertical reference
    ctx.strokeStyle = "rgba(255,255,255,0.2)";
    ctx.setLineDash([3, 3]);
    ctx.beginPath();
    ctx.moveTo(frontCx - 50, frontCy - 60);
    ctx.lineTo(frontCx - 50, frontCy + 50);
    ctx.moveTo(frontCx + 50, frontCy - 60);
    ctx.lineTo(frontCx + 50, frontCy + 50);
    ctx.stroke();
    ctx.setLineDash([]);

    // Wheels with camber
    const camberRad = (camber * Math.PI) / 180;
    const wheelHeight = 60;

    // Left wheel
    ctx.save();
    ctx.translate(frontCx - 50, frontCy + 45);
    ctx.rotate(-camberRad);
    ctx.fillStyle = camber < 0 ? "#4f4" : camber > 0 ? "#f44" : "#888";
    ctx.fillRect(-8, -wheelHeight, 16, wheelHeight);
    ctx.restore();

    // Right wheel
    ctx.save();
    ctx.translate(frontCx + 50, frontCy + 45);
    ctx.rotate(camberRad);
    ctx.fillStyle = camber < 0 ? "#4f4" : camber > 0 ? "#f44" : "#888";
    ctx.fillRect(-8, -wheelHeight, 16, wheelHeight);
    ctx.restore();

    // Car body
    ctx.fillStyle = "rgba(125, 249, 255, 0.2)";
    ctx.strokeStyle = "#7df9ff";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(frontCx - 40, frontCy - 50, 80, 40, 8);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = "#fff";
    ctx.font = "11px sans-serif";
    ctx.fillText(camber < 0 ? "NEGATIVE CAMBER" : camber > 0 ? "POSITIVE CAMBER" : "ZERO CAMBER", frontCx, H - 20);

    // === SIDE VIEW (Caster) ===
    const sideCx = viewWidth * 2 + viewWidth / 2;
    const sideCy = H / 2 + 20;

    ctx.fillStyle = "#fff";
    ctx.font = "14px sans-serif";
    ctx.fillText("SIDE VIEW (Caster)", sideCx, 25);

    // Ground
    ctx.strokeStyle = "#555";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(viewWidth * 2 + 20, sideCy + 50);
    ctx.lineTo(W - 20, sideCy + 50);
    ctx.stroke();

    // Wheel
    ctx.fillStyle = "#888";
    ctx.beginPath();
    ctx.arc(sideCx, sideCy + 30, 25, 0, Math.PI * 2);
    ctx.fill();

    // Steering axis with caster
    const casterRad = (caster * Math.PI) / 180;
    const axisLen = 80;

    ctx.strokeStyle = "#f5f";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(sideCx + Math.sin(casterRad) * 30, sideCy + 50);
    ctx.lineTo(sideCx - Math.sin(casterRad) * axisLen, sideCy + 50 - Math.cos(casterRad) * axisLen);
    ctx.stroke();

    // Vertical reference
    ctx.strokeStyle = "rgba(255,255,255,0.3)";
    ctx.setLineDash([3, 3]);
    ctx.beginPath();
    ctx.moveTo(sideCx, sideCy + 50);
    ctx.lineTo(sideCx, sideCy - 60);
    ctx.stroke();
    ctx.setLineDash([]);

    // Caster angle arc
    ctx.strokeStyle = "#f5f";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(sideCx, sideCy + 50, 30, -Math.PI / 2, -Math.PI / 2 + casterRad, false);
    ctx.stroke();

    // Direction label
    ctx.fillStyle = "#7df9ff";
    ctx.font = "10px sans-serif";
    ctx.fillText("← FRONT", sideCx - 40, sideCy + 70);

    ctx.fillStyle = "#fff";
    ctx.font = "11px sans-serif";
    ctx.fillText(`CASTER: ${caster}°`, sideCx, H - 20);

  }, [toe, camber, caster]);

  return (
    <div className="slide">
      <h2>Steering Geometry: Toe, Camber, Caster</h2>

      <div className="slide-card">
        <div className="slide-card__title">Interactive Alignment Visualization</div>
        <canvas
          ref={canvasRef}
          width={600}
          height={280}
          style={{ width: "100%", background: "rgba(0,0,0,0.2)", borderRadius: "8px" }}
        />
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "1rem", marginTop: "1rem" }}>
          <div>
            <label>Toe: {toe > 0 ? "+" : ""}{toe.toFixed(1)}°</label>
            <input type="range" min="-3" max="3" step="0.1" value={toe}
              onChange={(e) => setToe(parseFloat(e.target.value))} style={{ width: "100%" }} />
          </div>
          <div>
            <label>Camber: {camber > 0 ? "+" : ""}{camber.toFixed(1)}°</label>
            <input type="range" min="-4" max="2" step="0.1" value={camber}
              onChange={(e) => setCamber(parseFloat(e.target.value))} style={{ width: "100%" }} />
          </div>
          <div>
            <label>Caster: {caster.toFixed(1)}°</label>
            <input type="range" min="0" max="10" step="0.5" value={caster}
              onChange={(e) => setCaster(parseFloat(e.target.value))} style={{ width: "100%" }} />
          </div>
        </div>
      </div>

      <div className="slide-card">
        <div className="slide-card__title">Alignment Parameters Explained</div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "1rem" }}>
          <div style={{
            padding: "1rem",
            background: "rgba(125, 249, 255, 0.1)",
            borderRadius: "8px",
            border: "2px solid rgba(125, 249, 255, 0.3)"
          }}>
            <b>Toe</b>
            <p style={{ fontSize: "0.85em", marginTop: "0.5rem" }}>
              <b>Toe-in:</b> Wheels point inward. Improves straight-line stability, causes understeer.
            </p>
            <p style={{ fontSize: "0.85em", marginTop: "0.25rem" }}>
              <b>Toe-out:</b> Wheels point outward. Improves turn-in response, less stable.
            </p>
            <div style={{ fontSize: "0.8em", opacity: 0.7, marginTop: "0.5rem" }}>
              Typical: 0° to +0.2° (toe-in)
            </div>
          </div>
          <div style={{
            padding: "1rem",
            background: "rgba(255, 95, 244, 0.1)",
            borderRadius: "8px",
            border: "2px solid rgba(255, 95, 244, 0.3)"
          }}>
            <b>Camber</b>
            <p style={{ fontSize: "0.85em", marginTop: "0.5rem" }}>
              <b>Negative:</b> Top tilts inward. Better cornering grip, uneven tire wear.
            </p>
            <p style={{ fontSize: "0.85em", marginTop: "0.25rem" }}>
              <b>Positive:</b> Top tilts outward. Rarely used, reduces grip.
            </p>
            <div style={{ fontSize: "0.8em", opacity: 0.7, marginTop: "0.5rem" }}>
              Typical: -0.5° to -2° (street), -3° to -4° (race)
            </div>
          </div>
          <div style={{
            padding: "1rem",
            background: "rgba(255, 200, 87, 0.1)",
            borderRadius: "8px",
            border: "2px solid rgba(255, 200, 87, 0.3)"
          }}>
            <b>Caster</b>
            <p style={{ fontSize: "0.85em", marginTop: "0.5rem" }}>
              Steering axis tilt. More caster = better self-centering and high-speed stability.
            </p>
            <p style={{ fontSize: "0.85em", marginTop: "0.25rem" }}>
              Creates camber change during steering (outside wheel gains negative camber).
            </p>
            <div style={{ fontSize: "0.8em", opacity: 0.7, marginTop: "0.5rem" }}>
              Typical: 3° to 7°
            </div>
          </div>
        </div>
      </div>

      <div className="slide-card slide-card--aside">
        <div>
          <div className="slide-card__title">Why Ackermann Steering Exists</div>
          <p>
            Recall from earlier: during a turn, inner and outer wheels travel different radii.
            <b> Ackermann geometry</b> ensures both front wheels point toward the turn center,
            preventing tire scrub.
          </p>
          <ul style={{ marginTop: "0.5rem" }}>
            <li>Inner wheel steers more than outer wheel</li>
            <li>100% Ackermann is optimal for low-speed parking</li>
            <li>Partial Ackermann (50-70%) used for high-speed cornering</li>
          </ul>
        </div>
        <div className="slide-callout slide-callout--info">
          <b>For AVs:</b> Proper alignment is critical for accurate odometry and path following.
          Misalignment causes drift and heading errors that accumulate over distance.
        </div>
      </div>
    </div>
  );
}
