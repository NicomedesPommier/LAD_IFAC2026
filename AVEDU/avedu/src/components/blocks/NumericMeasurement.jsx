import React, { useEffect, useMemo, useRef, useState } from "react";
import { Position, useStore } from "@xyflow/react";
import {
  NodeCard,
  LabeledInput,
  LabeledSelect,
  InfoCard,
  HandleWithLabel,
  useNotifier,
} from "./components";

const PACKAGE_OPTIONS = [
  "std_msgs",
  "geometry_msgs",
  "nav_msgs",
  "sensor_msgs",
  "custom",
];

const MSG_TYPES_BY_PACKAGE = {
  std_msgs: [
    "Float32",
    "Float64",
    "Int32",
    "Int64",
    "UInt32",
    "UInt64",
    "Bool",
  ],

  geometry_msgs: [
    "Twist",
    "Vector3",
    "Point",
    "Pose",
    "PoseStamped",
  ],

  nav_msgs: [
    "Odometry",
  ],

  sensor_msgs: [
    "Imu",
    "Range",
    "BatteryState",
  ],

  custom: [
    "Custom",
  ],
};

const FIELD_PRESETS = {
  "std_msgs/Float32": ["data"],
  "std_msgs/Float64": ["data"],
  "std_msgs/Int32": ["data"],
  "std_msgs/Int64": ["data"],
  "std_msgs/UInt32": ["data"],
  "std_msgs/UInt64": ["data"],
  "std_msgs/Bool": ["data"],

  "geometry_msgs/Twist": [
    "linear.x",
    "linear.y",
    "linear.z",
    "angular.x",
    "angular.y",
    "angular.z",
  ],

  "geometry_msgs/Vector3": [
    "x",
    "y",
    "z",
  ],

  "geometry_msgs/Point": [
    "x",
    "y",
    "z",
  ],

  "geometry_msgs/Pose": [
    "position.x",
    "position.y",
    "position.z",
    "orientation",
    "orientation.x",
    "orientation.y",
    "orientation.z",
    "orientation.w",
  ],

  "geometry_msgs/PoseStamped": [
    "pose.position.x",
    "pose.position.y",
    "pose.position.z",
    "pose.orientation",
    "pose.orientation.x",
    "pose.orientation.y",
    "pose.orientation.z",
    "pose.orientation.w",
  ],

  "nav_msgs/Odometry": [
    "pose.pose.position.x",
    "pose.pose.position.y",
    "pose.pose.position.z",
    "pose.pose.orientation",
    "pose.pose.orientation.x",
    "pose.pose.orientation.y",
    "pose.pose.orientation.z",
    "pose.pose.orientation.w",
    "twist.twist.linear.x",
    "twist.twist.linear.y",
    "twist.twist.linear.z",
    "twist.twist.angular.x",
    "twist.twist.angular.y",
    "twist.twist.angular.z",
  ],

  "sensor_msgs/Imu": [
    "orientation",
    "orientation.x",
    "orientation.y",
    "orientation.z",
    "orientation.w",
    "angular_velocity.x",
    "angular_velocity.y",
    "angular_velocity.z",
    "linear_acceleration.x",
    "linear_acceleration.y",
    "linear_acceleration.z",
  ],

  "sensor_msgs/Range": [
    "range",
    "min_range",
    "max_range",
  ],

  "sensor_msgs/BatteryState": [
    "voltage",
    "current",
    "charge",
    "capacity",
    "percentage",
  ],

  "custom/Custom": [
    "data",
    "value",
  ],
};

const TRANSFORM_OPTIONS = [
  "none",
  "abs",
  "negate",
  "deg_to_rad",
  "rad_to_deg",
  "quaternion_to_yaw_rad",
  "quaternion_to_yaw_deg",
];

const UNIT_OPTIONS = [
  "none",
  "m",
  "m/s",
  "rad",
  "deg",
  "rad/s",
  "Hz",
  "V",
  "A",
  "%",
  "PWM",
];

