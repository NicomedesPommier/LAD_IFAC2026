// src/levels/slidesSensing/02-SubscribingToSensorData.jsx
import React from "react";

export const meta = {
  id: "subscribing-to-sensor-data",
  title: "Subscribing to Sensor Data",
  order: 2,
  objectiveCode: "SENSE_SUBSCRIBE",
};

export default function SubscribingToSensorData() {
  return (
    <div className="slide">
      <h2>Subscribing to Sensor Data</h2>

      <div className="slide-card">
        <div className="slide-card__title">Accessing Sensor Data</div>
        <p>
          To use sensor data in your ROS 2 nodes, you need to <b>subscribe</b> to the
          topics that sensor drivers publish to. Each sensor type uses specific message
          formats designed for that data.
        </p>
      </div>

      <div className="slide-card">
        <div className="slide-card__title">QCar Sensor Topics and Message Types</div>
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          <div style={{
            padding: "1rem",
            background: "rgba(125, 249, 255, 0.1)",
            borderRadius: "8px",
            border: "2px solid rgba(125, 249, 255, 0.3)"
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <b>LIDAR Data</b>
              <code style={{ fontSize: "0.85em" }}>sensor_msgs/msg/LaserScan</code>
            </div>
            <p style={{ fontSize: "0.9em", marginTop: "0.5rem" }}>
              Topic: <code>/scan</code>
            </p>
            <p style={{ fontSize: "0.85em", marginTop: "0.3rem", opacity: 0.8 }}>
              Contains: range measurements, angle information, min/max ranges
            </p>
          </div>

          <div style={{
            padding: "1rem",
            background: "rgba(255, 95, 244, 0.1)",
            borderRadius: "8px",
            border: "2px solid rgba(255, 95, 244, 0.3)"
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <b>Camera Images</b>
              <code style={{ fontSize: "0.85em" }}>sensor_msgs/msg/Image</code>
            </div>
            <p style={{ fontSize: "0.9em", marginTop: "0.5rem" }}>
              Topics: <code>/camera/image_raw</code>, <code>/camera/csi_front/image_raw</code>, etc.
            </p>
            <p style={{ fontSize: "0.85em", marginTop: "0.3rem", opacity: 0.8 }}>
              Contains: image data, encoding format, dimensions, timestamp
            </p>
          </div>

          <div style={{
            padding: "1rem",
            background: "rgba(255, 200, 87, 0.1)",
            borderRadius: "8px",
            border: "2px solid rgba(255, 200, 87, 0.3)"
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <b>Camera Info</b>
              <code style={{ fontSize: "0.85em" }}>sensor_msgs/msg/CameraInfo</code>
            </div>
            <p style={{ fontSize: "0.9em", marginTop: "0.5rem" }}>
              Topics: <code>/camera/camera_info</code>, <code>/camera/csi_front/camera_info</code>, etc.
            </p>
            <p style={{ fontSize: "0.85em", marginTop: "0.3rem", opacity: 0.8 }}>
              Contains: calibration data, distortion parameters, projection matrix
            </p>
          </div>
        </div>
      </div>

      <div className="slide-card">
        <div className="slide-card__title">Creating a Subscriber (Python)</div>
        <pre style={{
          background: "rgba(0,0,0,0.3)",
          padding: "1rem",
          borderRadius: "8px",
          overflow: "auto",
          fontSize: "0.85em"
        }}>
{`import rclpy
from rclpy.node import Node
from sensor_msgs.msg import LaserScan, Image

class SensorSubscriber(Node):
    def __init__(self):
        super().__init__('sensor_subscriber')

        # Subscribe to LIDAR
        self.lidar_sub = self.create_subscription(
            LaserScan,
            '/scan',
            self.lidar_callback,
            10)

        # Subscribe to front camera
        self.camera_sub = self.create_subscription(
            Image,
            '/camera/csi_front/image_raw',
            self.camera_callback,
            10)

    def lidar_callback(self, msg):
        # Process LIDAR data
        ranges = msg.ranges
        min_distance = min(ranges)
        self.get_logger().info(f'Closest obstacle: {min_distance}m')

    def camera_callback(self, msg):
        # Process camera image
        self.get_logger().info(
            f'Received image: {msg.width}x{msg.height}')

def main():
    rclpy.init()
    node = SensorSubscriber()
    rclpy.spin(node)
    node.destroy_node()
    rclpy.shutdown()
`}
        </pre>
      </div>

      <div className="slide-card slide-card--aside">
        <div>
          <div className="slide-card__title">Best Practices</div>
          <ul>
            <li><b>QoS Settings:</b> Use appropriate Quality of Service profiles for sensor data</li>
            <li><b>Callback Efficiency:</b> Keep callbacks fast to avoid blocking message processing</li>
            <li><b>Time Synchronization:</b> Use message timestamps for multi-sensor fusion</li>
            <li><b>Error Handling:</b> Check for invalid or missing data</li>
          </ul>
        </div>
        <div className="slide-callout slide-callout--warning">
          <b>Performance Tip:</b> High-frequency sensors like cameras and LIDAR generate
          large amounts of data. Process only what you need and consider downsampling
          or filtering for computationally intensive operations.
        </div>
      </div>

      <div className="slide-card">
        <div className="slide-card__title">Message Type Details</div>
        <p>Understanding the message structure is crucial for processing sensor data:</p>
        <div style={{ marginTop: "1rem" }}>
          <b>LaserScan Message Fields:</b>
          <ul style={{ fontSize: "0.9em", marginTop: "0.5rem" }}>
            <li><code>ranges[]</code> - Array of distance measurements</li>
            <li><code>angle_min/angle_max</code> - Scan angle range</li>
            <li><code>range_min/range_max</code> - Valid distance range</li>
            <li><code>time_increment</code> - Time between measurements</li>
          </ul>
        </div>
        <div style={{ marginTop: "1rem" }}>
          <b>Image Message Fields:</b>
          <ul style={{ fontSize: "0.9em", marginTop: "0.5rem" }}>
            <li><code>width, height</code> - Image dimensions</li>
            <li><code>encoding</code> - Pixel format (RGB8, BGR8, etc.)</li>
            <li><code>data[]</code> - Raw pixel data array</li>
            <li><code>header.stamp</code> - Image timestamp</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
