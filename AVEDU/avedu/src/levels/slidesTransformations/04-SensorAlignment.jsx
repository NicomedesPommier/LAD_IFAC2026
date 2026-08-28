// src/levels/slidesTransformations/04-SensorAlignment.jsx
import React from "react";

export const meta = {
  id: "sensor-alignment",
  title: "Aligning Multiple Sensors",
  order: 4,
  objectiveCode: "tf-sensor-alignment-1",
};

export default function SensorAlignment() {
  return (
    <div className="slide">
      <h2>Aligning Multiple Sensors</h2>

      <div className="slide-card">
        <div className="slide-card__title">The Multi-Sensor Challenge</div>
        <p>
          Autonomous vehicles use multiple sensors: cameras for vision, LiDAR for distance,
          IMU for orientation, GPS for position. Each sensor reports data in its own coordinate frame.
          <b> TF allows us to combine all this data into a unified view.</b>
        </p>
      </div>

      <div className="slide-card">
        <div className="slide-card__title">Setting Up Static Transforms for Sensors</div>
        <p style={{ fontSize: "0.9em", marginBottom: "0.75rem" }}>
          First, measure where each sensor is physically mounted on your robot:
        </p>

        <pre className="slide-code" style={{ fontSize: "0.8em" }}>{`import rclpy
from rclpy.node import Node
from tf2_ros import StaticTransformBroadcaster
from geometry_msgs.msg import TransformStamped
from tf_transformations import quaternion_from_euler
import math

class SensorTFPublisher(Node):
    def __init__(self):
        super().__init__('sensor_tf_publisher')
        self.static_broadcaster = StaticTransformBroadcaster(self)

        # Publish all sensor transforms
        self.publish_camera_tf()
        self.publish_lidar_tf()
        self.publish_imu_tf()

    def publish_camera_tf(self):
        """Camera is 0.4m forward, 0.2m up, tilted 10° down"""
        t = TransformStamped()
        t.header.stamp = self.get_clock().now().to_msg()
        t.header.frame_id = 'base_link'
        t.child_frame_id = 'camera_link'

        t.transform.translation.x = 0.4
        t.transform.translation.y = 0.0
        t.transform.translation.z = 0.2

        # Pitch down 10 degrees
        q = quaternion_from_euler(0, -10 * math.pi/180, 0)
        t.transform.rotation.x = q[0]
        t.transform.rotation.y = q[1]
        t.transform.rotation.z = q[2]
        t.transform.rotation.w = q[3]

        self.static_broadcaster.sendTransform(t)

    def publish_lidar_tf(self):
        """LiDAR is 0.3m forward, 0.5m up, level"""
        t = TransformStamped()
        t.header.stamp = self.get_clock().now().to_msg()
        t.header.frame_id = 'base_link'
        t.child_frame_id = 'lidar_link'

        t.transform.translation.x = 0.3
        t.transform.translation.y = 0.0
        t.transform.translation.z = 0.5

        # No rotation (identity quaternion)
        t.transform.rotation.w = 1.0

        self.static_broadcaster.sendTransform(t)`}</pre>
      </div>

      <div className="slide-callout slide-callout--warn">
        <b>Critical:</b> Measure sensor positions carefully! A 5cm error can cause significant
        misalignment, especially at long distances.
      </div>
    </div>
  );
}
