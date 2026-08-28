// src/levels/slidesVehicleDynamics/05-TireForcesSlipAngles.jsx
import React, { useState, useRef, useEffect } from "react";

export const meta = {
  id: "vd-tire-forces",
  title: "Tire Forces and Slip Angles",
  order: 5,
  objectiveCode: "vd-slide-tire-forces",
};

function TireForceVisualization({ slipAngle, normalForce, corneringStiffness }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const w = canvas.width;
    const h = canvas.height;

    ctx.fillStyle = "#0a0e1a";
    ctx.fillRect(0, 0, w, h);

    const centerX = w / 2;
    const centerY = h / 2;
    const scale = 8;

    // Calculate lateral force using linear tire model
    const alphaRad = (slipAngle * Math.PI) / 180;
    const lateralForce = -corneringStiffness * alphaRad; // Negative for convention

    // Draw ground reference line
    ctx.strokeStyle = "rgba(255,255,255,0.2)";
    ctx.lineWidth = 2;
    ctx.setLineDash([10, 5]);
    ctx.beginPath();
    ctx.moveTo(centerX - 150, centerY + 60);
    ctx.lineTo(centerX + 150, centerY + 60);
    ctx.stroke();
    ctx.setLineDash([]);

    // Draw tire
    ctx.save();
    ctx.translate(centerX, centerY);

    // Tire body (rectangle)
    ctx.fillStyle = "#2a2a2a";
    ctx.strokeStyle = "#7df9ff";
    ctx.lineWidth = 3;
    const tireWidth = 30;
    const tireHeight = 80;
    ctx.fillRect(-tireWidth / 2, -tireHeight / 2, tireWidth, tireHeight);
    ctx.strokeRect(-tireWidth / 2, -tireHeight / 2, tireWidth, tireHeight);

    // Tire tread pattern
    ctx.strokeStyle = "#4a4a4a";
    ctx.lineWidth = 2;
    for (let i = -3; i <= 3; i++) {
      ctx.beginPath();
      ctx.moveTo(-tireWidth / 2, i * 12);
      ctx.lineTo(tireWidth / 2, i * 12);
      ctx.stroke();
    }

    // Wheel orientation line
    ctx.strokeStyle = "#ff5cf4";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(0, -tireHeight / 2 - 20);
    ctx.lineTo(0, tireHeight / 2 + 20);
    ctx.stroke();

    // Velocity direction (actual direction of travel)
    ctx.save();
    ctx.rotate(alphaRad);
    ctx.strokeStyle = "#7df9ff";
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(0, -100);
    ctx.stroke();

    // Arrow head for velocity
    ctx.fillStyle = "#7df9ff";
    ctx.beginPath();
    ctx.moveTo(0, -100);
    ctx.lineTo(-8, -90);
    ctx.lineTo(8, -90);
    ctx.closePath();
    ctx.fill();

    ctx.font = "bold 14px monospace";
    ctx.fillStyle = "#7df9ff";
    ctx.fillText("V", 10, -85);
    ctx.restore();

    // Slip angle arc
    if (Math.abs(slipAngle) > 0.5) {
      ctx.strokeStyle = "#ffd700";
      ctx.lineWidth = 2;
      ctx.beginPath();
      const arcRadius = 50;
      ctx.arc(0, 0, arcRadius, -Math.PI / 2, -Math.PI / 2 + alphaRad, alphaRad > 0);
      ctx.stroke();

      ctx.font = "13px monospace";
      ctx.fillStyle = "#ffd700";
      const labelAngle = -Math.PI / 2 + alphaRad / 2;
      ctx.fillText("α", arcRadius * Math.cos(labelAngle) + 10, arcRadius * Math.sin(labelAngle));
    }

    // Lateral force vector
    if (Math.abs(lateralForce) > 0.1) {
      const forceScale = scale * 0.5;
      const forceLength = Math.min(Math.abs(lateralForce * forceScale), 150);
      const forceDir = lateralForce > 0 ? 1 : -1;

      ctx.strokeStyle = "#ff5cf4";
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(forceDir * forceLength, 0);
      ctx.stroke();

      // Arrow head for force
      ctx.fillStyle = "#ff5cf4";
      ctx.beginPath();
      ctx.moveTo(forceDir * forceLength, 0);
      ctx.lineTo(forceDir * forceLength - forceDir * 10, -7);
      ctx.lineTo(forceDir * forceLength - forceDir * 10, 7);
      ctx.closePath();
      ctx.fill();

      ctx.font = "bold 14px monospace";
      ctx.fillStyle = "#ff5cf4";
      ctx.fillText("Fy", forceDir * (forceLength + 15), -10);
    }

    ctx.restore();

    // Display values
    ctx.font = "13px monospace";
    ctx.fillStyle = "#a8b3d1";
    const info = [
      `Slip Angle α: ${slipAngle.toFixed(1)}°`,
      `Cornering Stiffness Cα: ${corneringStiffness.toFixed(0)} N/rad`,
      `Normal Force Fz: ${normalForce.toFixed(0)} N`,
      `Lateral Force Fy: ${lateralForce.toFixed(1)} N`,
    ];
    info.forEach((line, i) => {
      ctx.fillText(line, 15, 25 + i * 20);
    });

    // Legend
    ctx.font = "12px monospace";
    ctx.fillStyle = "#7df9ff";
    ctx.fillText("— Velocity direction", w - 180, h - 60);
    ctx.fillStyle = "#ff5cf4";
    ctx.fillText("— Wheel orientation", w - 180, h - 40);
    ctx.fillText("— Lateral force", w - 180, h - 20);

  }, [slipAngle, normalForce, corneringStiffness]);

  return (
    <canvas
      ref={canvasRef}
      width={700}
      height={500}
      style={{
        width: "100%",
        height: "auto",
        border: "1px solid rgba(255,255,255,0.2)",
        borderRadius: "10px",
        background: "#0a0e1a"
      }}
    />
  );
}

