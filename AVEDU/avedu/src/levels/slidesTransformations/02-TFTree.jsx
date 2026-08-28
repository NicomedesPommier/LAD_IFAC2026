// src/levels/slidesTransformations/02-TFTree.jsx
import React from "react";

export const meta = {
  id: "tf-tree",
  title: "The TF Tree",
  order: 2,
  objectiveCode: "tf-importance-2",
};

export default function TFTree() {
  return (
    <div className="slide">
      <h2>The TF Tree</h2>

      <div className="slide-card">
        <div className="slide-card__title">Tree Structure</div>
        <p>
          ROS 2 organizes coordinate frames in a <b>tree structure</b> called the TF tree.
          Each frame has exactly one parent, but can have multiple children.
        </p>
      </div>

      <div className="slide-card">
        <div className="slide-card__title">Example: Autonomous Vehicle TF Tree</div>
        <pre style={{
          background: "rgba(0,0,0,0.3)",
          padding: "1rem",
          borderRadius: "6px",
          fontSize: "0.85em",
          lineHeight: "1.6",
          fontFamily: "monospace"
        }}>{`map
 └─ odom
     └─ base_link (robot center)
         ├─ base_footprint (ground projection)
         ├─ imu_link (IMU sensor)
         ├─ gps_link (GPS antenna)
         ├─ camera_link
         │   └─ camera_optical_frame
         ├─ lidar_link
         └─ wheels
             ├─ front_left_wheel
             ├─ front_right_wheel
             ├─ rear_left_wheel
             └─ rear_right_wheel`}</pre>
      </div>

      <div className="slide-card">
        <div className="slide-card__title">Key Frame Conventions</div>
        <div style={{ display: "grid", gap: "0.75rem" }}>
          <div style={{ background: "rgba(255,255,255,0.03)", padding: "0.75rem", borderRadius: "6px" }}>
            <b style={{ color: "#7df9ff" }}>map</b>
            <p style={{ margin: "0.25rem 0 0 0", fontSize: "0.9em", opacity: 0.9 }}>
              Fixed world frame. Origin doesn't move. Used for global planning.
            </p>
          </div>

          <div style={{ background: "rgba(255,255,255,0.03)", padding: "0.75rem", borderRadius: "6px" }}>
            <b style={{ color: "#7df9ff" }}>odom</b>
            <p style={{ margin: "0.25rem 0 0 0", fontSize: "0.9em", opacity: 0.9 }}>
              Odometry frame. Continuous but drifts over time. Used for local planning.
            </p>
          </div>

          <div style={{ background: "rgba(255,255,255,0.03)", padding: "0.75rem", borderRadius: "6px" }}>
            <b style={{ color: "#7df9ff" }}>base_link</b>
            <p style={{ margin: "0.25rem 0 0 0", fontSize: "0.9em", opacity: 0.9 }}>
              Robot's center. All robot components are defined relative to this frame.
            </p>
          </div>

          <div style={{ background: "rgba(255,255,255,0.03)", padding: "0.75rem", borderRadius: "6px" }}>
            <b style={{ color: "#7df9ff" }}>sensor frames</b>
            <p style={{ margin: "0.25rem 0 0 0", fontSize: "0.9em", opacity: 0.9 }}>
              Each sensor (camera, LiDAR, IMU) has its own frame describing its mounting position.
            </p>
          </div>
        </div>
      </div>

      <div className="slide-callout slide-callout--warn">
        <b>Important Rule:</b> The TF tree must form a single connected tree with no loops or disconnected branches.
        Every frame must have a path to every other frame through the tree.
      </div>
    </div>
  );
}
