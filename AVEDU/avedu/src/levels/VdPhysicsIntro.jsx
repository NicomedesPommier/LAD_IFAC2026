// src/levels/VdPhysicsIntro.jsx
import React, { useState, useRef, useEffect } from "react";
import DragDropQuiz from "../components/games/DragDropQuiz";

export default function VdPhysicsIntro({ onObjectiveHit, onLevelCompleted }) {
  const [currentSlide, setCurrentSlide] = useState(0);

  const slides = [
    {
      id: "intro",
      title: "Introduction to Vehicle Physics",
      content: () => (
        <>
          <div className="slide-card">
            <div className="slide-card__title">What is Vehicle Physics?</div>
            <p>
              Vehicle physics describes how vehicles move and respond to forces, inputs, and the environment.
              Understanding these principles is essential for autonomous vehicle development, simulation, and control.
            </p>
          </div>

          <div className="slide-columns">
            <div className="slide-card">
              <div className="slide-card__title">Key Concepts</div>
              <ul>
                <li><b>Kinematics:</b> Describing motion without considering forces</li>
                <li><b>Dynamics:</b> How forces affect motion</li>
                <li><b>Steering geometry:</b> How wheels turn and interact</li>
                <li><b>Tire behavior:</b> Forces between tires and road</li>
                <li><b>Vehicle stability:</b> Keeping control during maneuvers</li>
              </ul>
            </div>

            <div className="slide-card">
              <div className="slide-card__title">Why It Matters</div>
              <ul>
                <li>Design safe and stable vehicle control systems</li>
                <li>Predict vehicle behavior in different conditions</li>
                <li>Develop accurate simulations for testing</li>
                <li>Optimize performance and efficiency</li>
                <li>Enable autonomous driving capabilities</li>
              </ul>
            </div>
          </div>

          <div className="slide-callout slide-callout--info">
            <b>Learning Path:</b> This module will guide you through fundamental concepts, starting with
            basic motion principles and building up to advanced control techniques used in modern autonomous vehicles.
          </div>
        </>
      )
    },
    {
      id: "forces",
      title: "Forces Acting on Vehicles",
      content: () => <ForcesSlide />
    },
    {
      id: "coordinate-systems",
      title: "Vehicle Coordinate Systems",
      content: () => <CoordinateSystemsSlide />
    },
    {
      id: "basic-motion",
      title: "Basic Vehicle Motion",
      content: () => <BasicMotionSlide />
    },
    {
      id: "quiz",
      title: "Knowledge Check: Forces",
      content: () => (
        <DragDropQuiz
          title="Match the Forces"
          description="Drag each vehicle force to its correct description to earn Bonus XP."
          items={[
            { id: "f1", content: "Thrust" },
            { id: "f2", content: "Drag" },
            { id: "f3", content: "Lateral Force" },
            { id: "f4", content: "Normal Force" }
          ]}
          targets={[
            { id: "t1", label: "Air resistance opposing motion", expectedItemId: "f2" },
            { id: "t2", label: "Road pushing up on vehicle", expectedItemId: "f4" },
            { id: "t3", label: "Propulsion force from engine/motor", expectedItemId: "f1" },
            { id: "t4", label: "Sideways tire forces during turns", expectedItemId: "f3" },
          ]}
          onComplete={() => onObjectiveHit?.("VD_PHYSICS_QUIZ")}
        />
      )
    }
  ];

  const goNext = () => {
    if (currentSlide < slides.length - 1) {
      setCurrentSlide(currentSlide + 1);
    } else {
      onObjectiveHit?.('VD_PHYSICS_BASICS');
      onLevelCompleted?.();
    }
  };

  const goPrev = () => {
    if (currentSlide > 0) {
      setCurrentSlide(currentSlide - 1);
    }
  };

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'ArrowRight') goNext();
      if (e.key === 'ArrowLeft') goPrev();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentSlide]);

  const CurrentContent = slides[currentSlide].content;

  return (
    <div className="slide-wrap">
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '1rem',
        padding: '1rem',
        background: 'var(--glass)',
        borderRadius: '12px',
        border: '1px solid var(--border)'
      }}>
        <button className="btn" onClick={goPrev} disabled={currentSlide === 0}>
          ⟨ Previous
        </button>
        <div>
          <b>{currentSlide + 1}</b> / {slides.length} — {slides[currentSlide].title}
        </div>
        <button className="btn" onClick={goNext}>
          {currentSlide === slides.length - 1 ? 'Complete ✓' : 'Next ⟩'}
        </button>
      </div>

      <div style={{ display: 'flex', gap: '.35rem', justifyContent: 'center', marginBottom: '1.5rem' }}>
        {slides.map((_, i) => (
          <button
            key={i}
            onClick={() => setCurrentSlide(i)}
            style={{
              width: 10,
              height: 10,
              borderRadius: 999,
              border: '1px solid var(--border)',
              background: i === currentSlide ? 'var(--neon)' : 'var(--glass)',
              boxShadow: i === currentSlide ? '0 0 10px rgba(125,249,255,.4)' : 'none',
              cursor: 'pointer'
            }}
          />
        ))}
      </div>

      <h2>{slides[currentSlide].title}</h2>
      <CurrentContent />

      <div className="slide-actions" style={{ marginTop: '2rem' }}>
        {currentSlide > 0 && (
          <button className="btn" onClick={goPrev}>
            ⟨ Previous
          </button>
        )}
        <button className="btn btn--primary" onClick={goNext}>
          {currentSlide === slides.length - 1 ? 'Complete Level ✓' : 'Continue ⟩'}
        </button>
      </div>
    </div>
  );
}

