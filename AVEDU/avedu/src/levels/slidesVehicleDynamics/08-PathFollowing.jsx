// src/levels/slidesVehicleDynamics/08-PathFollowing.jsx
import React, { useState, useRef, useEffect } from "react";

export const meta = {
  id: "vd-path-following",
  title: "Path Following & Trajectory Tracking",
  order: 8,
  objectiveCode: "vd-slide-path-following",
};

function PathFollowingVisualization({ lookahead, speed }) {
  const canvasRef = useRef(null);
  const animationRef = useRef(null);
  const stateRef = useRef({
    x: 100,
    y: 400,
    theta: -Math.PI / 2,
    time: 0
  });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");

    // Define a curved path (sine wave)
    const pathPoints = [];
    for (let i = 0; i < canvas.width; i += 5) {
      const x = i;
      const y = canvas.height / 2 + 100 * Math.sin(i / 80);
      pathPoints.push({ x, y });
    }

    const animate = () => {
      const state = stateRef.current;
      const dt = 0.05;

      // Find closest point on path
      let closestDist = Infinity;
      let closestIdx = 0;
      pathPoints.forEach((p, i) => {
        const dist = Math.sqrt((p.x - state.x) ** 2 + (p.y - state.y) ** 2);
        if (dist < closestDist) {
          closestDist = dist;
          closestIdx = i;
        }
      });

      // Find lookahead point
      let lookaheadDist = 0;
      let lookaheadIdx = closestIdx;
      for (let i = closestIdx; i < pathPoints.length - 1; i++) {
        const p1 = pathPoints[i];
        const p2 = pathPoints[i + 1];
        const segmentDist = Math.sqrt((p2.x - p1.x) ** 2 + (p2.y - p1.y) ** 2);
        lookaheadDist += segmentDist;
        if (lookaheadDist >= lookahead) {
          lookaheadIdx = i;
          break;
        }
      }

      const lookaheadPoint = pathPoints[Math.min(lookaheadIdx, pathPoints.length - 1)];

      // Pure pursuit control
      const dx = lookaheadPoint.x - state.x;
      const dy = lookaheadPoint.y - state.y;
      const targetAngle = Math.atan2(dy, dx);

      // Calculate angular velocity to turn toward target
      let angleDiff = targetAngle - state.theta;
      // Normalize angle difference to [-pi, pi]
      while (angleDiff > Math.PI) angleDiff -= 2 * Math.PI;
      while (angleDiff < -Math.PI) angleDiff += 2 * Math.PI;

      const angularVel = 2.0 * angleDiff;

      // Update vehicle state
      state.theta += angularVel * dt;
      state.x += speed * Math.cos(state.theta) * dt;
      state.y += speed * Math.sin(state.theta) * dt;

      // Wrap around if vehicle goes off screen
      if (state.x > canvas.width + 50) {
        state.x = -50;
      }
      if (state.y > canvas.height + 50) {
        state.y = canvas.height / 2;
        state.theta = -Math.PI / 2;
      }
      if (state.y < -50) {
        state.y = canvas.height / 2;
        state.theta = -Math.PI / 2;
      }

      state.time += dt;

      // Clear canvas
      ctx.fillStyle = "#0a0e1a";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Draw path
      ctx.strokeStyle = "rgba(125, 249, 255, 0.3)";
      ctx.lineWidth = 3;
      ctx.beginPath();
      pathPoints.forEach((p, i) => {
        if (i === 0) ctx.moveTo(p.x, p.y);
        else ctx.lineTo(p.x, p.y);
      });
      ctx.stroke();

      // Draw path points
      ctx.fillStyle = "rgba(125, 249, 255, 0.2)";
      pathPoints.forEach((p, i) => {
        if (i % 4 === 0) {
          ctx.beginPath();
          ctx.arc(p.x, p.y, 3, 0, Math.PI * 2);
          ctx.fill();
        }
      });

      // Draw closest point
      const closestPoint = pathPoints[closestIdx];
      ctx.strokeStyle = "#4ade80";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(closestPoint.x, closestPoint.y, 8, 0, Math.PI * 2);
      ctx.stroke();

      // Draw line to closest point
      ctx.strokeStyle = "rgba(74, 222, 128, 0.4)";
      ctx.lineWidth = 1;
      ctx.setLineDash([5, 5]);
      ctx.beginPath();
      ctx.moveTo(state.x, state.y);
      ctx.lineTo(closestPoint.x, closestPoint.y);
      ctx.stroke();
      ctx.setLineDash([]);

      // Draw lookahead point
      ctx.fillStyle = "#ff5cf4";
      ctx.strokeStyle = "#ff5cf4";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(lookaheadPoint.x, lookaheadPoint.y, 10, 0, Math.PI * 2);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(lookaheadPoint.x, lookaheadPoint.y, 4, 0, Math.PI * 2);
      ctx.fill();

      // Draw line to lookahead point
      ctx.strokeStyle = "rgba(255, 92, 244, 0.6)";
      ctx.lineWidth = 2;
      ctx.setLineDash([5, 5]);
      ctx.beginPath();
      ctx.moveTo(state.x, state.y);
      ctx.lineTo(lookaheadPoint.x, lookaheadPoint.y);
      ctx.stroke();
      ctx.setLineDash([]);

      // Draw lookahead circle
      ctx.strokeStyle = "rgba(255, 92, 244, 0.3)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(state.x, state.y, lookahead, 0, Math.PI * 2);
      ctx.stroke();

      // Draw vehicle
      ctx.save();
      ctx.translate(state.x, state.y);
      ctx.rotate(state.theta);

      // Vehicle body
      ctx.fillStyle = "#7df9ff";
      ctx.fillRect(-15, -10, 30, 20);

      // Vehicle direction indicator
      ctx.fillStyle = "#ff5cf4";
      ctx.beginPath();
      ctx.moveTo(15, 0);
      ctx.lineTo(5, -8);
      ctx.lineTo(5, 8);
      ctx.closePath();
      ctx.fill();

      ctx.restore();

      // Draw labels
      ctx.fillStyle = "#7df9ff";
      ctx.font = "14px monospace";
      ctx.fillText(`Vehicle: (${state.x.toFixed(0)}, ${state.y.toFixed(0)})`, 10, 20);
      ctx.fillStyle = "#ff5cf4";
      ctx.fillText(`Lookahead: ${lookahead.toFixed(0)}px`, 10, 40);
      ctx.fillStyle = "#4ade80";
      ctx.fillText(`Cross-track error: ${closestDist.toFixed(1)}px`, 10, 60);

      animationRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [lookahead, speed]);

  const handleReset = () => {
    stateRef.current = {
      x: 100,
      y: 400,
      theta: -Math.PI / 2,
      time: 0
    };
  };

  return (
    <div>
      <canvas
        ref={canvasRef}
        width={700}
        height={400}
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
          Reset Position
        </button>
      </div>
    </div>
  );
}

