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

// ── Camera topic presets ────────────────────────────────────────────────────
const CUSTOM_CAM = "__custom__";

const CAM_GROUPS = [
  {
    label: "QCar Simulation",
    options: [
      { label: "CSI Front",     value: "/camera/csi_front/image/compressed" },
      { label: "CSI Right",     value: "/camera/csi_right/image/compressed" },
      { label: "CSI Back",      value: "/camera/csi_back/image/compressed"  },
      { label: "CSI Left",      value: "/camera/csi_left/image/compressed"  },
      { label: "RealSense RGB", value: "/camera/rgb/image/compressed"       },
    ],
  },
  {
    label: "Other",
    options: [
      { label: "Camera (compressed)", value: "/camera/image/compressed" },
      { label: "Camera (raw)",        value: "/camera/image_raw"        },
    ],
  },
];

const ALL_CAM_OPTIONS = CAM_GROUPS.flatMap((g) => g.options);

const METHOD_OPTIONS = [
  { value: "hsv",      label: "HSV color filter" },
  { value: "canny",    label: "Canny + Hough lines" },
  { value: "combined", label: "Combined (HSV + Canny)" },
];

const HSV_PRESET_OPTIONS = [
  { value: "white+yellow", label: "White + Yellow lanes" },
  { value: "white",        label: "White only" },
  { value: "yellow",       label: "Yellow only" },
];

function initPreset(topic) {
  return ALL_CAM_OPTIONS.find((o) => o.value === topic)?.value ?? CUSTOM_CAM;
}

// ── Synthetic preview canvas: draws a road perspective with two lane lines ──
function drawLanePreview(canvas, params) {
  const ctx = canvas.getContext("2d");
  const W = canvas.width;
  const H = canvas.height;
  ctx.clearRect(0, 0, W, H);

  const sky = ctx.createLinearGradient(0, 0, 0, H * 0.45);
  sky.addColorStop(0, "#0d1117");
  sky.addColorStop(1, "#1a2a3a");
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, W, H * 0.45);

  const road = ctx.createLinearGradient(0, H * 0.45, 0, H);
  road.addColorStop(0, "#2a2a2a");
  road.addColorStop(1, "#1a1a1a");
  ctx.fillStyle = road;
  ctx.fillRect(0, H * 0.45, W, H * 0.55);

  const vx = W / 2;
  const vy = H * 0.45;

  ctx.strokeStyle = "rgba(180,180,180,0.4)";
  ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(W * 0.05, H); ctx.lineTo(vx - 2, vy); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(W * 0.95, H); ctx.lineTo(vx + 2, vy); ctx.stroke();

  for (let t = 0.1; t < 1.0; t += 0.15) {
    const y1 = vy + (H - vy) * t;
    const y2 = vy + (H - vy) * (t + 0.07);
    ctx.strokeStyle = "rgba(230,200,0,0.55)";
    ctx.lineWidth = Math.max(1, t * 3);
    ctx.beginPath(); ctx.moveTo(vx, y1); ctx.lineTo(vx, y2); ctx.stroke();
  }

  const { roiTop } = params;
  const roiY = H * (1 - roiTop / 100);

  // ROI trapezoid (dashed yellow)
  ctx.strokeStyle = "rgba(255,200,0,0.25)";
  ctx.lineWidth = 1;
  ctx.setLineDash([4, 4]);
  ctx.beginPath();
  ctx.moveTo(W * 0.15, H);
  ctx.lineTo(W * 0.38, roiY);
  ctx.lineTo(W * 0.62, roiY);
  ctx.lineTo(W * 0.85, H);
  ctx.closePath();
  ctx.stroke();
  ctx.setLineDash([]);

  // Detected lanes (cyan)
  ctx.strokeStyle = "#00e5ff";
  ctx.lineWidth = 2.5;
  ctx.shadowColor = "#00e5ff";
  ctx.shadowBlur = 6;
  ctx.beginPath(); ctx.moveTo(W * 0.22, H); ctx.lineTo(W * 0.41, roiY); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(W * 0.78, H); ctx.lineTo(W * 0.59, roiY); ctx.stroke();
  ctx.shadowBlur = 0;

  ctx.fillStyle = "rgba(0,229,255,0.07)";
  ctx.beginPath();
  ctx.moveTo(W * 0.22, H);
  ctx.lineTo(W * 0.41, roiY);
  ctx.lineTo(W * 0.59, roiY);
  ctx.lineTo(W * 0.78, H);
  ctx.closePath();
  ctx.fill();

  ctx.strokeStyle = "rgba(0,229,255,0.5)";
  ctx.lineWidth = 1.5;
  ctx.setLineDash([3, 3]);
  ctx.beginPath(); ctx.moveTo(W / 2, H); ctx.lineTo(W / 2, roiY); ctx.stroke();
  ctx.setLineDash([]);

  ctx.fillStyle = "rgba(0,229,255,0.9)";
  ctx.font = "bold 10px monospace";
  ctx.fillText("LANE DETECTED", W * 0.29, roiY - 6);

  ctx.fillStyle = "rgba(255,200,0,0.7)";
  ctx.font = "9px monospace";
  ctx.fillText("ROI", W * 0.63, roiY + 11);
}

