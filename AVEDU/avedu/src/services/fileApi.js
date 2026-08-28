/**
 * File API Service
 * Handles all workspace file operations and command execution
 */

import { API_BASE } from "../config";

/**
 * Get authentication headers with JWT token
 */
function getAuthHeaders() {
  const token = localStorage.getItem("token");
  return {
    "Content-Type": "application/json",
    ...(token && { Authorization: `Bearer ${token}` }),
  };
}

/**
 * Handle API response errors
 */
async function handleResponse(response) {
  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: response.statusText }));

    // Extract detailed error message
    let errorMsg;
    if (error.detail) {
      errorMsg = error.detail;
    } else if (error.message) {
      errorMsg = error.message;
    } else if (error.error) {
      errorMsg = error.error;
    } else {
      errorMsg = `API request failed (${response.status})`;
    }

    console.error("[FileAPI] ❌ Request failed:", {
      url: response.url,
      status: response.status,
      statusText: response.statusText,
      error: error,
      errorMessage: errorMsg
    });

    throw new Error(errorMsg);
  }
  return response.json();
}

// =============================================================================
// Canvas/Workspace Operations
// =============================================================================

/**
 * List all canvases for the current user
 */
export async function listCanvases() {
  const response = await fetch(`${API_BASE}/workspace/canvases/`, {
    headers: getAuthHeaders(),
  });
  return handleResponse(response);
}

/**
 * Get a specific canvas by ID
 */
export async function getCanvas(canvasId) {
  const response = await fetch(`${API_BASE}/workspace/canvases/${canvasId}/`, {
    headers: getAuthHeaders(),
  });
  return handleResponse(response);
}

/**
 * Create a new canvas
 */
export async function createCanvas(data) {
  console.log("[FileAPI] Creating canvas:", data);
  console.log("[FileAPI] API endpoint:", `${API_BASE}/workspace/canvases/`);
  console.log("[FileAPI] Auth headers:", getAuthHeaders());

  const response = await fetch(`${API_BASE}/workspace/canvases/`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify(data),
  });

  const result = await handleResponse(response);
  console.log("[FileAPI] Canvas created successfully:", result);
  return result;
}

/**
 * Update a canvas
 */
export async function updateCanvas(canvasId, data) {
  const response = await fetch(`${API_BASE}/workspace/canvases/${canvasId}/`, {
    method: "PATCH",
    headers: getAuthHeaders(),
    body: JSON.stringify(data),
  });
  return handleResponse(response);
}

/**
 * Delete a canvas
 */
export async function deleteCanvas(canvasId) {
  const response = await fetch(`${API_BASE}/workspace/canvases/${canvasId}/`, {
    method: "DELETE",
    headers: getAuthHeaders(),
  });
  if (!response.ok) {
    throw new Error("Failed to delete canvas");
  }
}

/**
 * Get file tree for a canvas
 * @param {string} canvasId - Canvas ID
 * @param {boolean} forceRefresh - Force refresh from Docker (default: false)
 */
export async function getFileTree(canvasId, forceRefresh = false) {
  let url = `${API_BASE}/workspace/canvases/${canvasId}/file_tree/`;
  if (forceRefresh) {
    url += '?refresh=true';
  }

  const response = await fetch(url, {
    headers: getAuthHeaders(),
  });
  return handleResponse(response);
}

// =============================================================================
// File Operations
// =============================================================================

/**
 * List all files in a canvas
 */
export async function listFiles(canvasId) {
  const response = await fetch(`${API_BASE}/workspace/canvases/${canvasId}/files/`, {
    headers: getAuthHeaders(),
  });
  return handleResponse(response);
}

/**
 * Get a specific file
 */
export async function getFile(canvasId, fileId) {
  const response = await fetch(`${API_BASE}/workspace/canvases/${canvasId}/files/${fileId}/`, {
    headers: getAuthHeaders(),
  });
  return handleResponse(response);
}

/**
 * Create a new file or directory
 */
export async function createFile(canvasId, data) {
  const response = await fetch(`${API_BASE}/workspace/canvases/${canvasId}/files/`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify(data),
  });
  return handleResponse(response);
}

/**
 * Update a file's content
 */
export async function updateFile(canvasId, fileId, data) {
  const response = await fetch(`${API_BASE}/workspace/canvases/${canvasId}/files/${fileId}/`, {
    method: "PATCH",
    headers: getAuthHeaders(),
    body: JSON.stringify(data),
  });
  return handleResponse(response);
}

