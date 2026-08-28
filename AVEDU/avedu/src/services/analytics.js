// =============================================================
// FILE: src/services/analytics.js
// Lightweight, forward-compatible analytics client.
//
// Emits events to the backend analytics endpoint (Part B of the beta/metrics
// plan). The endpoint may not exist yet — every call FAILS SILENTLY so the app
// is never affected. Once /api/analytics/events/ ships, these events start
// landing with no frontend changes.
// =============================================================
import { API_BASE } from "../config";

const ENDPOINT = `${API_BASE}/analytics/events/`;
const HEARTBEAT_ENDPOINT = `${API_BASE}/analytics/heartbeat/`;

// Per-tab session id (survives reloads within the tab, not across tabs).
function getSessionId() {
  try {
    let sid = sessionStorage.getItem("lad_session_id");
    if (!sid) {
      sid = `s_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
      sessionStorage.setItem("lad_session_id", sid);
    }
    return sid;
  } catch {
    return "s_unknown";
  }
}

/**
 * Record an analytics event. Never throws.
 * @param {string} event_type  e.g. "beta_mission_start"
 * @param {object} props       { target?, duration_ms?, value?, metadata? }
 */
export function track(event_type, props = {}) {
  try {
    const token = localStorage.getItem("token");
    const body = JSON.stringify({
      events: [
        {
          event_type,
          ts: new Date().toISOString(),
          session_id: getSessionId(),
          ...props,
        },
      ],
    });

    fetch(ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(token && { Authorization: `Bearer ${token}` }),
      },
      body,
      keepalive: true, // allow delivery during page unload
    }).catch(() => {});
  } catch {
    /* analytics must never break the app */
  }
}

// ── Presence heartbeat ───────────────────────────────────────────────────────
// Periodically pings the backend so "online now" reflects active users. Only
// fires while a token exists; fails silently like track().
let _hbTimer = null;

export function startHeartbeat(intervalMs = 45000) {
  stopHeartbeat();
  const beat = () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return;
      fetch(HEARTBEAT_ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          path: (typeof window !== "undefined" && window.location?.pathname) || "",
          session_id: getSessionId(),
        }),
        keepalive: true,
      }).catch(() => {});
    } catch {
      /* analytics must never break the app */
    }
  };
  beat(); // immediate first beat
  _hbTimer = setInterval(beat, intervalMs);
}

export function stopHeartbeat() {
  if (_hbTimer) {
    clearInterval(_hbTimer);
    _hbTimer = null;
  }
}

const analytics = { track, getSessionId, startHeartbeat, stopHeartbeat };
export { getSessionId };
export default analytics;
