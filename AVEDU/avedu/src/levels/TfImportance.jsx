// src/levels/TfImportance.jsx
import React, { Suspense, useCallback, useEffect, useMemo, useState } from "react";

// Import slides for Importance of Transformations level
import WhatAreTF from "./slidesTransformations/01-WhatAreTF";
import TFTree from "./slidesTransformations/02-TFTree";
import TF2Library from "./slidesTransformations/03-TF2Library";
import TF2Example from "./slidesTransformations/04-TF2Example";

const SLIDES = [
  {
    id: "what-are-tf",
    title: "What are Transformations?",
    order: 1,
    objectiveCode: "tf-importance-1",
    Component: WhatAreTF,
  },
  {
    id: "tf-tree",
    title: "The TF Tree",
    order: 2,
    objectiveCode: "tf-importance-2",
    Component: TFTree,
  },
  {
    id: "tf2-library",
    title: "TF2 Library in ROS 2",
    order: 3,
    objectiveCode: "tf-importance-3",
    Component: TF2Library,
  },
  {
    id: "tf2-example",
    title: "TF2 Interactive Example",
    order: 4,
    objectiveCode: "tf-importance-4",
    Component: TF2Example,
  },
];

export default function TfImportance({ onObjectiveHit, onLevelCompleted }) {
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