export default function PathFollowing({ meta, goNext, goPrev, isFirst }) {
  const [lookahead, setLookahead] = useState(120);
  const [speed, setSpeed] = useState(50);

  return (
    <div className="slide-wrap">
      <h2>{meta.title}</h2>

      <div className="slide-card">
        <div className="slide-card__title">Path Following Algorithms</div>
        <p>
          Path following is a fundamental task in autonomous driving. The goal is to make the vehicle
          follow a predefined path while minimizing cross-track error (lateral deviation from the path).
        </p>
      </div>

      <div className="slide-columns">
        <div className="slide-card">
          <div className="slide-card__title">Pure Pursuit Algorithm</div>
          <div className="slide-code">
            {`Algorithm Steps:
1. Find closest point on path
2. Find lookahead point at
   distance Ld ahead on path
3. Calculate steering angle:
   δ = atan(2·L·sin(α)/Ld)

Where:
• L = wheelbase
• Ld = lookahead distance
• α = angle to lookahead point

Lookahead Selection:
• Small Ld: Tight following,
            oscillation risk
• Large Ld: Smooth, cuts corners,
            larger errors`}
          </div>

          <div style={{ marginTop: ".75rem" }}>
            <div className="slide-slider">
              <span className="slide-slider__label">
                Lookahead Distance: <span className="slide-slider__value">{lookahead.toFixed(0)}px</span>
              </span>
              <input
                type="range"
                min="40"
                max="250"
                step="10"
                value={lookahead}
                onChange={(e) => setLookahead(Number(e.target.value))}
                className="slide-slider__input"
              />
            </div>

            <div className="slide-slider">
              <span className="slide-slider__label">
                Speed: <span className="slide-slider__value">{speed.toFixed(0)}px/s</span>
              </span>
              <input
                type="range"
                min="20"
                max="100"
                step="5"
                value={speed}
                onChange={(e) => setSpeed(Number(e.target.value))}
                className="slide-slider__input"
              />
            </div>
          </div>
        </div>

        <div className="slide-card">
          <div className="slide-card__title">Pure Pursuit Visualization</div>
          <PathFollowingVisualization lookahead={lookahead} speed={speed} />
          <div style={{ marginTop: ".75rem" }}>
            <div style={{ fontSize: ".85rem", opacity: 0.8 }}>
              <span style={{ color: "#7df9ff" }}>█</span> Cyan: Desired path
              <br />
              <span style={{ color: "#4ade80" }}>●</span> Green: Closest point
              <br />
              <span style={{ color: "#ff5cf4" }}>●</span> Magenta: Lookahead point
            </div>
          </div>
        </div>
      </div>

      <div className="slide-card">
        <div className="slide-card__title">Other Path Following Methods</div>
        <div className="slide-columns">
          <div>
            <b>Stanley Controller:</b>
            <ul>
              <li>Used by Stanford's winning DARPA vehicle</li>
              <li>Considers both heading error and cross-track error</li>
              <li>Better performance at low speeds</li>
              <li>More stable than pure pursuit</li>
            </ul>
          </div>
          <div>
            <b>Model Predictive Control (MPC):</b>
            <ul>
              <li>Optimizes future trajectory over prediction horizon</li>
              <li>Handles constraints (steering limits, obstacles)</li>
              <li>Best performance but computationally expensive</li>
              <li>Used in modern autonomous vehicles</li>
            </ul>
          </div>
        </div>
      </div>

      <div className="slide-callout slide-callout--info">
        <b>Adaptive Lookahead:</b> In practice, the lookahead distance is often made proportional to
        vehicle speed: Ld = k·v, where k is a tuning parameter. This ensures smooth tracking at high
        speeds and tight following at low speeds.
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
