// components/blocks/index.js
// Node registration + palettes + default data

import CreatePackageNode from "./CreatePackageNode";
import RosRunNode from "./RosRunNode";
import RosPublisherNode from "./RosPublisherNode";
import RosSubscriberNode from "./RosSubscriberNode";
import RosTopicViewerNode from "./RosTopicViewerNode";
import RosbagRecorderNode from "./RosbagRecorderNode";
import RosbagPlayerNode from "./RosbagPlayerNode";
import LidarVisualizerNode from "./LidarVisualizerNode";
import StringNode from "./StringNode";
import ListItemsNode from "./ListItemsNode";
import ConvertToCodeNode from "./ConvertToCodeNode";

//NAV blocks
import Nav2GoalNode from "./Nav2GoalNode";
import Nav2WaypointsNode from "./Nav2WaypointsNode";
import Nav2WaypointFollowerNode from "./Nav2WaypointFollowerNode";
import Nav2NavigateToPoseNode from "./Nav2NavigateToPoseNode";

// URDF blocks (original)
import UrdfLinkNode from "./UrdfLinkNode";
import UrdfJointNode from "./UrdfJointNode";
import UrdfRobotNode from "./UrdfRobotNode";
import UrdfPreviewNode from "./UrdfPreviewNode";
import UrdfViewerNode from "./UrdfViewerNode";
import UrdfControlNode from "./UrdfControlNode";

// URDF blocks V2 (modular/improved)
import UrdfLinkNodeV2 from "./UrdfLinkNodeV2";
import UrdfInertialNode from "./UrdfInertialNode";
import UrdfVisualNode from "./UrdfVisualNode";
import UrdfCollisionNode from "./UrdfCollisionNode";
import UrdfAssemblyNode from "./UrdfAssemblyNode";
import UrdfXmlPreviewNode from "./UrdfXmlPreviewNode";

// New utility blocks
import CoordinatesNode from "./CoordinatesNode";
import GeometryNode from "./GeometryNode";
import TwistBuilderNode from "./TwistBuilderNode";
import ArithmeticOperator from "./ArithmeticOperator";
import SaturationNode from "./SaturationNode";
import LowPassFilterNode from "./LowPassFilterNode";
import BooleanTriggerNode from "./BooleanTriggerNode";
import TimerRateNode from "./TimerRateNode";

// Input source blocks
import KeyboardInputNode from "./KeyboardInputNode";
import LaneDetectionNode from "./LaneDetectionNode";

// Launch file blocks
import LaunchExecutableNode from "./LaunchExecutableNode";
import LaunchFileNode from "./LaunchFileNode";

// TF (Transform) blocks
import TfWorldNode from "./TfWorldNode";
import TfFrameNode from "./TfFrameNode";
import TfChildNode from "./TfChildNode";
import CenterMassNode from "./CenterMassNode";

// QCar2-specific blocks
import QCarTeleopNode from "./QCarTeleopNode";

// Custom user-defined blocks
import CustomNodeRenderer from "./CustomNodeRenderer";

// Autonomous driving blocks
import PIDErrorNode from "./PIDErrorNode";
import PIDControllerNode from "./PIDControllerNode";
import NumericSetpoint from "./NumericSetPoint";
import NumericMeasurement from "./NumericMeasurement";
import VelocityCommandNode from "./VelocityCommandNode";
import ObstacleDetectorNode from "./ObstacleDetectorNode";
import ConstantFloatNode from "./ConstantFloatNode";
import PurePursuitNode from "./PurePursuitNode";
import SDCSRoadmapNode from "./SDCSRoadmapNode";
import PIDGraphWidget from "./PIDGraphWidget";

// Live monitor / readout block (no code generation)
import DisplayNode from "./DisplayNode";

// Palette component
export { default as CategorizedPalette } from "./CategorizedPalette";

