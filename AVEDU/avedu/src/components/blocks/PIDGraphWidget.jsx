import React, { useState, useEffect, useRef, useCallback } from "react";
import { Position, useStore } from "@xyflow/react";
import HandleWithLabel from "./HandleWithLabel";
import { FaChartLine, FaPlay, FaStop } from "react-icons/fa6";

const MAX_POINTS = 80;

export default function PIDGraphWidget({ id, data }) {
  const edges = useStore((state) => state.edges);
  const nodes = useStore((state) => state.nodes);

  const [setpointTopic, setSetpointTopic] = useState(data.setpointTopic ?? "/pid/setpoint");
  const [measuredTopic, setMeasuredTopic] = useState(data.measuredTopic ?? "/pid/measured");
  const [isRunning,     setIsRunning]     = useState(false);

  const canvasRef   = useRef(null);
  const historyRef  = useRef({ setpoint: [], measured: [], error: [] });
  const tRef        = useRef(0);
  const onChangeRef = useRef(data.onChange);
  useEffect(() => { onChangeRef.current = data.onChange; }, [data.onChange]);

  const getUpstream = useCallback((handleId) => {
    const edge = edges.find((e) => e.target === id && e.targetHandle === handleId);
    if (!edge) return null;
    const srcNode = nodes.find((n) => n.id === edge.source);
    return srcNode?.data?.[edge.sourceHandle] ?? srcNode?.data?.value ?? null;
  }, [edges, nodes, id]);

  const isSpConnected = edges.some((e) => e.target === id && e.targetHandle === "setpoint");
  const isMsConnected = edges.some((e) => e.target === id && e.targetHandle === "measured");

  // Draw function — called from inside useEffect interval via closure
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    function drawChart() {
      const ctx  = canvas.getContext("2d");
      const W    = canvas.width;
      const H    = canvas.height;
      const hist = historyRef.current;

      // All values combined for auto-scale
      const allVals = [...hist.setpoint, ...hist.measured, ...hist.error];
      const minV = allVals.length ? Math.min(...allVals) - 0.1 : -1;
      const maxV = allVals.length ? Math.max(...allVals) + 0.1 :  1;
      const range = maxV - minV || 1;

      const toX = (i)  => (i / MAX_POINTS) * W;
      const toY = (v)  => H - ((v - minV) / range) * H;

      // Background
      ctx.fillStyle = "#080c10";
      ctx.fillRect(0, 0, W, H);

      // Subtle horizontal grid lines at 25%, 50%, 75%
      ctx.strokeStyle = "rgba(255,255,255,0.05)";
      ctx.lineWidth   = 1;
      [0.25, 0.5, 0.75].forEach((frac) => {
        const y = H * frac;
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(W, y);
        ctx.stroke();
      });

      // Zero line
      const zeroY = toY(0);
      if (zeroY >= 0 && zeroY <= H) {
        ctx.strokeStyle = "rgba(255,255,255,0.12)";
        ctx.lineWidth   = 1;
        ctx.setLineDash([]);
        ctx.beginPath();
        ctx.moveTo(0, zeroY);
        ctx.lineTo(W, zeroY);
        ctx.stroke();
      }

      // Draw trace helper
      function drawTrace(arr, color, lw) {
        if (arr.length < 2) return;
        ctx.beginPath();
        ctx.strokeStyle = color;
        ctx.lineWidth   = lw;
        ctx.setLineDash([]);
        arr.forEach((v, i) => {
          const x = toX(i + (MAX_POINTS - arr.length));
          const y = toY(v);
          if (i === 0) ctx.moveTo(x, y);
          else         ctx.lineTo(x, y);
        });
        ctx.stroke();
      }

      drawTrace(hist.setpoint, "#44aaff", 1.5);
      drawTrace(hist.measured, "#ffaa44", 1.5);
      drawTrace(hist.error,    "#ff6b6b", 1.0);

      // Legend (top-left)
      const legends = [
        { color: "#44aaff", label: "setpoint" },
        { color: "#ffaa44", label: "measured" },
        { color: "#ff6b6b", label: "error"    },
      ];
      legends.forEach(({ color, label }, i) => {
        const lx = 6 + i * 68;
        const ly = 8;
        ctx.fillStyle = color;
        ctx.fillRect(lx, ly, 10, 2);
        ctx.fillStyle = "rgba(255,255,255,0.65)";
        ctx.font = "9px monospace";
        ctx.fillText(label, lx + 13, ly + 5);
      });
    }

    if (!isRunning) {
      drawChart();
      return;
    }

    const timer = setInterval(() => {
      const t  = tRef.current;
      tRef.current = t + 0.05;

      let sp, meas;
      if (isSpConnected) {
        sp = getUpstream("setpoint") ?? Math.sin(t * 0.5) * 0.5;
      } else {
        sp = Math.sin(t * 0.5) * 0.5;
      }
      if (isMsConnected) {
        meas = getUpstream("measured") ?? (Math.sin(t * 0.5 - 0.4) * 0.5 + (Math.random() - 0.5) * 0.06);
      } else {
        meas = Math.sin(t * 0.5 - 0.4) * 0.5 + (Math.random() - 0.5) * 0.06;
      }
      const err = sp - meas;

      const hist = historyRef.current;
      hist.setpoint.push(sp);
      hist.measured.push(meas);
      hist.error.push(err);
      if (hist.setpoint.length > MAX_POINTS) hist.setpoint.shift();
      if (hist.measured.length > MAX_POINTS) hist.measured.shift();
      if (hist.error.length    > MAX_POINTS) hist.error.shift();

      drawChart();
    }, 50);

    return () => clearInterval(timer);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isRunning, isSpConnected, isMsConnected]);

  return (
    <div className="rf-card" style={{ minWidth: 340 }}>
      <div className="rf-card__title" style={{ background: "#0a0a1a", color: "#aa88ff" }}>
        <FaChartLine style={{ verticalAlign: "-2px" }} /> PID Graph
      </div>

      <div className="rf-card__body" style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>

        {/* Setpoint topic */}
        <label className="rf-field">
          <span>Setpoint topic</span>
          <input
            className="rf-input"
            value={setpointTopic}
            onChange={(e) => setSetpointTopic(e.target.value)}
            placeholder="/pid/setpoint"
          />
        </label>

        {/* Measured topic */}
        <label className="rf-field">
          <span>Measured topic</span>
          <input
            className="rf-input"
            value={measuredTopic}
            onChange={(e) => setMeasuredTopic(e.target.value)}
            placeholder="/pid/measured"
          />
        </label>

        {/* Run / Stop button */}
        <button
          style={{
            background: isRunning ? "rgba(200,30,30,0.25)" : "rgba(100,60,200,0.25)",
            color:      isRunning ? "#ff6b6b" : "#aa88ff",
            border:     `1px solid ${isRunning ? "#ff6b6b" : "#aa88ff"}`,
            borderRadius: 4,
            padding: "0.3rem 0.6rem",
            cursor: "pointer",
            fontSize: "0.75rem",
          }}
          onClick={() => {
            if (isRunning) {
              historyRef.current = { setpoint: [], measured: [], error: [] };
              tRef.current = 0;
            }
            setIsRunning((r) => !r);
          }}
        >
          {isRunning ? <><FaStop style={{ verticalAlign: "-1px" }} /> Stop</> : <><FaPlay style={{ verticalAlign: "-1px" }} /> Run</>}
        </button>

        {/* Canvas */}
        <div style={{
          border: "1px solid #1a1a3a",
          borderRadius: 6,
          overflow: "hidden",
        }}>
          <canvas ref={canvasRef} width={320} height={160} style={{ display: "block" }} />
        </div>

        {/* Legend row */}
        <div style={{
          display: "flex",
          gap: "0.7rem",
          fontSize: "0.65rem",
          color: "#aaa",
          alignItems: "center",
        }}>
          {[
            { color: "#44aaff", label: "setpoint" },
            { color: "#ffaa44", label: "measured" },
            { color: "#ff6b6b", label: "error"    },
          ].map(({ color, label }) => (
            <span key={label} style={{ display: "flex", alignItems: "center", gap: "0.3rem" }}>
              <span style={{ display: "inline-block", width: 10, height: 2, background: color, borderRadius: 1 }} />
              {label}
            </span>
          ))}
        </div>
      </div>

      {/* Target handles */}
      <HandleWithLabel type="target" position={Position.Left} id="setpoint" label="setpoint" top="35%" color="blue"   />
      <HandleWithLabel type="target" position={Position.Left} id="measured" label="measured" top="60%" color="orange" />
    </div>
  );
}
