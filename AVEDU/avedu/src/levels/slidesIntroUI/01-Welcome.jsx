// src/levels/slidesIntroUI/01-Welcome.jsx
export const meta = {
  id: "welcome",
  title: "Welcome to L.A.D",
  order: 1,
  objectiveCode: "INTRO_UI_WELCOME",
};

export default function Welcome({ meta, goNext }) {
  return (
    <div className="slide-wrap slide-p-xl slide-text--center">
      <h1>Welcome to L.A.D Platform</h1>
      <h2 className="slide-muted">Learning Autonomous Driving</h2>

      <p className="slide-text--lg slide-mt-lg">
        This platform will guide you through the fundamentals of autonomous vehicles,
        from basic robotics concepts to advanced perception and control systems.
      </p>

      <div className="slide-card slide-mt-lg">
        <div className="slide-card__title">What You'll Learn</div>
        <ul className="slide-text--left">
          <li><b>ROS 2</b> - Robot Operating System fundamentals and advanced concepts</li>
          <li><b>Vehicle Dynamics</b> - Physics and control of autonomous vehicles</li>
          <li><b>Perception</b> - Sensor integration and computer vision</li>
          <li><b>Planning & Control</b> - Path planning and motion control algorithms</li>
          <li><b>AI Integration</b> - Machine learning for autonomous systems</li>
          <li><b>Safety & Verification</b> - Testing and validation methods</li>
        </ul>
      </div>

      <div className="slide-callout slide-callout--info slide-mt-lg">
        <b>Before we start:</b> This tutorial will show you how to navigate through
        the platform and use all the available features.
      </div>

      <div className="slide-actions slide-mt-xl">
        <button className="btn btn--primary slide-text--lg" onClick={goNext}>
          Let's Get Started →
        </button>
      </div>
    </div>
  );
}
