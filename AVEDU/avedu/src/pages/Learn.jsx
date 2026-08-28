// =============================================================
// FILE: src/pages/Learn.jsx  (optimizado)
// =============================================================
import React, { useEffect, useMemo, useState, useCallback, useRef } from "react";
import { Outlet, NavLink, useParams } from "react-router-dom";
import { apiFetch } from "../context/AuthContext";
import { useProgress } from "../context/ProgressContext";
import { API_BASE } from "../config";
import ThemeToggle from "../components/ThemeToggle";
import InteractiveTutorial from "../components/InteractiveTutorial";
import { tutorialSteps } from "../config/tutorialSteps";
import "../styles/pages/_learn.scss";

const DEBUG = true;

// --------- MERGE PROGRESS ----------
function mergeProgressIntoUnits(units, levelsProgress) {
  if (DEBUG) console.log("[mergeProgressIntoUnits] units.len =", units?.length, "levelsProgress.len =", levelsProgress?.length);

  const lvlMap = new Map((levelsProgress || []).map((l) => [l.slug, l]));

  return (units || []).map((u) => {
    const mergedLevels = (u.levels || []).map((l) => {
      const p = lvlMap.get(l.slug);
      if (!p) return l;

      const mergedLevel = {
        ...l,
        user_progress: p.user_progress || l.user_progress,
      };

      if (Array.isArray(l.objectives) && Array.isArray(p.objectives)) {
        const pObjMap = new Map(p.objectives.map((o) => [o.code, o]));
        mergedLevel.objectives = l.objectives.map((o) => {
          const po = pObjMap.get(o.code);
          return po ? { ...o, user_progress: po.user_progress } : o;
        });
      }
      return mergedLevel;
    });

    return { ...u, levels: mergedLevels };
  });
}

function isUnitCompleted(unit) {
  if (!unit?.levels?.length) return false;
  return unit.levels.every((l) => l?.user_progress?.completed);
}

