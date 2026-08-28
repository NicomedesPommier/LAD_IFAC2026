// src/levels/slidesGazeboIntro/03-SensorsAndControl.jsx
import React from "react";

export const meta = {
  id: "gazebo-sensors",
  title: "Sensors & Vehicle Control",
  order: 3,
  objectiveCode: "gazebo-slide-sensors",
};

export default function SensorsAndControl() {
  return (
    <div className="slide">
      <h2>Sensors & Vehicle Control</h2>

      <div className="slide-columns">
        <div>
          <div className="slide-card">
            <div className="slide-card__title">Camera Sensor</div>
            <p>
              Provides visual perception of the environment. Essential for object detection,
              lane keeping, and visual SLAM.
            </p>
            <div className="slide-code" style={{ fontSize: "0.85rem" }}>
{`Topic: /camera/image_raw
Type: sensor_msgs/Image

Properties:
• Resolution: 640x480 (or higher)
• FPS: 30 Hz
• Format: RGB8 or BGR8
• FOV: 60-90 degrees`}
            </div>
          </div>

          <div className="slide-card" style={{ marginTop: ".75rem" }}>
            <div className="slide-card__title">LiDAR Sensor</div>
            <p>
              Laser scanner that measures distances to obstacles. Provides 360° awareness
              and precise distance measurements.
            </p>
            <div className="slide-code" style={{ fontSize: "0.85rem" }}>
{`Topic: /scan
Type: sensor_msgs/LaserScan

Properties:
• Range: 0.1 - 30 meters
• Angular Resolution: 1 degree
• Scan Rate: 10 Hz
• 360° coverage`}
            </div>
          </div>

          <div className="slide-card" style={{ marginTop: ".75rem" }}>
            <div className="slide-card__title">IMU Sensor</div>
            <p>
              Inertial Measurement Unit provides acceleration and angular velocity data.
              Critical for state estimation and control.
            </p>
            <div className="slide-code" style={{ fontSize: "0.85rem" }}>
{`Topic: /imu
Type: sensor_msgs/Imu

Data:
• Linear acceleration (x, y, z)
• Angular velocity (roll, pitch, yaw)
• Orientation (quaternion)`}
            </div>
          </div>
        </div>

        <div>
          <div className="slide-card">
            <div className="slide-card__title">Vehicle Control</div>
            <p>
              Control the vehicle by publishing velocity commands to the <code>/cmd_vel</code> topic.
            </p>
            <div className="slide-code">
{`Topic: /cmd_vel
Type: geometry_msgs/Twist

Message Structure:
linear:
  x: 0.0    # m/s (forward/backward)
  y: 0.0    # m/s (strafe, usually 0)
  z: 0.0    # m/s (up/down, usually 0)
angular:
  x: 0.0    # rad/s (roll, usually 0)
  y: 0.0    # rad/s (pitch, usually 0)
  z: 0.0    # rad/s (yaw/turning)`}
            </div>
          </div>

          <div className="slide-card" style={{ marginTop: ".75rem" }}>
            <div className="slide-card__title">Keyboard Mapping</div>
            <div className="slide-code" style={{ fontSize: "0.9rem" }}>
{`W / ↑  : Forward  (linear.x = +)
S / ↓  : Backward (linear.x = -)
A / ←  : Turn Left  (angular.z = +)
D / →  : Turn Right (angular.z = -)
Space  : Stop (all zeros)

Speed Control:
+ / = : Increase speed
- / _ : Decrease speed`}
            </div>
          </div>

          <div className="slide-callout slide-callout--warn" style={{ marginTop: ".75rem" }}>
            <b>Safety Limits:</b> The vehicle has maximum speed limits (typically 2 m/s linear,
            1 rad/s angular) to prevent unstable behavior in simulation.
          </div>
        </div>
      </div>

      <div className="slide-card" style={{ marginTop: ".75rem" }}>
        <div className="slide-card__title">Odometry (Position Tracking)</div>
        <div className="slide-columns">
          <div>
            <p>
              Odometry provides the vehicle's estimated position and velocity based on wheel encoders
              and IMU data.
            </p>
          </div>
          <div className="slide-code" style={{ fontSize: "0.85rem" }}>
{`Topic: /odom
Type: nav_msgs/Odometry

Data:
• pose.position (x, y, z)
• pose.orientation (quaternion)
• twist.linear (velocities)
• twist.angular (rates)`}
          </div>
        </div>
      </div>

      <div className="slide-callout slide-callout--success">
        <b>Next Step:</b> In the simulation interface, you'll see the camera feed in real-time
        and control the vehicle using your keyboard. Sensor data will be displayed in panels around the camera view.
      </div>
    </div>
  );
}