/**
 * Delete a file or directory
 */
export async function deleteFile(canvasId, fileId) {
  const response = await fetch(`${API_BASE}/workspace/canvases/${canvasId}/files/${fileId}/`, {
    method: "DELETE",
    headers: getAuthHeaders(),
  });
  if (!response.ok) {
    throw new Error("Failed to delete file");
  }
}

// =============================================================================
// Command Execution
// =============================================================================

/**
 * Execute a command in the Docker container
 */
export async function executeCommand(canvasId, command, workingDirectory = null) {
  console.log("[FileAPI] Executing command:", {
    canvasId,
    command,
    workingDirectory,
    endpoint: `${API_BASE}/workspace/canvases/${canvasId}/execute/`
  });

  const response = await fetch(`${API_BASE}/workspace/canvases/${canvasId}/execute/`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify({
      command,
      working_directory: workingDirectory,
    }),
  });

  const result = await handleResponse(response);
  console.log("[FileAPI] Command executed:", result);
  return result;
}

/**
 * Start a streaming command (for long-running processes like ros2 run)
 */
export async function startStreamingCommand(canvasId, command) {
  console.log("[FileAPI] Starting streaming command:", {
    canvasId,
    command,
    endpoint: `${API_BASE}/workspace/canvases/${canvasId}/execute-streaming/`
  });

  const response = await fetch(`${API_BASE}/workspace/canvases/${canvasId}/execute-streaming/`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify({ command }),
  });

  const result = await handleResponse(response);
  console.log("[FileAPI] Streaming command started:", result);
  return result;
}

/**
 * Get output from a running process
 */
export async function getProcessOutput(canvasId, processId) {
  const response = await fetch(`${API_BASE}/workspace/canvases/${canvasId}/process/${processId}/output/`, {
    headers: getAuthHeaders(),
  });

  return handleResponse(response);
}

/**
 * Kill a running process
 */
export async function killProcess(canvasId, processId) {
  console.log("[FileAPI] Killing process:", { canvasId, processId });

  const response = await fetch(`${API_BASE}/workspace/canvases/${canvasId}/process/${processId}/kill/`, {
    method: "POST",
    headers: getAuthHeaders(),
  });

  const result = await handleResponse(response);
  console.log("[FileAPI] Process killed:", result);
  return result;
}

// =============================================================================
// Mesh Operations
// =============================================================================

/**
 * Upload a mesh file (STL, DAE, etc.)
 */
export async function uploadMesh(canvasId, file, name = null) {
  const formData = new FormData();
  formData.append("file", file);
  if (name) {
    formData.append("name", name);
  }

  const token = localStorage.getItem("token");
  const response = await fetch(`${API_BASE}/workspace/canvases/${canvasId}/meshes/upload/`, {
    method: "POST",
    headers: {
      ...(token && { Authorization: `Bearer ${token}` }),
    },
    body: formData,
  });
  return handleResponse(response);
}

/**
 * Import a mesh from URL
 */
export async function importMeshFromUrl(canvasId, url, name = null) {
  const response = await fetch(`${API_BASE}/workspace/canvases/${canvasId}/meshes/import/`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify({
      url,
      name,
    }),
  });
  return handleResponse(response);
}

/**
 * List all custom meshes for a canvas
 */
export async function listMeshes(canvasId) {
  const response = await fetch(`${API_BASE}/workspace/canvases/${canvasId}/meshes/`, {
    headers: getAuthHeaders(),
  });
  return handleResponse(response);
}

/**
 * Delete a custom mesh
 */
export async function deleteMesh(canvasId, meshId) {
  const response = await fetch(`${API_BASE}/workspace/canvases/${canvasId}/meshes/${meshId}/`, {
    method: "DELETE",
    headers: getAuthHeaders(),
  });
  if (!response.ok) {
    throw new Error("Failed to delete mesh");
  }
}

// =============================================================================
// Helper Functions
// =============================================================================

/**
 * Read file content from Docker filesystem
 * Used for files that exist in Docker but not in database
 */
export async function readFromDocker(canvasId, filePath) {
  const response = await fetch(`${API_BASE}/workspace/canvases/${canvasId}/files/read_from_docker/`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify({
      path: filePath,
    }),
  });
  return handleResponse(response);
}

/**
 * List ROS2 packages found in the canvas workspace src/ directory
 */
export async function listRosPackages(canvasId) {
  const response = await fetch(`${API_BASE}/workspace/canvases/${canvasId}/ros_packages/`, {
    headers: getAuthHeaders(),
  });
  return handleResponse(response);
}

