// src/levels/slidesTransformations/05-TransformingData.jsx
import React from "react";

export const meta = {
  id: "transforming-data",
  title: "Transforming Sensor Data",
  order: 5,
  objectiveCode: "tf-sensor-alignment-2",
};

export default function TransformingData() {
  return (
    <div className="slide">
      <h2>Transforming Sensor Data</h2>

      <div className="slide-card">
        <div className="slide-card__title">Use Case: Obstacle Detection</div>
        <p>
          The camera detects an obstacle at pixel coordinates (320, 240) with depth 3.0 meters.
          We need to know: <b>Where is this obstacle relative to the robot's center?</b>
        </p>
      </div>

      <div className="slide-card">
        <div className="slide-card__title">Transforming Points</div>
        <pre className="slide-code" style={{ fontSize: "0.8em" }}>{`from tf2_ros import Buffer, TransformListener
from geometry_msgs.msg import PointStamped
import tf2_geometry_msgs  # Important: enables PointStamped transforms

class ObstacleTransformer(Node):
    def __init__(self):
        super().__init__('obstacle_transformer')

        # Set up TF listener
        self.tf_buffer = Buffer()
        self.tf_listener = TransformListener(self.tf_buffer, self)

        # Subscribe to camera detections
        self.sub = self.create_subscription(
            PointStamped, '/camera/obstacle', self.obstacle_callback, 10
        )

    def obstacle_callback(self, obstacle_in_camera):
        """Receives obstacle position in camera frame"""
        try:
            # Transform from camera_link to base_link
            obstacle_in_base = self.tf_buffer.transform(
                obstacle_in_camera,
                'base_link',
                timeout=rclpy.duration.Duration(seconds=1.0)
            )

            self.get_logger().info(
                f'Obstacle detected at:'
                f'\\n  Camera frame: x={obstacle_in_camera.point.x:.2f}, '
                f'y={obstacle_in_camera.point.y:.2f}, '
                f'z={obstacle_in_camera.point.z:.2f}'
                f'\\n  Robot frame:  x={obstacle_in_base.point.x:.2f}, '
                f'y={obstacle_in_base.point.y:.2f}, '
                f'z={obstacle_in_base.point.z:.2f}'
            )

            # Now we can use this for navigation decisions
            if obstacle_in_base.point.x < 1.0 and abs(obstacle_in_base.point.y) < 0.5:
                self.get_logger().warn('Obstacle in path! Stopping.')

        except Exception as e:
            self.get_logger().error(f'Transform failed: {e}')`}</pre>
      </div>

      <div className="slide-card">
        <div className="slide-card__title">Transforming Other Data Types</div>
        <div style={{ fontSize: "0.9em" }}>
          <p>TF2 can transform many ROS message types:</p>
          <ul style={{ marginTop: "0.5rem" }}>
            <li><code>PointStamped</code> - 3D points</li>
            <li><code>PoseStamped</code> - Position + orientation</li>
            <li><code>PointCloud2</code> - LiDAR point clouds</li>
            <li><code>Vector3Stamped</code> - Velocities, forces</li>
            <li><code>WrenchStamped</code> - Forces and torques</li>
          </ul>
          <p style={{ marginTop: "0.5rem" }}>
            Remember to import the appropriate <code>tf2_*</code> package (e.g., <code>tf2_geometry_msgs</code>,
            <code>tf2_sensor_msgs</code>).
          </p>
        </div>
      </div>
    </div>
  );
}
