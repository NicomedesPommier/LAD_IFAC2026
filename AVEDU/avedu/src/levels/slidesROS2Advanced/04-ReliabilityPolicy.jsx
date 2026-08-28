// src/levels/slidesROS2Advanced/04-ReliabilityPolicy.jsx
import React from "react";

export const meta = {
  id: "reliability-policy",
  title: "Reliability Policy in Detail",
  order: 4,
  objectiveCode: "ros2-qos-settings-1",
};

export default function ReliabilityPolicy() {
  return (
    <div className="slide">
      <h2>Reliability Policy in Detail</h2>

      <div className="slide-card">
        <div className="slide-card__title">The Reliability Trade-off</div>
        <p>
          The reliability policy determines whether messages are guaranteed to arrive.
          This is one of the most important QoS decisions you'll make.
        </p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
        <div className="slide-card">
          <div className="slide-card__title" style={{ color: "#7df9ff" }}>RELIABLE</div>
          <p><b>Guarantees delivery</b></p>
          <ul style={{ fontSize: "0.9em", opacity: 0.9 }}>
            <li>Uses acknowledgments (ACKs)</li>
            <li>Retransmits lost packets</li>
            <li>Higher latency and overhead</li>
            <li>Better for commands and critical data</li>
          </ul>

          <div style={{ marginTop: "1rem", padding: "0.5rem", background: "rgba(125, 249, 255, 0.08)", borderRadius: "4px" }}>
            <b style={{ fontSize: "0.85em" }}>Use Cases:</b>
            <ul style={{ fontSize: "0.85em", margin: "0.25rem 0 0 1.25rem" }}>
              <li>Safety commands</li>
              <li>Configuration updates</li>
              <li>State machines</li>
              <li>Control signals</li>
            </ul>
          </div>
        </div>

        <div className="slide-card">
          <div className="slide-card__title" style={{ color: "#ff7d7d" }}>BEST_EFFORT</div>
          <p><b>No delivery guarantees</b></p>
          <ul style={{ fontSize: "0.9em", opacity: 0.9 }}>
            <li>Send and forget (no ACKs)</li>
            <li>Lower latency and overhead</li>
            <li>Can drop messages under load</li>
            <li>Better for high-frequency streams</li>
          </ul>

          <div style={{ marginTop: "1rem", padding: "0.5rem", background: "rgba(255, 125, 125, 0.08)", borderRadius: "4px" }}>
            <b style={{ fontSize: "0.85em" }}>Use Cases:</b>
            <ul style={{ fontSize: "0.85em", margin: "0.25rem 0 0 1.25rem" }}>
              <li>Camera feeds (30+ fps)</li>
              <li>LiDAR scans</li>
              <li>IMU data</li>
              <li>Telemetry</li>
            </ul>
          </div>
        </div>
      </div>

      <div className="slide-card">
        <div className="slide-card__title">Code Example</div>
        <pre className="slide-code" style={{ fontSize: "0.85em" }}>{`from rclpy.qos import QoSProfile, ReliabilityPolicy

# Reliable publisher for safety commands
qos_reliable = QoSProfile(
    reliability=ReliabilityPolicy.RELIABLE,
    depth=10
)
self.cmd_pub = self.create_publisher(
    Twist, '/cmd_vel', qos_reliable
)

# Best-effort subscriber for camera feed
qos_best_effort = QoSProfile(
    reliability=ReliabilityPolicy.BEST_EFFORT,
    depth=5
)
self.img_sub = self.create_subscription(
    Image, '/camera/image', callback, qos_best_effort
)`}</pre>
      </div>

      <div className="slide-callout slide-callout--warn">
        <b>Compatibility Rule:</b> RELIABLE publishers can only communicate with RELIABLE subscribers.
        BEST_EFFORT can communicate with BEST_EFFORT or be received by RELIABLE (but not vice versa).
      </div>
    </div>
  );
}
