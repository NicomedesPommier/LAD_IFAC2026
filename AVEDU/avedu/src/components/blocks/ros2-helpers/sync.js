// Orchestrator: walk toCode nodes, pick a code generator based on the
// connected source node type, and patch the preview into the toCode node.

import { computePackageData, buildCreatePkgCmd } from "./package";
import { generatePublisherCode, generateSubscriberCode } from "./pubsub";
import { buildRosRunCmd, generateLaunchFileCode } from "./launch";
import { generateLaneDetectionCode, generateObstacleDetectorCode } from "./perception";
import {
  generatePIDErrorCode,
  generatePIDControllerCode,
  generateVelocityCommandCode,
} from "./control";
import { generateConstantFloatCode } from "./constant_float";
import { generatePurePursuitCode } from "./pure_pursuit";
import { generateSdcsRoadmapCode } from "./sdcs_roadmap";
import { generateQCarTeleopCode } from "./qcar";

// Source-node type → preview generator. Each generator gets the source node
// (and full graph context where it needs sibling nodes).
const GENERATORS = [
  {
    type: "createPackage",
    build: (src, _toCode, ctx) => {
      const pkgData = computePackageData(src.id, ctx.nodes, ctx.edges);
      return pkgData ? buildCreatePkgCmd(pkgData) : "";
    },
  },
  {
    type: "rosPublisher",
    build: (src, _toCode, ctx) => {
      // A keyboardInput (or similar) wired into the publisher's "data" handle
      // promotes the generated code to event-driven teleop.
      const inputEdge = ctx.edges.find(
        (e) => e.target === src.id && e.targetHandle === "data"
      );
      const inputNode = inputEdge
        ? ctx.nodes.find((n) => n.id === inputEdge.source)
        : null;
      return generatePublisherCode(src.data, inputNode);
    },
  },
  { type: "rosSubscriber",     build: (src) => generateSubscriberCode(src.data) },
  { type: "rosRun",            build: (src) => buildRosRunCmd(src.data) },
  {
    type: "launchFile",
    build: (src, _toCode, ctx) => {
      const execNodes = ctx.edges
        .filter((e) => e.target === src.id)
        .map((e) => ctx.nodes.find((n) => n.id === e.source))
        .filter((n) => n && n.type === "launchExecutable");
      return generateLaunchFileCode(src.data, execNodes);
    },
  },
  { type: "laneDetection",     build: (src) => generateLaneDetectionCode(src.data) },
  { type: "pidError",          build: (src) => generatePIDErrorCode(src.data) },
  { type: "pidController",     build: (src) => generatePIDControllerCode(src.data) },
  { type: "velocityCommand",   build: (src) => generateVelocityCommandCode(src.data) },
  { type: "obstacleDetector",  build: (src) => generateObstacleDetectorCode(src.data) },
  { type: "constantFloat",     build: (src) => generateConstantFloatCode(src.data) },
  { type: "purePursuit",       build: (src) => generatePurePursuitCode(src.data) },
  { type: "sdcsRoadmap",       build: (src) => generateSdcsRoadmapCode(src.data) },
  { type: "qcarTeleop",        build: (src) => generateQCarTeleopCode(src.data) },
  {
    type: "customNode",
    build: (src) => src.data?.definition?.code || "",
  },
];

function buildPreview(toCodeNode, ctx) {
  const incomingEdges = ctx.edges.filter((e) => e.target === toCodeNode.id);
  const sources = incomingEdges
    .map((e) => ctx.nodes.find((n) => n.id === e.source))
    .filter(Boolean);

  // Multiple wires can hit a toCode node; later generators in GENERATORS used
  // to win (the original was a chain of if-statements that overwrote
  // `newPreview`). Preserve that order-of-last-write semantic.
  let preview = "";
  for (const gen of GENERATORS) {
    const src = sources.find((n) => n.type === gen.type);
    if (!src) continue;
    preview = gen.build(src, toCodeNode, ctx);
  }
  return { preview, inCount: incomingEdges.length };
}

export function syncRos2Commands(nodes, edges, setNodes) {
  const toCodeNodes = nodes.filter((n) => n.type === "toCode");
  if (toCodeNodes.length === 0) return;

  const ctx = { nodes, edges };
  const updates = [];

  for (const toCodeNode of toCodeNodes) {
    const { preview, inCount } = buildPreview(toCodeNode, ctx);

    const currentPreview = toCodeNode.data?.preview || "";
    const currentInCount = Number(toCodeNode.data?.inCount || 0);

    if (currentPreview !== preview || currentInCount !== inCount) {
      updates.push({ id: toCodeNode.id, preview, inCount });
    }
  }

  if (updates.length === 0) return;

  setNodes((nds) =>
    nds.map((n) => {
      const update = updates.find((u) => u.id === n.id);
      if (!update) return n;
      return {
        ...n,
        data: {
          ...n.data,
          preview: update.preview,
          inCount: update.inCount,
        },
      };
    })
  );
}
