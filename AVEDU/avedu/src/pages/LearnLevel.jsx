// =============================================================
// FILE: src/pages/LearnLevel.jsx  (optimizado)
// =============================================================
import React, { lazy, Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import { useProgress } from "../context/ProgressContext";
import { apiFetch } from "../context/AuthContext";
import { API_BASE } from "../config";
//------------------Levels
// Per-level code splitting: each lesson loads its own chunk on demand instead
// of every lesson (and the full IDE + 3D sim + Unity loader they pull in) being
// bundled into the route. Visiting one lesson no longer downloads all 36.
const TurtleSimPage = lazy(() => import("../levels/Turtlesim"));
const RosBasic = lazy(() => import("../levels/RosBasic"));
const MeshDebugPage = lazy(() => import("../levels/rviz"));
const VehicleDynamics = lazy(() => import("../levels/VehicleDynamics"));
const GazeboSim = lazy(() => import("../levels/GazeboSim"));
const IntroUIBasics = lazy(() => import("../levels/IntroUIBasics"));
const IntroGettingStarted = lazy(() => import("../levels/IntroGettingStarted"));
// Vehicle Dynamics Levels
const VdPhysicsIntro = lazy(() => import("../levels/VdPhysicsIntro"));
const VdCenterOfRotation = lazy(() => import("../levels/VdCenterOfRotation"));
const VdAckermann = lazy(() => import("../levels/VdAckermann"));
const VdBicycleModel = lazy(() => import("../levels/VdBicycleModel"));
const VdSimulations = lazy(() => import("../levels/VdSimulations"));
const VdWeightLoad = lazy(() => import("../levels/VdWeightLoad"));
const VdSuspensionDrivetrain = lazy(() => import("../levels/VdSuspensionDrivetrain"));
const VdAdvancedDynamics = lazy(() => import("../levels/VdAdvancedDynamics"));
// ROS2 Concepts Levels
const Ros2NodesIntro = lazy(() => import("../levels/Ros2NodesIntro"));
const Ros2Topics = lazy(() => import("../levels/Ros2Topics"));
const Ros2Subscriptions = lazy(() => import("../levels/Ros2Subscriptions"));
const Ros2LaunchFiles = lazy(() => import("../levels/Ros2LaunchFiles"));
// Mini juegos: viven en src/minigames/, agrupados por tema.
const Ros2ConceptsMiniGames = lazy(() => import("../minigames/ros2-concepts"));
// Sensing Unit Levels
const SensingIntegration = lazy(() => import("../levels/SensingIntegration"));
const SensingSubscribe = lazy(() => import("../levels/SensingSubscribe"));
const SensingVisualization = lazy(() => import("../levels/SensingVisualization"));
const SensingTasks = lazy(() => import("../levels/SensingTasks"));
// ROS2 Advanced Unit Levels
const Ros2QoSIntro = lazy(() => import("../levels/Ros2QoSIntro"));
const Ros2QoSSettings = lazy(() => import("../levels/Ros2QoSSettings"));
const Ros2Realtime = lazy(() => import("../levels/Ros2Realtime"));
const Ros2Algorithms = lazy(() => import("../levels/Ros2Algorithms"));
// Transformations Unit Levels
const TfImportance = lazy(() => import("../levels/TfImportance"));
const TfSensorAlignment = lazy(() => import("../levels/TfSensorAlignment"));
const TfRobotNavigation = lazy(() => import("../levels/TfRobotNavigation"));
const TfPracticalExamples = lazy(() => import("../levels/TfPracticalExamples"));
// Perception Unit Levels
const PerceptionLibraries = lazy(() => import("../levels/PerceptionLibraries"));
const PerceptionObstacle = lazy(() => import("../levels/PerceptionObstacle"));
const PerceptionLane = lazy(() => import("../levels/PerceptionLane"));
const PerceptionTasks = lazy(() => import("../levels/PerceptionTasks"));

const DEBUG = true;

const REGISTRY = Object.freeze({
  turtlesim: TurtleSimPage,
  "ros-basic": RosBasic,
  "rviz": MeshDebugPage,
  "vehicle-dynamics": VehicleDynamics,
  "gazebo-sim": GazeboSim,
  "intro-ui-basics": IntroUIBasics,
  "intro-getting-started": IntroGettingStarted,
  // Vehicle Dynamics Unit Levels
  "vd-physics-intro": VdPhysicsIntro,
  "vd-center-of-rotation": VdCenterOfRotation,
  "vd-ackermann": VdAckermann,
  "vd-bicycle-model": VdBicycleModel,
  "vd-simulations": VdSimulations,
  "vd-weight-load": VdWeightLoad,
  "vd-suspension-drivetrain": VdSuspensionDrivetrain,
  "vd-advanced-dynamics": VdAdvancedDynamics,
  // ROS2 Concepts Unit Levels
  "ros2-nodes-intro": Ros2NodesIntro,
  "ros2-topics": Ros2Topics,
  "ros2-subscriptions": Ros2Subscriptions,
  "ros2-launch-files": Ros2LaunchFiles,
  "ros2-mini-games": Ros2ConceptsMiniGames,
  // Sensing Unit Levels
  "sensing-integration": SensingIntegration,
  "sensing-subscribe": SensingSubscribe,
  "sensing-visualization": SensingVisualization,
  "sensing-tasks": SensingTasks,
  // ROS2 Advanced Unit Levels
  "ros2-qos-intro": Ros2QoSIntro,
  "ros2-qos-settings": Ros2QoSSettings,
  "ros2-realtime": Ros2Realtime,
  "ros2-algorithms": Ros2Algorithms,
  // Transformations Unit Levels
  "tf-importance": TfImportance,
  "tf-sensor-alignment": TfSensorAlignment,
  "tf-robot-navigation": TfRobotNavigation,
  "tf-practical-examples": TfPracticalExamples,
  // Perception Unit Levels
  "perception-libraries": PerceptionLibraries,
  "perception-obstacle": PerceptionObstacle,
  "perception-lane": PerceptionLane,
  "perception-tasks": PerceptionTasks,
});

export default function LearnLevel() {
  const { unitSlug, levelSlug } = useParams();
  const wantLevel = (levelSlug || "").toLowerCase();

  const { hitObjective, completeLevel, resetLevel } = useProgress();

  const [level, setLevel] = useState(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");


  const mountedRef = useRef(true);
  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);


  const abortRef = useRef(null);

  const LevelCmp = REGISTRY[wantLevel] || REGISTRY[levelSlug];



 // LearnLevel.jsx
const fetchLevel = useCallback(async ({ silent = false } = {}) => {
  if (abortRef.current) abortRef.current.abort();
  const ac = new AbortController();
  abortRef.current = ac;

  const url = `${API_BASE}/levels/${encodeURIComponent(levelSlug)}/`;
  if (DEBUG) console.log("[LearnLevel] GET", url);

  if (!silent) setLoading(true);
  setErr("");

  try {
    const res = await apiFetch(url, { signal: ac.signal });
    if (!res.ok) {
      const txt = await res.text().catch(() => "");
      if (DEBUG) console.error("[LearnLevel] body:", txt);
      if (mountedRef.current) {
        setLevel(null);
        setErr(`No se pudo cargar el nivel (${res.status}).`);
      }
      return;
    }
    const data = await res.json();
    if (mountedRef.current) setLevel(data);
  } catch (e) {
    if (e?.name !== "AbortError") {
      console.error("[LearnLevel] fetchLevel error:", e);
      if (mountedRef.current) {
        setLevel(null);
        setErr("Error de red al cargar el nivel.");
      }
    }
  } finally {
    if (!silent && mountedRef.current) setLoading(false);
  }
}, [levelSlug]);


  // Carga inicial y al cambiar el slug
  useEffect(() => { fetchLevel(); }, [fetchLevel]);

  // Objetivos memorizados
  const objectives = useMemo(
    () => (Array.isArray(level?.objectives) ? level.objectives : []),
    [level]
  );

  // --------- LOGS DE DEPURACIÓN ----------
  useEffect(() => {
    if (!DEBUG) return;
    console.log("======== [LearnLevel DEBUG] ========");
    console.log("[URL] unitSlug:", unitSlug, "levelSlug:", levelSlug);
    console.log("[level] title:", level?.title, "slug:", level?.slug);
    console.log(
      "[objectives]:",
      objectives.map((o) => ({
        code: o.code,
        desc: o.description || o.Description,
        achieved: o.user_progress?.achieved,
      }))
    );
    console.log("====================================");
  }, [unitSlug, levelSlug, level, objectives]);


  const handleReset = useCallback(async () => {
    if (!window.confirm("¿Resetear el progreso de este nivel?")) return;
    try {
      await resetLevel(levelSlug);
      await fetchLevel(); // recarga desde API
    } catch (e) {
      console.error("[LearnLevel] resetLevel error:", e);
      alert("No se pudo reiniciar el nivel.");
    }
  }, [levelSlug, resetLevel, fetchLevel]);

  // tras registrar objetivo
const handleHitObjective = useCallback(async (code) => {
  if (!code) return;
  try {
    await hitObjective(code);
  } catch (e) {
    console.error("[LearnLevel] hitObjective error:", e);
    alert("No se pudo registrar el objetivo. Revisa el código.");
  } finally {
    await fetchLevel({ silent: true }); // ← sin spinner
  }
}, [hitObjective, fetchLevel]);

// al completar nivel
const handleCompleteLevel = useCallback(async () => {
  try {
    await completeLevel(levelSlug);
  } catch (e) {
    console.error("[LearnLevel] completeLevel error:", e);
    alert("No se pudo marcar el nivel como completado.");
  } finally {
    await fetchLevel({ silent: true }); // ← sin spinner
  }
}, [completeLevel, levelSlug, fetchLevel]);



  if (!LevelCmp) {
    if (DEBUG) console.log("[LearnLevel] REGISTRY miss. keys:", Object.keys(REGISTRY));
    return <div>Level "{levelSlug}" not found.</div>;
  }

  if (loading) {
    return <div className="placeholder">Cargando nivel…</div>;
  }

  if (err) {
    return <div className="error">{err}</div>;
  }

  if (!level) {
    return <div>No se pudo cargar el nivel "{levelSlug}".</div>;
  }

  return (
    <div className="level-wrap">
      <header className="level-header">
        <h1 className="level-title">{level?.title || levelSlug}</h1>

        <ul className="level-objectives">
          {objectives.length > 0 ? (
            objectives.map((o) => {
              const desc = o.description || o.Description || o.code;
              const done = !!o.user_progress?.achieved;
              return (
                <li key={o.code} className={done ? "done" : ""} title={o.code}>
                  <span className="dot" />
                  <span className="desc">{desc}</span>
                  {done && <span className="check">✔</span>}
                </li>
              );
            })
          ) : (
            <li className="empty">No objectives for this level</li>
          )}
        </ul>

        <button className="level-reset" title="Reset progress" onClick={handleReset}>
 
        </button>
      </header>

      <Suspense fallback={<div className="placeholder">Cargando nivel…</div>}>
        <LevelCmp
          objectives={objectives}
          onObjectiveHit={handleHitObjective}
          onLevelCompleted={handleCompleteLevel}
        />
      </Suspense>
    </div>
  );
}
