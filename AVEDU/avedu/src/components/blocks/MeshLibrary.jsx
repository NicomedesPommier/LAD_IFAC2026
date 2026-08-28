// =============================================================
// FILE: src/components/blocks/MeshLibrary.jsx
// Modal component for managing custom mesh library
// =============================================================
import React, { useState, useEffect } from "react";
import fileApi from "../../services/fileApi";
import "../../styles/components/_mesh-library.scss";

/**
 * MeshLibrary - Modal for browsing and selecting custom meshes
 */
export function MeshLibrary({ canvasId, onSelect, onClose }) {
  const [meshes, setMeshes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadMeshes();
  }, [canvasId]);

  const loadMeshes = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await fileApi.listMeshes(canvasId);
      setMeshes(data);
    } catch (err) {
      const errorMsg = err.message || "Failed to load mesh library";
      setError(`${errorMsg}. The mesh API may not be implemented yet.`);
      console.error("Error loading meshes:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (meshId) => {
    if (!window.confirm("Delete this mesh from your library?")) return;

    try {
      await fileApi.deleteMesh(canvasId, meshId);
      await loadMeshes();
    } catch (err) {
      alert("Failed to delete mesh");
      console.error("Error deleting mesh:", err);
    }
  };

  const handleSelect = (mesh) => {
    onSelect(mesh);
    onClose();
  };

  return (
    <div className="mesh-library-overlay" onClick={onClose}>
      <div className="mesh-library" onClick={(e) => e.stopPropagation()}>
        <div className="mesh-library__header">
          <h3 className="mesh-library__title">Custom Mesh Library</h3>
          <button className="mesh-library__close" onClick={onClose}>
            ✕
          </button>
        </div>

        <div className="mesh-library__content">
          {loading && (
            <div className="mesh-library__message">Loading meshes...</div>
          )}

          {error && (
            <div className="mesh-library__message mesh-library__message--error">
              {error}
            </div>
          )}

          {!loading && !error && meshes.length === 0 && (
            <div className="mesh-library__message">
              No custom meshes yet. Upload or import meshes to build your library.
            </div>
          )}

          {!loading && !error && meshes.length > 0 && (
            <div className="mesh-library__grid">
              {meshes.map((mesh) => (
                <div key={mesh.id} className="mesh-card">
                  <div className="mesh-card__icon">📦</div>
                  <div className="mesh-card__info">
                    <div className="mesh-card__name">{mesh.name}</div>
                    <div className="mesh-card__path">{mesh.file_path}</div>
                    <div className="mesh-card__size">
                      {(mesh.file_size / 1024).toFixed(1)} KB
                    </div>
                  </div>
                  <div className="mesh-card__actions">
                    <button
                      className="mesh-card__btn mesh-card__btn--select"
                      onClick={() => handleSelect(mesh)}
                    >
                      Select
                    </button>
                    <button
                      className="mesh-card__btn mesh-card__btn--delete"
                      onClick={() => handleDelete(mesh.id)}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
