import React, { useState, useEffect } from "react";
import { Position, useStore } from "@xyflow/react";
import {
  NodeCard,
  LabeledSelect,
  CollapsibleField,
  ChipList,
  HandleWithLabel,
} from "./components";

const DEFAULT_DEPS = {
  python: ["rclpy", "std_msgs"],
  cpp:    ["rclcpp", "std_msgs"],
};

const LANG_OPTIONS = [
  { value: "python", label: "Python" },
  { value: "cpp",    label: "C++" },
];

const BUILD_TYPE_OPTIONS = [
  { value: "ament_python", label: "ament_python" },
  { value: "ament_cmake",  label: "ament_cmake"  },
];

export default function CreatePackageNode({ id, data }) {
  const edges = useStore((state) => state.edges);
  const nodes = useStore((state) => state.nodes);

  const connectedHandles = edges
    .filter((e) => e.target === id)
    .map((e) => e.targetHandle);

  const isPkgNameConnected  = connectedHandles.includes("pkgName");
  const isNodeNameConnected = connectedHandles.includes("nodeName");
  const isDepsConnected     = connectedHandles.includes("deps");

  const [pkgName, setPkgName] = useState(data.pkgName ?? "my_ros2_package");
  const [nodeName, setNodeName] = useState(data.nodeName ?? "my_node");
  const [lang, setLang] = useState(data.lang ?? "python");
  const [buildType, setBuildType] = useState(
    data.buildType ?? (lang === "cpp" ? "ament_cmake" : "ament_python")
  );
  const [depInput, setDepInput] = useState("");
  const [deps, setDeps] = useState(
    Array.isArray(data.deps) && data.deps.length ? data.deps : DEFAULT_DEPS[lang]
  );

  const notify = (next) => data.onChange?.(id, { ...next });

  // Pull values from connected source nodes into local state.
  useEffect(() => {
    const srcFor = (handleId) => {
      const edge = edges.find((e) => e.target === id && e.targetHandle === handleId);
      if (!edge) return null;
      return nodes.find((n) => n.id === edge.source);
    };

    let updated = false;
    const newData = {};

    if (isPkgNameConnected) {
      const pkgSrc = srcFor("pkgName");
      if (pkgSrc?.data?.value && pkgSrc.data.value !== pkgName) {
        setPkgName(pkgSrc.data.value);
        newData.pkgName = pkgSrc.data.value;
        updated = true;
      }
    }

    if (isNodeNameConnected) {
      const nodeSrc = srcFor("nodeName");
      if (nodeSrc?.data?.value && nodeSrc.data.value !== nodeName) {
        setNodeName(nodeSrc.data.value);
        newData.nodeName = nodeSrc.data.value;
        updated = true;
      }
    }

    if (isDepsConnected) {
      const depsSrc = srcFor("deps");
      const srcDeps = Array.isArray(depsSrc?.data?.deps) ? depsSrc.data.deps :
                     Array.isArray(depsSrc?.data?.items) ? depsSrc.data.items : null;
      if (srcDeps && JSON.stringify(srcDeps) !== JSON.stringify(deps)) {
        setDeps(srcDeps);
        newData.deps = srcDeps;
        updated = true;
      }
    }

    if (updated) {
      notify({ pkgName, nodeName, lang, buildType, deps, ...newData });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [edges, nodes, isPkgNameConnected, isNodeNameConnected, isDepsConnected]);

  const onLangChange = (value) => {
    setLang(value);
    const defaultBT = value === "cpp" ? "ament_cmake" : "ament_python";
    setBuildType((prev) =>
      prev === "ament_cmake" || prev === "ament_python" ? defaultBT : prev
    );
    setDeps((prev) => (prev && prev.length ? prev : DEFAULT_DEPS[value]));
    notify({
      pkgName, nodeName,
      lang: value,
      buildType: defaultBT,
      deps: deps && deps.length ? deps : DEFAULT_DEPS[value],
    });
  };

  const onBuildTypeChange = (v) => {
    setBuildType(v);
    notify({ pkgName, nodeName, lang, buildType: v, deps });
  };
  const onPkgChange = (v) => {
    setPkgName(v);
    notify({ pkgName: v, nodeName, lang, buildType, deps });
  };
  const onNodeChange = (v) => {
    setNodeName(v);
    notify({ pkgName, nodeName: v, lang, buildType, deps });
  };

  const addDep = () => {
    const parts = depInput
      .split(/[,\s]+/)
      .map((s) => s.trim())
      .filter(Boolean);
    if (!parts.length) return;
    const next = Array.from(new Set([...(deps || []), ...parts]));
    setDeps(next);
    setDepInput("");
    notify({ pkgName, nodeName, lang, buildType, deps: next });
  };
  const removeDep = (d) => {
    const next = (deps || []).filter((x) => x !== d);
    setDeps(next);
    notify({ pkgName, nodeName, lang, buildType, deps: next });
  };

  return (
    <NodeCard
      title="Create Package"
      size="md"
      handles={
        <>
          <HandleWithLabel type="target" position={Position.Left}  id="pkgName"  label="pkgName"  top="18%" />
          <HandleWithLabel type="target" position={Position.Left}  id="nodeName" label="nodeName" top="35%" />
          <HandleWithLabel type="target" position={Position.Left}  id="deps"     label="deps"     top="70%" />
          <HandleWithLabel type="source" position={Position.Right} id="out"      label="output"   top="50%" />
        </>
      }
    >
      <CollapsibleField label="Package name" collapsed={isPkgNameConnected}>
        <input
          className="rf-input"
          value={pkgName}
          onChange={(e) => onPkgChange(e.target.value)}
          placeholder="my_ros2_package"
        />
      </CollapsibleField>

      <CollapsibleField label="Node name" collapsed={isNodeNameConnected}>
        <input
          className="rf-input"
          value={nodeName}
          onChange={(e) => onNodeChange(e.target.value)}
          placeholder="my_node"
        />
      </CollapsibleField>

      <div className="rf-grid-2">
        <LabeledSelect
          label="Language"
          value={lang}
          onChange={onLangChange}
          options={LANG_OPTIONS}
        />
        <LabeledSelect
          label="Build type"
          value={buildType}
          onChange={onBuildTypeChange}
          options={BUILD_TYPE_OPTIONS}
        />
      </div>

      <CollapsibleField label="Dependencies" collapsed={isDepsConnected}>
        <div className="rf-row">
          <input
            className="rf-input"
            value={depInput}
            onChange={(e) => setDepInput(e.target.value)}
            placeholder="rclpy, std_msgs"
          />
          <button className="btn" onClick={addDep}>agregar</button>
        </div>
        <ChipList items={deps || []} emptyLabel="Sin deps" onRemove={removeDep} />
      </CollapsibleField>
    </NodeCard>
  );
}
