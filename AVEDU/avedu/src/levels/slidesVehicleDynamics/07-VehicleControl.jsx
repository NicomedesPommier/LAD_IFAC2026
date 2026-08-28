// src/levels/slidesVehicleDynamics/07-VehicleControl.jsx
import React, { useState, useRef, useEffect } from "react";

export const meta = {
  id: "vd-control",
  title: "Vehicle Control Systems",
  order: 7,
  objectiveCode: "vd-slide-control",
};

function SteeringControlVisualization({ kp, ki, kd, targetYawRate }) {
  const canvasRef = useRef(null);
  const animationRef = useRef(null);
  const stateRef = useRef({
    time: 0,
    yawRate: 0,
    integral: 0,
    prevError: 0,
    steering: 0,
    history: []
  });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");

    const animate = () => {
      const state = stateRef.current;
      const dt = 0.05;

      // PID control
      const error = targetYawRate - state.yawRate;
      state.integral += error * dt;
      const derivative = (error - state.prevError) / dt;
      state.steering = kp * error + ki * state.integral + kd * derivative;
      state.steering = Math.max(-30, Math.min(30, state.steering)); // Limit steering

      // Simple vehicle response (first-order approximation)
      const tau = 0.3; // Time constant
      state.yawRate += (state.steering * 0.5 - state.yawRate) * dt / tau;

      state.prevError = error;
      state.time += dt;

      // Store history
      state.history.push({
        time: state.time,
        yawRate: state.yawRate,
        target: targetYawRate,
        steering: state.steering
      });
      if (state.history.length > 200) state.history.shift();

      // Clear canvas
      ctx.fillStyle = "#0a0e1a";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Draw grid
      ctx.strokeStyle = "rgba(125, 249, 255, 0.1)";
      ctx.lineWidth = 1;
      for (let i = 0; i <= 10; i++) {
        const y = (canvas.height / 10) * i;
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(canvas.width, y);
        ctx.stroke();
      }

      // Draw center line
      ctx.strokeStyle = "rgba(125, 249, 255, 0.3)";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(0, canvas.height / 2);
      ctx.lineTo(canvas.width, canvas.height / 2);
      ctx.stroke();

      // Draw target yaw rate line
      const targetY = canvas.height / 2 - targetYawRate * 10;
      ctx.strokeStyle = "#ff5cf4";
      ctx.setLineDash([5, 5]);
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(0, targetY);
      ctx.lineTo(canvas.width, targetY);
      ctx.stroke();
      ctx.setLineDash([]);

      // Draw yaw rate history
      if (state.history.length > 1) {
        ctx.strokeStyle = "#7df9ff";
        ctx.lineWidth = 3;
        ctx.beginPath();
        state.history.forEach((point, i) => {
          const x = (i / 200) * canvas.width;
          const y = canvas.height / 2 - point.yawRate * 10;
          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        });
        ctx.stroke();
      }

      // Draw labels
      ctx.fillStyle = "#7df9ff";
      ctx.font = "14px monospace";
      ctx.fillText(`Yaw Rate: ${state.yawRate.toFixed(2)} rad/s`, 10, 20);
      ctx.fillStyle = "#ff5cf4";
      ctx.fillText(`Target: ${targetYawRate.toFixed(2)} rad/s`, 10, 40);
      ctx.fillStyle = "#4ade80";
      ctx.fillText(`Steering: ${state.steering.toFixed(2)}°`, 10, 60);
      ctx.fillStyle = "rgba(255,255,255,0.6)";
      ctx.fillText(`Error: ${error.toFixed(3)}`, 10, 80);

      animationRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [kp, ki, kd, targetYawRate]);

  const handleReset = () => {
    stateRef.current = {
      time: 0,
      yawRate: 0,
      integral: 0,
      prevError: 0,
      steering: 0,
      history: []
    };
  };

  return (
    <div>
      <canvas
        ref={canvasRef}
        width={700}
        height={300}
        style={{
          width: "100%",
          height: "auto",
          border: "1px solid rgba(255,255,255,0.2)",
          borderRadius: "10px",
          background: "#0a0e1a"
        }}
      />
      <div style={{ marginTop: ".5rem", textAlign: "center" }}>
        <button
          className="btn btn--sm"
          onClick={handleReset}
          style={{ padding: ".25rem .75rem", fontSize: ".85rem" }}
        >
          Reset Simulation
        </button>
      </div>
    </div>
  );
}

