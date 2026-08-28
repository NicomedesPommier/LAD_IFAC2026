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
import { FaSatelliteDish, FaCaretDown, FaCaretRight } from "react-icons/fa6";

const MESSAGE_TYPES = {
  std_msgs: [
    { type: "String",  format: "text",    example: "Hello World" },
    { type: "Int32",   format: "integer", example: "42" },
    { type: "Int64",   format: "integer", example: "1000" },
    { type: "Float32", format: "float",   example: "3.14" },
    { type: "Float64", format: "float",   example: "3.14159" },
    { type: "Bool",    format: "boolean", example: "true" },
    { type: "UInt8",   format: "integer", example: "255" },
    { type: "UInt16",  format: "integer", example: "65535" },
  ],
  geometry_msgs: [
    { type: "Point",      format: "vector3",    example: "{x: 0.0, y: 0.0, z: 0.0}" },
    { type: "Pose",       format: "pose",       example: "{position: {...}, orientation: {...}}" },
    { type: "Twist",      format: "twist",      example: "{linear: {x,y,z}, angular: {x,y,z}}" },
    { type: "Vector3",    format: "vector3",    example: "{x: 0.0, y: 0.0, z: 0.0}" },
    { type: "Quaternion", format: "quaternion", example: "{x: 0, y: 0, z: 0, w: 1}" },
  ],
  sensor_msgs: [
    { type: "Image",       format: "image",      example: "{width, height, encoding, data}" },
    { type: "LaserScan",   format: "lidar",      example: "{ranges[], intensities[], ...}" },
    { type: "PointCloud2", format: "pointcloud", example: "{points[], ...}" },
    { type: "Imu",         format: "imu",        example: "{orientation, angular_velocity, ...}" },
    { type: "CameraInfo",  format: "camera",     example: "{width, height, K[], ...}" },
    { type: "Temperature", format: "float",      example: "{temperature: 25.5}" },
  ],
  nav_msgs: [
    { type: "Odometry", format: "odometry", example: "{pose, twist, ...}" },
    { type: "Path",     format: "path",     example: "{poses[], ...}" },
  ],
};

const PACKAGE_OPTIONS = Object.keys(MESSAGE_TYPES);

function ExpandableTitle({ label, icon, expanded, onToggle }) {
  return (
    <div
      onClick={onToggle}
      style={{ display: "flex", alignItems: "center", justifyContent: "space-between", cursor: "pointer" }}
    >
      <span>{icon} {label}</span>
      <span style={{ fontSize: "0.75em" }}>{expanded ? <FaCaretDown /> : <FaCaretRight />}</span>
    </div>
  );
}

