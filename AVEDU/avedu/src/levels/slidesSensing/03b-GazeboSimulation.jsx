// src/levels/slidesSensing/03b-GazeboSimulation.jsx
import React, { useState } from "react";

export const meta = {
  id: "gazebo-simulation",
  title: "QCar Gazebo Simulation",
  order: 3.5,
  objectiveCode: "SENSE_GAZEBO",
};

export default function GazeboSimulation() {
  const [simulationRunning, setSimulationRunning] = useState(false);

  return (
    <div className="slide">
      <h2>QCar Gazebo Simulation</h2>

      <div className="slide-card">
        <div className="slide-card__title">Interactive 3D Simulation</div>
        <p>
          <b>Gazebo</b> is a powerful 3D robotics simulator that lets you test and
          visualize the QCar robot in a realistic virtual environment. This simulation
          includes physics, sensor models, and visual rendering.
        </p>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginTop: "1rem" }}>
          <div>
            <b>Test Safely</b>
            <p style={{ fontSize: "0.9em" }}>Experiment without hardware damage risk</p>
          </div>
          <div>
            <b>Visualize Sensors</b>
            <p style={{ fontSize: "0.9em" }}>See LIDAR rays and camera views in 3D</p>
          </div>
          <div>
            <b>Iterate Faster</b>
            <p style={{ fontSize: "0.9em" }}>Quick testing cycles without physical setup</p>
          </div>
          <div>
            <b>Debug Easily</b>
            <p style={{ fontSize: "0.9em" }}>Visualize robot behavior and sensor data</p>
          </div>
        </div>
      </div>

      <div className="slide-card">
        <div className="slide-card__title">Launching the Gazebo Simulation</div>
        <p>
          The QCar Docker container includes a complete Gazebo simulation. Follow these
          steps to launch it with GUI on your Ubuntu computer:
        </p>

        <div style={{
          background: "rgba(0,0,0,0.3)",
          padding: "1rem",
          borderRadius: "8px",
          marginTop: "1rem"
        }}>
          <b>Step 1: Navigate to the simulation directory</b>
          <pre style={{
            background: "rgba(0,0,0,0.3)",
            padding: "0.75rem",
            borderRadius: "4px",
            marginTop: "0.5rem",
            fontSize: "0.9em"
          }}>
{`cd /home/nicomedes/Desktop/L.A.D/qcar_docker`}
          </pre>
        </div>

        <div style={{
          background: "rgba(0,0,0,0.3)",
          padding: "1rem",
          borderRadius: "8px",
          marginTop: "1rem"
        }}>
          <b>Step 2: Run the launch script</b>
          <pre style={{
            background: "rgba(0,0,0,0.3)",
            padding: "0.75rem",
            borderRadius: "4px",
            marginTop: "0.5rem",
            fontSize: "0.9em"
          }}>
{`./start-gazebo-gui.sh`}
          </pre>
          <p style={{ fontSize: "0.85em", marginTop: "0.5rem", opacity: 0.8 }}>
            This script will automatically configure X11, start the Docker container,
            and launch Gazebo with the QCar model and LIDAR simulation.
          </p>
        </div>

        <div style={{
          background: "rgba(125, 249, 255, 0.1)",
          padding: "1rem",
          borderRadius: "8px",
          marginTop: "1rem",
          border: "2px solid rgba(125, 249, 255, 0.3)"
        }}>
          <b>What You'll See:</b>
          <ul style={{ fontSize: "0.9em", marginTop: "0.5rem" }}>
            <li>Gazebo GUI window with 3D visualization</li>
            <li>QCar robot model in the world</li>
            <li>LIDAR sensor visualized as red rays</li>
            <li>Interactive camera views</li>
            <li>Physics simulation in real-time</li>
          </ul>
        </div>
      </div>

      <div className="slide-card">
        <div className="slide-card__title">Simulation Features</div>
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          <div style={{
            padding: "1rem",
            background: "rgba(125, 249, 255, 0.1)",
            borderRadius: "8px",
            border: "2px solid rgba(125, 249, 255, 0.3)"
          }}>
            <b>LIDAR Simulation</b>
            <ul style={{ marginTop: "0.5rem", fontSize: "0.9em" }}>
              <li>Publishes to: <code>/scan</code></li>
              <li>360° laser range finder simulation</li>
              <li>Realistic ray-casting physics</li>
              <li>Configurable range and resolution</li>
            </ul>
          </div>

          <div style={{
            padding: "1rem",
            background: "rgba(255, 95, 244, 0.1)",
            borderRadius: "8px",
            border: "2px solid rgba(255, 95, 244, 0.3)"
          }}>
            <b>Camera Simulation</b>
            <ul style={{ marginTop: "0.5rem", fontSize: "0.9em" }}>
              <li>Multiple camera views available</li>
              <li>Publishes to camera topics</li>
              <li>Realistic image rendering</li>
              <li>View via Web Video Server on port 8080</li>
            </ul>
          </div>

          <div style={{
            padding: "1rem",
            background: "rgba(255, 200, 87, 0.1)",
            borderRadius: "8px",
            border: "2px solid rgba(255, 200, 87, 0.3)"
          }}>
            <b>Robot Model (URDF)</b>
            <ul style={{ marginTop: "0.5rem", fontSize: "0.9em" }}>
              <li>Accurate 3D QCar model</li>
              <li>Proper sensor mounting positions</li>
              <li>Physics properties configured</li>
              <li>Transform tree published to <code>/tf</code></li>
            </ul>
          </div>
        </div>
      </div>

      <div className="slide-card">
        <div className="slide-card__title">Connecting to the Simulation</div>
        <p>
          The simulation exposes several ports for different types of connections:
        </p>
        <div style={{ marginTop: "1rem", fontSize: "0.9em" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ borderBottom: "2px solid rgba(255,255,255,0.2)" }}>
                <th style={{ padding: "0.5rem", textAlign: "left" }}>Port</th>
                <th style={{ padding: "0.5rem", textAlign: "left" }}>Service</th>
                <th style={{ padding: "0.5rem", textAlign: "left" }}>Purpose</th>
              </tr>
            </thead>
            <tbody>
              <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.1)" }}>
                <td style={{ padding: "0.5rem" }}><code>9090</code></td>
                <td style={{ padding: "0.5rem" }}>rosbridge</td>
                <td style={{ padding: "0.5rem" }}>WebSocket connection for web apps</td>
              </tr>
              <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.1)" }}>
                <td style={{ padding: "0.5rem" }}><code>7000</code></td>
                <td style={{ padding: "0.5rem" }}>Static Files</td>
                <td style={{ padding: "0.5rem" }}>URDF and mesh files</td>
              </tr>
              <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.1)" }}>
                <td style={{ padding: "0.5rem" }}><code>8080</code></td>
                <td style={{ padding: "0.5rem" }}>Web Video</td>
                <td style={{ padding: "0.5rem" }}>Camera image streaming</td>
              </tr>
              <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.1)" }}>
                <td style={{ padding: "0.5rem" }}><code>10000</code></td>
                <td style={{ padding: "0.5rem" }}>ROS-TCP</td>
                <td style={{ padding: "0.5rem" }}>Unity connection</td>
              </tr>
              <tr>
                <td style={{ padding: "0.5rem" }}><code>11345</code></td>
                <td style={{ padding: "0.5rem" }}>Gazebo Master</td>
                <td style={{ padding: "0.5rem" }}>Gazebo server connection</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div className="slide-card slide-card--aside">
        <div>
          <div className="slide-card__title">Interacting with Gazebo</div>
          <ul>
            <li><b>Camera Controls:</b> Left-click + drag to orbit, scroll to zoom</li>
            <li><b>Pan View:</b> Shift + left-click + drag</li>
            <li><b>Add Objects:</b> Use the "Insert" tab to add obstacles</li>
            <li><b>Move Robot:</b> Click and drag the QCar in the scene</li>
            <li><b>Play/Pause:</b> Control simulation time at the bottom</li>
          </ul>
        </div>
        <div className="slide-callout slide-callout--info">
          <b>Pro Tip:</b> Keep the Gazebo window open while using RViz2 or other
          visualization tools to see both the simulated world and processed sensor data
          side-by-side.
        </div>
      </div>

      <div className="slide-card">
        <div className="slide-card__title">Verifying the Simulation</div>
        <p>
          Once the simulation is running, verify everything is working correctly:
        </p>
        <div style={{
          background: "rgba(0,0,0,0.3)",
          padding: "1rem",
          borderRadius: "8px",
          marginTop: "1rem"
        }}>
          <b>Check ROS Topics:</b>
          <pre style={{
            background: "rgba(0,0,0,0.3)",
            padding: "0.75rem",
            borderRadius: "4px",
            marginTop: "0.5rem",
            fontSize: "0.85em"
          }}>
{`# In a new terminal, exec into the container
docker exec -it qcar_docker-ros-1 bash

# List all active topics
ros2 topic list

# Echo LIDAR data
ros2 topic echo /scan

# View camera image
ros2 run rqt_image_view rqt_image_view`}
          </pre>
        </div>
      </div>

      <div className="slide-card">
        <div className="slide-card__title">Stopping the Simulation</div>
        <p>
          When you're done with the simulation:
        </p>
        <div style={{
          background: "rgba(0,0,0,0.3)",
          padding: "1rem",
          borderRadius: "8px",
          marginTop: "1rem"
        }}>
          <pre style={{
            background: "rgba(0,0,0,0.3)",
            padding: "0.75rem",
            borderRadius: "4px",
            fontSize: "0.9em"
          }}>
{`# Stop the container
cd /home/nicomedes/Desktop/L.A.D/qcar_docker
docker-compose down`}
          </pre>
        </div>
      </div>

      <div className="slide-card slide-card--aside">
        <div className="slide-callout slide-callout--warning">
          <b>Troubleshooting:</b> If the Gazebo window doesn't appear:
          <ul style={{ fontSize: "0.85em", marginTop: "0.5rem" }}>
            <li>Verify X11 is working: run <code>xhost +local:docker</code></li>
            <li>Check DISPLAY variable: <code>echo $DISPLAY</code></li>
            <li>Ensure Docker has X11 access</li>
            <li>Check container logs: <code>docker-compose logs</code></li>
          </ul>
        </div>
      </div>

      <div className="slide-card" style={{
        background: "linear-gradient(135deg, rgba(125, 249, 255, 0.15), rgba(255, 95, 244, 0.15))",
        border: "2px solid rgba(125, 249, 255, 0.4)"
      }}>
        <div className="slide-card__title">Next Steps</div>
        <p>
          Now that you have the Gazebo simulation running, you can:
        </p>
        <ul style={{ marginTop: "1rem" }}>
          <li>Use RViz2 to visualize sensor data from the simulation</li>
          <li>Write ROS 2 nodes that subscribe to simulated sensor topics</li>
          <li>Test obstacle avoidance algorithms in a safe environment</li>
          <li>Experiment with different world configurations</li>
          <li>Connect this AVEDU platform to visualize data in real-time</li>
        </ul>
      </div>
    </div>
  );
}