export const nodeTypes = {
  // ROS blocks
  createPackage: CreatePackageNode,
  rosRun: RosRunNode,
  rosPublisher: RosPublisherNode,
  rosSubscriber: RosSubscriberNode,
  rosTopicViewer: RosTopicViewerNode,
  rosbagRecorder: RosbagRecorderNode,
  rosbagPlayer: RosbagPlayerNode,
  lidarVisualizer: LidarVisualizerNode,
  string: StringNode,
  text: StringNode, // Alias for generic text node
  listArgs: ListItemsNode,
  listDeps: ListItemsNode,
  toCode: ConvertToCodeNode,

  //NAV blocks
  nav2Goal: Nav2GoalNode,
  nav2Waypoints: Nav2WaypointsNode,
  nav2WaypointFollower: Nav2WaypointFollowerNode,
  nav2NavigateToPose: Nav2NavigateToPoseNode,
  
  // URDF (original)
  urdfLink: UrdfLinkNode,
  urdfJoint: UrdfJointNode,
  urdfRobot: UrdfRobotNode,
  urdfPreview: UrdfPreviewNode,
  urdfViewer: UrdfViewerNode,
  urdfControl: UrdfControlNode,

  // URDF V2 (modular/improved)
  urdfLinkV2: UrdfLinkNodeV2,
  urdfInertial: UrdfInertialNode,
  urdfVisual: UrdfVisualNode,
  urdfCollision: UrdfCollisionNode,
  urdfAssembly: UrdfAssemblyNode,
  urdfXmlPreview: UrdfXmlPreviewNode,

  // Utility blocks
  coordinates: CoordinatesNode,
  geometry: GeometryNode,
  arithmeticOperator: ArithmeticOperator,
  twistBuilder: TwistBuilderNode,
  saturation: SaturationNode,
  lowPassFilter: LowPassFilterNode,
  booleanTrigger: BooleanTriggerNode,
  timerRate: TimerRateNode,

  // Input source blocks
  keyboardInput: KeyboardInputNode,
  laneDetection: LaneDetectionNode,

  // TF (Transform) blocks
  tfWorld: TfWorldNode,
  tfFrame: TfFrameNode,
  tfChild: TfChildNode,
  centerMass: CenterMassNode,

  // Launch file blocks
  launchExecutable: LaunchExecutableNode,
  launchFile: LaunchFileNode,

  // Custom user-defined node (single renderer, definition stored in data)
  customNode: CustomNodeRenderer,

  // Autonomous driving / Control blocks
  pidError: PIDErrorNode,
  pidController: PIDControllerNode,
  numericSetpoint: NumericSetpoint,
  numericMeasurement: NumericMeasurement,
  velocityCommand: VelocityCommandNode,
  obstacleDetector: ObstacleDetectorNode,
  constantFloat: ConstantFloatNode,
  purePursuit: PurePursuitNode,
  sdcsRoadmap: SDCSRoadmapNode,
  pidGraph: PIDGraphWidget,

  // Live monitor / readout
  display: DisplayNode,

  // QCar2-specific blocks
  qcarTeleop: QCarTeleopNode,
};

// Legacy palettes (for backward compatibility)
export const paletteRun = [
  { type: "text", label: "Text", category: "Input" },
  { type: "listArgs", label: "Args", category: "Input" },
  { type: "rosRun", label: "ROS Run", category: "ROS" },
  { type: "toCode", label: "Convert2Code", category: "Output" },
];

export const paletteCreate = [
  { type: "text", label: "Text", category: "Input" },
  { type: "listDeps", label: "Dependencies", category: "Input" },
  { type: "createPackage", label: "Create Package", category: "ROS" },
  { type: "toCode", label: "Convert2Code", category: "Output" },
];

export const paletteUrdf = [
  { type: "urdfLink", label: "URDF Link", category: "URDF" },
  { type: "urdfJoint", label: "URDF Joint", category: "URDF" },
  { type: "urdfRobot", label: "URDF Robot", category: "URDF" },
  { type: "urdfPreview", label: "URDF XML", category: "Output" },
  { type: "urdfViewer", label: "URDF Viewer", category: "Visualization" },
];

export const paletteUrdfV2 = [
  { type: "urdfInertial", label: "Inertial", category: "URDF" },
  { type: "urdfVisual", label: "Visual", category: "URDF" },
  { type: "urdfCollision", label: "Collision", category: "URDF" },
  { type: "urdfLinkV2", label: "Link", category: "URDF" },
  { type: "urdfJoint", label: "Joint", category: "URDF" },
  { type: "urdfAssembly", label: "Assembly", category: "URDF" },
  { type: "urdfRobot", label: "Robot", category: "URDF" },
  { type: "urdfXmlPreview", label: "XML Preview", category: "Output" },
  { type: "urdfViewer", label: "3D Viewer", category: "Visualization" },
];

