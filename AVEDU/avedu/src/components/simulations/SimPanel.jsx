// src/components/simulations/SimPanel.jsx
import React from "react";

/**
 * Marco de una simulación en diapositiva: lienzo + panel de controles.
 *
 * Todo el aspecto sale de _slides.scss (.slide-card, .slide-columns,
 * .slide-figure, .slide-controls). Aquí no hay estilos en línea.
 *
 * @param {string} [title]    Título de la tarjeta.
 * @param {React.ReactNode} canvas   La visualización.
 * @param {React.ReactNode} controls Los mandos (sliders, botones…).
 * @param {string} [caption]  Texto bajo el lienzo.
 * @param {"side"|"stacked"} [layout] Controles al lado o debajo.
 */
export default function SimPanel({
  title,
  canvas,
  controls,
  caption,
  layout = "side",
  children,
}) {
  const isSide = layout === "side";

  const figure = (
    <div className="slide-figure">
      {canvas}
      {caption && <figcaption>{caption}</figcaption>}
    </div>
  );

  return (
    <div className="slide-card sim-panel">
      {title && <div className="slide-card__title">{title}</div>}

      {isSide ? (
        <div className="slide-columns">
          <div className="slide-controls">{controls}</div>
          {figure}
        </div>
      ) : (
        <>
          {figure}
          <div className="slide-controls slide-mt-md">{controls}</div>
        </>
      )}

      {children}
    </div>
  );
}
