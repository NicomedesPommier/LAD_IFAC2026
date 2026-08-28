/**
 * useROS2Workspace Hook
 *
 * Manages a shared ROS2 workspace across all ROS2 lessons.
 * Looks for a canvas named "ROS2Concept" in the backend database.
 * If it exists, uses it. If not, creates it.
 *
 * Includes file tree caching to avoid reloading from Docker on every visit.
 *
 * This ensures students have a persistent workspace throughout the ROS2 unit.
 */

import { useState, useEffect, useCallback } from "react";
import { listCanvases, createCanvas, getFileTree } from "../services/fileApi";

const WORKSPACE_NAME = "ROS2Concept";
const CACHE_KEY = "ros2_workspace_cache";
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

// Global flag to prevent duplicate creation across all hook instances
let isCreatingWorkspace = false;

export function useROS2Workspace() {
  const [workspace, setWorkspace] = useState(null);
  const [fileTree, setFileTree] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [loadedFromCache, setLoadedFromCache] = useState(false);

  useEffect(() => {
    initializeWorkspace();
  }, []);

  const initializeWorkspace = async () => {
    try {
      setLoading(true);
      setError(null);

      // Try to load from cache first
      const cachedData = loadFromCache();
      if (cachedData) {
        console.log("[ROS2Workspace] ⚡ Loading from cache");

        // Verify cached workspace still exists in backend
        const canvases = await listCanvases();
        const cachedWorkspaceExists = canvases.find(
          (canvas) => canvas.id === cachedData.workspace.id
        );

        if (cachedWorkspaceExists) {
          // Cache is valid, workspace still exists
          setWorkspace(cachedData.workspace);
          setFileTree(cachedData.fileTree);
          setLoadedFromCache(true);
          setLoading(false);

          // Refresh in background
          setTimeout(() => {
            refreshWorkspaceInBackground(cachedData.workspace.id);
          }, 500);
          return;
        } else {
          // Cached workspace was deleted, clear cache
          console.log("[ROS2Workspace] Cached workspace was deleted, clearing cache");
          clearCache();
          // Continue to create new workspace below
        }
      }

      console.log(`[ROS2Workspace] Looking for workspace: "${WORKSPACE_NAME}"`);

      // List all canvases for the current user
      const canvases = await listCanvases();
      console.log("[ROS2Workspace] User canvases:", canvases);

      // Look for existing ROS2Concept workspace
      let existingWorkspace = canvases.find(
        (canvas) => canvas.name === WORKSPACE_NAME
      );

      if (!existingWorkspace) {
        // Prevent duplicate creation with global flag
        if (isCreatingWorkspace) {
          console.log("[ROS2Workspace] Another instance is already creating workspace, waiting...");
          // Wait and retry
          await new Promise(resolve => setTimeout(resolve, 1000));
          const retryCanvases = await listCanvases();
          existingWorkspace = retryCanvases.find((canvas) => canvas.name === WORKSPACE_NAME);

          if (!existingWorkspace) {
            console.warn("[ROS2Workspace] Workspace still not found after waiting");
          }
        }

        if (!existingWorkspace) {
          console.log("[ROS2Workspace] Workspace not found, creating new one...");
          isCreatingWorkspace = true;

          try {
            // Create new ROS2Concept workspace
            existingWorkspace = await createCanvas({
              name: WORKSPACE_NAME,
              description: "ROS2 Interactive Learning Workspace - Shared across all ROS2 lessons",
            });

            console.log("[ROS2Workspace] Created new workspace:", existingWorkspace);
          } finally {
            isCreatingWorkspace = false;
          }
        }
      } else {
        console.log("[ROS2Workspace] Found existing workspace:", existingWorkspace);
      }

      setWorkspace(existingWorkspace);

      // Load file tree
      const tree = await getFileTree(existingWorkspace.id, false);
      setFileTree(tree);

      // Cache the data
      saveToCache(existingWorkspace, tree);
    } catch (err) {
      console.error("[ROS2Workspace] Failed to initialize workspace:", err);
      console.error("[ROS2Workspace] Error details:", {
        message: err.message,
        stack: err.stack,
      });
      setError(err.message || "Failed to initialize workspace");
      isCreatingWorkspace = false; // Reset flag on error
    } finally {
      setLoading(false);
    }
  };

  /**
   * Refresh workspace and file tree in background
   */
  const refreshWorkspaceInBackground = useCallback(async (canvasId) => {
    try {
      console.log("[ROS2Workspace] Refreshing workspace in background");

      // Check if workspace still exists
      const canvases = await listCanvases();
      const updatedWorkspace = canvases.find((c) => c.id === canvasId);

      if (!updatedWorkspace) {
        // Workspace was deleted, clear cache and reset state
        console.warn("[ROS2Workspace] Workspace was deleted, clearing cache");
        clearCache();
        setWorkspace(null);
        setFileTree([]);
        setLoadedFromCache(false);
        setError("Workspace was deleted. Please reload to create a new one.");
        return;
      }

      // Workspace exists, update data
      const tree = await getFileTree(canvasId, false);
      setFileTree(tree);
      setLoadedFromCache(false);
      setWorkspace(updatedWorkspace);
      saveToCache(updatedWorkspace, tree);

      console.log("[ROS2Workspace] ✓ Background refresh complete");
    } catch (err) {
      console.error("[ROS2Workspace] Background refresh failed:", err);
    }
  }, []);

  /**
   * Refresh workspace data and file tree from backend
   */
  const refreshWorkspace = async (forceRefresh = false) => {
    if (!workspace) return;

    try {
      console.log("[ROS2Workspace] Refreshing workspace (force:", forceRefresh, ")");

      // Check if workspace still exists
      const canvases = await listCanvases();
      const updatedWorkspace = canvases.find((c) => c.id === workspace.id);

      if (!updatedWorkspace) {
        // Workspace was deleted
        console.warn("[ROS2Workspace] Workspace was deleted during refresh");
        clearCache();
        setWorkspace(null);
        setFileTree([]);
        setError("Workspace was deleted. Please reload to create a new one.");
        return;
      }

      const tree = await getFileTree(workspace.id, forceRefresh);
      setFileTree(tree);
      setWorkspace(updatedWorkspace);
      saveToCache(updatedWorkspace, tree);

      console.log("[ROS2Workspace] File tree refreshed:", tree.length, "items");
    } catch (err) {
      console.error("[ROS2Workspace] Failed to refresh workspace:", err);
    }
  };

  /**
   * Load workspace data from localStorage cache
   */
  const loadFromCache = () => {
    try {
      const cached = localStorage.getItem(CACHE_KEY);
      if (!cached) return null;

      const { workspace, fileTree, timestamp } = JSON.parse(cached);
      const age = Date.now() - timestamp;

      // Only use cache if less than CACHE_DURATION old
      if (age < CACHE_DURATION) {
        console.log("[ROS2Workspace] Cache age:", Math.round(age / 1000), "seconds");
        return { workspace, fileTree };
      } else {
        console.log("[ROS2Workspace] Cache expired, clearing");
        localStorage.removeItem(CACHE_KEY);
        return null;
      }
    } catch (error) {
      console.error("[ROS2Workspace] Failed to load cache:", error);
      localStorage.removeItem(CACHE_KEY);
      return null;
    }
  };

  /**
   * Save workspace data to localStorage cache
   */
  const saveToCache = (workspace, fileTree) => {
    try {
      const cacheData = {
        workspace,
        fileTree,
        timestamp: Date.now(),
      };
      localStorage.setItem(CACHE_KEY, JSON.stringify(cacheData));
      console.log("[ROS2Workspace] 💾 Workspace cached for fast loading");
    } catch (error) {
      console.error("[ROS2Workspace] Failed to save cache:", error);
    }
  };

  /**
   * Clear the cache (useful when switching workspaces)
   */
  const clearCache = () => {
    localStorage.removeItem(CACHE_KEY);
    console.log("[ROS2Workspace] Cache cleared");
  };

  return {
    workspace,
    fileTree,
    loading,
    error,
    canvasId: workspace?.id || null,
    loadedFromCache,
    refreshWorkspace,
    clearCache,
    retry: initializeWorkspace,
  };
}

export default useROS2Workspace;
