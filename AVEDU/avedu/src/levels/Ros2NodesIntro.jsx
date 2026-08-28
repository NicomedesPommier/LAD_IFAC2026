// src/levels/Ros2NodesIntro.jsx
import React, { Suspense, useCallback, useEffect, useMemo, useState } from "react";

// Import educational slides for this level
import WhatAreNodes from "./slidesROS2Concepts/01-WhatAreNodes";
import NodeExamples from "./slidesROS2Concepts/02-NodeExamples";
import CreatingPackageInteractive from "./slidesROS2Concepts/03-CreatingPackageInteractive-NEW";

const SLIDES = [
  {
    id: "what-are-nodes",
    title: "What are ROS 2 Nodes?",
    order: 1,
    objectiveCode: "ros2-nodes-what",
    Component: WhatAreNodes,
  },
  {
    id: "node-examples",
    title: "Real-World Node Examples",
    order: 2,
    objectiveCode: "ros2-nodes-examples",
    Component: NodeExamples,
  },
  {
    id: "creating-package-interactive",
    title: "Create Your First Package (Interactive)",
    order: 3,
    objectiveCode: "ros2-package-creating",
    Component: CreatingPackageInteractive,
  },
];

export default function Ros2NodesIntro({ onObjectiveHit, onLevelCompleted }) {
  const slides = useMemo(() => SLIDES, []);
  const total = slides.length;
  const [idx, setIdx] = useState(0);

  const go = useCallback(
    (delta) => setIdx((i) => Math.max(0, Math.min(total - 1, i + delta))),
    [total]
  );

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "ArrowRight") go(1);
      if (e.key === "ArrowLeft") go(-1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [go]);

  if (total === 0) {
    return <div>No slides available for this level.</div>;
  }

  const current = slides[idx];
  const CurrentComponent = current.Component;

  return (
    <div className="ros-slides" style={{ display: "grid", gap: "0.75rem" }}>
      {/* Top navigation bar */}
      <div style={{ display: "grid", gridTemplateColumns: "auto 1fr auto", alignItems: "center", gap: ".75rem" }}>
        <button className="btn" onClick={() => go(-1)} disabled={idx === 0} title="Previous">⟨</button>
        <div style={{ textAlign: "center", opacity: .9 }}>
          <b>{idx + 1}</b> / {total} — <span style={{ opacity: .8 }}>{current.title}</span>
        </div>
        <button className="btn" onClick={() => go(1)} disabled={idx === total - 1} title="Next">⟩</button>
      </div>

      {/* Progress dots */}
      <div style={{ display: "flex", gap: ".35rem", flexWrap: "wrap" }}>
        {slides.map((s, i) => (
          <button
            key={s.id}
            onClick={() => setIdx(i)}
            title={s.title}
            style={{
              width: 10, height: 10, borderRadius: 999,
              border: "1px solid var(--border, rgba(255,255,255,.25))",
              background: i === idx ? "var(--neon,#7df9ff)" : "var(--glass, rgba(255,255,255,.06))",
              boxShadow: i === idx ? "0 0 10px rgba(125,249,255,.4)" : "none",
              cursor: "pointer"
            }}
            aria-label={`Go to slide ${i + 1}: ${s.title}`}
          />
        ))}
      </div>

      {/* Current slide */}
      <Suspense fallback={<div className="placeholder">Loading slide…</div>}>
        <CurrentComponent
          meta={{ id: current.id, title: current.title, objectiveCode: current.objectiveCode, order: current.order }}
          onObjectiveHit={(code) => onObjectiveHit?.(code || current.objectiveCode)}
          onLevelCompleted={onLevelCompleted}
          goPrev={() => go(-1)}
          goNext={() => go(1)}
          isFirst={idx === 0}
          isLast={idx === total - 1}
        />
      </Suspense>

      {/* Bottom controls */}
      <div style={{ display: "flex", gap: ".5rem", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ display: "flex", gap: ".5rem" }}>
          <button className="btn" onClick={() => go(-1)} disabled={idx === 0}>Previous</button>
          <button className="btn" onClick={() => go(1)} disabled={idx === total - 1}>Next</button>
        </div>
        <button className="btn" onClick={() => onObjectiveHit?.(current.objectiveCode)} title="Mark this slide as completed">
          Mark Completed
        </button>
      </div>
    </div>
  );
}