function ForcesSlide() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    // Clear canvas
    ctx.fillStyle = '#0a0e1a';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw vehicle (top view)
    const vx = 350, vy = 200;
    ctx.fillStyle = '#7df9ff';
    ctx.fillRect(vx - 40, vy - 20, 80, 40);
    ctx.fillStyle = '#ff5cf4';
    ctx.beginPath();
    ctx.moveTo(vx + 40, vy);
    ctx.lineTo(vx + 50, vy - 10);
    ctx.lineTo(vx + 50, vy + 10);
    ctx.closePath();
    ctx.fill();

    // Draw force arrows
    const drawArrow = (x1, y1, x2, y2, color, label) => {
      ctx.strokeStyle = color;
      ctx.fillStyle = color;
      ctx.lineWidth = 3;

      // Line
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.stroke();

      // Arrowhead
      const angle = Math.atan2(y2 - y1, x2 - x1);
      ctx.beginPath();
      ctx.moveTo(x2, y2);
      ctx.lineTo(x2 - 15 * Math.cos(angle - Math.PI / 6), y2 - 15 * Math.sin(angle - Math.PI / 6));
      ctx.lineTo(x2 - 15 * Math.cos(angle + Math.PI / 6), y2 - 15 * Math.sin(angle + Math.PI / 6));
      ctx.closePath();
      ctx.fill();

      // Label
      ctx.font = '14px monospace';
      ctx.fillText(label, x2 + 10, y2 + 5);
    };

    drawArrow(vx, vy, vx + 100, vy, '#4ade80', 'Thrust');
    drawArrow(vx, vy, vx - 80, vy, '#ef4444', 'Drag');
    drawArrow(vx - 20, vy + 20, vx - 20, vy + 80, '#fbbf24', 'Lateral Force');
    drawArrow(vx, vy - 60, vx, vy - 20, '#8b5cf6', 'Normal Force');

  }, []);

  return (
    <>
      <div className="slide-card">
        <div className="slide-card__title">Forces Acting on a Moving Vehicle</div>
        <p>
          Multiple forces act on a vehicle during motion. Understanding these forces is crucial for
          predicting and controlling vehicle behavior.
        </p>
      </div>

      <div className="slide-columns">
        <div>
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
        </div>

        <div className="slide-card">
          <div className="slide-card__title">Force Types</div>
          <ul style={{ fontSize: '.9rem' }}>
            <li><span style={{ color: '#4ade80' }}>●</span> <b>Thrust:</b> Propulsion force from engine/motor</li>
            <li><span style={{ color: '#ef4444' }}>●</span> <b>Drag:</b> Air resistance opposing motion</li>
            <li><span style={{ color: '#fbbf24' }}>●</span> <b>Lateral Force:</b> Sideways tire forces during turns</li>
            <li><span style={{ color: '#8b5cf6' }}>●</span> <b>Normal Force:</b> Road pushing up on vehicle</li>
            <li><b>Gravity:</b> Downward weight force</li>
            <li><b>Rolling Resistance:</b> Tire deformation losses</li>
          </ul>

          <div className="slide-callout slide-callout--info" style={{ marginTop: '1rem', fontSize: '.85rem' }}>
            Net force determines acceleration: F = ma
          </div>
        </div>
      </div>

      <div className="slide-card">
        <div className="slide-card__title">Key Equations</div>
        <div className="slide-code">
          {`Drag Force: Fd = ½ · ρ · Cd · A · v²
Where:
  ρ = air density (kg/m³)
  Cd = drag coefficient
  A = frontal area (m²)
  v = velocity (m/s)

Rolling Resistance: Fr = Cr · N
Where:
  Cr = rolling resistance coefficient
  N = normal force (weight)`}
        </div>
      </div>
    </>
  );
}

