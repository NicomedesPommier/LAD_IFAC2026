import React, { useState } from "react";
import { Position } from "@xyflow/react";
import {
  NodeCard,
  LabeledInput,
  LabeledSelect,
  VectorInput,
  HintText,
  HandleWithLabel,
} from "./components";
import { MeshLibrary } from "./MeshLibrary";
import fileApi from "../../services/fileApi";

const TYPE_OPTIONS = [
  { value: "mesh",     label: "Mesh" },
  { value: "box",      label: "Box" },
  { value: "cylinder", label: "Cylinder" },
  { value: "sphere",   label: "Sphere" },
];

const VALID_MESH_EXT = [".stl", ".dae", ".obj", ".STL", ".DAE", ".OBJ"];

/**
 * Reusable geometry block — supports mesh (upload / URL / library / manual
 * path), box, cylinder, sphere. Picks up canvasId via data to scope uploads.
 */
export default function GeometryNode({ id, data }) {
  const d = data || {};
  const edit = (patch) => d.onChange?.(id, patch);

  const geometry = d.geometry || { type: "box", size: [1, 1, 1] };
  const canvasId = d.canvasId;

  const [meshSource,     setMeshSource]     = useState("manual"); // manual | upload | url | library
  const [uploadProgress, setUploadProgress] = useState(null);
  const [showLibrary,    setShowLibrary]    = useState(false);
  const [urlInput,       setUrlInput]       = useState("");

  const setGeometry = (patch) => edit({ geometry: { ...geometry, ...patch } });

  const handleFileUpload = async (event) => {
    const file = event.target.files?.[0];
    if (!file || !canvasId) return;

    const extension = file.name.substring(file.name.lastIndexOf("."));
    if (!VALID_MESH_EXT.includes(extension)) {
      alert("Please upload a valid mesh file (.stl, .dae, .obj)");
      return;
    }

    try {
      setUploadProgress("Uploading...");
      const result = await fileApi.uploadMesh(canvasId, file);
      setGeometry({ filename: result.file_path });
      setUploadProgress("Uploaded!");
      setTimeout(() => setUploadProgress(null), 2000);
    } catch (error) {
      console.error("Upload failed:", error);
      const errorMsg = error.message || "Upload failed";
      setUploadProgress(`Error: ${errorMsg}`);
      alert(`Upload failed: ${errorMsg}\n\nThe mesh upload API endpoint may not be implemented yet. Please check the Django backend.`);
      setTimeout(() => setUploadProgress(null), 5000);
    }
  };

  const handleUrlImport = async () => {
    if (!urlInput || !canvasId) return;
    try {
      setUploadProgress("Importing...");
      const result = await fileApi.importMeshFromUrl(canvasId, urlInput);
      setGeometry({ filename: result.file_path });
      setUrlInput("");
      setUploadProgress("Imported!");
      setTimeout(() => setUploadProgress(null), 2000);
    } catch (error) {
      console.error("Import failed:", error);
      const errorMsg = error.message || "Import failed";
      setUploadProgress(`Error: ${errorMsg}`);
      alert(`Import failed: ${errorMsg}\n\nThe mesh import API endpoint may not be implemented yet. Please check the Django backend.`);
      setTimeout(() => setUploadProgress(null), 5000);
    }
  };

  const handleLibrarySelect = (mesh) => setGeometry({ filename: mesh.file_path });

  const onTypeChange = (type) => {
    const next = { type };
    if (type === "mesh")          { next.filename = geometry.filename || ""; next.scale = geometry.scale || [1, 1, 1]; }
    else if (type === "box")      { next.size = geometry.size || [1, 1, 1]; }
    else if (type === "cylinder") { next.radius = geometry.radius || 0.5; next.length = geometry.length || 1; }
    else if (type === "sphere")   { next.radius = geometry.radius || 0.5; }
    edit({ geometry: next });
  };

  return (
    <NodeCard
      title="Geometry"
      size="lg"
      handles={
        <HandleWithLabel
          type="source"
          position={Position.Right}
          id="geometry"
          label="geometry"
          color="blue"
        />
      }
    >
      <LabeledSelect
        label="Type"
        value={geometry.type || "box"}
        onChange={onTypeChange}
        options={TYPE_OPTIONS}
      />

      {geometry.type === "mesh" && (
        <>
          <div className="rf-field">
            <label>Mesh Source</label>
            <div className="rf-btn-group">
              {["manual", "upload", "url", "library"].map((m) => (
                <button
                  key={m}
                  className={`rf-btn-tab ${meshSource === m ? "active" : ""}`}
                  onClick={() => {
                    setMeshSource(m);
                    if (m === "library") setShowLibrary(true);
                  }}
                >
                  {m === "manual" ? "Manual" : m === "upload" ? "Upload" : m === "url" ? "URL" : "Library"}
                </button>
              ))}
            </div>
          </div>

          {meshSource === "manual" && (
            <div className="rf-field">
              <LabeledInput
                label="Mesh File Path"
                value={geometry.filename || ""}
                onChange={(v) => setGeometry({ filename: v })}
                placeholder="package://path/to/mesh.stl"
              />
              <HintText>e.g., package://my_robot/meshes/body.stl</HintText>
            </div>
          )}

          {meshSource === "upload" && (
            <div className="rf-field">
              <label>Upload Mesh File</label>
              <input
                type="file"
                className="rf-input"
                accept=".stl,.dae,.obj,.STL,.DAE,.OBJ"
                onChange={handleFileUpload}
                disabled={!canvasId}
              />
              {uploadProgress && <div className="rf-upload-status">{uploadProgress}</div>}
              {!canvasId && <HintText tone="warn">Canvas required for upload</HintText>}
              <HintText>Supported: .stl, .dae, .obj</HintText>
            </div>
          )}

          {meshSource === "url" && (
            <div className="rf-field">
              <label>Import from URL</label>
              <div className="rf-row">
                <input
                  className="rf-input"
                  value={urlInput}
                  onChange={(e) => setUrlInput(e.target.value)}
                  placeholder="http://example.com/mesh.stl"
                  disabled={!canvasId}
                />
                <button
                  className="rf-btn rf-btn--primary"
                  onClick={handleUrlImport}
                  disabled={!canvasId || !urlInput}
                >
                  Import
                </button>
              </div>
              {uploadProgress && <div className="rf-upload-status">{uploadProgress}</div>}
              {!canvasId && <HintText tone="warn">Canvas required for import</HintText>}
              <HintText>e.g., http://localhost:7000/qcar_description/meshes/QCarBody.stl</HintText>
            </div>
          )}

          {geometry.filename && (
            <div className="rf-field">
              <label>Current Mesh</label>
              <div className="rf-mesh-display">
                <code>{geometry.filename}</code>
              </div>
            </div>
          )}

          <VectorInput
            label="Scale (x y z)"
            value={geometry.scale || [1, 1, 1]}
            onChange={(next) => setGeometry({ scale: next })}
            placeholders={["x", "y", "z"]}
            step={0.1}
          />
        </>
      )}

      {geometry.type === "box" && (
        <VectorInput
          label="Size (x y z)"
          value={geometry.size || [1, 1, 1]}
          onChange={(next) => setGeometry({ size: next })}
          placeholders={["width", "depth", "height"]}
          step={0.1}
        />
      )}

      {(geometry.type === "cylinder" || geometry.type === "sphere") && (
        <LabeledInput
          label="Radius"
          type="number" step="0.1"
          value={geometry.radius ?? 0.5}
          onChange={(v) => setGeometry({ radius: v || 0.5 })}
          placeholder="0.5"
        />
      )}

      {geometry.type === "cylinder" && (
        <LabeledInput
          label="Length"
          type="number" step="0.1"
          value={geometry.length ?? 1}
          onChange={(v) => setGeometry({ length: v || 1 })}
          placeholder="1.0"
        />
      )}

      {showLibrary && canvasId && (
        <MeshLibrary
          canvasId={canvasId}
          onSelect={handleLibrarySelect}
          onClose={() => setShowLibrary(false)}
        />
      )}
    </NodeCard>
  );
}
