// src/levels/slidesROS2Advanced/08-WiFiChallenges.jsx
import React from "react";

export const meta = {
  id: "wifi-challenges",
  title: "Operating Over Unreliable WiFi",
  order: 8,
  objectiveCode: "ros2-realtime-2",
};

export default function WiFiChallenges() {
  return (
    <div className="slide">
      <h2>Operating Over Unreliable WiFi</h2>

      <div className="slide-card">
        <div className="slide-card__title">The WiFi Problem</div>
        <p>
          Many robots operate over WiFi (e.g., warehouse robots, drones, teleoperated vehicles).
          WiFi introduces challenges that wired Ethernet doesn't have:
        </p>
        <ul style={{ fontSize: "0.9em" }}>
          <li>Variable latency (1-100ms or more)</li>
          <li>Packet loss (1-20% in crowded environments)</li>
          <li>Bandwidth fluctuations</li>
          <li>Connection drops and reconnections</li>
          <li>Interference from other devices</li>
        </ul>
      </div>

      <div className="slide-card">
        <div className="slide-card__title">QoS Strategies for WiFi</div>

        <div style={{ display: "grid", gap: "1rem", marginTop: "1rem" }}>
          <div style={{ background: "rgba(125, 249, 255, 0.05)", padding: "0.75rem", borderRadius: "6px", border: "1px solid rgba(125, 249, 255, 0.2)" }}>
            <b style={{ color: "#7df9ff" }}>1. Use BEST_EFFORT for High-Frequency Streams</b>
            <p style={{ margin: "0.5rem 0 0 0", fontSize: "0.9em", opacity: 0.9 }}>
              Camera feeds, sensor data at {'>'} 10Hz should use BEST_EFFORT to avoid retransmission overhead.
              Missing one frame is better than blocking the entire stream.
            </p>
          </div>

          <div style={{ background: "rgba(125, 249, 255, 0.05)", padding: "0.75rem", borderRadius: "6px", border: "1px solid rgba(125, 249, 255, 0.2)" }}>
            <b style={{ color: "#7df9ff" }}>2. Reduce Queue Depth</b>
            <p style={{ margin: "0.5rem 0 0 0", fontSize: "0.9em", opacity: 0.9 }}>
              Use <code>depth=1</code> or <code>depth=2</code> for time-sensitive data.
              Large queues create latency when WiFi slows down.
            </p>
          </div>

          <div style={{ background: "rgba(125, 249, 255, 0.05)", padding: "0.75rem", borderRadius: "6px", border: "1px solid rgba(125, 249, 255, 0.2)" }}>
            <b style={{ color: "#7df9ff" }}>3. Set Appropriate Deadlines</b>
            <p style={{ margin: "0.5rem 0 0 0", fontSize: "0.9em", opacity: 0.9 }}>
              Use deadline policy to detect network issues. If deadlines are frequently missed,
              trigger fallback behavior (e.g., slow down, request lower-resolution data).
            </p>
          </div>

          <div style={{ background: "rgba(125, 249, 255, 0.05)", padding: "0.75rem", borderRadius: "6px", border: "1px solid rgba(125, 249, 255, 0.2)" }}>
            <b style={{ color: "#7df9ff" }}>4. Add Lifespan to Prevent Stale Data</b>
            <p style={{ margin: "0.5rem 0 0 0", fontSize: "0.9em", opacity: 0.9 }}>
              Set lifespan based on data freshness requirements. For obstacle detection,
              a 2-second-old reading is useless and should be discarded.
            </p>
          </div>

          <div style={{ background: "rgba(125, 249, 255, 0.05)", padding: "0.75rem", borderRadius: "6px", border: "1px solid rgba(125, 249, 255, 0.2)" }}>
            <b style={{ color: "#7df9ff" }}>5. Keep Critical Commands RELIABLE</b>
            <p style={{ margin: "0.5rem 0 0 0", fontSize: "0.9em", opacity: 0.9 }}>
              Emergency stop, mode changes, and safety commands should always use RELIABLE,
              even if it means slightly higher latency.
            </p>
          </div>
        </div>
      </div>

      <div className="slide-callout slide-callout--warn">
        <b>Real-World Tip:</b> Test your QoS configuration under realistic network conditions!
        Use tools like <code>tc</code> (traffic control) on Linux to simulate packet loss and latency during development.
      </div>
    </div>
  );
}
