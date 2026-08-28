// src/levels/slidesGazeboIntro/04-InteractiveSimulation.jsx
import React from "react";
import { useRoslib } from "../../hooks/useRoslib";
import GazeboSimViewer from "../../components/gazebo/GazeboSimViewer";
import RobotTeleop from "../../components/gazebo/RobotTeleop";

export const meta = {
  id: "gazebo-interactive-sim",
  title: "Interactive Simulation",
  order: 4,
  objectiveCode: "gazebo-slide-interactive",
};

export default function InteractiveSimulation() {
  const { ros, connected } = useRoslib();

  return (
    <div className="slide">
      <h2>Interactive Gazebo Simulation</h2>

      <div className="slide-callout slide-callout--info" style={{ marginBottom: "1rem" }}>
        <b>Live Simulation:</b> The QCar robot is running in Gazebo. Use the controls below to drive
        the robot and observe sensor data in real-time.
      </div>

      {/* Main simulation grid */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "2fr 1fr",
        gap: "1rem",
        marginBottom: "1rem"
      }}>
        {/* Gazebo Viewer */}
        <div style={{
          minHeight: "500px",
          backgroundColor: "#1e1e1e",
          borderRadius: "8px",
          overflow: "hidden"
        }}>
          <GazeboSimViewer ros={ros} connected={connected} />
        </div>

        {/* Teleop Controller */}
        <div>
          <RobotTeleop ros={ros} connected={connected} />
        </div>
      </div>

      {/* Instructions */}
      <div className="slide-card">
        <div className="slide-card__title">How to Use This Simulation</div>

        <div className="slide-columns">
          <div>
            <h4 style={{ color: "#4CAF50", marginTop: 0 }}>Controls</h4>
            <ul style={{ fontSize: "0.9rem", lineHeight: "1.8" }}>
              <li><b>Keyboard:</b> Use W/A/S/D or Arrow keys to move</li>
              <li><b>Mouse:</b> Click and hold direction buttons</li>
              <li><b>Speed:</b> Adjust sliders for linear/angular velocity</li>
              <li><b>Stop:</b> Press Space or click STOP button</li>
            </ul>

            <h4 style={{ color: "#4CAF50", marginTop: "1rem" }}>Camera Views</h4>
            <ul style={{ fontSize: "0.9rem", lineHeight: "1.8" }}>
              <li><b>RGB Camera:</b> Main forward-facing camera</li>
              <li><b>CSI Cameras:</b> Fisheye cameras (Front, Right, Back, Left)</li>
              <li>Use dropdown to switch between camera feeds</li>
            </ul>
          </div>

          <div>
            <h4 style={{ color: "#4CAF50", marginTop: 0 }}>Sensor Displays</h4>
            <ul style={{ fontSize: "0.9rem", lineHeight: "1.8" }}>
              <li><b>LIDAR:</b> Green dots show detected obstacles</li>
              <li><b>Red dot:</b> Robot position in LIDAR view</li>
              <li><b>Odometry:</b> Real-time position and velocity</li>
              <li>Watch values change as you move the robot</li>
            </ul>

            <h4 style={{ color: "#4CAF50", marginTop: "1rem" }}>Tips</h4>
            <ul style={{ fontSize: "0.9rem", lineHeight: "1.8" }}>
              <li>Start with low speeds to get familiar</li>
              <li>LIDAR updates show walls as green lines</li>
              <li>Odometry drift is normal in simulation</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Learning objectives */}
      <div className="slide-card" style={{ marginTop: "1rem" }}>
        <div className="slide-card__title">Learning Objectives</div>
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
          gap: "0.75rem",
          marginTop: "0.75rem"
        }}>
          <div style={{
            padding: "0.75rem",
            backgroundColor: "#2d2d2d",
            borderRadius: "6px",
            borderLeft: "3px solid #4CAF50"
          }}>
            <div style={{ fontSize: "1.5rem", marginBottom: "0.25rem" }}>🎮</div>
            <b>Robot Control</b>
            <p style={{ fontSize: "0.85rem", margin: "0.5rem 0 0 0", color: "#bbb" }}>
              Understand velocity commands and differential drive kinematics
            </p>
          </div>

          <div style={{
            padding: "0.75rem",
            backgroundColor: "#2d2d2d",
            borderRadius: "6px",
            borderLeft: "3px solid #4CAF50"
          }}>
            <div style={{ fontSize: "1.5rem", marginBottom: "0.25rem" }}>📷</div>
            <b>Camera Sensing</b>
            <p style={{ fontSize: "0.85rem", margin: "0.5rem 0 0 0", color: "#bbb" }}>
              Observe how cameras provide different perspectives of the environment
            </p>
          </div>

          <div style={{
            padding: "0.75rem",
            backgroundColor: "#2d2d2d",
            borderRadius: "6px",
            borderLeft: "3px solid #4CAF50"
          }}>
            <div style={{ fontSize: "1.5rem", marginBottom: "0.25rem" }}>📡</div>
            <b>LIDAR Perception</b>
            <p style={{ fontSize: "0.85rem", margin: "0.5rem 0 0 0", color: "#bbb" }}>
              Learn how laser scanners detect obstacles and measure distances
            </p>
          </div>

          <div style={{
            padding: "0.75rem",
            backgroundColor: "#2d2d2d",
            borderRadius: "6px",
            borderLeft: "3px solid #4CAF50"
          }}>
            <div style={{ fontSize: "1.5rem", marginBottom: "0.25rem" }}>📊</div>
            <b>State Estimation</b>
            <p style={{ fontSize: "0.85rem", margin: "0.5rem 0 0 0", color: "#bbb" }}>
              Track robot position and velocity through odometry
            </p>
          </div>
        </div>
      </div>

      {!connected && (
        <div className="slide-callout slide-callout--error" style={{ marginTop: "1rem" }}>
          <b>⚠️ Not Connected:</b> The simulation is not connected to ROS. Please ensure:
          <ul style={{ marginBottom: 0, marginTop: "0.5rem" }}>
            <li>Docker container is running: <code>docker compose up</code></li>
            <li>Gazebo is enabled: <code>ENABLE_GAZEBO=1</code> in docker-compose.yml</li>
            <li>Rosbridge is accessible at <code>ws://localhost:9090</code></li>
          </ul>
        </div>
      )}

      <div className="slide-callout slide-callout--success" style={{ marginTop: "1rem" }}>
        <b>🎯 Challenge:</b> Try driving the robot in a figure-8 pattern while watching the
        odometry and LIDAR data. Notice how the sensor readings change as you navigate!
      </div>
    </div>
  );
}
