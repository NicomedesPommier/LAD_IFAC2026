import React, { useEffect, useMemo, useRef, useState } from "react";
import { Position, useStore } from "@xyflow/react";
import {
  NodeCard,
  LabeledInput,
  LabeledSelect,
  InfoCard,
  InfoBadge,
  HandleWithLabel,
  useNotifier,
} from "./components";

const LOOP_OPTIONS = ["off", "on"];

function toNumber(value, fallback = 1.0) {
  const n = Number.parseFloat(value);
  return Number.isFinite(n) ? n : fallback;
}

function parseMaybeJson(value) {
  if (value === null || value === undefined) return undefined;
  if (typeof value === "object") return value;
  if (typeof value === "boolean") return value;
  if (typeof value === "number") return value;
  if (typeof value !== "string") return undefined;

  const trimmed = value.trim();
  if (trimmed.length === 0) return undefined;

  if (
    (trimmed.startsWith("{") && trimmed.endsWith("}")) ||
    (trimmed.startsWith("[") && trimmed.endsWith("]"))
  ) {
    try {
      return JSON.parse(trimmed);
    } catch {
      return trimmed;
    }
  }

  return trimmed;
}

function extractBoolCandidate(sourceData) {
  if (!sourceData) return false;

  const candidates = [
    sourceData.boolValue,
    sourceData.value,
    sourceData.trigger,
    sourceData.enabled,
    sourceData.data,
    sourceData.message,
    sourceData.msg,
  ];

  for (const candidate of candidates) {
    const parsed = parseMaybeJson(candidate);

    if (typeof parsed === "boolean") return parsed;
    if (typeof parsed === "number") return parsed !== 0;

    if (typeof parsed === "string") {
      const text = parsed.trim().toLowerCase();
      if (text === "true") return true;
      if (text === "false") return false;
    }

    if (parsed && typeof parsed === "object" && "data" in parsed) {
      if (typeof parsed.data === "boolean") return parsed.data;
      if (typeof parsed.data === "number") return parsed.data !== 0;
      if (typeof parsed.data === "string") {
        const text = parsed.data.trim().toLowerCase();
        if (text === "true") return true;
        if (text === "false") return false;
      }
    }
  }

  return false;
}

