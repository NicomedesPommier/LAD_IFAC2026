// src/levels/rosbasic/slides/WhatIsRos.jsx
export const meta = {
  id: "presentacion",
  title: "Presentación",
  order: 1,
  objectiveCode: "ros-slide-intro",
};
export default function WhatIsRos() {
  return (
    <div className="slide">
      <h2>What is ROS?</h2>

      <div className="slide-card">
        <div className="slide-card__title">Definición</div>
        <p>
          ROS (Robot Operating System) es un framework que facilita la
          comunicación entre distintos componentes de un robot.
        </p>
      </div>

      <div className="slide-card slide-card--aside">
        <div>
          <div className="slide-card__title">Conceptos clave</div>
          <ul>
            <li>Nodos, Topics, Servicios, Acciones</li>
            <li>Mensajes y serialización</li>
            <li>Herramientas (rviz, rqt, rosbag)</li>
          </ul>
        </div>
        <div className="slide-callout slide-callout--info">
          <b>Tip:</b> Piensa ROS como middleware + herramientas para
          componer sistemas robóticos.
        </div>
      </div>
    </div>
  );
}
