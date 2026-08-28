// components/ide/FileExplorer.jsx
import React, { useState, useCallback, useMemo } from "react";
import PropTypes from "prop-types";
import Swal from "sweetalert2";
import { FaPython } from "react-icons/fa";
import { FaFolder, FaFolderOpen } from "react-icons/fa6";
import "./FileExplorer.scss";

/**
 * File tree explorer with create/delete/rename operations
 *
 * @param {Object} props
 * @param {Array} props.files - File tree structure
 * @param {string} props.currentFile - Currently selected file path
 * @param {Function} props.onFileSelect - Callback when file is selected
 * @param {Function} props.onFileCreate - Callback to create new file
 * @param {Function} props.onFileDelete - Callback to delete file
 * @param {Function} props.onFileRename - Callback to rename file
 * @param {boolean} props.loading - Show loading state
 */
export function FileExplorer({
  files = [],
  currentFile = null,
  onFileSelect,
  onFileCreate,
  onFileDelete,
  onFileRename,
  onRefresh,
  loading = false,
  isQCarMode = false,
  error = null,
}) {
  const [expanded, setExpanded] = useState(new Set(["/"]));
  const [contextMenu, setContextMenu] = useState(null);
  const [renaming, setRenaming] = useState(null);
  const [newName, setNewName] = useState("");
  const [refreshing, setRefreshing] = useState(false);

  // Get all directories from file tree for location dropdown
  const getAllDirectories = useCallback((items, parentPath = "", result = []) => {
    items.forEach(item => {
      if (item.type === "directory" || item.type === "dir") {
        const fullPath = parentPath ? `${parentPath}/${item.name}` : item.name;
        result.push({ name: fullPath, path: item.path });
        if (item.children && item.children.length > 0) {
          getAllDirectories(item.children, fullPath, result);
        }
      }
    });
    return result;
  }, []);

  const directories = useMemo(() => getAllDirectories(files), [files, getAllDirectories]);

  // Toggle folder expand/collapse
  const toggleExpand = useCallback((path) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(path)) {
        next.delete(path);
      } else {
        next.add(path);
      }
      return next;
    });
  }, []);

  // Handle file/folder click
  const handleClick = useCallback(
    (item, evt) => {
      evt.stopPropagation();

      if (item.type === "directory") {
        toggleExpand(item.path);
      } else if (item.type === "file") {
        onFileSelect?.(item.path);
      }
    },
    [toggleExpand, onFileSelect]
  );

  // Handle right-click context menu
  const handleContextMenu = useCallback((item, evt) => {
    evt.preventDefault();
    evt.stopPropagation();

    setContextMenu({
      item,
      x: evt.clientX,
      y: evt.clientY,
    });
  }, []);

  // Close context menu
  const closeContextMenu = useCallback(() => {
    setContextMenu(null);
  }, []);

  // Show SweetAlert2 modal for creating files/folders
  const showCreateModal = useCallback(async (defaultLocation = "") => {
    const directoryOptions = directories.length > 0
      ? directories.map(dir => `<option value="${dir.path}">${dir.name}</option>`).join('')
      : '<option value="/">/</option>';

    const result = await Swal.fire({
      title: 'Create New File or Folder',
      html: `
        <div style="text-align: left; padding: 0 1rem;">
          <div style="margin-bottom: 1rem;">
            <label style="display: block; margin-bottom: 0.5rem; font-weight: 600;">Type</label>
            <select id="swal-type" class="swal2-input" style="width: 100%; margin: 0;">
              <option value="file">📄 File</option>
              <option value="directory">📁 Folder</option>
            </select>
          </div>
          <div style="margin-bottom: 1rem;">
            <label style="display: block; margin-bottom: 0.5rem; font-weight: 600;">Location</label>
            <select id="swal-location" class="swal2-input" style="width: 100%; margin: 0;">
              <option value="/">/ (root)</option>
              ${directoryOptions}
            </select>
          </div>
          <div style="margin-bottom: 1rem;">
            <label style="display: block; margin-bottom: 0.5rem; font-weight: 600;">Name</label>
            <input id="swal-name" class="swal2-input" placeholder="my_script.py" style="width: 100%; margin: 0;">
          </div>
        </div>
      `,
      showCancelButton: true,
      confirmButtonText: 'Create',
      cancelButtonText: 'Cancel',
      background: 'rgba(10, 10, 20, 0.95)',
      color: '#e0e0e0',
      customClass: {
        popup: 'lad-swal-popup',
        title: 'lad-swal-title',
        confirmButton: 'lad-swal-confirm',
        cancelButton: 'lad-swal-cancel'
      },
      buttonsStyling: false,
      didOpen: () => {
        const locationSelect = document.getElementById('swal-location');
        if (defaultLocation && locationSelect) {
          locationSelect.value = defaultLocation;
        }
        document.getElementById('swal-name')?.focus();
      },
      preConfirm: () => {
        const type = document.getElementById('swal-type').value;
        const location = document.getElementById('swal-location').value;
        const name = document.getElementById('swal-name').value.trim();

        if (!name) {
          Swal.showValidationMessage('Please enter a name');
          return false;
        }

        // Validate file/folder name
        if (!/^[a-zA-Z0-9_.-]+$/.test(name)) {
          Swal.showValidationMessage('Name can only contain letters, numbers, underscores, dots, and hyphens');
          return false;
        }

        return { type, location, name };
      }
    });

    if (result.isConfirmed && result.value) {
      const { type, location, name } = result.value;
      const fullPath = location === '/' ? name : `${location}/${name}`;
      onFileCreate?.(fullPath, type);
    }
  }, [directories, onFileCreate]);

  // Handle context menu actions
  const handleNewFile = useCallback(() => {
    const parentPath = contextMenu.item.type === "directory"
      ? contextMenu.item.path
      : contextMenu.item.path.split("/").slice(0, -1).join("/");

    closeContextMenu();
    showCreateModal(parentPath);
  }, [contextMenu, closeContextMenu, showCreateModal]);

  const handleNewFolder = useCallback(() => {
    const parentPath = contextMenu.item.type === "directory"
      ? contextMenu.item.path
      : contextMenu.item.path.split("/").slice(0, -1).join("/");

    closeContextMenu();
    showCreateModal(parentPath);
  }, [contextMenu, closeContextMenu, showCreateModal]);

  const handleDelete = useCallback(async () => {
    const itemPath = contextMenu.item.path;
    const itemType = contextMenu.item.type === "directory" ? "folder" : "file";
    closeContextMenu();

    const result = await Swal.fire({
      title: `Delete ${itemType}?`,
      html: `
        <div style="text-align: left; padding: 0 1rem;">
          <p style="margin-bottom: 1rem; color: #e0e0e0;">
            Are you sure you want to delete this ${itemType}?
          </p>
          <p style="margin-bottom: 0; font-family: monospace; color: #ff6b6b;">
            ${itemPath}
          </p>
        </div>
      `,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Delete',
      cancelButtonText: 'Cancel',
      background: 'rgba(10, 10, 20, 0.95)',
      color: '#e0e0e0',
      iconColor: '#ff6b6b',
      customClass: {
        popup: 'lad-swal-popup',
        title: 'lad-swal-title',
        confirmButton: 'lad-swal-confirm lad-swal-confirm--danger',
        cancelButton: 'lad-swal-cancel'
      },
      buttonsStyling: false,
    });

    if (result.isConfirmed) {
      onFileDelete?.(itemPath);
    }
  }, [contextMenu, onFileDelete, closeContextMenu]);

  const handleRename = useCallback(() => {
    setRenaming(contextMenu.item.path);
    setNewName(contextMenu.item.name);
    closeContextMenu();
  }, [contextMenu, closeContextMenu]);

  const confirmRename = useCallback(
    (oldPath) => {
      if (newName && newName !== oldPath.split("/").pop()) {
        const newPath = oldPath.split("/").slice(0, -1).concat(newName).join("/");
        onFileRename?.(oldPath, newPath);
      }
      setRenaming(null);
      setNewName("");
    },
    [newName, onFileRename]
  );

  const cancelRename = useCallback(() => {
    setRenaming(null);
    setNewName("");
  }, []);

  // Get file icon based on extension
  const getFileIcon = useCallback((item) => {
    if (item.type === "directory") {
      return expanded.has(item.path) ? <FaFolderOpen /> : <FaFolder />;
    }

    const ext = item.name.split(".").pop().toLowerCase();
    const iconMap = {
      py: <FaPython />,
      cpp: "⚙️",
      h: "⚙️",
      xml: "📄",
      yaml: "📋",
      yml: "📋",
      urdf: "🤖",
      xacro: "🤖",
      launch: "🚀",
      md: "📝",
      txt: "📝",
    };

    return iconMap[ext] || "📄";
  }, [expanded]);

  // Render tree recursively
  const renderTree = useCallback(
    (items, level = 0) => {
      return items.map((item) => {
        const isExpanded = expanded.has(item.path);
        const isSelected = currentFile === item.path;
        const isRenaming = renaming === item.path;

        return (
          <div key={item.path} className="file-tree-item-container">
            <div
              className={`file-tree-item ${
                isSelected ? "file-tree-item--selected" : ""
              }`}
              style={{ paddingLeft: `${level * 16 + 8}px` }}
              onClick={(e) => handleClick(item, e)}
              onContextMenu={(e) => handleContextMenu(item, e)}
            >
              <span className="file-tree-item__icon">
                {getFileIcon(item)}
              </span>

              {isRenaming ? (
                <input
                  className="file-tree-item__input"
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  onBlur={() => confirmRename(item.path)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") confirmRename(item.path);
                    if (e.key === "Escape") cancelRename();
                  }}
                  autoFocus
                  onClick={(e) => e.stopPropagation()}
                />
              ) : (
                <span className="file-tree-item__name">{item.name}</span>
              )}

              {item.unsaved && (
                <span className="file-tree-item__badge">●</span>
              )}
            </div>

            {item.type === "directory" &&
              isExpanded &&
              item.children &&
              item.children.length > 0 && (
                <div className="file-tree-children">
                  {renderTree(item.children, level + 1)}
                </div>
              )}
          </div>
        );
      });
    },
    [
      expanded,
      currentFile,
      renaming,
      newName,
      handleClick,
      handleContextMenu,
      getFileIcon,
      confirmRename,
      cancelRename,
    ]
  );

  // Click outside to close context menu
  React.useEffect(() => {
    if (contextMenu) {
      document.addEventListener("click", closeContextMenu);
      return () => document.removeEventListener("click", closeContextMenu);
    }
  }, [contextMenu, closeContextMenu]);

  const handleRefresh = useCallback(async () => {
    if (!onRefresh || refreshing) return;
    setRefreshing(true);
    try {
      await onRefresh();
    } finally {
      setRefreshing(false);
    }
  }, [onRefresh, refreshing]);

  return (
    <div className="file-explorer">
      <div className="file-explorer__header">
        <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
          <span className="file-explorer__title">Files</span>
          {isQCarMode && (
            <span
              style={{
                fontSize: "0.65rem",
                fontWeight: 700,
                letterSpacing: "0.5px",
                padding: "0.1rem 0.35rem",
                borderRadius: "3px",
                background: error ? "rgba(255,100,100,0.2)" : "rgba(125,249,255,0.15)",
                border: `1px solid ${error ? "#ff6464" : "var(--neon, #7df9ff)"}`,
                color: error ? "#ff6464" : "var(--neon, #7df9ff)",
              }}
              title={error ? `QCar connection error: ${error}` : "Connected to QCar2 via SFTP"}
            >
              {error ? "QCAR ✗" : "QCAR"}
            </span>
          )}
        </div>
        <div style={{ display: "flex", gap: "0.25rem" }}>
          {onRefresh && (
            <button
              className="file-explorer__action"
              onClick={handleRefresh}
              title={isQCarMode ? "Refresh file tree from QCar" : "Refresh file tree from Docker"}
              disabled={refreshing}
              style={{ opacity: refreshing ? 0.5 : 1 }}
            >
              {refreshing ? "…" : "↻"}
            </button>
          )}
          <button
            className="file-explorer__action"
            onClick={() => showCreateModal("/")}
            title="New File or Folder"
          >
            +
          </button>
        </div>
      </div>

      <div className="file-explorer__tree">
        {loading ? (
          <div className="file-explorer__loading">Loading...</div>
        ) : error ? (
          <div className="file-explorer__empty" style={{ color: "#ff6464" }}>
            <div style={{ marginBottom: "0.5rem" }}>QCar connection failed:</div>
            <div style={{ fontSize: "0.8rem", opacity: 0.85, wordBreak: "break-word" }}>{error}</div>
            {onRefresh && (
              <button
                className="file-explorer__action"
                onClick={handleRefresh}
                style={{ marginTop: "0.75rem", display: "block", width: "100%" }}
              >
                Retry
              </button>
            )}
          </div>
        ) : files.length === 0 ? (
          <div className="file-explorer__empty">
            No files. Right-click to create.
          </div>
        ) : (
          renderTree(files)
        )}
      </div>

      {/* Context Menu */}
      {contextMenu && (
        <div
          className="file-explorer__context-menu"
          style={{
            position: "fixed",
            left: `${contextMenu.x}px`,
            top: `${contextMenu.y}px`,
          }}
        >
          <button onClick={handleNewFile}>New File</button>
          <button onClick={handleNewFolder}>New Folder</button>
          <button onClick={handleRename}>Rename</button>
          <button onClick={handleDelete} className="danger">
            Delete
          </button>
        </div>
      )}
    </div>
  );
}

FileExplorer.propTypes = {
  files: PropTypes.array,
  currentFile: PropTypes.string,
  onFileSelect: PropTypes.func,
  onFileCreate: PropTypes.func,
  onFileDelete: PropTypes.func,
  onFileRename: PropTypes.func,
  onRefresh: PropTypes.func,
  loading: PropTypes.bool,
  isQCarMode: PropTypes.bool,
  error: PropTypes.string,
};

export default FileExplorer;
