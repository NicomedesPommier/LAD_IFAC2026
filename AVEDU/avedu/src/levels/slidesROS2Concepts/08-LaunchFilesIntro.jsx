// src/levels/slidesROS2Concepts/08-LaunchFilesIntro.jsx
import React from "react";

export const meta = {
  id: "launch-files-intro",
  title: "What Are Launch Files?",
  order: 8,
  objectiveCode: "ros2-launch-what",
};

const CODE_LAUNCH_FILE = `from launch import LaunchDescription
from launch_ros.actions import Node

def generate_launch_description():
    return LaunchDescription([
        Node(
            package='my_robot_pkg',
            executable='publisher_node',
            name='my_publisher',
        ),
        Node(
            package='my_robot_pkg',
            executable='subscriber_node',
            name='my_subscriber',
        ),
    ])`;

const CODE_SETUP_PY = `import os
from glob import glob
from setuptools import setup

package_name = 'my_robot_pkg'

setup(
    ...
    data_files=[
        ('share/ament_index/resource_index/packages',
            ['resource/' + package_name]),
        ('share/' + package_name, ['package.xml']),
        # This line copies every *.launch.py into the install folder
        (os.path.join('share', package_name, 'launch'),
            glob('launch/*.launch.py')),
    ],
    ...
)`;

const CODE_PACKAGE_XML = `<!-- Add inside package.xml -->
<exec_depend>launch_ros</exec_depend>`;

