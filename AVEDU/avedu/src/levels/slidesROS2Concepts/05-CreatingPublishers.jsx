// src/levels/slidesROS2Concepts/05-CreatingPublishers.jsx
import { useState, useCallback, useEffect, useMemo } from "react";
import { ReactFlowProvider } from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import BlockCanvas from "../../components/ide/BlockCanvas";
import FileExplorer from "../../components/ide/FileExplorer";
import Terminal from "../../components/ide/Terminal";
import CategorizedPalette from "../../components/blocks/CategorizedPalette";
import StringNode from "../../components/blocks/StringNode";
import RosPublisherNode from "../../components/blocks/RosPublisherNode";
import { createFile, executeCommand } from "../../services/fileApi";
import useROS2Workspace from "../../hooks/useROS2Workspace";
import "../../components/ide/BlockCanvas.scss";
import "../../styles/_rosflow.scss";

export const meta = {
  id: "creating-publishers",
  title: "Creating Publishers (Interactive)",
  order: 5,
  objectiveCode: "ros2-topics-publishing",
};

// Node type registry
const nodeTypes = {
  text: StringNode,
  rosPublisher: RosPublisherNode,
};

// Palette configuration
const ros2PublisherPalette = {
  "Input": [
    { type: "text", label: "Text/Data", id: "textData" },
  ],
  "ROS2": [
    { type: "rosPublisher", label: "Publisher", id: "publisher" },
  ],
};

// Publisher code templates
const generatePythonPublisher = ({ topicName, msgType, msgPackage, timerInterval, className, fileName, dataInput }) => {
  const interval = parseFloat(timerInterval) || 0.5;

  // Generate message assignment based on type
  let msgAssignment = "";
  if (msgType === "String") {
    const dataValue = dataInput || "Hello ROS 2";
    msgAssignment = `msg.data = f'${dataValue}: {self.count}'`;
  } else if (["Int32", "Int64", "UInt8", "UInt16"].includes(msgType)) {
    const dataValue = dataInput || "0";
    msgAssignment = `msg.data = ${dataValue} + self.count`;
  } else if (["Float32", "Float64"].includes(msgType)) {
    const dataValue = dataInput || "0.0";
    msgAssignment = `msg.data = ${dataValue} + float(self.count)`;
  } else if (msgType === "Bool") {
    msgAssignment = `msg.data = self.count % 2 == 0`;
  } else {
    // Complex types - use custom data if provided
    if (dataInput) {
      msgAssignment = `# Set custom data\n        # ${dataInput}`;
    } else {
      msgAssignment = `# Configure your ${msgType} message here\n        pass`;
    }
  }

  return `import rclpy
from rclpy.node import Node
from ${msgPackage}.msg import ${msgType}

class ${className}(Node):
    def __init__(self):
        super().__init__('${fileName}')
        # Create publisher: topic name, message type, queue size
        self.publisher = self.create_publisher(${msgType}, '${topicName}', 10)

        # Create timer to publish periodically (every ${interval} seconds)
        self.timer = self.create_timer(${interval}, self.timer_callback)
        self.count = 0
        self.get_logger().info(f'Publisher initialized on topic: ${topicName}')

    def timer_callback(self):
        msg = ${msgType}()
        ${msgAssignment}
        self.publisher.publish(msg)
        self.get_logger().info(f'Publishing: "{msg.data if hasattr(msg, "data") else msg}"')
        self.count += 1

def main(args=None):
    rclpy.init(args=args)
    node = ${className}()
    try:
        rclpy.spin(node)
    except KeyboardInterrupt:
        pass
    finally:
        node.destroy_node()
        rclpy.shutdown()

if __name__ == '__main__':
    main()
`;
};

