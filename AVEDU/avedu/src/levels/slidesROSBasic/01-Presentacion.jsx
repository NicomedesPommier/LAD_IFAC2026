// src/levels/rosbasic/slides/Presentacion.jsx
export const meta = {
  id: "presentacion",
  title: "Presentación",
  order: 0,
  objectiveCode: "ros-slide-intro",
};

export default function Presentacion({ meta, goNext }) {
  return (
    <div className="slide-wrap">
      <h2>{meta.title}</h2>
      <p>
        Bienvenid@ al nivel <b>ROS Basic</b> en formato de slides. Usa{" "}
        <span className="slide-kbd">←</span> <span className="slide-kbd">→</span>{" "}
        o los botones para navegar.
      </p>

      <div className="slide-actions">
        <button className="btn" onClick={goNext}>Empezar ⟩</button>
      </div>
    </div>
  );
}
