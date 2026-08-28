/**
 * useRosBridge.js — ROSLIB.Ros connection lifecycle with auto-reconnect.
 *
 * Usage:
 *   // Wrap your page outside <Canvas> so HTML overlays and Three.js
 *   // components share a single WebSocket connection.
 *
 *   <RosBridgeProvider>
 *     <Canvas>
 *       <MyScene />   ← can call useRos() here
 *     </Canvas>
 *     <DebugOverlay /> ← can also call useRos() here
 *   </RosBridgeProvider>
 *
 * The Provider is intentionally placed OUTSIDE <Canvas> so that context
 * propagates into the R3F renderer (R3F v8+ inherits outer React context).
 */

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import ROSLIB from 'roslib';
import { getRosbridgeUrl } from '../ip';

// ── Context ────────────────────────────────────────────────────────────────────

export const RosBridgeContext = createContext(null);

// ── Hook ───────────────────────────────────────────────────────────────────────

/**
 * useRosBridge()
 *
 * Manages a single ROSLIB.Ros connection.  Reconnects automatically after
 * a 3-second back-off when the socket closes.
 *
 * @returns {{
 *   ros:       React.MutableRefObject<ROSLIB.Ros | null>,
 *   connected: boolean,
 *   error:     Error | null,
 * }}
 */
export function useRosBridge() {
  const rosRef            = useRef(null);
  const reconnectTimerRef = useRef(null);
  const mountedRef        = useRef(true);

  const [connected, setConnected] = useState(false);
  const [error,     setError    ] = useState(null);

  const connect = useCallback(() => {
    if (!mountedRef.current) return;

    // Tear down any existing instance
    clearTimeout(reconnectTimerRef.current);
    if (rosRef.current) {
      try { rosRef.current.close(); } catch {}
    }

    const url = getRosbridgeUrl();
    const ros = new ROSLIB.Ros();
    rosRef.current = ros;

    ros.on('connection', () => {
      if (!mountedRef.current) return;
      setConnected(true);
      setError(null);
    });

    ros.on('close', () => {
      if (!mountedRef.current) return;
      setConnected(false);
      // Back-off reconnect: 3 s
      reconnectTimerRef.current = setTimeout(connect, 3000);
    });

    ros.on('error', (e) => {
      if (!mountedRef.current) return;
      const err = e instanceof Error ? e : new Error(String(e?.message ?? e));
      setError(err);
      setConnected(false);
    });

    try {
      ros.connect(url);
    } catch (e) {
      if (mountedRef.current) {
        setError(e instanceof Error ? e : new Error(String(e)));
      }
    }
  }, []); // stable — never recreated

  useEffect(() => {
    mountedRef.current = true;
    connect();
    return () => {
      mountedRef.current = false;
      clearTimeout(reconnectTimerRef.current);
      if (rosRef.current) {
        try { rosRef.current.close(); } catch {}
        rosRef.current = null;
      }
    };
  }, [connect]);

  return useMemo(
    () => ({ ros: rosRef, connected, error }),
    [connected, error]
  );
}

// ── Provider ───────────────────────────────────────────────────────────────────

/**
 * RosBridgeProvider
 *
 * Place this outside <Canvas> so both Three.js components (via useFrame) and
 * plain React components (overlays, panels) share one WebSocket connection.
 */
export function RosBridgeProvider({ children }) {
  const bridge = useRosBridge();
  return (
    <RosBridgeContext.Provider value={bridge}>
      {children}
    </RosBridgeContext.Provider>
  );
}

// ── Consumer hook ──────────────────────────────────────────────────────────────

/**
 * useRos()
 *
 * Returns the shared ROS connection context.
 * Must be called inside a <RosBridgeProvider>.
 *
 * @returns {{ ros: React.MutableRefObject<ROSLIB.Ros|null>, connected: boolean, error: Error|null }}
 */
export function useRos() {
  const ctx = useContext(RosBridgeContext);
  if (!ctx) throw new Error('useRos must be called inside <RosBridgeProvider>');
  return ctx;
}
