import React, { useEffect, useMemo, useRef, useState } from "react";
import { Position, useStore } from "@xyflow/react";
import {
  NodeCard,
  LabeledInput,
  InfoCard,
  InfoBadge,
  HandleWithLabel,
  useNotifier,
} from "./components";

const COMPONENTS = [
  { key: "linear_x", label: "linear_x", group: "linear", axis: "x", manualKey: "manualLinearX", defaultValue: "0.0", top: "18%" },
  { key: "linear_y", label: "linear_y", group: "linear", axis: "y", manualKey: "manualLinearY", defaultValue: "0.0", top: "31%" },
  { key: "linear_z", label: "linear_z", group: "linear", axis: "z", manualKey: "manualLinearZ", defaultValue: "0.0", top: "44%" },
  { key: "angular_x", label: "angular_x", group: "angular", axis: "x", manualKey: "manualAngularX", defaultValue: "0.0", top: "57%" },
  { key: "angular_y", label: "angular_y", group: "angular", axis: "y", manualKey: "manualAngularY", defaultValue: "0.0", top: "70%" },
  { key: "angular_z", label: "angular_z", group: "angular", axis: "z", manualKey: "manualAngularZ", defaultValue: "0.0", top: "83%" },
];

const MAIN_KEYS = ["linear_x", "angular_z"];

function toNumber(value, fallback = 0.0) {
  if (typeof value === "boolean") return value ? 1.0 : 0.0;

  if (typeof value === "number") {
    return Number.isFinite(value) ? value : fallback;
  }

  if (typeof value === "string") {
    const n = Number.parseFloat(value.trim());
    return Number.isFinite(n) ? n : fallback;
  }

  return fallback;
}

function parseMaybeJson(value) {
  if (value === null || value === undefined) return undefined;
  if (typeof value === "object") return value;
  if (typeof value === "number") return value;
  if (typeof value === "boolean") return value;
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

function extractNumericCandidate(sourceData) {
  if (!sourceData) return undefined;

  const candidates = [
    sourceData.numericValue,
    sourceData.value,
    sourceData.action,
    sourceData.control,
    sourceData.output,
    sourceData.error,
    sourceData.errorValue,
    sourceData.measurementValue,
    sourceData.setpointValue,
    sourceData.data,
    sourceData.lastMessage,
    sourceData.latestMessage,
    sourceData.message,
    sourceData.msg,
  ];

  for (const candidate of candidates) {
    if (candidate !== undefined && candidate !== null && candidate !== "") {
      const parsed = parseMaybeJson(candidate);

      if (typeof parsed === "object" && parsed !== null && "data" in parsed) {
        const n = toNumber(parsed.data, NaN);
        if (Number.isFinite(n)) return n;
      }

      const n = toNumber(parsed, NaN);
      if (Number.isFinite(n)) return n;
    }
  }

  return undefined;
}

function formatNumber(value, digits = 3) {
  const n = toNumber(value, NaN);
  if (!Number.isFinite(n)) return "invalid";
  return n.toFixed(digits);
}

function ExpandableTitle({ label, icon, expanded, onToggle }) {
  return (
    <div
      onClick={onToggle}
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        cursor: "pointer",
      }}
    >
      <span>{icon} {label}</span>
      <span style={{ fontSize: "0.75em" }}>{expanded ? "▼" : "▶"}</span>
    </div>
  );
}

