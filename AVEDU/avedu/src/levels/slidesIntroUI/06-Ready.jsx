// src/levels/slidesIntroUI/06-Ready.jsx
export const meta = {
  id: "ready",
  title: "Ready to Start!",
  order: 6,
  objectiveCode: "INTRO_UI_COMPLETE",
};

export default function Ready({ meta, onLevelCompleted, isLast }) {
  return (
    <div className="slide-wrap" style={{ padding: "2rem", maxWidth: "800px", margin: "0 auto", textAlign: "center" }}>
      <h1 style={{ fontSize: "2.5rem", marginBottom: "1rem" }}>
        You're Ready to Start! 🎉
      </h1>

      <p style={{ fontSize: "1.2rem", marginBottom: "2rem", opacity: 0.9 }}>
        You now know how to navigate the L.A.D platform and use all its features.
      </p>

      <div className="slide-card" style={{ marginBottom: "2rem", textAlign: "left" }}>
        <div className="slide-card__title">Quick Reference</div>
        <div style={{ display: "grid", gap: "1rem", gridTemplateColumns: "1fr 1fr" }}>
          <div>
            <h4 style={{ marginBottom: ".5rem" }}>Navigation</h4>
            <ul style={{ listStyle: "none", padding: 0, fontSize: ".95rem" }}>
              <li>• Sidebar: Units & Levels</li>
              <li>• Back button: Return to units</li>
              <li>• Arrows: Navigate slides</li>
            </ul>
          </div>
          <div>
            <h4 style={{ marginBottom: ".5rem" }}>Features</h4>
            <ul style={{ listStyle: "none", padding: 0, fontSize: ".95rem" }}>
              <li>• Theme toggle (top-right)</li>
              <li>• Progress badges (✔)</li>
              <li>• Reset button (↺)</li>
            </ul>
          </div>
        </div>
      </div>

      <div className="slide-callout slide-callout--success" style={{ marginBottom: "2rem" }}>
        <b>Congratulations!</b> You've completed your first level. Look at the top of the screen -
        you should see your completed objectives marked with ✔
      </div>

      <div style={{ display: "grid", gap: "1rem" }}>
        <p style={{ fontSize: "1.1rem" }}>
          <b>Next Steps:</b>
        </p>
        <ul style={{ listStyle: "none", padding: 0, fontSize: "1.05rem" }}>
          <li>1. Complete the "Getting Started Tutorial" level</li>
          <li>2. Explore the "Vehicle Dynamics" unit</li>
          <li>3. Learn ROS 2 fundamentals</li>
          <li>4. Build your first autonomous vehicle!</li>
        </ul>
      </div>

      <div className="slide-actions" style={{ marginTop: "2rem" }}>
        {isLast && (
          <button
            className="btn"
            onClick={onLevelCompleted}
            style={{ fontSize: "1.1rem", padding: ".75rem 2rem" }}
          >
            ✓ Complete This Level
          </button>
        )}
      </div>

      <p style={{ marginTop: "2rem", opacity: 0.7, fontSize: ".95rem" }}>
        Use the sidebar to explore other units and continue your learning journey!
      </p>
    </div>
  );
}
