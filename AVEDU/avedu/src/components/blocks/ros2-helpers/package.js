// Package creation: reading wiring + emitting `ros2 pkg create`.

export function computePackageData(id, nodes, edges) {
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
  if ((pkgSrc?.type === "string" || pkgSrc?.type === "text") && pkgSrc.data?.value) {
    pkgName = String(pkgSrc.data.value);
  }

  const nodeSrc = srcFor("nodeName");
  if ((nodeSrc?.type === "string" || nodeSrc?.type === "text") && nodeSrc.data?.value) {
    nodeName = String(nodeSrc.data.value);
  }

  const depsSrc = srcFor("deps");
  if (depsSrc?.type === "listDeps" && Array.isArray(depsSrc.data?.items)) {
    deps = depsSrc.data.items;
  }

  return { pkgName, nodeName, deps, lang, buildType };
}

export function buildCreatePkgCmd(pkgData) {
  if (!pkgData) return "";

  const { pkgName, nodeName, lang, buildType, deps } = pkgData;
  const bt = buildType || (lang === "cpp" ? "ament_cmake" : "ament_python");
  const depsList = (deps || []).filter(Boolean).join(" ");
  const depsPart = depsList ? ` --dependencies ${depsList}` : "";
  const nodePart = nodeName ? ` --node-name ${nodeName}` : "";
  const pkgPart = pkgName || "my_ros2_package";

  return `mkdir -p src && cd src && ros2 pkg create --build-type ${bt}${nodePart} ${pkgPart}${depsPart}`;
}
