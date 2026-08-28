// =============================================================
// FILE: src/pages/IDETestPage.jsx
// Test page for the ROS Visual IDE components (BlockCanvas + FileExplorer)
//
// CACHING SYSTEM:
// - File tree is cached in localStorage with 5-minute TTL
// - On mount/refresh: Loads instantly from cache, then refreshes in background
// - File operations use OPTIMISTIC UPDATES:
//   * Create/Delete/Rename: UI updates instantly (no Docker scan needed)
//   * Backend API called in background to persist changes
//   * If backend fails, changes are reverted with error message
// - Cache is automatically updated after every file operation
// - Manual refresh button forces full Docker container scan
//
// This approach eliminates the need for slow Docker scans on every operation,
// making the file explorer feel instant and responsive.
// =============================================================
import React, { useState, useCallback, useMemo, useEffect, useRef } from "react";
import { ReactFlowProvider } from "@xyflow/react";
import { useNavigate, useLocation } from "react-router-dom";
import { BlockCanvas } from "../components/ide/BlockCanvas";
import { FileExplorer } from "../components/ide/FileExplorer";
import { TabBar } from "../components/ide/TabBar";
import { TerminalTabs } from "../components/ide/TerminalTabs";
import { URDFViewer } from "../components/ide/URDFViewer";
import { CodeEditor } from "../components/ide/CodeEditor";
import IDETutorial from "../components/ide/IDETutorial";
import { CategorizedPalette, paletteCategorized, paletteQCarCategories } from "../components/blocks";
import { computeUrdfXml } from "../components/blocks/urdf-helpers";
import CanvasSelector from "../components/ide/CanvasSelector";
import ThemeToggle from "../components/ThemeToggle";
import { useProgress } from "../context/ProgressContext";
import { useRoslib } from "../hooks/useRoslib";
import ideTutorials from "../config/ideTutorials";
import fileApi from "../services/fileApi";
import { FaRegFileCode } from "react-icons/fa";
import { FaFolder, FaFolderOpen } from "react-icons/fa6";
import { IoTerminal } from "react-icons/io5";
import { MdViewInAr, MdSensors } from "react-icons/md";
import SimulationEnvironment from "../components/sim/SimulationEnvironment";
import { FaSimplybuilt } from "react-icons/fa";
import QCarVisualization from "../components/viz/QCarVisualization";
import "../styles/_rosflow.scss";
import "../styles/pages/_ide-test.scss";
import "../styles/components/_canvas-selector.scss";

