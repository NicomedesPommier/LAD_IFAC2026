// src/levels/slidesIntroUI/04-Objectives.jsx
export const meta = {
  id: "objectives",
  title: "Learning Objectives",
  order: 4,
  objectiveCode: "INTRO_UI_OBJECTIVES",
};

export default function Objectives({ meta }) {
  return (
    <div className="slide" style={{ padding: "2rem" }}>
      <h2>{meta.title}</h2>

      <p style={{ fontSize: "1.1rem", marginBottom: "2rem" }}>
        Each level has specific learning objectives that help you track your progress and understand what you'll master.
      </p>

      <div className="slide-card" style={{ marginBottom: "1.5rem" }}>
        <div className="slide-card__title">📍 What are Objectives?</div>
        <p>
          Objectives are specific skills or concepts you'll learn in each level. They appear as
          small badges at the top of each level screen.
        </p>
        <div style={{ display: "flex", gap: ".5rem", marginTop: "1rem", flexWrap: "wrap" }}>
          <div style={{
            padding: ".35rem .55rem",
            border: "1px solid var(--border)",
            borderRadius: "12px",
            background: "var(--glass)",
            fontSize: ".95rem",
            display: "inline-flex",
            alignItems: "center",
            gap: ".45rem"
          }}>
            <span style={{ width: ".55rem", height: ".55rem", borderRadius: "50%", background: "#888" }}></span>
            <span>Example objective</span>
          </div>
          <div style={{
            padding: ".35rem .55rem",
            border: "1px solid rgba(125, 249, 255, 0.55)",
            borderRadius: "12px",
            background: "var(--glass)",
            fontSize: ".95rem",
            display: "inline-flex",
            alignItems: "center",
            gap: ".45rem"
          }}>
            <span style={{ width: ".55rem", height: ".55rem", borderRadius: "50%", background: "#7df9ff", boxShadow: "0 0 6px rgba(125,249,255,.4)" }}></span>
            <span>Completed objective</span>
            <span style={{ opacity: .9 }}>✔</span>
          </div>
        </div>
      </div>

      <div className="slide-card" style={{ marginBottom: "1.5rem" }}>
        <div className="slide-card__title">✅ How Objectives Work</div>
        <ul>
          <li><b>Gray dot:</b> Not yet completed</li>
          <li><b>Cyan dot + ✔:</b> Successfully completed</li>
          <li><b>Automatic tracking:</b> Objectives are marked as you complete activities</li>
        </ul>
      </div>

      <div className="slide-callout slide-callout--success">
        <b>Great job!</b> By reading this slide, you're completing objectives right now!
        Look at the top of the screen to see your progress.
      </div>

      <div className="slide-card slide-card--highlight" style={{ marginTop: "1.5rem" }}>
        <div className="slide-card__title">🔄 Reset Progress</div>
        <p>
          Need to review a level? Use the reset button (↺) in the top-right corner to restart your progress
          for that level. Your overall course progress won't be affected.
        </p>
      </div>
    </div>
  );
}
