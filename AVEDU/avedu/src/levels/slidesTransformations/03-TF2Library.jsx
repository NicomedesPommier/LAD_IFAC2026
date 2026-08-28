// src/levels/slidesTransformations/03-TF2Library.jsx
import React from "react";

export const meta = {
  id: "tf2-library",
  title: "TF2 Library in ROS 2",
  order: 3,
  objectiveCode: "tf-importance-3",
};

export default function TF2Library() {
  return (
    <div className="slide">
      <h2>TF2 Library in ROS 2</h2>

      <div className="slide-card">
        <div className="slide-card__title">What is TF2?</div>
        <p>
          <b>tf2</b> is ROS 2's transform library. It maintains a time-stamped database of coordinate frames
          and provides tools to transform data between frames, even across time.
        </p>
      </div>

      <div className="slide-card">
        <div className="slide-card__title">Core Components</div>

        <div style={{ display: "grid", gap: "1rem", marginTop: "1rem" }}>
          <div style={{ background: "rgba(125, 249, 255, 0.05)", padding: "0.75rem", borderRadius: "6px", border: "1px solid rgba(125, 249, 255, 0.2)" }}>
            <b style={{ color: "#7df9ff" }}>TransformBroadcaster</b>
            <p style={{ margin: "0.5rem 0 0 0", fontSize: "0.9em", opacity: 0.9 }}>
              Publishes transforms to the /tf topic. Use this to tell the system about frame relationships.
            </p>
            <pre className="slide-code" style={{ fontSize: "0.75em", marginTop: "0.5rem" }}>{`from tf2_ros import TransformBroadcaster
from geometry_msgs.msg import TransformStamped

broadcaster = TransformBroadcaster(node)

transform = TransformStamped()
transform.header.stamp = node.get_clock().now().to_msg()
transform.header.frame_id = 'base_link'
transform.child_frame_id = 'camera_link'
transform.transform.translation.x = 0.3  # 30cm forward
transform.transform.translation.z = 0.1  # 10cm up
# ... set rotation (quaternion)

broadcaster.sendTransform(transform)`}</pre>
          </div>

          <div style={{ background: "rgba(125, 249, 255, 0.05)", padding: "0.75rem", borderRadius: "6px", border: "1px solid rgba(125, 249, 255, 0.2)" }}>
            <b style={{ color: "#7df9ff" }}>TransformListener / Buffer</b>
            <p style={{ margin: "0.5rem 0 0 0", fontSize: "0.9em", opacity: 0.9 }}>
              Listens to /tf and stores transforms. Query this to get transforms between any two frames.
            </p>
            <pre className="slide-code" style={{ fontSize: "0.75em", marginTop: "0.5rem" }}>{`from tf2_ros import TransformListener, Buffer

tf_buffer = Buffer()
tf_listener = TransformListener(tf_buffer, node)

# Later, query a transform
try:
    transform = tf_buffer.lookup_transform(
        'base_link',  # target frame
        'camera_link',  # source frame
        rclpy.time.Time()  # latest available
    )
    # Use transform...
except Exception as e:
    node.get_logger().warn(f'Transform failed: {e}')`}</pre>
          </div>

          <div style={{ background: "rgba(125, 249, 255, 0.05)", padding: "0.75rem", borderRadius: "6px", border: "1px solid rgba(125, 249, 255, 0.2)" }}>
            <b style={{ color: "#7df9ff" }}>StaticTransformBroadcaster</b>
            <p style={{ margin: "0.5rem 0 0 0", fontSize: "0.9em", opacity: 0.9 }}>
              Publishes transforms that never change (e.g., sensor mounting positions).
              More efficient than regular broadcaster.
            </p>
            <pre className="slide-code" style={{ fontSize: "0.75em", marginTop: "0.5rem" }}>{`from tf2_ros import StaticTransformBroadcaster

static_broadcaster = StaticTransformBroadcaster(node)

# Publish once at startup
static_transform = TransformStamped()
# ... fill in transform
static_broadcaster.sendTransform(static_transform)
# No need to republish!`}</pre>
          </div>
        </div>
      </div>

      <div className="slide-callout slide-callout--info">
        <b>Pro Tip:</b> Use StaticTransformBroadcaster for fixed relationships (sensor mounts)
        and TransformBroadcaster for dynamic relationships (robot moving in world).
      </div>
    </div>
  );
}
