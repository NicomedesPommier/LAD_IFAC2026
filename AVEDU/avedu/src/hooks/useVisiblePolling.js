import { useEffect, useRef } from "react";

/**
 * Run `callback` immediately, then every `intervalMs` ms — but ONLY while the
 * document is visible. The interval is torn down when the tab becomes hidden and
 * restarted (with an immediate call) when it becomes visible again, so a
 * left-open background tab never keeps polling a backend or re-rendering an
 * offscreen widget.
 *
 * `callback` is read through a ref, so passing a fresh function each render does
 * not restart the interval; only a change to `intervalMs` does.
 */
export function useVisiblePolling(callback, intervalMs) {
  const savedCallback = useRef(callback);
  savedCallback.current = callback;

  useEffect(() => {
    let timer = null;
    const tick = () => savedCallback.current?.();
    const start = () => { if (!timer) timer = setInterval(tick, intervalMs); };
    const stop = () => { if (timer) { clearInterval(timer); timer = null; } };
    const onVisibility = () => {
      if (document.visibilityState === "visible") { tick(); start(); }
      else stop();
    };

    if (typeof document === "undefined" || document.visibilityState === "visible") {
      tick();
      start();
    }
    document.addEventListener?.("visibilitychange", onVisibility);
    return () => {
      stop();
      document.removeEventListener?.("visibilitychange", onVisibility);
    };
  }, [intervalMs]);
}
