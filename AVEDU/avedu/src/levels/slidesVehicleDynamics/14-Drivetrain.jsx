// src/levels/slidesVehicleDynamics/14-Drivetrain.jsx
import React, { useState } from "react";

export const meta = {
  id: "drivetrain",
  title: "Drivetrain Considerations",
  order: 14,
  objectiveCode: "VD_DRIVETRAIN",
};

export default function Drivetrain() {
  const [driveType, setDriveType] = useState("rwd");

  const driveConfigs = {
    fwd: {
      name: "Front-Wheel Drive (FWD)",
      pros: ["Compact packaging", "Good traction in rain/snow", "Lower cost", "Better fuel efficiency"],
      cons: ["Torque steer under hard acceleration", "Understeer tendency", "Limited traction when accelerating uphill"],
      dynamics: "Weight over driven wheels helps traction. Under hard acceleration, weight transfers rearward, reducing front grip. Prone to understeer.",
      typical: "Most economy cars, compact SUVs",
      frontPower: 100,
      rearPower: 0,
    },
    rwd: {
      name: "Rear-Wheel Drive (RWD)",
      pros: ["Better weight distribution", "No torque steer", "Better acceleration traction", "More controllable oversteer"],
      cons: ["Less traction in slippery conditions", "Requires driveshaft tunnel", "Higher cost"],
      dynamics: "Weight transfers to rear during acceleration, increasing traction. Can induce oversteer under power. Preferred for performance driving.",
      typical: "Sports cars, luxury sedans, trucks",
      frontPower: 0,
      rearPower: 100,
    },
    awd: {
      name: "All-Wheel Drive (AWD)",
      pros: ["Maximum traction", "Stable in all conditions", "Can vary torque distribution", "Excellent launch performance"],
      cons: ["Higher weight", "Increased complexity", "Reduced fuel efficiency", "Higher cost"],
      dynamics: "Can optimize traction by distributing torque. Modern systems use torque vectoring for improved handling. Electric vehicles can have independent motor control.",
      typical: "Performance cars, SUVs, electric vehicles",
      frontPower: 50,
      rearPower: 50,
    },
  };

  const config = driveConfigs[driveType];

  return (
    <div className="slide">
      <h2>Drivetrain Considerations</h2>

      <div className="slide-card">
        <div className="slide-card__title">Drive Configuration Comparison</div>
        <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1rem" }}>
          {Object.keys(driveConfigs).map((type) => (
            <button
              key={type}
              className="btn"
              onClick={() => setDriveType(type)}
              style={{
                flex: 1,
                background: driveType === type ? "rgba(125, 249, 255, 0.3)" : "rgba(255,255,255,0.1)",
                border: driveType === type ? "2px solid #7df9ff" : "2px solid transparent",
              }}
            >
              {type.toUpperCase()}
            </button>
          ))}
        </div>

        <h3 style={{ color: "#7df9ff", marginBottom: "1rem" }}>{config.name}</h3>

        {/* Visual representation */}
        <div style={{
          display: "flex",
          justifyContent: "center",
          marginBottom: "1.5rem",
          padding: "1.5rem",
          background: "rgba(0,0,0,0.2)",
          borderRadius: "8px",
        }}>
          <svg viewBox="0 0 200 100" style={{ width: "300px", height: "150px" }}>
            {/* Car body */}
            <rect x="40" y="25" width="120" height="50" rx="10" fill="rgba(125, 249, 255, 0.2)" stroke="#7df9ff" strokeWidth="2" />
            {/* Direction */}
            <polygon points="150,50 165,40 165,60" fill="#7df9ff" />

            {/* Front wheels */}
            <ellipse cx="60" cy="20" rx="15" ry="8"
              fill={config.frontPower > 0 ? "rgba(100, 255, 100, 0.8)" : "rgba(100,100,100,0.5)"}
              stroke="#fff" strokeWidth="1" />
            <ellipse cx="60" cy="80" rx="15" ry="8"
              fill={config.frontPower > 0 ? "rgba(100, 255, 100, 0.8)" : "rgba(100,100,100,0.5)"}
              stroke="#fff" strokeWidth="1" />

            {/* Rear wheels */}
            <ellipse cx="140" cy="20" rx="15" ry="8"
              fill={config.rearPower > 0 ? "rgba(100, 255, 100, 0.8)" : "rgba(100,100,100,0.5)"}
              stroke="#fff" strokeWidth="1" />
            <ellipse cx="140" cy="80" rx="15" ry="8"
              fill={config.rearPower > 0 ? "rgba(100, 255, 100, 0.8)" : "rgba(100,100,100,0.5)"}
              stroke="#fff" strokeWidth="1" />

            {/* Power indicators */}
            {config.frontPower > 0 && (
              <text x="60" y="52" textAnchor="middle" fill="#4f4" fontSize="10" fontWeight="bold">
                {config.frontPower}%
              </text>
            )}
            {config.rearPower > 0 && (
              <text x="140" y="52" textAnchor="middle" fill="#4f4" fontSize="10" fontWeight="bold">
                {config.rearPower}%
              </text>
            )}

            {/* Labels */}
            <text x="60" y="98" textAnchor="middle" fill="#888" fontSize="8">FRONT</text>
            <text x="140" y="98" textAnchor="middle" fill="#888" fontSize="8">REAR</text>
          </svg>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
          <div style={{ padding: "1rem", background: "rgba(100, 255, 100, 0.1)", borderRadius: "8px" }}>
            <b style={{ color: "#4f4" }}>Advantages</b>
            <ul style={{ marginTop: "0.5rem", fontSize: "0.9em" }}>
              {config.pros.map((pro, i) => <li key={i}>{pro}</li>)}
            </ul>
          </div>
          <div style={{ padding: "1rem", background: "rgba(255, 100, 100, 0.1)", borderRadius: "8px" }}>
            <b style={{ color: "#f44" }}>Disadvantages</b>
            <ul style={{ marginTop: "0.5rem", fontSize: "0.9em" }}>
              {config.cons.map((con, i) => <li key={i}>{con}</li>)}
            </ul>
          </div>
        </div>

        <div style={{ marginTop: "1rem", padding: "1rem", background: "rgba(0,0,0,0.2)", borderRadius: "8px" }}>
          <b>Dynamics:</b> {config.dynamics}
        </div>
        <div style={{ marginTop: "0.5rem", fontSize: "0.9em", opacity: 0.8 }}>
          <b>Typical applications:</b> {config.typical}
        </div>
      </div>

      <div className="slide-card">
        <div className="slide-card__title">Electric Vehicle Considerations</div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
          <div style={{
            padding: "1rem",
            background: "rgba(125, 249, 255, 0.1)",
            borderRadius: "8px",
            border: "2px solid rgba(125, 249, 255, 0.3)"
          }}>
            <b>Torque Vectoring</b>
            <p style={{ fontSize: "0.9em", marginTop: "0.5rem" }}>
              EVs with multiple motors can independently control torque to each wheel,
              enabling active yaw control and improved handling without mechanical differentials.
            </p>
          </div>
          <div style={{
            padding: "1rem",
            background: "rgba(255, 95, 244, 0.1)",
            borderRadius: "8px",
            border: "2px solid rgba(255, 95, 244, 0.3)"
          }}>
            <b>Regenerative Braking</b>
            <p style={{ fontSize: "0.9em", marginTop: "0.5rem" }}>
              Regen braking applies only to driven wheels, creating asymmetric braking.
              Strong regen can cause stability issues if not properly managed.
            </p>
          </div>
        </div>
      </div>

      <div className="slide-card slide-card--aside">
        <div>
          <div className="slide-card__title">Torque Distribution in AWD</div>
          <ul>
            <li><b>50/50 Fixed:</b> Simple, symmetric (Subaru Symmetrical AWD)</li>
            <li><b>Front-biased (60/40):</b> FWD platform with rear assist (most CUVs)</li>
            <li><b>Rear-biased (40/60):</b> RWD handling with AWD traction (BMW xDrive)</li>
            <li><b>Variable:</b> 0-100% to either axle on demand (Audi Quattro)</li>
            <li><b>Torque vectoring:</b> Side-to-side distribution (Tesla Dual Motor)</li>
          </ul>
        </div>
        <div className="slide-callout slide-callout--info">
          <b>For Autonomous Vehicles:</b> AWD with torque vectoring provides the most
          control authority for stability systems and enables aggressive recovery maneuvers.
        </div>
      </div>
    </div>
  );
}
