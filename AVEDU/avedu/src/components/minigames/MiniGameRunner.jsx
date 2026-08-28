// src/components/minigames/MiniGameRunner.jsx
import React, { Suspense, useCallback, useEffect, useState } from "react";

/**
 * Navegador genérico de mini juegos y simulaciones (flechas, puntos, botones).
 *
 * Es la lógica que antes se copiaba entera en cada archivo de nivel. Ahora el
 * orquestador solo declara su lista de pantallas.
 *
 * El aspecto sale de _slides.scss: `.slide-progress`/`.slide-progress__dot`
 * para los puntos y `.slide-actions .btn` para los botones.
 *
 * Cada entrada de `games`:
 *   { id, title, objectiveCode, order?, Component }
 */
export default function MiniGameRunner({ games = [], onObjectiveHit, onLevelCompleted }) {
  const total = games.length;
  const [idx, setIdx] = useState(0);

  const go = useCallback(
    (delta) => setIdx((i) => Math.max(0, Math.min(total - 1, i + delta))),
    [total]
  );

  useEffect(() => {
    const onKey = (e) => {
      // No robamos las flechas mientras se escribe en un campo.
      const tag = e.target?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || e.target?.isContentEditable) return;
      if (e.key === "ArrowRight") go(1);
      if (e.key === "ArrowLeft") go(-1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [go]);

  if (total === 0) {
    return <div className="slide-muted">No hay contenido disponible en este nivel.</div>;
  }

  const safeIndex = Math.min(idx, total - 1);
  const current = games[safeIndex];
  const CurrentComponent = current.Component;

  return (
    <div className="slide-wrap minigame-runner">
      {/* Barra superior: anterior · título · siguiente */}
      <div className="slide-flex slide-flex--between slide-flex--center">
        <div className="slide-actions">
          <button
            type="button"
            className="btn btn--sm"
            onClick={() => go(-1)}
            disabled={safeIndex === 0}
            title="Anterior"
          >
            ⟨
          </button>
        </div>

        <div className="slide-muted slide-text--center">
          <b>{safeIndex + 1}</b> / {total} — {current.title}
        </div>

        <div className="slide-actions">
          <button
            type="button"
            className="btn btn--sm"
            onClick={() => go(1)}
            disabled={safeIndex === total - 1}
            title="Siguiente"
          >
            ⟩
          </button>
        </div>
      </div>

      {/* Puntos de progreso */}
      <div className="slide-progress">
        {games.map((g, i) => (
          <button
            key={g.id}
            type="button"
            onClick={() => setIdx(i)}
            title={g.title}
            className={`slide-progress__dot ${i === safeIndex ? "is-active" : ""}`}
            aria-label={`Ir a ${i + 1}: ${g.title}`}
            aria-current={i === safeIndex}
          />
        ))}
      </div>

      {/* Pantalla actual */}
      <Suspense fallback={<div className="slide-muted">Cargando…</div>}>
        <CurrentComponent
          meta={{
            id: current.id,
            title: current.title,
            objectiveCode: current.objectiveCode,
            order: current.order,
          }}
          onObjectiveHit={(code) => onObjectiveHit?.(code || current.objectiveCode)}
          onLevelCompleted={onLevelCompleted}
          goPrev={() => go(-1)}
          goNext={() => go(1)}
          isFirst={safeIndex === 0}
          isLast={safeIndex === total - 1}
        />
      </Suspense>

      {/* Controles inferiores */}
      <div className="slide-flex slide-flex--between slide-flex--wrap">
        <div className="slide-actions">
          <button type="button" className="btn" onClick={() => go(-1)} disabled={safeIndex === 0}>
            Anterior
          </button>
          <button type="button" className="btn" onClick={() => go(1)} disabled={safeIndex === total - 1}>
            Siguiente
          </button>
        </div>

        <div className="slide-actions">
          <button
            type="button"
            className="btn"
            onClick={() => onObjectiveHit?.(current.objectiveCode)}
            title="Marcar como completado"
          >
            Marcar completado
          </button>
        </div>
      </div>
    </div>
  );
}
