// src/levels/slidesROS2Concepts/03-CreatingPackageInteractive.jsx
import React, { useState, useCallback, useEffect, useMemo } from "react";
import { ReactFlowProvider } from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import Terminal from "../../components/ide/Terminal";
import BlockCanvas from "../../components/ide/BlockCanvas";
import { CategorizedPalette, defaultDataFor } from "../../components/blocks";
import { executeCommand } from "../../services/fileApi";
import useROS2Workspace from "../../hooks/useROS2Workspace";
import { SlideCodeSnippet } from "../../components/slides/SlideLayout";
import "../../styles/_rosflow.scss";

export const meta = {
  id: "creating-package-interactive",
  title: "Create Your First Package (Interactive)",
  order: 3,
  objectiveCode: "ros2-package-creating",
};

// Use existing ROS palette with unique keys
const ros2PackagePalette = {
  "ROS Inputs": [
    { type: "text", label: "Package Name", id: "pkgName" },
    { type: "text", label: "Node Name", id: "nodeName" },
    { type: "listDeps", label: "Dependencies", id: "deps" },
  ],
  "ROS Nodes": [
    { type: "createPackage", label: "Create Package", id: "createPkg" },
  ],
  "Output": [
    { type: "toCode", label: "Generate Command", id: "toCode" },
  ],
};

// Helper: read package data from connected nodes
function computePackageData(id, nodes, edges) {
  const pkgNode = nodes.find((n) => n.id === id);
  if (!pkgNode || pkgNode.type !== "createPackage") return null;

  const incoming = edges.filter((e) => e.target === id);
  const srcFor = (handleId) => {
    const ed = incoming.find((e) => e.targetHandle === handleId);
    if (!ed) return undefined;
    return nodes.find((n) => n.id === ed.source);
  };

  const base = pkgNode.data || {};
  let pkgName = base.pkgName || "my_package";
  let nodeName = base.nodeName || "";
  let deps = Array.isArray(base.deps) ? base.deps : ["rclpy", "std_msgs"];
  const lang = base.lang || "python";
  const buildType = base.buildType || (lang === "cpp" ? "ament_cmake" : "ament_python");

  const pkgSrc = srcFor("pkgName");
  if (pkgSrc?.type === "string" && pkgSrc.data?.value) pkgName = String(pkgSrc.data.value);

  const nodeSrc = srcFor("nodeName");
  if (nodeSrc?.type === "string" && nodeSrc.data?.value) nodeName = String(nodeSrc.data.value);

  const depsSrc = srcFor("deps");
  if (depsSrc?.type === "listDeps" && Array.isArray(depsSrc.data?.items)) {
    deps = depsSrc.data.items;
  }

  return { pkgName, nodeName, deps, lang, buildType };
}

// Helper: generate ros2 pkg create command in src/ folder
function buildCreatePkgCmd(pkgData) {
  if (!pkgData) return "";

  const { pkgName, nodeName, lang, buildType, deps } = pkgData;
  const bt = buildType || (lang === "cpp" ? "ament_cmake" : "ament_python");
  const depsList = (deps || []).filter(Boolean).join(" ");
  const depsPart = depsList ? ` --dependencies ${depsList}` : "";
  const nodePart = nodeName ? ` --node-name ${nodeName}` : "";
  const pkgPart = pkgName || "my_ros2_package";

  // Create src directory first if it doesn't exist, then create package inside it
  return `mkdir -p src && cd src && ros2 pkg create --build-type ${bt}${nodePart} ${pkgPart}${depsPart}`;
}

