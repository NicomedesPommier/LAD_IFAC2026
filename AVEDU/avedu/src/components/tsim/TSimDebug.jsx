import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import PropTypes from "prop-types";
import { useRoslib } from "../../hooks/useRoslib";

/**
 * Panel de depuración ROS:
 * - Lista tópicos vía /rosapi/topics
 * - Muestra tipo de /turtle1/pose y si existe
 * - Botón "Refrescar"
 * - Muestra últimos errores de roslib
 */
export default function TSimDebug({ watchTopic = "/turtle1/pose" }) {
  const { connected, callService, subscribeTopic } = useRoslib();
  const [topics, setTopics] = useState([]);
  const [types, setTypes] = useState({});
  const [error, setError] = useState(null);
  const [sample, setSample] = useState(null);
  const unsubRef = useRef(null);

  const fetchTopics = useCallback(async () => {
    if (!connected) return;
    try {
      const res = await callService("/rosapi/topics", "rosapi/Topics", {});
      // res.topics: string[]
      setTopics(res?.topics || []);
      setError(null);
    } catch (e) {
      setError(String(e?.message || e));
    }
  }, [connected, callService]);

  const fetchType = useCallback(async (topic) => {
    if (!connected || !topic) return;
    try {
      const res = await callService("/rosapi/topic_type", "rosapi/TopicType", { topic });
      setTypes((prev) => ({ ...prev, [topic]: res?.type || "?" }));
    } catch (e) {
      setTypes((prev) => ({ ...prev, [topic]: "ERR" }));
    }
  }, [connected, callService]);

  // Cargar al conectar
  useEffect(() => {
    if (!connected) return;
    fetchTopics();
  }, [connected, fetchTopics]);

  // Cargar tipo del watchTopic
  useEffect(() => {
    if (!connected) return;
    fetchType(watchTopic);
  }, [connected, watchTopic, fetchType]);

  // Suscribirse temporalmente al watchTopic para capturar una muestra (si existe)
  const watchOnce = useCallback(() => {
    if (!connected) return;
    if (unsubRef.current) { try { unsubRef.current(); } catch {} unsubRef.current = null; }
    setSample(null);
    try {
      unsubRef.current = subscribeTopic(
        watchTopic,
        types[watchTopic] || "turtlesim/Pose",
        (msg) => {
          setSample(msg);
        },
        { throttle_rate: 20, queue_size: 1 }
      );
      // auto-cancel a los 5s
      setTimeout(() => {
        if (unsubRef.current) { try { unsubRef.current(); } catch {} unsubRef.current = null; }
      }, 5000);
    } catch (e) {
      setError(String(e?.message || e));
    }
  }, [connected, subscribeTopic, watchTopic, types]);

  const hasWatch = useMemo(() => topics.includes(watchTopic), [topics, watchTopic]);

  return (
    <div className="tsim-debug" style={{marginTop: 12}}>
      <div style={{display:"flex", gap:8, alignItems:"center", flexWrap:"wrap"}}>
        <strong>ROS Debug</strong>
        <span>· Estado: <b style={{color: connected ? "#10b981" : "#ef4444"}}>{connected ? "Conectado" : "Desconectado"}</b></span>
        <button className="btn" onClick={fetchTopics} disabled={!connected}>Refrescar tópicos</button>
        <button className="btn" onClick={watchOnce} disabled={!connected}>Probar suscripción</button>
      </div>

      <div style={{marginTop:8}}>
        <div>Tópico observado: <code>{watchTopic}</code></div>
        <div>Existe: <b>{hasWatch ? "sí" : "no"}</b></div>
        <div>Tipo detectado: <code>{types[watchTopic] || "?"}</code></div>
        {sample && (
          <pre style={{background:"#0b1220", color:"#d1e9ff", padding:8, borderRadius:8, marginTop:8, maxHeight:180, overflow:"auto"}}>
{JSON.stringify(sample, null, 2)}
          </pre>
        )}
        {error && <div style={{color:"#ef4444", marginTop:8}}>Error: {error}</div>}
      </div>

      <details style={{marginTop:8}}>
        <summary>Ver todos los tópicos ({topics.length})</summary>
        <div style={{display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(320px,1fr))", gap:8, marginTop:8}}>
          {topics.map((t) => (
            <div key={t} style={{border:"1px solid #1f2a4a", borderRadius:8, padding:8}}>
              <div style={{display:"flex", justifyContent:"space-between", gap:8}}>
                <code style={{wordBreak:"break-all"}}>{t}</code>
                <button className="btn" onClick={() => fetchType(t)}>type</button>
              </div>
              <div style={{fontSize:12, color:"#9fb3c8", marginTop:4}}>
                {types[t] ? <code>{types[t]}</code> : <em>—</em>}
              </div>
            </div>
          ))}
        </div>
      </details>
    </div>
  );
}

TSimDebug.propTypes = {
  watchTopic: PropTypes.string,
};
