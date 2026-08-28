import React, { useEffect, useMemo, useRef, useState } from "react";
import { Position } from "@xyflow/react";
import {
  NodeCard,
  LabeledInput,
  InfoCard,
  InfoBadge,
  HandleWithLabel,
  useNotifier,
} from "./components";

function toNumber(value, fallback = 1.0) {
  const n = Number.parseFloat(value);
  return Number.isFinite(n) ? n : fallback;
}

function formatNumber(value, digits = 3) {
  const n = Number.parseFloat(value);
  if (!Number.isFinite(n)) return "invalid";
  return n.toFixed(digits);
}

function ExpandableTitle({ label, icon, expanded, onToggle }) {
  return (
    <div
      onClick={onToggle}
      style={{ display: "flex", justifyContent: "space-between", cursor: "pointer" }}
    >
      <span>{icon} {label}</span>
      <span style={{ fontSize: "0.75em" }}>{expanded ? "▼" : "▶"}</span>
    </div>
  );
}

export default function TimerRateNode({ id, data }) {
  const [frequencyHz, setFrequencyHz] = useState(data.frequencyHz ?? "1.0");
  const [enabled, setEnabled] = useState(data.enabled ?? false);
  const [tickCount, setTickCount] = useState(data.tickCount ?? 0);
  const [lastTickTime, setLastTickTime] = useState(data.lastTickTime ?? "");
  const [expanded, setExpanded] = useState(data.expanded ?? true);

  const intervalRef = useRef(null);

  const frequencyN = useMemo(() => {
    return Math.max(toNumber(frequencyHz, 1.0), 0.001);
  }, [frequencyHz]);

  const periodMs = useMemo(() => {
    return Math.max(1000.0 / frequencyN, 1.0);
  }, [frequencyN]);

  const notify = useNotifier(id, data, () => ({
    inputType: "timerRate",
    outputType: "tick",

    frequencyHz,
    frequency: frequencyN,
    periodMs,

    enabled,
    tick: false,
    tickCount,
    numericValue: tickCount,
    value: tickCount,

    lastTickTime,
    expanded,
  }));

  useEffect(() => {
    notify({
      inputType: "timerRate",
      outputType: "tick",
      frequencyHz,
      frequency: frequencyN,
      periodMs,
      enabled,
      tick: false,
      tickCount,
      numericValue: tickCount,
      value: tickCount,
      lastTickTime,
      expanded,
    });
  }, [
    frequencyHz,
    frequencyN,
    periodMs,
    enabled,
    tickCount,
    lastTickTime,
    expanded,
    notify,
  ]);

  useEffect(() => {
    if (!enabled) {
      if (intervalRef.current) clearInterval(intervalRef.current);
      intervalRef.current = null;
      return;
    }

    if (intervalRef.current) clearInterval(intervalRef.current);

    intervalRef.current = setInterval(() => {
      setTickCount((previous) => {
        const nextTickCount = previous + 1;
        const now = new Date().toISOString();

        setLastTickTime(now);

        notify({
          tick: true,
          tickCount: nextTickCount,
          numericValue: nextTickCount,
          value: nextTickCount,
          lastTickTime: now,
          enabled: true,
        });

        setTimeout(() => {
          notify({ tick: false });
        }, 50);

        return nextTickCount;
      });
    }, periodMs);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      intervalRef.current = null;
    };
  }, [enabled, periodMs, notify]);

  const onFrequencyChange = (value) => {
    setFrequencyHz(value);
    notify({ frequencyHz: value });
  };

  const onStartStop = () => {
    const nextEnabled = !enabled;
    setEnabled(nextEnabled);
    notify({ enabled: nextEnabled });
  };

  const onReset = () => {
    setTickCount(0);
    setLastTickTime("");
    notify({
      tick: false,
      tickCount: 0,
      numericValue: 0,
      value: 0,
      lastTickTime: "",
    });
  };

  const onToggleExpanded = () => {
    const nextExpanded = !expanded;
    setExpanded(nextExpanded);
    notify({ expanded: nextExpanded });
  };

  return (
    <NodeCard
      title={
        <ExpandableTitle
          label="Timer / Rate"
          icon="⏱️"
          expanded={expanded}
          onToggle={onToggleExpanded}
        />
      }
      accent="yellow"
      size="sm"
      className="timer-rate-node"
      handles={
        <HandleWithLabel
          type="source"
          position={Position.Right}
          id="tick"
          label="tick"
          top="50%"
          color="yellow"
        />
      }
    >
      <LabeledInput
        label="Frequency [Hz]"
        type="number"
        step="0.1"
        min="0.001"
        value={frequencyHz}
        onChange={onFrequencyChange}
      />

      <div className="rf-grid-2">
        <button
          type="button"
          className="rf-button"
          onClick={onStartStop}
        >
          {enabled ? "Stop" : "Start"}
        </button>

        <button
          type="button"
          className="rf-button"
          onClick={onReset}
        >
          Reset
        </button>
      </div>

      {expanded && (
        <>
          <InfoCard title="Timer output">
            <div>
              enabled = <strong>{String(enabled)}</strong>
            </div>
            <div style={{ marginTop: "0.35rem" }}>
              tick count = <strong>{tickCount}</strong>
            </div>
            <div style={{ marginTop: "0.35rem", fontSize: "0.85em", opacity: 0.8 }}>
              period = <code>{formatNumber(periodMs)} ms</code>
            </div>
          </InfoCard>

          <InfoBadge size="xs">
            Emits a periodic <code>tick</code> signal at the selected frequency.
          </InfoBadge>
        </>
      )}
    </NodeCard>
  );
}