/**
 * List executables for a ROS2 package by parsing its setup.py
 */
export async function listRosExecutables(canvasId, packageName) {
  const response = await fetch(
    `${API_BASE}/workspace/canvases/${canvasId}/ros_executables/?package=${encodeURIComponent(packageName)}`,
    { headers: getAuthHeaders() }
  );
  return handleResponse(response);
}

/**
 * List all running ROS2 nodes and their current parameter values
 */
export async function listRunningParams(canvasId) {
  const response = await fetch(
    `${API_BASE}/workspace/canvases/${canvasId}/ros_running_params/`,
    { headers: getAuthHeaders() }
  );
  return handleResponse(response);
}

/**
 * Set a parameter on a running ROS2 node
 */
export async function setRosParam(canvasId, node, param, value) {
  const response = await fetch(
    `${API_BASE}/workspace/canvases/${canvasId}/ros_set_param/`,
    {
      method: "POST",
      headers: { ...getAuthHeaders(), "Content-Type": "application/json" },
      body: JSON.stringify({ node, param, value }),
    }
  );
  return handleResponse(response);
}

/**
 * Scan a node's source file for declare_parameter() calls
 */
export async function listRosParams(canvasId, packageName, executable) {
  const response = await fetch(
    `${API_BASE}/workspace/canvases/${canvasId}/ros_params/?package=${encodeURIComponent(packageName)}&executable=${encodeURIComponent(executable)}`,
    { headers: getAuthHeaders() }
  );
  return handleResponse(response);
}

// =============================================================================
// QCar SFTP File Operations (used when canvas.connect_to_qcar === true)
// =============================================================================

export async function getQCarFileTree(canvasId) {
  const response = await fetch(`${API_BASE}/workspace/canvases/${canvasId}/qcar_file_tree/`, {
    headers: getAuthHeaders(),
  });
  return handleResponse(response);
}

export async function qcarReadFile(canvasId, path) {
  const response = await fetch(
    `${API_BASE}/workspace/canvases/${canvasId}/qcar_read_file/?path=${encodeURIComponent(path)}`,
    { headers: getAuthHeaders() }
  );
  return handleResponse(response);
}

export async function qcarWriteFile(canvasId, path, content) {
  const response = await fetch(`${API_BASE}/workspace/canvases/${canvasId}/qcar_write_file/`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify({ path, content }),
  });
  return handleResponse(response);
}

export async function qcarCreate(canvasId, path, fileType) {
  const response = await fetch(`${API_BASE}/workspace/canvases/${canvasId}/qcar_create/`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify({ path, file_type: fileType }),
  });
  return handleResponse(response);
}

export async function qcarDelete(canvasId, path) {
  const response = await fetch(`${API_BASE}/workspace/canvases/${canvasId}/qcar_delete/`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify({ path }),
  });
  return handleResponse(response);
}

export async function qcarRename(canvasId, oldPath, newPath) {
  const response = await fetch(`${API_BASE}/workspace/canvases/${canvasId}/qcar_rename/`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify({ old_path: oldPath, new_path: newPath }),
  });
  return handleResponse(response);
}

/**
 * Save generated code to a file
 */
export async function saveGeneratedCode(canvasId, filePath, code) {
  // Check if file already exists
  const files = await listFiles(canvasId);
  const existingFile = files.find((f) => f.path === filePath);

  if (existingFile) {
    // Update existing file
    return updateFile(canvasId, existingFile.id, { content: code });
  } else {
    // Create new file
    return createFile(canvasId, {
      path: filePath,
      file_type: "file",
      content: code,
    });
  }
}

export default {
  // Canvas operations
  listCanvases,
  getCanvas,
  createCanvas,
  updateCanvas,
  deleteCanvas,
  getFileTree,

  // File operations
  listFiles,
  getFile,
  createFile,
  updateFile,
  deleteFile,
  readFromDocker,

  // Mesh operations
  uploadMesh,
  importMeshFromUrl,
  listMeshes,
  deleteMesh,

  // ROS2 workspace introspection
  listRosPackages,
  listRosExecutables,
  listRosParams,

  // Command execution
  executeCommand,
  startStreamingCommand,
  getProcessOutput,
  killProcess,

  // QCar SFTP operations
  getQCarFileTree,
  qcarReadFile,
  qcarWriteFile,
  qcarCreate,
  qcarDelete,
  qcarRename,

  // Helpers
  saveGeneratedCode,
};