export default function LaunchFilesIntro({ onObjectiveHit }) {
  return (
    <div className="slide">
      <h2>What Are Launch Files?</h2>

      <div className="slide-card">
        <div className="slide-card__title">The Problem With Many Nodes</div>
        <p>
          A real robot runs <b>many nodes at once</b> — a publisher, a subscriber, a sensor driver,
          a planner… Starting each one manually with <code>ros2 run</code> in a separate terminal
          quickly becomes unmanageable.
        </p>
        <div className="slide-callout slide-callout--info slide-mt-md">
          <b>Launch files solve this:</b> a single Python file that starts every node your
          system needs, with all their parameters configured, in one command.
        </div>
      </div>

      <div className="slide-grid slide-grid--2">
        <div className="slide-card slide-p-lg">
          <div className="slide-card__title">Without a launch file</div>
          <pre style={{ fontSize: "0.75rem", lineHeight: 1.6, margin: 0 }}>
{`# Terminal 1
ros2 run my_robot_pkg publisher_node

# Terminal 2
ros2 run my_robot_pkg subscriber_node

# Terminal 3
ros2 run my_robot_pkg sensor_driver

# Terminal 4 ...`}
          </pre>
        </div>
        <div className="slide-card slide-p-lg">
          <div className="slide-card__title">With a launch file</div>
          <pre style={{ fontSize: "0.75rem", lineHeight: 1.6, margin: 0 }}>
{`# One terminal, one command
ros2 launch my_robot_pkg \
  my_robot.launch.py`}
          </pre>
          <div className="slide-callout slide-callout--success slide-mt-md" style={{ fontSize: "0.8rem" }}>
            All nodes start together automatically!
          </div>
        </div>
      </div>

      <div className="slide-card">
        <div className="slide-card__title">Anatomy of a Python Launch File</div>
        <p>
          Launch files live in a <code>launch/</code> folder inside your package and must end in
          <code>.launch.py</code>. They export one function: <code>generate_launch_description()</code>.
        </p>
        <pre style={{
          background: "#0a0e18", border: "1px solid #1c2e3e", borderRadius: 6,
          padding: "0.85rem 1rem", fontSize: "0.75rem", lineHeight: 1.7,
          color: "#c9d1d9", overflowX: "auto", marginTop: "0.75rem"
        }}>
          {CODE_LAUNCH_FILE}
        </pre>
        <div className="slide-grid slide-grid--3 slide-mt-md" style={{ gap: "0.6rem" }}>
          {[
            { label: "package", desc: "Name of the ROS 2 package (same as setup.py)" },
            { label: "executable", desc: "Entry point from console_scripts in setup.py" },
            { label: "name", desc: "Optional override for the node's runtime name" },
          ].map(({ label, desc }) => (
            <div key={label} style={{ background: "rgba(0,229,255,0.05)", border: "1px solid rgba(0,229,255,0.15)", borderRadius: 4, padding: "0.5rem 0.65rem" }}>
              <code style={{ color: "#7df9ff", fontSize: "0.78rem" }}>{label}</code>
              <p style={{ fontSize: "0.72rem", margin: "0.25rem 0 0", color: "#aaa" }}>{desc}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="slide-card">
        <div className="slide-card__title">Two Files You Must Update</div>
        <p>
          After creating a launch file you need to tell ROS 2's build system (<code>colcon</code>)
          to install it. Two edits are required:
        </p>

        <div className="slide-grid slide-grid--2 slide-mt-md" style={{ gap: "0.75rem" }}>
          <div>
            <b style={{ color: "#7df9ff", fontSize: "0.8rem" }}>1 — setup.py</b>
            <p style={{ fontSize: "0.75rem", color: "#aaa", marginTop: "0.35rem" }}>
              Add a <code>data_files</code> entry that copies every <code>*.launch.py</code> into
              the install directory when you run <code>colcon build</code>.
            </p>
            <pre style={{
              background: "#0a0e18", border: "1px solid #1c2e3e", borderRadius: 6,
              padding: "0.7rem 0.9rem", fontSize: "0.7rem", lineHeight: 1.65,
              color: "#c9d1d9", overflowX: "auto", marginTop: "0.5rem"
            }}>
              {CODE_SETUP_PY}
            </pre>
          </div>
          <div>
            <b style={{ color: "#7df9ff", fontSize: "0.8rem" }}>2 — package.xml</b>
            <p style={{ fontSize: "0.75rem", color: "#aaa", marginTop: "0.35rem" }}>
              Declare <code>launch_ros</code> as an execution dependency so ROS 2 knows your
              package needs it at runtime.
            </p>
            <pre style={{
              background: "#0a0e18", border: "1px solid #1c2e3e", borderRadius: 6,
              padding: "0.7rem 0.9rem", fontSize: "0.7rem", lineHeight: 1.65,
              color: "#c9d1d9", overflowX: "auto", marginTop: "0.5rem"
            }}>
              {CODE_PACKAGE_XML}
            </pre>
            <div className="slide-callout slide-callout--warning slide-mt-md" style={{ fontSize: "0.75rem" }}>
              Without this, <code>ros2 launch</code> will fail with a missing import error.
            </div>
          </div>
        </div>
      </div>

      <div className="slide-card">
        <div className="slide-card__title">Folder Structure</div>
        <pre style={{
          background: "#0a0e18", border: "1px solid #1c2e3e", borderRadius: 6,
          padding: "0.85rem 1rem", fontSize: "0.75rem", lineHeight: 1.8,
          color: "#c9d1d9", overflowX: "auto"
        }}>
{`src/
└── my_robot_pkg/
    ├── launch/                        ← new folder you create
    │   └── my_robot.launch.py         ← your launch file
    ├── my_robot_pkg/
    │   ├── __init__.py
    │   ├── publisher_node.py
    │   └── subscriber_node.py
    ├── package.xml                    ← add exec_depend here
    ├── setup.cfg
    └── setup.py                       ← add data_files here`}
        </pre>

        <div className="slide-flex slide-flex--between slide-mt-md">
          <div className="slide-callout slide-callout--info" style={{ flex: 1, fontSize: "0.78rem" }}>
            The <code>launch/</code> folder sits next to your package's Python directory
            (not inside it). <code>colcon build</code> finds it via the <code>data_files</code>
            glob and installs it automatically.
          </div>
          <button
            className="btn"
            style={{ marginLeft: "1rem", alignSelf: "flex-end" }}
            onClick={() => onObjectiveHit?.(meta.objectiveCode)}
          >
            Got it — Next
          </button>
        </div>
      </div>
    </div>
  );
}