function TireCharacteristicCurve({ corneringStiffness }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const w = canvas.width;
    const h = canvas.height;

    ctx.fillStyle = "#0a0e1a";
    ctx.fillRect(0, 0, w, h);

    const marginX = 60;
    const marginY = 40;
    const plotW = w - 2 * marginX;
    const plotH = h - 2 * marginY;

    // Axes
    ctx.strokeStyle = "rgba(255,255,255,0.3)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(marginX, marginY);
    ctx.lineTo(marginX, h - marginY);
    ctx.lineTo(w - marginX, h - marginY);
    ctx.stroke();

    // Labels
    ctx.font = "12px monospace";
    ctx.fillStyle = "#a8b3d1";
    ctx.fillText("Slip Angle α (deg)", w / 2 - 50, h - 10);
    ctx.save();
    ctx.translate(15, h / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.fillText("Lateral Force Fy (N)", -60, 0);
    ctx.restore();

    // Grid
    ctx.strokeStyle = "rgba(255,255,255,0.1)";
    ctx.lineWidth = 1;
    for (let i = 0; i <= 10; i++) {
      const x = marginX + (i / 10) * plotW;
      ctx.beginPath();
      ctx.moveTo(x, marginY);
      ctx.lineTo(x, h - marginY);
      ctx.stroke();

      const y = marginY + (i / 10) * plotH;
      ctx.beginPath();
      ctx.moveTo(marginX, y);
      ctx.lineTo(w - marginX, y);
      ctx.stroke();
    }

    // Plot tire characteristic curve
    const maxAlpha = 15; // degrees
    const maxForce = corneringStiffness * (maxAlpha * Math.PI / 180);

    ctx.strokeStyle = "#7df9ff";
    ctx.lineWidth = 3;
    ctx.beginPath();

    for (let alpha = -maxAlpha; alpha <= maxAlpha; alpha += 0.1) {
      const alphaRad = (alpha * Math.PI) / 180;
      let fy = -corneringStiffness * alphaRad;

      // Saturation (simplified)
      const saturationLimit = maxForce * 0.8;
      if (Math.abs(fy) > saturationLimit) {
        fy = Math.sign(fy) * saturationLimit * (1 - 0.1 * (Math.abs(fy) - saturationLimit) / saturationLimit);
      }

      const x = marginX + ((alpha + maxAlpha) / (2 * maxAlpha)) * plotW;
      const y = (h - marginY) - ((fy + maxForce) / (2 * maxForce)) * plotH;

      if (alpha === -maxAlpha) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    }
    ctx.stroke();

    // Linear region indicator
    ctx.strokeStyle = "#ff5cf4";
    ctx.lineWidth = 2;
    ctx.setLineDash([5, 5]);
    const linearLimit = 5;
    const x1 = marginX + ((- linearLimit + maxAlpha) / (2 * maxAlpha)) * plotW;
    const x2 = marginX + ((linearLimit + maxAlpha) / (2 * maxAlpha)) * plotW;
    ctx.beginPath();
    ctx.moveTo(x1, marginY);
    ctx.lineTo(x1, h - marginY);
    ctx.moveTo(x2, marginY);
    ctx.lineTo(x2, h - marginY);
    ctx.stroke();
    ctx.setLineDash([]);

    ctx.font = "11px monospace";
    ctx.fillStyle = "#ff5cf4";
    ctx.fillText("Linear", x1 + 5, marginY + 15);
    ctx.fillText("Region", x1 + 5, marginY + 30);

    // Tick marks and labels
    ctx.font = "10px monospace";
    ctx.fillStyle = "#a8b3d1";
    for (let i = -maxAlpha; i <= maxAlpha; i += 5) {
      const x = marginX + ((i + maxAlpha) / (2 * maxAlpha)) * plotW;
      ctx.fillText(i.toString(), x - 8, h - marginY + 15);
    }

  }, [corneringStiffness]);

  return (
    <canvas
      ref={canvasRef}
      width={500}
      height={350}
      style={{
        width: "100%",
        height: "auto",
        border: "1px solid rgba(255,255,255,0.2)",
        borderRadius: "10px",
        background: "#0a0e1a"
      }}
    />
  );
}