function extractCommandId(sourceData) {
  if (!sourceData) return 0;
  return sourceData.commandId ?? sourceData.goalCommandId ?? sourceData.cancelCommandId ?? 0;
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

function useBoolInput(id, handleId) {
  return useStore((state) => {
    const edges = state.edges ?? [];
    const nodes = state.nodes ?? [];

    const edge = edges.find(
      (candidateEdge) =>
        candidateEdge.target === id &&
        candidateEdge.targetHandle === handleId
    );

    const sourceNode = edge ? nodes.find((node) => node.id === edge.source) : null;

    return {
      connected: Boolean(edge && sourceNode),
      sourceData: sourceNode?.data ?? null,
      commandId: extractCommandId(sourceNode?.data),
    };
  });
}

export default function RosbagPlayerNode({ id, data }) {
  const [bagPath, setBagPath] = useState(data.bagPath ?? "./bags/rosbag_experiment");
  const [rate, setRate] = useState(data.rate ?? "1.0");
  const [loopMode, setLoopMode] = useState(data.loopMode ?? "off");

  const [isPlaying, setIsPlaying] = useState(data.isPlaying ?? false);
  const [status, setStatus] = useState(data.status ?? "idle");
  const [commandId, setCommandId] = useState(data.commandId ?? 0);
  const [expanded, setExpanded] = useState(data.expanded ?? true);

  const playConnection = useBoolInput(id, "play");
  const pauseConnection = useBoolInput(id, "pause");
  const stopConnection = useBoolInput(id, "stop");

  const loop = loopMode === "on";

  const goal = useMemo(() => ({
    bagPath,
    rate: Math.max(toNumber(rate, 1.0), 0.001),
    loop,
  }), [bagPath, rate, loop]);

  const notify = useNotifier(id, data, () => ({
    inputType: "rosbagPlayer",
    outputType: "rosbagCommand",

    bagPath,
    rate,
    loopMode,
    loop,

    isPlaying,
    status,
    commandId,

    goal,

    value: {
      status,
      isPlaying,
      bagPath,
      goal,
    },

    expanded,
  }));

  const publishCommand = (command, nextStatus, nextIsPlaying) => {
    const nextCommandId = Date.now();

    setStatus(nextStatus);
    setIsPlaying(nextIsPlaying);
    setCommandId(nextCommandId);

    notify({
      command,
      commandId: nextCommandId,
      status: nextStatus,
      isPlaying: nextIsPlaying,
      goal,
      value: {
        command,
        commandId: nextCommandId,
        goal,
        bagPath,
      },
    });
  };

  const playBag = () => {
    publishCommand("play_bag", "play_requested", true);
  };

  const pauseBag = () => {
    publishCommand("pause_bag", "pause_requested", false);
  };

  const stopBag = () => {
    publishCommand("stop_bag", "stop_requested", false);
  };

  const lastPlayCommandRef = useRef(0);
  const lastPauseCommandRef = useRef(0);
  const lastStopCommandRef = useRef(0);

  useEffect(() => {
    const playSignal = extractBoolCandidate(playConnection.sourceData);

    if (
      playConnection.connected &&
      playSignal &&
      playConnection.commandId !== lastPlayCommandRef.current
    ) {
      lastPlayCommandRef.current = playConnection.commandId;
      playBag();
    }
  }, [playConnection.connected, playConnection.sourceData, playConnection.commandId]);

  useEffect(() => {
    const pauseSignal = extractBoolCandidate(pauseConnection.sourceData);

    if (
      pauseConnection.connected &&
      pauseSignal &&
      pauseConnection.commandId !== lastPauseCommandRef.current
    ) {
      lastPauseCommandRef.current = pauseConnection.commandId;
      pauseBag();
    }
  }, [pauseConnection.connected, pauseConnection.sourceData, pauseConnection.commandId]);

  useEffect(() => {
    const stopSignal = extractBoolCandidate(stopConnection.sourceData);

    if (
      stopConnection.connected &&
      stopSignal &&
      stopConnection.commandId !== lastStopCommandRef.current
    ) {
      lastStopCommandRef.current = stopConnection.commandId;
      stopBag();
    }
  }, [stopConnection.connected, stopConnection.sourceData, stopConnection.commandId]);

  useEffect(() => {
    notify({
      inputType: "rosbagPlayer",
      outputType: "rosbagCommand",
      bagPath,
      rate,
      loopMode,
      loop,
      isPlaying,
      status,
      commandId,
      goal,
      value: {
        status,
        isPlaying,
        bagPath,
        goal,
      },
      expanded,
    });
  }, [bagPath, rate, loopMode, loop, isPlaying, status, commandId, goal, expanded, notify]);

  const onToggleExpanded = () => {
    const nextExpanded = !expanded;
    setExpanded(nextExpanded);
    notify({ expanded: nextExpanded });
  };

  return (
    <NodeCard
      title={
        <ExpandableTitle
          label="Rosbag Player"
          icon="▶️"
          expanded={expanded}
          onToggle={onToggleExpanded}
        />
      }
      accent="green"
      size="md"
      className="rosbag-player-node"
      handles={
        <>
          <HandleWithLabel
            type="target"
            position={Position.Left}
            id="play"
            label="play"
            top="25%"
            color="green"
          />

          <HandleWithLabel
            type="target"
            position={Position.Left}
            id="pause"
            label="pause"
            top="50%"
            color="green"
          />

          <HandleWithLabel
            type="target"
            position={Position.Left}
            id="stop"
            label="stop"
            top="75%"
            color="green"
          />

          <HandleWithLabel
            type="source"
            position={Position.Right}
            id="status"
            label="status"
            top="40%"
            color="green"
          />

          <HandleWithLabel
            type="source"
            position={Position.Right}
            id="bag_path"
            label="bag_path"
            top="65%"
            color="green"
          />
        </>
      }
    >
      <LabeledInput
        label="Bag path"
        value={bagPath}
        onChange={(value) => {
          setBagPath(value);
          notify({ bagPath: value });
        }}
        placeholder="./bags/rosbag_experiment"
      />

      <div className="rf-grid-2">
        <LabeledInput
          label="Rate"
          type="number"
          step="0.1"
          min="0.001"
          value={rate}
          onChange={(value) => {
            setRate(value);
            notify({ rate: value });
          }}
        />

        <LabeledSelect
          label="Loop"
          value={loopMode}
          onChange={(value) => {
            setLoopMode(value);
            notify({ loopMode: value, loop: value === "on" });
          }}
          options={LOOP_OPTIONS}
        />
      </div>

      <div className="rf-grid-3">
        <button type="button" className="rf-button" onClick={playBag}>
          Play
        </button>

        <button type="button" className="rf-button" onClick={pauseBag}>
          Pause
        </button>

        <button type="button" className="rf-button" onClick={stopBag}>
          Stop
        </button>
      </div>

      {expanded && (
        <>
          <InfoCard title="Player status">
            <div>
              status = <strong>{status}</strong>
            </div>

            <div style={{ marginTop: "0.35rem" }}>
              playing = <code>{String(isPlaying)}</code>
            </div>

            <div style={{ marginTop: "0.35rem", fontSize: "0.85em", opacity: 0.8 }}>
              bag path = <code>{bagPath}</code>
            </div>

            <div style={{ marginTop: "0.35rem", fontSize: "0.85em", opacity: 0.8 }}>
              rate = <code>{goal.rate}</code>, loop = <code>{String(loop)}</code>
            </div>
          </InfoCard>

          <InfoBadge size="xs">
            Emits commands for <code>ros2 bag play</code>. Backend/code generator must execute them.
          </InfoBadge>
        </>
      )}
    </NodeCard>
  );
}