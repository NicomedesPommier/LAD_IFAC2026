// src/levels/slidesTransformations/06-RobotLocalization.jsx
import React from "react";

export const meta = {
  id: "robot-localization",
  title: "Robot Localization with TF",
  order: 6,
  objectiveCode: "tf-robot-navigation-1",
};

export default function RobotLocalization() {
  return (
    <div className="slide">
      <h2>Robot Localization with TF</h2>

      <div className="slide-card">
        <div className="slide-card__title">The map → odom → base_link Chain</div>
        <p>
          For navigation, we need three key frames connected in a chain:
        </p>
        <pre style={{
          background: "rgba(0,0,0,0.3)",
          padding: "1rem",
          borderRadius: "6px",
          fontSize: "0.9em",
          marginTop: "0.75rem"
        }}>{`map → odom → base_link`}</pre>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "1rem" }}>
        <div className="slide-card">
          <div className="slide-card__title" style={{ color: "#7df9ff", fontSize: "0.9em" }}>map → odom</div>
          <p style={{ fontSize: "0.85em", opacity: 0.9 }}>
            Published by <b>localization</b> nodes (AMCL, SLAM).
            Corrects for odometry drift using map landmarks.
            Updates slowly (1-10 Hz).
          </p>
        </div>

        <div className="slide-card">
          <div className="slide-card__title" style={{ color: "#7df9ff", fontSize: "0.9em" }}>odom → base_link</div>
          <p style={{ fontSize: "0.85em", opacity: 0.9 }}>
            Published by <b>odometry</b> nodes (wheel encoders, visual odometry).
            Smooth but drifts over time.
            Updates quickly (20-100 Hz).
          </p>
        </div>

        <div className="slide-card">
          <div className="slide-card__title" style={{ color: "#7df9ff", fontSize: "0.9em" }}>map → base_link</div>
          <p style={{ fontSize: "0.85em", opacity: 0.9 }}>
            Computed by TF (combining the chain).
            Gives robot's global position.
            Use this for path planning!
          </p>
        </div>
      </div>

      <div className="slide-card">
        <div className="slide-card__title">Publishing Odometry</div>
        <pre className="slide-code" style={{ fontSize: "0.75em" }}>{`from nav_msgs.msg import Odometry
from geometry_msgs.msg import TransformStamped
from tf2_ros import TransformBroadcaster

class OdometryPublisher(Node):
    def __init__(self):
        super().__init__('odometry_publisher')
        self.odom_pub = self.create_publisher(Odometry, '/odom', 10)
        self.tf_broadcaster = TransformBroadcaster(self)

        self.x = 0.0
        self.y = 0.0
        self.theta = 0.0

        self.timer = self.create_timer(0.05, self.publish_odometry)  # 20 Hz

    def publish_odometry(self):
        current_time = self.get_clock().now()

        # Create and publish TF transform
        t = TransformStamped()
        t.header.stamp = current_time.to_msg()
        t.header.frame_id = 'odom'
        t.child_frame_id = 'base_link'

        t.transform.translation.x = self.x
        t.transform.translation.y = self.y
        t.transform.translation.z = 0.0

        # Convert theta to quaternion
        q = quaternion_from_euler(0, 0, self.theta)
        t.transform.rotation.x = q[0]
        t.transform.rotation.y = q[1]
        t.transform.rotation.z = q[2]
        t.transform.rotation.w = q[3]

        self.tf_broadcaster.sendTransform(t)

        # Also publish Odometry message
        odom = Odometry()
        odom.header.stamp = current_time.to_msg()
        odom.header.frame_id = 'odom'
        odom.child_frame_id = 'base_link'
        odom.pose.pose.position.x = self.x
        odom.pose.pose.position.y = self.y
        odom.pose.pose.orientation = t.transform.rotation

        self.odom_pub.publish(odom)`}</pre>
      </div>

      <div className="slide-callout slide-callout--info">
        <b>Best Practice:</b> Always publish both TF and Odometry messages together.
        TF for transforms, Odometry for velocity and covariance information.
      </div>
    </div>
  );
}
