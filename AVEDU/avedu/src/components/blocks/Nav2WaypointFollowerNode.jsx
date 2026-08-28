import React, { useEffect, useMemo, useRef, useState } from "react";
import { Position, useStore } from "@xyflow/react";
import {
  NodeCard,
  LabeledInput,
  InfoCard,
  InfoBadge,
  HandleWithLabel,
  useNotifier,
} from "./components";

const ACTION_TYPE = "nav2_msgs/action/FollowWaypoints";

function isObject(value) {
  return value !== null && typeof value === "object";
}

function isPoseStamped(value) {
  return (
    isObject(value) &&
    isObject(value.header) &&
    isObject(value.pose) &&
    isObject(value.pose.position) &&
    isObject(value.pose.orientation)
  );
}

function extractWaypoints(sourceData) {
  if (!sourceData) return { poses: [] };

  const candidates = [
    sourceData.waypoints,
    sourceData.value,
    sourceData.goal,
    sourceData.followWaypointsGoal,
  ];

  for (const candidate of candidates) {
    if (
      isObject(candidate) &&
      Array.isArray(candidate.poses)
    ) {
      return {
        poses: candidate.poses.filter(isPoseStamped),
      };
    }

    if (
      isObject(candidate) &&
      isObject(candidate.waypoints) &&
      Array.isArray(candidate.waypoints.poses)
    ) {
      return {
        poses: candidate.waypoints.poses.filter(isPoseStamped),
      };
    }
  }

  if (Array.isArray(sourceData.poses)) {
    return {
      poses: sourceData.poses.filter(isPoseStamped),
    };
  }

  return { poses: [] };
}

function formatNumber(value, digits = 2) {
  const n = Number.parseFloat(value);
  if (!Number.isFinite(n)) return "0.00";
  return n.toFixed(digits);
}

function safeText(value) {
  if (value === null || value === undefined || value === "") return "N/A";

  const text = String(value);
  return text.length > 80 ? text.substring(0, 80) + "..." : text;
}

function ExpandableTitle({ label, icon, expanded, onToggle }) {
  return (
    <div
      onClick={onToggle}
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        cursor: "pointer",
      }}
    >
      <span>{icon} {label}</span>
      <span style={{ fontSize: "0.75em" }}>{expanded ? "▼" : "▶"}</span>
    </div>
  );
}

