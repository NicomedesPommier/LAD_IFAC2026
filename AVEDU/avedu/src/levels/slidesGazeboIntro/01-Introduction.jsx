// src/levels/slidesGazeboIntro/01-Introduction.jsx
export const meta = {
  id: "gazebo-intro",
  title: "Introduction to Gazebo Simulation",
  order: 1,
  objectiveCode: "gazebo-slide-intro",
};

export default function Introduction({ meta, goNext }) {
  return (
    <div className="slide-wrap">
      <h2>{meta.title}</h2>

      <div className="slide-card">
        <div className="slide-card__title">What is Gazebo?</div>
        <p>
          <b>Gazebo</b> is a powerful 3D robot simulator that provides accurate physics simulation,
          high-quality graphics, and seamless integration with ROS (Robot Operating System).
          It allows you to test and develop autonomous vehicles in a safe, virtual environment
          before deploying to real hardware.
        </p>
      </div>

      <div className="slide-columns">
        <div className="slide-card">
          <div className="slide-card__title">Key Features</div>
          <ul>
            <li><b>Physics Engine:</b> Realistic dynamics and collisions</li>
            <li><b>Sensor Simulation:</b> Cameras, LiDAR, IMU, GPS</li>
            <li><b>3D Visualization:</b> Real-time rendering</li>
            <li><b>ROS Integration:</b> Topics, services, and actions</li>
            <li><b>Plugin System:</b> Extend functionality</li>
            <li><b>Multiple Worlds:</b> Various environments</li>
          </ul>
        </div>

        <div className="slide-card">
          <div className="slide-card__title">Why Use Gazebo?</div>
          <ul>
            <li>Test algorithms safely without hardware</li>
            <li>Rapid prototyping and iteration</li>
            <li>Reproducible testing scenarios</li>
            <li>Multi-robot simulations</li>
            <li>Cost-effective development</li>
            <li>24/7 testing availability</li>
          </ul>
        </div>
      </div>

      <div className="slide-card">
        <div className="slide-card__title">In This Level</div>
        <p>
          You'll learn to control an autonomous vehicle in Gazebo using keyboard inputs,
          visualize camera feeds and sensor data in real-time, and understand how simulation
          accelerates the development of autonomous systems.
        </p>
      </div>

      <div className="slide-callout slide-callout--info">
        <b>Getting Started:</b> The Gazebo simulation runs in a Docker container with ROS 2.
        The frontend connects via rosbridge WebSocket to receive sensor data and send control commands.
        Use arrow keys to navigate these slides.
      </div>

      <div className="slide-actions">
        <button className="btn" onClick={goNext}>Continue ⟩</button>
      </div>
    </div>
  );
}