export default function Learn() {
  const { xp } = useProgress();
  const [units, setUnits] = useState([]);
  const [loadingUnits, setLoadingUnits] = useState(true);
  const [unitsError, setUnitsError] = useState("");

  const [levelsProgress, setLevelsProgress] = useState([]);
  const [, setLoadingProgress] = useState(false);

  const { unitSlug } = useParams();

  // Sidebar open/close (persisted)
  const [open, setOpen] = useState(() =>
    localStorage.getItem("learn.sidebar.open") === "false" ? false : true
  );
  const toggle = useCallback(() => {
    setOpen((prev) => {
      const next = !prev;
      localStorage.setItem("learn.sidebar.open", String(next));
      return next;
    });
  }, []);
  const layoutClass = useMemo(
    () => `learn-layout${open ? "" : " learn-layout--collapsed"}`,
    [open]
  );

  // Tutorial state (persisted)
  const [showTutorial, setShowTutorial] = useState(() => {
    const completed = localStorage.getItem("tutorial.completed");
    return completed !== "true";
  });

  const handleTutorialComplete = useCallback(() => {
    localStorage.setItem("tutorial.completed", "true");
    setShowTutorial(false);
  }, []);

  const handleTutorialSkip = useCallback(() => {
    localStorage.setItem("tutorial.completed", "true");
    setShowTutorial(false);
  }, []);

  // Abort refs
  const abortUnitsRef = useRef(null);
  const abortProgressRef = useRef(null);

  // --------- LOAD UNITS ----------
  const loadUnits = useCallback(async () => {
    if (abortUnitsRef.current) abortUnitsRef.current.abort();
    const ac = new AbortController();
    abortUnitsRef.current = ac;

    try {
      setLoadingUnits(true);
      setUnitsError("");
      const url = `${API_BASE}/units/`;
      if (DEBUG) console.log("[Learn] GET", url);
      const res = await apiFetch(url, { signal: ac.signal });
      if (DEBUG) console.log("[Learn] GET /units status:", res.status);

      if (!res.ok) {
        const msg = `No se pudieron cargar las unidades (${res.status})`;
        setUnitsError(msg);
      }
      const data = res.ok ? await res.json() : [];
      if (DEBUG) {
        console.log(
          "[Learn] units summary:",
          (Array.isArray(data) ? data : []).map((u) => ({
            unit: u.slug,
            levels: (u.levels || []).map((l) => ({
              slug: l.slug,
              objectives: (l.objectives || []).length,
            })),
          }))
        );
      }
      setUnits(Array.isArray(data) ? data : []);
    } catch (e) {
      if (e?.name !== "AbortError") {
        console.error("[Learn] loadUnits error:", e);
        setUnits([]);
        setUnitsError("Error de red al cargar las unidades");
      }
    } finally {
      setLoadingUnits(false);
    }
  }, []);

  // --------- FETCH PROGRESS ----------
  const fetchProgress = useCallback(async () => {
    if (abortProgressRef.current) abortProgressRef.current.abort();
    const ac = new AbortController();
    abortProgressRef.current = ac;

    const url = `${API_BASE}/levels/progress/me/`;
    try {
      setLoadingProgress(true);
      if (DEBUG) console.log("[Learn] GET", url);
      const res = await apiFetch(url, { signal: ac.signal });
      if (DEBUG) console.log("[Learn] GET /levels/progress/me/ status:", res.status);
      const data = res.ok ? await res.json() : [];
      if (DEBUG) {
        console.log(
          "[Learn] levelsProgress summary:",
          (Array.isArray(data) ? data : []).map((l) => ({
            slug: l.slug,
            completed: !!l?.user_progress?.completed,
            objectives: (l?.objectives || []).length,
          }))
        );
      }
      setLevelsProgress(Array.isArray(data) ? data : []);
    } catch (e) {
      if (e?.name !== "AbortError") {
        console.error("[Learn] fetchProgress error:", e);
        setLevelsProgress([]);
      }
    } finally {
      setLoadingProgress(false);
    }
  }, []);

  const reloadProgress = useCallback(async () => {
    await Promise.all([loadUnits(), fetchProgress()]);
  }, [loadUnits, fetchProgress]);

  useEffect(() => {
    loadUnits();
    fetchProgress();
    return () => {
      abortUnitsRef.current?.abort?.();
      abortProgressRef.current?.abort?.();
    };
  }, [loadUnits, fetchProgress]);

  const mergedUnits = useMemo(
    () => mergeProgressIntoUnits(units, levelsProgress),
    [units, levelsProgress]
  );

  const currentUnit = useMemo(
    () => mergedUnits.find((u) => u.slug === unitSlug),
    [mergedUnits, unitSlug]
  );

  return (
    <>
      {/* Interactive Tutorial */}
      {showTutorial && (
        <InteractiveTutorial
          steps={tutorialSteps}
          onComplete={handleTutorialComplete}
          onSkip={handleTutorialSkip}
        />
      )}

      <div className={layoutClass}>
        {/* Theme Toggle & Tutorial Restart - Fixed position */}
        <div style={{ position: 'fixed', top: '1rem', right: '1rem', zIndex: 1000, display: 'flex', gap: '1rem', alignItems: 'center' }}>
          
          {/* XP & Level Badge */}
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            background: 'var(--bg-card, #2c2f33)', 
            padding: '0.4rem 0.8rem', 
            borderRadius: '20px', 
            boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
            border: '1px solid var(--border-color, #444)',
            color: 'var(--text-color, #fff)',
            fontWeight: 'bold',
            fontSize: '0.9rem'
          }}>
            <span style={{ color: '#00ff88', marginRight: '0.5rem' }}>★</span>
            <span style={{ marginRight: '0.5rem' }}>Lvl {Math.floor(xp / 100) + 1}</span>
            <span style={{ opacity: 0.8, fontSize: '0.8rem' }}>({xp} XP)</span>
          </div>

          <button
            className="learn-toggle"
            onClick={() => setShowTutorial(true)}
            title="Restart tutorial"
            aria-label="Restart tutorial"
            style={{ fontSize: '1.2rem' }}
          >
            ?
          </button>
          <ThemeToggle />
        </div>

        {/* Floating toggle button (appears when sidebar is collapsed) */}
        <button
          className="learn-toggle learn-toggle--floating"
          onClick={toggle}
          aria-label="Open sidebar"
          title="Open sidebar"
        >
          ☰
        </button>

        {/* Sidebar */}
        <aside className="learn-sidebar">
          <div className="learn-sidebar__header">
            <h2>{currentUnit ? 'Levels' : 'Units'}</h2>
            <button
              className="learn-toggle"
              onClick={toggle}
              aria-label="Close sidebar"
              title="Close sidebar"
            >
              ✕
            </button>
          </div>
          {currentUnit ? (
            <>
              <NavLink to="/learn" className="sidebar-back-button">
                ← Back to Units
              </NavLink>
              <ul>
                {currentUnit.levels?.map((l) => (
                  <li key={l.slug}>
                    <NavLink
                      to={`/learn/${currentUnit.slug}/${l.slug}`}
                      className={({ isActive }) => (isActive ? "active" : undefined)}
                    >
                      {l.title}
                    </NavLink>
                    {l.user_progress?.completed && <span className="badge">✔</span>}
                  </li>
                ))}
              </ul>
            </>
          ) : (
            <ul>
              {mergedUnits.map((u) => (
                <li key={u.slug}>
                  <NavLink
                    to={`/learn/${u.slug}`}
                    className={({ isActive }) => (isActive ? "active" : undefined)}
                  >
                    {u.title}
                  </NavLink>
                  {isUnitCompleted(u) && <span className="badge">✔</span>}
                </li>
              ))}
            </ul>
          )}
        </aside>

        {/* Stage */}
        <main className="learn-stage">
          {loadingUnits ? (
            <div className="loading">Cargando unidades…</div>
          ) : unitsError ? (
            <div className="error">{unitsError}</div>
          ) : mergedUnits.length === 0 ? (
            <div className="loading">No hay unidades disponibles.</div>
          ) : (
            <Outlet context={{ units: mergedUnits, reloadProgress }} />
          )}
        </main>
      </div>
    </>
  );
}
