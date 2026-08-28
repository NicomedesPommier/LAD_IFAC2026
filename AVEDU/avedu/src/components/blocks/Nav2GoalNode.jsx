import React, { useMemo, useState } from "react";
import { Position } from "@xyflow/react";
import {
  NodeCard,
  LabeledInput,
  LabeledSelect,
  InfoCard,
  HandleWithLabel,
  useNotifier,
} from "./components";

const FRAME_OPTIONS = [
  "map",
  "odom",
  "base_link",
];

const YAW_UNIT_OPTIONS = [
  "rad",
  "deg",
];

function toNumber(value, fallback = 0.0) {
  const n = Number.parseFloat(value);
  return Number.isFinite(n) ? n : fallback;
}

function yawToQuaternion(yawRad) {
  const halfYaw = yawRad / 2.0;

  return {
    x: 0.0,
    y: 0.0,
    z: Math.sin(halfYaw),
    w: Math.cos(halfYaw),
  };
}

function formatNumber(value, digits = 3) {
  const n = toNumber(value, NaN);
  if (!Number.isFinite(n)) return "invalid";
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

export default function Nav2GoalNode({ id, data }) {
  const [goalName, setGoalName] = useState(
    data.goalName ?? "nav2_goal"
  );

  const [frameId, setFrameId] = useState(
    data.frameId ?? "map"
  );

  const [goalX, setGoalX] = useState(
    data.goalX ?? "0.0"
  );

  const [goalY, setGoalY] = useState(
    data.goalY ?? "0.0"
  );

  const [goalZ, setGoalZ] = useState(
    data.goalZ ?? "0.0"
  );

  const [goalYaw, setGoalYaw] = useState(
    data.goalYaw ?? "0.0"
  );

  const [yawUnit, setYawUnit] = useState(
    data.yawUnit ?? "rad"
  );

  const [behaviorTree, setBehaviorTree] = useState(
    data.behaviorTree ?? ""
  );

  const [expanded, setExpanded] = useState(
    data.expanded ?? true
  );

  const buildGoalData = (overrides = {}) => {
    const nextGoalName = overrides.goalName ?? goalName;
    const nextFrameId = overrides.frameId ?? frameId;
    const nextGoalX = overrides.goalX ?? goalX;
    const nextGoalY = overrides.goalY ?? goalY;
    const nextGoalZ = overrides.goalZ ?? goalZ;
    const nextGoalYaw = overrides.goalYaw ?? goalYaw;
    const nextYawUnit = overrides.yawUnit ?? yawUnit;
    const nextBehaviorTree = overrides.behaviorTree ?? behaviorTree;
    const nextExpanded = overrides.expanded ?? expanded;

    const x = toNumber(nextGoalX, 0.0);
    const y = toNumber(nextGoalY, 0.0);
    const z = toNumber(nextGoalZ, 0.0);

    const yawInput = toNumber(nextGoalYaw, 0.0);
    const yawRad = nextYawUnit === "deg"
      ? yawInput * Math.PI / 180.0
      : yawInput;

    const yawDeg = yawRad * 180.0 / Math.PI;
    const quaternion = yawToQuaternion(yawRad);

    const poseStamped = {
      header: {
        frame_id: nextFrameId,
      },
      pose: {
        position: {
          x,
          y,
          z,
        },
        orientation: quaternion,
      },
    };

    const goal = {
      pose: poseStamped,
      behavior_tree: nextBehaviorTree,
    };

    return {
      inputType: "nav2Goal",
      outputType: "nav2_msgs/action/NavigateToPoseGoal",

      goalName: nextGoalName,

      frameId: nextFrameId,
      goalX: String(nextGoalX),
      goalY: String(nextGoalY),
      goalZ: String(nextGoalZ),
      goalYaw: String(nextGoalYaw),
      yawUnit: nextYawUnit,
      behaviorTree: nextBehaviorTree,

      x,
      y,
      z,
      yaw: yawRad,
      yawRad,
      yawDeg,

      quaternion,
      poseStamped,
      goal,

      value: goal,
      expanded: nextExpanded,
    };
  };

  const goalData = useMemo(() => {
    return buildGoalData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    goalName,
    frameId,
    goalX,
    goalY,
    goalZ,
    goalYaw,
    yawUnit,
    behaviorTree,
    expanded,
  ]);

  const notify = useNotifier(id, data, () => goalData);

  const onChange = (setter, key) => (v) => {
    setter(v);
    notify(buildGoalData({ [key]: v }));
  };

  const onToggleExpanded = () => {
    const nextExpanded = !expanded;
    setExpanded(nextExpanded);
    notify(buildGoalData({ expanded: nextExpanded }));
  };

  return (
    <NodeCard
      title={
        <ExpandableTitle
          label="Nav2 Goal"
          icon="🎯"
          expanded={expanded}
          onToggle={onToggleExpanded}
        />
      }
      accent="blue"
      size="md"
      className="nav2-goal-node"
      handles={
        <HandleWithLabel
          type="source"
          position={Position.Right}
          id="goal"
          label="goal"
          top="50%"
          color="blue"
        />
      }
    >
      <LabeledInput
        label="Goal name"
        value={goalName}
        onChange={onChange(setGoalName, "goalName")}
        placeholder="nav2_goal"
      />

      <LabeledSelect
        label="Frame ID"
        value={frameId}
        onChange={onChange(setFrameId, "frameId")}
        options={FRAME_OPTIONS}
      />

      <div className="rf-grid-3">
        <LabeledInput
          label="X [m]"
          type="number"
          step="0.1"
          value={goalX}
          onChange={onChange(setGoalX, "goalX")}
          placeholder="0.0"
        />

        <LabeledInput
          label="Y [m]"
          type="number"
          step="0.1"
          value={goalY}
          onChange={onChange(setGoalY, "goalY")}
          placeholder="0.0"
        />

        <LabeledInput
          label="Z [m]"
          type="number"
          step="0.1"
          value={goalZ}
          onChange={onChange(setGoalZ, "goalZ")}
          placeholder="0.0"
        />
      </div>

      <div className="rf-grid-2">
        <LabeledInput
          label="Yaw"
          type="number"
          step="0.1"
          value={goalYaw}
          onChange={onChange(setGoalYaw, "goalYaw")}
          placeholder="0.0"
        />

        <LabeledSelect
          label="Yaw unit"
          value={yawUnit}
          onChange={onChange(setYawUnit, "yawUnit")}
          options={YAW_UNIT_OPTIONS}
        />
      </div>

      {expanded && (
        <>
          <LabeledInput
            label="Behavior tree optional"
            value={behaviorTree}
            onChange={onChange(setBehaviorTree, "behaviorTree")}
            placeholder=""
          />

          <InfoCard title="Goal preview">
            <div>
              <code>frame_id</code>: <strong>{goalData.frameId}</strong>
            </div>

            <div style={{ marginTop: "0.35rem" }}>
              <code>x</code>: <strong>{formatNumber(goalData.x)}</strong>,{" "}
              <code>y</code>: <strong>{formatNumber(goalData.y)}</strong>,{" "}
              <code>yaw</code>: <strong>{formatNumber(goalData.yawRad)} rad</strong>
            </div>

            <div style={{ marginTop: "0.35rem", fontSize: "0.85em", opacity: 0.8 }}>
              quaternion = [
              x: {formatNumber(goalData.quaternion.x)},{" "}
              y: {formatNumber(goalData.quaternion.y)},{" "}
              z: {formatNumber(goalData.quaternion.z)},{" "}
              w: {formatNumber(goalData.quaternion.w)}
              ]
            </div>
          </InfoCard>

          <InfoCard title="Output">
            <div>
              This block outputs a complete{" "}
              <code>nav2_msgs/action/NavigateToPose</code> goal.
            </div>
          </InfoCard>
        </>
      )}
    </NodeCard>
  );
}