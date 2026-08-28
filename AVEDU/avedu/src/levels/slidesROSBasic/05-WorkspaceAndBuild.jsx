// src/levels/rosbasic/slides/WorkspaceAndBuildSlide.jsx
import React from "react";
import SlideLayout, { SlideCard, SlideFolderTree, SlideFolderDetail, SlideGrid, SlideCodeSnippet } from "../../components/slides/SlideLayout";

export const meta = {
  id: "ros2-structure-and-colcon",
  title: "ROS 2 Workspace Structure + colcon build",
  order: 5,
  objectiveCode: "ros-slide-workspace-and-colcon",
};

const ITEMS = [
  {
    id: "ws", label: "ros2_ws/  (workspace)", kind: "dir", desc: `Your working directory. ROS 2 packages will live here inside "src/".
You can have multiple workspaces and "chain" them with overlays.` },
  {
    id: "src", label: "└─ src/", kind: "dir", desc: `Source code. Inside "src/" you place one or more ROS 2 "packages".
Each package is a unit that is compiled/installed separately.` },
  {
    id: "pkg", label: "   └─ my_package/", kind: "dir", desc: `A ROS 2 package. Must have at least "package.xml" and build files:
- Python: setup.py, setup.cfg (or pyproject.toml)
- C++: CMakeLists.txt
Plus your source code: scripts/ or src/, launch/, msg/srv/action if you define interfaces.` },
  {
    id: "pkgxml", label: "      ├─ package.xml", kind: "file", desc: `Package manifest. Declares name, version, maintainers and dependencies.
colcon and ament use it to resolve the dependency graph.` },
  {
    id: "setup", label: "      ├─ setup.py / setup.cfg (Python)", kind: "file", desc: `Metadata and installation rules for Python packages.
Allows installing scripts as entry points and copying resources during build/installation.` },
  {
    id: "cmake", label: "      ├─ CMakeLists.txt (C++)", kind: "file", desc: `CMake script for C++ packages. Declares executables, include dirs, dependencies
(and installation targets) using ament_cmake.` },
  {
    id: "code", label: "      └─ src/  /  scripts/  /  launch/", kind: "dir", desc: `Your code:
- src/: C++ sources or Python modules
- scripts/: executable Python scripts (with shebang and permissions)
- launch/: *.launch.py files to run nodes/compositions.` },
  {
    id: "build", label: "build/  (auto-generated)", kind: "dir", desc: `Intermediate build output (objects, CMake cache, etc.).
colcon recreates it; you can delete it for a "clean" build.` },
  {
    id: "install", label: "install/  (auto-generated)", kind: "dir", desc: `Installable result of the workspace. When you "source install/setup.bash"
your environment will see the executables and resources from the workspace.` },
  { id: "log", label: "log/  (auto-generated)", kind: "dir", desc: `Build/run logs. Useful for debugging colcon or test errors.` },
];

const DEFAULT_CMD =
  "colcon build --symlink-install\n\n# after building:\nsource install/setup.bash";

export default function WorkspaceAndBuildSlide({ onObjectiveHit }) {
  const [selected, setSelected] = React.useState("ws");

  const current = React.useMemo(
    () => ITEMS.find((i) => i.id === selected) || ITEMS[0],
    [selected]
  );

  const markDone = () => onObjectiveHit?.(meta.objectiveCode);

  return (
    <div className="slide">
      <h2>{meta.title}</h2>

      {/* Top section: tree + detail */}
      <SlideCard title="Basic workspace structure">
        <SlideGrid cols={2} className="slide-gap-md">
          <SlideFolderTree
            items={ITEMS}
            selectedId={selected}
            onSelect={setSelected}
          />
          <SlideFolderDetail
            label={current?.label}
            description={current?.desc}
          />
        </SlideGrid>
      </SlideCard>

      {/* Bottom section: build command */}
      <SlideGrid className="slide-gap-md slide-mt-md" cols={2}>
        <div className="slide-card">
          <div className="slide-card__title">Building with colcon</div>
          <p>
            <b>colcon</b> is the build tool for ROS 2. It iterates over your packages,
            respects dependencies, and runs cmake/setup.py for you.
          </p>
          <div className="slide-callout slide-callout--info slide-mt-sm">
            <b>Tip:</b> Always run <code>colcon build</code> from the root of your workspace (ros2_ws).
          </div>
        </div>

        <div className="slide-card">
          <SlideCodeSnippet
            code={DEFAULT_CMD}
            title="Build & Source"
            language="bash"
          />
          <div className="slide-actions slide-mt-sm">
            <button
              className="btn btn--success"
              onClick={markDone}
            >
              Mark as Learned
            </button>
          </div>
        </div>
      </SlideGrid>
    </div>
  );
}
