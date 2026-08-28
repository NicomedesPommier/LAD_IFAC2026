import React, { useState, useEffect, useRef } from "react";
import { Position, useStore } from "@xyflow/react";
import {
  NodeCard,
  LabeledInput,
  LabeledSelect,
  CollapsibleField,
  InfoCard,
  HandleWithLabel,
  useNotifier,
} from "./components";

const MESSAGE_TYPES = {
  std_msgs: [
    "String", "Int32", "Int64", "Float32", "Float64", "Bool", "UInt8", "UInt16",
  ],
  geometry_msgs: ["Point", "Pose", "Twist", "Vector3", "Quaternion"],
  sensor_msgs:   ["Image", "LaserScan", "PointCloud2", "Imu", "CameraInfo", "Temperature"],
  nav_msgs:      ["Odometry", "Path"],
};

const PACKAGE_OPTIONS = Object.keys(MESSAGE_TYPES);

function ExpandableTitle({ label, icon, expanded, onToggle }) {
  return (
    <div
      onClick={onToggle}
      style={{ display: "flex", alignItems: "center", justifyContent: "space-between", cursor: "pointer" }}
    >
      <span>{icon} {label}</span>
      <span style={{ fontSize: "0.75em" }}>{expanded ? "▼" : "▶"}</span>
    </div>
  );
}

export default function RosSubscriberNode({ id, data }) {
  const edges = useStore((state) => state.edges);
  const nodes = useStore((state) => state.nodes);

  const isTopicConnected = edges
    .some((e) => e.target === id && e.targetHandle === "topic");

  const [subscriberName, setSubscriberName] = useState(data.subscriberName ?? "subscriber_node");
  const [topicName,      setTopicName]      = useState(data.topicName      ?? "/chatter");
  const [msgPackage,     setMsgPackage]     = useState(data.msgPackage     ?? "std_msgs");
  const [msgType,        setMsgType]        = useState(data.msgType        ?? "String");
  const [queueSize,      setQueueSize]      = useState(data.queueSize      ?? "10");
  const [expanded,       setExpanded]       = useState(data.expanded       ?? true);
  const [lastMessage]                       = useState(data.lastMessage    ?? "");

  const prevConnectedValuesRef = useRef({});

  const notify = useNotifier(id, data, () => ({
    subscriberName, topicName, msgPackage, msgType, queueSize, lastMessage,
  }));

  useEffect(() => {
    if (!isTopicConnected) return;
    const edge = edges.find((e) => e.target === id && e.targetHandle === "topic");
    if (!edge) return;
    const topicSrc = nodes.find((n) => n.id === edge.source);
    if (!topicSrc?.data?.value) return;
    const v = topicSrc.data.value;
    if (v !== prevConnectedValuesRef.current.topicName) {
      prevConnectedValuesRef.current.topicName = v;
      setTopicName(v);
    }
  }, [edges, nodes, id, isTopicConnected]);

  const onChange = (setter, key) => (v) => {
    setter(v);
    notify({ [key]: v });
  };

  const onPackageChange = (v) => {
    setMsgPackage(v);
    const newType = MESSAGE_TYPES[v]?.[0] || "String";
    setMsgType(newType);
    notify({ msgPackage: v, msgType: newType });
  };

  return (
    <NodeCard
      title={
        <ExpandableTitle
          label="ROS2 Subscriber"
          icon="📥"
          expanded={expanded}
          onToggle={() => setExpanded(!expanded)}
        />
      }
      size="lg"
      className="ros-subscriber-node"
      handles={
        <>
          <HandleWithLabel type="target" position={Position.Left}  id="topic" label="topic" top="22%" color="blue" />
          <HandleWithLabel type="source" position={Position.Right} id="out"   label="data"  top="50%" />
        </>
      }
    >
      <CollapsibleField
        label={<><span className="rf-conn-dot rf-conn-dot--blue" />Topic Name</>}
        collapsed={isTopicConnected}
      >
        <input
          className="rf-input"
          value={topicName}
          onChange={(e) => { setTopicName(e.target.value); notify({ topicName: e.target.value }); }}
          placeholder="/chatter"
        />
      </CollapsibleField>

      {expanded && (
        <>
          <LabeledInput
            label="Subscriber Name"
            value={subscriberName}
            onChange={onChange(setSubscriberName, "subscriberName")}
            placeholder="subscriber_node"
          />

          <div className="rf-grid-2 ros-subscriber-node__grid-2">
            <LabeledSelect label="Package" value={msgPackage} onChange={onPackageChange} options={PACKAGE_OPTIONS} />
            <LabeledSelect
              label="Message Type"
              value={msgType}
              onChange={onChange(setMsgType, "msgType")}
              options={MESSAGE_TYPES[msgPackage] || []}
            />
          </div>

          <LabeledInput
            label="Queue Size"
            type="number"
            min="1"
            value={queueSize}
            onChange={onChange(setQueueSize, "queueSize")}
            placeholder="10"
          />

          {lastMessage && (
            <InfoCard title="Last Message:">
              {lastMessage.length > 100 ? lastMessage.substring(0, 100) + "..." : lastMessage}
            </InfoCard>
          )}

          <InfoCard title={`Subscribing: ${msgPackage}/${msgType}`}>
            <div>Node: {subscriberName}</div>
            <div>Topic: {topicName}</div>
            <div>Queue: {queueSize}</div>
          </InfoCard>
        </>
      )}
    </NodeCard>
  );
}