export default function Nav2WaypointFollowerNode({ id, data }) {
  const [actionName, setActionName] = useState(
    data.actionName ?? "/follow_waypoints"
  );

  const [serverTimeout, setServerTimeout] = useState(
    data.serverTimeout ?? "10.0"
  );

  const [sendWaypoints, setSendWaypoints] = useState(
    data.sendWaypoints ?? false
  );

  const [cancelWaypoints, setCancelWaypoints] = useState(
    data.cancelWaypoints ?? false
  );

  const [goalCommandId, setGoalCommandId] = useState(
    data.goalCommandId ?? 0
  );

  const [cancelCommandId, setCancelCommandId] = useState(
    data.cancelCommandId ?? 0
  );

  const [status, setStatus] = useState(data.status ?? "idle");
  const [feedback, setFeedback] = useState(data.feedback ?? "");
  const [result, setResult] = useState(data.result ?? "");

  const [currentWaypoint, setCurrentWaypoint] = useState(
    data.currentWaypoint ?? "0"
  );

  const [missedWaypoints, setMissedWaypoints] = useState(
    data.missedWaypoints ?? ""
  );

  const [expanded, setExpanded] = useState(data.expanded ?? true);

  const connectionInfo = useStore((state) => {
    const edges = state.edges ?? [];
    const nodes = state.nodes ?? [];

    const edge = edges.find(
      (candidateEdge) =>
        candidateEdge.target === id &&
        candidateEdge.targetHandle === "waypoints"
    );

    const sourceNode = edge
      ? nodes.find((node) => node.id === edge.source)
      : null;

    return {
      connected: Boolean(edge && sourceNode),
      sourceNodeId: sourceNode?.id ?? "",
      sourceHandle: edge?.sourceHandle ?? "",
      sourceData: sourceNode?.data ?? null,
    };
  });

  const waypointsGoal = useMemo(() => {
    return extractWaypoints(connectionInfo.sourceData);
  }, [connectionInfo.sourceData]);

  const waypointCount = waypointsGoal.poses.length;

  const notify = useNotifier(id, data, () => ({
    inputType: "nav2WaypointFollower",
    outputType: "nav2ActionClient",
    actionType: ACTION_TYPE,

    actionName,
    serverTimeout,

    waypoints: waypointsGoal,
    goal: waypointsGoal,

    sendWaypoints,
    cancelWaypoints,
    goalCommandId,
    cancelCommandId,

    status,
    feedback,
    result,
    currentWaypoint,
    missedWaypoints,

    waypointCount,
    waypointsConnected: connectionInfo.connected,
    sourceWaypointsNodeId: connectionInfo.sourceNodeId,
    sourceWaypointsHandle: connectionInfo.sourceHandle,

    expanded,

    value: {
      actionName,
      actionType: ACTION_TYPE,
      goal: waypointsGoal,
      status,
      feedback,
      result,
    },
  }));

  const lastPublishedRef = useRef("");

  useEffect(() => {
    const payload = {
      inputType: "nav2WaypointFollower",
      outputType: "nav2ActionClient",
      actionType: ACTION_TYPE,

      actionName,
      serverTimeout,

      waypoints: waypointsGoal,
      goal: waypointsGoal,

      sendWaypoints,
      cancelWaypoints,
      goalCommandId,
      cancelCommandId,

      status,
      feedback,
      result,
      currentWaypoint,
      missedWaypoints,

      waypointCount,
      waypointsConnected: connectionInfo.connected,
      sourceWaypointsNodeId: connectionInfo.sourceNodeId,
      sourceWaypointsHandle: connectionInfo.sourceHandle,

      expanded,

      value: {
        actionName,
        actionType: ACTION_TYPE,
        goal: waypointsGoal,
        status,
        feedback,
        result,
      },
    };

    const key = JSON.stringify(payload);

    if (lastPublishedRef.current !== key) {
      lastPublishedRef.current = key;
      notify(payload);
    }
  }, [
    actionName,
    serverTimeout,
    waypointsGoal,
    sendWaypoints,
    cancelWaypoints,
    goalCommandId,
    cancelCommandId,
    status,
    feedback,
    result,
    currentWaypoint,
    missedWaypoints,
    waypointCount,
    connectionInfo.connected,
    connectionInfo.sourceNodeId,
    connectionInfo.sourceHandle,
    expanded,
    notify,
  ]);

  useEffect(() => {
    if (data.status !== undefined) setStatus(data.status);
    if (data.feedback !== undefined) setFeedback(data.feedback);
    if (data.result !== undefined) setResult(data.result);
    if (data.currentWaypoint !== undefined) setCurrentWaypoint(data.currentWaypoint);
    if (data.missedWaypoints !== undefined) setMissedWaypoints(data.missedWaypoints);
  }, [
    data.status,
    data.feedback,
    data.result,
    data.currentWaypoint,
    data.missedWaypoints,
  ]);

  const onChange = (setter, key) => (value) => {
    setter(value);
    notify({ [key]: value });
  };

  const onToggleExpanded = () => {
    const nextExpanded = !expanded;
    setExpanded(nextExpanded);
    notify({ expanded: nextExpanded });
  };

  const onSendWaypoints = () => {
    const nextCommandId = Date.now();

    setSendWaypoints(true);
    setCancelWaypoints(false);
    setGoalCommandId(nextCommandId);
    setStatus("waypoints_requested");

    notify({
      command: "send_waypoints",
      actionName,
      actionType: ACTION_TYPE,
      goal: waypointsGoal,
      waypoints: waypointsGoal,
      sendWaypoints: true,
      cancelWaypoints: false,
      goalCommandId: nextCommandId,
      status: "waypoints_requested",
      value: {
        command: "send_waypoints",
        actionName,
        actionType: ACTION_TYPE,
        goal: waypointsGoal,
        goalCommandId: nextCommandId,
      },
    });
  };

  const onCancelWaypoints = () => {
    const nextCommandId = Date.now();

    setCancelWaypoints(true);
    setSendWaypoints(false);
    setCancelCommandId(nextCommandId);
    setStatus("cancel_requested");

    notify({
      command: "cancel_waypoints",
      actionName,
      actionType: ACTION_TYPE,
      cancelWaypoints: true,
      sendWaypoints: false,
      cancelCommandId: nextCommandId,
      status: "cancel_requested",
      value: {
        command: "cancel_waypoints",
        actionName,
        actionType: ACTION_TYPE,
        cancelCommandId: nextCommandId,
      },
    });
  };

  return (
    <NodeCard
      title={
        <ExpandableTitle
          label="Nav2 Waypoint Follower"
          icon="🧭"
          expanded={expanded}
          onToggle={onToggleExpanded}
        />
      }
      accent="blue"
      size="md"
      className="nav2-waypoint-follower-node"
      handles={
        <>
          <HandleWithLabel
            type="target"
            position={Position.Left}
            id="waypoints"
            label="waypoints"
            top="50%"
            color="blue"
          />

          <HandleWithLabel
            type="source"
            position={Position.Right}
            id="status"
            label="status"
            top="35%"
            color="blue"
          />

          <HandleWithLabel
            type="source"
            position={Position.Right}
            id="feedback"
            label="feedback"
            top="55%"
            color="blue"
          />

          <HandleWithLabel
            type="source"
            position={Position.Right}
            id="result"
            label="result"
            top="75%"
            color="blue"
          />
        </>
      }
    >
      <LabeledInput
        label="Action name"
        value={actionName}
        onChange={onChange(setActionName, "actionName")}
        placeholder="/follow_waypoints"
      />

      <LabeledInput
        label="Server timeout [s]"
        type="number"
        step="0.5"
        min="0.1"
        value={serverTimeout}
        onChange={onChange(setServerTimeout, "serverTimeout")}
        placeholder="10.0"
      />

      <InfoCard title="Waypoints input">
        <div>
          Source:{" "}
          <strong>
            {connectionInfo.connected
              ? `connected from ${connectionInfo.sourceNodeId}`
              : "not connected"}
          </strong>
        </div>

        <div style={{ marginTop: "0.35rem" }}>
          Waypoints: <strong>{waypointCount}</strong>
        </div>
      </InfoCard>

      <div className="rf-grid-2">
        <button
          type="button"
          className="rf-button"
          onClick={onSendWaypoints}
          disabled={!connectionInfo.connected || waypointCount === 0}
        >
          Send Waypoints
        </button>

        <button
          type="button"
          className="rf-button"
          onClick={onCancelWaypoints}
        >
          Cancel
        </button>
      </div>

      {expanded && (
        <>
          <InfoCard title="Follower status">
            <div>
              <code>status</code>: <strong>{status}</strong>
            </div>

            <div style={{ marginTop: "0.35rem", fontSize: "0.85em", opacity: 0.8 }}>
              current waypoint: <code>{safeText(currentWaypoint)}</code>
            </div>

            <div style={{ marginTop: "0.35rem", fontSize: "0.85em", opacity: 0.8 }}>
              missed waypoints: <code>{safeText(missedWaypoints)}</code>
            </div>
          </InfoCard>

          <InfoCard title="Waypoints preview">
            {waypointCount === 0 ? (
              <div style={{ fontSize: "0.85em", opacity: 0.8 }}>
                Connect a <code>Nav2 Waypoints</code> block.
              </div>
            ) : (
              waypointsGoal.poses.map((poseStamped, index) => {
                const position = poseStamped.pose.position;
                const frameId = poseStamped.header?.frame_id ?? "map";

                return (
                  <div
                    key={`follower-waypoint-${index}`}
                    style={{
                      marginBottom: "0.5rem",
                      fontSize: "0.85em",
                    }}
                  >
                    <strong>WP {index + 1}</strong>{" "}
                    <code>{frameId}</code>{" "}
                    x={formatNumber(position.x)}, y={formatNumber(position.y)}
                  </div>
                );
              })
            )}
          </InfoCard>

          <InfoCard title="Feedback">
            <div>feedback: <code>{safeText(feedback)}</code></div>
            <div style={{ marginTop: "0.35rem" }}>
              result: <code>{safeText(result)}</code>
            </div>
          </InfoCard>

          <InfoBadge size="xs">
            This block sends a waypoint list to <code>/follow_waypoints</code>.
          </InfoBadge>
        </>
      )}
    </NodeCard>
  );
}