// src/levels/VdAckermann.jsx
import React, { useState, useRef, useEffect } from "react";

export default function VdAckermann({ onObjectiveHit, onLevelCompleted }) {
  const [innerAngle, setInnerAngle] = useState(30);
  const [wheelbase, setWheelbase] = useState(2.5);
  const [trackWidth, setTrackWidth] = useState(1.5);
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    ctx.fillStyle = '#0a0e1a';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const scale = 50;
    const centerX = 350;
    const centerY = 250;

    // Calculate Ackermann geometry
    const innerRad = (innerAngle * Math.PI) / 180;
    const R_inner = wheelbase / Math.tan(innerRad);
    const R_outer = Math.sqrt(wheelbase ** 2 + (R_inner + trackWidth) ** 2);
    const outerAngle = Math.atan(wheelbase / (R_inner + trackWidth)) * (180 / Math.PI);

    // ICR position
    const icrX = centerX - (R_inner + trackWidth / 2) * scale;
    const icrY = centerY;

    // Draw ICR
    ctx.fillStyle = '#ff5cf4';
    ctx.beginPath();
    ctx.arc(icrX, icrY, 12, 0, Math.PI * 2);
    ctx.fill();
    ctx.font = 'bold 14px monospace';
    ctx.fillText('ICR', icrX - 15, icrY - 15);

    // Draw vehicle
    const vehL = wheelbase * scale;
    const vehW = trackWidth * scale;

    ctx.save();
    ctx.translate(centerX, centerY);

    // Vehicle body
    ctx.fillStyle = 'rgba(125, 249, 255, 0.2)';
    ctx.strokeStyle = '#7df9ff';
    ctx.lineWidth = 2;
    ctx.strokeRect(-vehL / 2 - 10, -vehW / 2 - 10, vehL + 20, vehW + 20);

    // Draw circles from ICR to each wheel
    ctx.strokeStyle = 'rgba(255, 92, 244, 0.2)';
    ctx.lineWidth = 1;
    ctx.setLineDash([5, 5]);

    // Inner circle (left front)
    const r_inner = Math.sqrt((centerX - icrX) ** 2 + (centerY - (centerY - vehW / 2)) ** 2);
    ctx.beginPath();
    ctx.arc(icrX, icrY, r_inner, 0, Math.PI * 2);
    ctx.stroke();

    // Outer circle (right front)
    const r_outer = Math.sqrt((centerX - icrX) ** 2 + (centerY - (centerY + vehW / 2)) ** 2);
    ctx.beginPath();
    ctx.arc(icrX, icrY, r_outer, 0, Math.PI * 2);
    ctx.stroke();

    ctx.setLineDash([]);

    // Inner wheel (left, larger angle)
    ctx.save();
    ctx.translate(vehL / 2, -vehW / 2);
    ctx.rotate(-innerRad);
    ctx.fillStyle = '#4ade80';
    ctx.fillRect(-5, -12, 10, 24);
    ctx.restore();

    // Outer wheel (right, smaller angle)
    ctx.save();
    ctx.translate(vehL / 2, vehW / 2);
    ctx.rotate(-(outerAngle * Math.PI) / 180);
    ctx.fillStyle = '#fbbf24';
    ctx.fillRect(-5, -12, 10, 24);
    ctx.restore();

    // Rear wheels
    ctx.fillStyle = '#7df9ff';
    ctx.fillRect(-vehL / 2 - 5, -vehW / 2 - 10, 10, 20);
    ctx.fillRect(-vehL / 2 - 5, vehW / 2 - 10, 10, 20);

    // Lines from wheels to ICR
    ctx.strokeStyle = 'rgba(74, 222, 128, 0.6)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(vehL / 2, -vehW / 2);
    ctx.lineTo(icrX - centerX, icrY - centerY);
    ctx.stroke();

    ctx.strokeStyle = 'rgba(251, 191, 36, 0.6)';
    ctx.beginPath();
    ctx.moveTo(vehL / 2, vehW / 2);
    ctx.lineTo(icrX - centerX, icrY - centerY);
    ctx.stroke();

    ctx.restore();

    // Draw info
    ctx.fillStyle = '#7df9ff';
    ctx.font = '14px monospace';
    ctx.fillText(`Wheelbase: ${wheelbase.toFixed(1)} m`, 10, 20);
    ctx.fillText(`Track width: ${trackWidth.toFixed(1)} m`, 10, 40);
    ctx.fillStyle = '#4ade80';
    ctx.fillText(`Inner angle (left): ${innerAngle.toFixed(1)}°`, 10, 70);
    ctx.fillStyle = '#fbbf24';
    ctx.fillText(`Outer angle (right): ${outerAngle.toFixed(1)}°`, 10, 90);
    ctx.fillStyle = '#ff5cf4';
    ctx.fillText(`Angle difference: ${(innerAngle - outerAngle).toFixed(1)}°`, 10, 110);

  }, [innerAngle, wheelbase, trackWidth]);

  const handleComplete = () => {
    onObjectiveHit?.('VD_ACKERMANN_COMPLETE');
    onLevelCompleted?.();
  };

  return (
    <div className="slide-wrap">
      <h2>Ackermann Steering Geometry</h2>

      <div className="slide-card">
        <div className="slide-card__title">What is Ackermann Steering?</div>
        <p>
          Ackermann steering geometry ensures that all wheels follow concentric circular paths around
          a common center point (ICR) during turns. The inner wheel turns at a sharper angle than the
          outer wheel to prevent tire scrubbing and enable smooth cornering.
        </p>
      </div>

      <div className="slide-columns">
        <div className="slide-card">
          <div className="slide-card__title">Interactive Ackermann Visualization</div>
          <canvas
            ref={canvasRef}
            width={700}
            height={500}
            style={{
              width: '100%',
              height: 'auto',
              border: '1px solid rgba(255,255,255,0.2)',
              borderRadius: '10px',
              background: '#0a0e1a'
            }}
          />

          <div style={{ marginTop: '.75rem' }}>
            <div className="slide-slider">
              <span className="slide-slider__label">
                Inner Steering Angle: <span className="slide-slider__value">{innerAngle.toFixed(1)}°</span>
              </span>
              <input
                type="range"
                min="10"
                max="45"
                step="1"
                value={innerAngle}
                onChange={(e) => setInnerAngle(Number(e.target.value))}
                className="slide-slider__input"
              />
            </div>

            <div className="slide-slider">
              <span className="slide-slider__label">
                Wheelbase: <span className="slide-slider__value">{wheelbase.toFixed(1)} m</span>
              </span>
              <input
                type="range"
                min="1.5"
                max="4.0"
                step="0.1"
                value={wheelbase}
                onChange={(e) => setWheelbase(Number(e.target.value))}
                className="slide-slider__input"
              />
            </div>

            <div className="slide-slider">
              <span className="slide-slider__label">
                Track Width: <span className="slide-slider__value">{trackWidth.toFixed(1)} m</span>
              </span>
              <input
                type="range"
                min="1.0"
                max="2.0"
                step="0.1"
                value={trackWidth}
                onChange={(e) => setTrackWidth(Number(e.target.value))}
                className="slide-slider__input"
              />
            </div>
          </div>
        </div>

        <div>
          <div className="slide-card">
            <div className="slide-card__title">Key Principles</div>
            <ul style={{ fontSize: '.9rem' }}>
              <li>Inner wheel (green) steers more sharply</li>
              <li>Outer wheel (yellow) steers less</li>
              <li>Both wheels point toward ICR</li>
              <li>Prevents tire scrubbing</li>
              <li>Enables tighter, smoother turns</li>
              <li>Reduces tire wear</li>
            </ul>
          </div>

          <div className="slide-card" style={{ marginTop: '.75rem' }}>
            <div className="slide-card__title">Ackermann Equation</div>
            <div className="slide-code" style={{ fontSize: '.85rem' }}>
              {`cot(δo) - cot(δi) = w / L

Where:
• δi = inner wheel angle
• δo = outer wheel angle
• w = track width
• L = wheelbase

Perfect Ackermann:
δo = atan(L / (L/tan(δi) + w))

100% Ackermann = perfect
geometry for tight turns`}
            </div>
          </div>
        </div>
      </div>

      <div className="slide-callout slide-callout--info">
        <b>Real-World Note:</b> Most production vehicles use partial Ackermann (50-70%) rather than
        perfect Ackermann. This provides a compromise between low-speed maneuverability and high-speed
        stability, where tire slip angles become more important.
      </div>

      <div className="slide-callout slide-callout--success">
        <b>Observe:</b> As you increase the steering angle, notice how the difference between inner
        and outer wheel angles increases. Wider track width also increases the angle difference.
      </div>

      <div className="slide-actions">
        <button className="btn btn--primary" onClick={handleComplete}>
          Complete Level ✓
        </button>
      </div>
    </div>
  );
}
