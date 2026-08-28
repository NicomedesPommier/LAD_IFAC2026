// =============================================================
// FILE: src/hooks/useBetaProgress.js
// localStorage-backed state machine for the beta walkthrough.
// Sequential unlock: mission N becomes available only when N-1 is done.
// Every start/complete also emits an analytics event (timing + funnel).
//
// Progress is keyed PER USER (lad_beta_progress_v1::<username>) so two accounts
// on the same browser don't share a progress bar. It reloads when the logged-in
// user changes. (Server-side per-user timing lives in analytics events.)
// =============================================================
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { BETA_MISSIONS, BETA_TOTAL_POINTS } from "../config/betaMissions";
import { track } from "../services/analytics";
import { useAuth } from "../context/AuthContext";

const STORAGE_BASE = "lad_beta_progress_v1";

function keyFor(username) {
  return `${STORAGE_BASE}::${username || "anon"}`;
}

const emptyState = {
  completed: {},        // { [missionId]: { points, durationMs, at, verified } }
  earnedPoints: 0,
  firstStartedAt: null, // ISO — when the very first mission started
  activeMissionId: null,
  activeStartedAt: null,
};

function load(key) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? { ...emptyState, ...JSON.parse(raw) } : { ...emptyState };
  } catch {
    return { ...emptyState };
  }
}

function save(key, state) {
  try {
    localStorage.setItem(key, JSON.stringify(state));
  } catch {
    /* ignore quota errors */
  }
}

export function useBetaProgress() {
  const auth = useAuth();
  const username = auth?.user?.username || "anon";
  const storageKey = keyFor(username);

  const [state, setState] = useState(() => load(storageKey));

  // When the logged-in user changes, swap to that user's saved progress.
  const prevKey = useRef(storageKey);
  useEffect(() => {
    if (storageKey !== prevKey.current) {
      prevKey.current = storageKey;
      setState(load(storageKey));
    }
  }, [storageKey]);

  const update = useCallback((next) => {
    setState((prev) => {
      const merged = typeof next === "function" ? next(prev) : next;
      save(keyFor(username), merged);
      return merged;
    });
  }, [username]);

  // Derive a view-model: each mission with a computed status.
  const missions = useMemo(() => {
    let prevDone = true; // first mission has no prerequisite
    return BETA_MISSIONS.map((m) => {
      const done = Boolean(state.completed[m.id]);
      const isActive = state.activeMissionId === m.id && !done;
      let status;
      if (done) status = "done";
      else if (m.available === false) status = "soon";
      else if (isActive) status = "active";
      else if (prevDone) status = "available";
      else status = "locked";
      prevDone = done;
      return { ...m, status, result: state.completed[m.id] || null };
    });
  }, [state]);

  const currentMission = useMemo(
    () => missions.find((m) => m.status === "available" || m.status === "active") || null,
    [missions]
  );

  const allDone = useMemo(
    () => missions.filter((m) => m.available !== false).every((m) => m.status === "done"),
    [missions]
  );

  const startMission = useCallback(
    (mission) => {
      update((prev) => ({
        ...prev,
        firstStartedAt: prev.firstStartedAt || new Date().toISOString(),
        activeMissionId: mission.id,
        activeStartedAt: new Date().toISOString(),
      }));
      track("beta_mission_start", { target: mission.id, metadata: { title: mission.title } });
    },
    [update]
  );

  const completeMission = useCallback(
    (missionId, { verified = false } = {}) => {
      const mission = BETA_MISSIONS.find((m) => m.id === missionId);
      if (!mission) return;

      update((prev) => {
        if (prev.completed[missionId]) return prev; // idempotent — never double-award
        const startedAt = prev.activeMissionId === missionId ? prev.activeStartedAt : null;
        const durationMs = startedAt ? Date.now() - new Date(startedAt).getTime() : null;

        track("beta_mission_complete", {
          target: missionId,
          duration_ms: durationMs,
          value: mission.points,
          metadata: { verified, title: mission.title },
        });

        return {
          ...prev,
          completed: {
            ...prev.completed,
            [missionId]: { points: mission.points, durationMs, at: new Date().toISOString(), verified },
          },
          earnedPoints: prev.earnedPoints + mission.points,
          activeMissionId: null,
          activeStartedAt: null,
        };
      });
    },
    [update]
  );

  const resetBeta = useCallback(() => {
    update({ ...emptyState });
    track("beta_reset", {});
  }, [update]);

  const completedCount = Object.keys(state.completed).length;
  const totalMissions = BETA_MISSIONS.filter((m) => m.available !== false).length;
  const elapsedMs = useMemo(() => {
    return Object.values(state.completed).reduce((s, r) => s + (r.durationMs || 0), 0);
  }, [state.completed]);

  return {
    missions,
    currentMission,
    allDone,
    earnedPoints: state.earnedPoints,
    totalPoints: BETA_TOTAL_POINTS,
    completedCount,
    totalMissions,
    elapsedMs,
    startMission,
    completeMission,
    resetBeta,
  };
}

export default useBetaProgress;
