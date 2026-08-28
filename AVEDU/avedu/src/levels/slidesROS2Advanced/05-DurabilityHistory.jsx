// src/levels/slidesROS2Advanced/05-DurabilityHistory.jsx
import React from "react";

export const meta = {
  id: "durability-history",
  title: "Durability and History Policies",
  order: 5,
  objectiveCode: "ros2-qos-settings-2",
};

export default function DurabilityHistory() {
  return (
    <div className="slide">
      <h2>Durability and History Policies</h2>

      <div className="slide-card">
        <div className="slide-card__title">Durability: Late Joiners Problem</div>
        <p>
          What happens when a subscriber starts <i>after</i> messages have been published?
          Durability controls whether old messages are available.
        </p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
        <div className="slide-card">
          <div className="slide-card__title" style={{ color: "#7df9ff" }}>VOLATILE (default)</div>
          <ul style={{ fontSize: "0.9em" }}>
            <li>Only send to current subscribers</li>
            <li>Late joiners miss old messages</li>
            <li>Lower memory usage</li>
            <li>Good for streams and ephemeral data</li>
          </ul>
        </div>

        <div className="slide-card">
          <div className="slide-card__title" style={{ color: "#7df9ff" }}>TRANSIENT_LOCAL</div>
          <ul style={{ fontSize: "0.9em" }}>
            <li>Store messages for late joiners</li>
            <li>New subscribers get cached data</li>
            <li>Uses more memory</li>
            <li>Good for map data, configuration</li>
          </ul>
        </div>
      </div>

      <div className="slide-card">
        <div className="slide-card__title">History: How Much to Keep?</div>
        <p>
          History controls how many messages are stored in the queue.
        </p>

        <div style={{ display: "grid", gap: "0.75rem", marginTop: "1rem" }}>
          <div style={{ background: "rgba(255,255,255,0.03)", padding: "0.75rem", borderRadius: "6px" }}>
            <b>KEEP_LAST(depth)</b>
            <p style={{ margin: "0.5rem 0 0 0", fontSize: "0.9em", opacity: 0.9 }}>
              Keep only the <code style={{ color: "#7df9ff" }}>depth</code> most recent messages.
              Oldest messages are dropped when queue is full.
            </p>
            <pre className="slide-code" style={{ fontSize: "0.8em", marginTop: "0.5rem" }}>{`qos = QoSProfile(
    history=HistoryPolicy.KEEP_LAST,
    depth=10  # Keep last 10 messages
)`}</pre>
          </div>

          <div style={{ background: "rgba(255,255,255,0.03)", padding: "0.75rem", borderRadius: "6px" }}>
            <b>KEEP_ALL</b>
            <p style={{ margin: "0.5rem 0 0 0", fontSize: "0.9em", opacity: 0.9 }}>
              Store all messages (limited by system resources).
              Use with caution - can consume lots of memory!
            </p>
            <pre className="slide-code" style={{ fontSize: "0.8em", marginTop: "0.5rem" }}>{`qos = QoSProfile(
    history=HistoryPolicy.KEEP_ALL
    # depth is ignored
)`}</pre>
          </div>
        </div>
      </div>

      <div className="slide-callout slide-callout--info">
        <b>Best Practice:</b> For TRANSIENT_LOCAL durability, combine with KEEP_LAST and a reasonable depth
        (e.g., 10-100) to avoid unbounded memory growth.
      </div>
    </div>
  );
}
