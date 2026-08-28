import React, { useEffect, useMemo, useRef, useState } from "react";
import { Position, useStore } from "@xyflow/react";
import {
  NodeCard,
  InfoCard,
  HandleWithLabel,
  useNotifier,
} from "./components";

const WAYPOINT_HANDLES = [
  "waypoint_1",
  "waypoint_2",
  "waypoint_3",
  "waypoint_4",
  "waypoint_5",
];

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

function isNav2Goal(value) {
  return (
    isObject(value) &&
    isPoseStamped(value.pose)
  );
}

function extractPoseStamped(sourceData) {
  if (!sourceData) return null;

  const candidates = [
    sourceData.goal,
    sourceData.value,
    sourceData.nav2Goal,
    sourceData.navigateToPoseGoal,
  ];

  for (const candidate of candidates) {
    if (isNav2Goal(candidate)) {
      return candidate.pose;
    }

    if (isObject(candidate) && isNav2Goal(candidate.goal)) {
      return candidate.goal.pose;
    }

    if (isPoseStamped(candidate)) {
      return candidate;
    }
  }

  if (isPoseStamped(sourceData.poseStamped)) {
    return sourceData.poseStamped;
  }

  return null;
}

function formatNumber(value, digits = 2) {
  const n = Number.parseFloat(value);
  if (!Number.isFinite(n)) return "0.00";
  return n.toFixed(digits);
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

export default function Nav2WaypointsNode({ id, data }) {
  const [expanded, setExpanded] = useState(data.expanded ?? true);

  const connections = useStore((state) => {
    const edges = state.edges ?? [];
    const nodes = state.nodes ?? [];

    return WAYPOINT_HANDLES.map((handleId) => {
      const edge = edges.find(
        (candidateEdge) =>
          candidateEdge.target === id &&
          candidateEdge.targetHandle === handleId
      );

      const sourceNode = edge
        ? nodes.find((node) => node.id === edge.source)
        : null;

      return {
        handleId,
        connected: Boolean(edge && sourceNode),
        sourceNodeId: sourceNode?.id ?? "",
        sourceHandle: edge?.sourceHandle ?? "",
        sourceData: sourceNode?.data ?? null,
      };
    });
  });

  const poses = useMemo(() => {
    return connections
      .map((connection) => extractPoseStamped(connection.sourceData))
      .filter(Boolean);
  }, [connections]);

  const connectedCount = useMemo(() => {
    return connections.filter((connection) => connection.connected).length;
  }, [connections]);

  const waypointsGoal = useMemo(() => {
    return {
      poses,
    };
  }, [poses]);

  const notify = useNotifier(id, data, () => ({
    inputType: "nav2Waypoints",
    outputType: "nav2_msgs/action/FollowWaypointsGoal",

    waypoints: waypointsGoal,
    poses,

    count: poses.length,
    connectedCount,

    value: waypointsGoal,

    expanded,
  }));

  const lastPublishedRef = useRef("");

  useEffect(() => {
    const payload = {
      inputType: "nav2Waypoints",
      outputType: "nav2_msgs/action/FollowWaypointsGoal",

      waypoints: waypointsGoal,
      poses,

      count: poses.length,
      connectedCount,

      value: waypointsGoal,

      expanded,
    };

    const key = JSON.stringify(payload);

    if (lastPublishedRef.current !== key) {
      lastPublishedRef.current = key;
      notify(payload);
    }
  }, [
    waypointsGoal,
    poses,
    connectedCount,
    expanded,
    notify,
  ]);

  const onToggleExpanded = () => {
    const nextExpanded = !expanded;
    setExpanded(nextExpanded);
    notify({ expanded: nextExpanded });
  };

  return (
    <NodeCard
      title={
        <ExpandableTitle
          label="Nav2 Waypoints"
          icon="📍"
          expanded={expanded}
          onToggle={onToggleExpanded}
        />
      }
      accent="blue"
      size="md"
      className="nav2-waypoints-node"
      handles={
        <>
          <HandleWithLabel
            type="target"
            position={Position.Left}
            id="waypoint_1"
            label="Goal_1"
            top="18%"
            color="blue"
          />

          <HandleWithLabel
            type="target"
            position={Position.Left}
            id="waypoint_2"
            label="Goal_2"
            top="34%"
            color="blue"
          />

          <HandleWithLabel
            type="target"
            position={Position.Left}
            id="waypoint_3"
            label="Goal_3"
            top="50%"
            color="blue"
          />

          <HandleWithLabel
            type="target"
            position={Position.Left}
            id="waypoint_4"
            label="Goal_4"
            top="66%"
            color="blue"
          />

          <HandleWithLabel
            type="target"
            position={Position.Left}
            id="waypoint_5"
            label="Goal_5"
            top="82%"
            color="blue"
          />

          <HandleWithLabel
            type="source"
            position={Position.Right}
            id="waypoints"
            label="waypoints"
            top="50%"
            color="blue"
          />
        </>
      }
    >
      <InfoCard title="Waypoint list">
        <div>
          Connected inputs: <strong>{connectedCount}</strong>
        </div>

        <div style={{ marginTop: "0.35rem" }}>
          Valid waypoints: <strong>{poses.length}</strong>
        </div>
      </InfoCard>

      {expanded && (
        <InfoCard title="Waypoints preview">
          {poses.length === 0 ? (
            <div style={{ fontSize: "0.85em", opacity: 0.8 }}>
              Connect one or more <code>Nav2 Goal</code> blocks.
            </div>
          ) : (
            poses.map((poseStamped, index) => {
              const position = poseStamped.pose.position;
              const frameId = poseStamped.header?.frame_id ?? "map";

              return (
                <div
                  key={`waypoint-preview-${index}`}
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
      )}
    </NodeCard>
  );
}