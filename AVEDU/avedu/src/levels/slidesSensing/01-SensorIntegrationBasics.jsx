// src/levels/slidesSensing/01-SensorIntegrationBasics.jsx
import React from "react";

export const meta = {
  id: "sensor-integration-basics",
  title: "Sensor Integration Basics",
  order: 1,
  objectiveCode: "SENSE_INTEGRATE",
};

export default function SensorIntegrationBasics() {
  return (
    <div className="slide">
      <h2>Sensor Integration Basics</h2>

      <div className="slide-card">
        <div className="slide-card__title">What is Sensor Integration?</div>
        <p>
          <b>Sensor integration</b> is the process of connecting physical sensors to your robot's
          software system, enabling your robot to perceive and understand its environment.
        </p>
        <p>
          In ROS 2, sensors publish data to topics that other nodes can subscribe to,
          creating a flexible and modular sensing system.
        </p>
      </div>

      <div className="slide-card">
        <div className="slide-card__title">QCar Sensor Suite</div>
        <p>The QCar platform is equipped with multiple sensors for comprehensive environmental awareness:</p>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginTop: "1rem" }}>
          <div style={{
            padding: "1rem",
            background: "rgba(125, 249, 255, 0.1)",
            borderRadius: "8px",
            border: "2px solid rgba(125, 249, 255, 0.3)"
          }}>
            <b>LIDAR Sensor</b>
            <p style={{ fontSize: "0.9em", marginTop: "0.5rem" }}>
              360° laser scanner for distance measurements and obstacle detection
            </p>
            <code style={{ fontSize: "0.85em" }}>/scan</code>
          </div>

          <div style={{
            padding: "1rem",
            background: "rgba(255, 95, 244, 0.1)",
            borderRadius: "8px",
            border: "2px solid rgba(255, 95, 244, 0.3)"
          }}>
            <b>RGB Camera</b>
            <p style={{ fontSize: "0.9em", marginTop: "0.5rem" }}>
              Color camera for visual perception and object recognition
            </p>
            <code style={{ fontSize: "0.85em" }}>/camera/image_raw</code>
          </div>

          <div style={{
            padding: "1rem",
            background: "rgba(255, 200, 87, 0.1)",
            borderRadius: "8px",
            border: "2px solid rgba(255, 200, 87, 0.3)",
            gridColumn: "1 / -1"
          }}>
            <b>CSI Cameras (4x)</b>
            <p style={{ fontSize: "0.9em", marginTop: "0.5rem" }}>
              Four directional cameras providing 360° visual coverage:
            </p>
            <div style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr 1fr 1fr",
              gap: "0.5rem",
              marginTop: "0.5rem"
            }}>
              <code style={{ fontSize: "0.75em" }}>/camera/csi_front</code>
              <code style={{ fontSize: "0.75em" }}>/camera/csi_right</code>
              <code style={{ fontSize: "0.75em" }}>/camera/csi_back</code>
              <code style={{ fontSize: "0.75em" }}>/camera/csi_left</code>
            </div>
          </div>
        </div>
      </div>

      <div className="slide-card slide-card--aside">
        <div>
          <div className="slide-card__title">Why Integrate Sensors?</div>
          <ul>
            <li><b>Environment Perception:</b> Understand the robot's surroundings</li>
            <li><b>Obstacle Detection:</b> Identify and avoid obstacles in real-time</li>
            <li><b>Navigation:</b> Enable autonomous path planning and following</li>
            <li><b>Decision Making:</b> Provide data for intelligent behavior</li>
          </ul>
        </div>
        <div className="slide-callout slide-callout--info">
          <b>Key Concept:</b> Each sensor provides different types of information.
          Combining multiple sensors (sensor fusion) creates a more complete and
          robust understanding of the environment.
        </div>
      </div>

      <div className="slide-card">
        <div className="slide-card__title">Sensor Data Flow in ROS 2</div>
        <div style={{
          display: "grid",
          gridTemplateColumns: "1fr auto 1fr auto 1fr",
          alignItems: "center",
          gap: "1rem",
          padding: "1.5rem",
          background: "rgba(0,0,0,0.2)",
          borderRadius: "8px"
        }}>
          <div style={{ textAlign: "center" }}>
            <div style={{
              padding: "1rem",
              background: "rgba(125, 249, 255, 0.2)",
              borderRadius: "8px",
              border: "2px solid rgba(125, 249, 255, 0.5)"
            }}>
              <b>Physical Sensor</b>
              <p style={{ fontSize: "0.85em", marginTop: "0.5rem" }}>
                LIDAR, Camera, etc.
              </p>
            </div>
          </div>

          <div style={{ fontSize: "2em", color: "var(--neon, #7df9ff)" }}>→</div>

          <div style={{ textAlign: "center" }}>
            <div style={{
              padding: "1rem",
              background: "rgba(255, 95, 244, 0.2)",
              borderRadius: "8px",
              border: "2px solid rgba(255, 95, 244, 0.5)"
            }}>
              <b>Driver Node</b>
              <p style={{ fontSize: "0.85em", marginTop: "0.5rem" }}>
                Publishes to topic
              </p>
            </div>
          </div>

          <div style={{ fontSize: "2em", color: "var(--neon, #7df9ff)" }}>→</div>

          <div style={{ textAlign: "center" }}>
            <div style={{
              padding: "1rem",
              background: "rgba(125, 249, 255, 0.2)",
              borderRadius: "8px",
              border: "2px solid rgba(125, 249, 255, 0.5)"
            }}>
              <b>Processing Node(s)</b>
              <p style={{ fontSize: "0.85em", marginTop: "0.5rem" }}>
                Subscribe & process data
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
