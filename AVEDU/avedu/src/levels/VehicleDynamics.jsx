// src/levels/VehicleDynamics.jsx
import React, { Suspense, useCallback, useEffect, useMemo, useState } from "react";

/** =========================================
 *  Auto-import of slides with Webpack (CRA)
 *  ========================================= */
const slidesContext = require.context("./slidesVehicleDynamics", true, /\.jsx$/);

/** Order by prefix: "01-Intro.jsx" -> 1 */
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
      console.warn("[VehicleDynamics] Slide without default export:", k);
      return null;
    }
    const meta = mod.meta || {};
    const order = meta.order ?? parseOrderFromPath(k);
    const file = (k.split("/").pop() || "").replace(/\.jsx$/, "");
    const id = meta.id || file;
    const title = meta.title || id;
    const objectiveCode = meta.objectiveCode || `vd-slide-${id.toLowerCase()}`;

    return { path: k, order, id, title, objectiveCode, Comp };
  });

  return entries
    .filter(Boolean)
    .sort((a, b) => a.order - b.order || a.id.localeCompare(b.id));
}

export default function VehicleDynamics({ onObjectiveHit, onLevelCompleted }) {
  const slides = useMemo(buildSlides, []);
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
    return (
      <div>No slides found in <code>src/levels/slidesVehicleDynamics</code>.</div>
    );
  }

  const current = slides[idx];

  return (
    <div className="vehicle-dynamics-slides" style={{ display: "grid", gap: "0.75rem" }}>
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
              onClick={() => onLevelCompleted?.()}
              title="Complete the entire Vehicle Dynamics level"
              style={{
                padding: ".5rem 1rem",
                background: "linear-gradient(135deg, #7df9ff22, #ff5cf422)",
                border: "2px solid #7df9ff"
              }}
            >
              Complete Level
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