function CreatingPackageInteractiveInner({ onObjectiveHit }) {
  const [mode, setMode] = useState("canvas");
  const [status, setStatus] = useState("");
  const [packageCreated, setPackageCreated] = useState(false);
  const [packageBuilt, setPackageBuilt] = useState(false);
  const [currentStep, setCurrentStep] = useState(1); // 1: Create, 2: Build, 3: Done

  // Store graph state from BlockCanvas
  const [nodes, setNodes] = useState([]);
  const [edges, setEdges] = useState([]);

  // Use shared ROS2 workspace hook
  const { workspace, loading: workspaceLoading, error: workspaceError, canvasId, retry } = useROS2Workspace();

  // Update status based on workspace state
  useEffect(() => {
    if (workspaceLoading) {
      setStatus("Loading ROS2 workspace...");
    } else if (workspaceError) {
      setStatus(`⚠ Workspace error: ${workspaceError}`);
    } else if (workspace) {
      setStatus(`Connected to workspace "${workspace.name}"! Ready to create packages.`);
    }
  }, [workspace, workspaceLoading, workspaceError]);

  // Compute generated command from canvas
  const commandResult = useMemo(() => {
    const toCodeNode = nodes.find(n => n.type === "toCode");
    if (!toCodeNode) return { command: "", pkgData: null };

    const incomingEdges = edges.filter(e => e.target === toCodeNode.id);
    const createPkgNode = incomingEdges
      .map(e => nodes.find(n => n.id === e.source))
      .find(n => n && n.type === "createPackage");

    if (!createPkgNode) return { command: "", pkgData: null };

    const pkgData = computePackageData(createPkgNode.id, nodes, edges);
    if (!pkgData) return { command: "", pkgData: null };

    const command = buildCreatePkgCmd(pkgData);

    return { command, pkgData };
  }, [nodes, edges]);

  // Manual execution handler for when user clicks "Run in Terminal" button
  const handleExecuteCommand = useCallback(async (command) => {
    if (!command || !canvasId || packageCreated) return;

    try {
      // Parse package name from command
      const pkgNameMatch = command.match(/--node-name\s+\S+\s+(\S+)/);
      const pkgName = pkgNameMatch ? pkgNameMatch[1] : "package";

      setStatus(`Creating package: ${pkgName}...`);

      console.log("[Package Creator] Executing command:", command);
      console.log("[Package Creator] Canvas ID:", canvasId);

      // Execute the ros2 pkg create command in Docker
      const result = await executeCommand(canvasId, command);

      console.log("[Package Creator] Command result:", result);

      if (result.exit_code === 0 || result.stdout?.includes("creating") || result.output?.includes("creating")) {
        setPackageCreated(true);
        setCurrentStep(2);
        setStatus(`✅ Package "${pkgName}" created! Now build it with colcon build.`);
      } else {
        console.warn("[Package Creator] Command executed but uncertain success:", result);
        setStatus(`⚠ Package creation command executed. Exit code: ${result.exit_code}. Check terminal for details.`);
      }
    } catch (error) {
      console.error("[Package Creator] Failed to create package:", error);
      setStatus(`⚠ Error: ${error.message}`);
    }
  }, [canvasId, packageCreated, onObjectiveHit]);

  // Handle graph changes from BlockCanvas
  const handleGraphChange = useCallback(({ nodes: newNodes, edges: newEdges }) => {
    setNodes(newNodes);
    setEdges(newEdges);
  }, []);

  // Initial nodes - Use existing blocks!
  const initialNodes = useMemo(() => {
    const mk = (type, x, y, extra = {}) => ({
      id: `${type}-${Math.random().toString(36).slice(2, 8)}`,
      type,
      position: { x, y },
      data: { ...defaultDataFor(type), ...extra },
    });

    return [
      mk("text", 50, 80, { label: "Package Name", value: "my_robot_pkg", placeholder: "my_package" }),
      mk("text", 50, 180, { label: "Node Name", value: "sensor_node", placeholder: "my_node" }),
      mk("listDeps", 50, 280, { title: "Dependencies", keyName: "items", items: ["rclpy", "std_msgs"], placeholder: "rclpy" }),
      mk("createPackage", 400, 180, { pkgName: "", nodeName: "", lang: "python", deps: [] }),
      mk("toCode", 720, 180, { onExecute: handleExecuteCommand }),
    ];
  }, [handleExecuteCommand]);

  const handleCommandExecute = useCallback(
    async (command, callback) => {
      if (!canvasId) {
        callback("⚠ Workspace not ready");
        return;
      }

      try {
        const result = await executeCommand(canvasId, command);
        const output = result.output || result.stdout || "Command executed";
        callback(output);

        // Detect colcon build success
        if (command.includes("colcon build") && (output.includes("Finished") || output.includes("Summary"))) {
          setPackageBuilt(true);
          setCurrentStep(3);
          setStatus(`🎉 Package built successfully! Ready to create publishers.`);
          onObjectiveHit?.(meta.objectiveCode);
        }
      } catch (error) {
        callback(`Error: ${error.message}`);
      }
    },
    [canvasId, onObjectiveHit]
  );

  // Show loading state
  if (workspaceLoading) {
    return (
      <div className="slide-wrap slide-center slide-h-400">
        <div className="slide-text--center">
          <div className="slide-text--3xl slide-mb-md">⏳</div>
          <h3>Loading ROS2 Workspace...</h3>
          <p className="slide-muted">Please wait while we connect to your workspace</p>
        </div>
      </div>
    );
  }

  // Show error state with retry option
  if (workspaceError) {
    return (
      <div className="slide-wrap slide-center slide-h-400">
        <div className="slide-text--center slide-max-w-500">
          <div className="slide-text--3xl slide-mb-md">⚠️</div>
          <h3>Workspace Error</h3>
          <p className="slide-muted slide-my-md">{workspaceError}</p>
          <button className="btn btn--primary" onClick={retry}>
            🔄 Retry Connection
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="slide-wrap slide-gap-md">
      <h2>{meta.title}</h2>

      <div className="slide-card">
        <div className="slide-card__title">Visual Package Builder</div>
        <p>
          Connect the <b>Package Name</b>, <b>Node Name</b>, and <b>Dependencies</b> to the <b>Create Package</b> block,
          then connect it to <b>Generate Command</b> to automatically create a ROS 2 package in Docker!
        </p>
        <p className="slide-text--sm slide-muted slide-mt-sm">
          This will execute <code>ros2 pkg create</code> with your configuration.
        </p>
        <p className="slide-text--sm slide-muted slide-mt-sm">
          💡 Workspace <b>"{workspace?.name}"</b> is shared across all ROS2 lessons. Files you create here persist!
        </p>
      </div>

      {/* Mode Selector & Status */}
      <div className="slide-flex slide-flex--wrap slide-gap-sm slide-items-center">
        <button
          className={mode === "canvas" ? "btn btn--primary" : "btn"}
          onClick={() => setMode("canvas")}
        >
          Canvas Mode
        </button>
        <button
          className={mode === "terminal" ? "btn btn--primary" : "btn"}
          onClick={() => setMode("terminal")}
        >
          Terminal Mode
        </button>

        {status && (
          <div className={`slide-badge slide-flex-1 ${packageCreated ? "slide-badge--success" : "slide-badge--info"}`}>
            {status}
          </div>
        )}
      </div>

      {/* Main Content */}
      <div className="slide-grid slide-grid--60-40 slide-gap-md slide-h-500">
        {/* Left: Canvas or Terminal */}
        <div className="slide-flex slide-flex--col slide-h-full">
          {mode === "terminal" ? (
            <div className="slide-terminal-wrapper slide-h-full">
              <Terminal
                onCommandExecute={handleCommandExecute}
                workingDirectory="/workspace"
                username="learner"
                canvasId={canvasId || "loading"}
              />
            </div>
          ) : (
            <div className="rfp-wrap slide-flex slide-flex--col slide-h-full">
              <CategorizedPalette
                categories={ros2PackagePalette}
                defaultCategory="ROS Inputs"
              />

              <div className="slide-flex-1 slide-relative">
                <BlockCanvas
                  initialNodes={initialNodes}
                  initialEdges={[]}
                  onGraphChange={handleGraphChange}
                  canvasId={canvasId}
                />
              </div>

              {packageCreated && !packageBuilt && (
                <div className="slide-callout slide-callout--warn slide-text--center">
                  ⚠️ Next step: Switch to Terminal and run <code className="slide-code-inline">colcon build</code>
                </div>
              )}
              {packageBuilt && (
                <div className="slide-callout slide-callout--success slide-text--center">
                  ✅ Package built! You can now proceed to the next lesson to create publishers.
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right: Command Preview & Instructions */}
        <div className="slide-flex slide-flex--col slide-gap-md slide-h-full slide-overflow-hidden">
          <div className="slide-card slide-p-md">
            <div className="slide-card__title slide-text--sm">Step-by-Step Workflow</div>
            <ol className="slide-list-ordered slide-text--sm">
              <li style={{ opacity: currentStep >= 1 ? 1 : 0.5 }}>
                {currentStep > 1 ? "✅" : "📝"} Edit <b>Package Name</b> and <b>Node Name</b>
              </li>
              <li style={{ opacity: currentStep >= 1 ? 1 : 0.5 }}>
                {currentStep > 1 ? "✅" : "📝"} Connect blocks and click "Run in Terminal"
              </li>
              <li style={{ opacity: currentStep >= 2 ? 1 : 0.5, fontWeight: currentStep === 2 ? "bold" : "normal" }}>
                {currentStep > 2 ? "✅" : currentStep === 2 ? "⏳" : "⏹"} Switch to Terminal and run <code>colcon build</code>
              </li>
              <li style={{ opacity: currentStep >= 3 ? 1 : 0.5 }}>
                {currentStep >= 3 ? "✅" : "⏹"} Package is ready! Continue to next lesson
              </li>
            </ol>
          </div>

          <div className="slide-card slide-flex-1 slide-flex slide-flex--col slide-p-md">
            <SlideCodeSnippet
              title="Generated Command"
              code={commandResult.command || "# Connect blocks to generate command"}
              className="slide-flex-1"
            />

            {commandResult.pkgData && (
              <div className="slide-card slide-card--nested slide-mt-md slide-p-sm slide-text--xs">
                <b className="slide-text--sm">Package Info:</b>
                <div className="slide-grid slide-gap-xs slide-mt-xs">
                  <div>• <code>{commandResult.pkgData.pkgName}</code></div>
                  {commandResult.pkgData.nodeName && <div>• Node: <code>{commandResult.pkgData.nodeName}</code></div>}
                  <div>• {commandResult.pkgData.buildType}</div>
                  <div>• {commandResult.pkgData.deps.join(", ")}</div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {packageCreated && !packageBuilt && (
        <div className="slide-card slide-card--warn">
          <div className="slide-card__title">📦 Package Created - Now Build It!</div>
          <p>
            Your ROS 2 package has been created in <code>src/{commandResult.pkgData?.pkgName}</code>! The package contains:
          </p>
          <ul className="slide-list slide-text--sm slide-mt-sm">
            <li>Package structure with <code>package.xml</code></li>
            <li>Build configuration (<code>setup.py</code> or <code>CMakeLists.txt</code>)</li>
            {commandResult.pkgData?.nodeName && <li>Starter node: <code>{commandResult.pkgData.nodeName}</code></li>}
            <li>Dependencies: {commandResult.pkgData?.deps.join(", ")}</li>
          </ul>
          <div className="slide-tip slide-mt-md">
            <div className="slide-bold slide-mb-xs">⚠️ Next Step: Build the Package</div>
            <p className="slide-text--sm slide-my-xs">
              Switch to <b>Terminal Mode</b> and run:
            </p>
            <code className="slide-code-block">colcon build</code>
            <p className="slide-text--xs slide-mt-xs slide-muted">
              This compiles your package and makes it ready to use. Wait for "Finished" message.
            </p>
          </div>
        </div>
      )}

      {packageBuilt && (
        <div className="slide-card slide-card--success">
          <div className="slide-card__title">🎉 Package Built Successfully!</div>
          <p>
            Your ROS 2 package <code>{commandResult.pkgData?.pkgName}</code> is now compiled and ready to use!
          </p>
          <div className="slide-tip slide-mt-md">
            <div className="slide-bold slide-mb-xs">✅ You're ready for the next lesson!</div>
            <p className="slide-text--sm">
              Proceed to "Creating Publishers" to add publisher nodes to your package.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

export default function CreatingPackageInteractive(props) {
  return (
    <ReactFlowProvider>
      <CreatingPackageInteractiveInner {...props} />
    </ReactFlowProvider>
  );
}

