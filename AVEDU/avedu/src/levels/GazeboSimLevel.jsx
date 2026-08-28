import React from 'react';
import useRoslib from '../hooks/useRoslib';
import GazeboSimViewer from '../components/gazebo/GazeboSimViewer';
import RobotTeleop from '../components/gazebo/RobotTeleop';
import '../styles/pages/_gazebo-sim-level.scss';

/**
 * GazeboSimLevel - Complete Gazebo simulation level
 *
 * This level demonstrates:
 * - Gazebo simulation integration
 * - Camera visualization from Gazebo sensors
 * - LIDAR data display
 * - Robot teleoperation
 * - Odometry tracking
 */
const GazeboSimLevel = () => {
  const { ros, connected } = useRoslib();

  return (
    <div className="gazebo-sim-level">
      <div className="level-header">
        <h1>Gazebo Simulation - QCar Robot</h1>
        <p className="level-description">
          Control and visualize the QCar robot in Gazebo simulation.
          Use the teleop controller to move the robot and observe sensor data in real-time.
        </p>
      </div>

      <div className="level-content">
        {/* Main simulation viewer */}
        <div className="simulation-section">
          <GazeboSimViewer ros={ros} connected={connected} />
        </div>

        {/* Teleop controller */}
        <div className="control-section">
          <RobotTeleop ros={ros} connected={connected} />
        </div>

        {/* Instructions */}
        <div className="instructions-section">
          <h2>Learning Objectives</h2>
          <div className="objectives-list">
            <div className="objective">
              <span className="objective-icon">🎯</span>
              <div className="objective-content">
                <h3>Understand Robot Simulation</h3>
                <p>Learn how Gazebo simulates real-world physics and sensor behavior</p>
              </div>
            </div>

            <div className="objective">
              <span className="objective-icon">📷</span>
              <div className="objective-content">
                <h3>Camera Sensor Integration</h3>
                <p>Observe how multiple cameras provide different perspectives of the environment</p>
              </div>
            </div>

            <div className="objective">
              <span className="objective-icon">📡</span>
              <div className="objective-content">
                <h3>LIDAR Sensing</h3>
                <p>Understand how laser scanners detect obstacles and measure distances</p>
              </div>
            </div>

            <div className="objective">
              <span className="objective-icon">🎮</span>
              <div className="objective-content">
                <h3>Robot Control</h3>
                <p>Practice teleoperation and understand velocity commands</p>
              </div>
            </div>
          </div>

          <h2>How to Use</h2>
          <ol className="instructions-list">
            <li>
              <strong>Verify Connection:</strong> Ensure the "Connected" status is shown at the top
            </li>
            <li>
              <strong>Control the Robot:</strong> Use the teleop controller or keyboard (WASD/Arrow keys)
            </li>
            <li>
              <strong>Switch Cameras:</strong> Select different camera views from the dropdown
            </li>
            <li>
              <strong>Observe Sensors:</strong> Watch the LIDAR visualization and odometry values change as you move
            </li>
            <li>
              <strong>Experiment:</strong> Try different speeds and movement patterns
            </li>
          </ol>

          <div className="tips-section">
            <h3>Tips</h3>
            <ul>
              <li>Start with low speeds to get familiar with the controls</li>
              <li>The LIDAR shows obstacles as green dots - walls will appear as lines</li>
              <li>Odometry tracks the robot's estimated position based on wheel rotation</li>
              <li>Camera distortion in CSI cameras simulates real fisheye lenses</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GazeboSimLevel;
