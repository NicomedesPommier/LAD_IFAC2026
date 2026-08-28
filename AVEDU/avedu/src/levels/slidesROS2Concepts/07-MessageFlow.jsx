// src/levels/slidesROS2Concepts/07-MessageFlow.jsx
import React from "react";

export const meta = {
  id: "message-flow",
  title: "Understanding Message Flow",
  order: 7,
  objectiveCode: "ros2-subs-message-flow",
};

export default function MessageFlow({ onObjectiveHit }) {
  const scenarios = [
    {
      title: "1:1 Communication",
      description: "One publisher, one subscriber",
      useCase: "Robot controller sending commands to motor driver"
    },
    {
      title: "1:Many (Broadcast)",
      description: "One publisher, multiple subscribers",
      useCase: "Camera publishing images to multiple vision processing nodes"
    },
    {
      title: "Many:1 (Aggregation)",
      description: "Multiple publishers, one subscriber",
      useCase: "Multiple sensors publishing to a single sensor fusion node"
    },
    {
      title: "Many:Many (Network)",
      description: "Multiple publishers and subscribers",
      useCase: "Complete autonomous vehicle with many interconnected nodes"
    }
  ];

  return (
    <div className="slide">
      <h2>Understanding Message Flow</h2>

      <div className="slide-card">
        <div className="slide-card__title">Communication Patterns</div>
        <p>
          ROS 2 topics support flexible communication patterns between nodes.
          The same topic can have multiple publishers and/or multiple subscribers.
        </p>
      </div>

      <div className="slide-grid slide-grid--2">
        {scenarios.map((scenario, idx) => (
          <div key={idx} className="slide-card slide-p-lg">
            <div className="slide-card__title">{scenario.title}</div>
            <p className="slide-text--sm slide-mt-sm">{scenario.description}</p>
            <div className="slide-callout slide-callout--info slide-mt-md">
              <b>Use Case:</b> {scenario.useCase}
            </div>
          </div>
        ))}
      </div>

      <div className="slide-card">
        <div className="slide-card__title">Message Flow Properties</div>
        <div className="slide-grid slide-grid--2 slide-gap-lg">
          <div>
            <b className="slide-dot--neon">Asynchronous</b>
            <p>
              Publishers don't wait for subscribers. They send messages and continue immediately.
            </p>
          </div>
          <div>
            <b className="slide-dot--neon">Decoupled</b>
            <p>
              Publishers and subscribers don't need to know about each other.
              They only need to agree on the topic name and message type.
            </p>
          </div>
          <div>
            <b className="slide-dot--neon">Best-Effort by Default</b>
            <p>
              Messages are sent once. If a subscriber misses it, it's gone.
              (Can be changed with QoS settings)
            </p>
          </div>
          <div>
            <b className="slide-dot--neon">Type-Safe</b>
            <p>
              The message type is enforced. A String publisher can only connect
              to String subscribers.
            </p>
          </div>
        </div>
      </div>

      <div className="slide-card">
        <div className="slide-flex slide-flex--between">
          <div className="slide-card__title">Practical Example</div>
          <button className="btn" onClick={() => onObjectiveHit?.(meta.objectiveCode)}>
            Complete Lesson
          </button>
        </div>
        <p>
          <b>Scenario:</b> An autonomous car has a camera node publishing to <code>/camera/image</code>.
          Three nodes subscribe to this topic:
        </p>
        <ul>
          <li><b>Lane Detection Node:</b> Detects lane markings</li>
          <li><b>Object Detection Node:</b> Identifies cars, pedestrians, signs</li>
          <li><b>Logger Node:</b> Records images for later analysis</li>
        </ul>
        <p>
          All three subscribers receive the same image data simultaneously, but each processes
          it differently. The camera node doesn't need to know who's listening!
        </p>
      </div>
    </div>
  );
}

