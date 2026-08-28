// src/components/gazebo/GazeboSimulator.jsx
import React, { useState, useCallback, useEffect } from "react";
import { useRoslib } from "../../hooks/useRoslib";
import CameraSelector from "./CameraSelector";
import KeyboardControl from "./KeyboardControl";
import SensorPanel from "./SensorPanel";
import ROSDebugPanel from "./ROSDebugPanel";
import "../../styles/components/_gazebo.scss";

export default function GazeboSimulator({ onObjectiveHit }) {
  const { ros, connected, subscribeTopic, advertise } = useRoslib();

  // Vehicle state
  const [velocity, setVelocity] = useState({ linear: 0, angular: 0 });
  const [position, setPosition] = useState({ x: 0, y: 0, z: 0 });
  const [orientation, setOrientation] = useState({ roll: 0, pitch: 0, yaw: 0 });

  // Sensor data
  const [imuData, setImuData] = useState(null);
  const [lidarData, setLidarData] = useState(null);
  const [odomData, setOdomData] = useState(null);

  // Control publisher
  const [cmdVelPublisher, setCmdVelPublisher] = useState(null);

  // Connection status tracking
  const [driveTime, setDriveTime] = useState(0);
  const [hasStartedDriving, setHasStartedDriving] = useState(false);

  // Initialize cmd_vel publisher
  useEffect(() => {
    if (connected && !cmdVelPublisher) {
      const pub = advertise("/cmd_vel", "geometry_msgs/Twist");
      setCmdVelPublisher(pub);
      console.log("[Gazebo] cmd_vel publisher ready");
    }
  }, [connected, advertise, cmdVelPublisher]);

  // Subscribe to odometry
  useEffect(() => {
    if (!connected) return;

    const unsub = subscribeTopic(
      "/odom",
      "nav_msgs/Odometry",
      (msg) => {
        setOdomData(msg);
        setPosition({
          x: msg.pose.pose.position.x,
          y: msg.pose.pose.position.y,
          z: msg.pose.pose.position.z,
        });

        // Convert quaternion to euler angles
        const q = msg.pose.pose.orientation;
        const roll = Math.atan2(2 * (q.w * q.x + q.y * q.z), 1 - 2 * (q.x * q.x + q.y * q.y));
        const pitch = Math.asin(2 * (q.w * q.y - q.z * q.x));
        const yaw = Math.atan2(2 * (q.w * q.z + q.x * q.y), 1 - 2 * (q.y * q.y + q.z * q.z));

        setOrientation({
          roll: (roll * 180 / Math.PI).toFixed(2),
          pitch: (pitch * 180 / Math.PI).toFixed(2),
          yaw: (yaw * 180 / Math.PI).toFixed(2),
        });

        setVelocity({
          linear: msg.twist.twist.linear.x.toFixed(2),
          angular: msg.twist.twist.angular.z.toFixed(2),
        });
      },
      { throttle_rate: 100 }
    );

    return unsub;
  }, [connected, subscribeTopic]);

  // Subscribe to IMU
  useEffect(() => {
    if (!connected) return;

    const unsub = subscribeTopic(
      "/imu",
      "sensor_msgs/Imu",
      (msg) => {
        setImuData({
          accel: {
            x: msg.linear_acceleration.x.toFixed(3),
            y: msg.linear_acceleration.y.toFixed(3),
            z: msg.linear_acceleration.z.toFixed(3),
          },
          gyro: {
            x: msg.angular_velocity.x.toFixed(3),
            y: msg.angular_velocity.y.toFixed(3),
            z: msg.angular_velocity.z.toFixed(3),
          },
        });
      },
      { throttle_rate: 100 }
    );

    return unsub;
  }, [connected, subscribeTopic]);

  // Subscribe to LiDAR
  useEffect(() => {
    if (!connected) return;

    const unsub = subscribeTopic(
      "/scan",
      "sensor_msgs/LaserScan",
      (msg) => {
        // Get min distance and closest angle
        let minDist = msg.range_max;
        let closestAngle = 0;

        msg.ranges.forEach((range, i) => {
          if (range < minDist && range > msg.range_min) {
            minDist = range;
            closestAngle = msg.angle_min + i * msg.angle_increment;
          }
        });

        setLidarData({
          minDistance: minDist.toFixed(2),
          closestAngle: ((closestAngle * 180 / Math.PI).toFixed(1)),
          rangeCount: msg.ranges.length,
        });
      },
      { throttle_rate: 200 }
    );

    return unsub;
  }, [connected, subscribeTopic]);

  // Publish velocity command
  const publishVelocity = useCallback((linear, angular) => {
    if (!cmdVelPublisher) return;

    cmdVelPublisher.publish({
      linear: { x: linear, y: 0, z: 0 },
      angular: { x: 0, y: 0, z: angular },
    });

    if (!hasStartedDriving && (Math.abs(linear) > 0.01 || Math.abs(angular) > 0.01)) {
      setHasStartedDriving(true);
      onObjectiveHit?.("gazebo-first-drive");
    }
  }, [cmdVelPublisher, hasStartedDriving, onObjectiveHit]);

  // Track driving time for objectives
  useEffect(() => {
    if (!hasStartedDriving) return;

    const interval = setInterval(() => {
      setDriveTime((t) => {
        const newTime = t + 1;

        // Objectives
        if (newTime >= 10 && newTime < 11) {
          onObjectiveHit?.("gazebo-drive-10s");
        }
        if (newTime >= 30 && newTime < 31) {
          onObjectiveHit?.("gazebo-drive-30s");
        }

        return newTime;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [hasStartedDriving, onObjectiveHit]);

  return (
    <div className="gazebo-simulator">
      {/* Connection Status */}
      <div className={`gazebo-status ${connected ? "connected" : "disconnected"}`}>
        <span className="status-dot" />
        <span>{connected ? "ROS Connected" : "Connecting to ROS..."}</span>
        {hasStartedDriving && (
          <span style={{ marginLeft: "auto" }}>
            Drive Time: {Math.floor(driveTime / 60)}:{(driveTime % 60).toString().padStart(2, '0')}
          </span>
        )}
      </div>

      <div className="gazebo-main-grid">
        {/* Left Panel: Sensors + Debug */}
        <div className="gazebo-sensors">
          <ROSDebugPanel
            connected={connected}
            subscribeTopic={subscribeTopic}
          />

          <SensorPanel
            title="Odometry"
            icon="📍"
            data={{
              "Position X": `${position.x.toFixed(2)} m`,
              "Position Y": `${position.y.toFixed(2)} m`,
              "Yaw": `${orientation.yaw}°`,
              "Linear Vel": `${velocity.linear} m/s`,
              "Angular Vel": `${velocity.angular} rad/s`,
            }}
          />

          <SensorPanel
            title="IMU"
            icon="📊"
            data={imuData ? {
              "Accel X": `${imuData.accel.x} m/s²`,
              "Accel Y": `${imuData.accel.y} m/s²`,
              "Accel Z": `${imuData.accel.z} m/s²`,
              "Gyro Z": `${imuData.gyro.z} rad/s`,
            } : { Status: "Waiting..." }}
          />

          <SensorPanel
            title="LiDAR"
            icon="📡"
            data={lidarData ? {
              "Min Distance": `${lidarData.minDistance} m`,
              "Closest Angle": `${lidarData.closestAngle}°`,
              "Scan Points": lidarData.rangeCount,
            } : { Status: "Waiting..." }}
          />
        </div>

        {/* Center: Camera Feed with Selector */}
        <div className="gazebo-camera">
          <CameraSelector connected={connected} subscribeTopic={subscribeTopic} />
        </div>

        {/* Right Panel: Controls */}
        <div className="gazebo-controls">
          <KeyboardControl
            connected={connected}
            onVelocityChange={publishVelocity}
          />

          <div className="gazebo-hints">
            <h3>💡 Hints</h3>
            <ul>
              <li>Use <kbd>W</kbd><kbd>A</kbd><kbd>S</kbd><kbd>D</kbd> or arrow keys to move</li>
              <li>Press <kbd>Space</kbd> to stop</li>
              <li>Switch cameras using tabs above</li>
              <li>Click "Grid View" to see all cameras</li>
              <li>Check Debug Panel if no camera feed</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Bottom: Status Bar */}
      <div className="gazebo-footer">
        <div className="gazebo-footer-item">
          <span className="label">Vehicle Speed:</span>
          <span className="value">{velocity.linear} m/s</span>
        </div>
        <div className="gazebo-footer-item">
          <span className="label">Turn Rate:</span>
          <span className="value">{velocity.angular} rad/s</span>
        </div>
        <div className="gazebo-footer-item">
          <span className="label">Position:</span>
          <span className="value">({position.x.toFixed(1)}, {position.y.toFixed(1)})</span>
        </div>
        <div className="gazebo-footer-item">
          <span className="label">Heading:</span>
          <span className="value">{orientation.yaw}°</span>
        </div>
      </div>
    </div>
  );
}
