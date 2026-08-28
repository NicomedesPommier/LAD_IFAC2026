import React, { useState, useEffect, useRef, useCallback } from "react";
import { Position, useStore } from "@xyflow/react";
import HandleWithLabel from "./HandleWithLabel";
import "../../styles/components/_ros-subscriber-node.scss";

/**
 * Nav2NavigateToPoseNode
 *
 * Visual ROS2 Action Client block for Nav2 NavigateToPose.
 *
 * Now it receives a complete goal from Nav2GoalNode:
 *
 * Nav2 Goal ───► goal ───► Nav2 Navigate To Pose
 */
export default function Nav2NavigateToPoseNode({ id, data }) {
  const edges = useStore((state) => state.edges);
  const nodes = useStore((state) => state.nodes);

  const goalEdge = edges.find(
    (e) => e.target === id && e.targetHandle === "goal"
  );

  const goalSourceNode = goalEdge
    ? nodes.find((n) => n.id === goalEdge.source)
    : null;

  const isGoalConnected = Boolean(goalEdge && goalSourceNode);

  const [navigatorName, setNavigatorName] = useState(
    data.navigatorName ?? "nav2_navigate_to_pose"
  );

  const [actionName, setActionName] = useState(
    data.actionName ?? "/navigate_to_pose"
  );

  const [actionType, setActionType] = useState(
    data.actionType ?? "nav2_msgs/action/NavigateToPose"
  );

  const [serverTimeout, setServerTimeout] = useState(
    data.serverTimeout ?? "10.0"
  );

  const [sendGoal, setSendGoal] = useState(data.sendGoal ?? false);
  const [cancelGoal, setCancelGoal] = useState(data.cancelGoal ?? false);

  const [goalCommandId, setGoalCommandId] = useState(
    data.goalCommandId ?? 0
  );

  const [cancelCommandId, setCancelCommandId] = useState(
    data.cancelCommandId ?? 0
  );

  const [status, setStatus] = useState(data.status ?? "idle");
  const [feedback, setFeedback] = useState(data.feedback ?? "");
  const [result, setResult] = useState(data.result ?? "");

  const [distanceRemaining, setDistanceRemaining] = useState(
    data.distanceRemaining ?? ""
  );

  const [estimatedTimeRemaining, setEstimatedTimeRemaining] = useState(
    data.estimatedTimeRemaining ?? ""
  );

  const [numberOfRecoveries, setNumberOfRecoveries] = useState(
    data.numberOfRecoveries ?? "0"
  );

  const [expanded, setExpanded] = useState(data.expanded ?? true);

  const onChangeRef = useRef(data.onChange);

  useEffect(() => {
    onChangeRef.current = data.onChange;
  }, [data.onChange]);

  const notifyChange = useCallback(
    (updates) => {
      if (onChangeRef.current) {
        onChangeRef.current(id, updates);
      }
    },
    [id]
  );

  const DEFAULT_GOAL = {
    pose: {
      header: {
        frame_id: "map",
        stamp: "now",
      },
      pose: {
        position: {
          x: 0.0,
          y: 0.0,
          z: 0.0,
        },
        orientation: {
          x: 0.0,
          y: 0.0,
          z: 0.0,
          w: 1.0,
        },
      },
    },
    behavior_tree: "",
  };

  const isObject = (value) => {
    return value !== null && typeof value === "object";
  };

  const isGoalLike = (value) => {
    return (
      isObject(value) &&
      isObject(value.pose) &&
      isObject(value.pose.pose) &&
      isObject(value.pose.pose.position) &&
      isObject(value.pose.pose.orientation)
    );
  };

  const extractGoalFromSourceData = (sourceData) => {
    if (!sourceData) return null;

    const candidates = [
      sourceData.goal,
      sourceData.value,
      sourceData.nav2Goal,
      sourceData.navigateToPoseGoal,
    ];

    for (const candidate of candidates) {
      if (isGoalLike(candidate)) {
        return candidate;
      }

      if (isObject(candidate) && isGoalLike(candidate.goal)) {
        return candidate.goal;
      }
    }

    if (isObject(sourceData.poseStamped)) {
      return {
        pose: sourceData.poseStamped,
        behavior_tree: sourceData.behaviorTree ?? "",
      };
    }

    return null;
  };

  const connectedGoal = extractGoalFromSourceData(goalSourceNode?.data);

  const activeGoal =
    connectedGoal ||
    (isGoalLike(data.goal) ? data.goal : null) ||
    (isGoalLike(data.fallbackGoal) ? data.fallbackGoal : null) ||
    DEFAULT_GOAL;

  const getGoalSummary = (goal) => {
    const position = goal?.pose?.pose?.position ?? {};
    const orientation = goal?.pose?.pose?.orientation ?? {};

    return {
      frameId: goal?.pose?.header?.frame_id ?? "map",
      x: Number.parseFloat(position.x ?? 0.0).toFixed(3),
      y: Number.parseFloat(position.y ?? 0.0).toFixed(3),
      z: Number.parseFloat(position.z ?? 0.0).toFixed(3),
      qz: Number.parseFloat(orientation.z ?? 0.0).toFixed(3),
      qw: Number.parseFloat(orientation.w ?? 1.0).toFixed(3),
    };
  };

  const goalSummary = getGoalSummary(activeGoal);

  const buildNodeData = (updates = {}) => {
    const nextData = {
      inputType: "nav2NavigateToPose",
      outputType: "nav2ActionClient",
      actionType,

      navigatorName,
      actionName,

      goal: activeGoal,
      goalConnected: isGoalConnected,
      sourceGoalNodeId: goalSourceNode?.id ?? "",
      sourceGoalHandle: goalEdge?.sourceHandle ?? "",

      serverTimeout,

      sendGoal,
      cancelGoal,
      goalCommandId,
      cancelCommandId,

      status,
      feedback,
      result,
      distanceRemaining,
      estimatedTimeRemaining,
      numberOfRecoveries,

      expanded,

      ...updates,
    };

    return {
      ...nextData,
      value: {
        actionName: nextData.actionName,
        actionType: nextData.actionType,
        goal: nextData.goal,
        sendGoal: nextData.sendGoal,
        cancelGoal: nextData.cancelGoal,
        goalCommandId: nextData.goalCommandId,
        cancelCommandId: nextData.cancelCommandId,
        status: nextData.status,
      },
    };
  };

  useEffect(() => {
    notifyChange(buildNodeData());
  }, [
    isGoalConnected,
    goalSourceNode?.id,
    actionName,
    actionType,
    navigatorName,
    serverTimeout,
    status,
    feedback,
    result,
    distanceRemaining,
    estimatedTimeRemaining,
    numberOfRecoveries,
    expanded,
  ]);

  useEffect(() => {
    if (data.status !== undefined) setStatus(data.status);
    if (data.feedback !== undefined) setFeedback(data.feedback);
    if (data.result !== undefined) setResult(data.result);
    if (data.distanceRemaining !== undefined) {
      setDistanceRemaining(data.distanceRemaining);
    }
    if (data.estimatedTimeRemaining !== undefined) {
      setEstimatedTimeRemaining(data.estimatedTimeRemaining);
    }
    if (data.numberOfRecoveries !== undefined) {
      setNumberOfRecoveries(data.numberOfRecoveries);
    }
  }, [
    data.status,
    data.feedback,
    data.result,
    data.distanceRemaining,
    data.estimatedTimeRemaining,
    data.numberOfRecoveries,
  ]);

  const onNavigatorNameChange = (value) => {
    setNavigatorName(value);
    notifyChange(buildNodeData({ navigatorName: value }));
  };

  const onActionNameChange = (value) => {
    setActionName(value);
    notifyChange(buildNodeData({ actionName: value }));
  };

  const onActionTypeChange = (value) => {
    setActionType(value);
    notifyChange(buildNodeData({ actionType: value }));
  };

  const onServerTimeoutChange = (value) => {
    setServerTimeout(value);
    notifyChange(buildNodeData({ serverTimeout: value }));
  };

  const onSendGoal = () => {
    const nextCommandId = Date.now();

    setSendGoal(true);
    setCancelGoal(false);
    setGoalCommandId(nextCommandId);
    setStatus("goal_requested");

    notifyChange(
      buildNodeData({
        sendGoal: true,
        cancelGoal: false,
        goalCommandId: nextCommandId,
        status: "goal_requested",
        value: {
          command: "send_goal",
          actionName,
          actionType,
          goal: activeGoal,
          goalCommandId: nextCommandId,
        },
      })
    );
  };

  const onCancelGoal = () => {
    const nextCommandId = Date.now();

    setCancelGoal(true);
    setSendGoal(false);
    setCancelCommandId(nextCommandId);
    setStatus("cancel_requested");

    notifyChange(
      buildNodeData({
        cancelGoal: true,
        sendGoal: false,
        cancelCommandId: nextCommandId,
        status: "cancel_requested",
        value: {
          command: "cancel_goal",
          actionName,
          actionType,
          cancelCommandId: nextCommandId,
        },
      })
    );
  };

  return (
    <div className="rf-card ros-subscriber-node">
      <div
        className="ros-subscriber-node__header"
        onClick={() => setExpanded(!expanded)}
      >
        <span className="ros-subscriber-node__title">
          🧭 Nav2 Navigate To Pose
        </span>

        <span
          className={`ros-subscriber-node__toggle ${
            expanded
              ? "ros-subscriber-node__toggle--expanded"
              : "ros-subscriber-node__toggle--collapsed"
          }`}
        >
          {expanded ? "▼" : "▶"}
        </span>
      </div>

      <div className="ros-subscriber-node__body">
        <div
          className={`ros-subscriber-node__field-collapsible ${
            isGoalConnected
              ? "ros-subscriber-node__field-collapsible--collapsed"
              : ""
          }`}
        >
          <span className="ros-subscriber-node__field-label">Goal Input</span>

          <div className="ros-subscriber-node__field-input-wrapper">
            <input
              value={
                isGoalConnected
                  ? `Connected from ${goalSourceNode?.id}`
                  : "No goal connected"
              }
              readOnly
              className="rf-input"
            />
          </div>
        </div>

        {expanded && (
          <>
            <label className="rf-field">
              <span>Navigator Name</span>
              <input
                type="text"
                value={navigatorName}
                onChange={(e) => onNavigatorNameChange(e.target.value)}
                placeholder="nav2_navigate_to_pose"
                className="rf-input"
              />
            </label>

            <label className="rf-field">
              <span>Action Name</span>
              <input
                type="text"
                value={actionName}
                onChange={(e) => onActionNameChange(e.target.value)}
                placeholder="/navigate_to_pose"
                className="rf-input"
              />
            </label>

            <label className="rf-field">
              <span>Action Type</span>
              <input
                type="text"
                value={actionType}
                onChange={(e) => onActionTypeChange(e.target.value)}
                placeholder="nav2_msgs/action/NavigateToPose"
                className="rf-input"
              />
            </label>

            <label className="rf-field">
              <span>Server Timeout (s)</span>
              <input
                type="number"
                value={serverTimeout}
                onChange={(e) => onServerTimeoutChange(e.target.value)}
                placeholder="10.0"
                step="0.5"
                min="0.1"
                className="rf-input"
              />
            </label>

            <div className="ros-subscriber-node__grid-2">
              <button
                type="button"
                className="rf-input"
                onClick={onSendGoal}
                disabled={!isGoalConnected}
              >
                Send Goal
              </button>

              <button
                type="button"
                className="rf-input"
                onClick={onCancelGoal}
              >
                Cancel Goal
              </button>
            </div>

            <div className="ros-subscriber-node__message-preview">
              <span className="ros-subscriber-node__message-label">
                Goal Preview:
              </span>

              <div className="ros-subscriber-node__message-content">
                <div>Frame: {goalSummary.frameId}</div>
                <div>
                  Position: x={goalSummary.x}, y={goalSummary.y}, z=
                  {goalSummary.z}
                </div>
                <div>
                  Orientation: qz={goalSummary.qz}, qw={goalSummary.qw}
                </div>
              </div>
            </div>

            <div className="ros-subscriber-node__message-preview">
              <span className="ros-subscriber-node__message-label">
                Navigation Feedback:
              </span>

              <div className="ros-subscriber-node__message-content">
                <div>Status: {status}</div>
                <div>Distance remaining: {distanceRemaining || "N/A"}</div>
                <div>
                  Estimated time remaining: {estimatedTimeRemaining || "N/A"}
                </div>
                <div>Recoveries: {numberOfRecoveries}</div>

                {feedback && (
                  <div>
                    Feedback:{" "}
                    {String(feedback).length > 80
                      ? String(feedback).substring(0, 80) + "..."
                      : String(feedback)}
                  </div>
                )}

                {result && (
                  <div>
                    Result:{" "}
                    {String(result).length > 80
                      ? String(result).substring(0, 80) + "..."
                      : String(result)}
                  </div>
                )}
              </div>
            </div>

            <div className="ros-subscriber-node__info-panel">
              <div className="ros-subscriber-node__info-title">
                Action Client: {actionType}
              </div>

              <div className="ros-subscriber-node__info-line">
                Node: {navigatorName}
              </div>

              <div className="ros-subscriber-node__info-line">
                Action: {actionName}
              </div>

              <div className="ros-subscriber-node__info-line">
                Goal source:{" "}
                {isGoalConnected ? goalSourceNode?.id : "fallback / none"}
              </div>

              <div className="ros-subscriber-node__info-line">
                Goal command ID: {goalCommandId}
              </div>

              <div className="ros-subscriber-node__info-line">
                Cancel command ID: {cancelCommandId}
              </div>
            </div>

            <div className="ros-subscriber-node__message-preview">
              <span className="ros-subscriber-node__message-label">
                Action Payload:
              </span>

              <pre className="ros-subscriber-node__message-content">
                {JSON.stringify(
                  {
                    actionName,
                    actionType,
                    goal: activeGoal,
                  },
                  null,
                  2
                )}
              </pre>
            </div>
          </>
        )}
      </div>

      <HandleWithLabel
        type="target"
        position={Position.Left}
        id="goal"
        label="goal"
        top="50%"
      />

      <HandleWithLabel
        type="source"
        position={Position.Right}
        id="status"
        label="status"
        top="35%"
      />

      <HandleWithLabel
        type="source"
        position={Position.Right}
        id="feedback"
        label="feedback"
        top="55%"
      />

      <HandleWithLabel
        type="source"
        position={Position.Right}
        id="result"
        label="result"
        top="75%"
      />
    </div>
  );
}