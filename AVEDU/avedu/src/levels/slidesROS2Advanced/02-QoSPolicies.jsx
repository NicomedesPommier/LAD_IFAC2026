// src/levels/slidesROS2Advanced/02-QoSPolicies.jsx
import React from "react";

export const meta = {
  id: "qos-policies",
  title: "QoS Policies Overview",
  order: 2,
  objectiveCode: "ros2-qos-intro-2",
};

export default function QoSPolicies() {
  return (
    <div className="slide">
      <h2>QoS Policies Overview</h2>

      <div className="slide-card">
        <div className="slide-card__title">Main QoS Policies</div>
        <p>
          QoS is composed of multiple independent policies that work together.
          Each policy controls a specific aspect of data transmission.
        </p>
      </div>

      <div className="slide-card">
        <div className="slide-card__title">Core QoS Policies</div>
        <div style={{ display: "grid", gap: "1rem" }}>

          <div style={{ padding: "0.75rem", background: "rgba(125, 249, 255, 0.05)", borderRadius: "8px", border: "1px solid rgba(125, 249, 255, 0.2)" }}>
            <b style={{ color: "var(--neon, #7df9ff)" }}>Reliability</b>
            <p style={{ margin: "0.5rem 0 0 0", opacity: 0.9, fontSize: "0.9em" }}>
              <b>RELIABLE:</b> Guarantee message delivery (uses acknowledgments)<br/>
              <b>BEST_EFFORT:</b> Send once, no guarantees (faster, lower overhead)
            </p>
          </div>

          <div style={{ padding: "0.75rem", background: "rgba(125, 249, 255, 0.05)", borderRadius: "8px", border: "1px solid rgba(125, 249, 255, 0.2)" }}>
            <b style={{ color: "var(--neon, #7df9ff)" }}>Durability</b>
            <p style={{ margin: "0.5rem 0 0 0", opacity: 0.9, fontSize: "0.9em" }}>
              <b>TRANSIENT_LOCAL:</b> Store messages for late-joining subscribers<br/>
              <b>VOLATILE:</b> Only send to active subscribers (default)
            </p>
          </div>

          <div style={{ padding: "0.75rem", background: "rgba(125, 249, 255, 0.05)", borderRadius: "8px", border: "1px solid rgba(125, 249, 255, 0.2)" }}>
            <b style={{ color: "var(--neon, #7df9ff)" }}>History</b>
            <p style={{ margin: "0.5rem 0 0 0", opacity: 0.9, fontSize: "0.9em" }}>
              <b>KEEP_LAST:</b> Keep only the N most recent messages<br/>
              <b>KEEP_ALL:</b> Keep all messages (limited by resources)
            </p>
          </div>

          <div style={{ padding: "0.75rem", background: "rgba(125, 249, 255, 0.05)", borderRadius: "8px", border: "1px solid rgba(125, 249, 255, 0.2)" }}>
            <b style={{ color: "var(--neon, #7df9ff)" }}>Deadline</b>
            <p style={{ margin: "0.5rem 0 0 0", opacity: 0.9, fontSize: "0.9em" }}>
              Maximum time between messages. System notifies if deadline is missed.
            </p>
          </div>

          <div style={{ padding: "0.75rem", background: "rgba(125, 249, 255, 0.05)", borderRadius: "8px", border: "1px solid rgba(125, 249, 255, 0.2)" }}>
            <b style={{ color: "var(--neon, #7df9ff)" }}>Lifespan</b>
            <p style={{ margin: "0.5rem 0 0 0", opacity: 0.9, fontSize: "0.9em" }}>
              How long a message is valid. Old messages are automatically discarded.
            </p>
          </div>

          <div style={{ padding: "0.75rem", background: "rgba(125, 249, 255, 0.05)", borderRadius: "8px", border: "1px solid rgba(125, 249, 255, 0.2)" }}>
            <b style={{ color: "var(--neon, #7df9ff)" }}>Liveliness</b>
            <p style={{ margin: "0.5rem 0 0 0", opacity: 0.9, fontSize: "0.9em" }}>
              Monitor if publishers/subscribers are still active and responsive.
            </p>
          </div>
        </div>
      </div>

      <div className="slide-callout slide-callout--warn">
        <b>Important:</b> Publishers and subscribers must have compatible QoS settings to communicate.
        Mismatched QoS can prevent data from being exchanged!
      </div>
    </div>
  );
}
