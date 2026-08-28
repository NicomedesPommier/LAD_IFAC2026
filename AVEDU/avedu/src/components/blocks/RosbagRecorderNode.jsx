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

const MODE_OPTIONS = ["selected_topics", "all_topics"];

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
    sourceData.lastMessage,
    sourceData.latestMessage,
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

function parseTopics(topicsText) {
  return String(topicsText ?? "")
    .split(",")
    .map((topic) => topic.trim())
    .filter(Boolean);
}

function joinPath(outputDir, bagName) {
  const cleanDir = String(outputDir ?? "").replace(/\/+$/, "");
  const cleanName = String(bagName ?? "").replace(/^\/+/, "");
  if (!cleanDir) return cleanName;
  if (!cleanName) return cleanDir;
  return `${cleanDir}/${cleanName}`;
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

export default function RosbagRecorderNode({ id, data }) {
  const [mode, setMode] = useState(data.mode ?? "selected_topics");
  const [topicsText, setTopicsText] = useState(
    data.topicsText ?? "/cmd_vel, /odom, /scan"
  );
  const [bagName, setBagName] = useState(data.bagName ?? "rosbag_experiment");
  const [outputDir, setOutputDir] = useState(data.outputDir ?? "./bags");

  const [isRecording, setIsRecording] = useState(data.isRecording ?? false);
  const [status, setStatus] = useState(data.status ?? "idle");
  const [commandId, setCommandId] = useState(data.commandId ?? 0);
  const [expanded, setExpanded] = useState(data.expanded ?? true);

  const startConnection = useStore((state) => {
    const edges = state.edges ?? [];
    const nodes = state.nodes ?? [];

    const edge = edges.find(
      (candidateEdge) =>
        candidateEdge.target === id &&
        candidateEdge.targetHandle === "start"
    );

    const sourceNode = edge ? nodes.find((node) => node.id === edge.source) : null;

    return {
      connected: Boolean(edge && sourceNode),
      sourceData: sourceNode?.data ?? null,
      commandId: extractCommandId(sourceNode?.data),
    };
  });

  const stopConnection = useStore((state) => {
    const edges = state.edges ?? [];
    const nodes = state.nodes ?? [];

    const edge = edges.find(
      (candidateEdge) =>
        candidateEdge.target === id &&
        candidateEdge.targetHandle === "stop"
    );

    const sourceNode = edge ? nodes.find((node) => node.id === edge.source) : null;

    return {
      connected: Boolean(edge && sourceNode),
      sourceData: sourceNode?.data ?? null,
      commandId: extractCommandId(sourceNode?.data),
    };
  });

  const topics = useMemo(() => parseTopics(topicsText), [topicsText]);
  const bagPath = useMemo(() => joinPath(outputDir, bagName), [outputDir, bagName]);

  const goal = useMemo(() => ({
    mode,
    topics: mode === "all_topics" ? [] : topics,
    allTopics: mode === "all_topics",
    bagName,
    outputDir,
    bagPath,
  }), [mode, topics, bagName, outputDir, bagPath]);

  const notify = useNotifier(id, data, () => ({
    inputType: "rosbagRecorder",
    outputType: "rosbagCommand",

    mode,
    topicsText,
    topics,
    bagName,
    outputDir,
    bagPath,

    isRecording,
    status,
    commandId,

    value: {
      status,
      isRecording,
      bagPath,
      goal,
    },

    expanded,
  }));

  const publishState = (extra = {}) => {
    notify({
      inputType: "rosbagRecorder",
      outputType: "rosbagCommand",

      mode,
      topicsText,
      topics,
      bagName,
      outputDir,
      bagPath,

      isRecording,
      status,
      commandId,

      value: {
        status,
        isRecording,
        bagPath,
        goal,
      },

      expanded,
      ...extra,
    });
  };

  const startRecording = () => {
    const nextCommandId = Date.now();

    setIsRecording(true);
    setStatus("record_requested");
    setCommandId(nextCommandId);

    notify({
      command: "start_recording",
      commandId: nextCommandId,
      isRecording: true,
      status: "record_requested",
      goal,
      value: {
        command: "start_recording",
        commandId: nextCommandId,
        goal,
        bagPath,
      },
    });
  };

  const stopRecording = () => {
    const nextCommandId = Date.now();

    setIsRecording(false);
    setStatus("stop_requested");
    setCommandId(nextCommandId);

    notify({
      command: "stop_recording",
      commandId: nextCommandId,
      isRecording: false,
      status: "stop_requested",
      goal,
      value: {
        command: "stop_recording",
        commandId: nextCommandId,
        bagPath,
      },
    });
  };

  const lastStartCommandRef = useRef(0);
  const lastStopCommandRef = useRef(0);

  useEffect(() => {
    const startSignal = extractBoolCandidate(startConnection.sourceData);

    if (
      startConnection.connected &&
      startSignal &&
      startConnection.commandId !== lastStartCommandRef.current
    ) {
      lastStartCommandRef.current = startConnection.commandId;
      startRecording();
    }
  }, [startConnection.connected, startConnection.sourceData, startConnection.commandId]);

  useEffect(() => {
    const stopSignal = extractBoolCandidate(stopConnection.sourceData);

    if (
      stopConnection.connected &&
      stopSignal &&
      stopConnection.commandId !== lastStopCommandRef.current
    ) {
      lastStopCommandRef.current = stopConnection.commandId;
      stopRecording();
    }
  }, [stopConnection.connected, stopConnection.sourceData, stopConnection.commandId]);

  useEffect(() => {
    publishState();
  }, [mode, topicsText, bagName, outputDir, isRecording, status, commandId, expanded]);

  const onToggleExpanded = () => {
    const nextExpanded = !expanded;
    setExpanded(nextExpanded);
    notify({ expanded: nextExpanded });
  };

  return (
    <NodeCard
      title={
        <ExpandableTitle
          label="Rosbag Recorder"
          icon="⏺️"
          expanded={expanded}
          onToggle={onToggleExpanded}
        />
      }
      accent="red"
      size="md"
      className="rosbag-recorder-node"
      handles={
        <>
          <HandleWithLabel
            type="target"
            position={Position.Left}
            id="start"
            label="start"
            top="35%"
            color="red"
          />

          <HandleWithLabel
            type="target"
            position={Position.Left}
            id="stop"
            label="stop"
            top="65%"
            color="red"
          />

          <HandleWithLabel
            type="source"
            position={Position.Right}
            id="status"
            label="status"
            top="40%"
            color="red"
          />

          <HandleWithLabel
            type="source"
            position={Position.Right}
            id="bag_path"
            label="bag_path"
            top="65%"
            color="red"
          />
        </>
      }
    >
      <LabeledSelect
        label="Record mode"
        value={mode}
        onChange={(value) => {
          setMode(value);
          notify({ mode: value });
        }}
        options={MODE_OPTIONS}
      />

      {mode === "selected_topics" && (
        <LabeledInput
          label="Topics"
          value={topicsText}
          onChange={(value) => {
            setTopicsText(value);
            notify({ topicsText: value });
          }}
          placeholder="/cmd_vel, /odom, /scan"
        />
      )}

      <div className="rf-grid-2">
        <button
          type="button"
          className="rf-button"
          onClick={startRecording}
          disabled={isRecording}
        >
          Record
        </button>

        <button
          type="button"
          className="rf-button"
          onClick={stopRecording}
          disabled={!isRecording}
        >
          Stop
        </button>
      </div>

      {expanded && (
        <>
          <LabeledInput
            label="Bag name"
            value={bagName}
            onChange={(value) => {
              setBagName(value);
              notify({ bagName: value });
            }}
            placeholder="rosbag_experiment"
          />

          <LabeledInput
            label="Output directory"
            value={outputDir}
            onChange={(value) => {
              setOutputDir(value);
              notify({ outputDir: value });
            }}
            placeholder="./bags"
          />

          <InfoCard title="Recorder status">
            <div>
              status = <strong>{status}</strong>
            </div>

            <div style={{ marginTop: "0.35rem" }}>
              recording = <code>{String(isRecording)}</code>
            </div>

            <div style={{ marginTop: "0.35rem", fontSize: "0.85em", opacity: 0.8 }}>
              bag path = <code>{bagPath}</code>
            </div>

            <div style={{ marginTop: "0.35rem", fontSize: "0.85em", opacity: 0.8 }}>
              topics = <code>{mode === "all_topics" ? "all topics" : topics.join(", ")}</code>
            </div>
          </InfoCard>

          <InfoBadge size="xs">
            Emits commands for <code>ros2 bag record</code>. Backend/code generator must execute them.
          </InfoBadge>
        </>
      )}
    </NodeCard>
  );
}