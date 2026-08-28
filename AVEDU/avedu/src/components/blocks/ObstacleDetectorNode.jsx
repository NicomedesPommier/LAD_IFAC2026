import React, { useState, useRef, useEffect } from "react";
import { Position } from "@xyflow/react";
import {
  NodeCard,
  LabeledInput,
  LabeledSelect,
  LabeledRange,
  InfoBadge,
  HandleWithLabel,
  useNotifier,
} from "./components";

const SECTORS = {
  front: { minDeg:  -30, maxDeg:   30, label: "Front ±30°" },
  left:  { minDeg:   60, maxDeg:  120, label: "Left  ±30°" },
  rear:  { minDeg:  150, maxDeg:  210, label: "Rear  ±30°" },
  right: { minDeg:  240, maxDeg:  300, label: "Right ±30°" },
  all:   { minDeg:    0, maxDeg:  360, label: "All 360°"   },
};

const SECTOR_OPTIONS = Object.entries(SECTORS).map(([value, { label }]) => ({ value, label }));

/**
 * Top-down radar diagram showing all sectors, with the selected one
 * highlighted and a solid red ring at the threshold distance.
 */
function drawSectorDiagram(canvas, sector, threshold) {
  const ctx = canvas.getContext("2d");
  const W   = canvas.width;
  const H   = canvas.height;
  const cx  = W / 2;
  const cy  = H / 2;
  const maxPx = Math.min(W, H) * 0.44;
  const scale = maxPx / 3.0;

  ctx.fillStyle = "#080c10";
  ctx.fillRect(0, 0, W, H);

  Object.values(SECTORS).forEach(({ minDeg, maxDeg }) => {
    const startRad = ((minDeg - 90) * Math.PI) / 180;
    const endRad   = ((maxDeg - 90) * Math.PI) / 180;
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.arc(cx, cy, maxPx, startRad, endRad);
    ctx.closePath();
    ctx.fillStyle = "rgba(255,60,60,0.08)";
    ctx.fill();
    ctx.strokeStyle = "rgba(255,60,60,0.15)";
    ctx.lineWidth = 1;
    ctx.stroke();
  });

  const { minDeg, maxDeg } = SECTORS[sector] || SECTORS.front;
  const startRad = ((minDeg - 90) * Math.PI) / 180;
  const endRad   = ((maxDeg - 90) * Math.PI) / 180;
  ctx.beginPath();
  ctx.moveTo(cx, cy);
  ctx.arc(cx, cy, maxPx, startRad, endRad);
  ctx.closePath();
  ctx.fillStyle = "rgba(255,60,60,0.12)";
  ctx.fill();
  ctx.strokeStyle = "rgba(255,60,60,0.4)";
  ctx.lineWidth = 1.5;
  ctx.stroke();

  [0.5, 1.0, 2.0].forEach((r) => {
    const rPx = r * scale;
    ctx.beginPath();
    ctx.setLineDash([4, 4]);
    ctx.strokeStyle = "rgba(255,255,255,0.18)";
    ctx.lineWidth = 1;
    ctx.arc(cx, cy, rPx, 0, 2 * Math.PI);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = "rgba(255,255,255,0.35)";
    ctx.font = "9px monospace";
    ctx.fillText(`${r}m`, cx + rPx + 2, cy - 2);
  });

  const threshPx = Math.min(threshold * scale, maxPx);
  ctx.beginPath();
  ctx.setLineDash([]);
  ctx.strokeStyle = "rgba(255,80,80,0.75)";
  ctx.lineWidth = 1.5;
  ctx.arc(cx, cy, threshPx, 0, 2 * Math.PI);
  ctx.stroke();

  ctx.beginPath();
  ctx.arc(cx, cy, 5, 0, 2 * Math.PI);
  ctx.fillStyle = "#44aaff";
  ctx.fill();
}

export default function ObstacleDetectorNode({ id, data }) {
  const [nodeName,      setNodeName]      = useState(data.nodeName      ?? "obstacle_detector");
  const [scanTopic,     setScanTopic]     = useState(data.scanTopic     ?? "/scan");
  const [sector,        setSector]        = useState(data.sector        ?? "front");
  const [threshold,     setThreshold]     = useState(data.threshold     ?? 0.5);
  const [outputTopic,   setOutputTopic]   = useState(data.outputTopic   ?? "/obstacle/distance");
  const [detectedTopic, setDetectedTopic] = useState(data.detectedTopic ?? "/obstacle/detected");

  const canvasRef = useRef(null);

  const notify = useNotifier(id, data, () => ({
    inputType: "obstacleDetector",
    nodeName, scanTopic, sector, threshold, outputTopic, detectedTopic,
  }));

  const onChange = (setter, key) => (v) => {
    setter(v);
    notify({ [key]: v });
  };

  useEffect(() => {
    if (canvasRef.current) drawSectorDiagram(canvasRef.current, sector, threshold);
  }, [sector, threshold]);

  return (
    <NodeCard
      title={<>&#9888; Obstacle Detector</>}
      accent="red"
      size="md"
      handles={
        <HandleWithLabel type="source" position={Position.Right} id="out" label="code" top="50%" color="red" />
      }
    >
      <LabeledInput  label="Node name"     value={nodeName}  onChange={onChange(setNodeName,  "nodeName")}  placeholder="obstacle_detector" />
      <LabeledInput  label="Scan topic"    value={scanTopic} onChange={onChange(setScanTopic, "scanTopic")} placeholder="/scan" />
      <LabeledSelect label="Sector"        value={sector}    onChange={onChange(setSector,    "sector")}    options={SECTOR_OPTIONS} />
      <LabeledRange
        label="Threshold"
        unit="m"
        value={threshold}
        onChange={onChange(setThreshold, "threshold")}
        min={0.1} max={3.0} step={0.05}
      />
      <LabeledInput label="Output topic (Float32 distance)" value={outputTopic}   onChange={onChange(setOutputTopic,   "outputTopic")}   placeholder="/obstacle/distance" />
      <LabeledInput label="Detected topic (Bool)"           value={detectedTopic} onChange={onChange(setDetectedTopic, "detectedTopic")} placeholder="/obstacle/detected" />

      <div style={{
        border: "1px solid var(--rf-accent-border)",
        borderRadius: 6,
        overflow: "hidden",
        marginTop: "0.2rem",
      }}>
        <canvas ref={canvasRef} width={220} height={130} style={{ display: "block" }} />
      </div>

      <InfoBadge size="xs">
        Subscribes <code>{scanTopic}</code> &rarr; Publishes distance &rarr; <code>{outputTopic}</code> (Float32) | detected &rarr; <code>{detectedTopic}</code> (Bool)
      </InfoBadge>
    </NodeCard>
  );
}
