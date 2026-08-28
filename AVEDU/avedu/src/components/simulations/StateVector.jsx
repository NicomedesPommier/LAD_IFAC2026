// src/components/simulations/StateVector.jsx
import React, { useEffect, useRef, useState } from "react";

/**
 * Vector de estado en vivo: muestra ẋ = f(x, u) con los MISMOS números que
 * están moviendo el coche, y resalta la fila que cambia.
 *
 * La idea es que el alumno vea que ψ̇ = (V/L)·tan(δ) no es una fórmula suelta
 * en la diapositiva, sino lo que produce el giro que está viendo.
 *
 * @param {Array} rows  [{ key, symbol, value, unit, equation, accent }]
 * @param {string} [title]
 * @param {string} [caption]
 */
export default function StateVector({ rows = [], title = "Vector de estado", caption }) {
  return (
    <div className="state-vector">
      {title && <div className="state-vector__title">{title}</div>}

      <div className="state-vector__rows">
        {rows.map((r) => (
          <StateRow key={r.key} {...r} />
        ))}
      </div>

      {caption && <p className="state-vector__caption">{caption}</p>}
    </div>
  );
}

/** Una fila; parpadea brevemente cuando su valor cambia de forma apreciable. */
function StateRow({ symbol, value, unit, equation, accent }) {
  const [pulse, setPulse] = useState(false);
  const prev = useRef(value);

  useEffect(() => {
    if (typeof value === "number" && Math.abs(value - prev.current) > 1e-3) {
      setPulse(true);
      const id = setTimeout(() => setPulse(false), 180);
      prev.current = value;
      return () => clearTimeout(id);
    }
    prev.current = value;
    return undefined;
  }, [value]);

  const shown = typeof value === "number" ? value.toFixed(3) : value;

  return (
    <div className={`state-vector__row ${pulse ? "is-changing" : ""} ${accent ? `is-${accent}` : ""}`}>
      <span className="state-vector__symbol">{symbol}</span>
      <span className="state-vector__value">{shown}</span>
      <span className="state-vector__unit">{unit}</span>
      {equation && <span className="state-vector__eq">{equation}</span>}
    </div>
  );
}
