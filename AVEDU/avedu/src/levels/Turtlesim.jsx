// =============================================================
// FILE: src/pages/TurtleSimPage.jsx
// Autodetección de topics/services (ROS 2) y logs de diagnóstico.
// =============================================================
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import PropTypes from "prop-types";
import { useRoslib } from "../hooks/useRoslib";
import "../styles/pages/turtlesim.scss";
import { useStableRosSub } from "../hooks/useStableRosSub";
import { TSimHeader } from "../components/tsim/TSimHeader";
import { TSimCanvas } from "../components/tsim/TSimCanvas";
import { TSimControls } from "../components/tsim/TSimControls";
import { TSimSidebar } from "../components/tsim/TSimSidebar";

const WORLD = 11.0889;
const GOAL_BOUNDS = { minX: 10.0, minY: 10.0 };

const OBJ_REACH_GOAL = "TSIM_REACH_GOAL";
const OBJ_SPAWN_2ND = "TSIM_SPAWN_2ND";

// Tipos ROS 2
const TYPE_POSE = "turtlesim/msg/Pose";
const TYPE_TWIST = "geometry_msgs/msg/Twist";
const TYPE_SRV_SPAWN = "turtlesim/srv/Spawn";

export default function TurtleSimPage({ objectives = [], onObjectiveHit, onLevelCompleted }) {
  const { connected, subscribeTopic, advertise, callService } = useRoslib();

  // ---- Descubrimiento dinámico ----
  const [poseTopic, setPoseTopic] = useState(null);         // p.ej. "/turtle1/pose" o "/turtlesim/turtle1/pose"
  const [cmdVelTopic, setCmdVelTopic] = useState(null);     // idem para cmd_vel
  const [spawnService, setSpawnService] = useState("/spawn"); // "/spawn" o "/turtlesim/spawn", etc.

  const discoverGraph = useCallback(async () => {
    if (!connected) return;
    try {
      const topicsRes = await callService("/rosapi/topics", "rosapi/Topics", {}); // { topics: string[] }
      const topics = topicsRes?.topics || [];

      // Intento 1: por tipo exacto
      const byType = async (topic) => {
        try {
          const tt = await callService("/rosapi/topic_type", "rosapi/TopicType", { topic });
          return tt?.type || "";
        } catch { return ""; }
      };

      // Pose
      let foundPose = null;
      for (const t of topics) {
        if (t.endsWith("/pose")) {
          const ty = await byType(t);
          if (ty === TYPE_POSE) { foundPose = t; break; }
        }
      }
      // fallback: primer topic con tipo Pose aunque no termine en /pose
      if (!foundPose) {
        for (const t of topics) {
          const ty = await byType(t);
          if (ty === TYPE_POSE) { foundPose = t; break; }
        }
      }

      // cmd_vel
      let foundCmd = null;
      for (const t of topics) {
        if (t.endsWith("/cmd_vel")) {
          const ty = await byType(t);
          if (ty === TYPE_TWIST) { foundCmd = t; break; }
        }
      }
      if (!foundCmd) {
        for (const t of topics) {
          const ty = await byType(t);
          if (ty === TYPE_TWIST) { foundCmd = t; break; }
        }
      }

      // Services
      let foundSpawn = "/spawn";
      try {
        const svcsRes = await callService("/rosapi/services", "rosapi/Services", {}); // { services: string[] }
        const services = svcsRes?.services || [];
        // preferir uno que termine en /spawn
        const candidates = services.filter((s) => s.endsWith("/spawn"));
        if (candidates.length > 0) foundSpawn = candidates[0];
      } catch {}

      setPoseTopic(foundPose);
      setCmdVelTopic(foundCmd);
      setSpawnService(foundSpawn);

      // eslint-disable-next-line no-console
      console.log("[TSIM][discover] pose:", foundPose, "cmd_vel:", foundCmd, "spawn:", foundSpawn);
    } catch (e) {
      console.error("[TSIM][discover] error:", e);
    }
  }, [connected, callService]);

  useEffect(() => {
    if (connected) discoverGraph();
  }, [connected, discoverGraph]);

  // ---- Estado de tortugas ----
  const [turtles, setTurtles] = useState({});
  const turtlesRef = useRef({});
  const setTurtlesSafe = useCallback((updater) => {
    setTurtles((prev) => {
      const next = typeof updater === "function" ? updater(prev) : updater;
      if (prev === next) return prev;
      let changed = false;
      if (Object.keys(prev).length !== Object.keys(next).length) changed = true;
      else {
        for (const k of Object.keys(next)) {
          const p = prev[k]?.pose, n = next[k]?.pose;
          if (!p || !n || Math.abs(p.x - n.x) > 1e-3 || Math.abs(p.y - n.y) > 1e-3 || Math.abs(p.theta - n.theta) > 1e-3) {
            changed = true; break;
          }
        }
      }
      return changed ? next : prev;
    });
  }, []);

  const [active, setActive] = useState("turtle1");
  const cmdRef = useRef(null);
  const holdTimerRef = useRef(null);
  const reportedRef = useRef({ [OBJ_REACH_GOAL]: false, [OBJ_SPAWN_2ND]: false });

  // ---- Logs de conexión ----
  useEffect(() => {
    console.log(`[TSIM] ROS ${connected ? "connected" : "disconnected"}`);
  }, [connected]);

  // ---- Suscripción fija a Pose detectado ----
  useStableRosSub({
    connected: connected && !!poseTopic,
    subscribeTopic,
    topic: poseTopic || "/turtle1/pose",
    type: TYPE_POSE,
    opts: useMemo(() => ({ throttle_rate: 50, queue_size: 1 }), []),
    onMessage: (msg) => {
      // el nombre podemos inferirlo del topic
      const nameGuess = (poseTopic || "/turtle1/pose").split("/").filter(Boolean).slice(-2, -1)[0] || "turtle1";
      turtlesRef.current = { ...turtlesRef.current, [nameGuess]: { pose: msg } };
      setTurtlesSafe(turtlesRef.current);
    },
  });

  // ---- (Re)advertise cmd_vel for active turtle ----
  useEffect(() => {
    if (!connected) return undefined;

    // Construct topic for active turtle
    const activeCmdVelTopic = `/${active}/cmd_vel`;

    try {
      cmdRef.current?.unadvertise?.();
      cmdRef.current = advertise(activeCmdVelTopic, TYPE_TWIST);
      console.log("[TSIM] Advertise cmd_vel ->", activeCmdVelTopic, "for active turtle:", active);
    } catch (e) {
      console.error("[TSIM] advertise error:", e);
    }
    return () => {
      try { cmdRef.current?.unadvertise?.(); } catch (e) { console.error("[TSIM] unadvertise error:", e); }
    };
  }, [connected, active, advertise]);

  // ---- Helpers publish/hold ----
  const publish = useCallback((lx, az) => {
    if (!cmdRef.current) return;
    console.log("[ROS][publish]", `/${active}/cmd_vel`, { lx, az });
    cmdRef.current.publish({
      linear: { x: lx, y: 0, z: 0 },
      angular: { x: 0, y: 0, z: az },
    });
  }, [active]);

  const startHold = useCallback((lx, az) => {
    publish(lx, az);
    clearInterval(holdTimerRef.current);
    holdTimerRef.current = setInterval(() => publish(lx, az), 150);
  }, [publish]);

  const stopHold = useCallback(() => {
    clearInterval(holdTimerRef.current);
  }, []);

  // ---- Suscripción puntual a pose por nombre (para spawns) ----
  const subscribePoseOnce = useCallback((topic) => {
    return subscribeTopic(topic, TYPE_POSE, (msg) => {
      const nameGuess = topic.split("/").filter(Boolean).slice(-2, -1)[0] || "turtle?";
      turtlesRef.current = { ...turtlesRef.current, [nameGuess]: { pose: msg } };
      setTurtlesSafe(turtlesRef.current);
    }, { throttle_rate: 50, queue_size: 1 });
  }, [subscribeTopic, setTurtlesSafe]);

  // ---- Spawn (usa servicio detectado y luego descubre el topic de la nueva tortuga) ----
  const spawnTurtle = useCallback(async (nameOpt) => {
    if (!connected || !spawnService) return;
    const rand = (min, max) => min + Math.random() * (max - min);
    const payload = {
      x: rand(1.0, WORLD - 1.0),
      y: rand(1.0, WORLD - 1.0),
      theta: rand(-Math.PI, Math.PI),
      name: nameOpt || "",
    };
    try {
      const res = await callService(spawnService, TYPE_SRV_SPAWN, payload);
      const newName = res?.name || nameOpt || "turtle?";
      console.log("[TSIM] spawn OK ->", newName, "via", spawnService);

      // intenta descubrir su tópico pose real
      const topicsRes = await callService("/rosapi/topics", "rosapi/Topics", {});
      const topics = topicsRes?.topics || [];
      const maybe = topics.find((t) => t.endsWith(`/${newName}/pose`)) ||
                    topics.find((t) => t.includes(`/${newName}/`) && t.endsWith("/pose")) ||
                    `/${newName}/pose`;
      subscribePoseOnce(maybe);
      setActive(newName);

      if (!reportedRef.current[OBJ_SPAWN_2ND]) {
        reportedRef.current[OBJ_SPAWN_2ND] = true;
        try { awaitMaybe(onObjectiveHit, OBJ_SPAWN_2ND); } catch {}
      }
    } catch (err) {
      console.error("[TSIM] spawn ERROR:", err);
    }
  }, [connected, spawnService, callService, subscribePoseOnce, onObjectiveHit]);

  // ---- Detección de entrada a meta ----
  const prevInGoalRef = useRef(false);
  const levelCompletedRef = useRef(false);
  useEffect(() => {
    const p = turtles["turtle1"]?.pose;
    if (!p) return;
    const inGoalNow = p.x >= GOAL_BOUNDS.minX && p.y >= GOAL_BOUNDS.minY;
    const wasInGoal = prevInGoalRef.current;

    if (inGoalNow && !wasInGoal) {
      if (!reportedRef.current[OBJ_REACH_GOAL]) {
        reportedRef.current[OBJ_REACH_GOAL] = true;
        try { awaitMaybe(onObjectiveHit, OBJ_REACH_GOAL); } catch {}
      }
      if (!levelCompletedRef.current) {
        levelCompletedRef.current = true;
        try { onLevelCompleted?.(); } catch (err) { console.error("[TSIM] onLevelCompleted ERROR:", err); }
      }
    }
    prevInGoalRef.current = inGoalNow;
  }, [turtles, onLevelCompleted, onObjectiveHit]);

  const turtleNames = useMemo(() => Object.keys(turtles).sort(), [turtles]);
  const activePose = turtles[active]?.pose;

  return (
    <div className="tsim-screen">
      <TSimHeader
        connected={connected}
        objectives={objectives}
        active={active}
        activePose={activePose}
      />

      <main className="tsim-layout">
        <section className="tsim-canvasCard">
          <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "12px" }}>
            <TSimCanvas
              turtles={turtles}
              active={active}
              worldSize={WORLD}
              goalBounds={GOAL_BOUNDS}
            />
            {/* ROS Topics Info */}
            <div className="tsim-topicsInfo">
              <div><strong>ROS Topics:</strong></div>
              <div style={{paddingLeft: "12px"}}>Pose: <code>{String(poseTopic || "detecting…")}</code></div>
              <div style={{paddingLeft: "12px"}}>Cmd: <code>{String(cmdVelTopic || "detecting…")}</code></div>
              <div style={{paddingLeft: "12px"}}>Spawn: <code>{String(spawnService || "detecting…")}</code></div>
            </div>
          </div>
        </section>

        <section className="tsim-controlsPanel">
          <TSimControls
            connected={connected && !!active}
            startHold={startHold}
            stopHold={stopHold}
            publish={publish}
          />
          <TSimSidebar
            connected={connected}
            active={active}
            setActive={setActive}
            turtleNames={turtleNames}
            spawnTurtle={spawnTurtle}
          />
        </section>
      </main>
    </div>
  );
}

function awaitMaybe(fn, ...args) {
  try {
    const r = fn?.(...args);
    if (r && typeof r.then === "function") return r.catch(() => {});
    return r;
  } catch {}
}

TurtleSimPage.propTypes = {
  objectives: PropTypes.array,
  onObjectiveHit: PropTypes.func,
  onLevelCompleted: PropTypes.func,
};

TurtleSimPage.defaultProps = {
  objectives: [],
  onObjectiveHit: undefined,
  onLevelCompleted: undefined,
};
