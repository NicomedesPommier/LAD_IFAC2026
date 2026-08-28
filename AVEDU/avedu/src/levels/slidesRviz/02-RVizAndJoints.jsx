// =============================================
// File: src/levels/slidesRviz/02.jsx
// =============================================
import React from "react";
import { SlideCodeSnippet } from "../../components/slides/SlideLayout";

export const meta = {
  id: "rviz-and-joints",
  title: "RViz2, TF y tipos de joints",
  order: 2,
  objectiveCode: "ros-slide-rviz-and-joints",
};

const JOINTS = [
  { id: "fixed", name: "fixed", note: "Sin movimiento; útil para sensores rígidos al chasis." },
  { id: "revolute", name: "revolute", note: "Gira en un eje con límites (ej.: servo)." },
  { id: "continuous", name: "continuous", note: "Rotación ilimitada (ruedas)." },
  { id: "prismatic", name: "prismatic", note: "Traslación lineal con límites (actuadores lineales)." },
  { id: "planar", name: "planar", note: "Movimiento X/Y en un plano; poco común." },
];

function JointRow({ j, active, onClick }) {
  return (
    <div className={`tree__item ${active ? "is-selected" : ""}`} role="button" onClick={onClick}>
      <code>{j.name}</code>
      <div className="slide-text-muted slide-text-xs">{j.note}</div>
    </div>
  );
}

export default function RVizAndJoints({ onObjectiveHit, goPrev, goNext, isFirst, isLast }) {
  const [sel, setSel] = React.useState("continuous");
  const snippet = React.useMemo(() => {
    if (sel === "continuous") {
      return `<joint name="wheel_joint" type="continuous">
  <parent link="base"/>
  <child link="wheel"/>
  <origin xyz="0.25 0.18 0" rpy="0 0 0"/>
  <axis xyz="0 1 0"/>
</joint>`;
    }
    if (sel === "revolute") {
      return `<joint name="servo_joint" type="revolute">
  <parent link="base"/>
  <child link="servo_link"/>
  <origin xyz="0 0 0" rpy="0 0 0"/>
  <axis xyz="0 0 1"/>
  <limit lower="-1.57" upper="1.57" effort="2.0" velocity="3.0"/>
</joint>`;
    }
    if (sel === "prismatic") {
      return `<joint name="linear_joint" type="prismatic">
  <parent link="base"/>
  <child link="slider"/>
  <origin xyz="0 0 0" rpy="0 0 0"/>
  <axis xyz="1 0 0"/>
  <limit lower="0.0" upper="0.10" effort="50" velocity="0.1"/>
</joint>`;
    }
    if (sel === "fixed") {
      return `<joint name="camera_mount" type="fixed">
  <parent link="base"/>
  <child link="camera"/>
</joint>`;
    }
    return `<joint name="planar_joint" type="planar">
  <parent link="base"/>
  <child link="planar_link"/>
</joint>`;
  }, [sel]);

  return (
    <div className="slide-wrap" key={meta.id}>
      <h2>{meta.title}</h2>
      <div className="slide-card">
        <div className="slide-card__title">RViz2 & TF</div>
        <ul className="slide-list">
          <li><b>RViz2</b> renderiza tu URDF y temas (tf, láser, cámaras). Úsalo para verificar geometría, colores y marcos.</li>
          <li><b>TF</b> publica una jerarquía de frames a partir de joints. Un joint crea un frame del <code>child</code> respecto al <code>parent</code>.</li>
          <li>Activa <i>TF</i>, <i>RobotModel</i> y <i>TF Tree</i> en RViz para depurar transformaciones.</li>
        </ul>
      </div>

      <div className="slide-card">
        <div className="slide-card__title">Tipos de joints</div>
        <div className="slide-grid slide-grid--2 slide-gap-md">
          <div className="tree">
            <pre className="tree__pre">
              {JOINTS.map(j => (
                <div key={j.id} onClick={() => setSel(j.id)} title="Ver snippet">
                  <JointRow j={j} active={sel === j.id} />
                </div>
              ))}
            </pre>
          </div>
          <div className="detail">
            <div className="detail__label">Snippet URDF</div>
            <pre className="slide-code slide-code--sm">{snippet}</pre>
          </div>
        </div>
        <div className="slide-flex slide-gap-sm slide-justify-between slide-mt-md">
          <button className="btn" onClick={goPrev} disabled={isFirst}>⟨ Anterior</button>
          <div className="slide-flex slide-gap-sm">
            <button className="btn btn--primary" onClick={() => onObjectiveHit?.(meta.objectiveCode)}>Marcar logrado</button>
            <button className="btn" onClick={goNext} disabled={isLast}>Siguiente ⟩</button>
          </div>
        </div>
      </div>
    </div>
  );
}


