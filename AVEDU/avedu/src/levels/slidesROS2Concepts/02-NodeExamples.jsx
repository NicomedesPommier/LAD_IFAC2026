// src/levels/slidesROS2Concepts/02-NodeExamples.jsx
import React from "react";

export const meta = {
  id: "node-examples",
  title: "Real-World Node Examples",
  order: 2,
  objectiveCode: "ros2-nodes-examples",
};

export default function NodeExamples() {
  const examples = [
    {
      name: "Camera Driver Node",
      purpose: "Reads images from a camera sensor",
      publishes: "/camera/image_raw (sensor_msgs/Image)",
      subscribes: "None (hardware interface)",
      example: "Captures video at 30 FPS and publishes to ROS network"
    },
    {
      name: "Object Detection Node",
      purpose: "Detects objects in camera images",
      publishes: "/detected_objects (vision_msgs/Detection2DArray)",
      subscribes: "/camera/image_raw (sensor_msgs/Image)",
      example: "Uses YOLO to detect cars, pedestrians, traffic signs"
    },
    {
      name: "Motion Planner Node",
      purpose: "Plans safe paths for the robot",
      publishes: "/planned_path (nav_msgs/Path)",
      subscribes: "/map, /current_pose, /detected_objects",
      example: "Plans route avoiding obstacles to reach goal"
    },
    {
      name: "Motor Controller Node",
      purpose: "Controls robot motors",
      publishes: "/wheel_odometry (nav_msgs/Odometry)",
      subscribes: "/cmd_vel (geometry_msgs/Twist)",
      example: "Converts velocity commands to motor signals"
    },
  ];

  const [selected, setSelected] = React.useState(0);

  return (
    <div className="slide">
      <h2>Real-World Node Examples</h2>

      <div className="slide-card">
        <div className="slide-card__title">Common ROS 2 Nodes in Autonomous Vehicles</div>
        <p>Here are typical nodes you might find in an autonomous vehicle system:</p>
      </div>

      <div className="slide-grid slide-grid--30-70">
        {/* Node selector */}
        <div className="slide-flex slide-flex--col slide-gap-sm">
          {examples.map((ex, idx) => (
            <button
              key={idx}
              className={selected === idx ? "btn btn--primary" : "btn"}
              onClick={() => setSelected(idx)}
            >
              {ex.name}
            </button>
          ))}
        </div>

        {/* Node details */}
        <div className="slide-card">
          <div className="slide-card__title">{examples[selected].name}</div>
          <div className="slide-gap-md">
            <div>
              <b>Purpose:</b>
              <p>{examples[selected].purpose}</p>
            </div>
            <div>
              <b>Publishes:</b>
              <code className="slide-text--sm">{examples[selected].publishes}</code>
            </div>
            <div>
              <b>Subscribes:</b>
              <code className="slide-text--sm">{examples[selected].subscribes}</code>
            </div>
            <div className="slide-callout slide-callout--info">
              <b>Example:</b> {examples[selected].example}
            </div>
          </div>
        </div>
      </div>

      <div className="slide-card slide-mt-lg">
        <div className="slide-card__title">Node Communication</div>
        <p>
          Notice how nodes form a <b>data pipeline</b>: Camera → Object Detection → Motion Planner → Motor Controller.
          Each node specializes in one task and passes data to the next node in the chain.
        </p>
      </div>
    </div>
  );
}

