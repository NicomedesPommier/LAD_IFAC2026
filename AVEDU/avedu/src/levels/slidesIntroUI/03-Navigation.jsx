// src/levels/slidesIntroUI/03-Navigation.jsx
export const meta = {
  id: "navigation",
  title: "Navigating the Platform",
  order: 3,
  objectiveCode: "INTRO_UI_NAV",
};

export default function Navigation({ meta }) {
  return (
    <div className="slide slide-p-xl">
      <h2>{meta.title}</h2>

      <p className="slide-text--lg slide-mb-lg">
        Moving through the curriculum is simple and intuitive. Here's how:
      </p>

      <div className="slide-flex slide-flex--col slide-gap-lg">
        <div className="slide-card">
          <div className="slide-card__title">1️⃣ Selecting a Unit</div>
          <div className="slide-gap-md">
            <p>
              Start by clicking any unit in the sidebar (like "Introduction", "Vehicle Dynamics", "ROS 2 Concepts", etc.)
            </p>
            <div className="slide-callout slide-callout--info slide-mt-md">
              <b>Example:</b> Click "Vehicle Dynamics" to learn about vehicle physics and control.
            </div>
          </div>
        </div>

        <div className="slide-card">
          <div className="slide-card__title">2️⃣ Choosing a Level</div>
          <div className="slide-gap-md">
            <p>
              After selecting a unit, the sidebar will show all available levels (lessons) for that unit.
              Click any level to start learning!
            </p>
            <div className="slide-tip slide-mt-md">
              <b>Pro Tip:</b> Completed levels show a ✔ badge. Try to complete them in order for the best learning experience.
            </div>
          </div>
        </div>

        <div className="slide-card">
          <div className="slide-card__title">3️⃣ Going Back</div>
          <p>
            When viewing levels, you'll see a "← Back to Units" button at the top of the sidebar
            to return to the units list.
          </p>
        </div>
      </div>

      <div className="slide-card slide-mt-lg">
        <div className="slide-card__title">⌨️ Keyboard Shortcuts</div>
        <div className="slide-grid slide-grid--auto slide-gap-lg">
          <div>
            <span className="slide-kbd">←</span> <span className="slide-kbd">→</span>
            <p className="slide-mt-sm slide-muted">Navigate between slides</p>
          </div>
        </div>
      </div>
    </div>
  );
}

