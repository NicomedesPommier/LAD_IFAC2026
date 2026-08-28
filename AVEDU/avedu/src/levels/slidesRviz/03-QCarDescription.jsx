// src/levels/slidesRviz/03-QCarDescription.jsx
import React from "react";

export const meta = {
  id: "qcar-description",
  title: "Paquete qcar_description: URDF, meshes y launch",
  order: 3,
  objectiveCode: "ros-slide-qcar-description",
};

const ITEMS = [
  { id: "pkgroot", label: "qcar_description/ (paquete)", kind: "dir", desc: `Contiene el URDF/Xacro, mallas y recursos de visualización del QCar.` },
  { id: "packagexml", label: "├─ package.xml", kind: "file", desc: `Manifiesto: nombre, versión, mantenedor y dependencias: ament_cmake (o ament_python), xacro, urdf, robot_state_publisher, joint_state_publisher_gui, rviz2.` },
  { id: "cmake", label: "├─ CMakeLists.txt", kind: "file", desc: `Instala directorios a share/Qcar. Ej.: install(DIRECTORY urdf meshes rviz materials launch config DESTINATION share/\${PROJECT_NAME}).` },
  { id: "urdf", label: "├─ urdf/", kind: "dir", desc: `Descripción del robot: qcar.urdf.xacro (principal) y sub-módulos en /parts (chasis, ruedas, sensores).` },
  { id: "parts", label: "│  └─ parts/", kind: "dir", desc: `Módulos Xacro reutilizables: base.xacro, wheel.xacro, sensor_realsense.xacro, mast.xacro, materials.xacro.` },
  { id: "meshes", label: "├─ meshes/", kind: "dir", desc: `Mallas 3D (STL/DAE). Se separan por subcarpetas: base/, wheels/, sensors/. Usar unidades en metros y orientación Z+ arriba.` },
  { id: "materials", label: "├─ materials/", kind: "dir", desc: `Texturas y paletas de color. Para DAE/OBJ puedes referenciar imágenes (PNG).` },
  { id: "config", label: "├─ config/", kind: "dir", desc: `YAML: joint_limits.yaml, qcar_ros2_control.yaml (si aplica), colores y parámetros de visualización.` },
  { id: "rviz", label: "├─ rviz/", kind: "dir", desc: `Escenas RViz preconfiguradas: qcar_display.rviz con RobotModel, TF, Grid y vistas de cámara.` },
  { id: "launch", label: "├─ launch/", kind: "dir", desc: `display.launch.py para xacro→URDF + robot_state_publisher + (opcional) joint_state_publisher_gui + RViz.` },
  { id: "license", label: "└─ LICENSE / README.md", kind: "file", desc: `Notas y licencias de mallas.` },
];

// 👇 String.raw para evitar que JS intente interpolar ${PROJECT_NAME}
const DEFAULT_CMAKE = String.raw`cmake_minimum_required(VERSION 3.8)
project(qcar_description)
find_package(ament_cmake REQUIRED)

install(DIRECTORY urdf meshes rviz materials launch config
  DESTINATION share/qcar)

ament_package()`;

const DEFAULT_LAUNCH = String.raw`from launch import LaunchDescription
from launch_ros.actions import Node
from launch.actions import DeclareLaunchArgument
from launch.substitutions import Command, LaunchConfiguration, PathJoinSubstitution
from ament_index_python.packages import get_package_share_directory

def generate_launch_description():
    use_gui = LaunchConfiguration('use_gui', default='true')
    model_path = PathJoinSubstitution([
        get_package_share_directory('qcar_description'),
        'urdf', 'qcar.urdf.xacro'
    ])

    return LaunchDescription([
        DeclareLaunchArgument('use_gui', default_value='true'),
        Node(
            package='robot_state_publisher',
            executable='robot_state_publisher',
            parameters=[{'robot_description': Command(['xacro ', model_path])}]
        ),
        Node(
            package=('joint_state_publisher_gui' if use_gui == 'true' else 'joint_state_publisher'),
            executable=('joint_state_publisher' if use_gui == 'false' else 'joint_state_publisher_gui')
        ),
        Node(
            package='rviz2',
            executable='rviz2',
            arguments=['-d', PathJoinSubstitution([
                get_package_share_directory('qcar_description'),
                'rviz', 'qcar_display.rviz'
            ])]
        )
    ])`;

