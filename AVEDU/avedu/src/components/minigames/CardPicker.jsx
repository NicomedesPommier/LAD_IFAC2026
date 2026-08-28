// src/components/minigames/CardPicker.jsx
import React, { useState } from "react";

/**
 * Lista de opciones a la izquierda + detalle de la seleccionada a la derecha.
 *
 * Es el layout "explora y marca como aprendido" que usan varios mini juegos.
 * El contenido del detalle lo decide quien lo use, vía renderDetail.
 *
 * Los botones van dentro de `.slide-actions` porque en _slides.scss la regla
 * `.btn` está anidada ahí.
 *
 * @param {Array}    items        Elementos a mostrar.
 * @param {Function} getKey       item -> clave estable.
 * @param {Function} getLabel     item -> texto del botón de la lista.
 * @param {Function} renderDetail (item, index) -> contenido del panel derecho.
 * @param {Function} [isComplete] item -> boolean, para marcar con ✓.
 * @param {Function} [onComplete] Se llama con la clave al pulsar el botón.
 * @param {string}   [completeLabel] Texto del botón de completar.
 */
export default function CardPicker({
  items = [],
  getKey = (_, i) => i,
  getLabel = (item) => String(item),
  renderDetail,
  isComplete,
  onComplete,
  completeLabel = "Marcar como aprendido",
}) {
  const [selected, setSelected] = useState(0);

  if (items.length === 0) return null;

  // Si la lista encoge, evitamos quedarnos con un índice fuera de rango.
  const safeIndex = Math.min(selected, items.length - 1);
  const current = items[safeIndex];
  const currentKey = getKey(current, safeIndex);
  const currentDone = isComplete?.(currentKey);

  return (
    <div className="slide-grid slide-grid--30-70 slide-gap-md">
      <div className="slide-actions card-picker__list">
        {items.map((item, idx) => {
          const key = getKey(item, idx);
          const done = isComplete?.(key);
          return (
            <button
              key={key}
              type="button"
              className={`btn btn--sm card-picker__option ${safeIndex === idx ? "is-selected" : ""} ${done ? "is-complete" : ""}`}
              onClick={() => setSelected(idx)}
              aria-current={safeIndex === idx}
            >
              {done && <span aria-hidden="true">✓ </span>}
              {getLabel(item, idx)}
            </button>
          );
        })}
      </div>

      <div className="slide-card">
        {renderDetail?.(current, safeIndex)}

        {onComplete && !currentDone && (
          <div className="slide-actions slide-mt-md">
            <button type="button" className="btn is-success" onClick={() => onComplete(currentKey)}>
              {completeLabel}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
