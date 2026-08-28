// src/levels/slidesTransformations/10-AdvancedTopics.jsx
import React from "react";

export const meta = {
  id: "advanced-topics",
  title: "Advanced TF Topics",
  order: 10,
  objectiveCode: "tf-practical-3",
};

export default function AdvancedTopics() {
  return (
    <div className="slide">
      <h2>Advanced TF Topics</h2>

      <div className="slide-card">
        <div className="slide-card__title">Time Travel with TF</div>
        <p style={{ fontSize: "0.9em" }}>
          TF stores a history of transforms (default: 10 seconds). You can query transforms
          at any point in this history, enabling sensor fusion across time.
        </p>

        <pre className="slide-code" style={{ fontSize: "0.8em", marginTop: "0.75rem" }}>{`# Where was the robot 2 seconds ago?
past_time = self.get_clock().now() - rclpy.duration.Duration(seconds=2.0)

try:
    past_transform = self.tf_buffer.lookup_transform(
        'map',
        'base_link',
        past_time,
        timeout=rclpy.duration.Duration(seconds=0.5)
    )

    self.get_logger().info(
        f'2 seconds ago, robot was at: '
        f'({past_transform.transform.translation.x:.2f}, '
        f'{past_transform.transform.translation.y:.2f})'
    )
except:
    self.get_logger().warn('Past transform not available')`}</pre>
      </div>

      <div className="slide-card">
        <div className="slide-card__title">Transform Velocities and Accelerations</div>
        <p style={{ fontSize: "0.9em", marginBottom: "0.75rem" }}>
          Use <code>lookup_transform_full</code> to get velocity information:
        </p>

        <pre className="slide-code" style={{ fontSize: "0.8em" }}>{`# Get transform and velocity between frames
transform_with_velocity = self.tf_buffer.lookup_transform_full(
    target_frame='map',
    target_time=current_time,
    source_frame='base_link',
    source_time=current_time - dt,  # Time difference
    fixed_frame='odom'  # Frame to compute velocity in
)

# Access velocity from the child_frame_id velocity twist`}</pre>
      </div>

      <div className="slide-card">
        <div className="slide-card__title">Creating Custom Transform Messages</div>
        <pre className="slide-code" style={{ fontSize: "0.75em" }}>{`def create_transform(self, parent, child, x, y, z, roll, pitch, yaw):
    """Helper to create TransformStamped messages"""
    from geometry_msgs.msg import TransformStamped
    from tf_transformations import quaternion_from_euler

    t = TransformStamped()
    t.header.stamp = self.get_clock().now().to_msg()
    t.header.frame_id = parent
    t.child_frame_id = child

    # Set translation
    t.transform.translation.x = float(x)
    t.transform.translation.y = float(y)
    t.transform.translation.z = float(z)

    # Convert Euler angles to quaternion
    q = quaternion_from_euler(roll, pitch, yaw)
    t.transform.rotation.x = q[0]
    t.transform.rotation.y = q[1]
    t.transform.rotation.z = q[2]
    t.transform.rotation.w = q[3]

    return t

# Usage
tf_msg = self.create_transform(
    'base_link', 'sensor',
    x=0.5, y=0.0, z=0.2,
    roll=0, pitch=-0.174, yaw=0
)
self.broadcaster.sendTransform(tf_msg)`}</pre>
      </div>

      <div className="slide-card">
        <div className="slide-card__title">Performance Considerations</div>
        <ul style={{ fontSize: "0.9em" }}>
          <li><b>Buffer size:</b> Larger history uses more memory (adjust <code>cache_time</code>)</li>
          <li><b>Static vs dynamic:</b> Use <code>StaticTransformBroadcaster</code> for fixed transforms</li>
          <li><b>Transform caching:</b> Cache frequently-used transforms instead of querying every time</li>
          <li><b>Batching:</b> Transform point clouds in bulk rather than point-by-point</li>
        </ul>
      </div>

      <div className="slide-callout slide-callout--info">
        <b>Pro Tip:</b> For real-time systems, pre-warm your TF buffer by waiting for all expected
        frames to be available before starting main processing loops.
      </div>
    </div>
  );
}
