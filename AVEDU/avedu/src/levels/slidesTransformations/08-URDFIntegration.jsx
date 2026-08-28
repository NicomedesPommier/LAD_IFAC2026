// src/levels/slidesTransformations/08-URDFIntegration.jsx
import React from "react";

export const meta = {
  id: "urdf-integration",
  title: "URDF and TF Integration",
  order: 8,
  objectiveCode: "tf-practical-1",
};

export default function URDFIntegration() {
  return (
    <div className="slide">
      <h2>URDF and TF Integration</h2>

      <div className="slide-card">
        <div className="slide-card__title">What is URDF?</div>
        <p>
          <b>Unified Robot Description Format (URDF)</b> is an XML format for describing robot geometry.
          It defines links (rigid bodies) and joints (connections) that form your robot's structure.
        </p>
        <p style={{ marginTop: "0.5rem", fontSize: "0.9em", opacity: 0.9 }}>
          The <code>robot_state_publisher</code> node reads your URDF and automatically publishes
          TF transforms for all joints and links!
        </p>
      </div>

      <div className="slide-card">
        <div className="slide-card__title">Simple URDF Example</div>
        <pre className="slide-code" style={{ fontSize: "0.75em" }}>{`<?xml version="1.0"?>
<robot name="my_robot">

  <!-- Base link (robot center) -->
  <link name="base_link">
    <visual>
      <geometry>
        <box size="0.6 0.4 0.2"/>
      </geometry>
    </visual>
  </link>

  <!-- Camera link -->
  <link name="camera_link">
    <visual>
      <geometry>
        <box size="0.05 0.05 0.05"/>
      </geometry>
    </visual>
  </link>

  <!-- Joint connecting base to camera -->
  <joint name="base_to_camera" type="fixed">
    <parent link="base_link"/>
    <child link="camera_link"/>
    <origin xyz="0.3 0.0 0.15" rpy="0 -0.174 0"/>
    <!-- xyz: 0.3m forward, 0.15m up -->
    <!-- rpy: tilted down 10 degrees (0.174 radians) -->
  </joint>

  <!-- LiDAR link -->
  <link name="lidar_link"/>

  <joint name="base_to_lidar" type="fixed">
    <parent link="base_link"/>
    <child link="lidar_link"/>
    <origin xyz="0.2 0.0 0.3" rpy="0 0 0"/>
  </joint>

</robot>`}</pre>
      </div>

      <div className="slide-card">
        <div className="slide-card__title">Launching robot_state_publisher</div>
        <pre className="slide-code" style={{ fontSize: "0.8em" }}>{`# launch file
from launch import LaunchDescription
from launch_ros.actions import Node
import os

def generate_launch_description():
    urdf_file = os.path.join(
        get_package_share_directory('my_robot_description'),
        'urdf', 'my_robot.urdf'
    )

    with open(urdf_file, 'r') as f:
        robot_description = f.read()

    return LaunchDescription([
        Node(
            package='robot_state_publisher',
            executable='robot_state_publisher',
            name='robot_state_publisher',
            output='screen',
            parameters=[{
                'robot_description': robot_description
            }]
        )
    ])`}</pre>
        <p style={{ fontSize: "0.85em", marginTop: "0.75rem", opacity: 0.9 }}>
          The robot_state_publisher will now automatically broadcast static transforms
          for all fixed joints in your URDF to the /tf_static topic.
        </p>
      </div>

      <div className="slide-callout slide-callout--info">
        <b>Best Practice:</b> Define all static sensor mounts in URDF, not in code.
        This makes your robot description portable and visualizable in RViz.
      </div>
    </div>
  );
}
