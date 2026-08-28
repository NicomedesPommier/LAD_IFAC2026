// =============================================================
// FILE: src/config/betaMissions.js
// Beta-test mission catalog. Each mission = an explanation card + a driver.js
// walkthrough (by tutorialType, see config/ideTutorials.js) + a points reward.
//
// The beta is intentionally separate from the learning curriculum: it does NOT
// write to the Objective/ObjectiveProgress tables. Progress lives in
// localStorage (see hooks/useBetaProgress.js) and is mirrored to analytics
// events for server-side timing/funnel metrics.
// =============================================================
import fileApi from "../services/fileApi";

// Flatten a file tree (array of {path, type, children}) into a flat path list.
function flattenTree(nodes, out = []) {
  if (!Array.isArray(nodes)) return out;
  for (const n of nodes) {
    if (n?.path) out.push(n);
    if (n?.children) flattenTree(n.children, out);
  }
  return out;
}

// Best-effort: does the workspace contain a file whose name matches?
async function fileExists(canvasId, predicate) {
  if (!canvasId) return false;
  try {
    const tree = await fileApi.getFileTree(canvasId, false);
    return flattenTree(tree).some(
      (n) => n.type === "file" && predicate((n.name || n.path || "").toLowerCase(), n)
    );
  } catch {
    return false;
  }
}

export const BETA_MISSIONS = [
  {
    id: "workspace",
    n: 1,
    title: "Create your workspace",
    blurb: "Every ROS project lives in a workspace. Make yours.",
    icon: "🗂️",
    points: 50,
    route: "/research",
    tutorialType: "betaCreateWorkspace",
    available: true,
    explanation: {
      heading: "What is a workspace?",
      body: [
        "A workspace (we call it a canvas) is your own sandbox folder inside the robot's computer.",
        "Your packages, code, robots and maps all live here — isolated from everyone else's.",
        "You'll create one now, then build everything else inside it.",
      ],
    },
    verify: async () => {
      try {
        return (await fileApi.listCanvases()).length > 0;
      } catch {
        return false;
      }
    },
  },
  {
    id: "package",
    n: 2,
    title: "Create a package & build it",
    blurb: "Generate a ROS 2 package from a block, then colcon build + source.",
    icon: "📦",
    points: 100,
    route: "/research",
    tutorialType: "betaCreatePackage",
    available: true,
    explanation: {
      heading: "Package · colcon build · source",
      body: [
        "PACKAGE — a folder ROS understands. It groups your nodes, dependencies and build rules.",
        "COLCON BUILD — the command that compiles every package in your workspace so ROS can run them.",
        "SOURCE — `source install/setup.bash` tells your terminal where the freshly-built packages are. Skip it and ROS can't find your node.",
        "You'll build the `Create Package` block, run it, then build & source in the terminal.",
      ],
    },
    verify: async (ctx) => {
      try {
        const { packages = [] } = await fileApi.listRosPackages(ctx.canvasId);
        return packages.length > 0;
      } catch {
        return false;
      }
    },
  },
  {
    id: "pubsub",
    n: 3,
    title: "Publisher & Subscriber",
    blurb: "Build two nodes on a .canvas, turn them into .py, register & run them.",
    icon: "📡",
    points: 150,
    route: "/research",
    tutorialType: "betaPubSub",
    available: true,
    explanation: {
      heading: "Topics, and the RosFlow workflow",
      body: [
        "Nodes talk over TOPICS: a publisher sends messages, a subscriber receives them.",
        "THE ROSFLOW WORKFLOW: you build blocks on a .canvas file → the Convert2Code block turns them into a .py file → you register that .py in setup.py → colcon build → run.",
        "You'll make a publisher and a subscriber and watch them talk.",
      ],
    },
    verify: (ctx) =>
      fileExists(ctx.canvasId, (name) => name.endsWith(".py") && /publish|talker/.test(name)),
  },
  {
    id: "urdf",
    n: 4,
    title: "Build your own car",
    blurb: "Describe a car with URDF blocks — chassis + a spinning wheel — and see it in 3D.",
    icon: "🚗",
    points: 150,
    route: "/research",
    tutorialType: "betaUrdfRobot",
    available: true,
    explanation: {
      heading: "What is URDF?",
      body: [
        "URDF is how every robot — including a self-driving car — describes its body: LINKS (rigid parts like the chassis and wheels) joined by JOINTS (e.g. a wheel that spins).",
        "You'll assemble a little car from blocks, render it live in 3D, and spin a wheel with an interactive controller.",
      ],
    },
    verify: (ctx) =>
      fileExists(ctx.canvasId, (name) => name.endsWith(".urdf") || name.endsWith(".xacro")),
  },
  {
    id: "map",
    n: 5,
    title: "Create a custom map",
    blurb: "Draw a world for the QCar and drive it in the simulator.",
    icon: "🗺️",
    points: 150,
    route: "/research",
    startView: "simulation",
    tutorialType: "betaCustomMap",
    available: true,
    explanation: {
      heading: "Maps & the simulator",
      body: [
        "The map is the floor and obstacles your virtual QCar lives in.",
        "The simulator runs real physics and listens to /cmd_vel — the same topic your code will drive.",
      ],
    },
    verify: async () => true,
  },
  {
    id: "selfdriving",
    n: 6,
    title: "Self-driving demo",
    blurb: "Wire perception → control → motion, launch it, watch it drive.",
    icon: "🏎️",
    points: 300,
    route: "/research",
    tutorialType: "betaSelfDriving",
    available: true,
    explanation: {
      heading: "The autonomy pipeline",
      body: [
        "SENSE (lidar / camera) → DECIDE (PID controller) → ACT (publish /cmd_vel).",
        "You'll wire these blocks together, generate one launch file that starts the whole stack, and watch the QCar drive itself.",
      ],
    },
    verify: (ctx) => fileExists(ctx.canvasId, (name) => name.endsWith(".launch.py")),
  },
];

export const BETA_TOTAL_POINTS = BETA_MISSIONS.reduce((s, m) => s + m.points, 0);

export function getMission(id) {
  return BETA_MISSIONS.find((m) => m.id === id) || null;
}