function CreatingPublishersInner({ onObjectiveHit }) {
  const [nodes, setNodes] = useState([]);
  const [edges, setEdges] = useState([]);
  const [status, setStatus] = useState("");
  const [selectedFile, setSelectedFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState("canvas"); // "canvas" or "terminal"
  const [packageName, setPackageName] = useState("");
  const [publisherCreated, setPublisherCreated] = useState(false);
  const [setupUpdated, setSetupUpdated] = useState(false);
  const [packageBuilt, setPackageBuilt] = useState(false);
  const [publisherRunning, setPublisherRunning] = useState(false);
  const [currentStep, setCurrentStep] = useState(1); // 1: Create file, 2: Update setup, 3: Build, 4: Run, 5: Test

  // Use shared ROS2 workspace hook (now includes file tree caching)
  const {
    workspace,
    fileTree,
    loading: workspaceLoading,
    error: workspaceError,
    canvasId,
    loadedFromCache,
    refreshWorkspace,
    retry
  } = useROS2Workspace();

  // Update status when workspace is ready
  useEffect(() => {
    if (workspaceLoading) {
      setStatus("Loading ROS2 workspace...");
    } else if (workspaceError) {
      setStatus(`⚠ Workspace error: ${workspaceError}`);
    } else if (workspace) {
      const cacheIndicator = loadedFromCache ? " (loaded from cache)" : "";
      setStatus(`Connected to workspace "${workspace.name}"${cacheIndicator}! Ready to create publisher nodes.`);
    }
  }, [workspace, workspaceLoading, workspaceError, loadedFromCache]);

  const handleGraphChange = useCallback(({ nodes: newNodes, edges: newEdges }) => {
    setNodes(newNodes);
    setEdges(newEdges);
  }, []);

  // Terminal command execution handler
  const handleCommandExecute = useCallback(
    async (command, callback) => {
      if (!canvasId) {
        callback?.("⚠ Workspace not ready");
        return;
      }

      try {
        console.log("[Publisher Creator] Executing command:", command);
        const result = await executeCommand(canvasId, command);
        console.log("[Publisher Creator] Command result:", result);

        // Send output to terminal
        const output = result.output || result.stdout || "Command executed";
        callback?.(output);

        // Detect successful colcon build
        if (command.includes("colcon build") && (output.includes("Finished") || output.includes("Summary"))) {
          setPackageBuilt(true);
          setCurrentStep(4);
          setStatus(`🎉 Package built! Now run your publisher with ros2 run.`);
        }

        // Detect publisher running
        if (command.includes("ros2 run") && packageName) {
          setPublisherRunning(true);
          setCurrentStep(5);
          setStatus(`✅ Publisher is running! Open another terminal and use ros2 topic echo to see messages.`);
        }

        // Detect ros2 topic echo success
        if (command.includes("ros2 topic echo") && output.includes("data:")) {
          onObjectiveHit?.(meta.objectiveCode);
          setStatus(`🎉 Success! You're receiving messages from your publisher!`);
        }

        if (result.error || result.stderr) {
          callback?.(`\x1b[31m${result.error || result.stderr}\x1b[0m`);
        }
      } catch (error) {
        console.error("[Publisher Creator] Command execution error:", error);
        callback?.(`\x1b[31mError: ${error.message}\x1b[0m`);
      }
    },
    [canvasId, packageName, onObjectiveHit]
  );

  const createPublisherFile = async () => {
    try {
      // Find the publisher node
      const publisherNode = nodes.find(n => n.type === "rosPublisher");
      if (!publisherNode) {
        setStatus("⚠ Error: No publisher block found! Add a ROS2 Publisher block first.");
        return;
      }

      const publisherData = publisherNode.data;
      const {
        topicName = "/chatter",
        msgType = "String",
        msgPackage = "std_msgs",
        frequency = "1.0",
        dataInput = "",
        queueSize = "10"
      } = publisherData;

      // Calculate timer interval from frequency
      const timerInterval = frequency ? (1.0 / parseFloat(frequency)).toFixed(3) : "1.0";

      // Default class and file names
      const className = "MinimalPublisher";
      const fileName = "publisher_node";
      const lang = "python"; // Currently only Python

      // Find package name from file tree (look for src/package_name structure)
      let detectedPackage = "";

      // Helper function to recursively search for src folder
      const findSrcFolder = (items) => {
        for (const item of items) {
          if (item.name === "src" && (item.type === "dir" || item.type === "directory")) {
            return item;
          }
          if (item.children && item.children.length > 0) {
            const found = findSrcFolder(item.children);
            if (found) return found;
          }
        }
        return null;
      };

      if (fileTree && fileTree.length > 0) {
        const srcFolder = findSrcFolder(fileTree);
        if (srcFolder && srcFolder.children && srcFolder.children.length > 0) {
          // Get first package in src folder (should be a directory)
          const packageFolder = srcFolder.children.find(
            child => (child.type === "dir" || child.type === "directory")
          );
          if (packageFolder) {
            detectedPackage = packageFolder.name;
          }
        }
      }

      if (!detectedPackage) {
        setStatus("⚠ Error: No package found in src/ folder. Create a package first in lesson 3!");
        console.error("[Publisher Creator] File tree structure:", JSON.stringify(fileTree, null, 2));
        return;
      }

      setPackageName(detectedPackage);
      setStatus(`📝 Creating ${lang} publisher in package "${detectedPackage}"...`);

      // Generate code
      const code = generatePythonPublisher({
        topicName,
        msgType,
        msgPackage,
        timerInterval,
        className,
        fileName,
        dataInput
      });

      const fileExt = "py";
      // Place file in src/package_name/package_name/
      const filePath = `src/${detectedPackage}/${detectedPackage}/${fileName}.${fileExt}`;

      console.log("[Publisher Creator] Creating file:", filePath);

      // Create the file in the workspace
      await createFile(canvasId, {
        path: filePath,
        content: code,
        file_type: lang,
      });

      setPublisherCreated(true);
      setCurrentStep(2);
      setStatus(`✅ Created ${fileName}.${fileExt}! Now update setup.py to add entry point.`);

      // Refresh file tree to show new file
      await refreshWorkspace(false);

      console.log("[Publisher Creator] File created successfully:", filePath);
    } catch (err) {
      console.error("[Publisher Creator] Failed to create file:", err);
      setStatus(`❌ Error: ${err.message}`);
    }
  };

  const handleFileSelect = (path) => {
    setSelectedFile(path);
  };

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
    <div className="slide-wrap slide-flex slide-flex--col slide-gap-md slide-h-full">
      {/* Header */}
      <div className="slide-flex slide-flex--between slide-items-center slide-mb-sm">
        <div>
          <h2 className="slide-mb-xs">{meta.title}</h2>
          <p className="slide-text--sm slide-muted slide-m-0">
            Build and test ROS2 publishers visually
            {loadedFromCache && (
              <span className="slide-badge slide-badge--neon slide-ml-sm">
                ⚡ CACHED
              </span>
            )}
          </p>
        </div>

        {/* Mode Tabs */}
        <div className="slide-flex slide-gap-sm">
          <button
            className={mode === "canvas" ? "btn btn--sm btn--primary" : "btn btn--sm"}
            onClick={() => setMode("canvas")}
          >
            🎨 Visual Editor
          </button>
          <button
            className={mode === "terminal" ? "btn btn--sm btn--primary" : "btn btn--sm"}
            onClick={() => setMode("terminal")}
          >
            💻 Terminal
          </button>
        </div>
      </div>

      {/* Status Bar */}
      {status && (
        <div className={`slide-badge slide-w-full ${status.includes("✅") ? "slide-badge--success" : status.includes("⚠") ? "slide-badge--warn" : "slide-badge--info"}`}>
          {status}
        </div>
      )}

      {/* Main Content Area */}
      <div className="slide-grid slide-grid--60-40 slide-gap-md slide-flex-1 slide-min-h-0">
        {/* Left Panel: Canvas/Terminal */}
        <div className="slide-flex slide-flex--col slide-gap-md slide-min-h-0">
          {mode === "terminal" ? (
            <div className="slide-terminal-wrapper slide-flex-1">
              <Terminal
                onCommandExecute={handleCommandExecute}
                workingDirectory="/workspace"
                username="ros-learner"
                canvasId={canvasId || "loading"}
              />
            </div>
          ) : (
            <>
              {/* Palette */}
              <div className="slide-rounded slide-overflow-hidden">
                <CategorizedPalette
                  categories={ros2PublisherPalette}
                  defaultCategory="ROS2"
                />
              </div>

              {/* Canvas */}
              <div className="rfp-wrap slide-flex-1 slide-relative slide-rounded slide-border slide-bg-surface-glass slide-min-h-400">
                <BlockCanvas
                  initialNodes={[]}
                  initialEdges={[]}
                  onGraphChange={handleGraphChange}
                  nodeTypes={nodeTypes}
                  canvasId={canvasId}
                />
              </div>

              {/* Action Button */}
              <button
                className="btn btn--primary"
                onClick={createPublisherFile}
                disabled={!canvasId || nodes.length === 0 || loading}
              >
                {loading ? "⏳ Creating..." : "📄 Generate Publisher Code"}
              </button>
            </>
          )}
        </div>

        {/* Right Panel: Info & Files */}
        <div className="slide-flex slide-flex--col slide-gap-md slide-min-h-0">
          {mode === "canvas" ? (
            <>
              {/* Instructions */}
              <div className="slide-card slide-p-md">
                <div className="slide-card__title slide-text--sm slide-mb-md">
                  📚 Quick Start
                </div>
                <ol className="slide-list-ordered slide-text--sm">
                  <li>Drag a <b>ROS2 Publisher</b> block to the canvas</li>
                  <li>Configure topic name, message type, and frequency</li>
                  <li>Optionally connect a <b>Text/Data</b> block for custom data</li>
                  <li>Click <b>Generate Publisher Code</b></li>
                  <li>Switch to Terminal mode to test your publisher!</li>
                </ol>
              </div>

              {/* File Explorer */}
              <div className="slide-flex-1 slide-border slide-rounded slide-overflow-hidden slide-bg-surface-glass slide-min-h-200">
                <div className="slide-header-sm">
                  📁 Workspace Files
                </div>
                <FileExplorer
                  files={fileTree}
                  currentFile={selectedFile}
                  onFileSelect={handleFileSelect}
                  loading={loading}
                />
              </div>

              {/* Publisher Info */}
              <div className="slide-card slide-card--aside slide-p-md">
                <div className="slide-card__title slide-text--sm slide-mb-sm">
                  💡 Message Types
                </div>
                <div className="slide-text--xs slide-muted">
                  <p className="slide-my-xs"><b>std_msgs:</b> String, Int32, Float64, Bool...</p>
                  <p className="slide-my-xs"><b>geometry_msgs:</b> Twist, Pose, Point...</p>
                  <p className="slide-my-xs"><b>sensor_msgs:</b> Image, LaserScan, Imu...</p>
                </div>
              </div>
            </>
          ) : (
            <>
              {/* Terminal Instructions */}
              <div className="slide-card slide-p-md">
                <div className="slide-card__title slide-text--sm slide-mb-md">
                  🧪 Testing Your Publisher
                </div>
                <p className="slide-text--sm slide-my-sm">
                  Run these commands in the terminal to test your publisher:
                </p>
              </div>

              {/* Commands Reference */}
              <div className="slide-card slide-flex-1 slide-p-md slide-bg-surface-glass">
                <div className="slide-card__title slide-text--sm slide-mb-md">
                  ⌨️ Common Commands
                </div>
                <div className="slide-code-wrapper slide-text--xs">
                  <div className="slide-mb-sm">
                    <div className="slide-muted slide-text--xs">Run your publisher:</div>
                    <code className="slide-code-inline slide-text--neon">python3 publisher_node.py</code>
                  </div>
                  <div className="slide-mb-sm">
                    <div className="slide-muted slide-text--xs">List active topics:</div>
                    <code className="slide-code-inline slide-text--neon">ros2 topic list</code>
                  </div>
                  <div className="slide-mb-sm">
                    <div className="slide-muted slide-text--xs">Listen to messages:</div>
                    <code className="slide-code-inline slide-text--neon">ros2 topic echo /chatter</code>
                  </div>
                  <div className="slide-mb-sm">
                    <div className="slide-muted slide-text--xs">Topic information:</div>
                    <code className="slide-code-inline slide-text--neon">ros2 topic info /chatter</code>
                  </div>
                </div>
              </div>

              {/* Testing Tips */}
              <div className="slide-card slide-card--aside slide-p-md">
                <div className="slide-card__title slide-text--sm slide-mb-sm">
                  ✅ Testing Tips
                </div>
                <ul className="slide-list slide-text--xs">
                  <li>Press <kbd className="slide-kbd">Ctrl+C</kbd> to stop the publisher</li>
                  <li>Use multiple terminals to run publisher and subscriber</li>
                  <li>Check <code>ls</code> to verify your file was created</li>
                </ul>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default function CreatingPublishers(props) {
  return (
    <ReactFlowProvider>
      <CreatingPublishersInner {...props} />
    </ReactFlowProvider>
  );
}

