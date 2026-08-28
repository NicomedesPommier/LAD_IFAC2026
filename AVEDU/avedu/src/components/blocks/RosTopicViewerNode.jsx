import React, { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { Position, useStore } from "@xyflow/react";
import HandleWithLabel from "./HandleWithLabel";
import { useRoslib } from "../../hooks/useRoslib";
import { enforceWorkspace } from "./ros2-helpers/utils";
import "../../styles/components/_ros-subscriber-node.scss";

/**
 * Message type configurations for different ROS2 message types
 */
const MESSAGE_TYPES = {
  "std_msgs": [
    { type: "String", format: "text", example: "Hello World" },
    { type: "Int32", format: "integer", example: "42" },
    { type: "Int64", format: "integer", example: "1000" },
    { type: "Float32", format: "float", example: "3.14" },
    { type: "Float64", format: "float", example: "3.14159" },
    { type: "Bool", format: "boolean", example: "true" },
    { type: "UInt8", format: "integer", example: "255" },
    { type: "UInt16", format: "integer", example: "65535" },
  ],
  "geometry_msgs": [
    { type: "Point", format: "vector3", example: "{x: 0.0, y: 0.0, z: 0.0}" },
    { type: "Pose", format: "pose", example: "{position: {...}, orientation: {...}}" },
    { type: "Twist", format: "twist", example: "{linear: {x,y,z}, angular: {x,y,z}}" },
    { type: "Vector3", format: "vector3", example: "{x: 0.0, y: 0.0, z: 0.0}" },
    { type: "Quaternion", format: "quaternion", example: "{x: 0, y: 0, z: 0, w: 1}" },
  ],
  "sensor_msgs": [
    { type: "Image", format: "image", example: "{width, height, encoding, data}" },
    { type: "LaserScan", format: "lidar", example: "{ranges[], intensities[], ...}" },
    { type: "PointCloud2", format: "pointcloud", example: "{points[], ...}" },
    { type: "Imu", format: "imu", example: "{orientation, angular_velocity, ...}" },
    { type: "CameraInfo", format: "camera", example: "{width, height, K[], ...}" },
    { type: "Temperature", format: "float", example: "{temperature: 25.5}" },
  ],
  "nav_msgs": [
    { type: "Odometry", format: "odometry", example: "{pose, twist, ...}" },
    { type: "Path", format: "path", example: "{poses[], ...}" },
  ],
};

function safeJsonParse(value) {
  if (value === undefined || value === null || value === "") {
    return null;
  }

  if (typeof value === "object") {
    return value;
  }

  try {
    return JSON.parse(value);
  } catch {
    return value;
  }
}

function formatNumber(value, digits = 3) {
  if (typeof value !== "number" || Number.isNaN(value)) {
    return "N/A";
  }

  return Number.isInteger(value) ? String(value) : value.toFixed(digits);
}

/**
 * RosTopicViewerNode - ROS2 Topic Viewer Block
 *
 * This block is based on RosSubscriberNode, but its purpose is visualization.
 * It lets the user select a ROS2 topic and message type, then display the
 * latest received message in compact or raw JSON mode.
 */
export default function RosTopicViewerNode({ id, data }) {
  // Get edges and nodes to determine connections
  const edges = useStore((state) => state.edges);
  const nodes = useStore((state) => state.nodes);

  const connectedHandles = edges
    .filter((e) => e.target === id)
    .map((e) => e.targetHandle);

  const isTopicConnected = connectedHandles.includes("topic");

  // State management
  const [topicViewerName, setTopicViewerName] = useState(data.topicViewerName ?? "topic_viewer_node");
  const [topicName, setTopicName] = useState(data.topicName ?? "/chatter");
  const [msgPackage, setMsgPackage] = useState(data.msgPackage ?? "std_msgs");
  const [msgType, setMsgType] = useState(data.msgType ?? "String");
  const [queueSize, setQueueSize] = useState(data.queueSize ?? "10");
  const [displayMode, setDisplayMode] = useState(data.displayMode ?? "compact");
  const [expanded, setExpanded] = useState(data.expanded ?? true);
  const [lastMessage, setLastMessage] = useState(data.lastMessage ?? "");
  const [messageCount, setMessageCount] = useState(data.messageCount ?? 0);

  // Get message format info
  const messageInfo = MESSAGE_TYPES[msgPackage]?.find(m => m.type === msgType) ||
    { format: "text", example: "data" };

  // ── Live rosbridge subscription ────────────────────────────────────────────
  // The real topic lives under the workspace namespace, so prefix it exactly
  // like the publisher / subscriber code generators do (enforceWorkspace skips
  // the prefix in QCar mode or when the topic is already namespaced).
  const { connected, subscribeTopic } = useRoslib();

  const fullTopic = useMemo(
    () => enforceWorkspace(topicName, { canvasId: data.canvasId, isQCarMode: data.isQCarMode }),
    [topicName, data.canvasId, data.isQCarMode]
  );

  useEffect(() => {
    if (!connected || !fullTopic) return undefined;
    const messageType = `${msgPackage}/${msgType}`;
    return subscribeTopic(
      fullTopic,
      messageType,
      (msg) => {
        setLastMessage(JSON.stringify(msg));
        setMessageCount((c) => c + 1);
      },
      { throttle_rate: 100, queue_size: 1 }
    );
  }, [connected, subscribeTopic, fullTopic, msgPackage, msgType]);

  // Track previous values from connections to prevent infinite loops
  const prevConnectedValuesRef = useRef({});

  // Store the onChange callback in a ref to keep it stable
  const onChangeRef = useRef(data.onChange);
  useEffect(() => {
    onChangeRef.current = data.onChange;
  }, [data.onChange]);

  // Stable notify function using ref
  const notifyChange = useCallback((updates) => {
    if (onChangeRef.current) {
      onChangeRef.current(id, updates);
    }
  }, [id]);

  // Update state when external connections provide topic name
  useEffect(() => {
    const srcFor = (handleId) => {
      const edge = edges.find((e) => e.target === id && e.targetHandle === handleId);
      if (!edge) return null;
      return nodes.find((n) => n.id === edge.source);
    };

    if (isTopicConnected) {
      const topicSrc = srcFor("topic");
      if (topicSrc?.data?.value) {
        const value = topicSrc.data.value;

        // Only update if value actually changed
        if (value !== prevConnectedValuesRef.current.topicName) {
          prevConnectedValuesRef.current.topicName = value;
          setTopicName(value);
        }
      }
    }
  }, [edges, nodes, id, isTopicConnected]);

  /**
   * Update latest message from runtime.
   *
   * This assumes the runtime layer, backend, rosbridge layer, or generated
   * ROS2 code updates data.lastMessage when a new message arrives.
   */
  useEffect(() => {
    if (data.lastMessage !== undefined) {
      const value = typeof data.lastMessage === "object"
        ? JSON.stringify(data.lastMessage)
        : String(data.lastMessage);

      if (value !== prevConnectedValuesRef.current.lastMessage) {
        prevConnectedValuesRef.current.lastMessage = value;
        setLastMessage(value);

        setMessageCount((prev) => {
          const next = prev + 1;

          notifyChange({
            topicViewerName,
            topicName,
            msgPackage,
            msgType,
            queueSize,
            displayMode,
            lastMessage: value,
            messageCount: next,
            value,
          });

          return next;
        });
      }
    }
  }, [
    data.lastMessage,
    topicViewerName,
    topicName,
    msgPackage,
    msgType,
    queueSize,
    displayMode,
    notifyChange,
  ]);

  const onTopicViewerNameChange = (value) => {
    setTopicViewerName(value);
    notifyChange({
      topicViewerName: value,
      topicName,
      msgPackage,
      msgType,
      queueSize,
      displayMode,
      lastMessage,
      messageCount,
      value: lastMessage,
    });
  };

  const onTopicChange = (value) => {
    setTopicName(value);
    notifyChange({
      topicViewerName,
      topicName: value,
      msgPackage,
      msgType,
      queueSize,
      displayMode,
      lastMessage,
      messageCount,
      value: lastMessage,
    });
  };

  const onPackageChange = (value) => {
    setMsgPackage(value);

    // Reset message type to first available in new package
    const newType = MESSAGE_TYPES[value]?.[0]?.type || "String";
    setMsgType(newType);

    notifyChange({
      topicViewerName,
      topicName,
      msgPackage: value,
      msgType: newType,
      queueSize,
      displayMode,
      lastMessage,
      messageCount,
      value: lastMessage,
    });
  };

  const onTypeChange = (value) => {
    setMsgType(value);
    notifyChange({
      topicViewerName,
      topicName,
      msgPackage,
      msgType: value,
      queueSize,
      displayMode,
      lastMessage,
      messageCount,
      value: lastMessage,
    });
  };

  const onQueueChange = (value) => {
    setQueueSize(value);
    notifyChange({
      topicViewerName,
      topicName,
      msgPackage,
      msgType,
      queueSize: value,
      displayMode,
      lastMessage,
      messageCount,
      value: lastMessage,
    });
  };

  const onDisplayModeChange = (value) => {
    setDisplayMode(value);
    notifyChange({
      topicViewerName,
      topicName,
      msgPackage,
      msgType,
      queueSize,
      displayMode: value,
      lastMessage,
      messageCount,
      value: lastMessage,
    });
  };

  const renderCompactMessage = () => {
    const parsedMessage = safeJsonParse(lastMessage);

    if (parsedMessage === null) {
      return (
        <div className="ros-subscriber-node__message-content">
          No message received yet.
        </div>
      );
    }

    if (typeof parsedMessage !== "object") {
      return (
        <div className="ros-subscriber-node__message-content">
          {String(parsedMessage)}
        </div>
      );
    }

    switch (messageInfo.format) {
      case "text":
      case "integer":
      case "float":
      case "boolean":
        return (
          <div className="ros-subscriber-node__message-content">
            Data: {parsedMessage.data !== undefined ? String(parsedMessage.data) : JSON.stringify(parsedMessage)}
          </div>
        );

      case "vector3":
        return (
          <div className="ros-subscriber-node__message-content">
            <div>x: {formatNumber(parsedMessage.x)}</div>
            <div>y: {formatNumber(parsedMessage.y)}</div>
            <div>z: {formatNumber(parsedMessage.z)}</div>
          </div>
        );

      case "quaternion":
        return (
          <div className="ros-subscriber-node__message-content">
            <div>x: {formatNumber(parsedMessage.x)}</div>
            <div>y: {formatNumber(parsedMessage.y)}</div>
            <div>z: {formatNumber(parsedMessage.z)}</div>
            <div>w: {formatNumber(parsedMessage.w)}</div>
          </div>
        );

      case "twist":
        return (
          <div className="ros-subscriber-node__message-content">
            <div><strong>Linear</strong></div>
            <div>x: {formatNumber(parsedMessage.linear?.x)}</div>
            <div>y: {formatNumber(parsedMessage.linear?.y)}</div>
            <div>z: {formatNumber(parsedMessage.linear?.z)}</div>

            <div><strong>Angular</strong></div>
            <div>x: {formatNumber(parsedMessage.angular?.x)}</div>
            <div>y: {formatNumber(parsedMessage.angular?.y)}</div>
            <div>z: {formatNumber(parsedMessage.angular?.z)}</div>
          </div>
        );

      case "pose":
        return (
          <div className="ros-subscriber-node__message-content">
            <div><strong>Position</strong></div>
            <div>x: {formatNumber(parsedMessage.position?.x)}</div>
            <div>y: {formatNumber(parsedMessage.position?.y)}</div>
            <div>z: {formatNumber(parsedMessage.position?.z)}</div>

            <div><strong>Orientation</strong></div>
            <div>x: {formatNumber(parsedMessage.orientation?.x)}</div>
            <div>y: {formatNumber(parsedMessage.orientation?.y)}</div>
            <div>z: {formatNumber(parsedMessage.orientation?.z)}</div>
            <div>w: {formatNumber(parsedMessage.orientation?.w)}</div>
          </div>
        );

      case "odometry":
        return (
          <div className="ros-subscriber-node__message-content">
            <div><strong>Pose position</strong></div>
            <div>x: {formatNumber(parsedMessage.pose?.pose?.position?.x)}</div>
            <div>y: {formatNumber(parsedMessage.pose?.pose?.position?.y)}</div>
            <div>z: {formatNumber(parsedMessage.pose?.pose?.position?.z)}</div>

            <div><strong>Twist linear</strong></div>
            <div>x: {formatNumber(parsedMessage.twist?.twist?.linear?.x)}</div>
            <div>y: {formatNumber(parsedMessage.twist?.twist?.linear?.y)}</div>
            <div>z: {formatNumber(parsedMessage.twist?.twist?.linear?.z)}</div>

            <div><strong>Twist angular</strong></div>
            <div>z: {formatNumber(parsedMessage.twist?.twist?.angular?.z)}</div>
          </div>
        );

      case "lidar": {
        const ranges = Array.isArray(parsedMessage.ranges) ? parsedMessage.ranges : [];
        const validRanges = ranges.filter(
          (r) => typeof r === "number" && Number.isFinite(r)
        );

        const minRange = validRanges.length ? Math.min(...validRanges) : null;
        const maxRange = validRanges.length ? Math.max(...validRanges) : null;

        return (
          <div className="ros-subscriber-node__message-content">
            <div>Ranges: {ranges.length}</div>
            <div>Valid ranges: {validRanges.length}</div>
            <div>Min range: {minRange !== null ? `${formatNumber(minRange)} m` : "N/A"}</div>
            <div>Max range: {maxRange !== null ? `${formatNumber(maxRange)} m` : "N/A"}</div>
            <div>Angle min: {formatNumber(parsedMessage.angle_min)}</div>
            <div>Angle max: {formatNumber(parsedMessage.angle_max)}</div>
          </div>
        );
      }

      case "imu":
        return (
          <div className="ros-subscriber-node__message-content">
            <div><strong>Orientation</strong></div>
            <div>x: {formatNumber(parsedMessage.orientation?.x)}</div>
            <div>y: {formatNumber(parsedMessage.orientation?.y)}</div>
            <div>z: {formatNumber(parsedMessage.orientation?.z)}</div>
            <div>w: {formatNumber(parsedMessage.orientation?.w)}</div>

            <div><strong>Angular velocity</strong></div>
            <div>x: {formatNumber(parsedMessage.angular_velocity?.x)}</div>
            <div>y: {formatNumber(parsedMessage.angular_velocity?.y)}</div>
            <div>z: {formatNumber(parsedMessage.angular_velocity?.z)}</div>

            <div><strong>Linear acceleration</strong></div>
            <div>x: {formatNumber(parsedMessage.linear_acceleration?.x)}</div>
            <div>y: {formatNumber(parsedMessage.linear_acceleration?.y)}</div>
            <div>z: {formatNumber(parsedMessage.linear_acceleration?.z)}</div>
          </div>
        );

      case "image":
        return (
          <div className="ros-subscriber-node__message-content">
            <div>Width: {parsedMessage.width ?? "N/A"}</div>
            <div>Height: {parsedMessage.height ?? "N/A"}</div>
            <div>Encoding: {parsedMessage.encoding ?? "N/A"}</div>
            <div>Step: {parsedMessage.step ?? "N/A"}</div>
            <div>
              Data size: {
                Array.isArray(parsedMessage.data)
                  ? parsedMessage.data.length
                  : parsedMessage.data
                    ? String(parsedMessage.data).length
                    : "N/A"
              }
            </div>
          </div>
        );

      case "camera":
        return (
          <div className="ros-subscriber-node__message-content">
            <div>Width: {parsedMessage.width ?? "N/A"}</div>
            <div>Height: {parsedMessage.height ?? "N/A"}</div>
            <div>Distortion model: {parsedMessage.distortion_model ?? "N/A"}</div>
            <div>
              K: {
                Array.isArray(parsedMessage.k)
                  ? `[${parsedMessage.k.slice(0, 4).join(", ")}...]`
                  : "N/A"
              }
            </div>
          </div>
        );

      case "pointcloud":
        return (
          <div className="ros-subscriber-node__message-content">
            <div>Width: {parsedMessage.width ?? "N/A"}</div>
            <div>Height: {parsedMessage.height ?? "N/A"}</div>
            <div>Point step: {parsedMessage.point_step ?? "N/A"}</div>
            <div>Row step: {parsedMessage.row_step ?? "N/A"}</div>
            <div>Fields: {Array.isArray(parsedMessage.fields) ? parsedMessage.fields.length : "N/A"}</div>
          </div>
        );

      case "path":
        return (
          <div className="ros-subscriber-node__message-content">
            <div>Poses: {Array.isArray(parsedMessage.poses) ? parsedMessage.poses.length : "N/A"}</div>

            {Array.isArray(parsedMessage.poses) && parsedMessage.poses.length > 0 && (
              <>
                <div><strong>First pose</strong></div>
                <div>x: {formatNumber(parsedMessage.poses[0]?.pose?.position?.x)}</div>
                <div>y: {formatNumber(parsedMessage.poses[0]?.pose?.position?.y)}</div>
                <div>z: {formatNumber(parsedMessage.poses[0]?.pose?.position?.z)}</div>
              </>
            )}
          </div>
        );

      default:
        return (
          <pre className="ros-subscriber-node__message-content">
            {JSON.stringify(parsedMessage, null, 2)}
          </pre>
        );
    }
  };

  const renderRawMessage = () => {
    const parsedMessage = safeJsonParse(lastMessage);

    if (parsedMessage === null) {
      return (
        <pre className="ros-subscriber-node__message-content">
          No message received yet.
        </pre>
      );
    }

    if (typeof parsedMessage === "object") {
      return (
        <pre className="ros-subscriber-node__message-content">
          {JSON.stringify(parsedMessage, null, 2)}
        </pre>
      );
    }

    return (
      <pre className="ros-subscriber-node__message-content">
        {String(parsedMessage)}
      </pre>
    );
  };

  return (
    <div className="rf-card ros-subscriber-node">
      <div
        className="ros-subscriber-node__header"
        onClick={() => setExpanded(!expanded)}
      >
        <span className="ros-subscriber-node__title">🖥️ ROS2 Topic Viewer</span>
        <span className={`ros-subscriber-node__toggle ${expanded ? 'ros-subscriber-node__toggle--expanded' : 'ros-subscriber-node__toggle--collapsed'}`}>
          {expanded ? "▼" : "▶"}
        </span>
      </div>

      <div className="ros-subscriber-node__body">
        {/* Topic Name */}
        <div className={`ros-subscriber-node__field-collapsible ${isTopicConnected ? 'ros-subscriber-node__field-collapsible--collapsed' : ''}`}>
          <span className="ros-subscriber-node__field-label">
            <span className="rf-conn-dot rf-conn-dot--blue" />Topic Name
          </span>
          <div className="ros-subscriber-node__field-input-wrapper">
            <input
              value={topicName}
              onChange={(e) => onTopicChange(e.target.value)}
              placeholder="/chatter"
              className="rf-input"
            />
          </div>
        </div>

        {/* Resolved (workspace-namespaced) topic + live status */}
        <div style={{ fontSize: "0.7rem", opacity: 0.75, wordBreak: "break-all", margin: "2px 0 4px" }}>
          Subscribed: <code>{fullTopic}</code>{" "}
          <span style={{ color: connected ? "#7df9ff" : "#888" }}>
            ({connected ? "live" : "connecting…"})
          </span>
        </div>

        {expanded && (
          <>
            

           

            {/* Last Message Preview */}
            <div className="ros-subscriber-node__message-preview">
              <span className="ros-subscriber-node__message-label">
                Latest Message:
              </span>

              {displayMode === "compact" ? renderCompactMessage() : renderRawMessage()}
            </div>

         
          </>
        )}
      </div>

      {/* Input Handle — aligned near the Topic Name field at the top */}
      <HandleWithLabel
        type="target"
        position={Position.Left}
        id="topic"
        label="topic"
        color="blue"
        top="18%"
      />

    </div>
  );
}