export default function TireForcesSlipAngles() {
  const [slipAngle, setSlipAngle] = useState(5);
  const [normalForce, setNormalForce] = useState(4000);
  const [corneringStiffness, setCorneringStiffness] = useState(80000);

  return (
    <div className="slide">
      <h2>Tire Forces and Slip Angles</h2>

      <div className="slide-card">
        <div className="slide-card__title">Slip Angle Definition</div>
        <p>
          The <b>slip angle (α)</b> is the angle between the tire's direction of heading and
          its actual direction of travel. When a tire has a slip angle, it generates a
          <b> lateral force</b> perpendicular to the wheel plane. This is fundamental to vehicle cornering.
        </p>
      </div>

      <div className="slide-columns">
        <div>
          <div className="slide-card">
            <div className="slide-card__title">Linear Tire Model</div>
            <div className="slide-code">
              {`Fy = -Cα · α

Where:
• Fy = Lateral force (N)
• Cα = Cornering stiffness (N/rad)
• α = Slip angle (rad)

Typical values:
• Cα ≈ 50,000-100,000 N/rad
  (for passenger cars)
• Linear up to ~5° slip angle
• Saturates at higher angles`}
            </div>
          </div>

          <div className="slide-card" style={{ marginTop: ".75rem" }}>
            <div className="slide-card__title">Interactive Controls</div>
            <div style={{ display: "grid", gap: ".5rem" }}>
              <label style={{ display: "grid", gap: ".25rem" }}>
                <span>Slip Angle α: {slipAngle.toFixed(1)}°</span>
                <input
                  type="range"
                  min="-15"
                  max="15"
                  step="0.5"
                  value={slipAngle}
                  onChange={(e) => setSlipAngle(Number(e.target.value))}
                  style={{ width: "100%" }}
                />
              </label>

              <label style={{ display: "grid", gap: ".25rem" }}>
                <span>Cornering Stiffness Cα: {corneringStiffness.toFixed(0)} N/rad</span>
                <input
                  type="range"
                  min="40000"
                  max="120000"
                  step="5000"
                  value={corneringStiffness}
                  onChange={(e) => setCorneringStiffness(Number(e.target.value))}
                  style={{ width: "100%" }}
                />
              </label>

              <label style={{ display: "grid", gap: ".25rem" }}>
                <span>Normal Force Fz: {normalForce.toFixed(0)} N</span>
                <input
                  type="range"
                  min="2000"
                  max="8000"
                  step="500"
                  value={normalForce}
                  onChange={(e) => setNormalForce(Number(e.target.value))}
                  style={{ width: "100%" }}
                />
              </label>

              <div className="slide-code" style={{ fontSize: "0.85rem", padding: ".4rem" }}>
                Calculated Force:
                <br />
                Fy = <b>{(-corneringStiffness * slipAngle * Math.PI / 180).toFixed(1)} N</b>
                <br />
                (Linear model)
              </div>
            </div>
          </div>
        </div>

        <div>
          <div className="slide-figure">
            <TireForceVisualization
              slipAngle={slipAngle}
              normalForce={normalForce}
              corneringStiffness={corneringStiffness}
            />
            <figcaption>
              Top view of tire: The velocity direction (cyan) differs from wheel orientation (pink)
              by the slip angle α. This generates lateral force Fy (pink arrow).
            </figcaption>
          </div>
        </div>
      </div>

      <div className="slide-figure" style={{ marginTop: ".75rem" }}>
        <div className="slide-card__title">Tire Characteristic Curve</div>
        <TireCharacteristicCurve corneringStiffness={corneringStiffness} />
        <figcaption>
          Lateral force vs. slip angle. The relationship is approximately linear for small slip angles
          (±5°) but saturates at larger angles due to tire friction limits.
        </figcaption>
      </div>

      <div className="slide-callout slide-callout--warn">
        <b>Important:</b> The linear model (Fy = -Cα·α) is valid only for small slip angles.
        At larger angles, the tire saturates and may lose grip completely. This is why stability
        control systems try to keep slip angles small during aggressive maneuvers.
      </div>
    </div>
  );
}
