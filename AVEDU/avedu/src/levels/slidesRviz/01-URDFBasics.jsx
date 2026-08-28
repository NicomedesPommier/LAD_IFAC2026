// =============================================
// File: src/levels/slidesRviz/01-URDFBasic.jsx
// =============================================
import React from "react";
import { SlideCodeSnippet } from "../../components/slides/SlideLayout";

export const meta = {
  id: "urdf-basics",
  title: "¿Qué es URDF? + piezas clave",
  order: 1,
  objectiveCode: "ros-slide-urdf-basics",
};

const HINTS = [
  { id: "links", label: "links (cuerpos rígidos)", desc: "Cada link describe geometría (visual y collision), inercia (masa, Ixx, Iyy, Izz) y material." },
  { id: "joints", label: "joints (uniones)", desc: "Conectan dos links padre→hijo. Tipos: fixed, revolute, continuous, prismatic, planar. Definen eje y límites." },
  { id: "tree", label: "árbol kinemático", desc: "URDF representa un árbol (no grafos con ciclos). Un link raíz y relaciones padre-hijo." },
  { id: "inertial", label: "inertial", desc: "Propiedades dinámicas: masa, centro de masa y matriz de inercia. Importante para simulación y control." },
  { id: "visualCollision", label: "visual vs collision", desc: "visual: mallas (STL/DAE/OBJ) o primitivas para RViz; collision: mallas/primitivas simplificadas para colisiones." },
  { id: "xacro", label: "Xacro", desc: "Plantillas XML para componer URDF (macros, propiedades y archivos incluidos). Se expande a URDF final." },
  { id: "materials", label: "materials", desc: "Colores y texturas: <material> con rgba, y texturas si usas DAE/OBJ. RViz las renderiza." },
  { id: "ros2control", label: "ros2_control", desc: "Extensiones (YAML) para hardware interfaces, transmisiones y límites; no es URDF puro, pero se referencia." }
];

function Pill({ active, children, onClick }) {
  return (
    <button
      className={`btn btn--sm ${active ? "btn--neon" : "btn--glass"}`}
      style={{ borderRadius: 999 }}
      onClick={onClick}
    >
      {children}
    </button>
  );
}

const URDF_SNIPPET = `<robot name="mi_robot">
  <link name="base"/>
  <link name="rueda_d"/>
  <joint name="base_rueda_d" type="continuous">
    <parent link="base"/>
    <child link="rueda_d"/>
    <origin xyz="0.2 -0.15 0.0" rpy="0 0 0"/>
    <axis xyz="0 1 0"/>
  </joint>
</robot>`;

export default function URDFBasics({ onObjectiveHit, goNext }) {
  const [sel, setSel] = React.useState("links");
  const current = React.useMemo(() => HINTS.find(h => h.id === sel) || HINTS[0], [sel]);

  return (
    <div className="slide-wrap" key={meta.id}>
      <h2>{meta.title}</h2>
      <p className="slide-text-muted">URDF (<i>Unified Robot Description Format</i>) es un formato XML para describir la estructura física de un robot: sus partes (<code>links</code>) y cómo se conectan (<code>joints</code>). Esta descripción se usa en RViz para visualizar, en TF para marcos de referencia, y en simuladores/control.</p>

      <div className="slide-flex slide-flex--col slide-gap-md slide-mt-md">
        <div className="slide-flex slide-gap-sm slide-wrap-flex">
          {HINTS.map(h => (
            <Pill key={h.id} active={h.id === sel} onClick={() => setSel(h.id)}>{h.label}</Pill>
          ))}
        </div>
        <div className="slide-card">
          <div className="slide-card__title">{current.label}</div>
          <div>{current.desc}</div>
        </div>

        <div className="slide-card">
          <div className="slide-card__title">Estructura mínima (URDF/Xacro)</div>
          <SlideCodeSnippet code={URDF_SNIPPET} language="xml" />
          <div className="slide-flex slide-gap-sm slide-justify-end slide-mt-sm">
            <button className="btn btn--primary" onClick={() => onObjectiveHit?.(meta.objectiveCode)}>Marcar logrado</button>
            <button className="btn" onClick={goNext}>Siguiente ⟩</button>
          </div>
        </div>
      </div>
    </div>
  );
}


