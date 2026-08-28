import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { MdDeleteForever } from "react-icons/md";
import Swal from "sweetalert2";
import * as fileApi from "../../services/fileApi";
import "../../styles/components/_canvas-selector.scss";

const CANVAS_LIST_CACHE_KEY = "canvas_list_cache";
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

/**
 * Canvas Selector - Shows all user canvases as cards with create option
 */
export default function CanvasSelector({ onCanvasSelect }) {
  const navigate = useNavigate();
  const [canvases, setCanvases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newCanvasName, setNewCanvasName] = useState("");
  const [newCanvasDescription, setNewCanvasDescription] = useState("");
  const [connectToQcar, setConnectToQcar] = useState(false);
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedCanvases, setSelectedCanvases] = useState(new Set());
  const [loadedFromCache, setLoadedFromCache] = useState(false);

  useEffect(() => {
    loadCanvases();
  }, []);

  async function loadCanvases() {
    try {
      setLoading(true);

      // Try to load from cache first
      const cachedData = loadFromCache();
      if (cachedData) {
        console.log("[CanvasSelector] ⚡ Loading from cache");
        setCanvases(cachedData);
        setLoadedFromCache(true);
        setLoading(false);

        // Refresh in background
        setTimeout(() => {
          refreshCanvasesInBackground();
        }, 500);
        return;
      }

      // No cache, load from backend
      const data = await fileApi.listCanvases();
      setCanvases(data);
      saveToCache(data);
    } catch (error) {
      console.error("Failed to load canvases:", error);
    } finally {
      setLoading(false);
    }
  }

  async function refreshCanvasesInBackground() {
    try {
      console.log("[CanvasSelector] Refreshing canvas list in background");
      const data = await fileApi.listCanvases();
      setCanvases(data);
      setLoadedFromCache(false);
      saveToCache(data);
      console.log("[CanvasSelector] ✓ Background refresh complete");
    } catch (error) {
      console.error("[CanvasSelector] Background refresh failed:", error);
    }
  }

  function loadFromCache() {
    try {
      const cached = localStorage.getItem(CANVAS_LIST_CACHE_KEY);
      if (!cached) return null;

      const { canvases, timestamp } = JSON.parse(cached);
      const age = Date.now() - timestamp;

      // Only use cache if less than CACHE_DURATION old
      if (age < CACHE_DURATION) {
        console.log("[CanvasSelector] Cache age:", Math.round(age / 1000), "seconds");
        return canvases;
      } else {
        console.log("[CanvasSelector] Cache expired, clearing");
        localStorage.removeItem(CANVAS_LIST_CACHE_KEY);
        return null;
      }
    } catch (error) {
      console.error("[CanvasSelector] Failed to load cache:", error);
      localStorage.removeItem(CANVAS_LIST_CACHE_KEY);
      return null;
    }
  }

  function saveToCache(canvases) {
    try {
      const cacheData = {
        canvases,
        timestamp: Date.now(),
      };
      localStorage.setItem(CANVAS_LIST_CACHE_KEY, JSON.stringify(cacheData));
      console.log("[CanvasSelector] 💾 Canvas list cached");
    } catch (error) {
      console.error("[CanvasSelector] Failed to save cache:", error);
    }
  }

  function invalidateCache() {
    localStorage.removeItem(CANVAS_LIST_CACHE_KEY);
    console.log("[CanvasSelector] Cache invalidated");
  }

  async function handleCreateCanvas() {
    if (!newCanvasName.trim()) return;

    try {
      const canvas = await fileApi.createCanvas({
        name: newCanvasName,
        description: newCanvasDescription,
        connect_to_qcar: connectToQcar,
      });
      const updatedCanvases = [...canvases, canvas];
      setCanvases(updatedCanvases);
      saveToCache(updatedCanvases); // Update cache with new canvas
      setShowCreateModal(false);
      setNewCanvasName("");
      setNewCanvasDescription("");
      setConnectToQcar(false);
      onCanvasSelect(canvas);
    } catch (error) {
      console.error("Failed to create canvas:", error);
      alert("Failed to create canvas. Please try again.");
    }
  }

  function handleCanvasClick(canvas) {
    if (selectionMode) {
      toggleCanvasSelection(canvas.id);
    } else {
      onCanvasSelect(canvas);
    }
  }

  function toggleSelectionMode() {
    setSelectionMode(!selectionMode);
    setSelectedCanvases(new Set());
  }

  function toggleCanvasSelection(canvasId) {
    const newSelected = new Set(selectedCanvases);
    if (newSelected.has(canvasId)) {
      newSelected.delete(canvasId);
    } else {
      newSelected.add(canvasId);
    }
    setSelectedCanvases(newSelected);
  }

  function selectAll() {
    setSelectedCanvases(new Set(canvases.map(c => c.id)));
  }

  function deselectAll() {
    setSelectedCanvases(new Set());
  }

  async function handleDeleteCanvas(e, canvas) {
    e.stopPropagation(); // Prevent canvas selection when clicking delete

    const result = await Swal.fire({
      title: 'Delete Workspace?',
      html: `
        <p style="margin: 1rem 0; font-size: 1rem; line-height: 1.6;">
          Are you sure you want to delete <strong style="color: #7df9ff;">"${canvas.name}"</strong>?
        </p>
        <p style="margin: 1rem 0; font-size: 0.9rem; opacity: 0.8;">
          This action cannot be undone and will delete all files in this workspace.
        </p>
      `,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Delete',
      cancelButtonText: 'Cancel',
      background: 'rgba(10, 10, 20, 0.95)',
      color: '#e0e0e0',
      backdrop: 'rgba(0, 0, 0, 0.8)',
      customClass: {
        popup: 'lad-swal-popup',
        title: 'lad-swal-title',
        htmlContainer: 'lad-swal-html',
        confirmButton: 'lad-swal-confirm',
        cancelButton: 'lad-swal-cancel'
      },
      buttonsStyling: false
    });

    if (!result.isConfirmed) return;

    try {
      await fileApi.deleteCanvas(canvas.id);
      const updatedCanvases = canvases.filter(c => c.id !== canvas.id);
      setCanvases(updatedCanvases);
      saveToCache(updatedCanvases); // Update cache after deletion

      Swal.fire({
        title: 'Deleted!',
        text: 'Workspace has been deleted successfully.',
        icon: 'success',
        timer: 2000,
        showConfirmButton: false,
        background: 'rgba(10, 10, 20, 0.95)',
        color: '#e0e0e0',
        customClass: {
          popup: 'lad-swal-popup',
          title: 'lad-swal-title'
        }
      });
    } catch (error) {
      console.error("Failed to delete canvas:", error);
      Swal.fire({
        title: 'Error!',
        text: 'Failed to delete canvas. Please try again.',
        icon: 'error',
        background: 'rgba(10, 10, 20, 0.95)',
        color: '#e0e0e0',
        customClass: {
          popup: 'lad-swal-popup',
          title: 'lad-swal-title'
        }
      });
    }
  }

  async function handleDeleteSelected() {
    if (selectedCanvases.size === 0) return;

    const selectedCanvasNames = canvases
      .filter(c => selectedCanvases.has(c.id))
      .map(c => c.name);

    const result = await Swal.fire({
      title: 'Delete Multiple Workspaces?',
      html: `
        <p style="margin: 1rem 0; font-size: 1rem; line-height: 1.6;">
          Are you sure you want to delete <strong style="color: #7df9ff;">${selectedCanvases.size} workspace${selectedCanvases.size > 1 ? 's' : ''}</strong>?
        </p>
        <div style="margin: 1rem 0; max-height: 150px; overflow-y: auto; padding: 0.5rem; background: rgba(125, 249, 255, 0.05); border-radius: 8px;">
          ${selectedCanvasNames.map(name => `<div style="padding: 0.25rem 0; color: #7df9ff;">• ${name}</div>`).join('')}
        </div>
        <p style="margin: 1rem 0; font-size: 0.9rem; opacity: 0.8;">
          This action cannot be undone and will delete all files in these workspaces.
        </p>
      `,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: `Delete ${selectedCanvases.size} Workspace${selectedCanvases.size > 1 ? 's' : ''}`,
      cancelButtonText: 'Cancel',
      background: 'rgba(10, 10, 20, 0.95)',
      color: '#e0e0e0',
      backdrop: 'rgba(0, 0, 0, 0.8)',
      customClass: {
        popup: 'lad-swal-popup',
        title: 'lad-swal-title',
        htmlContainer: 'lad-swal-html',
        confirmButton: 'lad-swal-confirm',
        cancelButton: 'lad-swal-cancel'
      },
      buttonsStyling: false
    });

    if (!result.isConfirmed) return;

    try {
      // Delete all selected canvases
      await Promise.all(
        Array.from(selectedCanvases).map(id => fileApi.deleteCanvas(id))
      );

      // Update state and cache
      const updatedCanvases = canvases.filter(c => !selectedCanvases.has(c.id));
      setCanvases(updatedCanvases);
      saveToCache(updatedCanvases); // Update cache after deletion
      setSelectedCanvases(new Set());
      setSelectionMode(false);

      Swal.fire({
        title: 'Deleted!',
        text: `${selectedCanvases.size} workspace${selectedCanvases.size > 1 ? 's have' : ' has'} been deleted successfully.`,
        icon: 'success',
        timer: 2000,
        showConfirmButton: false,
        background: 'rgba(10, 10, 20, 0.95)',
        color: '#e0e0e0',
        customClass: {
          popup: 'lad-swal-popup',
          title: 'lad-swal-title'
        }
      });
    } catch (error) {
      console.error("Failed to delete canvases:", error);
      Swal.fire({
        title: 'Error!',
        text: 'Failed to delete some workspaces. Please try again.',
        icon: 'error',
        background: 'rgba(10, 10, 20, 0.95)',
        color: '#e0e0e0',
        customClass: {
          popup: 'lad-swal-popup',
          title: 'lad-swal-title'
        }
      });
    }
  }

  if (loading) {
    return (
      <div className="screen">
        <div className="overlay overlay--scan" />
        <div className="overlay overlay--vignette" />
        <div className="stars" aria-hidden />
        <div className="stars stars--2" aria-hidden />
        <div className="stars stars--3" aria-hidden />
        <div className="canvas-selector">
          <div className="canvas-selector__loading">Loading canvases...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="screen">
      <div className="overlay overlay--scan" />
      <div className="overlay overlay--vignette" />
      <div className="stars" aria-hidden />
      <div className="stars stars--2" aria-hidden />
      <div className="stars stars--3" aria-hidden />

      <div className="canvas-selector">
        {/* Home Button */}
        <button className="canvas-selector__home" onClick={() => navigate("/")}>
          ← HOME
        </button>

        <div className="canvas-selector__header">
          <h1 className="title">
            <span>MY WORKSPACES</span>
            <small>
              SELECT OR CREATE A ROS PROJECT
              {loadedFromCache && (
                <span
                  style={{
                    marginLeft: "0.75rem",
                    padding: "0.2rem 0.5rem",
                    background: "rgba(125, 249, 255, 0.15)",
                    border: "1px solid var(--neon)",
                    borderRadius: "4px",
                    color: "var(--neon)",
                    fontSize: "0.75em",
                    fontWeight: "600",
                    letterSpacing: "0.5px",
                  }}
                  title="Workspaces loaded from cache for instant access"
                >
                  ⚡ CACHED
                </span>
              )}
            </small>
          </h1>
        </div>

        {/* Selection Controls */}
        {canvases.length > 0 && (
          <div className="canvas-selector__controls">
            <button
              className={`canvas-selector__control-btn ${selectionMode ? 'active' : ''}`}
              onClick={toggleSelectionMode}
            >
              {selectionMode ? 'Cancel Selection' : 'Select Multiple'}
            </button>

            {selectionMode && (
              <>
                <button
                  className="canvas-selector__control-btn"
                  onClick={selectAll}
                >
                  Select All
                </button>
                <button
                  className="canvas-selector__control-btn"
                  onClick={deselectAll}
                  disabled={selectedCanvases.size === 0}
                >
                  Deselect All
                </button>
                <button
                  className="canvas-selector__control-btn canvas-selector__control-btn--delete"
                  onClick={handleDeleteSelected}
                  disabled={selectedCanvases.size === 0}
                >
                  Delete Selected ({selectedCanvases.size})
                </button>
              </>
            )}
          </div>
        )}

      <div className="canvas-selector__grid">
        {/* Create New Canvas Card - Always first */}
        <div
          className="canvas-card canvas-card--create"
          onClick={() => setShowCreateModal(true)}
        >
          <div className="canvas-card__icon">+</div>
          <div className="canvas-card__title">Create Canvas</div>
          <div className="canvas-card__description">
            Start a new ROS workspace
          </div>
        </div>

        {/* Existing Canvases */}
        {canvases.map((canvas) => (
          <div
            key={canvas.id}
            className={`canvas-card ${selectedCanvases.has(canvas.id) ? 'canvas-card--selected' : ''}`}
            onClick={() => handleCanvasClick(canvas)}
          >
            {selectionMode && (
              <div className="canvas-card__checkbox">
                <input
                  type="checkbox"
                  checked={selectedCanvases.has(canvas.id)}
                  onChange={() => toggleCanvasSelection(canvas.id)}
                  onClick={(e) => e.stopPropagation()}
                />
              </div>
            )}
            <div className="canvas-card__header">
              <div className="canvas-card__title">{canvas.name}</div>
              <div className="canvas-card__actions">
                {!selectionMode && (
                  <button
                    className="canvas-card__delete"
                    onClick={(e) => handleDeleteCanvas(e, canvas)}
                    title="Delete workspace"
                  >
                    <MdDeleteForever />
                  </button>
                )}
                <div className="canvas-card__date">
                  {new Date(canvas.updated_at).toLocaleDateString()}
                </div>
              </div>
            </div>
            {canvas.description && (
              <div className="canvas-card__description">
                {canvas.description}
              </div>
            )}
            <div className="canvas-card__meta">
              <span className="canvas-card__id">ID: {canvas.id.slice(0, 8)}...</span>
              {canvas.connect_to_qcar && (
                <span className="canvas-card__qcar-badge">QCAR</span>
              )}
            </div>
          </div>
        ))}
      </div>

        {/* Create Canvas Modal */}
        {showCreateModal && (
          <div className="canvas-modal" onClick={() => { setShowCreateModal(false); setConnectToQcar(false); }}>
            <div className="canvas-modal__content" onClick={(e) => e.stopPropagation()}>
              <div className="canvas-modal__header">
                <h2>Create New Canvas</h2>
                <button
                  className="canvas-modal__close"
                  onClick={() => { setShowCreateModal(false); setConnectToQcar(false); }}
                >
                  ×
                </button>
              </div>

              <div className="canvas-modal__body">
                <div className="canvas-modal__field">
                  <label htmlFor="canvas-name">Workspace Name</label>
                  <input
                    id="canvas-name"
                    type="text"
                    placeholder="e.g., My Robot Project"
                    value={newCanvasName}
                    onChange={(e) => setNewCanvasName(e.target.value)}
                    onKeyPress={(e) => e.key === "Enter" && handleCreateCanvas()}
                    autoFocus
                  />
                </div>

                <div className="canvas-modal__field">
                  <label htmlFor="canvas-description">Description (optional)</label>
                  <textarea
                    id="canvas-description"
                    placeholder="Brief description of your project..."
                    value={newCanvasDescription}
                    onChange={(e) => setNewCanvasDescription(e.target.value)}
                    rows={3}
                  />
                </div>

                <div className="canvas-modal__field canvas-modal__field--toggle">
                  <div className="canvas-modal__toggle-row">
                    <div className="canvas-modal__toggle-info">
                      <span className="canvas-modal__toggle-label">Connect to QCar</span>
                      <span className="canvas-modal__toggle-hint">
                        Send ROS topics directly to QCar2 without workspace namespace isolation
                      </span>
                    </div>
                    <button
                      type="button"
                      role="switch"
                      aria-checked={connectToQcar}
                      className={`canvas-modal__toggle ${connectToQcar ? "canvas-modal__toggle--on" : ""}`}
                      onClick={() => setConnectToQcar((v) => !v)}
                    >
                      <span className="canvas-modal__toggle-thumb" />
                    </button>
                  </div>
                </div>
              </div>

              <div className="canvas-modal__footer">
                <button
                  className="canvas-modal__button canvas-modal__button--cancel"
                  onClick={() => { setShowCreateModal(false); setConnectToQcar(false); }}
                >
                  Cancel
                </button>
                <button
                  className="canvas-modal__button canvas-modal__button--create"
                  onClick={handleCreateCanvas}
                  disabled={!newCanvasName.trim()}
                >
                  Create Canvas
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