// New categorized palettes
export const paletteCategorized = {
  Input: [
    { type: "text", label: "Text" },
    { type: "listArgs", label: "Args List" },
    { type: "listDeps", label: "Dependencies List" },
    { type: "coordinates", label: "Coordinates" },
    { type: "geometry", label: "Geometry" },
    { type: "twistBuilder", label: "Twist Builder" },
    { type: "keyboardInput", label: "Keyboard Teleop" },
    { type: "arithmeticOperator", label: "Arithmetic Operator" },
    { type: "saturation", label: "Saturation" },
    { type: "lowPassFilter", label: "Low Pass Filter" },
    { type: "booleanTrigger", label: "Boolean Trigger" },
    { type: "timerRate", label: "Timer / Rate" },
  ],
  Perception: [
    { type: "laneDetection", label: "Lane Detection" },
  ],
  ROS: [
    { type: "createPackage", label: "Create Package" },
    { type: "rosRun", label: "ROS Run" },
    { type: "rosPublisher", label: "ROS2 Publisher" },
    { type: "rosSubscriber", label: "ROS2 Subscriber" },
    { type: "rosTopicViewer", label: "ROS2 Topic Viewer"},
    { type: "rosbagRecorder", label: "Rosbag Recorder" },
    { type: "rosbagPlayer", label: "Rosbag Player" },
    { type: "launchExecutable", label: "Launch Node" },
    { type: "launchFile", label: "Launch File" },
  ],
  NAV: [
    { type: "nav2Goal", label: "Navigation Goal" },
    { type: "nav2Waypoints", label: "Waypoints" },
    { type: "nav2WaypointFollower", label: "Waypoint Follower" },
    { type: "nav2NavigateToPose", label: "Navigate to Pose" },
  ],
  URDF: [
    { type: "urdfInertial", label: "Inertial" },
    { type: "urdfVisual", label: "Visual" },
    { type: "urdfCollision", label: "Collision" },
    { type: "urdfLinkV2", label: "Link" },
    { type: "urdfJoint", label: "Joint" },
    { type: "urdfAssembly", label: "Assembly" },
    { type: "urdfRobot", label: "Robot" },
  ],
  "URDF (Legacy)": [
    { type: "urdfLink", label: "Link (All-in-one)" },
    { type: "urdfJoint", label: "Joint" },
    { type: "urdfRobot", label: "Robot" },
  ],
  Control: [
    { type: "pidError",         label: "PID Error" },
    { type: "pidController",    label: "PID Controller" },
    { type: "numericSetpoint",  label: "Setpoint" },
    { type: "numericMeasurement", label: "Measurement" },
    { type: "velocityCommand",  label: "Velocity Command" },
    { type: "obstacleDetector", label: "Obstacle Detector" },
    { type: "constantFloat",    label: "Constant Float" },
    { type: "purePursuit",      label: "Pure Pursuit" },
    { type: "sdcsRoadmap",      label: "SDCS Roadmap" },
    { type: "pidGraph",         label: "PID Graph" },
    { type: "display",          label: "Display" },
  ],
  Output: [
    { type: "toCode", label: "Convert to Code" },
    { type: "urdfPreview", label: "URDF XML" },
    { type: "urdfXmlPreview", label: "XML Preview" },
  ],
  Visualization: [
    { type: "display", label: "Display" },
    { type: "lidarVisualizer", label: "LIDAR Visualizer" },
    { type: "urdfViewer", label: "URDF 3D Viewer" },
    { type: "urdfControl", label: "Joint Controller" },
  ],
  TF: [
    { type: "tfWorld", label: "World Frame" },
    { type: "tfFrame", label: "TF Frame" },
    { type: "tfChild", label: "Child Frame" },
    { type: "centerMass", label: "Center of Mass" },
  ],
};

// QCar-augmented palette: all standard categories + QCar2-specific category
export const paletteQCarCategories = {
  ...paletteCategorized,
  "QCar2": [
    { type: "qcarTeleop", label: "QCar2 Teleop" },
  ],
};

