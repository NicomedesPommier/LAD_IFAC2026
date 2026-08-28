// src/components/simulations/SimControls.jsx
import React from "react";

/**
 * Botones de reproducción de una simulación (Play/Pausa y Reiniciar).
 *
 * Van dentro de `.slide-actions` porque en _slides.scss la regla `.btn` está
 * anidada ahí: un `.btn` suelto se queda sin estilo.
 *
 * @param {boolean}  playing
 * @param {Function} onTogglePlay
 * @param {Function} [onReset]
 * @param {string}   [tip] Aviso que se muestra solo mientras está en marcha.
 */
export default function SimControls({ playing, onTogglePlay, onReset, tip }) {
  return (
    <>
      <div className="slide-actions slide-mt-sm">
        <button
          type="button"
          onClick={onTogglePlay}
          className={`btn btn--sm ${playing ? "btn--pause" : "btn--play"}`}
        >
          {playing ? "⏸ Pausa" : "▶ Reproducir"}
        </button>

        {onReset && (
          <button type="button" onClick={onReset} className="btn btn--sm btn--reset">
            ↺ Reiniciar
          </button>
        )}
      </div>

      {playing && tip && (
        <div className="slide-tip slide-mt-sm">
          <strong>Consejo:</strong> {tip}
        </div>
      )}
    </>
  );
}
