// src/levels/slidesROS2Advanced/07-RealtimeScenarios.jsx
import React from "react";

export const meta = {
  id: "realtime-scenarios",
  title: "Real-time Scenarios and QoS Selection",
  order: 7,
  objectiveCode: "ros2-realtime-1",
};

export default function RealtimeScenarios() {
  return (
    <div className="slide">
      <h2>Real-time Scenarios and QoS Selection</h2>

      <div className="slide-card">
        <div className="slide-card__title">Choosing the Right QoS Profile</div>
        <p>
          Different autonomous vehicle subsystems have different requirements.
          Let's look at real-world scenarios and appropriate QoS configurations.
        </p>
      </div>

      <div className="slide-card">
        <div className="slide-card__title">Scenario 1: Emergency Stop System</div>
        <div style={{ background: "rgba(255, 100, 100, 0.1)", padding: "1rem", borderRadius: "8px", borderLeft: "4px solid #ff6464" }}>
          <p style={{ margin: "0 0 0.75rem 0" }}>
            <b>Requirements:</b> Safety-critical, must arrive reliably, tolerate network issues
          </p>
          <pre className="slide-code" style={{ fontSize: "0.8em" }}>{`qos = QoSProfile(
    reliability=ReliabilityPolicy.RELIABLE,
    durability=DurabilityPolicy.VOLATILE,
    history=HistoryPolicy.KEEP_LAST,
    depth=1,  # Only latest command matters
    deadline=Duration(seconds=0.05)  # 50ms max delay
)
emergency_pub = node.create_publisher(
    EmergencyStop, '/emergency_stop', qos
)`}</pre>
          <p style={{ fontSize: "0.85em", opacity: 0.9, marginTop: "0.5rem" }}>
            Why: RELIABLE ensures delivery, shallow queue (depth=1) minimizes latency,
            deadline detects communication failures.
          </p>
        </div>
      </div>

      <div className="slide-card">
        <div className="slide-card__title">Scenario 2: LiDAR Point Cloud (10Hz)</div>
        <div style={{ background: "rgba(100, 200, 255, 0.1)", padding: "1rem", borderRadius: "8px", borderLeft: "4px solid #64c8ff" }}>
          <p style={{ margin: "0 0 0.75rem 0" }}>
            <b>Requirements:</b> High frequency, large messages, can tolerate drops
          </p>
          <pre className="slide-code" style={{ fontSize: "0.8em" }}>{`qos = QoSProfile(
    reliability=ReliabilityPolicy.BEST_EFFORT,
    durability=DurabilityPolicy.VOLATILE,
    history=HistoryPolicy.KEEP_LAST,
    depth=2,  # Keep only 1-2 latest scans
    lifespan=Duration(seconds=0.2)  # Discard old scans
)
lidar_pub = node.create_publisher(
    PointCloud2, '/lidar/points', qos
)`}</pre>
          <p style={{ fontSize: "0.85em", opacity: 0.9, marginTop: "0.5rem" }}>
            Why: BEST_EFFORT reduces overhead, small depth prevents memory bloat,
            lifespan ensures fresh data.
          </p>
        </div>
      </div>

      <div className="slide-card">
        <div className="slide-card__title">Scenario 3: HD Map (for late joiners)</div>
        <div style={{ background: "rgba(125, 249, 255, 0.1)", padding: "1rem", borderRadius: "8px", borderLeft: "4px solid #7df9ff" }}>
          <p style={{ margin: "0 0 0.75rem 0" }}>
            <b>Requirements:</b> Large, static data that rarely changes, needed by new nodes
          </p>
          <pre className="slide-code" style={{ fontSize: "0.8em" }}>{`qos = QoSProfile(
    reliability=ReliabilityPolicy.RELIABLE,
    durability=DurabilityPolicy.TRANSIENT_LOCAL,
    history=HistoryPolicy.KEEP_LAST,
    depth=1  # Only latest map version
)
map_pub = node.create_publisher(
    OccupancyGrid, '/map', qos
)`}</pre>
          <p style={{ fontSize: "0.85em", opacity: 0.9, marginTop: "0.5rem" }}>
            Why: TRANSIENT_LOCAL caches the map for late-joining nodes (e.g., newly spawned planner),
            RELIABLE ensures complete transmission of large map data.
          </p>
        </div>
      </div>
    </div>
  );
}
