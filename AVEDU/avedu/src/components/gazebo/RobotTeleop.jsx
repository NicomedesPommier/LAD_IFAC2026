import React, { useState, useEffect, useCallback } from 'react';
import '../../styles/components/RobotTeleop.css';

/**
 * RobotTeleop - Teleoperation controller for QCar in Gazebo
 *
 * Provides keyboard and button controls to move the robot
 *
 * Props:
 * - ros: ROS connection object from useRoslib hook
 * - connected: Boolean indicating ROS connection status
 */
const RobotTeleop = ({ ros, connected }) => {
  const [linearSpeed, setLinearSpeed] = useState(0.3); // m/s
  const [angularSpeed, setAngularSpeed] = useState(0.5); // rad/s
  const [activeKey, setActiveKey] = useState(null);

  // Publish velocity command
  const publishVelocity = useCallback((linear, angular) => {
    if (!connected || !ros?.advertise) return;

    const cmdVelTopic = ros.advertise('/qcar/cmd_vel', 'geometry_msgs/msg/Twist');

    cmdVelTopic.publish({
      linear: { x: linear, y: 0, z: 0 },
      angular: { x: 0, y: 0, z: angular }
    });
  }, [connected, ros]);

  // Stop robot
  const stopRobot = useCallback(() => {
    publishVelocity(0, 0);
    setActiveKey(null);
  }, [publishVelocity]);

  // Movement commands
  const moveForward = useCallback(() => {
    publishVelocity(linearSpeed, 0);
    setActiveKey('forward');
  }, [publishVelocity, linearSpeed]);

  const moveBackward = useCallback(() => {
    publishVelocity(-linearSpeed, 0);
    setActiveKey('backward');
  }, [publishVelocity, linearSpeed]);

  const turnLeft = useCallback(() => {
    publishVelocity(0, angularSpeed);
    setActiveKey('left');
  }, [publishVelocity, angularSpeed]);

  const turnRight = useCallback(() => {
    publishVelocity(0, -angularSpeed);
    setActiveKey('right');
  }, [publishVelocity, angularSpeed]);

  // Keyboard controls
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!connected) return;

      // Prevent default browser behavior for arrow keys
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'w', 's', 'a', 'd'].includes(e.key)) {
        e.preventDefault();
      }

      switch (e.key) {
        case 'ArrowUp':
        case 'w':
        case 'W':
          moveForward();
          break;
        case 'ArrowDown':
        case 's':
        case 'S':
          moveBackward();
          break;
        case 'ArrowLeft':
        case 'a':
        case 'A':
          turnLeft();
          break;
        case 'ArrowRight':
        case 'd':
        case 'D':
          turnRight();
          break;
        case ' ':
          stopRobot();
          break;
        default:
          break;
      }
    };

    const handleKeyUp = (e) => {
      if (!connected) return;

      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'w', 's', 'a', 'd', 'W', 'S', 'A', 'D'].includes(e.key)) {
        stopRobot();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [connected, moveForward, moveBackward, turnLeft, turnRight, stopRobot]);

  if (!connected) {
    return (
      <div className="robot-teleop disabled">
        <h3>Robot Teleop Controller</h3>
        <p className="error-message">Not connected to ROS</p>
      </div>
    );
  }

  return (
    <div className="robot-teleop">
      <h3>Robot Teleop Controller</h3>

      {/* Speed controls */}
      <div className="speed-controls">
        <div className="speed-control">
          <label htmlFor="linear-speed">Linear Speed (m/s):</label>
          <input
            id="linear-speed"
            type="range"
            min="0.1"
            max="1.0"
            step="0.1"
            value={linearSpeed}
            onChange={(e) => setLinearSpeed(parseFloat(e.target.value))}
          />
          <span className="speed-value">{linearSpeed.toFixed(1)}</span>
        </div>

        <div className="speed-control">
          <label htmlFor="angular-speed">Angular Speed (rad/s):</label>
          <input
            id="angular-speed"
            type="range"
            min="0.1"
            max="2.0"
            step="0.1"
            value={angularSpeed}
            onChange={(e) => setAngularSpeed(parseFloat(e.target.value))}
          />
          <span className="speed-value">{angularSpeed.toFixed(1)}</span>
        </div>
      </div>

      {/* Direction controls */}
      <div className="direction-controls">
        <button
          className={`control-btn forward ${activeKey === 'forward' ? 'active' : ''}`}
          onMouseDown={moveForward}
          onMouseUp={stopRobot}
          onMouseLeave={stopRobot}
          onTouchStart={moveForward}
          onTouchEnd={stopRobot}
        >
          ↑
        </button>

        <div className="middle-row">
          <button
            className={`control-btn left ${activeKey === 'left' ? 'active' : ''}`}
            onMouseDown={turnLeft}
            onMouseUp={stopRobot}
            onMouseLeave={stopRobot}
            onTouchStart={turnLeft}
            onTouchEnd={stopRobot}
          >
            ←
          </button>

          <button
            className="control-btn stop"
            onClick={stopRobot}
          >
            STOP
          </button>

          <button
            className={`control-btn right ${activeKey === 'right' ? 'active' : ''}`}
            onMouseDown={turnRight}
            onMouseUp={stopRobot}
            onMouseLeave={stopRobot}
            onTouchStart={turnRight}
            onTouchEnd={stopRobot}
          >
            →
          </button>
        </div>

        <button
          className={`control-btn backward ${activeKey === 'backward' ? 'active' : ''}`}
          onMouseDown={moveBackward}
          onMouseUp={stopRobot}
          onMouseLeave={stopRobot}
          onTouchStart={moveBackward}
          onTouchEnd={stopRobot}
        >
          ↓
        </button>
      </div>

      {/* Instructions */}
      <div className="instructions">
        <p><strong>Keyboard Controls:</strong></p>
        <ul>
          <li>W / ↑ : Move Forward</li>
          <li>S / ↓ : Move Backward</li>
          <li>A / ← : Turn Left</li>
          <li>D / → : Turn Right</li>
          <li>Space : Stop</li>
        </ul>
      </div>
    </div>
  );
};

export default RobotTeleop;