function IDETestPageInner() {
  const navigate = useNavigate();
  const location = useLocation();
  const { hitObjective } = useProgress();
  const { ros } = useRoslib();

  // Get tutorial configuration from location state
  const { tutorialType, objectiveCode, beta } = location.state || {};
  const tutorial = tutorialType ? ideTutorials[tutorialType] : null;

  // True once we've kicked off navigation back to the beta board, so the
  // tutorial's unmount (which fires onSkip) doesn't clobber the completion nav.
  const betaReturningRef = useRef(false);

  // Handle tutorial completion
  const handleTutorialComplete = useCallback(() => {
    console.log(`[IDE Tutorial] Completed: ${tutorialType}`);

    // Mark objective as completed
    if (objectiveCode && hitObjective) {
      hitObjective(objectiveCode);
    }

    // Beta walkthrough: return to the mission board so it can award points.
    if (beta?.returnTo) {
      navigate(beta.returnTo, { state: { beta: { missionId: beta.missionId, status: "complete" } } });
      return;
    }

    // Navigate back to learning page
    navigate(-1); // Go back to previous page
  }, [tutorialType, objectiveCode, hitObjective, navigate, beta]);

  // Handle tutorial skip
  const handleTutorialSkip = useCallback(() => {
    console.log(`[IDE Tutorial] Skipped: ${tutorialType}`);
    if (betaReturningRef.current) return; // a beta completion is already navigating us back
    if (beta?.returnTo) {
      // Beta: closing the walkthrough (e.g. clicking the backdrop, or pressing
      // Esc) should NOT bounce the user back to the board. Stay in the IDE —
      // they can reopen the tour with the ? button, or finish the mission
      // manually. Only true completion returns to the board.
      return;
    }
    navigate(-1); // Go back to previous page
  }, [tutorialType, navigate, beta]);

  // Persistent "finish mission" action for beta missions. Completion must NOT
  // depend on reaching the tour's last step — terminal steps (colcon build,
  // source, run) require clicking into the terminal, which dismisses the tour
  // popover. This button is always visible so the student can complete anytime.
  const handleBetaFinish = useCallback(() => {
    if (!beta?.returnTo) return;
    betaReturningRef.current = true;
    navigate(beta.returnTo, { state: { beta: { missionId: beta.missionId, status: "complete" } } });
  }, [beta, navigate]);

  // Canvas state
  const [canvas, setCanvas] = useState(null);
  const [canvasLoading, setCanvasLoading] = useState(false);
  const [showCanvasSelector, setShowCanvasSelector] = useState(true);

  // QCar rosbridge URL (fetched from /api/config/network/ when a QCar canvas is opened)
  const [qcarRosbridgeUrl, setQcarRosbridgeUrl] = useState(null);

  // File tree state
  const [fileTree, setFileTree] = useState([]);
  const [qcarError, setQcarError] = useState(null);

  // Current file state
  const [currentFile, setCurrentFile] = useState(null);
  const [fileContents, setFileContents] = useState({}); // Map of path -> content
  const [fileMetadata, setFileMetadata] = useState({}); // Map of path -> { id, type, isVisual }
  const [editorMode, setEditorMode] = useState("visual"); // "visual" or "text"
  const [generatedCode, setGeneratedCode] = useState("");
  const [textContent, setTextContent] = useState(""); // Current text editor content

  // Tabs state
  const [openTabs, setOpenTabs] = useState([]);
  const [activeTab, setActiveTab] = useState(null);
  const [activeView, setActiveView] = useState(() => location.state?.beta?.startView || "code"); // "code" | "terminal" | "simulation" | "viz"
  const [showUrdfWindow, setShowUrdfWindow] = useState(false);

  // Lazy-mount + keep-alive: once a view is visited, keep it mounted so the
  // Terminal PTY, Simulation physics, and ReactFlow state survive tab switches.
  const [visitedViews, setVisitedViews] = useState(() => new Set(["code"]));
  useEffect(() => {
    setVisitedViews((prev) => (prev.has(activeView) ? prev : new Set([...prev, activeView])));
    const raf = requestAnimationFrame(() => window.dispatchEvent(new Event("resize")));
    return () => cancelAnimationFrame(raf);
  }, [activeView]);

  // Simulation view state
  const [simMenuHidden, setSimMenuHidden] = useState(true);
  const [simResetKey, setSimResetKey] = useState(0);
  const [fileExplorerCollapsed, setFileExplorerCollapsed] = useState(false);

  // Workspace cache key
  const WORKSPACE_CACHE_KEY = "ide_workspace_cache";
  const [loadedFromCache, setLoadedFromCache] = useState(false);

  // Load cached workspace on mount
  useEffect(() => {
    // Beta Mission 1 always starts at the workspace selector (guided create flow).
    if (location.state?.beta?.missionId === "workspace") return;
    const cachedWorkspace = localStorage.getItem(WORKSPACE_CACHE_KEY);
    if (cachedWorkspace) {
      try {
        const { canvas: cachedCanvas, fileTree: cachedTree, timestamp } = JSON.parse(cachedWorkspace);
        const age = Date.now() - timestamp;

        // Only use cache if less than 5 minutes old
        if (age < 5 * 60 * 1000) {
          console.log("[IDE] ⚡ Loading from cache (age:", Math.round(age / 1000), "s)");
          setCanvas(cachedCanvas);
          setFileTree(cachedTree);
          setShowCanvasSelector(false);
          setLoadedFromCache(true);

          // Refresh in background
          setTimeout(() => {
            refreshWorkspaceInBackground(cachedCanvas);
          }, 500);
        } else {
          console.log("[IDE] Cache expired, clearing");
          localStorage.removeItem(WORKSPACE_CACHE_KEY);
        }
      } catch (error) {
        console.error("[IDE] Failed to load cached workspace:", error);
        localStorage.removeItem(WORKSPACE_CACHE_KEY);
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // When a QCar canvas is active, fetch the QCar rosbridge URL from the network config API
  useEffect(() => {
    if (!canvas?.connect_to_qcar) {
      setQcarRosbridgeUrl(null);
      return;
    }
    fetch('/api/config/network/')
      .then((r) => r.json())
      .then((data) => {
        if (data.qcar_rosbridge_ws) setQcarRosbridgeUrl(data.qcar_rosbridge_ws);
      })
      .catch(() => {
        // Sin config del backend no hay IP del robot que adivinar; la vista
        // QCar mostrará "desconectado" en vez de apuntar a una IP hardcodeada.
        setQcarRosbridgeUrl(null);
      });
  }, [canvas?.connect_to_qcar, canvas?.id]);

  // Refresh workspace data in background — accepts full canvas object or bare ID
  const refreshWorkspaceInBackground = useCallback(async (canvasOrId) => {
    try {
      const isObj = canvasOrId !== null && typeof canvasOrId === 'object';
      const canvasId = isObj ? canvasOrId.id : canvasOrId;
      const isQCar  = isObj ? Boolean(canvasOrId.connect_to_qcar) : false;

      const tree = isQCar
        ? await fileApi.getQCarFileTree(canvasId)
        : await fileApi.getFileTree(canvasId, false);

      setQcarError(null);
      setFileTree(tree);
      setLoadedFromCache(false);
    } catch (error) {
      console.error("[IDE] Background refresh failed:", error);
      const isObj = canvasOrId !== null && typeof canvasOrId === 'object';
      if (isObj && canvasOrId.connect_to_qcar) {
        setQcarError(error.message || 'Failed to connect to QCar');
      }
    }
  }, []);

  // Handle canvas selection from CanvasSelector
  const handleCanvasSelect = useCallback(async (selectedCanvas) => {
    // Beta Mission 1 (create workspace): the goal is simply to have a workspace.
    // Complete the moment one is created/selected, then return to the board.
    // (Returning here avoids the CanvasSelector→IDE branch switch unmounting the
    // tutorial mid-flow, which previously fired a spurious skip and lost points.)
    if (beta?.returnTo && beta?.missionId === "workspace") {
      betaReturningRef.current = true;
      // Seed a starter visual canvas so later missions always have a .canvas to
      // build blocks on — the block editor only opens when a file is selected,
      // and a brand-new workspace would otherwise be empty.
      const starterTree = [{ name: "main.canvas", path: "main.canvas", type: "file" }];
      try {
        await fileApi.createFile(selectedCanvas.id, {
          path: "main.canvas",
          file_type: "file",
          content: JSON.stringify({ nodes: [], edges: [] }, null, 2),
        });
      } catch {} // ignore if it already exists
      try {
        localStorage.setItem(
          WORKSPACE_CACHE_KEY,
          JSON.stringify({ canvas: selectedCanvas, fileTree: starterTree, timestamp: Date.now() })
        );
      } catch {}
      navigate(beta.returnTo, { state: { beta: { missionId: "workspace", status: "complete" } } });
      return;
    }

    // Navigate to IDE immediately — don't wait for API
    setCanvas(selectedCanvas);
    setShowCanvasSelector(false);
    setCanvasLoading(true);

    try {
      // Check if we have cached data for this specific canvas
      const cachedWorkspace = localStorage.getItem(WORKSPACE_CACHE_KEY);

      if (cachedWorkspace) {
        try {
          const { canvas: cachedCanvas, fileTree: cachedTree, timestamp } = JSON.parse(cachedWorkspace);
          const age = Date.now() - timestamp;

          // Use cache if it's for the same canvas and less than 5 minutes old
          if (cachedCanvas.id === selectedCanvas.id && age < 5 * 60 * 1000) {
            console.log("[IDE] ⚡ Using cached file tree for this workspace");
            setFileTree(cachedTree);
            setLoadedFromCache(true);
            setCanvasLoading(false);

            // Refresh in background
            setTimeout(() => {
              refreshWorkspaceInBackground(selectedCanvas);
            }, 500);

            return;
          }
        } catch (error) {
          console.error("[IDE] Failed to use cached data:", error);
        }
      }

      // No cache or different canvas - load from backend
      setLoadedFromCache(false);
      setQcarError(null);
      const tree = selectedCanvas.connect_to_qcar
        ? await fileApi.getQCarFileTree(selectedCanvas.id)
        : await fileApi.getFileTree(selectedCanvas.id, false);
      if (tree.length > 0) {
        setFileTree(tree);
      }

      // Cache workspace data for fast loading next time
      const cacheData = {
        canvas: selectedCanvas,
        fileTree: tree,
        timestamp: Date.now(),
      };
      localStorage.setItem(WORKSPACE_CACHE_KEY, JSON.stringify(cacheData));
      console.log("[IDE] 💾 Workspace cached for fast loading");
    } catch (error) {
      console.error("Canvas load error:", error);
      if (selectedCanvas.connect_to_qcar) {
        setQcarError(error.message || 'Failed to connect to QCar');
      }
    } finally {
      setCanvasLoading(false);
    }
  }, [beta, navigate, WORKSPACE_CACHE_KEY, refreshWorkspaceInBackground]);

  // Update cache helper - updates both state and localStorage
  const updateFileTreeCache = useCallback((newTree) => {
    if (!canvas) return;

    setFileTree(newTree);

    // Update localStorage cache
    const cacheData = {
      canvas,
      fileTree: newTree,
      timestamp: Date.now(),
    };
    localStorage.setItem(WORKSPACE_CACHE_KEY, JSON.stringify(cacheData));
    console.log("[IDE] 💾 Cache updated with", newTree.length, "items");
  }, [canvas, WORKSPACE_CACHE_KEY]);

  // Helper to add file/folder to tree optimistically
  const addToFileTree = useCallback((path, type) => {
    const pathParts = path.split('/').filter(Boolean);
    const fileName = pathParts.pop();
    const parentPath = pathParts.length > 0 ? pathParts.join('/') : '';

    const newItem = {
      name: fileName,
      path: path,
      type: type === 'directory' ? 'directory' : 'file',
      children: type === 'directory' ? [] : undefined,
    };

    const insertIntoTree = (items, targetParentPath) => {
      // If inserting at root
      if (targetParentPath === '' || targetParentPath === '/') {
        return [...items, newItem].sort((a, b) => {
          // Directories first, then alphabetically
          if (a.type === 'directory' && b.type !== 'directory') return -1;
          if (a.type !== 'directory' && b.type === 'directory') return 1;
          return a.name.localeCompare(b.name);
        });
      }

      // Otherwise find parent and insert
      return items.map(item => {
        if (item.path === targetParentPath && item.type === 'directory') {
          return {
            ...item,
            children: [...(item.children || []), newItem].sort((a, b) => {
              if (a.type === 'directory' && b.type !== 'directory') return -1;
              if (a.type !== 'directory' && b.type === 'directory') return 1;
              return a.name.localeCompare(b.name);
            }),
          };
        }
        if (item.children) {
          return {
            ...item,
            children: insertIntoTree(item.children, targetParentPath),
          };
        }
        return item;
      });
    };

    const newTree = insertIntoTree(fileTree, parentPath);
    updateFileTreeCache(newTree);
    console.log("[IDE] ⚡ Optimistically added to tree:", path);
  }, [fileTree, updateFileTreeCache]);

  // Helper to remove file/folder from tree optimistically
  const removeFromFileTree = useCallback((path) => {
    const removeFromItems = (items) => {
      return items.filter(item => {
        if (item.path === path) return false;
        if (item.children) {
          item.children = removeFromItems(item.children);
        }
        return true;
      });
    };

    const newTree = removeFromItems([...fileTree]);
    updateFileTreeCache(newTree);
    console.log("[IDE] ⚡ Optimistically removed from tree:", path);
  }, [fileTree, updateFileTreeCache]);

  // Helper to rename file/folder in tree optimistically
  const renameInFileTree = useCallback((oldPath, newPath) => {
    const newName = newPath.split('/').filter(Boolean).pop();

    const renameInItems = (items) => {
      return items.map(item => {
        if (item.path === oldPath) {
          return { ...item, name: newName, path: newPath };
        }
        if (item.children) {
          return { ...item, children: renameInItems(item.children) };
        }
        return item;
      });
    };

    const newTree = renameInItems([...fileTree]);
    updateFileTreeCache(newTree);
    console.log("[IDE] ⚡ Optimistically renamed in tree:", oldPath, "->", newPath);
  }, [fileTree, updateFileTreeCache]);

  // Refresh file tree (manual or after operations)
  const refreshFileTree = useCallback(async (forceRefresh = false) => {
    if (!canvas) return;

    try {
      setQcarError(null);
      let tree;
      if (canvas.connect_to_qcar) {
        tree = await fileApi.getQCarFileTree(canvas.id);
      } else {
        tree = await fileApi.getFileTree(canvas.id, forceRefresh);
      }
      updateFileTreeCache(tree);
    } catch (error) {
      console.error("[IDE] Failed to refresh file tree:", error);
      if (canvas.connect_to_qcar) {
        setQcarError(error.message || 'Failed to connect to QCar');
      }
    }
  }, [canvas, updateFileTreeCache]);

  // Load file content from backend
  const loadFileContent = useCallback(async (path) => {
    if (!canvas) return;

    try {
      let content = "";
      let fileId = null;
      let blockMetadata = null;

      if (canvas.connect_to_qcar) {
        // QCar mode: read directly from the physical robot via SFTP
        try {
          const result = await fileApi.qcarReadFile(canvas.id, path);
          content = result.content || "";
        } catch (e) {
          content = `# Error reading from QCar: ${e.message}`;
        }
      } else {
        // Docker mode: try DB first, then Docker filesystem
        const files = await fileApi.listFiles(canvas.id);
        const fileData = files.find((f) => f.path === path);

        if (fileData && fileData.content) {
          content = fileData.content;
          fileId = fileData.id;
        } else {
          try {
            const dockerFile = await fileApi.readFromDocker(canvas.id, path);
            content = dockerFile.content || "";
            if (fileData) {
              fileId = fileData.id;
              await fileApi.updateFile(canvas.id, fileData.id, { content });
            }
          } catch (dockerError) {
            content = "// Error: Could not load file content";
          }
        }

        if (fileData?.metadata) {
          try { blockMetadata = JSON.parse(fileData.metadata); } catch {}
        }
      }

      // Store metadata
      setFileMetadata((prev) => ({
        ...prev,
        [path]: {
          id: fileId,
          type: "file",
          fromDocker: !canvas.connect_to_qcar && !fileId,
          blockMetadata: blockMetadata,
        },
      }));

      // Detect if file is visual blocks or text
      let isVisual = false;
      let parsedContent = null;

      // First check if file has block metadata (was generated from blocks)
      if (blockMetadata && blockMetadata.isBlockGenerated && blockMetadata.blockGraph) {
        console.log("[IDE] File was generated from blocks, loading in visual mode");
        isVisual = true;
        parsedContent = blockMetadata.blockGraph;
      } else {
        // Otherwise try to parse as JSON block format
        try {
          parsedContent = JSON.parse(content);
          // Check if it has nodes and edges (visual block format)
          if (parsedContent && parsedContent.nodes && parsedContent.edges) {
            isVisual = true;
          }
        } catch (e) {
          // Not JSON, treat as text
          isVisual = false;
        }
      }

      // .canvas / .blocks files always open in the visual block editor — even
      // when empty (a brand-new RosFlow file), so students land on the canvas.
      if (!isVisual && /\.(canvas|blocks)$/i.test(path)) {
        isVisual = true;
        if (!parsedContent || !parsedContent.nodes) parsedContent = { nodes: [], edges: [] };
      }

      // Store the block graph if we have it
      if (isVisual && parsedContent) {
        const blockContent = JSON.stringify(parsedContent, null, 2);
        setFileContents((prev) => ({
          ...prev,
          [path]: blockContent,
        }));
      } else {
        // Store content as-is
        setFileContents((prev) => ({
          ...prev,
          [path]: content,
        }));
      }

      // Set editor mode
      setEditorMode(isVisual ? "visual" : "text");

      if (isVisual) {
        setGeneratedCode("");
      } else {
        setTextContent(content);
      }

      console.log("[IDE] Loaded file:", path, "Mode:", isVisual ? "visual" : "text");
    } catch (error) {
      console.error("[IDE] Failed to load file content:", error);
    }
  }, [canvas]);

  // Get current graph for visual editor
  const currentGraph = useMemo(() => {
    if (!currentFile || editorMode !== "visual") {
      return { nodes: [], edges: [] };
    }

    const content = fileContents[currentFile];
    if (!content) return { nodes: [], edges: [] };

    try {
      const parsed = JSON.parse(content);
      return {
        nodes: parsed.nodes || [],
        edges: parsed.edges || [],
      };
    } catch (e) {
      return { nodes: [], edges: [] };
    }
  }, [currentFile, fileContents, editorMode]);

  // Detect language for text editor
  const detectLanguage = useCallback((filename) => {
    if (!filename) return "python";

    const ext = filename.split(".").pop().toLowerCase();
    const languageMap = {
      py: "python",
      cpp: "cpp",
      c: "c",
      h: "cpp",
      hpp: "cpp",
      xml: "xml",
      urdf: "xml",
      xacro: "xml",
      yaml: "yaml",
      yml: "yaml",
      json: "json",
      md: "markdown",
      txt: "plaintext",
      sh: "shell",
    };

    return languageMap[ext] || "plaintext";
  }, []);

  // Handle file selection
  const handleFileSelect = useCallback((path) => {
    setCurrentFile(path);
    setActiveTab(path);

    // Load file content
    loadFileContent(path);

    // Add to tabs if not already open
    setOpenTabs((prev) => {
      if (prev.some((tab) => tab.path === path)) return prev;

      const fileName = path.split("/").pop();
      return [
        ...prev,
        {
          path,
          name: fileName,
          type: "file",
          unsaved: false,
        },
      ];
    });
  }, [loadFileContent]);

  // Handle graph changes (visual editor)
  const handleGraphChange = useCallback(
    ({ nodes, edges }) => {
      if (!currentFile) return;

      const content = JSON.stringify({ nodes, edges }, null, 2);
      setFileContents((prev) => ({
        ...prev,
        [currentFile]: content,
      }));

      // Mark tab as unsaved
      setOpenTabs((prev) =>
        prev.map((tab) =>
          tab.path === currentFile ? { ...tab, unsaved: true } : tab
        )
      );
    },
    [currentFile]
  );

  // Handle text editor changes
  const handleTextChange = useCallback(
    (newContent) => {
      if (!currentFile) return;

      setTextContent(newContent);
      setFileContents((prev) => ({
        ...prev,
        [currentFile]: newContent,
      }));

      // Mark tab as unsaved
      setOpenTabs((prev) =>
        prev.map((tab) =>
          tab.path === currentFile ? { ...tab, unsaved: true } : tab
        )
      );
    },
    [currentFile]
  );

  // Handle code generation
  const handleCodeGenerated = useCallback((result) => {
    // Handle both object {xml, robotId} and string returns
    const code = typeof result === 'string' ? result : (result?.xml || "");
    setGeneratedCode(code);
  }, []);

  // Handle file saved from Convert2Code node
  const handleFileSaved = useCallback(
    async (filePath, content) => {
      console.log("[IDE] File saved from Convert2Code:", filePath);

      // Update file contents in memory (only if different)
      setFileContents((prev) => {
        if (prev[filePath] === content) return prev; // No change, prevent re-render
        return {
          ...prev,
          [filePath]: content,
        };
      });

      // Update text content if this is the current file
      if (filePath === currentFile) {
        setTextContent((prev) => {
          if (prev === content) return prev; // No change
          console.log("[IDE] Updated text content for current file");
          return content;
        });
      }

      // Mark file as saved (no unsaved changes)
      setOpenTabs((prev) =>
        prev.map((tab) =>
          tab.path === filePath ? { ...tab, unsaved: false } : tab
        )
      );

      // Refresh file metadata to get the block metadata (debounced)
      setTimeout(async () => {
        try {
          const files = await fileApi.listFiles(canvas.id);
          const fileData = files.find((f) => f.path === filePath);
          if (fileData && fileData.metadata) {
            const blockMetadata = JSON.parse(fileData.metadata);
            setFileMetadata((prev) => {
              // Only update if different
              if (prev[filePath]?.blockMetadata === blockMetadata) return prev;
              return {
                ...prev,
                [filePath]: {
                  ...prev[filePath],
                  blockMetadata: blockMetadata,
                },
              };
            });
            console.log("[IDE] Updated file metadata with block info");
          }
        } catch (error) {
          console.warn("[IDE] Could not refresh file metadata:", error);
        }

        // Refresh file tree to show the file
        refreshFileTree(false);
      }, 300); // Debounce to prevent rapid updates
    },
    [currentFile, refreshFileTree, canvas]
  );

  // File operations
  const handleFileCreate = useCallback(
    async (path, type) => {
      if (!canvas) return;
      addToFileTree(path, type);
      try {
        if (canvas.connect_to_qcar) {
          await fileApi.qcarCreate(canvas.id, path, type);
        } else {
          await fileApi.createFile(canvas.id, { path, file_type: type, content: type === "file" ? "" : undefined });
        }
      } catch (error) {
        removeFromFileTree(path);
        alert(`Failed to create ${type}: ${error.message}`);
      }
    },
    [canvas, addToFileTree, removeFromFileTree]
  );

  const handleFileDelete = useCallback(
    async (path) => {
      if (!canvas) return;
      removeFromFileTree(path);
      try {
        if (canvas.connect_to_qcar) {
          await fileApi.qcarDelete(canvas.id, path);
        } else {
          const files = await fileApi.listFiles(canvas.id);
          const file = files.find((f) => f.path === path);
          if (file) await fileApi.deleteFile(canvas.id, file.id);
        }
      } catch (error) {
        refreshFileTree(false);
        alert(`Failed to delete: ${error.message}`);
      }
    },
    [canvas, removeFromFileTree, refreshFileTree]
  );

  const handleFileRename = useCallback(
    async (oldPath, newPath) => {
      if (!canvas) return;
      renameInFileTree(oldPath, newPath);
      try {
        if (canvas.connect_to_qcar) {
          await fileApi.qcarRename(canvas.id, oldPath, newPath);
        } else {
          const files = await fileApi.listFiles(canvas.id);
          const file = files.find((f) => f.path === oldPath);
          if (file) await fileApi.updateFile(canvas.id, file.id, { path: newPath });
        }
      } catch (error) {
        renameInFileTree(newPath, oldPath);
        alert(`Failed to rename: ${error.message}`);
      }
    },
    [canvas, renameInFileTree]
  );

  // Save current file
  const handleSave = useCallback(async () => {
    if (!canvas || !currentFile) {
      alert("No file selected to save");
      return;
    }

    let metadata; // Declare here so it's accessible in catch block

    try {
      // Get content from appropriate source based on editor mode
      let content;
      if (editorMode === "text") {
        content = textContent;
      } else {
        content = fileContents[currentFile];
      }

      metadata = fileMetadata[currentFile];

      if (content === undefined || content === null) {
        console.error("[IDE] No content to save for:", currentFile);
        alert("No content to save");
        return;
      }

      if (canvas.connect_to_qcar) {
        // QCar mode: write directly to the robot via SFTP
        await fileApi.qcarWriteFile(canvas.id, currentFile, content);
        console.log("[IDE] ✓ Saved to QCar:", currentFile);
      } else if (metadata && metadata.id) {
        await fileApi.updateFile(canvas.id, metadata.id, { content });
        console.log("[IDE] ✓ File updated in database");
      } else {
        const newFile = await fileApi.createFile(canvas.id, {
          path: currentFile,
          file_type: "file",
          content: content,
        });
        setFileMetadata((prev) => ({
          ...prev,
          [currentFile]: { id: newFile.id, type: "file", fromDocker: false },
        }));
        console.log("[IDE] ✓ File created in database with ID:", newFile.id);
      }

      // Update fileContents to match saved state
      setFileContents((prev) => ({
        ...prev,
        [currentFile]: content,
      }));

      // Mark tab as saved
      setOpenTabs((prev) =>
        prev.map((tab) =>
          tab.path === currentFile ? { ...tab, unsaved: false } : tab
        )
      );

      console.log("[IDE] ✓ File saved successfully:", currentFile);

      // Show success feedback
      const fileName = currentFile.split('/').pop();
      // You could add a toast notification here
      console.log(`✅ Saved: ${fileName}`);

      // Optional: Trigger a refresh of the file tree to show the file
      setTimeout(() => refreshFileTree(false), 500);
    } catch (error) {
      console.error("[IDE] ❌ Failed to save file:", error);
      console.error("[IDE] Error details:", {
        message: error.message,
        stack: error.stack,
        currentFile,
        editorMode,
        hasContent: editorMode === "text" ? !!textContent : !!fileContents[currentFile],
        metadata,
      });

      // Show detailed error message
      const fileName = currentFile.split('/').pop();
      let displayMessage = `Failed to save "${fileName}":\n\n${error.message}`;

      // Add common troubleshooting tips based on error type
      if (error.message.includes("Docker container") && error.message.includes("not running")) {
        displayMessage += "\n\n💡 TIP: Make sure your Docker container is running:\n   docker ps";
      } else if (error.message.includes("UTF-8")) {
        displayMessage += "\n\n💡 TIP: File may contain special characters. Try using plain text.";
      } else if (error.message.includes("permission")) {
        displayMessage += "\n\n💡 TIP: Check Docker volume permissions.";
      }

      displayMessage += "\n\nCheck browser console (F12) for full error details.";

      alert(displayMessage);
    }
  }, [canvas, currentFile, fileContents, fileMetadata, editorMode, textContent, refreshFileTree]);

  // Keyboard shortcut for save (Ctrl+S / Cmd+S)
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Check for Ctrl+S (Windows/Linux) or Cmd+S (Mac)
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault(); // Prevent browser's default save dialog
        handleSave();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleSave]);

  // Clear canvas
  const handleClear = useCallback(() => {
    if (!currentFile) return;

    if (window.confirm("Clear the current file?")) {
      // Clear content based on mode
      if (editorMode === "visual") {
        // Clear visual blocks (empty graph)
        const emptyGraph = JSON.stringify({ nodes: [], edges: [] }, null, 2);
        setFileContents((prev) => ({
          ...prev,
          [currentFile]: emptyGraph,
        }));
      } else {
        // Clear text content
        setTextContent("");
        setFileContents((prev) => ({
          ...prev,
          [currentFile]: "",
        }));
      }

      setGeneratedCode("");

      // Mark as unsaved
      setOpenTabs((prev) =>
        prev.map((tab) =>
          tab.path === currentFile ? { ...tab, unsaved: true } : tab
        )
      );
    }
  }, [currentFile, editorMode]);

  // Tab management
  const handleTabSelect = useCallback((path) => {
    setActiveTab(path);
    setCurrentFile(path);
  }, []);

  const handleTabClose = useCallback((path) => {
    setOpenTabs((prev) => {
      const filtered = prev.filter((tab) => tab.path !== path);
      if (activeTab === path && filtered.length > 0) {
        const nextTab = filtered[filtered.length - 1];
        setActiveTab(nextTab.path);
        setCurrentFile(nextTab.path);
      } else if (filtered.length === 0) {
        setActiveTab(null);
        setCurrentFile(null);
      }
      return filtered;
    });
  }, [activeTab]);

  const handleCommandExecute = useCallback(async (command, callback) => {
    if (!canvas) {
      callback?.("Error: Canvas not loaded");
      return;
    }

    try {
      // Execute commands in workspace root (will default to canvas.docker_path on backend)
      // This ensures ros2 pkg create works in the proper src/ directory
      const result = await fileApi.executeCommand(canvas.id, command);

      // Send output to terminal
      if (result.output) {
        callback?.(result.output);
      }
      if (result.error) {
        callback?.(`\x1b[31m${result.error}\x1b[0m`); // Red color for errors
      }

      // Auto-refresh file tree after certain commands that modify the filesystem
      const shouldRefresh = command.match(/^(ros2 pkg create|mkdir|touch|rm|mv|cp|colcon build)/);
      if (shouldRefresh) {
        console.log("[IDE] Auto-refreshing file tree after command:", command);
        setTimeout(() => refreshFileTree(true), 1000); // Force refresh after 1 second
      }
    } catch (error) {
      callback?.(`Error: ${error.message}`);
    }
  }, [canvas, refreshFileTree]);

  // Handle execute from ConvertToCodeNode - switches to terminal view and runs command
  const handleExecuteFromNode = useCallback((command) => {
    setActiveView("terminal");
    setTimeout(() => {
      window.dispatchEvent(new CustomEvent("executeCommand", { detail: { command } }));
    }, 100);
  }, []);

  // Show canvas selector if no canvas is selected.
  // Render the tutorial overlay here too so beta Mission 1 (create-workspace)
  // can guide the student through the selector before a canvas exists.
  if (showCanvasSelector) {
    return (
      <>
        <CanvasSelector onCanvasSelect={handleCanvasSelect} />
        {tutorial && tutorial.length > 0 && (
          <IDETutorial
            steps={tutorial}
            onComplete={handleTutorialComplete}
            onSkip={handleTutorialSkip}
            autoStart={true}
            startFresh={Boolean(beta)}
          />
        )}
      </>
    );
  }

  // Show loading state
  if (canvasLoading) {
    return (
      <div className="ide-test">
        <div className="ide-test__loading">Loading workspace...</div>
      </div>
    );
  }

  return (
    <div className="ide-test">
      {/* Header */}
      <header className="ide-test__header">
        <button className="ide-test__back" onClick={() => setShowCanvasSelector(true)}>
          ← Change Workspace
        </button>
        <h1 className="ide-test__title">
          <span className="ide-test__title-main">ROS Visual IDE</span>
          <span className="ide-test__title-sub">
            {canvas?.name || "Workspace"}
            {loadedFromCache && (
              <span
                style={{
                  marginLeft: "0.5rem",
                  fontSize: "0.7em",
                  padding: "0.15rem 0.4rem",
                  background: "rgba(125, 249, 255, 0.15)",
                  border: "1px solid var(--neon)",
                  borderRadius: "4px",
                  color: "var(--neon)",
                  fontWeight: "600",
                }}
                title="Loaded from cache, refreshing in background..."
              >
                ⚡ CACHED
              </span>
            )}
          </span>
        </h1>
        <div className="ide-test__actions">
          {beta?.returnTo && (
            <button
              className="btn btn--small"
              onClick={handleBetaFinish}
              title="Mark this beta mission complete and return to the mission board"
              style={{ background: "#00ff88", color: "#04210f", fontWeight: 700, border: "none" }}
            >
              ✓ Finish Mission
            </button>
          )}
          {activeView === "simulation" && (
            <>
              <button
                className="btn btn--small"
                onClick={() => { setSimResetKey(k => k + 1); setSimMenuHidden(false); }}
              >
                Reset
              </button>
              {simMenuHidden && (
                <button
                  className="btn btn--small"
                  data-tour="sim-open-menu"
                  onClick={() => setSimMenuHidden(false)}
                >
                  Open Map Menu
                </button>
              )}
            </>
          )}
          {activeView === "code" && (
            <>
              <button
                className="btn btn--small"
                onClick={() => setFileExplorerCollapsed((v) => !v)}
                style={{ background: 'transparent', border: '1px solid currentColor', opacity: 0.8, color: 'inherit' }}
              >
                {fileExplorerCollapsed ? <><FaFolderOpen /> Show Files</> : <><FaFolder /> Hide Files</>}
              </button>
              <button
                className={`btn btn--small ${showUrdfWindow ? "btn--primary" : ""}`}
                onClick={() => setShowUrdfWindow((v) => !v)}
                title="Toggle URDF Viewer window"
              >
                <MdViewInAr style={{ marginRight: "0.3rem", verticalAlign: "middle" }} />
                URDF
              </button>
              <button
                className="btn btn--small"
                onClick={() => refreshFileTree(true)}
                title="Force refresh from Docker"
              >
                🔄 Refresh
              </button>
              <button className="btn btn--small" onClick={handleClear}>
                Clear
              </button>
              <button className="btn btn--small btn--primary" onClick={handleSave}>
                💾 Save
              </button>
            </>
          )}
          <ThemeToggle />
        </div>
      </header>

      {/* Body */}
      <div className="ide-test__body">

        {/* ── Code View ──────────────────────────────────────────────────────── */}
        {visitedViews.has("code") && (
          <div
            className={`ide-test__layout ${fileExplorerCollapsed ? "ide-test__layout--collapsed" : ""}`}
            style={{ display: activeView === "code" ? undefined : "none" }}
          >

            {/* Left Sidebar - File Explorer */}
            <aside className={`ide-test__explorer ${fileExplorerCollapsed ? "ide-test__explorer--collapsed" : ""}`}>
              <div className="ide-test__explorer-header">
                <span className="ide-test__explorer-title">
                  FILES
                  {loadedFromCache && (
                    <span style={{
                      marginLeft: "0.5rem",
                      fontSize: "0.65rem",
                      color: "#68d391",
                      background: "rgba(104, 211, 145, 0.15)",
                      padding: "2px 6px",
                      borderRadius: "3px",
                      border: "1px solid rgba(104, 211, 145, 0.4)",
                      fontWeight: "600",
                    }}>
                      ⚡
                    </span>
                  )}
                </span>
                <button
                  onClick={() => refreshFileTree(true)}
                  title="Force refresh from Docker"
                  style={{ background: "transparent", border: "none", color: "var(--neon)", cursor: "pointer", padding: "0.25rem", fontSize: "1rem", opacity: 0.7 }}
                  onMouseEnter={(e) => e.target.style.opacity = "1"}
                  onMouseLeave={(e) => e.target.style.opacity = "0.7"}
                >
                  🔄
                </button>
              </div>
              {!fileExplorerCollapsed && (
                <FileExplorer
                  files={fileTree}
                  currentFile={currentFile}
                  onFileSelect={handleFileSelect}
                  onFileCreate={handleFileCreate}
                  onFileDelete={handleFileDelete}
                  onFileRename={handleFileRename}
                  onRefresh={() => refreshFileTree(true)}
                  loading={canvasLoading}
                  isQCarMode={Boolean(canvas?.connect_to_qcar)}
                  error={qcarError}
                />
              )}
            </aside>

            {/* Center - Canvas */}
            <main className="ide-test__canvas">
              <div className="ide-test__palette">
                <CategorizedPalette
                  categories={canvas?.connect_to_qcar ? paletteQCarCategories : paletteCategorized}
                  defaultCategory={canvas?.connect_to_qcar ? "QCar2" : "URDF"}
                />
              </div>

              <TabBar
                tabs={openTabs}
                activeTab={activeTab}
                onTabSelect={handleTabSelect}
                onTabClose={handleTabClose}
              />

              <div className="ide-test__canvas-content">
                {currentFile ? (
                  <>
                    <div className="ide-test__editor-mode">
                      <button
                        className={`ide-test__editor-mode-btn ${editorMode === "visual" ? "active" : ""}`}
                        onClick={() => setEditorMode("visual")}
                      >
                        🧩 Visual
                      </button>
                      <button
                        className={`ide-test__editor-mode-btn ${editorMode === "text" ? "active" : ""}`}
                        onClick={() => setEditorMode("text")}
                      >
                        📝 Text
                      </button>
                      <span className="ide-test__file-name">
                        {fileMetadata[currentFile]?.blockMetadata?.isBlockGenerated && (
                          <span style={{ marginRight: "0.5rem", padding: "2px 6px", background: "rgba(125,249,255,0.2)", border: "1px solid var(--neon)", borderRadius: "3px", fontSize: "0.75em", fontWeight: "600", color: "var(--neon)" }}>🧩</span>
                        )}
                        {currentFile.split("/").pop()}
                      </span>
                    </div>

                    <div className="ide-test__editor-container">
                      {editorMode === "visual" ? (
                        <BlockCanvas
                          key={currentFile}
                          initialNodes={currentGraph.nodes}
                          initialEdges={currentGraph.edges}
                          onGraphChange={handleGraphChange}
                          codeGenerator={computeUrdfXml}
                          onCodeGenerated={handleCodeGenerated}
                          readOnly={false}
                          canvasId={canvas?.id}
                          onExecute={handleExecuteFromNode}
                          currentFile={currentFile}
                          onFileSaved={handleFileSaved}
                          isQCarMode={Boolean(canvas?.connect_to_qcar)}
                        />
                      ) : (
                        <CodeEditor
                          key={currentFile}
                          content={textContent}
                          language={detectLanguage(currentFile)}
                          onChange={handleTextChange}
                          readOnly={false}
                          theme="dark"
                        />
                      )}
                    </div>
                  </>
                ) : (
                  <div className="ide-test__empty">
                    <h3>No file selected</h3>
                    <p>Select a file from the explorer or create a new one</p>
                  </div>
                )}
              </div>
            </main>
          </div>
        )}

        {/* ── Terminal View ───────────────────────────────────────────────────── */}
        {visitedViews.has("terminal") && (
          <div
            className="ide-test__terminal-view"
            style={{ display: activeView === "terminal" ? undefined : "none" }}
          >
            <TerminalTabs
              onCommandExecute={handleCommandExecute}
              workingDirectory="~"
              username="developer"
              canvasId={canvas?.id || "workspace"}
            />
          </div>
        )}

        {/* ── Simulation View ──────────────────────────────────────────────────── */}
        {visitedViews.has("simulation") && !canvas?.connect_to_qcar && (
          <div
            className="ide-test__sim-view"
            style={{ display: activeView === "simulation" ? undefined : "none" }}
          >
            <SimulationEnvironment
              key={simResetKey}
              canvasId={canvas?.id}
              hideMenus={simMenuHidden}
              onRunStart={() => setSimMenuHidden(true)}
            />
          </div>
        )}

        {/* ── QCar Visualization View ─────────────────────────────────────────── */}
        {visitedViews.has("viz") && canvas?.connect_to_qcar && (
          <div
            className="ide-test__viz-view"
            style={{ display: activeView === "viz" ? undefined : "none" }}
          >
            <QCarVisualization qcarRosbridgeUrl={qcarRosbridgeUrl} />
          </div>
        )}

        {/* ── Bookmark Nav ────────────────────────────────────────────────────── */}
        <nav className="ide-test__bookmark-nav">
          <button
            className={`bookmark-btn ${activeView === "code" ? "bookmark-btn--active" : ""}`}
            onClick={() => setActiveView("code")}
            title="Code"
          >
            <span className="bookmark-btn__icon"><FaRegFileCode /></span>
            <span className="bookmark-btn__label">Code</span>
          </button>
          {!canvas?.connect_to_qcar && (
            <button
              className={`bookmark-btn ${activeView === "simulation" ? "bookmark-btn--active" : ""}`}
              onClick={() => setActiveView("simulation")}
              title="Simulation"
            >
              <span className="bookmark-btn__icon"><FaSimplybuilt /></span>
              <span className="bookmark-btn__label">Simulation</span>
            </button>
          )}
          <button
            className={`bookmark-btn ${activeView === "terminal" ? "bookmark-btn--active" : ""}`}
            onClick={() => setActiveView("terminal")}
            title="Terminal"
          >
            <span className="bookmark-btn__icon"><IoTerminal /></span>
            <span className="bookmark-btn__label">Terminal</span>
          </button>
          {canvas?.connect_to_qcar && (
            <button
              className={`bookmark-btn bookmark-btn--qcar ${activeView === "viz" ? "bookmark-btn--active" : ""}`}
              onClick={() => setActiveView("viz")}
              title="QCar Visualization"
            >
              <span className="bookmark-btn__icon"><MdSensors /></span>
              <span className="bookmark-btn__label">Viz</span>
            </button>
          )}
        </nav>

      </div>

      {/* ── Floating URDF Window ─────────────────────────────────────────────── */}
      {showUrdfWindow && (
        <div className="ide-test__urdf-window">
          <div className="ide-test__urdf-window-header">
            <span>URDF VIEWER</span>
            <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
              {generatedCode && (
                <button
                  className="ide-test__urdf-window-copy"
                  onClick={() => navigator.clipboard.writeText(generatedCode)}
                  title="Copy generated XML"
                >
                  Copy XML
                </button>
              )}
              <button
                className="ide-test__urdf-window-close"
                onClick={() => setShowUrdfWindow(false)}
              >
                ×
              </button>
            </div>
          </div>
          <div className="ide-test__urdf-window-viewer">
            <URDFViewer xmlCode={generatedCode} ros={ros?.current} />
          </div>
          {generatedCode && (
            <div className="ide-test__urdf-window-code">
              <pre>{generatedCode}</pre>
            </div>
          )}
        </div>
      )}

      {/* Tutorial Overlay */}
      {tutorial && tutorial.length > 0 && (
        <IDETutorial
          steps={tutorial}
          onComplete={handleTutorialComplete}
          onSkip={handleTutorialSkip}
          autoStart={true}
          startFresh={Boolean(beta)}
        />
      )}
    </div>
  );
}

export default function IDETestPage() {
  return (
    <ReactFlowProvider>
      <IDETestPageInner />
    </ReactFlowProvider>
  );
}
