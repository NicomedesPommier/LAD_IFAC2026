// src/levels/slidesTransformations/01-WhatAreTF.jsx
import React from "react";

export const meta = {
  id: "what-are-tf",
  title: "What are Transformations?",
  order: 1,
  objectiveCode: "tf-importance-1",
};

export default function WhatAreTF() {
  return (
    <div className="slide">
      <h2>What are Transformations?</h2>

      <div className="slide-card">
        <div className="slide-card__title">The Coordinate Frame Problem</div>
        <p>
          Robots have many sensors and components, each with their own perspective.
          A camera sees in image coordinates, LiDAR in laser coordinates, motors in wheel coordinates.
          <b> How do we relate all these different viewpoints?</b>
        </p>
      </div>

      <div className="slide-card slide-card--aside">
        <div>
          <div className="slide-card__title">Definition</div>
          <p>
            A <b>transformation (TF)</b> describes the position and orientation of one coordinate frame
            relative to another. It allows you to convert data between different reference frames.
          </p>
        </div>
        <div className="slide-callout slide-callout--info">
          <b>Example:</b> "The camera is 0.3 meters forward and 0.1 meters up from the robot's center,
          rotated 15 degrees downward." This relationship is a transformation.
        </div>
      </div>

      <div className="slide-card">
        <div className="slide-card__title">Why Transformations Matter</div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
          <div>
            <b>Sensor Fusion</b>
            <p style={{ fontSize: "0.9em", opacity: 0.9 }}>
              Combine data from camera, LiDAR, IMU, GPS by transforming to a common frame
            </p>
          </div>
          <div>
            <b>Motion Planning</b>
            <p style={{ fontSize: "0.9em", opacity: 0.9 }}>
              Plan paths in world coordinates, then transform to wheel/motor commands
            </p>
          </div>
          <div>
            <b>Perception</b>
            <p style={{ fontSize: "0.9em", opacity: 0.9 }}>
              Detect obstacles in camera frame, transform to robot frame for navigation
            </p>
          </div>
          <div>
            <b>Localization</b>
            <p style={{ fontSize: "0.9em", opacity: 0.9 }}>
              Track robot position relative to map frame over time
            </p>
          </div>
        </div>
      </div>

      <div className="slide-card">
        <div className="slide-card__title">6 Degrees of Freedom (6-DOF)</div>
        <p style={{ marginBottom: "0.75rem" }}>
          A full 3D transformation has 6 degrees of freedom:
        </p>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
          <div style={{ background: "rgba(125, 249, 255, 0.05)", padding: "0.75rem", borderRadius: "6px" }}>
            <b style={{ color: "#7df9ff" }}>Translation (3 DOF)</b>
            <ul style={{ fontSize: "0.9em", marginTop: "0.5rem" }}>
              <li><b>X:</b> Forward/backward</li>
              <li><b>Y:</b> Left/right</li>
              <li><b>Z:</b> Up/down</li>
            </ul>
          </div>
          <div style={{ background: "rgba(125, 249, 255, 0.05)", padding: "0.75rem", borderRadius: "6px" }}>
            <b style={{ color: "#7df9ff" }}>Rotation (3 DOF)</b>
            <ul style={{ fontSize: "0.9em", marginTop: "0.5rem" }}>
              <li><b>Roll:</b> Rotation around X</li>
              <li><b>Pitch:</b> Rotation around Y</li>
              <li><b>Yaw:</b> Rotation around Z</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