function toNumber(value, fallback = 0.0) {
  if (typeof value === "boolean") {
    return value ? 1.0 : 0.0;
  }

  if (typeof value === "number") {
    return Number.isFinite(value) ? value : fallback;
  }

  if (typeof value === "string") {
    const trimmed = value.trim();

    if (trimmed.toLowerCase() === "true") return 1.0;
    if (trimmed.toLowerCase() === "false") return 0.0;

    const n = Number.parseFloat(trimmed);
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

function getByPath(obj, path) {
  if (obj === null || obj === undefined) return undefined;

  if (!path || path.trim() === "") return obj;

  const keys = path.split(".").map((k) => k.trim()).filter(Boolean);

  let cur = obj;

  for (const key of keys) {
    if (cur === null || cur === undefined) return undefined;

    if (Array.isArray(cur)) {
      const index = Number.parseInt(key, 10);
      if (!Number.isInteger(index)) return undefined;
      cur = cur[index];
    } else if (typeof cur === "object" && key in cur) {
      cur = cur[key];
    } else {
      return undefined;
    }
  }

  return cur;
}

function quaternionToYaw(q) {
  if (!q || typeof q !== "object") return undefined;

  const x = toNumber(q.x, 0.0);
  const y = toNumber(q.y, 0.0);
  const z = toNumber(q.z, 0.0);
  const w = toNumber(q.w, 1.0);

  const sinyCosp = 2.0 * (w * z + x * y);
  const cosyCosp = 1.0 - 2.0 * (y * y + z * z);

  return Math.atan2(sinyCosp, cosyCosp);
}

function applyTransform(rawValue, transform, fallback = 0.0) {
  if (transform === "quaternion_to_yaw_rad") {
    const yaw = quaternionToYaw(rawValue);
    return Number.isFinite(yaw) ? yaw : fallback;
  }

  if (transform === "quaternion_to_yaw_deg") {
    const yaw = quaternionToYaw(rawValue);
    return Number.isFinite(yaw) ? yaw * 180.0 / Math.PI : fallback;
  }

  const numeric = toNumber(rawValue, fallback);

  switch (transform) {
    case "abs":
      return Math.abs(numeric);

    case "negate":
      return -numeric;

    case "deg_to_rad":
      return numeric * Math.PI / 180.0;

    case "rad_to_deg":
      return numeric * 180.0 / Math.PI;

    case "none":
    default:
      return numeric;
  }
}

function extractCandidateFromSourceData(sourceData) {
  if (!sourceData) return undefined;

  const candidates = [
    sourceData.lastMessage,
    sourceData.latestMessage,
    sourceData.message,
    sourceData.msg,
    sourceData.data,
    sourceData.value,
    sourceData.numericValue,
    sourceData.output,
  ];

  for (const candidate of candidates) {
    if (
      candidate !== undefined &&
      candidate !== null &&
      candidate !== ""
    ) {
      return parseMaybeJson(candidate);
    }
  }

  return undefined;
}

function formatPreview(value) {
  if (value === undefined) return "undefined";
  if (value === null) return "null";

  if (typeof value === "object") {
    try {
      return JSON.stringify(value, null, 2);
    } catch {
      return String(value);
    }
  }

  return String(value);
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

export default function NumericMeasurementNode({ id, data }) {
  const [msgPackage, setMsgPackage] = useState(data.msgPackage ?? "std_msgs");
  const [msgType, setMsgType] = useState(data.msgType ?? "Float32");
  const [fieldPath, setFieldPath] = useState(data.fieldPath ?? "data");

  const [transform, setTransform] = useState(data.transform ?? "none");
  const [unit, setUnit] = useState(data.unit ?? "none");

  const [fallbackValue, setFallbackValue] = useState(
    data.fallbackValue ?? "0.0"
  );

  const [manualMessage, setManualMessage] = useState(
    data.manualMessage ?? '{"data": 0.0}'
  );

  const [expanded, setExpanded] = useState(data.expanded ?? true);

  const connectionInfo = useStore((state) => {
    const edges = state.edges ?? [];
    const nodes = state.nodes ?? [];

    const incomingEdge = edges.find(
      (edge) =>
        edge.target === id &&
        (!edge.targetHandle || edge.targetHandle === "msg")
    );

    const sourceNode = incomingEdge
      ? nodes.find((node) => node.id === incomingEdge.source)
      : null;

    return {
      isConnected: Boolean(incomingEdge && sourceNode),
      sourceNodeId: sourceNode?.id ?? "",
      sourceHandle: incomingEdge?.sourceHandle ?? "",
      sourceData: sourceNode?.data ?? null,
    };
  });

  const notify = useNotifier(id, data, () => ({
    inputType: "numericMeasurement",
    outputType: "number",

    msgPackage,
    msgType,
    fieldPath,
    transform,
    unit,
    fallbackValue,
    manualMessage,
    expanded,
  }));

  const fieldOptions = useMemo(() => {
    const key = `${msgPackage}/${msgType}`;
    return FIELD_PRESETS[key] ?? ["data", "value"];
  }, [msgPackage, msgType]);

  const connectedMessage = useMemo(() => {
    return extractCandidateFromSourceData(connectionInfo.sourceData);
  }, [connectionInfo.sourceData]);

  const manualParsedMessage = useMemo(() => {
    return parseMaybeJson(manualMessage);
  }, [manualMessage]);

  const activeMessage = useMemo(() => {
    if (connectedMessage !== undefined) return connectedMessage;
    return manualParsedMessage;
  }, [connectedMessage, manualParsedMessage]);

  const rawExtractedValue = useMemo(() => {
    return getByPath(activeMessage, fieldPath);
  }, [activeMessage, fieldPath]);

  const fallbackNumeric = useMemo(() => {
    return toNumber(fallbackValue, 0.0);
  }, [fallbackValue]);

  const numericValue = useMemo(() => {
    return applyTransform(rawExtractedValue, transform, fallbackNumeric);
  }, [rawExtractedValue, transform, fallbackNumeric]);

  const lastPublishedRef = useRef("");

  useEffect(() => {
    const payload = {
      inputType: "numericMeasurement",
      outputType: "number",

      value: String(numericValue),
      measurementValue: String(numericValue),
      numericValue,

      rawExtractedValue,

      msgPackage,
      msgType,
      fieldPath,
      transform,
      unit,
      fallbackValue,

      sourceConnected: connectionInfo.isConnected,
      sourceNodeId: connectionInfo.sourceNodeId,
      sourceHandle: connectionInfo.sourceHandle,
    };

    const key = JSON.stringify(payload);

    if (lastPublishedRef.current !== key) {
      lastPublishedRef.current = key;
      notify(payload);
    }
  }, [
    numericValue,
    rawExtractedValue,
    msgPackage,
    msgType,
    fieldPath,
    transform,
    unit,
    fallbackValue,
    connectionInfo.isConnected,
    connectionInfo.sourceNodeId,
    connectionInfo.sourceHandle,
    notify,
  ]);

  const onChange = (setter, key) => (v) => {
    setter(v);
    notify({ [key]: v });
  };

  const onPackageChange = (v) => {
    const nextTypes = MSG_TYPES_BY_PACKAGE[v] ?? ["Custom"];
    const nextType = nextTypes[0];

    setMsgPackage(v);
    setMsgType(nextType);

    const nextFieldOptions = FIELD_PRESETS[`${v}/${nextType}`] ?? ["data"];
    const nextFieldPath = nextFieldOptions[0];

    setFieldPath(nextFieldPath);

    notify({
      msgPackage: v,
      msgType: nextType,
      fieldPath: nextFieldPath,
    });
  };

  const onMsgTypeChange = (v) => {
    setMsgType(v);

    const nextFieldOptions = FIELD_PRESETS[`${msgPackage}/${v}`] ?? ["data"];
    const nextFieldPath = nextFieldOptions[0];

    setFieldPath(nextFieldPath);

    notify({
      msgType: v,
      fieldPath: nextFieldPath,
    });
  };

  const onToggleExpanded = () => {
    const nextExpanded = !expanded;
    setExpanded(nextExpanded);
    notify({ expanded: nextExpanded });
  };

  const unitLabel = unit === "none" ? "" : ` ${unit}`;

  return (
    <NodeCard
      title={
        <ExpandableTitle
          label="Numeric Measurement"
          icon="📏"
          expanded={expanded}
          onToggle={onToggleExpanded}
        />
      }
      accent="cyan"
      size="md"
      className="numeric-measurement-node"
      handles={
        <>
          <HandleWithLabel
            type="target"
            position={Position.Left}
            id="msg"
            label="msg"
            top="50%"
            color="cyan"
          />

          <HandleWithLabel
            type="source"
            position={Position.Right}
            id="value"
            label="value"
            top="50%"
            color="cyan"
          />
        </>
      }
    >
      <div className="rf-grid-2">
        <LabeledSelect
          label="Message package"
          value={msgPackage}
          onChange={onPackageChange}
          options={PACKAGE_OPTIONS}
        />

        <LabeledSelect
          label="Message type"
          value={msgType}
          onChange={onMsgTypeChange}
          options={MSG_TYPES_BY_PACKAGE[msgPackage] ?? ["Custom"]}
        />
      </div>

      <LabeledSelect
        label="Field preset"
        value={fieldPath}
        onChange={onChange(setFieldPath, "fieldPath")}
        options={fieldOptions}
      />

      <LabeledInput
        label="Field path"
        value={fieldPath}
        onChange={onChange(setFieldPath, "fieldPath")}
        placeholder="data"
      />

      <LabeledSelect
        label="Transform"
        value={transform}
        onChange={onChange(setTransform, "transform")}
        options={TRANSFORM_OPTIONS}
      />

      {expanded && (
        <>
          <div className="rf-grid-2">
            <LabeledInput
              label="Fallback value"
              type="number"
              step="0.1"
              value={fallbackValue}
              onChange={onChange(setFallbackValue, "fallbackValue")}
              placeholder="0.0"
            />

            <LabeledSelect
              label="Unit"
              value={unit}
              onChange={onChange(setUnit, "unit")}
              options={UNIT_OPTIONS}
            />
          </div>

          {!connectionInfo.isConnected && (
            <LabeledInput
              label="Manual test message"
              value={manualMessage}
              onChange={onChange(setManualMessage, "manualMessage")}
              placeholder='{"data": 1.0}'
            />
          )}

          <InfoCard title="Measurement output">
            <div>
              <code>value</code> ={" "}
              <strong>
                {Number.isFinite(numericValue)
                  ? numericValue.toFixed(4)
                  : "0.0000"}
                {unitLabel}
              </strong>
            </div>

            <div style={{ marginTop: "0.35rem", fontSize: "0.85em", opacity: 0.8 }}>
              Source:{" "}
              {connectionInfo.isConnected
                ? `connected node ${connectionInfo.sourceNodeId}`
                : "manual test message"}
            </div>

            <div style={{ marginTop: "0.35rem", fontSize: "0.85em", opacity: 0.8 }}>
              Field: <code>{fieldPath}</code>
            </div>
          </InfoCard>

          <InfoCard title="Raw extracted value">
            <pre style={{ margin: 0, whiteSpace: "pre-wrap", fontSize: "0.75em" }}>
              {formatPreview(rawExtractedValue)}
            </pre>
          </InfoCard>
        </>
      )}
    </NodeCard>
  );
}