// src/levels/slidesROS2Advanced/06-TimingPolicies.jsx
import React from "react";

export const meta = {
  id: "timing-policies",
  title: "Deadline and Lifespan Policies",
  order: 6,
  objectiveCode: "ros2-qos-settings-3",
};

export default function TimingPolicies() {
  return (
    <div className="slide">
      <h2>Deadline and Lifespan Policies</h2>

      <div className="slide-card">
        <div className="slide-card__title">Deadline: Detecting Slow Publishers</div>
        <p>
          The <b>deadline</b> policy sets the maximum expected time between messages.
          If messages don't arrive in time, both publisher and subscriber are notified.
        </p>

        <pre className="slide-code" style={{ fontSize: "0.85em", marginTop: "1rem" }}>{`from rclpy.duration import Duration
from rclpy.qos import QoSProfile

qos = QoSProfile(
    deadline=Duration(seconds=0.1)  # Expect message every 100ms
)

# Publisher must publish at least every 100ms
pub = node.create_publisher(Twist, '/cmd_vel', qos)

# Subscriber will be notified if deadline is missed
sub = node.create_subscription(
    Twist, '/cmd_vel', callback, qos,
    event_callbacks=deadline_callback
)`}</pre>
      </div>

      <div className="slide-card">
        <div className="slide-card__title">Use Cases for Deadline</div>
        <ul style={{ fontSize: "0.9em" }}>
          <li><b>Heartbeat Monitoring:</b> Detect if a critical node has stopped publishing</li>
          <li><b>Real-time Systems:</b> Ensure control loops run at expected frequency</li>
          <li><b>Quality Monitoring:</b> Alert when sensor updates are too slow</li>
        </ul>
      </div>

      <div className="slide-card">
        <div className="slide-card__title">Lifespan: Expiring Old Data</div>
        <p>
          The <b>lifespan</b> policy sets how long a message remains valid.
          After the lifespan expires, the message is automatically discarded.
        </p>

        <pre className="slide-code" style={{ fontSize: "0.85em", marginTop: "1rem" }}>{`qos = QoSProfile(
    lifespan=Duration(seconds=5.0)  # Messages expire after 5 seconds
)

# Old messages in the queue are automatically dropped
# Useful for time-sensitive data that becomes stale`}</pre>
      </div>

      <div className="slide-card">
        <div className="slide-card__title">Use Cases for Lifespan</div>
        <ul style={{ fontSize: "0.9em" }}>
          <li><b>Sensor Data:</b> Discard outdated GPS coordinates or obstacle detections</li>
          <li><b>Cached Messages:</b> Prevent late joiners from receiving very old data</li>
          <li><b>Temporary Commands:</b> Time-limited offers or opportunities</li>
        </ul>
      </div>

      <div className="slide-callout slide-callout--warn">
        <b>Note:</b> Deadline violations don't block communication - they only trigger callbacks.
        You must implement the response to deadline misses in your application logic.
      </div>
    </div>
  );
}