export default function TwistBuilderNode({ id, data }) {
  const [manualValues, setManualValues] = useState({
    manualLinearX: data.manualLinearX ?? data.linearX ?? "0.0",
    manualLinearY: data.manualLinearY ?? data.linearY ?? "0.0",
    manualLinearZ: data.manualLinearZ ?? data.linearZ ?? "0.0",
    manualAngularX: data.manualAngularX ?? data.angularX ?? "0.0",
    manualAngularY: data.manualAngularY ?? data.angularY ?? "0.0",
    manualAngularZ: data.manualAngularZ ?? data.angularZ ?? "0.0",
  });

  const [expanded, setExpanded] = useState(data.expanded ?? true);

  const connections = useStore((state) => {
    const edges = state.edges ?? [];
    const nodes = state.nodes ?? [];

    return COMPONENTS.map((component) => {
      const edge = edges.find(
        (candidateEdge) =>
          candidateEdge.target === id &&
          candidateEdge.targetHandle === component.key
      );

      const sourceNode = edge
        ? nodes.find((node) => node.id === edge.source)
        : null;

      return {
        key: component.key,
        connected: Boolean(edge && sourceNode),
        sourceNodeId: sourceNode?.id ?? "",
        sourceHandle: edge?.sourceHandle ?? "",
        sourceData: sourceNode?.data ?? null,
      };
    });
  });

  const connectionMap = useMemo(() => {
    return Object.fromEntries(
      connections.map((connection) => [connection.key, connection])
    );
  }, [connections]);

  const values = useMemo(() => {
    const nextValues = {};

    COMPONENTS.forEach((component) => {
      const connection = connectionMap[component.key];
      const connectedValue = extractNumericCandidate(connection?.sourceData);

      nextValues[component.key] = Number.isFinite(connectedValue)
        ? connectedValue
        : toNumber(manualValues[component.manualKey], 0.0);
    });

    return nextValues;
  }, [connectionMap, manualValues]);

  const twist = useMemo(() => {
    return {
      linear: {
        x: values.linear_x,
        y: values.linear_y,
        z: values.linear_z,
      },
      angular: {
        x: values.angular_x,
        y: values.angular_y,
        z: values.angular_z,
      },
    };
  }, [values]);

  const connectedCount = useMemo(() => {
    return connections.filter((connection) => connection.connected).length;
  }, [connections]);

  const notify = useNotifier(id, data, () => ({
    inputType: "twistBuilder",
    outputType: "geometry_msgs/Twist",
    messagePackage: "geometry_msgs",
    messageType: "Twist",

    twist,
    value: twist,

    linearX: values.linear_x,
    linearY: values.linear_y,
    linearZ: values.linear_z,
    angularX: values.angular_x,
    angularY: values.angular_y,
    angularZ: values.angular_z,

    ...manualValues,

    connectedCount,
    expanded,
  }));

  const lastPublishedRef = useRef("");

  useEffect(() => {
    const payload = {
      inputType: "twistBuilder",
      outputType: "geometry_msgs/Twist",
      messagePackage: "geometry_msgs",
      messageType: "Twist",

      twist,
      value: twist,

      linearX: values.linear_x,
      linearY: values.linear_y,
      linearZ: values.linear_z,
      angularX: values.angular_x,
      angularY: values.angular_y,
      angularZ: values.angular_z,

      ...manualValues,

      connectedCount,
      expanded,
    };

    const key = JSON.stringify(payload);

    if (lastPublishedRef.current !== key) {
      lastPublishedRef.current = key;
      notify(payload);
    }
  }, [
    twist,
    values,
    manualValues,
    connectedCount,
    expanded,
    notify,
  ]);

  const onManualChange = (manualKey) => (value) => {
    const nextManualValues = {
      ...manualValues,
      [manualKey]: value,
    };

    setManualValues(nextManualValues);
    notify(nextManualValues);
  };

  const onToggleExpanded = () => {
    const nextExpanded = !expanded;
    setExpanded(nextExpanded);
    notify({ expanded: nextExpanded });
  };

  const renderInput = (component) => {
    const connection = connectionMap[component.key];
    const isConnected = connection?.connected ?? false;

    return (
      <LabeledInput
        key={component.key}
        label={isConnected ? `${component.label} connected` : component.label}
        type="number"
        step="0.1"
        value={
          isConnected
            ? formatNumber(values[component.key])
            : manualValues[component.manualKey]
        }
        onChange={onManualChange(component.manualKey)}
        disabled={isConnected}
        placeholder={component.defaultValue}
      />
    );
  };

  const visibleComponents = expanded
    ? COMPONENTS
    : COMPONENTS.filter((component) => MAIN_KEYS.includes(component.key));

  return (
    <NodeCard
      title={
        <ExpandableTitle
          label="Twist Builder"
          icon="🌀"
          expanded={expanded}
          onToggle={onToggleExpanded}
        />
      }
      accent="green"
      size="md"
      className="twist-builder-node"
      handles={
        <>
          {COMPONENTS.filter(
            (component) =>
              expanded || MAIN_KEYS.includes(component.key)
          ).map((component) => (
            <HandleWithLabel
              key={component.key}
              type="target"
              position={Position.Left}
              id={component.key}
              label={component.label}
              top={component.top}
              color="green"
            />
          ))}

          <HandleWithLabel
            type="source"
            position={Position.Right}
            id="twist"
            label="twist"
            top="50%"
            color="green"
          />
        </>
      }
    >
      <div className={expanded ? "rf-grid-2" : ""}>
        {visibleComponents.map(renderInput)}
      </div>

      <InfoCard title="Twist output">
        <div>
          linear: x=<code>{formatNumber(twist.linear.x)}</code>,{" "}
          y=<code>{formatNumber(twist.linear.y)}</code>,{" "}
          z=<code>{formatNumber(twist.linear.z)}</code>
        </div>

        <div style={{ marginTop: "0.35rem" }}>
          angular: x=<code>{formatNumber(twist.angular.x)}</code>,{" "}
          y=<code>{formatNumber(twist.angular.y)}</code>,{" "}
          z=<code>{formatNumber(twist.angular.z)}</code>
        </div>
      </InfoCard>

      {expanded && (
        <InfoBadge size="xs">
          Builds a <code>geometry_msgs/Twist</code> message for topics like{" "}
          <code>/cmd_vel</code>.
        </InfoBadge>
      )}
    </NodeCard>
  );
}