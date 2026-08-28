// src/components/simulations/useAnimationLoop.js
import { useEffect, useRef } from "react";

/**
 * Bucle de animación con requestAnimationFrame y delta de tiempo.
 *
 * Reemplaza el patrón que cada slide reimplementaba: guardar el id del frame,
 * calcular el dt a mano y acordarse de cancelar en la limpieza.
 *
 * `onFrame(dt, elapsed)` recibe segundos, no milisegundos.
 *
 * @param {Function} onFrame Se llama en cada frame mientras running sea true.
 * @param {boolean}  running Arranca/para el bucle.
 * @param {number}   [maxDt] Tope del delta, en segundos, para que un cambio de
 *                           pestaña no produzca un salto enorme.
 */
export default function useAnimationLoop(onFrame, running, { maxDt = 0.1 } = {}) {
  // Ref para que cambiar la función no reinicie el bucle.
  const onFrameRef = useRef(onFrame);
  onFrameRef.current = onFrame;

  const frameRef = useRef(null);

  useEffect(() => {
    if (!running) return undefined;

    let last = performance.now();
    let elapsed = 0;

    const tick = (now) => {
      const dt = Math.min((now - last) / 1000, maxDt);
      last = now;
      elapsed += dt;

      onFrameRef.current?.(dt, elapsed);
      frameRef.current = requestAnimationFrame(tick);
    };

    frameRef.current = requestAnimationFrame(tick);

    return () => {
      if (frameRef.current) cancelAnimationFrame(frameRef.current);
      frameRef.current = null;
    };
  }, [running, maxDt]);
}
