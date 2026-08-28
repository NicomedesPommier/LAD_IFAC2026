// src/components/simulations/SimCanvas.jsx
import React, { useEffect, useRef } from "react";

/**
 * Lienzo 2D para las simulaciones de las diapositivas.
 *
 * Centraliza lo que hoy se repite en cada slide: crear el ref, pedir el
 * contexto, limpiar el fondo y volver a dibujar cuando cambian los parámetros.
 *
 * El slide solo aporta `draw(ctx, { width, height })`.
 *
 * El aspecto (borde, radio, fondo) lo pone `.slide-canvas` de _slides.scss;
 * aquí no se escriben colores a mano.
 *
 * @param {Function} draw   (ctx, size) => void. Se llama con el fondo ya limpio.
 * @param {Array}    deps   Dependencias que fuerzan un redibujado.
 * @param {number}   [width]  Ancho interno del lienzo.
 * @param {number}   [height] Alto interno del lienzo.
 */
export default function SimCanvas({
  draw,
  deps = [],
  width = 700,
  height = 500,
  className = "",
}) {
  const canvasRef = useRef(null);
  // Guardamos draw en un ref para no obligar a memoizarla en cada slide.
  const drawRef = useRef(draw);
  drawRef.current = draw;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // El fondo real lo pinta .slide-canvas; limpiamos el bitmap para que no
    // queden restos del frame anterior.
    ctx.clearRect(0, 0, width, height);

    drawRef.current?.(ctx, { width, height });
    // Las dependencias reales las decide quien usa el componente.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [width, height, ...deps]);

  return (
    <div className={`slide-canvas ${className}`.trim()}>
      <canvas ref={canvasRef} width={width} height={height} />
    </div>
  );
}
