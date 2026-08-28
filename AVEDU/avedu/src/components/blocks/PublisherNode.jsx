import React, { useState, useEffect } from "react";
import { Position, useStore } from "@xyflow/react";
import HandleWithLabel from "./HandleWithLabel";

const DEFAULT_MSGS = {
  python: ["std_msgs", "geometry_msgs", "sensor_msgs"],
  cpp: ["std_msgs", "geometry_msgs", "sensor_msgs"],
};

export default function PublisherNode({ id, data }) {
  // Get edges and nodes to determine if fields should collapse and get external data
  const edges = useStore((state) => state.edges);
  const nodes = useStore((state) => state.nodes);

  const connectedHandles = edges
    .filter((e) => e.target === id)
    .map((e) => e.targetHandle);

  const isTopicNameConnected = connectedHandles.includes("topicName");
  const isMsgTypeConnected = connectedHandles.includes("msgType");
  const isTimerIntervalConnected = connectedHandles.includes("timerInterval");

  const [topicName, setTopicName] = useState(data.topicName ?? "chatter");
  const [msgType, setMsgType] = useState(data.msgType ?? "String");
  const [msgPackage, setMsgPackage] = useState(data.msgPackage ?? "std_msgs");
  const [timerInterval, setTimerInterval] = useState(data.timerInterval ?? "0.5");
  const [lang, setLang] = useState(data.lang ?? "python");
  const [className, setClassName] = useState(data.className ?? "PublisherNode");
  const [fileName, setFileName] = useState(data.fileName ?? "publisher_node");

  // Update state when external connections provide data
  useEffect(() => {
    const srcFor = (handleId) => {
      const edge = edges.find((e) => e.target === id && e.targetHandle === handleId);
      if (!edge) return null;
      return nodes.find((n) => n.id === edge.source);
    };

    let updated = false;
    let newData = {};

    if (isTopicNameConnected) {
      const topicSrc = srcFor("topicName");
      if (topicSrc?.data?.value && topicSrc.data.value !== topicName) {
        setTopicName(topicSrc.data.value);
        newData.topicName = topicSrc.data.value;
        updated = true;
      }
    }

    if (isMsgTypeConnected) {
      const msgSrc = srcFor("msgType");
      if (msgSrc?.data?.value && msgSrc.data.value !== msgType) {
        setMsgType(msgSrc.data.value);
        newData.msgType = msgSrc.data.value;
        updated = true;
      }
    }

    if (isTimerIntervalConnected) {
      const timerSrc = srcFor("timerInterval");
      if (timerSrc?.data?.value && timerSrc.data.value !== timerInterval) {
        setTimerInterval(timerSrc.data.value);
        newData.timerInterval = timerSrc.data.value;
        updated = true;
      }
    }

    if (updated) {
      notify({ topicName, msgType, msgPackage, timerInterval, lang, className, fileName, ...newData });
    }
  }, [edges, nodes, isTopicNameConnected, isMsgTypeConnected, isTimerIntervalConnected]);

  const notify = (next) => data.onChange?.(id, { ...next });

  const onLangChange = (value) => {
    setLang(value);
    notify({
      topicName,
      msgType,
      msgPackage,
      timerInterval,
      lang: value,
      className,
      fileName,
    });
  };

  const onTopicChange = (v) => {
    setTopicName(v);
    notify({ topicName: v, msgType, msgPackage, timerInterval, lang, className, fileName });
  };

  const onMsgTypeChange = (v) => {
    setMsgType(v);
    notify({ topicName, msgType: v, msgPackage, timerInterval, lang, className, fileName });
  };

  const onMsgPackageChange = (v) => {
    setMsgPackage(v);
    notify({ topicName, msgType, msgPackage: v, timerInterval, lang, className, fileName });
  };

  const onTimerChange = (v) => {
    setTimerInterval(v);
    notify({ topicName, msgType, msgPackage, timerInterval: v, lang, className, fileName });
  };

  const onClassNameChange = (v) => {
    setClassName(v);
    notify({ topicName, msgType, msgPackage, timerInterval, lang, className: v, fileName });
  };

  const onFileNameChange = (v) => {
    setFileName(v);
    notify({ topicName, msgType, msgPackage, timerInterval, lang, className, fileName: v });
  };

  return (
    <div className="rf-card">
      <div className="rf-card__title">Create Publisher</div>

      <div className="rf-card__body">
        <div className={`rf-field--collapsible ${isTopicNameConnected ? 'rf-field--collapsed' : ''}`}>
          <span className="rf-field__label">Topic name</span>
          <div className="rf-field__input-wrapper">
            <input
              value={topicName}
              onChange={(e) => onTopicChange(e.target.value)}
              placeholder="chatter"
              className="rf-input"
            />
          </div>
        </div>

        <div className="rf-grid-2">
          <div className={`rf-field--collapsible ${isMsgTypeConnected ? 'rf-field--collapsed' : ''}`}>
            <span className="rf-field__label">Message type</span>
            <div className="rf-field__input-wrapper">
              <input
                value={msgType}
                onChange={(e) => onMsgTypeChange(e.target.value)}
                placeholder="String"
                className="rf-input"
              />
            </div>
          </div>

          <label className="rf-field">
            <span>Package</span>
            <select
              value={msgPackage}
              onChange={(e) => onMsgPackageChange(e.target.value)}
              className="rf-input"
            >
              <option value="std_msgs">std_msgs</option>
              <option value="geometry_msgs">geometry_msgs</option>
              <option value="sensor_msgs">sensor_msgs</option>
            </select>
          </label>
        </div>

        <div className={`rf-field--collapsible ${isTimerIntervalConnected ? 'rf-field--collapsed' : ''}`}>
          <span className="rf-field__label">Timer interval (s)</span>
          <div className="rf-field__input-wrapper">
            <input
              value={timerInterval}
              onChange={(e) => onTimerChange(e.target.value)}
              placeholder="0.5"
              type="number"
              step="0.1"
              min="0.01"
              className="rf-input"
            />
          </div>
        </div>

        <div className="rf-grid-2">
          <label className="rf-field">
            <span>Language</span>
            <select
              value={lang}
              onChange={(e) => onLangChange(e.target.value)}
              className="rf-input"
            >
              <option value="python">Python</option>
              <option value="cpp">C++</option>
            </select>
          </label>

          <label className="rf-field">
            <span>Class name</span>
            <input
              value={className}
              onChange={(e) => onClassNameChange(e.target.value)}
              placeholder="PublisherNode"
              className="rf-input"
            />
          </label>
        </div>

        <div className="rf-field">
          <span className="rf-field__label">File name</span>
          <div className="rf-field__input-wrapper">
            <input
              value={fileName}
              onChange={(e) => onFileNameChange(e.target.value)}
              placeholder="publisher_node"
              className="rf-input"
            />
          </div>
        </div>
      </div>

      <HandleWithLabel
        type="target"
        position={Position.Left}
        id="topicName"
        label="topicName"
        top="15%"
      />
      <HandleWithLabel
        type="target"
        position={Position.Left}
        id="msgType"
        label="msgType"
        top="35%"
      />
      <HandleWithLabel
        type="target"
        position={Position.Left}
        id="timerInterval"
        label="timerInterval"
        top="55%"
      />

      <HandleWithLabel
        type="source"
        position={Position.Right}
        id="out"
        label="output"
        top="50%"
      />
    </div>
  );
}
