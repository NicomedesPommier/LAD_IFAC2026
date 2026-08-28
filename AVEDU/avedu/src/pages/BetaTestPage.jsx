// =============================================================
// FILE: src/pages/BetaTestPage.jsx
// Beta-test mission board: a guided 1–2 h tour of the RosFlow IDE.
// Students complete sequential missions; each gives an explanation, runs an
// in-IDE walkthrough, and awards points. See config/betaMissions.js.
// =============================================================
import React, { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import ThemeToggle from "../components/ThemeToggle";
import { useBetaProgress } from "../hooks/useBetaProgress";
import { getMission } from "../config/betaMissions";
import { useProgress } from "../context/ProgressContext";
import "../styles/pages/_betatest.scss";

function formatDuration(ms) {
  if (!ms || ms < 0) return "—";
  const s = Math.round(ms / 1000);
  if (s < 60) return `${s}s`;
  const m = Math.floor(s / 60);
  const rem = s % 60;
  return `${m}m ${rem}s`;
}

// The active workspace id (set by the IDE) — used for best-effort verification.
function getActiveCanvasId() {
  try {
    const cached = JSON.parse(localStorage.getItem("ide_workspace_cache") || "null");
    return cached?.canvas?.id || null;
  } catch {
    return null;
  }
}

export default function BetaTestPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const progressCtx = useProgress(); // may be null if not under ProgressProvider
  const {
    missions,
    allDone,
    earnedPoints,
    totalPoints,
    completedCount,
    totalMissions,
    elapsedMs,
    startMission,
    completeMission,
    resetBeta,
  } = useBetaProgress();

  const [modalMission, setModalMission] = useState(null);
  const processedReturn = useRef(false);

  // ── Detect return from a completed mission walkthrough ─────────────────────
  useEffect(() => {
    const beta = location.state?.beta;
    if (!beta || beta.status !== "complete" || processedReturn.current) return;
    processedReturn.current = true;

    (async () => {
      const mission = getMission(beta.missionId);
      let verified = false;
      try {
        verified = mission?.verify ? await mission.verify({ canvasId: getActiveCanvasId() }) : false;
      } catch {
        verified = false;
      }
      completeMission(beta.missionId, { verified });
      progressCtx?.triggerConfetti?.();
      // Clear router state so a refresh doesn't re-process this completion.
      navigate("/betatest", { replace: true, state: {} });
      processedReturn.current = false;
    })();
  }, [location.state, completeMission, navigate, progressCtx]);

  const launchMission = useCallback(
    (mission) => {
      setModalMission(null);
      startMission(mission);
      navigate(mission.route, {
        state: {
          tutorialType: mission.tutorialType,
          beta: {
            missionId: mission.id,
            returnTo: "/betatest",
            ...(mission.startView ? { startView: mission.startView } : {}),
          },
        },
      });
    },
    [navigate, startMission]
  );

  const pct = totalMissions ? Math.round((completedCount / totalMissions) * 100) : 0;

  return (
    <div className="screen beta">
      <div className="overlay overlay--scan" />
      <div className="overlay overlay--vignette" />
      <div className="stars" aria-hidden />
      <div className="stars stars--2" aria-hidden />

      <div style={{ position: "absolute", top: "1rem", right: "1rem", zIndex: 100 }}>
        <ThemeToggle />
      </div>
      <button className="beta__home" onClick={() => navigate("/")}>← HOME</button>

      <main className="content beta__content">
        <h1 className="title">
          <span>L.A.D</span>
          <small>BETA TEST · learn the RosFlow blocks</small>
        </h1>

        {/* Progress HUD */}
        <div className="beta__hud">
          <div className="beta__hud-stat">
            <span className="beta__hud-num">{completedCount}/{totalMissions}</span>
            <span className="beta__hud-label">missions</span>
          </div>
          <div className="beta__progressbar" title={`${pct}% complete`}>
            <div className="beta__progressbar-fill" style={{ width: `${pct}%` }} />
          </div>
          <div className="beta__hud-stat">
            <span className="beta__hud-num">{earnedPoints}<small>/{totalPoints}</small></span>
            <span className="beta__hud-label">points</span>
          </div>
          <div className="beta__hud-stat">
            <span className="beta__hud-num">{formatDuration(elapsedMs)}</span>
            <span className="beta__hud-label">time</span>
          </div>
        </div>

        {allDone && (
          <div className="beta__results">
            🎉 <strong>Beta complete!</strong> You earned {earnedPoints} points in {formatDuration(elapsedMs)}.
            Thanks for testing L.A.D.
          </div>
        )}

        {/* Mission list */}
        <ol className="beta__missions">
          {missions.map((m) => {
            const actionable = m.status === "available" || m.status === "active";
            return (
              <li
                key={m.id}
                className={`beta-card beta-card--${m.status}`}
                onClick={actionable ? () => setModalMission(m) : undefined}
                role={actionable ? "button" : undefined}
                tabIndex={actionable ? 0 : undefined}
                onKeyDown={
                  actionable
                    ? (e) => (e.key === "Enter" || e.key === " ") && setModalMission(m)
                    : undefined
                }
              >
                <span className="beta-card__icon">{m.icon}</span>
                <span className="beta-card__index">{m.n}</span>
                <div className="beta-card__body">
                  <div className="beta-card__title">{m.title}</div>
                  <div className="beta-card__blurb">{m.blurb}</div>
                </div>
                <div className="beta-card__right">
                  <span className="beta-card__points">+{m.points}</span>
                  {m.status === "done" && (
                    <span className="beta-card__state beta-card__state--done">
                      ✓ {formatDuration(m.result?.durationMs)}
                    </span>
                  )}
                  {actionable && <span className="beta-card__state beta-card__state--go">▶ Start</span>}
                  {m.status === "locked" && <span className="beta-card__state">🔒 Locked</span>}
                  {m.status === "soon" && <span className="beta-card__state">Coming soon</span>}
                </div>
              </li>
            );
          })}
        </ol>

        <button className="beta__reset" onClick={() => window.confirm("Reset all beta progress?") && resetBeta()}>
          Reset beta progress
        </button>
      </main>

      {/* Explanation modal */}
      {modalMission && (
        <div className="beta-modal" onClick={() => setModalMission(null)}>
          <div className="beta-modal__panel" onClick={(e) => e.stopPropagation()}>
            <button className="beta-modal__close" onClick={() => setModalMission(null)}>×</button>
            <div className="beta-modal__icon">{modalMission.icon}</div>
            <h2 className="beta-modal__title">
              Mission {modalMission.n}: {modalMission.title}
            </h2>
            <h3 className="beta-modal__heading">{modalMission.explanation.heading}</h3>
            <ul className="beta-modal__body">
              {modalMission.explanation.body.map((line, i) => (
                <li key={i}>{line}</li>
              ))}
            </ul>
            <div className="beta-modal__footer">
              <span className="beta-modal__points">Reward: +{modalMission.points} pts</span>
              <button className="start" onClick={() => launchMission(modalMission)}>
                Start mission →
              </button>
            </div>
          </div>
        </div>
      )}

      <footer className="footer">© {new Date().getFullYear()} Nicomedes Pommier</footer>
    </div>
  );
}
