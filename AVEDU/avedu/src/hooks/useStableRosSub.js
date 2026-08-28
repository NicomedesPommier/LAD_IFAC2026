import { useEffect, useRef } from "react";

/**
 * Suscripción estable a un tópico ROS.
 * Depende solo de primitivos (topic, type, throttle_rate, queue_size, queue_length).
 */
export function useStableRosSub({ connected, subscribeTopic, topic, type, onMessage, opts }) {
  const stopRef = useRef(null);
  const onMsgRef = useRef(onMessage);
  const subFnRef = useRef(subscribeTopic);

  // Mantener refs actualizadas (no disparan re-suscripciones)
  useEffect(() => { onMsgRef.current = onMessage; }, [onMessage]);
  useEffect(() => { subFnRef.current = subscribeTopic; }, [subscribeTopic]);

  // Extrae primitivos de opts (con defaults)
  const throttle_rate = opts?.throttle_rate ?? 50;
  const queue_size    = opts?.queue_size ?? 1;
  const queue_length  = opts?.queue_length;

  useEffect(() => {
    if (!connected || stopRef.current) return;

    stopRef.current = subFnRef.current(
      topic,
      type,
      (msg) => onMsgRef.current?.(msg),
      { throttle_rate, queue_size, queue_length }
    );

    return () => {
      try { stopRef.current?.(); } finally { stopRef.current = null; }
    };
    // ✅ Dependencias SOLO primitivas + claves estables
  }, [connected, topic, type, throttle_rate, queue_size, queue_length]);
}