const DEFAULT_XACRO = String.raw`<robot name="qcar" xmlns:xacro="http://www.ros.org/wiki/xacro">
  <xacro:include filename="$(find qcar_description)/urdf/parts/materials.xacro"/>

  <link name="base_link">
    <visual>
      <origin xyz="0 0 0" rpy="0 0 0"/>
      <geometry>
        <mesh filename="package://qcar_description/meshes/base/base.dae" scale="1 1 1"/>
      </geometry>
      <material name="qcar_black"/>
    </visual>
    <collision>
      <origin xyz="0 0 0" rpy="0 0 0"/>
      <geometry><box size="0.30 0.20 0.10"/></geometry>
    </collision>
    <inertial>
      <origin xyz="0 0 0"/>
      <mass value="8.0"/>
      <inertia ixx="0.05" ixy="0" ixz="0" iyy="0.06" iyz="0" izz="0.07"/>
    </inertial>
  </link>

  <!-- Rueda delantera derecha -->
  <link name="wheel_fr"/>
  <joint name="wheel_fr_joint" type="continuous">
    <parent link="base_link"/><child link="wheel_fr"/>
    <origin xyz="0.15 -0.11 -0.04" rpy="0 0 0"/>
    <axis xyz="0 1 0"/>
  </joint>

  <!-- (repite para las 4 ruedas, sensores, etc.) -->
</robot>`;

function SectionCard({ title, children, right }) {
  return (
    <div className={`slide-card ${right ? "slide-card--right" : ""}`}>
      <div className="slide-card__title">{title}</div>
      {children}
    </div>
  );
}

export default function QCarDescription({ onObjectiveHit }) {
  const [selected, setSelected] = React.useState("pkgroot");
  const current = React.useMemo(
    () => ITEMS.find((i) => i.id === selected) || ITEMS[0],
    [selected]
  );

  const markDone = () => onObjectiveHit?.(meta.objectiveCode);

  return (
    <div className="slide-wrap" key={meta.id}>
      <h2>{meta.title}</h2>

      {/* Layout superior: árbol + detalle */}
      <SectionCard title="Estructura del paquete qcar_description">
        <div className="slide-grid slide-grid--2 slide-gap-md">
          {/* Árbol clicable */}
          <div className="tree">
            <pre className="tree__pre">
              {ITEMS.map((it) => (
                <div
                  key={it.id}
                  role="button"
                  onClick={() => setSelected(it.id)}
                  title="Click para ver detalle"
                  className={`tree__item ${selected === it.id ? "is-selected" : ""}`}
                >
                  <code>{it.label}</code>
                </div>
              ))}
            </pre>
          </div>

          {/* Panel de detalle */}
          <div className="detail">
            <div className="detail__label">{current.label}</div>
            <div className="detail__desc">{current.desc}</div>
          </div>
        </div>
      </SectionCard>

      {/* Archivos clave (dos tarjetas) */}
      <SectionCard title="Archivos clave">
        <div className="slide-grid slide-grid--2 slide-gap-md">
          <div className="slide-card slide-card--nested">
            <div className="slide-card__title">CMakeLists.txt (mínimo)</div>
            <pre className="slide-code slide-code--sm">{DEFAULT_CMAKE}</pre>
          </div>
          <div className="slide-card slide-card--nested">
            <div className="slide-card__title">launch/display.launch.py</div>
            <pre className="slide-code slide-code--sm">{DEFAULT_LAUNCH}</pre>
          </div>
        </div>
      </SectionCard>

      {/* URDF base */}
      <SectionCard title="URDF/Xacro base">
        <pre className="slide-code slide-code--sm">{DEFAULT_XACRO}</pre>
        <div className="slide-callout slide-callout--info slide-mt-sm">
          Usa <b>package://qcar_description/…</b> para rutas a mallas y mantén <i>collision</i> simple para buen rendimiento.
        </div>
      </SectionCard>

      {/* Comandos útiles */}
      <SectionCard title="Comandos útiles" right>
        <div className="slide-grid slide-grid--2 slide-gap-md">
          <ul className="slide-list">
            <li><b>Compilar solo este paquete</b> con <code>--packages-select</code>.</li>
            <li>Tras compilar, <b>source</b> del overlay para exponer recursos.</li>
            <li>Usa una <b>config RViz</b> incluida para levantar la vista por defecto.</li>
          </ul>
          <div className="slide-card slide-card--nested">
            <div className="slide-card__title">Build + Launch</div>
            <pre className="slide-code slide-code--sm">{String.raw`colcon build --symlink-install --packages-select qcar_description
source install/setup.bash

# Ver en RViz
ros2 launch qcar_description display.launch.py use_gui:=true`}</pre>
            <div className="slide-flex slide-mt-sm slide-gap-sm">
              <button
                className="btn btn--sm"
                onClick={() =>
                  navigator.clipboard?.writeText(
                    `colcon build --symlink-install --packages-select qcar_description\nsource install/setup.bash\n\nros2 launch qcar_description display.launch.py use_gui:=true`
                  ).catch(() => { })
                }
              >
                Copiar
              </button>
              <button className="btn btn--sm btn--primary" onClick={markDone}>Marcar logrado</button>
            </div>
          </div>
        </div>
      </SectionCard>
    </div>
  );
}

