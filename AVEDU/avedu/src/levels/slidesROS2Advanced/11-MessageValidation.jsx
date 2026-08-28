// src/levels/slidesROS2Advanced/11-MessageValidation.jsx
import React from "react";

export const meta = {
  id: "message-validation",
  title: "Message Validation and Sanity Checks",
  order: 11,
  objectiveCode: "ros2-algorithms-3",
};

export default function MessageValidation() {
  return (
    <div className="slide">
      <h2>Message Validation and Sanity Checks</h2>

      <div className="slide-card">
        <div className="slide-card__title">Why Validate Messages?</div>
        <p>
          In unreliable networks, messages can arrive corrupted, out-of-order, or with invalid data.
          Even in reliable networks, sensor glitches and software bugs can produce bad data.
        </p>
        <ul style={{ fontSize: "0.9em", marginTop: "0.75rem" }}>
          <li>Detect sensor failures and outliers</li>
          <li>Prevent processing of stale or corrupted data</li>
          <li>Improve safety by catching anomalies early</li>
          <li>Debug issues by logging validation failures</li>
        </ul>
      </div>

      <div className="slide-card">
        <div className="slide-card__title">Common Validation Strategies</div>

        <div style={{ display: "grid", gap: "1rem", marginTop: "1rem" }}>
          <div style={{ background: "rgba(255,255,255,0.03)", padding: "0.75rem", borderRadius: "6px" }}>
            <b style={{ color: "#7df9ff" }}>1. Timestamp Validation</b>
            <p style={{ margin: "0.5rem 0 0 0", fontSize: "0.85em" }}>Check if message is too old:</p>
            <pre className="slide-code" style={{ fontSize: "0.75em", marginTop: "0.5rem" }}>{`def is_message_fresh(msg_stamp, max_age_sec=1.0):
    now = node.get_clock().now()
    age = (now - rclpy.time.Time.from_msg(msg_stamp)).nanoseconds / 1e9
    return age <= max_age_sec

def callback(msg):
    if not is_message_fresh(msg.header.stamp, max_age_sec=0.5):
        self.get_logger().warn('Ignoring stale message')
        return
    # Process message...`}</pre>
          </div>

          <div style={{ background: "rgba(255,255,255,0.03)", padding: "0.75rem", borderRadius: "6px" }}>
            <b style={{ color: "#7df9ff" }}>2. Range and Bounds Checking</b>
            <p style={{ margin: "0.5rem 0 0 0", fontSize: "0.85em" }}>Ensure values are physically plausible:</p>
            <pre className="slide-code" style={{ fontSize: "0.75em", marginTop: "0.5rem" }}>{`def validate_velocity(msg):
    # Check if velocity is within physically possible range
    if abs(msg.linear.x) > 50.0:  # 50 m/s max
        self.get_logger().error('Invalid velocity reading')
        return False

    # Check for NaN or infinity
    if not math.isfinite(msg.linear.x):
        self.get_logger().error('Velocity is NaN or infinite')
        return False

    return True`}</pre>
          </div>

          <div style={{ background: "rgba(255,255,255,0.03)", padding: "0.75rem", borderRadius: "6px" }}>
            <b style={{ color: "#7df9ff" }}>3. Sequence Number Checking</b>
            <p style={{ margin: "0.5rem 0 0 0", fontSize: "0.85em" }}>Detect missing or duplicate messages:</p>
            <pre className="slide-code" style={{ fontSize: "0.75em", marginTop: "0.5rem" }}>{`class SequenceChecker:
    def __init__(self):
        self.last_seq = None

    def check(self, seq):
        if self.last_seq is not None:
            gap = seq - self.last_seq
            if gap > 1:
                return f'Missing {gap - 1} message(s)'
            elif gap == 0:
                return 'Duplicate message'
            elif gap < 0:
                return 'Out-of-order message'

        self.last_seq = seq
        return None  # OK`}</pre>
          </div>

          <div style={{ background: "rgba(255,255,255,0.03)", padding: "0.75rem", borderRadius: "6px" }}>
            <b style={{ color: "#7df9ff" }}>4. Consistency Checks</b>
            <p style={{ margin: "0.5rem 0 0 0", fontSize: "0.85em" }}>Check internal consistency of complex messages:</p>
            <pre className="slide-code" style={{ fontSize: "0.75em", marginTop: "0.5rem" }}>{`def validate_odometry(msg):
    # Ensure pose and twist are consistent
    if msg.pose.pose.position.z < -1.0:
        # Vehicle shouldn't be underground
        return False

    # Ensure covariance matrices are valid
    if any(c < 0 for c in msg.pose.covariance[::7]):
        # Diagonal elements (variances) must be non-negative
        return False

    return True`}</pre>
          </div>
        </div>
      </div>

      <div className="slide-callout slide-callout--info">
        <b>Pro Tip:</b> Log validation failures with appropriate severity.
        Occasional failures might be warnings, but frequent failures indicate a systemic problem.
      </div>
    </div>
  );
}
