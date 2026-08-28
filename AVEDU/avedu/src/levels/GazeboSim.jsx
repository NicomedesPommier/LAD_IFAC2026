// src/levels/GazeboSim.jsx
import React, { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import GazeboSimulator from "../components/gazebo/GazeboSimulator";
import ClientSideGazeboSimulator from "../components/gazebo/ClientSideGazeboSimulator";
import RVizSimulator from "../components/gazebo/RVizSimulator";

/** =========================================
 *  Auto-import of intro slides
 *  ========================================= */
const slidesContext = require.context("./slidesGazeboIntro", true, /\.jsx$/);

function parseOrderFromPath(path) {
  const file = path.split("/").pop() || "";
  const m = file.match(/^(\d+)[-_ ]/);
  return m ? Number(m[1]) : Number.POSITIVE_INFINITY;
}

function buildSlides() {
  const keys = slidesContext.keys();
  const entries = keys.map((k) => {
    const mod = slidesContext(k);
    const Comp = mod.default;
    if (!Comp) {
      console.warn("[GazeboSim] Slide without default export:", k);
      return null;
    }
    const meta = mod.meta || {};
    const order = meta.order ?? parseOrderFromPath(k);
    const file = (k.split("/").pop() || "").replace(/\.jsx$/, "");
    const id = meta.id || file;
    const title = meta.title || id;
    const objectiveCode = meta.objectiveCode || `gazebo-slide-${id.toLowerCase()}`;

    return { path: k, order, id, title, objectiveCode, Comp };
  });

  return entries
    .filter(Boolean)
    .sort((a, b) => a.order - b.order || a.id.localeCompare(b.id));
}

export default function GazeboSim({ onObjectiveHit, onLevelCompleted }) {
  const slides = useMemo(buildSlides, []);
  const total = slides.length;
  const [idx, setIdx] = useState(0);
  const [showSimulator, setShowSimulator] = useState(false);
  const [simulatorMode, setSimulatorMode] = useState('rviz'); // 'rviz', 'client-side', or 'streaming'

  const go = useCallback(
    (delta) => setIdx((i) => Math.max(0, Math.min(total - 1, i + delta))),
    [total]
  );

  useEffect(() => {
    const onKey = (e) => {
      // Only handle navigation if simulator is not shown
      if (!showSimulator) {
        if (e.key === "ArrowRight") go(1);
        if (e.key === "ArrowLeft") go(-1);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [go, showSimulator]);

  if (total === 0) {
    return (
      <div>No intro slides found in <code>src/levels/slidesGazeboIntro</code>.</div>
    );
  }

  const current = slides[idx];

  // If user wants to start simulation
  if (showSimulator) {
    return (
      <div style={{ display: "grid", gap: "0.75rem" }}>
        <div style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: ".75rem",
          background: "var(--glass)",
          border: "1px solid var(--border)",
          borderRadius: "12px"
        }}>
          <h2 style={{ margin: 0, fontSize: "1.2rem" }}>
            Gazebo Vehicle Simulation
            <span style={{
              fontSize: ".8rem",
              marginLeft: ".75rem",
              opacity: 0.7,
              fontWeight: "normal"
            }}>
              ({simulatorMode === 'rviz' ? "RViz Mode" : simulatorMode === 'client-side' ? "Client-Side 3D" : "ROS Streaming"})
            </span>
          </h2>
          <div style={{ display: "flex", gap: ".5rem", alignItems: "center" }}>
            <button
              className="btn"
              onClick={() => setSimulatorMode(prev =>
                prev === 'rviz' ? 'client-side' : prev === 'client-side' ? 'streaming' : 'rviz'
              )}
              style={{ padding: ".5rem 1rem", fontSize: ".85rem" }}
              title="Cycle between RViz, Client-Side 3D, and ROS Streaming modes"
            >
              {simulatorMode === 'rviz' ? "🔄 → 3D Mode" : simulatorMode === 'client-side' ? "🔄 → Streaming" : "🔄 → RViz"}
            </button>
            <button
              className="btn"
              onClick={() => setShowSimulator(false)}
              style={{ padding: ".5rem 1rem" }}
            >
              ← Back to Slides
            </button>
          </div>
        </div>

        {simulatorMode === 'rviz' ? (
          <RVizSimulator
            onObjectiveHit={onObjectiveHit}
            onLevelCompleted={onLevelCompleted}
          />
        ) : simulatorMode === 'client-side' ? (
          <ClientSideGazeboSimulator
            onObjectiveHit={onObjectiveHit}
            onLevelCompleted={onLevelCompleted}
          />
        ) : (
          <GazeboSimulator
            onObjectiveHit={onObjectiveHit}
            onLevelCompleted={onLevelCompleted}
          />
        )}
      </div>
    );
  }

  // Show intro slides
  return (
    <div className="gazebo-sim-slides" style={{ display: "grid", gap: "0.75rem" }}>
      {/* Top bar */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "auto 1fr auto",
        alignItems: "center",
        gap: ".75rem",
        padding: ".5rem",
        background: "var(--glass)",
        border: "1px solid var(--border)",
        borderRadius: "12px"
      }}>
        <button
          className="btn"
          onClick={() => go(-1)}
          disabled={idx === 0}
          title="Previous"
          style={{ padding: ".5rem .75rem" }}
        >
          ⟨
        </button>
        <div style={{ textAlign: "center", opacity: .9 }}>
          <b>{idx + 1}</b> / {total} — <span style={{ opacity: .8 }}>{current.title}</span>
        </div>
        <button
          className="btn"
          onClick={() => go(1)}
          disabled={idx === total - 1}
          title="Next"
          style={{ padding: ".5rem .75rem" }}
        >
          ⟩
        </button>
      </div>

      {/* Progress dots */}
      <div style={{ display: "flex", gap: ".35rem", flexWrap: "wrap", justifyContent: "center" }}>
        {slides.map((s, i) => (
          <button
            key={s.id}
            onClick={() => setIdx(i)}
            title={s.title}
            style={{
              width: 10,
              height: 10,
              borderRadius: 999,
              border: "1px solid var(--border, rgba(255,255,255,.25))",
              background: i === idx ? "var(--neon,#7df9ff)" : "var(--glass, rgba(255,255,255,.06))",
              boxShadow: i === idx ? "0 0 10px rgba(125,249,255,.4)" : "none",
              cursor: "pointer",
              transition: "all 0.2s ease"
            }}
            aria-label={`Go to slide ${i + 1}: ${s.title}`}
          />
        ))}
      </div>

      {/* Current slide */}
      <Suspense fallback={<div className="placeholder">Loading slide…</div>}>
        <current.Comp
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
      <div style={{
        display: "flex",
        gap: ".5rem",
        justifyContent: "space-between",
        alignItems: "center",
        padding: ".5rem",
        background: "var(--glass)",
        border: "1px solid var(--border)",
        borderRadius: "12px"
      }}>
        <div style={{ display: "flex", gap: ".5rem" }}>
          <button
            className="btn"
            onClick={() => go(-1)}
            disabled={idx === 0}
            style={{ padding: ".5rem 1rem" }}
          >
            Previous
          </button>
          <button
            className="btn"
            onClick={() => go(1)}
            disabled={idx === total - 1}
            style={{ padding: ".5rem 1rem" }}
          >
            Next
          </button>
        </div>

        <div style={{ display: "flex", gap: ".5rem" }}>
          <button
            className="btn"
            onClick={() => onObjectiveHit?.(current.objectiveCode)}
            title="Mark this slide as completed"
            style={{ padding: ".5rem 1rem" }}
          >
            Mark Completed
          </button>
          {idx === total - 1 && (
            <button
              className="btn"
              onClick={() => setShowSimulator(true)}
              title="Start the Gazebo simulation"
              style={{
                padding: ".5rem 1.5rem",
                background: "linear-gradient(135deg, #7df9ff22, #ff5cf422)",
                border: "2px solid #7df9ff",
                fontWeight: "bold"
              }}
            >
              Launch Simulation →
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
