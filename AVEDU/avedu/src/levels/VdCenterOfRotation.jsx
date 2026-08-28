// src/levels/VdCenterOfRotation.jsx
import React, { useState, useRef, useEffect } from "react";

export default function VdCenterOfRotation({ onObjectiveHit, onLevelCompleted }) {
  const [steeringAngle, setSteeringAngle] = useState(20);
  const [wheelbase, setWheelbase] = useState(2.5);
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    // Clear
    ctx.fillStyle = '#0a0e1a';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const scale = 50;
    const centerX = 350;
    const centerY = 200;

    // Calculate ICR position
    const steeringRad = (steeringAngle * Math.PI) / 180;
    const turnRadius = wheelbase / Math.tan(steeringRad);
    const icrX = centerX;
    const icrY = centerY - turnRadius * scale;

    // Draw ICR
    ctx.fillStyle = '#ff5cf4';
    ctx.beginPath();
    ctx.arc(icrX, icrY, 12, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#ff5cf4';
    ctx.font = 'bold 14px monospace';
    ctx.fillText('ICR', icrX + 15, icrY + 5);

    // Draw turning circle
    ctx.strokeStyle = 'rgba(255, 92, 244, 0.3)';
    ctx.lineWidth = 2;
    ctx.setLineDash([5, 5]);
    ctx.beginPath();
    ctx.arc(icrX, icrY, Math.abs(turnRadius * scale), 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);

    // Draw vehicle
    const vehicleLength = wheelbase * scale;
    const vehicleWidth = 30;

    ctx.save();
    ctx.translate(centerX, centerY);

    // Vehicle body
    ctx.fillStyle = '#7df9ff';
    ctx.fillRect(-vehicleLength / 2, -vehicleWidth / 2, vehicleLength, vehicleWidth);

    // Front wheels (steered)
    ctx.save();
    ctx.translate(vehicleLength / 2, -vehicleWidth / 2);
    ctx.rotate(steeringRad);
    ctx.fillStyle = '#4ade80';
    ctx.fillRect(-5, -10, 10, 20);
    ctx.restore();

    ctx.save();
    ctx.translate(vehicleLength / 2, vehicleWidth / 2);
    ctx.rotate(steeringRad);
    ctx.fillStyle = '#4ade80';
    ctx.fillRect(-5, -10, 10, 20);
    ctx.restore();

    // Rear wheels
    ctx.fillStyle = '#4ade80';
    ctx.fillRect(-vehicleLength / 2 - 5, -vehicleWidth / 2 - 10, 10, 20);
    ctx.fillRect(-vehicleLength / 2 - 5, vehicleWidth / 2 - 10, 10, 20);

    ctx.restore();

    // Draw lines from wheels to ICR
    ctx.strokeStyle = 'rgba(74, 222, 128, 0.5)';
    ctx.lineWidth = 1;
    ctx.setLineDash([3, 3]);

    // Front left wheel to ICR
    ctx.beginPath();
    ctx.moveTo(centerX + vehicleLength / 2, centerY - vehicleWidth / 2);
    ctx.lineTo(icrX, icrY);
    ctx.stroke();

    // Rear left wheel to ICR
    ctx.beginPath();
    ctx.moveTo(centerX - vehicleLength / 2, centerY - vehicleWidth / 2);
    ctx.lineTo(icrX, icrY);
    ctx.stroke();

    ctx.setLineDash([]);

    // Draw info
    ctx.fillStyle = '#7df9ff';
    ctx.font = '14px monospace';
    ctx.fillText(`Steering angle: ${steeringAngle.toFixed(1)}°`, 10, 20);
    ctx.fillText(`Turn radius: ${Math.abs(turnRadius).toFixed(2)} m`, 10, 40);
    ctx.fillText(`Wheelbase: ${wheelbase.toFixed(1)} m`, 10, 60);

  }, [steeringAngle, wheelbase]);

  const handleComplete = () => {
    onObjectiveHit?.('VD_ICR_COMPLETE');
    onLevelCompleted?.();
  };

  return (
    <div className="slide-wrap">
      <h2>Instantaneous Center of Rotation (ICR)</h2>

      <div className="slide-card">
        <div className="slide-card__title">What is ICR?</div>
        <p>
          The Instantaneous Center of Rotation (ICR) is the point about which a vehicle rotates at any given instant.
          All points on the vehicle move in circular paths around the ICR. Understanding ICR is fundamental to
          vehicle steering and control.
        </p>
      </div>

      <div className="slide-columns">
        <div className="slide-card">
          <div className="slide-card__title">Interactive Visualization</div>
          <canvas
            ref={canvasRef}
            width={700}
            height={400}
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
                Steering Angle: <span className="slide-slider__value">{steeringAngle.toFixed(1)}°</span>
              </span>
              <input
                type="range"
                min="5"
                max="45"
                step="1"
                value={steeringAngle}
                onChange={(e) => setSteeringAngle(Number(e.target.value))}
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
          </div>
        </div>

        <div>
          <div className="slide-card">
            <div className="slide-card__title">Key Properties</div>
            <ul style={{ fontSize: '.9rem' }}>
              <li>ICR lies on the extension of the rear axle</li>
              <li>All wheel axes must intersect at the ICR</li>
              <li>Smaller steering angle = larger turn radius</li>
              <li>Longer wheelbase = larger turn radius</li>
              <li>Front wheels point toward ICR direction</li>
            </ul>
          </div>

          <div className="slide-card" style={{ marginTop: '.75rem' }}>
            <div className="slide-card__title">Mathematical Relationship</div>
            <div className="slide-code" style={{ fontSize: '.85rem' }}>
              {`Turn Radius:
R = L / tan(δ)

Where:
• R = turn radius to ICR
• L = wheelbase
• δ = steering angle

Angular Velocity:
ω = v / R

Where:
• ω = yaw rate (rad/s)
• v = forward velocity`}
            </div>
          </div>
        </div>
      </div>

      <div className="slide-callout slide-callout--info">
        <b>Important:</b> The ICR concept assumes no tire slip. In real vehicles at high speeds,
        tires slip and the actual rotation point differs from the kinematic ICR. This is addressed
        in dynamic models.
      </div>

      <div className="slide-callout slide-callout--success">
        <b>Try It:</b> Adjust the steering angle and wheelbase to see how they affect the ICR position
        and turning radius. Notice how the wheels always "point toward" the ICR.
      </div>

      <div className="slide-actions">
        <button className="btn btn--primary" onClick={handleComplete}>
          Complete Level ✓
        </button>
      </div>
    </div>
  );
}
