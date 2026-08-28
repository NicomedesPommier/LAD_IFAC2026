// src/levels/rosbasic/RosBasic.jsx
import React, { Suspense, useCallback, useEffect, useMemo, useState } from "react";

/** =========================================
 *  Auto-import de slides con Webpack (CRA)
 *  ========================================= */
const slidesContext = require.context("./slidesROSBasic", true, /\.jsx$/);

/** Orden por prefijo: "01-Intro.jsx" -> 1 */
function parseOrderFromPath(path) {
  const file = path.split("/").pop() || "";
  const m = file.match(/^(\d+)[-_ ]/); // 01-, 02_, 03 (espacio), etc.
  return m ? Number(m[1]) : Number.POSITIVE_INFINITY;
}

function buildSlides() {
  const keys = slidesContext.keys(); // p.ej. ["./01-Intro.jsx", "./topic/03-Topics.jsx", ...]
  const entries = keys.map((k) => {
    const mod = slidesContext(k);
    const Comp = mod.default;
    if (!Comp) {
      console.warn("[RosBasic] Slide sin default export:", k);
      return null;
    }
    const meta = mod.meta || {};
    const order = meta.order ?? parseOrderFromPath(k);
    const file = (k.split("/").pop() || "").replace(/\.jsx$/, "");
    const id = meta.id || file;
    const title = meta.title || id;
    const objectiveCode = meta.objectiveCode || `ros-slide-${id.toLowerCase()}`;

    return { path: k, order, id, title, objectiveCode, Comp };
  });

  return entries
    .filter(Boolean)
    .sort((a, b) => a.order - b.order || a.id.localeCompare(b.id));
}

export default function RosBasic({ onObjectiveHit, onLevelCompleted }) {
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
    return <div>No se encontraron slides en <code>src/levels/rosbasic/slides</code>.</div>;
  }

  const current = slides[idx];

  return (
    <div className="ros-slides" style={{ display: "grid", gap: "0.75rem" }}>
      {/* Barra superior */}
      <div style={{ display: "grid", gridTemplateColumns: "auto 1fr auto", alignItems: "center", gap: ".75rem" }}>
        <button className="btn" onClick={() => go(-1)} disabled={idx === 0} title="Anterior">⟨</button>
        <div style={{ textAlign: "center", opacity: .9 }}>
          <b>{idx + 1}</b> / {total} — <span style={{ opacity: .8 }}>{current.title}</span>
        </div>
        <button className="btn" onClick={() => go(1)} disabled={idx === total - 1} title="Siguiente">⟩</button>
      </div>

      {/* Dots */}
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
            aria-label={`Ir al slide ${i + 1}: ${s.title}`}
          />
        ))}
      </div>

      {/* Slide actual */}
      <Suspense fallback={<div className="placeholder">Cargando slide…</div>}>
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

      {/* Controles inferiores */}
      <div style={{ display: "flex", gap: ".5rem", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ display: "flex", gap: ".5rem" }}>
          <button className="btn" onClick={() => go(-1)} disabled={idx === 0}>Anterior</button>
          <button className="btn" onClick={() => go(1)} disabled={idx === total - 1}>Siguiente</button>
        </div>
        <button className="btn" onClick={() => onObjectiveHit?.(current.objectiveCode)} title="Marcar este slide como logrado">
          Marcar logrado
        </button>
      </div>
    </div>
  );
}
