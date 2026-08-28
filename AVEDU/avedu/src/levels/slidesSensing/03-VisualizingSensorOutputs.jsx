// src/levels/slidesSensing/03-VisualizingSensorOutputs.jsx
import React from "react";

export const meta = {
  id: "visualizing-sensor-outputs",
  title: "Visualizing Sensor Outputs",
  order: 3,
  objectiveCode: "SENSE_VISUALIZE",
};

export default function VisualizingSensorOutputs() {
  return (
    <div className="slide">
      <h2>Visualizing Sensor Outputs</h2>

      <div className="slide-card">
        <div className="slide-card__title">Why Visualize Sensor Data?</div>
        <p>
          Visualization is crucial for understanding what your robot sees and how it
          interprets its environment. It helps with debugging, tuning algorithms,
          and verifying sensor functionality.
        </p>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginTop: "1rem" }}>
          <div>
            <b>Debug Issues</b>
            <p style={{ fontSize: "0.9em" }}>Identify sensor failures or misalignments</p>
          </div>
          <div>
            <b>Validate Data</b>
            <p style={{ fontSize: "0.9em" }}>Ensure sensors provide expected information</p>
          </div>
          <div>
            <b>Understand Behavior</b>
            <p style={{ fontSize: "0.9em" }}>See what the robot perceives in real-time</p>
          </div>
          <div>
            <b>Tune Algorithms</b>
            <p style={{ fontSize: "0.9em" }}>Optimize perception and control parameters</p>
          </div>
        </div>
      </div>

      <div className="slide-card">
        <div className="slide-card__title">RViz2: The ROS 2 Visualization Tool</div>
        <p>
          <b>RViz2</b> is the primary 3D visualization tool for ROS 2. It can display
          sensor data, robot models, transforms, and more in a unified interface.
        </p>

        <div style={{
          background: "rgba(0,0,0,0.3)",
          padding: "1rem",
          borderRadius: "8px",
          marginTop: "1rem"
        }}>
          <b>Launching RViz2:</b>
          <pre style={{
            background: "rgba(0,0,0,0.3)",
            padding: "0.75rem",
            borderRadius: "4px",
            marginTop: "0.5rem",
            fontSize: "0.9em"
          }}>
{`# Launch RViz2
rviz2

# Launch with a specific config file
rviz2 -d /path/to/config.rviz`}
          </pre>
        </div>
      </div>

      <div className="slide-card">
        <div className="slide-card__title">Visualizing QCar Sensors in RViz2</div>

        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          <div style={{
            padding: "1rem",
            background: "rgba(125, 249, 255, 0.1)",
            borderRadius: "8px",
            border: "2px solid rgba(125, 249, 255, 0.3)"
          }}>
            <b>LIDAR Visualization (LaserScan)</b>
            <ul style={{ marginTop: "0.5rem", fontSize: "0.9em" }}>
              <li>Add display type: <code>LaserScan</code></li>
              <li>Topic: <code>/scan</code></li>
              <li>Visualizes: Point cloud of range measurements</li>
              <li>Useful for: Obstacle detection, mapping, localization</li>
            </ul>
          </div>

          <div style={{
            padding: "1rem",
            background: "rgba(255, 95, 244, 0.1)",
            borderRadius: "8px",
            border: "2px solid rgba(255, 95, 244, 0.3)"
          }}>
            <b>Camera Visualization (Image/Camera)</b>
            <ul style={{ marginTop: "0.5rem", fontSize: "0.9em" }}>
              <li>Add display type: <code>Camera</code></li>
              <li>Topics: <code>/camera/image_raw</code>, <code>/camera/csi_front/image_raw</code>, etc.</li>
              <li>Visualizes: Live camera feed in RViz panel</li>
              <li>Useful for: Visual inspection, object detection, lane following</li>
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
              <li>Add display type: <code>RobotModel</code></li>
              <li>Shows: QCar 3D model with sensor positions</li>
              <li>Useful for: Understanding sensor placement and orientation</li>
            </ul>
          </div>
        </div>
      </div>

      <div className="slide-card slide-card--aside">
        <div>
          <div className="slide-card__title">Other Visualization Tools</div>
          <ul>
            <li>
              <b>rqt_image_view:</b> Lightweight camera image viewer
              <pre style={{
                background: "rgba(0,0,0,0.3)",
                padding: "0.5rem",
                borderRadius: "4px",
                marginTop: "0.3rem",
                fontSize: "0.85em"
              }}>ros2 run rqt_image_view rqt_image_view</pre>
            </li>
            <li>
              <b>Foxglove Studio:</b> Modern web-based visualization platform
            </li>
            <li>
              <b>PlotJuggler:</b> Time-series data plotting and analysis
            </li>
          </ul>
        </div>
        <div className="slide-callout slide-callout--info">
          <b>Pro Tip:</b> Save your RViz2 configuration to a .rviz file so you can
          quickly reload your preferred visualization setup for the QCar sensors.
        </div>
      </div>

      <div className="slide-card">
        <div className="slide-card__title">Visualizing Multiple Camera Feeds</div>
        <p>
          The QCar has 5 cameras total. You can view them simultaneously using different approaches:
        </p>
        <div style={{ marginTop: "1rem" }}>
          <b>Method 1: Multiple RViz2 Camera displays</b>
          <p style={{ fontSize: "0.9em", marginTop: "0.3rem" }}>
            Add separate Camera displays for each feed in a single RViz2 instance
          </p>
        </div>
        <div style={{ marginTop: "1rem" }}>
          <b>Method 2: Multiple rqt_image_view windows</b>
          <pre style={{
            background: "rgba(0,0,0,0.3)",
            padding: "0.75rem",
            borderRadius: "4px",
            marginTop: "0.5rem",
            fontSize: "0.85em"
          }}>
{`ros2 run rqt_image_view rqt_image_view /camera/csi_front/image_raw &
ros2 run rqt_image_view rqt_image_view /camera/csi_right/image_raw &
ros2 run rqt_image_view rqt_image_view /camera/csi_back/image_raw &
ros2 run rqt_image_view rqt_image_view /camera/csi_left/image_raw &`}
          </pre>
        </div>
      </div>

      <div className="slide-card">
        <div className="slide-card__title">Common Visualization Issues</div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
          <div>
            <b>Issue: No data visible</b>
            <p style={{ fontSize: "0.85em" }}>
              ✓ Check if sensor node is running<br/>
              ✓ Verify topic name is correct<br/>
              ✓ Check Fixed Frame in RViz2
            </p>
          </div>
          <div>
            <b>Issue: Distorted visualization</b>
            <p style={{ fontSize: "0.85em" }}>
              ✓ Verify transform tree is complete<br/>
              ✓ Check sensor calibration<br/>
              ✓ Ensure correct message type
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
