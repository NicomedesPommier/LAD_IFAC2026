// src/levels/slidesIntroUI/05-Interactive.jsx
export const meta = {
  id: "interactive",
  title: "Interactive Features",
  order: 5,
  objectiveCode: "INTRO_UI_INTERACTIVE",
};

export default function Interactive({ meta }) {
  return (
    <div className="slide" style={{ padding: "2rem" }}>
      <h2>{meta.title}</h2>

      <p style={{ fontSize: "1.1rem", marginBottom: "2rem" }}>
        L.A.D is more than just reading - it's a hands-on learning experience with interactive simulations and exercises!
      </p>

      <div style={{ display: "grid", gap: "1.5rem" }}>
        <div className="slide-card">
          <div className="slide-card__title">🎮 Different Types of Lessons</div>
          <ul style={{ display: "grid", gap: ".75rem" }}>
            <li>
              <b>📊 Slides:</b> Theory and concepts explained step-by-step (like this one!)
            </li>
            <li>
              <b>🚗 Simulations:</b> Interactive 3D vehicle dynamics and robot control
            </li>
            <li>
              <b>🐢 ROS Exercises:</b> Practice with turtlesim and other ROS tools
            </li>
            <li>
              <b>🎯 Challenges:</b> Apply what you've learned with practical tasks
            </li>
            <li>
              <b>🔧 URDF Editor:</b> Build and customize robot models
            </li>
          </ul>
        </div>

        <div className="slide-card">
          <div className="slide-card__title">🖥️ IDE and Workspace</div>
          <p>
            Some levels include an integrated development environment where you can:
          </p>
          <ul>
            <li>Write and edit ROS 2 code</li>
            <li>Create custom robot models</li>
            <li>Test your implementations in real-time</li>
            <li>Upload custom 3D meshes for your robots</li>
          </ul>
        </div>
      </div>

      <div className="slide-callout slide-callout--tip" style={{ marginTop: "1.5rem" }}>
        <b>Learning by Doing:</b> The best way to learn is by experimenting! Don't be afraid
        to try different approaches and make mistakes - that's how you learn.
      </div>

      <div className="slide-card slide-card--highlight" style={{ marginTop: "1.5rem" }}>
        <div className="slide-card__title">💡 Pro Tips</div>
        <ul>
          <li>Take your time with each level - quality over speed</li>
          <li>Review completed levels if you need a refresher</li>
          <li>Experiment with the simulations to deepen your understanding</li>
          <li>Ask questions and explore the documentation</li>
        </ul>
      </div>
    </div>
  );
}
