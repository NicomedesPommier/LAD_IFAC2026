// src/levels/slidesVehicleDynamics/01-Introduction.jsx
export const meta = {
  id: "vd-intro",
  title: "Introduction to Vehicle Dynamics",
  order: 1,
  objectiveCode: "vd-slide-intro",
};

export default function Introduction({ meta, goNext }) {
  return (
    <div className="slide-wrap">
      <h2>{meta.title}</h2>

      <div className="slide-card">
        <div className="slide-card__title">What is Vehicle Dynamics?</div>
        <p>
          Vehicle dynamics is the study of how vehicles move and respond to driver inputs,
          road conditions, and external forces. It combines principles from mechanics,
          control theory, and engineering to understand and predict vehicle behavior.
        </p>
      </div>

      <div className="slide-columns">
        <div className="slide-card">
          <div className="slide-card__title">Key Topics Covered</div>
          <ul>
            <li>Instantaneous Center of Rotation (ICR)</li>
            <li>Ackermann Steering Geometry</li>
            <li>Bicycle Model (2-wheel simplification)</li>
            <li>Tire Forces and Slip Angles</li>
            <li>Lateral Dynamics and Stability</li>
          </ul>
        </div>

        <div className="slide-card">
          <div className="slide-card__title">Applications</div>
          <ul>
            <li>Autonomous vehicle control</li>
            <li>Vehicle stability systems (ESP, ABS)</li>
            <li>Performance optimization</li>
            <li>Driver assistance systems</li>
            <li>Motion planning and simulation</li>
          </ul>
        </div>
      </div>

      <div className="slide-callout slide-callout--info">
        <b>Interactive Learning:</b> Use the arrow keys <span className="slide-kbd">←</span> <span className="slide-kbd">→</span>
        to navigate through the slides. Some slides include interactive visualizations to help you understand the concepts.
      </div>

      <div className="slide-actions">
        <button className="btn" onClick={goNext}>Start Learning ⟩</button>
      </div>
    </div>
  );
}
