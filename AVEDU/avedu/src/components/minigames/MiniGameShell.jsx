// src/components/minigames/MiniGameShell.jsx
import React from "react";

/**
 * Marco común de todos los mini juegos: título, descripción, barra de progreso
 * y el bloque de "completado".
 *
 * Cada mini juego solo aporta su contenido; el encabezado, el progreso y el
 * mensaje de éxito dejan de reescribirse en cada archivo.
 *
 * El bloque final usa `.slide-callout--success`, que sí existe en
 * _slides.scss (antes se usaba `.slide-card--success`, que no existe).
 *
 * @param {string}  title       Título del mini juego.
 * @param {string}  [description] Texto introductorio opcional.
 * @param {number}  [current]   Pasos completados (para la barra de progreso).
 * @param {number}  [total]     Pasos totales. Sin él no se muestra progreso.
 * @param {string}  [unitLabel] Nombre de lo que se cuenta, p.ej. "comandos".
 * @param {boolean} [done]      Fuerza el estado completado.
 * @param {string}  [doneTitle] Título del bloque de éxito.
 * @param {string}  [doneText]  Texto del bloque de éxito.
 * @param {React.ReactNode} children Contenido propio del juego.
 */
export default function MiniGameShell({
  title,
  description,
  current = 0,
  total = 0,
  unitLabel = "pasos",
  done,
  doneTitle = "🎉 ¡Completado!",
  doneText = "Has terminado este mini juego.",
  children,
}) {
  const hasProgress = total > 0;
  const isDone = done ?? (hasProgress && current >= total);
  const pct = hasProgress ? Math.min(100, Math.round((current / total) * 100)) : 0;

  return (
    <div className="slide minigame">
      {title && <h2>{title}</h2>}

      {(description || hasProgress) && (
        <div className="slide-card">
          {description && <p>{description}</p>}

          {hasProgress && (
            <>
              <p className="slide-text--sm slide-muted slide-mt-sm">
                Progreso: {current} / {total} {unitLabel}
              </p>
              <div
                className="minigame__progress"
                role="progressbar"
                aria-valuenow={current}
                aria-valuemin={0}
                aria-valuemax={total}
                aria-label={`Progreso: ${current} de ${total} ${unitLabel}`}
              >
                <div className="minigame__progress-bar" style={{ width: `${pct}%` }} />
              </div>
            </>
          )}
        </div>
      )}

      {children}

      {isDone && (
        <div className="slide-callout slide-callout--success slide-mt-md">
          <b>{doneTitle}</b>
          <span>{doneText}</span>
        </div>
      )}
    </div>
  );
}