function CoordinateSystemsSlide() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    ctx.fillStyle = '#0a0e1a';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw vehicle coordinate system
    const vx = 250, vy = 200;

    // Vehicle body
    ctx.fillStyle = '#7df9ff';
    ctx.fillRect(vx - 40, vy - 20, 80, 40);

    // X axis (forward)
    ctx.strokeStyle = '#ef4444';
    ctx.fillStyle = '#ef4444';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(vx, vy);
    ctx.lineTo(vx + 100, vy);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(vx + 100, vy);
    ctx.lineTo(vx + 85, vy - 10);
    ctx.lineTo(vx + 85, vy + 10);
    ctx.closePath();
    ctx.fill();
    ctx.font = 'bold 16px monospace';
    ctx.fillText('X (forward)', vx + 105, vy + 5);

    // Y axis (left)
    ctx.strokeStyle = '#4ade80';
    ctx.fillStyle = '#4ade80';
    ctx.beginPath();
    ctx.moveTo(vx, vy);
    ctx.lineTo(vx, vy - 100);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(vx, vy - 100);
    ctx.lineTo(vx - 10, vy - 85);
    ctx.lineTo(vx + 10, vy - 85);
    ctx.closePath();
    ctx.fill();
    ctx.fillText('Y (left)', vx + 10, vy - 105);

    // Z axis (up) - represented by circle
    ctx.strokeStyle = '#8b5cf6';
    ctx.fillStyle = '#8b5cf6';
    ctx.beginPath();
    ctx.arc(vx, vy, 10, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillText('Z (up, ⊙)', vx - 50, vy - 20);

    // World coordinate system
    const wx = 500, wy = 350;
    ctx.strokeStyle = 'rgba(255,255,255,0.5)';
    ctx.fillStyle = 'rgba(255,255,255,0.5)';
    ctx.lineWidth = 2;

    // X axis
    ctx.beginPath();
    ctx.moveTo(wx, wy);
    ctx.lineTo(wx + 80, wy);
    ctx.stroke();
    ctx.font = '14px monospace';
    ctx.fillText('X world', wx + 85, wy + 5);

    // Y axis
    ctx.beginPath();
    ctx.moveTo(wx, wy);
    ctx.lineTo(wx, wy - 80);
    ctx.stroke();
    ctx.fillText('Y world', wx + 5, wy - 85);

  }, []);

  return (
    <>
      <div className="slide-card">
        <div className="slide-card__title">Vehicle Coordinate Systems</div>
        <p>
          We use two main coordinate systems: the <b>vehicle frame</b> (body-fixed) and the <b>world frame</b> (fixed to ground).
        </p>
      </div>

      <div className="slide-columns">
        <div>
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
        </div>

        <div className="slide-card">
          <div className="slide-card__title">Coordinate Conventions</div>
          <p><b>Vehicle Frame (body-fixed):</b></p>
          <ul style={{ fontSize: '.9rem' }}>
            <li><span style={{ color: '#ef4444' }}>●</span> <b>X:</b> Forward direction</li>
            <li><span style={{ color: '#4ade80' }}>●</span> <b>Y:</b> Left direction</li>
            <li><span style={{ color: '#8b5cf6' }}>●</span> <b>Z:</b> Upward direction</li>
          </ul>

          <p style={{ marginTop: '1rem' }}><b>Orientation Angles:</b></p>
          <ul style={{ fontSize: '.9rem' }}>
            <li><b>Roll (φ):</b> Rotation about X axis</li>
            <li><b>Pitch (θ):</b> Rotation about Y axis</li>
            <li><b>Yaw (ψ):</b> Rotation about Z axis</li>
          </ul>

          <div className="slide-callout slide-callout--info" style={{ marginTop: '1rem', fontSize: '.85rem' }}>
            Following SAE J670 and ISO 8855 standards
          </div>
        </div>
      </div>
    </>
  );
}

function BasicMotionSlide() {
  return (
    <>
      <div className="slide-card">
        <div className="slide-card__title">Basic Vehicle Motion Equations</div>
        <p>
          At low speeds with small steering angles, we can use simplified kinematic equations
          to describe vehicle motion.
        </p>
      </div>

      <div className="slide-columns">
        <div className="slide-card">
          <div className="slide-card__title">Kinematic Model</div>
          <div className="slide-code">
            {`State Variables:
• x, y: Position in world frame
• θ: Heading angle (yaw)
• v: Velocity
• δ: Steering angle
• L: Wheelbase

Motion Equations:
ẋ = v · cos(θ)
ẏ = v · sin(θ)
θ̇ = (v / L) · tan(δ)

This is the basic "bicycle model"
(treating front/rear axles as
single wheels)`}
          </div>
        </div>

        <div>
          <div className="slide-card">
            <div className="slide-card__title">Turning Radius</div>
            <div className="slide-code">
              {`For a given steering angle δ:

R = L / tan(δ)

Where:
• R = turning radius
• L = wheelbase
• δ = steering angle

Angular velocity:
ω = v / R = (v/L) · tan(δ)`}
            </div>
          </div>

          <div className="slide-callout slide-callout--warn" style={{ marginTop: '.75rem' }}>
            <b>Limitations:</b> This model assumes no tire slip, small steering angles, and low speeds.
            For high-speed maneuvers, we need dynamic models that include tire forces.
          </div>
        </div>
      </div>

      <div className="slide-callout slide-callout--success">
        <b>Next Steps:</b> In the following levels, you'll learn about instantaneous center of rotation,
        Ackermann steering geometry, and the bicycle model in detail.
      </div>
    </>
  );
}
