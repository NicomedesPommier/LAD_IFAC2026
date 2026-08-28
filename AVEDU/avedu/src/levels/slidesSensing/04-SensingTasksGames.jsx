// src/levels/slidesSensing/04-SensingTasksGames.jsx
import React from "react";

export const meta = {
  id: "sensing-tasks-games",
  title: "Sensing Tasks and Games",
  order: 4,
  objectiveCode: "SENSE_TASKS",
};

export default function SensingTasksGames() {
  return (
    <div className="slide">
      <h2>Sensing Tasks and Games</h2>

      <div className="slide-card">
        <div className="slide-card__title">Put Your Knowledge into Practice</div>
        <p>
          Now that you understand sensor integration, subscribing to data, and visualization,
          it's time to apply these skills through hands-on tasks and interactive challenges.
        </p>
      </div>

      <div className="slide-card">
        <div className="slide-card__title">Task 1: Obstacle Detection Challenge</div>
        <div style={{
          padding: "1rem",
          background: "rgba(125, 249, 255, 0.1)",
          borderRadius: "8px",
          border: "2px solid rgba(125, 249, 255, 0.3)"
        }}>
          <b>Objective:</b> Use the LIDAR sensor to detect obstacles around the QCar
          <ul style={{ marginTop: "0.5rem", fontSize: "0.9em" }}>
            <li>Subscribe to the <code>/scan</code> topic</li>
            <li>Process LaserScan data to find the closest obstacle</li>
            <li>Publish a warning if an obstacle is within 0.5 meters</li>
            <li>Visualize the LIDAR data in RViz2</li>
          </ul>
          <div className="slide-callout slide-callout--info" style={{ marginTop: "0.75rem" }}>
            <b>Challenge:</b> Can you determine in which direction (front, left, right, back)
            the closest obstacle is located?
          </div>
        </div>
      </div>

      <div className="slide-card">
        <div className="slide-card__title">Task 2: Multi-Camera Monitoring</div>
        <div style={{
          padding: "1rem",
          background: "rgba(255, 95, 244, 0.1)",
          borderRadius: "8px",
          border: "2px solid rgba(255, 95, 244, 0.3)"
        }}>
          <b>Objective:</b> Monitor all QCar camera feeds simultaneously
          <ul style={{ marginTop: "0.5rem", fontSize: "0.9em" }}>
            <li>Create subscribers for all 5 camera topics</li>
            <li>Display the image resolution and frame rate for each camera</li>
            <li>Set up visualization for at least 2 camera feeds</li>
            <li>Implement a node that logs when motion is detected in any camera</li>
          </ul>
          <div className="slide-callout slide-callout--info" style={{ marginTop: "0.75rem" }}>
            <b>Bonus:</b> Create a picture-in-picture view showing all cameras at once!
          </div>
        </div>
      </div>

      <div className="slide-card">
        <div className="slide-card__title">Task 3: Sensor Fusion Game</div>
        <div style={{
          padding: "1rem",
          background: "rgba(255, 200, 87, 0.1)",
          borderRadius: "8px",
          border: "2px solid rgba(255, 200, 87, 0.3)"
        }}>
          <b>Objective:</b> Combine LIDAR and camera data for enhanced perception
          <ul style={{ marginTop: "0.5rem", fontSize: "0.9em" }}>
            <li>Subscribe to both <code>/scan</code> and <code>/camera/csi_front/image_raw</code></li>
            <li>When LIDAR detects an obstacle ahead, capture an image from the front camera</li>
            <li>Save the image with metadata (timestamp, distance to obstacle)</li>
            <li>Create a simple obstacle detection report</li>
          </ul>
          <div className="slide-callout slide-callout--warning" style={{ marginTop: "0.75rem" }}>
            <b>Key Concept:</b> Sensor fusion combines different sensor modalities to create
            a more complete understanding than any single sensor can provide.
          </div>
        </div>
      </div>

      <div className="slide-card slide-card--aside">
        <div>
          <div className="slide-card__title">Mini-Game: Sensor Scavenger Hunt</div>
          <p style={{ fontSize: "0.9em" }}>
            Test your knowledge of QCar sensors and ROS 2 topics:
          </p>
          <ol style={{ fontSize: "0.9em", marginTop: "0.5rem" }}>
            <li>List all active sensor topics on the QCar</li>
            <li>Identify the message type for each sensor</li>
            <li>Measure and record the publishing frequency (Hz) of each sensor</li>
            <li>Create a sensor map showing which direction each CSI camera faces</li>
            <li>Find the URDF file and identify the exact positions of all sensors</li>
          </ol>
        </div>
        <div className="slide-callout slide-callout--success">
          <b>Success Criteria:</b> Complete all 5 steps to master QCar sensor awareness!
        </div>
      </div>

      <div className="slide-card">
        <div className="slide-card__title">Advanced Challenge: 360° Awareness System</div>
        <p>
          Build a comprehensive awareness system that uses all QCar sensors:
        </p>
        <div style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: "1rem",
          marginTop: "1rem"
        }}>
          <div style={{
            padding: "0.75rem",
            background: "rgba(0,0,0,0.2)",
            borderRadius: "6px"
          }}>
            <b>Requirements:</b>
            <ul style={{ fontSize: "0.85em", marginTop: "0.3rem" }}>
              <li>Use LIDAR for 360° distance mapping</li>
              <li>Use all 4 CSI cameras for visual coverage</li>
              <li>Publish a unified "awareness" message</li>
              <li>Visualize everything in RViz2</li>
            </ul>
          </div>
          <div style={{
            padding: "0.75rem",
            background: "rgba(0,0,0,0.2)",
            borderRadius: "6px"
          }}>
            <b>Features to Implement:</b>
            <ul style={{ fontSize: "0.85em", marginTop: "0.3rem" }}>
              <li>Obstacle warnings by direction</li>
              <li>Visual change detection</li>
              <li>Dead zone identification</li>
              <li>Sensor health monitoring</li>
            </ul>
          </div>
        </div>
      </div>

      <div className="slide-card">
        <div className="slide-card__title">Real-World Applications</div>
        <p>The skills you've learned apply to many autonomous vehicle scenarios:</p>
        <div style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: "1rem",
          marginTop: "1rem"
        }}>
          <div>
            <b>Parking Assistant</b>
            <p style={{ fontSize: "0.85em" }}>
              Use LIDAR and cameras to detect parking spaces and obstacles
            </p>
          </div>
          <div>
            <b>Lane Keeping</b>
            <p style={{ fontSize: "0.85em" }}>
              Process camera feeds to detect and follow lane markings
            </p>
          </div>
          <div>
            <b>Collision Avoidance</b>
            <p style={{ fontSize: "0.85em" }}>
              Combine multiple sensors to prevent collisions from any direction
            </p>
          </div>
          <div>
            <b>Object Tracking</b>
            <p style={{ fontSize: "0.85em" }}>
              Use sensor fusion to track moving objects around the vehicle
            </p>
          </div>
        </div>
      </div>

      <div className="slide-card">
        <div className="slide-card__title">Next Steps</div>
        <p>
          After mastering sensing, you'll be ready to move on to:
        </p>
        <ul>
          <li><b>Transformations:</b> Learn how to align sensor data in different coordinate frames</li>
          <li><b>Perception:</b> Process sensor data to detect objects, lanes, and obstacles</li>
          <li><b>Planning:</b> Use sensor information to plan safe paths and behaviors</li>
          <li><b>Control:</b> Act on sensor data to control the robot's movement</li>
        </ul>
      </div>
    </div>
  );
}
