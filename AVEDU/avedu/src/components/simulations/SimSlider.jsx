// src/components/simulations/SimSlider.jsx
import React from "react";

/**
 * Deslizador con etiqueta y valor, tal y como se usa en las diapositivas.
 *
 * Sustituye al bloque .slide-slider que hoy está copiado ~25 veces.
 *
 *   <SimSlider label="Steering" value={delta} onChange={setDelta}
 *              min={-30} max={30} step={1} unit="°" />
 */
export default function SimSlider({
  label,
  value,
  onChange,
  min = 0,
  max = 100,
  step = 1,
  unit = "",
  decimals,
  disabled = false,
}) {
  // Si no se indica, deducimos los decimales del paso (0.1 -> 1, 1 -> 0).
  const digits =
    decimals ?? (String(step).includes(".") ? String(step).split(".")[1].length : 0);

  const shown = typeof value === "number" ? value.toFixed(digits) : value;

  return (
    <div className="slide-slider">
      <span className="slide-slider__label">
        {label}: <span className="slide-slider__value">{shown}{unit}</span>
      </span>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(Number(e.target.value))}
        className="slide-slider__input"
        aria-label={label}
      />
    </div>
  );
}
