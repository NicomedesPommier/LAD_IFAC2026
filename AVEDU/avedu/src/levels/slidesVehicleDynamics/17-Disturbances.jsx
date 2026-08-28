// src/levels/slidesVehicleDynamics/17-Disturbances.jsx
import React, { useState } from "react";

export const meta = {
  id: "disturbances",
  title: "Real-World Disturbances",
  order: 17,
  objectiveCode: "VD_DISTURBANCES",
};

export default function Disturbances() {
  const [selectedDisturbance, setSelectedDisturbance] = useState("friction");

  const disturbances = {
    friction: {
      title: "Road Surface & Friction",
      icon: "🛣️",
      description: "Friction coefficient (μ) varies dramatically with surface conditions.",
      effects: [
        "Reduces maximum tire force: F_max = μ × N",
        "Changes understeer/oversteer balance",
        "Affects braking distance quadratically",
        "Can vary across lane width (split-μ)",
      ],
      values: [
        { surface: "Dry asphalt", mu: "0.8-1.0", color: "#4f4" },
        { surface: "Wet asphalt", mu: "0.5-0.7", color: "#ff0" },
        { surface: "Snow", mu: "0.2-0.4", color: "#8ff" },
        { surface: "Ice", mu: "0.05-0.15", color: "#f88" },
        { surface: "Gravel", mu: "0.4-0.6", color: "#fa5" },
      ],
      avImplication: "Friction estimation is critical for AV safety. Uses wheel slip monitoring, road classification from cameras, and weather data.",
    },
    grade: {
      title: "Road Grade & Banking",
      icon: "⛰️",
      description: "Road slope affects longitudinal and lateral forces significantly.",
      effects: [
        "Uphill: Additional resistance (F = mg·sin(θ))",
        "Downhill: Gravity assists, braking affected",
        "Banking reduces lateral force needed in turns",
        "Cross-slope causes lateral drift tendency",
      ],
      values: [
        { surface: "Highway max grade", mu: "6%", color: "#4f4" },
        { surface: "Steep hill", mu: "10-15%", color: "#ff0" },
        { surface: "Mountain road", mu: "8-12%", color: "#fa5" },
        { surface: "Parking ramp", mu: "15-20%", color: "#f88" },
        { surface: "Superelevation (banking)", mu: "2-8%", color: "#8ff" },
      ],
      avImplication: "Grade information from HD maps is used to anticipate acceleration/braking needs and adjust speed limits for hills.",
    },
    wind: {
      title: "Wind Disturbances",
      icon: "💨",
      description: "Crosswinds and gusts create lateral forces and yaw moments.",
      effects: [
        "Lateral force proportional to wind speed squared",
        "Yaw moment depends on pressure center location",
        "Turbulence from trucks and structures",
        "Gusts at tunnel exits, bridge openings",
      ],
      values: [
        { surface: "Light breeze", mu: "< 20 km/h", color: "#4f4" },
        { surface: "Moderate wind", mu: "20-40 km/h", color: "#ff0" },
        { surface: "Strong wind", mu: "40-60 km/h", color: "#fa5" },
        { surface: "Dangerous gusts", mu: "> 60 km/h", color: "#f88" },
        { surface: "Truck wake", mu: "Variable", color: "#8ff" },
      ],
      avImplication: "Wind compensation uses steering and may reduce speed. Some AVs use wind sensors; others detect disturbance from vehicle response.",
    },
    payload: {
      title: "Payload Variations",
      icon: "📦",
      description: "Passenger and cargo loading changes vehicle dynamics substantially.",
      effects: [
        "Shifts CG position (longitudinal and vertical)",
        "Changes weight distribution front/rear",
        "Affects roll/pitch moments of inertia",
        "Alters tire load and grip capacity",
      ],
      values: [
        { surface: "Driver only", mu: "~75 kg", color: "#4f4" },
        { surface: "Full passengers", mu: "+300 kg", color: "#ff0" },
        { surface: "Luggage loaded", mu: "+100 kg", color: "#fa5" },
        { surface: "Towing trailer", mu: "+500-2000 kg", color: "#f88" },
        { surface: "Pickup bed loaded", mu: "+500 kg", color: "#8ff" },
      ],
      avImplication: "Load estimation from suspension deflection or user input. Adapts control gains and safety margins accordingly.",
    },
  };

  const current = disturbances[selectedDisturbance];

  return (
    <div className="slide">
      <h2>Real-World Disturbances & Effects</h2>

      <div className="slide-card">
        <div className="slide-card__title">Select Disturbance Type</div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "0.5rem" }}>
          {Object.entries(disturbances).map(([key, dist]) => (
            <button
              key={key}
              className="btn"
              onClick={() => setSelectedDisturbance(key)}
              style={{
                padding: "1rem",
                background: selectedDisturbance === key ? "rgba(125, 249, 255, 0.3)" : "rgba(255,255,255,0.1)",
                border: selectedDisturbance === key ? "2px solid #7df9ff" : "2px solid transparent",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: "0.5rem",
              }}
            >
              <span style={{ fontSize: "1.5em" }}>{dist.icon}</span>
              <span style={{ fontSize: "0.8em" }}>{dist.title.split("&")[0].trim()}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="slide-card">
        <div className="slide-card__title">
          <span style={{ marginRight: "0.5rem" }}>{current.icon}</span>
          {current.title}
        </div>
        <p>{current.description}</p>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginTop: "1rem" }}>
          <div>
            <h4 style={{ marginBottom: "0.5rem" }}>Effects on Dynamics</h4>
            <ul style={{ fontSize: "0.9em" }}>
              {current.effects.map((effect, i) => (
                <li key={i}>{effect}</li>
              ))}
            </ul>
          </div>
          <div>
            <h4 style={{ marginBottom: "0.5rem" }}>Typical Values</h4>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
              {current.values.map((val, i) => (
                <div
                  key={i}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    padding: "0.35rem 0.5rem",
                    background: `${val.color}22`,
                    borderLeft: `3px solid ${val.color}`,
                    borderRadius: "0 4px 4px 0",
                    fontSize: "0.85em",
                  }}
                >
                  <span>{val.surface}</span>
                  <span style={{ fontFamily: "monospace" }}>{val.mu}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div style={{
          marginTop: "1rem",
          padding: "1rem",
          background: "rgba(125, 249, 255, 0.1)",
          borderRadius: "8px",
          border: "2px solid rgba(125, 249, 255, 0.3)",
        }}>
          <b>AV Implication:</b> {current.avImplication}
        </div>
      </div>

      <div className="slide-card">
        <div className="slide-card__title">Combined Disturbances</div>
        <p>
          Real-world driving involves multiple simultaneous disturbances. Control systems must
          handle combinations that may compound or cancel each other.
        </p>
        <div style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: "1rem",
          marginTop: "1rem"
        }}>
          <div style={{
            padding: "1rem",
            background: "rgba(255, 100, 100, 0.1)",
            borderRadius: "8px",
            border: "2px solid rgba(255, 100, 100, 0.3)"
          }}>
            <b>Dangerous Combinations</b>
            <ul style={{ fontSize: "0.85em", marginTop: "0.5rem" }}>
              <li>Wet road + crosswind + downhill</li>
              <li>Ice + heavy braking + curve</li>
              <li>Full load + steep grade + rain</li>
              <li>Gusty wind + split-μ surface</li>
            </ul>
          </div>
          <div style={{
            padding: "1rem",
            background: "rgba(100, 255, 100, 0.1)",
            borderRadius: "8px",
            border: "2px solid rgba(100, 255, 100, 0.3)"
          }}>
            <b>Compensating Effects</b>
            <ul style={{ fontSize: "0.85em", marginTop: "0.5rem" }}>
              <li>Banking reduces cornering force needed</li>
              <li>Headwind increases downforce</li>
              <li>Uphill reduces speed, aids braking</li>
              <li>Loaded rear improves RWD traction</li>
            </ul>
          </div>
        </div>
      </div>

      <div className="slide-card slide-card--aside">
        <div>
          <div className="slide-card__title">Disturbance Estimation for AVs</div>
          <ul>
            <li><b>Friction:</b> Wheel slip ratio monitoring, camera road classification</li>
            <li><b>Grade:</b> IMU pitch angle, HD map data, GPS altitude</li>
            <li><b>Wind:</b> Steering torque analysis, dedicated sensors</li>
            <li><b>Load:</b> Suspension position sensors, user input</li>
          </ul>
        </div>
        <div className="slide-callout slide-callout--warning">
          <b>Safety Margins:</b> AVs must maintain safety margins that account for worst-case
          disturbances. This is why AVs drive more conservatively than experienced humans.
        </div>
      </div>
    </div>
  );
}