export default function RosPublisherNode({ id, data }) {
  const edges = useStore((state) => state.edges);
  const nodes = useStore((state) => state.nodes);

  const connectedHandles = edges
    .filter((e) => e.target === id)
    .map((e) => e.targetHandle);

  const isDataConnected      = connectedHandles.includes("data");
  const isTopicConnected     = connectedHandles.includes("topic");
  const isFrequencyConnected = connectedHandles.includes("frequency");

  const [publisherName, setPublisherName] = useState(data.publisherName ?? "publisher_node");
  const [topicName,     setTopicName]     = useState(data.topicName     ?? "/chatter");
  const [msgPackage,    setMsgPackage]    = useState(data.msgPackage    ?? "std_msgs");
  const [msgType,       setMsgType]       = useState(data.msgType       ?? "String");
  const [frequency,     setFrequency]     = useState(data.frequency     ?? "1.0");
  const [dataInput,     setDataInput]     = useState(data.dataInput     ?? "");
  const [queueSize,     setQueueSize]     = useState(data.queueSize     ?? "10");
  const [expanded,      setExpanded]      = useState(data.expanded      ?? true);

  const messageInfo = MESSAGE_TYPES[msgPackage]?.find((m) => m.type === msgType)
    || { format: "text", example: "data" };

  // Tracks prior connection-driven values to avoid feedback loops
  const prevConnectedValuesRef = useRef({});

  const notify = useNotifier(id, data, () => ({
    publisherName, topicName, msgPackage, msgType, frequency, dataInput, queueSize,
  }));

  useEffect(() => {
    const srcFor = (handleId) => {
      const edge = edges.find((e) => e.target === id && e.targetHandle === handleId);
      if (!edge) return null;
      return nodes.find((n) => n.id === edge.source);
    };

    if (isDataConnected) {
      const dataSrc = srcFor("data");
      if (dataSrc?.data?.value !== undefined) {
        const v = String(dataSrc.data.value);
        if (v !== prevConnectedValuesRef.current.dataInput) {
          prevConnectedValuesRef.current.dataInput = v;
          setDataInput(v);
        }
      }
    }
    if (isTopicConnected) {
      const topicSrc = srcFor("topic");
      if (topicSrc?.data?.value) {
        const v = topicSrc.data.value;
        if (v !== prevConnectedValuesRef.current.topicName) {
          prevConnectedValuesRef.current.topicName = v;
          setTopicName(v);
        }
      }
    }
    if (isFrequencyConnected) {
      const freqSrc = srcFor("frequency");
      if (freqSrc?.data?.value) {
        const v = freqSrc.data.value;
        if (v !== prevConnectedValuesRef.current.frequency) {
          prevConnectedValuesRef.current.frequency = v;
          setFrequency(v);
        }
      }
    }
  }, [edges, nodes, id, isDataConnected, isTopicConnected, isFrequencyConnected]);

  const onChange = (setter, key) => (v) => {
    setter(v);
    notify({ [key]: v });
  };

  const onPackageChange = (v) => {
    setMsgPackage(v);
    // Reset msgType to first option in the new package.
    const newType = MESSAGE_TYPES[v]?.[0]?.type || "String";
    setMsgType(newType);
    notify({ msgPackage: v, msgType: newType });
  };

  const renderDataInput = () => {
    if (isDataConnected) {
      return (
        <InfoCard title="Data: Connected from block">
          <code>{dataInput || "(no data yet)"}</code>
        </InfoCard>
      );
    }

    switch (messageInfo.format) {
      case "boolean":
        return (
          <LabeledSelect
            label={<><span className="rf-conn-dot rf-conn-dot--purple" />Data Value</>}
            value={dataInput || "true"}
            onChange={onChange(setDataInput, "dataInput")}
            options={[
              { value: "true",  label: "True" },
              { value: "false", label: "False" },
            ]}
          />
        );
      case "integer":
      case "float":
        return (
          <LabeledInput
            label={<><span className="rf-conn-dot rf-conn-dot--purple" />Data Value</>}
            type="number"
            step={messageInfo.format === "float" ? "0.01" : "1"}
            value={dataInput}
            onChange={onChange(setDataInput, "dataInput")}
            placeholder={messageInfo.example}
          />
        );
      case "vector3":
      case "quaternion":
      case "pose":
      case "twist":
        return (
          <label className="rf-field">
            <span><span className="rf-conn-dot rf-conn-dot--purple" />Data (JSON)</span>
            <textarea
              className="rf-input"
              rows={3}
              value={dataInput}
              onChange={(e) => { setDataInput(e.target.value); notify({ dataInput: e.target.value }); }}
              placeholder={messageInfo.example}
              style={{ fontFamily: "monospace", fontSize: "0.85em" }}
            />
          </label>
        );
      default:
        return (
          <LabeledInput
            label={<><span className="rf-conn-dot rf-conn-dot--purple" />Data Value</>}
            value={dataInput}
            onChange={onChange(setDataInput, "dataInput")}
            placeholder={messageInfo.example}
          />
        );
    }
  };

  return (
    <NodeCard
      title={
        <ExpandableTitle
          label="ROS2 Publisher"
          icon={<FaSatelliteDish style={{ verticalAlign: "-2px" }} />}
          expanded={expanded}
          onToggle={() => setExpanded(!expanded)}
        />
      }
      size="lg"
      className="ros-publisher-node"
      handles={
        <>
          {/* Ordered top-to-bottom to match the field layout below:
              Topic Name (top) → Data (middle) → Frequency (lower). */}
          <HandleWithLabel type="target" position={Position.Left}  id="topic"     label="topic"     top="16%" color="blue"   />
          <HandleWithLabel type="target" position={Position.Left}  id="data"      label="data"      top="52%" color="purple" />
          <HandleWithLabel type="target" position={Position.Left}  id="frequency" label="frequency" top="78%" color="green"  />
          <HandleWithLabel type="source" position={Position.Right} id="out"       label="publisher" top="50%" />
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
          {/* `ros-publisher-node__field` is a tutorial anchor — see ideTutorials.js */}
          <div className="ros-publisher-node__field">
            <LabeledInput
              label="Publisher Name"
              value={publisherName}
              onChange={onChange(setPublisherName, "publisherName")}
              placeholder="publisher_node"
            />
          </div>

          <div className="rf-grid-2 ros-publisher-node__grid-2">
            <LabeledSelect label="Package" value={msgPackage} onChange={onPackageChange} options={PACKAGE_OPTIONS} />
            <LabeledSelect
              label="Message Type"
              value={msgType}
              onChange={onChange(setMsgType, "msgType")}
              options={MESSAGE_TYPES[msgPackage]?.map((m) => m.type) || []}
            />
          </div>

          {renderDataInput()}

          <div className="rf-grid-2">
            <CollapsibleField
              label={<><span className="rf-conn-dot rf-conn-dot--green" />Frequency (Hz)</>}
              collapsed={isFrequencyConnected}
            >
              <input
                className="rf-input"
                type="number"
                step="0.1"
                min="0.01"
                value={frequency}
                onChange={(e) => { setFrequency(e.target.value); notify({ frequency: e.target.value }); }}
                placeholder="1.0"
              />
            </CollapsibleField>
            <LabeledInput
              label="Queue Size"
              type="number"
              min="1"
              value={queueSize}
              onChange={onChange(setQueueSize, "queueSize")}
              placeholder="10"
            />
          </div>

          <InfoCard title={`Publishing: ${msgPackage}/${msgType}`}>
            <div>Node: {publisherName}</div>
            <div>Topic: {topicName}</div>
            <div>Rate: {frequency} Hz</div>
            {dataInput && (
              <div>Data: {dataInput.length > 50 ? dataInput.substring(0, 50) + "..." : dataInput}</div>
            )}
          </InfoCard>
        </>
      )}
    </NodeCard>
  );
}