export default function VehicleControl({ meta, goNext, goPrev, isFirst }) {
  const [kp, setKp] = useState(1.0);
  const [ki, setKi] = useState(0.1);
  const [kd, setKd] = useState(0.5);
  const [targetYawRate, setTargetYawRate] = useState(5);

  return (
    <div className="slide-wrap">
      <h2>{meta.title}</h2>

      <div className="slide-card">
        <div className="slide-card__title">Control Systems Overview</div>
        <p>
          Vehicle control systems use feedback loops to achieve desired behavior. The most common
          approach is PID (Proportional-Integral-Derivative) control, which adjusts steering or throttle
          based on the error between desired and actual states.
        </p>
      </div>

      <div className="slide-columns">
        <div className="slide-card">
          <div className="slide-card__title">PID Control</div>
          <div className="slide-code">
            {`PID Output:
u(t) = Kp·e(t) + Ki·∫e(τ)dτ + Kd·de/dt

Components:
• Kp (Proportional):
  Reacts to current error

• Ki (Integral):
  Eliminates steady-state error

• Kd (Derivative):
  Reduces overshoot, dampens`}
          </div>

          <div style={{ marginTop: ".75rem" }}>
            <div className="slide-slider">
              <span className="slide-slider__label">
                Kp (Proportional): <span className="slide-slider__value">{kp.toFixed(2)}</span>
              </span>
              <input
                type="range"
                min="0"
                max="3"
                step="0.1"
                value={kp}
                onChange={(e) => setKp(Number(e.target.value))}
                className="slide-slider__input"
              />
            </div>

            <div className="slide-slider">
              <span className="slide-slider__label">
                Ki (Integral): <span className="slide-slider__value">{ki.toFixed(2)}</span>
              </span>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={ki}
                onChange={(e) => setKi(Number(e.target.value))}
                className="slide-slider__input"
              />
            </div>

            <div className="slide-slider">
              <span className="slide-slider__label">
                Kd (Derivative): <span className="slide-slider__value">{kd.toFixed(2)}</span>
              </span>
              <input
                type="range"
                min="0"
                max="2"
                step="0.1"
                value={kd}
                onChange={(e) => setKd(Number(e.target.value))}
                className="slide-slider__input"
              />
            </div>

            <div className="slide-slider">
              <span className="slide-slider__label">
                Target Yaw Rate: <span className="slide-slider__value">{targetYawRate.toFixed(1)} rad/s</span>
              </span>
              <input
                type="range"
                min="-10"
                max="10"
                step="0.5"
                value={targetYawRate}
                onChange={(e) => setTargetYawRate(Number(e.target.value))}
                className="slide-slider__input"
              />
            </div>
          </div>
        </div>

        <div className="slide-card">
          <div className="slide-card__title">Yaw Rate Control Simulation</div>
          <SteeringControlVisualization
            kp={kp}
            ki={ki}
            kd={kd}
            targetYawRate={targetYawRate}
          />
          <div style={{ marginTop: ".75rem", fontSize: ".9rem", opacity: 0.8 }}>
            The cyan line shows actual yaw rate, magenta dashed line shows target.
            Adjust PID gains to see how the controller responds.
          </div>
        </div>
      </div>

      <div className="slide-card">
        <div className="slide-card__title">Tuning Guidelines</div>
        <div className="slide-columns">
          <div>
            <b>High Kp:</b> Fast response, but can cause oscillation
            <br /><br />
            <b>High Ki:</b> Eliminates steady-state error, but can cause instability
            <br /><br />
            <b>High Kd:</b> Reduces overshoot, but sensitive to noise
          </div>
          <div>
            <b>Typical Tuning Process:</b>
            <ul style={{ marginTop: 0 }}>
              <li>Start with Kp only, increase until oscillation</li>
              <li>Add Kd to reduce overshoot</li>
              <li>Add Ki to eliminate steady-state error</li>
              <li>Fine-tune all three gains</li>
            </ul>
          </div>
        </div>
      </div>

      <div className="slide-callout slide-callout--info">
        <b>Real-World Applications:</b> PID controllers are used in cruise control, lane keeping assist,
        electronic stability control (ESC), and autonomous driving systems. Modern vehicles often use
        more advanced control methods like Model Predictive Control (MPC) for better performance.
      </div>

      <div className="slide-actions">
        {!isFirst && (
          <button className="btn" onClick={goPrev}>
            ⟨ Previous
          </button>
        )}
        <button className="btn" onClick={goNext}>
          Continue ⟩
        </button>
      </div>
    </div>
  );
}
