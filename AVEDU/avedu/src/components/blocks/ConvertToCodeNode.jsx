import React, { useState } from "react";
import { Handle, Position } from "@xyflow/react";
import { NodeCard, HintText } from "./components";
import { createFile, updateFile, listFiles, qcarWriteFile } from "../../services/fileApi";

const EMPTY_PREVIEW = "# (aún no hay nada conectado…)";

export default function ConvertToCodeNode({ data, id }) {
  const count       = Number(data?.inCount || 0);
  const preview     = data?.preview || "";
  const onExecute   = data?.onExecute;
  const canvasId    = data?.canvasId;
  const isQCarMode  = data?.isQCarMode || false;
  const currentFile = data?.currentFile;
  const onFileSaved = data?.onFileSaved;
  const hasCommand  = preview && preview !== EMPTY_PREVIEW;

  const [fileName,   setFileName]   = useState(currentFile || "generated_code.py");
  const [saving,     setSaving]     = useState(false);
  const [saveStatus, setSaveStatus] = useState("");

  const handleRunClick = () => {
    if (hasCommand && onExecute) onExecute(preview);
  };

  // Recognize what KIND of code the connected blocks produced so the file gets
  // the right extension: a ROS 2 launch file (.launch.py), a C++ node (.cpp), or
  // a plain Python node (.py).
  const detectKind = (code = "") => {
    if (/generate_launch_description|from\s+launch\b/.test(code)) return "launch";
    if (/#include|\bint\s+main\s*\(/.test(code)) return "cpp";
    return "py";
  };

  // Extensions we treat as "already has a code extension" (so we don't append).
  const CODE_EXT_RE = /\.(launch\.py|py|cpp|cc|cxx|c\+\+|hpp|h)$/i;

  const extForKind = (kind) =>
    kind === "launch" ? ".launch.py" : kind === "cpp" ? ".cpp" : ".py";

  const normalizeFilePath = () => {
    let f = fileName.endsWith(".canvas") ? fileName.slice(0, -7) : fileName;
    f = f.replace(/\\/g, "/");
    if (f.startsWith("/")) f = f.substring(1);
    if (!CODE_EXT_RE.test(f)) {
      f += extForKind(detectKind(preview));
    }
    return f;
  };

  const detectedKind = hasCommand ? detectKind(preview) : null;
  const resolvedName = hasCommand ? normalizeFilePath() : "";

  const ensureDirsExist = async (filePath) => {
    const parts = filePath.split("/");
    if (parts.length <= 1) return;
    const dirs = parts.slice(0, -1);
    let cur = "";
    for (const dir of dirs) {
      cur = cur ? `${cur}/${dir}` : dir;
      try {
        const files = await listFiles(canvasId);
        const dirExists = files.some((f) => f.path === cur && f.file_type === "directory");
        if (!dirExists) {
          await createFile(canvasId, { path: cur, file_type: "directory" });
        }
      } catch {}
    }
  };

  const handleSaveFile = async () => {
    if (!hasCommand || !canvasId) {
      setSaveStatus("⚠ No code to save or workspace not ready");
      setTimeout(() => setSaveStatus(""), 3000);
      return;
    }

    setSaving(true);
    setSaveStatus("");

    try {
      const filePath = normalizeFilePath();

      if (isQCarMode) {
        // QCar mode — write directly to robot via SFTP. Parent dirs created by backend.
        await qcarWriteFile(canvasId, filePath, preview);
        setSaveStatus(`✅ Saved to QCar: ${filePath}`);
      } else {
        await ensureDirsExist(filePath);

        let existingFile = null;
        try {
          const files = await listFiles(canvasId);
          existingFile = files.find((f) => f.path === filePath);
        } catch {}

        if (existingFile) {
          await updateFile(canvasId, existingFile.id, { content: preview });
          setSaveStatus(`✅ Updated ${filePath}`);
        } else {
          await createFile(canvasId, { path: filePath, content: preview, file_type: "file" });
          setSaveStatus(`✅ Created ${filePath}`);
        }
      }

      if (onFileSaved) onFileSaved(filePath, preview);
      setTimeout(() => setSaveStatus(""), 5000);
    } catch (error) {
      console.error("[Convert2Code] Failed to save file:", error);
      setSaveStatus(`❌ Error: ${error.message}`);
      setTimeout(() => setSaveStatus(""), 8000);
    } finally {
      setSaving(false);
    }
  };

  return (
    <NodeCard
      title="Convert2Code"
      size="lg"
      handles={
        <>
          <Handle type="target" position={Position.Left}  id="in" />
          <Handle type="source" position={Position.Right} id="out" />
        </>
      }
    >
      <div className="rf-chip">{count} bloque(s) conectado(s)</div>

      <HintText>
        Conecta aquí <b>RosPublisher</b>, <b>CreatePackage</b>, <b>RosRun</b>, etc.
        El código se generará automáticamente.
      </HintText>

      <pre className="rfp-terminal__code" style={{ marginTop: 6, maxHeight: 140, overflow: "auto" }}>
        {preview || EMPTY_PREVIEW}
      </pre>

      {hasCommand && (
        <div className="rf-stack rf-stack--tight">
          <label className="rf-field__label">
            {currentFile ? "Save to file:" : "Create file:"}
          </label>
          {isQCarMode && (
            <HintText>QCar: ~/ros2/{"{path}"}</HintText>
          )}
          <input
            type="text"
            className="rf-input"
            value={fileName}
            onChange={(e) => setFileName(e.target.value)}
            placeholder="my_publisher.py"
            disabled={!!currentFile}
          />
          {detectedKind && (
            <HintText>
              Detected{" "}
              <b>
                {detectedKind === "launch"
                  ? "ROS 2 launch file"
                  : detectedKind === "cpp"
                  ? "C++ node"
                  : "Python node"}
              </b>{" "}
              → saves as <code>{resolvedName}</code>
            </HintText>
          )}
          {currentFile && <HintText>Will update current file</HintText>}
        </div>
      )}

      {saveStatus && (
        <div className={`rf-info-card ${saveStatus.includes("✅") ? "rf-info-card--green" : "rf-info-card--red"}`}>
          {saveStatus}
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginTop: 4 }}>
        <button
          className="btn"
          onClick={handleSaveFile}
          disabled={!hasCommand || !canvasId || saving}
          title={hasCommand && canvasId ? (currentFile ? "Update current file with generated code" : "Save code as Python file") : "Connect blocks and ensure workspace is ready"}
        >
          {saving ? "💾 Saving..." : currentFile ? "💾 Update File" : "💾 Save File"}
        </button>

        <button
          className="btn"
          onClick={handleRunClick}
          disabled={!hasCommand || !onExecute}
          title={hasCommand ? "Execute command in terminal" : "Connect blocks to generate a command"}
        >
          ▶ Run
        </button>
      </div>
    </NodeCard>
  );
}
