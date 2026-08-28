// src/components/minigames/useMiniGameProgress.js
import { useCallback, useMemo, useRef, useState } from "react";

/**
 * Progreso de un mini juego basado en "pasos" identificados por clave.
 *
 * Centraliza el patrón que hoy se repite dentro de cada juego: un Set de
 * completados + comprobar si ya están todos + avisar una sola vez con
 * onObjectiveHit.
 *
 * @param {object}   options
 * @param {number|string[]} options.steps  Número de pasos, o lista de claves.
 * @param {Function} [options.onObjectiveHit] Se llama UNA vez al completar todo.
 * @param {string}   [options.objectiveCode]  Código enviado a onObjectiveHit.
 */
export default function useMiniGameProgress({ steps, onObjectiveHit, objectiveCode } = {}) {
  const keys = useMemo(
    () => (Array.isArray(steps) ? steps : Array.from({ length: steps || 0 }, (_, i) => i)),
    [steps]
  );
  const total = keys.length;

  const [completed, setCompleted] = useState(() => new Set());
  // Evita disparar el objetivo más de una vez aunque el usuario reintente.
  const firedRef = useRef(false);

  const isComplete = useCallback((key) => completed.has(key), [completed]);

  const complete = useCallback(
    (key) => {
      setCompleted((prev) => {
        if (prev.has(key)) return prev; // sin cambios -> sin re-render extra
        const next = new Set(prev);
        next.add(key);

        if (!firedRef.current && total > 0 && next.size >= total) {
          firedRef.current = true;
          onObjectiveHit?.(objectiveCode);
        }
        return next;
      });
    },
    [onObjectiveHit, objectiveCode, total]
  );

  const reset = useCallback(() => {
    firedRef.current = false;
    setCompleted(new Set());
  }, []);

  return {
    completed,
    count: completed.size,
    total,
    done: total > 0 && completed.size >= total,
    isComplete,
    complete,
    reset,
  };
}
