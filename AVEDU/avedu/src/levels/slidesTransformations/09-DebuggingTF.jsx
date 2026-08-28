// src/levels/slidesTransformations/09-DebuggingTF.jsx
import React from "react";

export const meta = {
  id: "debugging-tf",
  title: "Debugging TF Issues",
  order: 9,
  objectiveCode: "tf-practical-2",
};

export default function DebuggingTF() {
  return (
    <div className="slide">
      <h2>Debugging TF Issues</h2>

      <div className="slide-card">
        <div className="slide-card__title">Common TF Problems</div>
        <ul style={{ fontSize: "0.9em" }}>
          <li><b>Transform not available:</b> Frame doesn't exist or isn't being published</li>
          <li><b>Extrapolation errors:</b> Requesting transform at a time not in buffer</li>
          <li><b>Multiple parents:</b> Frame connected to more than one parent (tree loop)</li>
          <li><b>Disconnected tree:</b> Some frames not connected to others</li>
          <li><b>Timestamp issues:</b> Old timestamps or clock not synchronized</li>
        </ul>
      </div>

      <div className="slide-card">
        <div className="slide-card__title">Essential TF Debugging Commands</div>

        <div style={{ display: "grid", gap: "0.75rem", marginTop: "0.75rem" }}>
          <div style={{ background: "rgba(255,255,255,0.03)", padding: "0.75rem", borderRadius: "6px" }}>
            <b style={{ color: "#7df9ff" }}>View TF Tree</b>
            <pre className="slide-code" style={{ fontSize: "0.8em", marginTop: "0.5rem" }}>{`ros2 run tf2_tools view_frames

# Creates frames_<timestamp>.pdf showing full TF tree
# Use this to visualize structure and find missing connections`}</pre>
          </div>

          <div style={{ background: "rgba(255,255,255,0.03)", padding: "0.75rem", borderRadius: "6px" }}>
            <b style={{ color: "#7df9ff" }}>Echo Transform</b>
            <pre className="slide-code" style={{ fontSize: "0.8em", marginTop: "0.5rem" }}>{`ros2 run tf2_ros tf2_echo <source_frame> <target_frame>

# Example:
ros2 run tf2_ros tf2_echo base_link camera_link

# Shows live transform updates between two frames`}</pre>
          </div>

          <div style={{ background: "rgba(255,255,255,0.03)", padding: "0.75rem", borderRadius: "6px" }}>
            <b style={{ color: "#7df9ff" }}>Monitor TF Topics</b>
            <pre className="slide-code" style={{ fontSize: "0.8em", marginTop: "0.5rem" }}>{`# Check what's being published
ros2 topic hz /tf       # Dynamic transforms
ros2 topic hz /tf_static  # Static transforms

# See transform data
ros2 topic echo /tf --no-arr
ros2 topic echo /tf_static --no-arr`}</pre>
          </div>
        </div>
      </div>

      <div className="slide-card">
        <div className="slide-card__title">Handling Transform Errors in Code</div>
        <pre className="slide-code" style={{ fontSize: "0.75em" }}>{`from tf2_ros import LookupException, ConnectivityException, ExtrapolationException

def safe_transform(self, point, target_frame):
    """Transform with proper error handling"""
    try:
        transformed = self.tf_buffer.transform(
            point,
            target_frame,
            timeout=rclpy.duration.Duration(seconds=0.5)
        )
        return transformed

    except LookupException as e:
        # Frame doesn't exist in TF tree
        self.get_logger().error(f'Frame lookup failed: {e}')

    except ConnectivityException as e:
        # Frames exist but aren't connected
        self.get_logger().error(f'Frames not connected: {e}')

    except ExtrapolationException as e:
        # Requested time is too far in past or future
        self.get_logger().warn(f'Extrapolation error: {e}')
        # Try again with latest available time
        try:
            point.header.stamp = rclpy.time.Time()  # Use latest
            return self.tf_buffer.transform(point, target_frame)
        except:
            pass

    return None  # Transform failed`}</pre>
      </div>

      <div className="slide-callout slide-callout--warn">
        <b>Common Mistake:</b> Using <code>rclpy.time.Time()</code> (zero time) means "latest available".
        Using <code>self.get_clock().now()</code> means "exact time now" which may cause extrapolation errors!
      </div>
    </div>
  );
}
