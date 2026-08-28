// src/components/ide/EmbeddedIDE.jsx
// Embedded IDE with bookmark-style navigation sidebar
import React, { useState, useCallback, useMemo, useEffect } from "react";
import { ReactFlowProvider } from "@xyflow/react";
import { BlockCanvas } from "./BlockCanvas";
import { FileExplorer } from "./FileExplorer";
import { TabBar } from "./TabBar";
import { TerminalTabs } from "./TerminalTabs";
import { CodeEditor } from "./CodeEditor";
import { LidarVisualizer } from "./LidarVisualizer";
import SimulationEnvironment from "../sim/SimulationEnvironment";
import IDETutorial from "./IDETutorial";
import { CategorizedPalette, paletteCategorized } from "../blocks";
import { computeUrdfXml } from "../blocks/urdf-helpers";
import { useROS2Workspace } from "../../hooks/useROS2Workspace";
import fileApi from "../../services/fileApi";
import { FaRegFileCode } from "react-icons/fa";
import { FaSimplybuilt } from "react-icons/fa";
import { FaFolder, FaFolderOpen } from "react-icons/fa6";
import { IoTerminal } from "react-icons/io5";
import "../../styles/_rosflow.scss";
import "../../styles/components/_embedded-ide.scss";

function EmbeddedIDEInner({ tutorial, onTutorialComplete, onTutorialSkip }) {
  const { workspace, fileTree, loading: workspaceLoading, error: workspaceError, canvasId, refreshWorkspace } = useROS2Workspace();

  // ── View navigation ──────────────────────────────────────────────────────────
  const [activeView, setActiveView] = useState("code"); // 'code' | 'simulation' | 'terminal'

  // Lazy-mount + keep-alive: once a view is visited, keep it mounted so the
  // Terminal PTY, Simulation physics, and ReactFlow state survive tab switches.
  const [visitedViews, setVisitedViews] = useState(() => new Set(["code"]));
  useEffect(() => {
    setVisitedViews((prev) => (prev.has(activeView) ? prev : new Set([...prev, activeView])));
    // xterm + ReactFlow refit via ResizeObserver; Three.js (Simulation) listens
    // to window resize. Dispatch on view change so all three re-measure.
    const raf = requestAnimationFrame(() => window.dispatchEvent(new Event("resize")));
    return () => cancelAnimationFrame(raf);
  }, [activeView]);

  // ── Simulation view state ────────────────────────────────────────────────────
  const [simMenuHidden, setSimMenuHidden] = useState(true);
  const [simResetKey, setSimResetKey] = useState(0);

  // ── Code view / file state ───────────────────────────────────────────────────
  const [currentFile, setCurrentFile] = useState(null);
  const [fileContents, setFileContents] = useState({});
  const [fileMetadata, setFileMetadata] = useState({});
  const [editorMode, setEditorMode] = useState("visual");
  const [generatedCode, setGeneratedCode] = useState("");
  const [textContent, setTextContent] = useState("");
  const [openTabs, setOpenTabs] = useState([]);
  const [activeTab, setActiveTab] = useState(null);
  const [fileExplorerCollapsed, setFileExplorerCollapsed] = useState(false);
  const [showVisualizer, setShowVisualizer] = useState(false);

  // ── Ensure /src directory exists ─────────────────────────────────────────────
  useEffect(() => {
    const ensureSrcDirectory = async () => {
      if (!canvasId) return;
      try {
        const files = await fileApi.listFiles(canvasId);
        const srcExists = files.some(f => f.path === "/src" && f.file_type === "directory");
        if (!srcExists) {
          await fileApi.createFile(canvasId, { path: "/src", file_type: "directory" });
          await refreshWorkspace(false);
        }
      } catch (error) {
        console.warn("[Embedded IDE] Failed to ensure src directory:", error);
      }
    };
    ensureSrcDirectory();
  }, [canvasId, refreshWorkspace]);

  // ── File selection ───────────────────────────────────────────────────────────
  const handleFileSelect = useCallback(async (path) => {
    if (!canvasId) return;
    try {
      const findFileInTree = (items, targetPath) => {
        for (const item of items) {
          if (item.path === targetPath) return item;
          if (item.children) {
            const found = findFileInTree(item.children, targetPath);
            if (found) return found;
          }
        }
        return null;
      };

      const file = findFileInTree(fileTree, path);
      if (!file) { console.error("[Embedded IDE] File not found in tree:", path); return; }
      if (file.type === "directory") return;

      const isVisualFile = file.isVisual || path.endsWith('.canvas') || path.endsWith('.blocks');

      if (fileContents[path] !== undefined) {
        const content = fileContents[path];
        setCurrentFile(path);
        setTextContent(content);
        setEditorMode(isVisualFile ? "visual" : "text");
        setOpenTabs(prev => {
          if (prev.some(tab => tab.path === path)) return prev;
          return [...prev, { path, name: path.split("/").pop(), type: "file", unsaved: false }];
        });
        setActiveTab(path);
        return;
      }

      let content = "";
      let fileId = file.id;
      const files = await fileApi.listFiles(canvasId);
      const fileData = files.find(f => f.path === path);

      if (fileData) {
        fileId = fileData.id;
        if (fileData.content) {
          content = fileData.content;
        } else {
          try { const df = await fileApi.readFromDocker(canvasId, path); content = df.content || ""; }
          catch (e) { console.warn("[Embedded IDE] Failed to read from Docker:", e); }
        }
      } else {
        try { const df = await fileApi.readFromDocker(canvasId, path); content = df.content || ""; }
        catch (e) { console.warn("[Embedded IDE] Failed to read from Docker:", e); }
      }

      let actuallyVisual = isVisualFile;
      if (!actuallyVisual && content) {
        try {
          const parsed = JSON.parse(content);
          if (parsed?.nodes && Array.isArray(parsed.nodes)) actuallyVisual = true;
        } catch (e) { /* not JSON */ }
      }

      setCurrentFile(path);
      setFileContents(prev => ({ ...prev, [path]: content }));
      setFileMetadata(prev => ({ ...prev, [path]: { id: fileId, type: "file", isVisual: actuallyVisual } }));
      setTextContent(content);
      setEditorMode(actuallyVisual ? "visual" : "text");
      setOpenTabs(prev => {
        if (prev.some(tab => tab.path === path)) return prev;
        return [...prev, { path, name: path.split("/").pop(), type: "file", unsaved: false }];
      });
      setActiveTab(path);
    } catch (error) {
      console.error("[Embedded IDE] Failed to load file:", error);
      alert(`Failed to load file: ${error.message}`);
    }
  }, [canvasId, fileContents, fileTree]);

  // ── Auto-create default canvas ───────────────────────────────────────────────
  useEffect(() => {
    if (!canvasId || currentFile) return;
    const createDefaultCanvas = async () => {
      try {
        const defaultPath = "/ros2_commands.canvas";
        const files = await fileApi.listFiles(canvasId);
        let canvasFile = files.find(f => f.path === defaultPath);
        if (!canvasFile) {
          canvasFile = await fileApi.createFile(canvasId, {
            path: defaultPath,
            file_type: "file",
            content: JSON.stringify({ nodes: [], edges: [] }, null, 2),
          });
        }
        handleFileSelect(defaultPath);
      } catch (error) {
        console.error("[Embedded IDE] Failed to create default canvas:", error);
      }
    };
    createDefaultCanvas();
  }, [canvasId, currentFile, handleFileSelect]);

  // ── Graph / editor state ─────────────────────────────────────────────────────
  const currentGraph = useMemo(() => {
    if (!currentFile || editorMode !== "visual") return { nodes: [], edges: [] };
    const content = fileContents[currentFile];
    if (!content) return { nodes: [], edges: [] };
    try { return JSON.parse(content); } catch { return { nodes: [], edges: [] }; }
  }, [currentFile, fileContents, editorMode]);

  const handleGraphChange = useCallback(({ nodes, edges }) => {
    if (!currentFile) return;
    const newGraph = JSON.stringify({ nodes, edges }, null, 2);
    setFileContents(prev => ({ ...prev, [currentFile]: newGraph }));
    setOpenTabs(prev => prev.map(tab => tab.path === currentFile ? { ...tab, unsaved: true } : tab));
  }, [currentFile]);

  const handleCodeGenerated = useCallback((code) => {
    if (typeof code === 'object' && code !== null) {
      setGeneratedCode(code.xml || code.code || JSON.stringify(code, null, 2));
    } else {
      setGeneratedCode(code || "");
    }
  }, []);

  useEffect(() => {
    if (!currentFile) return;
    const isVisual = fileMetadata[currentFile]?.isVisual || currentFile.endsWith('.canvas') || currentFile.endsWith('.blocks');
    if (!isVisual) return;
    try {
      const graph = JSON.parse(fileContents[currentFile] || "{}");
      const toCodeNode = graph.nodes?.find(n => n.type === "toCode");
      setGeneratedCode(toCodeNode?.data?.preview || "");
    } catch (e) { /* ignore */ }
  }, [currentFile, fileContents, fileMetadata]);

  const handleTextChange = useCallback((newText) => {
    setTextContent(newText);
    setFileContents(prev => ({ ...prev, [currentFile]: newText }));
    setOpenTabs(prev => prev.map(tab => tab.path === currentFile ? { ...tab, unsaved: true } : tab));
  }, [currentFile]);

  // ── Save ─────────────────────────────────────────────────────────────────────
  const handleSave = useCallback(async () => {
    if (!canvasId || !currentFile) return;
    try {
      const content = editorMode === "text" ? textContent : fileContents[currentFile];
      const metadata = fileMetadata[currentFile];
      if (content === undefined || content === null) { alert("No content to save"); return; }
      if (metadata?.id) {
        await fileApi.updateFile(canvasId, metadata.id, { content });
      } else {
        const newFile = await fileApi.createFile(canvasId, { path: currentFile, file_type: "file", content });
        setFileMetadata(prev => ({ ...prev, [currentFile]: { id: newFile.id, type: "file", fromDocker: false } }));
      }
      setFileContents(prev => ({ ...prev, [currentFile]: content }));
      setOpenTabs(prev => prev.map(tab => tab.path === currentFile ? { ...tab, unsaved: false } : tab));
      setTimeout(() => refreshWorkspace(false), 500);
    } catch (error) {
      console.error("[Embedded IDE] Failed to save:", error);
      alert(`Failed to save file: ${error.message}`);
    }
  }, [canvasId, currentFile, fileContents, fileMetadata, editorMode, textContent, refreshWorkspace]);

  const handleFileSaved = useCallback(async () => {
    await handleSave();
    await refreshWorkspace(false);
  }, [handleSave, refreshWorkspace]);

  // ── Tab management (code view only) ─────────────────────────────────────────
  const handleTabSelect = useCallback((path) => {
    const content = fileContents[path] ?? "";
    const isVisual = fileMetadata[path]?.isVisual || path.endsWith('.canvas') || path.endsWith('.blocks');
    setActiveTab(path);
    setCurrentFile(path);
    setTextContent(content);
    setEditorMode(isVisual ? "visual" : "text");
  }, [fileContents, fileMetadata]);

  const handleTabClose = useCallback((path) => {
    const filtered = openTabs.filter(tab => tab.path !== path);
    setOpenTabs(filtered);
    if (activeTab === path) {
      if (filtered.length > 0) {
        const next = filtered[filtered.length - 1];
        const nextContent = fileContents[next.path] ?? "";
        const nextIsVisual = fileMetadata[next.path]?.isVisual || next.path.endsWith('.canvas') || next.path.endsWith('.blocks');
        setActiveTab(next.path);
        setCurrentFile(next.path);
        setTextContent(nextContent);
        setEditorMode(nextIsVisual ? "visual" : "text");
      } else {
        setActiveTab(null);
        setCurrentFile(null);
        setTextContent("");
      }
    }
  }, [activeTab, openTabs, fileContents, fileMetadata]);

  // ── Command execution ────────────────────────────────────────────────────────
  const handleCommandExecute = useCallback(async (command, callback) => {
    if (!canvasId) { callback?.("Error: Canvas not loaded"); return; }
    try {
      const result = await fileApi.executeCommand(canvasId, command);
      if (result.output) callback?.(result.output);
      if (result.error) callback?.(`\x1b[31m${result.error}\x1b[0m`);
      const shouldRefresh = command.match(/^(ros2 pkg create|mkdir|touch|rm|mv|cp|colcon build)/);
      if (shouldRefresh) setTimeout(() => refreshWorkspace(), 1000);
    } catch (error) {
      callback?.(`Error: ${error.message}`);
    }
  }, [canvasId, refreshWorkspace]);

  const handleExecuteFromNode = useCallback((command) => {
    setActiveView("terminal");
    setTimeout(() => {
      window.dispatchEvent(new CustomEvent("executeCommand", { detail: { command } }));
    }, 100);
  }, []);

  // ── File operations ──────────────────────────────────────────────────────────
  const handleFileCreate = useCallback(async (path, type) => {
    if (!canvasId) return;
    try {
      await fileApi.createFile(canvasId, { path, file_type: type, content: type === "file" ? "" : undefined });
      await refreshWorkspace(false);
    } catch (error) {
      alert(`Failed to create ${type}: ${error.message}`);
    }
  }, [canvasId, refreshWorkspace]);

  const handleFileDelete = useCallback(async (path) => {
    if (!canvasId) return;
    try {
      const files = await fileApi.listFiles(canvasId);
      const file = files.find(f => f.path === path);
      if (file) { await fileApi.deleteFile(canvasId, file.id); await refreshWorkspace(false); }
    } catch (error) {
      alert(`Failed to delete: ${error.message}`);
    }
  }, [canvasId, refreshWorkspace]);

  const handleFileRename = useCallback(async (oldPath, newPath) => {
    if (!canvasId) return;
    try {
      const files = await fileApi.listFiles(canvasId);
      const file = files.find(f => f.path === oldPath);
      if (file) { await fileApi.updateFile(canvasId, file.id, { path: newPath }); await refreshWorkspace(false); }
    } catch (error) {
      alert(`Failed to rename: ${error.message}`);
    }
  }, [canvasId, refreshWorkspace]);

  const detectLanguage = useCallback((path) => {
    if (!path) return "text";
    const languageMap = { py: "python", js: "javascript", jsx: "javascript", ts: "typescript", tsx: "typescript", json: "json", xml: "xml", urdf: "xml", yaml: "yaml", yml: "yaml", md: "markdown", txt: "text" };
    return languageMap[path.split(".").pop()] || "text";
  }, []);

  // ── Loading / error states ───────────────────────────────────────────────────
  if (workspaceLoading) {
    return (
      <div className="embedded-ide">
        <div className="embedded-ide__loading">Loading ROS2 workspace...</div>
      </div>
    );
  }
  if (workspaceError) {
    return (
      <div className="embedded-ide">
        <div className="embedded-ide__loading" style={{ color: "red" }}>
          Error loading workspace: {workspaceError}
        </div>
      </div>
    );
  }

  // ── Render ───────────────────────────────────────────────────────────────────
  return (
    <div className="embedded-ide">
      {/* Header */}
      <header className="embedded-ide__header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <h2 className="embedded-ide__title">{workspace?.name || "ROS2 Workspace"}</h2>
          {activeView === "code" && (
            <button 
              className="btn btn--small" 
              onClick={() => setFileExplorerCollapsed(v => !v)}
              style={{ padding: '0.25rem 0.5rem', fontSize: '0.8rem', background: 'transparent', border: '1px solid currentColor', opacity: 0.8, color: 'inherit' }}
            >
              {fileExplorerCollapsed ? <><FaFolderOpen /> Show Files</> : <><FaFolder /> Hide Files</>}
            </button>
          )}
        </div>
        <div className="embedded-ide__actions">
          {/* Simulation-view-specific header actions */}
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
                  onClick={() => setSimMenuHidden(false)}
                >
                  Open Map Menu
                </button>
              )}
            </>
          )}
          <button
            className="btn btn--small"
            onClick={async () => {
              try { await refreshWorkspace(true); }
              catch (error) { alert(`Failed to refresh: ${error.message}`); }
            }}
          >
            Refresh
          </button>
          <button className="btn btn--small btn--primary" onClick={handleSave}>
            Save
          </button>
        </div>
      </header>

      {/* Body: Bookmark Sidebar + View Content */}
      <div className="embedded-ide__body">

        {/* ── Bookmark Navigation Sidebar ─────────────────────────────────── */}
        <nav className="embedded-ide__bookmark-nav">
          <button
            className={`bookmark-btn ${activeView === "code" ? "bookmark-btn--active" : ""}`}
            onClick={() => setActiveView("code")}
            title="Code"
          >
            <FaRegFileCode className="bookmark-btn__icon" />
            <span className="bookmark-btn__label">Code</span>
          </button>
          <button
            className={`bookmark-btn ${activeView === "simulation" ? "bookmark-btn--active" : ""}`}
            onClick={() => setActiveView("simulation")}
            title="Simulation"
          >
            <FaSimplybuilt className="bookmark-btn__icon" />
            <span className="bookmark-btn__label">Simulation</span>
          </button>
          <button
            className={`bookmark-btn ${activeView === "terminal" ? "bookmark-btn--active" : ""}`}
            onClick={() => setActiveView("terminal")}
            title="Terminal"
          >
            <IoTerminal className="bookmark-btn__icon" />
            <span className="bookmark-btn__label">Terminal</span>
          </button>
        </nav>

        {/* ── View Content ─────────────────────────────────────────────────── */}
        <div className="embedded-ide__view-content">

          {/* ── Code View ──────────────────────────────────────────────────── */}
          {visitedViews.has("code") && (
            <div
              className={`embedded-ide__layout ${fileExplorerCollapsed ? "embedded-ide__layout--collapsed" : ""}`}
              style={{ display: activeView === "code" ? undefined : "none" }}
            >
              {/* File Explorer */}
              <aside className={`embedded-ide__explorer ${fileExplorerCollapsed ? "embedded-ide__explorer--collapsed" : ""}`}>
                {!fileExplorerCollapsed && (
                  <div className="embedded-ide__explorer-header">
                    <span>FILES</span>
                  </div>
                )}
                {!fileExplorerCollapsed && (
                  <FileExplorer
                    files={fileTree}
                    currentFile={currentFile}
                    onFileSelect={handleFileSelect}
                    onFileCreate={handleFileCreate}
                    onFileDelete={handleFileDelete}
                    onFileRename={handleFileRename}
                    onRefresh={() => refreshWorkspace(true)}
                    loading={workspaceLoading}
                  />
                )}
              </aside>

              {/* Main editor area */}
              <main className="embedded-ide__main">
                {/* Block Palette */}
                <div className="embedded-ide__palette">
                  <CategorizedPalette categories={paletteCategorized} defaultCategory="ROS" />
                </div>

                {/* Tab Bar */}
                <TabBar
                  tabs={openTabs}
                  activeTab={activeTab}
                  onTabSelect={handleTabSelect}
                  onTabClose={handleTabClose}
                />

                {/* Content Area */}
                <div className="embedded-ide__content">
                  {currentFile ? (
                    <>
                      {/* Editor Mode Selector */}
                      <div className="embedded-ide__editor-mode">
                        <button className={`embedded-ide__editor-mode-btn ${editorMode === "visual" ? "active" : ""}`} onClick={() => setEditorMode("visual")}>Visual</button>
                        <button className={`embedded-ide__editor-mode-btn ${editorMode === "text" ? "active" : ""}`} onClick={() => setEditorMode("text")}>Text</button>
                        <span className="embedded-ide__file-name">{currentFile.split("/").pop()}</span>
                      </div>

                      {/* Editor */}
                      <div className="embedded-ide__editor">
                        {editorMode === "visual" ? (
                          <BlockCanvas
                            key={currentFile}
                            initialNodes={currentGraph.nodes}
                            initialEdges={currentGraph.edges}
                            onGraphChange={handleGraphChange}
                            codeGenerator={computeUrdfXml}
                            onCodeGenerated={handleCodeGenerated}
                            readOnly={false}
                            canvasId={canvasId}
                            onExecute={handleExecuteFromNode}
                            currentFile={currentFile}
                            onFileSaved={handleFileSaved}
                          />
                        ) : (
                          <CodeEditor
                            key={currentFile}
                            content={(() => {
                              const isVisual = fileMetadata[currentFile]?.isVisual;
                              return isVisual
                                ? (generatedCode || "// No code generated yet\n// Switch to Visual mode and add blocks")
                                : textContent;
                            })()}
                            language={detectLanguage(currentFile)}
                            onChange={handleTextChange}
                            readOnly={fileMetadata[currentFile]?.isVisual}
                            theme="dark"
                          />
                        )}
                      </div>

                      {/* Generated Code */}
                      {editorMode === "visual" && generatedCode && typeof generatedCode === "string" && (
                        <div className="embedded-ide__code">
                          <div className="embedded-ide__code-header">
                            <span>Generated Code</span>
                            <button onClick={() => navigator.clipboard.writeText(generatedCode)}>Copy</button>
                          </div>
                          <pre className="embedded-ide__code-content">{generatedCode}</pre>
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="embedded-ide__empty">
                      <h3>No file selected</h3>
                      <p>Select a file from the explorer or create a new one</p>
                    </div>
                  )}
                </div>
              </main>

              {/* LIDAR Visualizer */}
              {showVisualizer && (
                <aside className="embedded-ide__visualizer">
                  <LidarVisualizer isVisible={showVisualizer} />
                </aside>
              )}
            </div>
          )}

          {/* ── Simulation View ─────────────────────────────────────────────── */}
          {visitedViews.has("simulation") && (
            <div
              className="embedded-ide__sim-view"
              style={{ display: activeView === "simulation" ? undefined : "none" }}
            >
              <SimulationEnvironment
                key={simResetKey}
                canvasId={canvasId}
                hideMenus={simMenuHidden}
                onRunStart={() => setSimMenuHidden(true)}
              />
            </div>
          )}

          {/* ── Terminal View ────────────────────────────────────────────────── */}
          {visitedViews.has("terminal") && (
            <div
              className="embedded-ide__terminal-view"
              style={{ display: activeView === "terminal" ? undefined : "none" }}
            >
              <TerminalTabs
                onCommandExecute={handleCommandExecute}
                workingDirectory="~"
                username="developer"
                canvasId={canvasId}
              />
            </div>
          )}

        </div>
      </div>

      {/* Tutorial Overlay */}
      {tutorial && tutorial.length > 0 && (
        <IDETutorial
          steps={tutorial}
          onComplete={onTutorialComplete}
          onSkip={onTutorialSkip}
          autoStart={true}
        />
      )}
    </div>
  );
}

export default function EmbeddedIDE(props) {
  return (
    <ReactFlowProvider>
      <EmbeddedIDEInner {...props} />
    </ReactFlowProvider>
  );
}
