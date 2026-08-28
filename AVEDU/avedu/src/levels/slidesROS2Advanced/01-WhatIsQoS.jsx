// src/levels/slidesROS2Advanced/01-WhatIsQoS.jsx
import React from "react";

export const meta = {
  id: "what-is-qos",
  title: "What is Quality of Service (QoS)?",
  order: 1,
  objectiveCode: "ros2-qos-intro-1",
};

export default function WhatIsQoS() {
  return (
    <div className="slide">
      <h2>What is Quality of Service (QoS)?</h2>

      <div className="slide-card">
        <div className="slide-card__title">Definition</div>
        <p>
          <b>Quality of Service (QoS)</b> is a set of policies that configure how data is transmitted
          between ROS 2 nodes. QoS allows you to fine-tune the behavior of your communication
          to match the requirements of your application.
        </p>
        <p>
          Unlike ROS 1, which had a one-size-fits-all approach, ROS 2 gives you precise control
          over reliability, durability, and timing of messages.
        </p>
      </div>

      <div className="slide-card slide-card--aside">
        <div>
          <div className="slide-card__title">Why QoS Matters</div>
          <ul>
            <li><b>Network Conditions:</b> Handle unreliable WiFi, lossy connections</li>
            <li><b>Performance:</b> Balance between reliability and speed</li>
            <li><b>Resource Management:</b> Control memory and bandwidth usage</li>
            <li><b>Real-time Constraints:</b> Meet timing requirements for safety-critical systems</li>
          </ul>
        </div>
        <div className="slide-callout slide-callout--info">
          <b>Key Insight:</b> Different types of data need different delivery guarantees.
          A camera feed might tolerate dropped frames, but safety commands must arrive reliably.
        </div>
      </div>

      <div className="slide-card">
        <div className="slide-card__title">ROS 2 vs ROS 1</div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
          <div>
            <b>ROS 1 (TCPROS)</b>
            <p style={{ opacity: 0.8, fontSize: "0.9em" }}>
              TCP-based, reliable but slow to detect failures.
              No control over behavior.
            </p>
          </div>
          <div>
            <b>ROS 2 (DDS)</b>
            <p style={{ opacity: 0.8, fontSize: "0.9em" }}>
              Built on DDS (Data Distribution Service). Full QoS control, configurable per topic.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
