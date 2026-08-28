// src/levels/slidesROS2Advanced/03-QoSProfiles.jsx
import React from "react";

export const meta = {
  id: "qos-profiles",
  title: "Built-in QoS Profiles",
  order: 3,
  objectiveCode: "ros2-qos-intro-3",
};

export default function QoSProfiles() {
  return (
    <div className="slide">
      <h2>Built-in QoS Profiles</h2>

      <div className="slide-card">
        <div className="slide-card__title">Pre-configured Profiles</div>
        <p>
          ROS 2 provides several pre-configured QoS profiles for common use cases.
          These profiles combine multiple policies with sensible defaults.
        </p>
      </div>

      <div className="slide-card">
        <div className="slide-card__title">Common QoS Profiles</div>

        <div style={{ display: "grid", gap: "0.75rem", marginTop: "1rem" }}>
          <div style={{ background: "rgba(255,255,255,0.03)", padding: "0.75rem", borderRadius: "6px", borderLeft: "3px solid #7df9ff" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <b>Default</b>
              <code style={{ fontSize: "0.8em", opacity: 0.7 }}>QoSProfile.default</code>
            </div>
            <p style={{ margin: "0.5rem 0 0 0", fontSize: "0.9em", opacity: 0.9 }}>
              RELIABLE, VOLATILE, KEEP_LAST(10) - Good for most applications
            </p>
          </div>

          <div style={{ background: "rgba(255,255,255,0.03)", padding: "0.75rem", borderRadius: "6px", borderLeft: "3px solid #7df9ff" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <b>Sensor Data</b>
              <code style={{ fontSize: "0.8em", opacity: 0.7 }}>QoSProfile.sensor_data</code>
            </div>
            <p style={{ margin: "0.5rem 0 0 0", fontSize: "0.9em", opacity: 0.9 }}>
              BEST_EFFORT, VOLATILE, KEEP_LAST(5) - High-frequency sensor streams
            </p>
          </div>

          <div style={{ background: "rgba(255,255,255,0.03)", padding: "0.75rem", borderRadius: "6px", borderLeft: "3px solid #7df9ff" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <b>Parameters</b>
              <code style={{ fontSize: "0.8em", opacity: 0.7 }}>QoSProfile.parameters</code>
            </div>
            <p style={{ margin: "0.5rem 0 0 0", fontSize: "0.9em", opacity: 0.9 }}>
              RELIABLE, VOLATILE, KEEP_LAST(1000) - Parameter updates and configuration
            </p>
          </div>

          <div style={{ background: "rgba(255,255,255,0.03)", padding: "0.75rem", borderRadius: "6px", borderLeft: "3px solid #7df9ff" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <b>Services</b>
              <code style={{ fontSize: "0.8em", opacity: 0.7 }}>QoSProfile.services</code>
            </div>
            <p style={{ margin: "0.5rem 0 0 0", fontSize: "0.9em", opacity: 0.9 }}>
              RELIABLE, VOLATILE, KEEP_LAST(10) - ROS 2 service calls
            </p>
          </div>

          <div style={{ background: "rgba(255,255,255,0.03)", padding: "0.75rem", borderRadius: "6px", borderLeft: "3px solid #7df9ff" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <b>System Default</b>
              <code style={{ fontSize: "0.8em", opacity: 0.7 }}>QoSProfile.system_default</code>
            </div>
            <p style={{ margin: "0.5rem 0 0 0", fontSize: "0.9em", opacity: 0.9 }}>
              Uses middleware defaults - Varies by DDS implementation
            </p>
          </div>
        </div>
      </div>

      <div className="slide-card slide-card--aside">
        <div className="slide-callout slide-callout--info">
          <b>Pro Tip:</b> Start with a built-in profile and customize only what you need.
          This ensures compatibility and reduces configuration errors.
        </div>
      </div>
    </div>
  );
}
