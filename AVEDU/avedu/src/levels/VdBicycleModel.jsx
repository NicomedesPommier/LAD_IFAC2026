// src/levels/VdBicycleModel.jsx
import React, { useState, useRef, useEffect } from "react";
import DragDropQuiz from "../components/games/DragDropQuiz";

export default function VdBicycleModel({ onObjectiveHit, onLevelCompleted }) {
  const [velocity, setVelocity] = useState(15);
  const [steeringAngle, setSteeringAngle] = useState(0.15);
  const [wheelbase, setWheelbase] = useState(2.7);
  const [isPlaying, setIsPlaying] = useState(false);
  const canvasRef = useRef(null);
  const stateRef = useRef({ x: 300, y: 250, theta: 0, trail: [] });
  const animationRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    const animate = () => {
      if (isPlaying) {
        const state = stateRef.current;
        const dt = 0.05;

        // Bicycle model equations
        const v = velocity;
        const delta = steeringAngle;
        const L = wheelbase;

        // Update state
        state.x += v * Math.cos(state.theta) * dt;
        state.y += v * Math.sin(state.theta) * dt;
        state.theta += (v / L) * Math.tan(delta) * dt;

        // Wrap around canvas
        if (state.x > canvas.width) state.x = 0;
        if (state.x < 0) state.x = canvas.width;
        if (state.y > canvas.height) state.y = 0;
        if (state.y < 0) state.y = canvas.height;

        // Store trail
        state.trail.push({ x: state.x, y: state.y });
        if (state.trail.length > 300) state.trail.shift();
      }

      const state = stateRef.current;

      // Clear canvas
      ctx.fillStyle = '#0a0e1a';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Draw trail
      if (state.trail.length > 1) {
        ctx.strokeStyle = 'rgba(125, 249, 255, 0.4)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        state.trail.forEach((p, i) => {
          if (i === 0) ctx.moveTo(p.x, p.y);
          else ctx.lineTo(p.x, p.y);
        });
        ctx.stroke();
      }

      // Draw vehicle
      ctx.save();
      ctx.translate(state.x, state.y);
      ctx.rotate(state.theta);

      const L_scaled = wheelbase * 15;

      // Vehicle body
      ctx.fillStyle = '#7df9ff';
      ctx.fillRect(-L_scaled / 2, -15, L_scaled, 30);

      // Front wheel (steered)
      ctx.save();
      ctx.translate(L_scaled / 2, 0);
      ctx.rotate(steeringAngle);
      ctx.fillStyle = '#4ade80';
      ctx.fillRect(-4, -10, 8, 20);
      ctx.restore();

      // Rear wheel
      ctx.fillStyle = '#ff5cf4';
      ctx.fillRect(-L_scaled / 2 - 4, -10, 8, 20);

      // Direction arrow
      ctx.fillStyle = '#fbbf24';
      ctx.beginPath();
      ctx.moveTo(L_scaled / 2 + 10, 0);
      ctx.lineTo(L_scaled / 2, -8);
      ctx.lineTo(L_scaled / 2, 8);
      ctx.closePath();
      ctx.fill();

      ctx.restore();

      // Draw info
      ctx.fillStyle = '#7df9ff';
      ctx.font = '14px monospace';
      ctx.fillText(`Velocity: ${velocity.toFixed(1)} m/s`, 10, 20);
      ctx.fillText(`Steering: ${(steeringAngle * 180 / Math.PI).toFixed(1)}°`, 10, 40);
      ctx.fillText(`Heading: ${(state.theta * 180 / Math.PI).toFixed(1)}°`, 10, 60);
      ctx.fillText(`Yaw rate: ${((velocity / wheelbase) * Math.tan(steeringAngle)).toFixed(3)} rad/s`, 10, 80);

      animationRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isPlaying, velocity, steeringAngle, wheelbase]);

  const handleReset = () => {
    stateRef.current = { x: 300, y: 250, theta: 0, trail: [] };
    setIsPlaying(false);
  };

  const handleComplete = () => {
    onObjectiveHit?.('VD_BICYCLE_COMPLETE');
    onLevelCompleted?.();
  };

  return (
    <div className="slide-wrap">
      <h2>Bicycle Model</h2>

      <div className="slide-card">
        <div className="slide-card__title">The Kinematic Bicycle Model</div>
        <p>
          The bicycle model simplifies a four-wheel vehicle to two wheels (one front, one rear) located
          at the center of each axle. This model is accurate for low-speed motion and forms the basis
          for path planning and control in autonomous vehicles.
        </p>
      </div>

      <div className="slide-columns">
        <div className="slide-card">
          <div className="slide-card__title">Interactive Bicycle Model Simulation</div>
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

          <div style={{ marginTop: '.75rem', display: 'flex', gap: '.5rem', justifyContent: 'center' }}>
            <button
              className="btn"
              onClick={() => setIsPlaying(!isPlaying)}
              style={{ padding: '.5rem 1.5rem' }}
            >
              {isPlaying ? '⏸ Pause' : '▶ Play'}
            </button>
            <button
              className="btn"
              onClick={handleReset}
              style={{ padding: '.5rem 1.5rem' }}
            >
              ↺ Reset
            </button>
          </div>

          <div style={{ marginTop: '.75rem' }}>
            <div className="slide-slider">
              <span className="slide-slider__label">
                Velocity: <span className="slide-slider__value">{velocity.toFixed(1)} m/s</span>
              </span>
              <input
                type="range"
                min="5"
                max="30"
                step="1"
                value={velocity}
                onChange={(e) => setVelocity(Number(e.target.value))}
                className="slide-slider__input"
              />
            </div>

            <div className="slide-slider">
              <span className="slide-slider__label">
                Steering Angle: <span className="slide-slider__value">{(steeringAngle * 180 / Math.PI).toFixed(1)}°</span>
              </span>
              <input
                type="range"
                min="-0.5"
                max="0.5"
                step="0.01"
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
            <div className="slide-card__title">Bicycle Model Equations</div>
            <div className="slide-code" style={{ fontSize: '.85rem' }}>
              {`State: [x, y, θ]
Inputs: v (velocity), δ (steering)

Motion Equations:
ẋ = v · cos(θ)
ẏ = v · sin(θ)
θ̇ = (v / L) · tan(δ)

Where:
• x, y = position
• θ = heading angle (yaw)
• v = forward velocity
• δ = steering angle
• L = wheelbase

Turning radius:
R = L / tan(δ)`}
            </div>
          </div>

          <div className="slide-card" style={{ marginTop: '.75rem' }}>
            <div className="slide-card__title">Model Properties</div>
            <ul style={{ fontSize: '.9rem' }}>
              <li>Rear wheel follows front wheel path</li>
              <li>No lateral slip assumed</li>
              <li>Valid for low speeds (&lt; 5 m/s typically)</li>
              <li>Widely used in path planning</li>
              <li>Basis for Pure Pursuit, Stanley controllers</li>
              <li>Simple to implement and understand</li>
            </ul>
          </div>

          <div className="slide-callout slide-callout--warn" style={{ marginTop: '.75rem', fontSize: '.85rem' }}>
            <b>Limitations:</b> Doesn't model tire slip, lateral forces, or high-speed dynamics.
            For those, use the dynamic bicycle model with slip angles.
          </div>
        </div>
      </div>

      <div className="slide-callout slide-callout--success slide-mb-md">
        <b>Try It:</b> Press Play and adjust the steering angle to see the vehicle follow curved paths.
        Notice how increasing velocity or wheelbase affects the turn radius. The cyan trail shows the
        vehicle's path over time.
      </div>

      <DragDropQuiz
        title="Knowledge Check: Variables"
        description="Match the physical variable to its mathematical symbol."
        items={[
          { id: "v1", content: "Velocity" },
          { id: "v2", content: "Steering Angle" },
          { id: "v3", content: "Heading Angle (Yaw)" },
          { id: "v4", content: "Wheelbase" }
        ]}
        targets={[
          { id: "s1", label: "δ", expectedItemId: "v2" },
          { id: "s2", label: "L", expectedItemId: "v4" },
          { id: "s3", label: "v", expectedItemId: "v1" },
          { id: "s4", label: "θ", expectedItemId: "v3" },
        ]}
        onComplete={() => onObjectiveHit?.("VD_BICYCLE_QUIZ")}
      />

      <div className="slide-actions slide-mt-md">
        <button className="btn btn--primary" onClick={handleComplete}>
          Complete Level ✓
        </button>
      </div>
    </div>
  );
}
