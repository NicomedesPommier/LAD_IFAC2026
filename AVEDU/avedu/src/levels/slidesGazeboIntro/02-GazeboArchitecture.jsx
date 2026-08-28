// src/levels/slidesGazeboIntro/02-GazeboArchitecture.jsx
import React from "react";

export const meta = {
  id: "gazebo-arch",
  title: "Gazebo Architecture & Components",
  order: 2,
  objectiveCode: "gazebo-slide-arch",
};

export default function GazeboArchitecture() {
  return (
    <div className="slide">
      <h2>Gazebo Architecture & Components</h2>

      <div className="slide-card">
        <div className="slide-card__title">System Architecture</div>
        <div className="slide-code">
{`┌─────────────────────────────────────────┐
│         Web Browser (React)             │
│  ┌─────────────┐    ┌────────────────┐  │
│  │  Camera     │    │   Keyboard     │  │
│  │  Display    │    │   Controls     │  │
│  └──────┬──────┘    └────────┬───────┘  │
└─────────┼────────────────────┼──────────┘
          │                    │
          │  WebSocket (rosbridge)
          │                    │
┌─────────┴────────────────────┴──────────┐
│        Docker Container (ROS 2)         │
│  ┌──────────────────────────────────┐   │
│  │     Gazebo Simulation            │   │
│  │  ┌────────┐      ┌────────────┐  │   │
│  │  │ Physics│      │  Sensors   │  │   │
│  │  │ Engine │      │ (Camera,   │  │   │
│  │  └────────┘      │  LiDAR)    │  │   │
│  │                  └────────────┘  │   │
│  │  ┌─────────────────────────────┐ │   │
│  │  │  Vehicle Model & Plugins    │ │   │
│  │  └─────────────────────────────┘ │   │
│  └──────────────────────────────────┘   │
│                                          │
│  ┌──────────────────────────────────┐   │
│  │        ROS 2 Topics              │   │
│  │  • /cmd_vel (control)            │   │
│  │  • /camera/image (video)         │   │
│  │  • /odom (odometry)              │   │
│  │  • /scan (LiDAR)                 │   │
│  └──────────────────────────────────┘   │
└──────────────────────────────────────────┘`}
        </div>
      </div>

      <div className="slide-columns">
        <div>
          <div className="slide-card">
            <div className="slide-card__title">Gazebo Components</div>
            <ul style={{ fontSize: "0.9rem" }}>
              <li><b>World:</b> The environment (roads, buildings, obstacles)</li>
              <li><b>Models:</b> Vehicles, robots, and objects with physics properties</li>
              <li><b>Sensors:</b> Simulate real-world sensing (cameras, LiDAR, IMU)</li>
              <li><b>Physics Engine:</b> Handles dynamics, collisions, gravity</li>
              <li><b>Plugins:</b> Extend functionality (control, custom sensors)</li>
            </ul>
          </div>

          <div className="slide-card" style={{ marginTop: ".75rem" }}>
            <div className="slide-card__title">ROS 2 Integration</div>
            <ul style={{ fontSize: "0.9rem" }}>
              <li><b>Topics:</b> Publish sensor data, subscribe to commands</li>
              <li><b>Messages:</b> Standardized data structures</li>
              <li><b>rosbridge:</b> WebSocket bridge for web apps</li>
              <li><b>TF Tree:</b> Coordinate frame transformations</li>
            </ul>
          </div>
        </div>

        <div>
          <div className="slide-card">
            <div className="slide-card__title">Common ROS Topics</div>
            <div className="slide-code" style={{ fontSize: "0.85rem" }}>
{`# Control
/cmd_vel (geometry_msgs/Twist)
  • linear.x: forward velocity
  • angular.z: yaw rate (turning)

# Sensors
/camera/image_raw (sensor_msgs/Image)
  • Front camera feed

/scan (sensor_msgs/LaserScan)
  • LiDAR distance measurements

/odom (nav_msgs/Odometry)
  • Position and velocity

/imu (sensor_msgs/Imu)
  • Acceleration and orientation`}
            </div>
          </div>
        </div>
      </div>

      <div className="slide-callout slide-callout--info">
        <b>Data Flow:</b> When you press a key in the web interface, a <code>/cmd_vel</code> message
        is published via rosbridge → ROS 2 → Gazebo plugin → Vehicle moves → Sensors update →
        Data published back → Displayed in browser.
      </div>
    </div>
  );
}
