// src/levels/slidesROS2Concepts/01-WhatAreNodes.jsx
import React from "react";

export const meta = {
  id: "what-are-nodes",
  title: "What are ROS 2 Nodes?",
  order: 1,
  objectiveCode: "ros2-nodes-what",
};

export default function WhatAreNodes() {
  return (
    <div className="slide">
      <h2>What are ROS 2 Nodes?</h2>

      <div className="slide-card">
        <div className="slide-card__title">Definition</div>
        <p>
          A <b>Node</b> is the fundamental building block of a ROS 2 application.
          Each node is a separate process that performs a specific task.
        </p>
        <p>
          Think of nodes as individual programs that can communicate with each other
          to build a complete robotic system.
        </p>
      </div>

      <div className="slide-card slide-card--aside">
        <div>
          <div className="slide-card__title">Key Characteristics</div>
          <ul>
            <li><b>Independent:</b> Each node runs as its own process</li>
            <li><b>Specialized:</b> Nodes typically perform one specific function</li>
            <li><b>Communicative:</b> Nodes exchange data using topics, services, and actions</li>
            <li><b>Reusable:</b> Nodes can be combined in different ways</li>
          </ul>
        </div>
        <div className="slide-callout slide-callout--info slide-mt-md">
          <b>Example:</b> A robot might have separate nodes for camera processing,
          motor control, path planning, and sensor fusion.
        </div>
      </div>

      <div className="slide-card">
        <div className="slide-card__title">Why Use Nodes?</div>
        <div className="slide-grid slide-grid--2 slide-gap-md">
          <div>
            <b>Modularity</b>
            <p className="slide-text--sm slide-muted">Easy to develop, test, and debug individual components</p>
          </div>
          <div>
            <b>Fault Isolation</b>
            <p className="slide-text--sm slide-muted">If one node crashes, others can keep running</p>
          </div>
          <div>
            <b>Scalability</b>
            <p className="slide-text--sm slide-muted">Add or remove functionality by adding/removing nodes</p>
          </div>
          <div>
            <b>Reusability</b>
            <p className="slide-text--sm slide-muted">Use the same node in different robot systems</p>
          </div>
        </div>
      </div>
    </div>
  );
}