export default function LaneDetectionNode({ id, data }) {
  const [nodeName,    setNodeName]    = useState(data.nodeName    ?? "lane_detector");
  const [cameraTopic, setCameraTopic] = useState(data.cameraTopic ?? "/camera/image/compressed");
  const [camPreset,   setCamPreset]   = useState(() => initPreset(data.cameraTopic ?? "/camera/image/compressed"));
  const [outputTopic, setOutputTopic] = useState(data.outputTopic ?? "/lane_detection/image");
  const [laneTopic,   setLaneTopic]   = useState(data.laneTopic   ?? "/lane_center");
  const [method,      setMethod]      = useState(data.method      ?? "combined");
  const [roiTop,      setRoiTop]      = useState(data.roiTop      ?? 45);
  const [cannyLow,    setCannyLow]    = useState(data.cannyLow    ?? 50);
  const [cannyHigh,   setCannyHigh]   = useState(data.cannyHigh   ?? 150);
  const [hsvPreset,   setHsvPreset]   = useState(data.hsvPreset   ?? "white+yellow");
  const [minLineLen,  setMinLineLen]  = useState(data.minLineLen  ?? 40);
  const [maxLineGap,  setMaxLineGap]  = useState(data.maxLineGap  ?? 20);

  const canvasRef = useRef(null);

  const notify = useNotifier(id, data, () => ({
    inputType: "laneDetection",
    nodeName, cameraTopic, outputTopic, laneTopic,
    method, roiTop, cannyLow, cannyHigh,
    hsvPreset, minLineLen, maxLineGap,
  }));

  const onChange = (setter, key) => (v) => {
    setter(v);
    notify({ [key]: v });
  };

  useEffect(() => {
    if (canvasRef.current) drawLanePreview(canvasRef.current, { roiTop });
  }, [roiTop]);

  const showCanny = method === "canny" || method === "combined";
  const showHough = method === "canny" || method === "combined";
  const showHsv   = method === "hsv"   || method === "combined";

  return (
    <NodeCard
      title={<>&#x1f4f7; Lane Detection</>}
      accent="blue"
      size="md"
      handles={
        <HandleWithLabel type="source" position={Position.Right} id="out" label="code" top="50%" color="blue" />
      }
    >
      <canvas
        ref={canvasRef}
        width={240}
        height={120}
        style={{
          display: "block",
          width: "100%",
          borderRadius: 5,
          border: "1px solid var(--rf-accent-border)",
          background: "#0d1117",
        }}
      />

      <LabeledInput label="Node name" value={nodeName} onChange={onChange(setNodeName, "nodeName")} placeholder="lane_detector" />

      {/* Camera topic — preset dropdown with optgroups + custom override */}
      <div className="rf-field">
        <span>Camera topic</span>
        <select
          className="rf-input"
          value={camPreset}
          onChange={(e) => {
            const v = e.target.value;
            setCamPreset(v);
            if (v !== CUSTOM_CAM) {
              setCameraTopic(v);
              notify({ cameraTopic: v });
            }
          }}
        >
          {CAM_GROUPS.map((g) => (
            <optgroup key={g.label} label={g.label}>
              {g.options.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </optgroup>
          ))}
          <option value={CUSTOM_CAM}>— Custom topic —</option>
        </select>
        {camPreset === CUSTOM_CAM ? (
          <input
            className="rf-input"
            value={cameraTopic}
            onChange={(e) => { setCameraTopic(e.target.value); notify({ cameraTopic: e.target.value }); }}
            placeholder="/camera/image_raw"
            style={{ fontFamily: "monospace", fontSize: "0.7rem" }}
          />
        ) : (
          <div style={{ fontSize: "0.62rem", color: "#446", fontFamily: "monospace", lineHeight: 1.4 }}>
            {cameraTopic}
          </div>
        )}
      </div>

      <LabeledInput label="Output image topic" value={outputTopic} onChange={onChange(setOutputTopic, "outputTopic")} placeholder="/lane_detection/image" />
      <LabeledInput label="Lane center topic"  value={laneTopic}   onChange={onChange(setLaneTopic,   "laneTopic")}   placeholder="/lane_center" />

      <LabeledSelect label="Method" value={method} onChange={onChange(setMethod, "method")} options={METHOD_OPTIONS} />

      <LabeledRange
        label="ROI top"
        unit="% from bottom"
        value={roiTop}
        onChange={onChange(setRoiTop, "roiTop")}
        min={20} max={70} step={1}
        format={(v) => `${v}`}
      />

      {showHsv && (
        <LabeledSelect
          label="Color preset"
          value={hsvPreset}
          onChange={onChange(setHsvPreset, "hsvPreset")}
          options={HSV_PRESET_OPTIONS}
        />
      )}

      {showCanny && (
        <div className="rf-grid-2">
          <LabeledInput label="Canny low"  type="number" min="10" max="200" value={cannyLow}  onChange={onChange(setCannyLow,  "cannyLow")} />
          <LabeledInput label="Canny high" type="number" min="50" max="400" value={cannyHigh} onChange={onChange(setCannyHigh, "cannyHigh")} />
        </div>
      )}

      {showHough && (
        <div className="rf-grid-2">
          <LabeledInput label="Min line len" type="number" min="10" max="200" value={minLineLen} onChange={onChange(setMinLineLen, "minLineLen")} />
          <LabeledInput label="Max line gap" type="number" min="1"  max="100" value={maxLineGap} onChange={onChange(setMaxLineGap, "maxLineGap")} />
        </div>
      )}

      <InfoBadge size="xs">
        Subscribes <code>{cameraTopic}</code><br />
        Publishes annotated image → <code>{outputTopic}</code><br />
        Publishes lane offset → <code>{laneTopic}</code> (Float32)
      </InfoBadge>
    </NodeCard>
  );
}