export function defaultDataFor(typeOrPreset) {
  // -------- existentes --------
  if (typeOrPreset === "rosRun")
    return { pkg: "", exe: "", ns: "", args: [] };

  if (typeOrPreset === "string:pkg")
    return { label: "Package", value: "turtlesim", placeholder: "turtlesim" };
  if (typeOrPreset === "string:exe")
    return { label: "Executable", value: "turtlesim_node", placeholder: "turtlesim_node" };
  if (typeOrPreset === "string:ns")
    return { label: "Namespace", value: "", placeholder: "/demo (opcional)" };

  if (typeOrPreset === "string:pkgName")
    return { label: "Package Name", value: "my_ros2_package" };
  if (typeOrPreset === "string:nodeName")
    return { label: "Node Name", value: "my_node" };

  if (typeOrPreset === "listArgs")
    return { title: "Args", keyName: "args", items: [], placeholder: "--ros-args ..." };
  if (typeOrPreset === "listDeps")
    return { title: "Dependencies", keyName: "deps", items: [], placeholder: "rclpy" };

  if (typeOrPreset === "createPackage") {
    return {
      pkgName: "my_ros2_package",
      nodeName: "my_node",
      lang: "python",
      buildType: "ament_python",
      deps: ["rclpy", "std_msgs"],
    };
  }

  if (typeOrPreset === "toCode")
    return { inCount: 0, preview: "" };

  if (typeOrPreset === "rosPublisher")
    return {
      publisherName: "publisher_node",
      topicName: "/chatter",
      msgPackage: "std_msgs",
      msgType: "String",
      frequency: "1.0",
      dataInput: "",
      queueSize: "10",
      expanded: true,
    };

  if (typeOrPreset === "rosSubscriber")
    return {
      subscriberName: "subscriber_node",
      topicName: "/chatter",
      msgPackage: "std_msgs",
      msgType: "String",
      queueSize: "10",
      lastMessage: "",
      expanded: true,
    };
    
  if (typeOrPreset === "rosTopicViewer")
    return {
      topicViewerName: "topic_viewer_node",
      topicName: "/chatter",
      msgPackage: "std_msgs",
      msgType: "String",
      queueSize: "10",
      displayMode: "compact",
      expanded: true,
      lastMessage: "",
      messageCount: 0,
      value: "",
    };

  if (typeOrPreset === "rosbagRecorder")
  return {
    inputType: "rosbagRecorder",
    outputType: "rosbagCommand",

    mode: "selected_topics",
    topicsText: "/cmd_vel, /odom, /scan",
    topics: ["/cmd_vel", "/odom", "/scan"],

    bagName: "rosbag_experiment",
    outputDir: "./bags",
    bagPath: "./bags/rosbag_experiment",

    isRecording: false,
    status: "idle",
    commandId: 0,

    value: null,
    expanded: true,
  };

  if (typeOrPreset === "rosbagPlayer")
  return {
    inputType: "rosbagPlayer",
    outputType: "rosbagCommand",

    bagPath: "./bags/rosbag_experiment",
    rate: "1.0",

    loopMode: "off",
    loop: false,

    isPlaying: false,
    status: "idle",
    commandId: 0,

    goal: {
      bagPath: "./bags/rosbag_experiment",
      rate: 1.0,
      loop: false,
    },

    value: null,
    expanded: true,
  };

  if (typeOrPreset === "nav2Goal")
  return {
    inputType: "nav2Goal",
    outputType: "nav2_msgs/action/NavigateToPoseGoal",

    goalName: "nav2_goal",

    frameId: "map",
    goalX: "0.0",
    goalY: "0.0",
    goalZ: "0.0",
    goalYaw: "0.0",
    yawUnit: "rad",

    behaviorTree: "",

    x: 0.0,
    y: 0.0,
    z: 0.0,
    yaw: 0.0,
    yawRad: 0.0,
    yawDeg: 0.0,

    quaternion: {
      x: 0.0,
      y: 0.0,
      z: 0.0,
      w: 1.0,
    },

    poseStamped: {
      header: {
        frame_id: "map",
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

    goal: {
      pose: {
        header: {
          frame_id: "map",
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
    },

    value: null,
    expanded: true,
  };

  if (typeOrPreset === "nav2Waypoints")
  return {
    inputType: "nav2Waypoints",
    outputType: "nav2_msgs/action/FollowWaypointsGoal",

    waypoints: {
      poses: [],
    },

    poses: [],
    count: 0,
    connectedCount: 0,

    value: {
      poses: [],
    },

    expanded: true,
  };

  if (typeOrPreset === "nav2WaypointFollower")
  return {
    inputType: "nav2WaypointFollower",
    outputType: "nav2ActionClient",
    actionType: "nav2_msgs/action/FollowWaypoints",

    actionName: "/follow_waypoints",
    serverTimeout: "10.0",

    waypoints: {
      poses: [],
    },

    goal: {
      poses: [],
    },

    sendWaypoints: false,
    cancelWaypoints: false,
    goalCommandId: 0,
    cancelCommandId: 0,

    status: "idle",
    feedback: "",
    result: "",
    currentWaypoint: "0",
    missedWaypoints: "",

    waypointCount: 0,
    waypointsConnected: false,
    sourceWaypointsNodeId: "",
    sourceWaypointsHandle: "",

    expanded: true,
    value: null,
  };

  if (typeOrPreset === "nav2NavigateToPose")
  return {
    inputType: "nav2NavigateToPose",
    outputType: "nav2ActionClient",
    actionType: "nav2_msgs/action/NavigateToPose",

    navigatorName: "nav2_navigate_to_pose",
    actionName: "/navigate_to_pose",

    // Goal recibido desde Nav2Goal
    goal: null,
    goalConnected: false,
    sourceGoalNodeId: "",
    sourceGoalHandle: "",

    // Fallback manual por si no hay Nav2Goal conectado
    fallbackGoal: {
      pose: {
        header: {
          frame_id: "map",
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
    },

    serverTimeout: "10.0",

    sendGoal: false,
    cancelGoal: false,
    goalCommandId: 0,
    cancelCommandId: 0,

    status: "idle",
    feedback: "",
    result: "",

    currentPose: "",
    distanceRemaining: "",
    estimatedTimeRemaining: "",
    navigationTime: "",
    numberOfRecoveries: "0",

    expanded: true,
    value: null,
  };

  if (typeOrPreset === "lidarVisualizer")
    return {
      topicName: "/scan",
      showGrid: true,
      maxRange: 10.0,
    };

  // -------- nuevos URDF --------
  if (typeOrPreset === "urdfLink")
    return {
      id: "",
      name: "",
      visuals: [],
      collisions: [],
      inertial: {
        mass: 1,
        inertia: { ixx: 0.01, iyy: 0.01, izz: 0.01 },
        origin: { xyz: [0, 0, 0], rpy: [0, 0, 0] },
      },
    };

  if (typeOrPreset === "urdfJoint")
    return {
      id: "",
      name: "",
      type: "fixed",
      parent: "",
      child: "",
      origin: { xyz: [0, 0, 0], rpy: [0, 0, 0] },
      axis: { xyz: [1, 0, 0] },
    };

  if (typeOrPreset === "urdfRobot")
    return { id: "", name: "my_robot", links: [], joints: [], xml: "" };

  if (typeOrPreset === "urdfPreview")
    return { id: "", xml: "" };

  if (typeOrPreset === "urdfViewer")
    return { id: "", xml: "", jointStates: {} };

  if (typeOrPreset === "urdfControl")
    return { id: "", xml: "", jointStates: {} };

  // -------- URDF V2 (modular) --------
  if (typeOrPreset === "urdfInertial")
    return {
      mass: 1.0,
      inertia: { ixx: 0.01, iyy: 0.01, izz: 0.01, ixy: 0, ixz: 0, iyz: 0 },
      origin: { xyz: [0, 0, 0], rpy: [0, 0, 0] }
    };

  if (typeOrPreset === "urdfVisual")
    return {
      geometry: { type: "box", size: [1, 1, 1] },
      origin: { xyz: [0, 0, 0], rpy: [0, 0, 0] },
      material: { name: "", color: [0.5, 0.5, 0.5, 1] }
    };

  if (typeOrPreset === "urdfCollision")
    return {
      geometry: { type: "box", size: [1, 1, 1] },
      origin: { xyz: [0, 0, 0], rpy: [0, 0, 0] }
    };

  if (typeOrPreset === "urdfLinkV2")
    return {
      name: "",
      inertial: null,
      visuals: [],
      collisions: []
    };

  if (typeOrPreset === "urdfAssembly")
    return {
      name: "",
      description: "",
      links: [],
      joints: []
    };

  if (typeOrPreset === "urdfXmlPreview")
    return { xml: "" };

  // -------- New utility blocks --------
  if (typeOrPreset === "coordinates")
    return {
      xyz: [0, 0, 0],
      rpy: [0, 0, 0]
    };

  if (typeOrPreset === "geometry")
    return {
      geometry: { type: "box", size: [1, 1, 1] }
    };

  if (typeOrPreset === "twistBuilder")
  return {
    inputType: "twistBuilder",
    outputType: "geometry_msgs/Twist",
    messagePackage: "geometry_msgs",
    messageType: "Twist",

    twist: {
      linear: {
        x: 0.0,
        y: 0.0,
        z: 0.0,
      },
      angular: {
        x: 0.0,
        y: 0.0,
        z: 0.0,
      },
    },

    value: {
      linear: {
        x: 0.0,
        y: 0.0,
        z: 0.0,
      },
      angular: {
        x: 0.0,
        y: 0.0,
        z: 0.0,
      },
    },

    linearX: 0.0,
    linearY: 0.0,
    linearZ: 0.0,
    angularX: 0.0,
    angularY: 0.0,
    angularZ: 0.0,

    manualLinearX: "0.0",
    manualLinearY: "0.0",
    manualLinearZ: "0.0",
    manualAngularX: "0.0",
    manualAngularY: "0.0",
    manualAngularZ: "0.0",

    connectedCount: 0,
    expanded: true,
  };  

  if (typeOrPreset === "arithmeticOperator")
    return {
      inputType: "arithmeticOperator",
      outputType: "number",

      operator: "-",

      a: "0.0",
      b: "0.0",
      manualA: "0.0",
      manualB: "0.0",

      value: "0.0",
      numericValue: 0.0,
      result: "0.0",

      valid: true,

      aConnected: false,
      bConnected: false,
      sourceANodeId: "",
      sourceBNodeId: "",

      expanded: true,
    };
  
  if (typeOrPreset === "saturation")
  return {
    inputType: "saturation",
    outputType: "number",

    value: "0.0",
    numericValue: 0.0,

    rawValue: "0.0",
    manualValue: "0.0",

    minValue: "-1.0",
    maxValue: "1.0",

    saturated: false,

    sourceConnected: false,
    sourceNodeId: "",
    sourceHandle: "",

    expanded: true,
  };

  if (typeOrPreset === "lowPassFilter")
  return {
    inputType: "lowPassFilter",
    outputType: "number",

    value: "0.0",
    numericValue: 0.0,
    filteredValue: "0.0",

    rawValue: "0.0",
    manualValue: "0.0",

    alpha: "0.2",
    initialized: false,

    sourceConnected: false,
    sourceNodeId: "",
    sourceHandle: "",

    expanded: true,
  };

  if (typeOrPreset === "booleanTrigger")
  return {
    inputType: "booleanTrigger",
    outputType: "bool",

    mode: "button",
    value: false,
    boolValue: false,
    numericValue: 0.0,

    commandId: 0,
    expanded: true,
  };

if (typeOrPreset === "timerRate")
  return {
    inputType: "timerRate",
    outputType: "tick",

    frequencyHz: "1.0",
    frequency: 1.0,
    periodMs: 1000.0,

    enabled: false,
    tick: false,
    tickCount: 0,
    numericValue: 0,
    value: 0,

    lastTickTime: "",
    expanded: true,
  };

  // -------- TF blocks --------
  if (typeOrPreset === "tfWorld")
    return {
      frameId: "world"
    };

  if (typeOrPreset === "tfFrame")
    return {
      frameId: "",
      position: { x: 0, y: 0, z: 0 },
      rotation: { roll: 0, pitch: 0, yaw: 0 },
      broadcastType: "static"
    };

  if (typeOrPreset === "tfChild")
    return {
      childFrameId: "",
      position: { x: 0, y: 0, z: 0 },
      rotation: { roll: 0, pitch: 0, yaw: 0 },
      broadcastType: "static"
    };

  if (typeOrPreset === "centerMass")
    return {
      geometryName: "",
      geometry: {},
      center: { x: 0, y: 0, z: 0 },
      rotation: { roll: 0, pitch: 0, yaw: 0 },
      useOffset: false,
      offset: { x: 0, y: 0, z: 0 }
    };

  if (typeOrPreset === "launchExecutable")
    return {
      package: "",
      executable: "",
      nodeName: "",
      namespace: "",
      params: [],
    };

  if (typeOrPreset === "launchFile")
    return {
      fileName: "my_launch",
      visibleInputs: 1,
    };

  if (typeOrPreset === "customNode")
    return { definition: null };

  if (typeOrPreset === "text")
    return { label: "Text", value: "", placeholder: "enter text..." };

  if (typeOrPreset === "keyboardInput")
    return {
      inputType: "keyboard",
      nodeName: "teleop_keyboard",
      linearSpeed: 0.5,
      angularSpeed: 0.5,
      keyMap: "wasd",
    };

  if (typeOrPreset === "laneDetection")
    return {
      inputType: "laneDetection",
      nodeName: "lane_detector",
      cameraTopic: "/camera/image/compressed",
      outputTopic: "/lane_detection/image",
      laneTopic: "/lane_center",
      method: "combined",
      roiTop: 45,
      cannyLow: 50,
      cannyHigh: 150,
      hsvPreset: "white+yellow",
      minLineLen: 40,
      maxLineGap: 20,
    };

  if (typeOrPreset === "pidError")
    return { setpoint: 0, measured: 0, error: 0 };

  if (typeOrPreset === "pidController")
  return {
    inputType: "pidController",
    outputType: "number",
    controllerType: "PID",

    kp: "1.0",
    ki: "0.0",
    kd: "0.0",

    error: "0.0",
    manualError: "0.0",
    dt: "0.05",

    outputMode: "clamped",
    outputMin: "-1.0",
    outputMax: "1.0",

    integralMin: "-10.0",
    integralMax: "10.0",

    value: "0.0",
    numericValue: 0.0,

    action: "0.0",
    control: "0.0",

    rawAction: "0.0",
    rawControl: "0.0",

    errorValue: "0.0",

    pTerm: "0.0",
    iTerm: "0.0",
    dTerm: "0.0",

    integral: "0.0",
    derivative: "0.0",
    previousError: "0.0",

    errorConnected: false,
    sourceErrorNodeId: "",
    sourceErrorHandle: "",

    expanded: true,
  };

  if (typeOrPreset === "numericSetpoint")
  return {
    inputType: "numericSetpoint",
    outputType: "number",

    value: "1.0",
    setpointValue: "1.0",
    numericValue: 1.0,

    unit: "none",
    mode: "constant",

    minValue: "0.0",
    maxValue: "10.0",
    step: "0.1",

    expanded: true,
  };

  if (typeOrPreset === "numericMeasurement")
  return {
    inputType: "numericMeasurement",
    outputType: "number",

    msgPackage: "std_msgs",
    msgType: "Float32",
    fieldPath: "data",

    transform: "none",
    unit: "none",

    fallbackValue: "0.0",
    manualMessage: '{"data": 0.0}',

    value: "0.0",
    measurementValue: "0.0",
    numericValue: 0.0,

    rawExtractedValue: null,

    sourceConnected: false,
    sourceNodeId: "",
    sourceHandle: "",

    expanded: true,
  };

  if (typeOrPreset === "velocityCommand")
    return { linearX: 0, angularZ: 0 };

  if (typeOrPreset === "obstacleDetector")
    return { topicName: "/scan", sector: "front", threshold: 0.5 };

  if (typeOrPreset === "constantFloat")
    return {
      inputType: "constantFloat",
      nodeName: "constant_float",
      outputTopic: "/target_speed",
      value: 0.5,
      publishFrequency: 20.0,
    };

  if (typeOrPreset === "purePursuit")
    return {
      inputType: "purePursuit",
      nodeName: "pure_pursuit",
      odomTopic: "/odom",
      pathTopic: "/planned_path",
      cmdVelTopic: "/cmd_vel",
      speed: 0.4,
      lookahead: 0.6,
      goalTolerance: 0.25,
    };

  if (typeOrPreset === "sdcsRoadmap")
    return {
      inputType: "sdcsRoadmap",
      nodeName: "sdcs_roadmap",
      nodeSequence: "10, 4, 20, 10",
      speed: 0.4,
      lookahead: 0.5,
      goalTolerance: 0.25,
    };

  if (typeOrPreset === "pidGraph")
    return { setpointTopic: "/pid/setpoint", measuredTopic: "/pid/measured" };

  if (typeOrPreset === "qcarTeleop")
    return {
      inputType: "qcarTeleop",
      nodeName: "qcar_teleop",
      throttleMax: 0.3,
      steeringMax: 0.4,
    };

  if (typeOrPreset === "display")
    return { label: "Display", digits: 3 };

  return {};
}
