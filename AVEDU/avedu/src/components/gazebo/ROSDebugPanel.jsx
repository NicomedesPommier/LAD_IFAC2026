// src/components/gazebo/ROSDebugPanel.jsx
import React, { useState, useEffect } from "react";

export default function ROSDebugPanel({ connected, subscribeTopic }) {
  const [topicStats, setTopicStats] = useState({
    camera: { count: 0, lastMsg: null, error: null },
    odom: { count: 0, lastMsg: null, error: null },
    imu: { count: 0, lastMsg: null, error: null },
    scan: { count: 0, lastMsg: null, error: null },
  });

  const [isExpanded, setIsExpanded] = useState(false);

  // Monitor camera topic
  useEffect(() => {
    if (!connected || !subscribeTopic) return;

    const unsub = subscribeTopic(
      "/qcar/camera/image_raw",
      "sensor_msgs/Image",
      (msg) => {
        setTopicStats(prev => ({
          ...prev,
          camera: {
            count: prev.camera.count + 1,
            lastMsg: {
              width: msg.width,
              height: msg.height,
              encoding: msg.encoding,
              dataType: typeof msg.data,
              dataLength: msg.data?.length || 0,
            },
            error: null,
          }
        }));
      },
      { throttle_rate: 500 }
    );

    return unsub;
  }, [connected, subscribeTopic]);

  // Monitor odom topic
  useEffect(() => {
    if (!connected || !subscribeTopic) return;

    const unsub = subscribeTopic(
      "/odom",
      "nav_msgs/Odometry",
      (msg) => {
        setTopicStats(prev => ({
          ...prev,
          odom: {
            count: prev.odom.count + 1,
            lastMsg: {
              x: msg.pose.pose.position.x.toFixed(2),
              y: msg.pose.pose.position.y.toFixed(2),
              linear: msg.twist.twist.linear.x.toFixed(2),
            },
            error: null,
          }
        }));
      },
      { throttle_rate: 500 }
    );

    return unsub;
  }, [connected, subscribeTopic]);

  // Monitor IMU topic
  useEffect(() => {
    if (!connected || !subscribeTopic) return;

    const unsub = subscribeTopic(
      "/imu",
      "sensor_msgs/Imu",
      (msg) => {
        setTopicStats(prev => ({
          ...prev,
          imu: {
            count: prev.imu.count + 1,
            lastMsg: {
              accel_z: msg.linear_acceleration?.z?.toFixed(2) || "N/A",
              gyro_z: msg.angular_velocity?.z?.toFixed(2) || "N/A",
            },
            error: null,
          }
        }));
      },
      { throttle_rate: 500 }
    );

    return unsub;
  }, [connected, subscribeTopic]);

  // Monitor LiDAR topic
  useEffect(() => {
    if (!connected || !subscribeTopic) return;

    const unsub = subscribeTopic(
      "/scan",
      "sensor_msgs/LaserScan",
      (msg) => {
        setTopicStats(prev => ({
          ...prev,
          scan: {
            count: prev.scan.count + 1,
            lastMsg: {
              ranges: msg.ranges?.length || 0,
              min: msg.range_min?.toFixed(2) || "N/A",
              max: msg.range_max?.toFixed(2) || "N/A",
            },
            error: null,
          }
        }));
      },
      { throttle_rate: 500 }
    );

    return unsub;
  }, [connected, subscribeTopic]);

  const getStatusColor = (count) => {
    if (count === 0) return "#dc2626"; // red
    if (count < 10) return "#f59e0b"; // orange
    return "#10b981"; // green
  };

  return (
    <div className="ros-debug-panel">
      <div
        className="ros-debug-panel__header"
        onClick={() => setIsExpanded(!isExpanded)}
        style={{ cursor: "pointer" }}
      >
        <h3>🔧 ROS Debug Panel</h3>
        <span className="ros-debug-panel__toggle">
          {isExpanded ? "▼" : "▶"}
        </span>
      </div>

      {isExpanded && (
        <div className="ros-debug-panel__body">
          <div className="ros-debug-panel__status">
            <strong>Connection:</strong>
            <span className={connected ? "status-connected" : "status-disconnected"}>
              {connected ? "🟢 Connected" : "🔴 Disconnected"}
            </span>
          </div>

          <div className="ros-debug-panel__topics">
            {/* Camera Topic */}
            <div className="debug-topic">
              <div className="debug-topic__header">
                <span className="debug-topic__name">📹 /qcar/camera/image_raw</span>
                <span
                  className="debug-topic__count"
                  style={{ color: getStatusColor(topicStats.camera.count) }}
                >
                  {topicStats.camera.count} msgs
                </span>
              </div>
              {topicStats.camera.lastMsg && (
                <div className="debug-topic__details">
                  <code>
                    {topicStats.camera.lastMsg.width}x{topicStats.camera.lastMsg.height} |
                    {topicStats.camera.lastMsg.encoding} |
                    {topicStats.camera.lastMsg.dataType} |
                    {topicStats.camera.lastMsg.dataLength} bytes
                  </code>
                </div>
              )}
              {topicStats.camera.count === 0 && (
                <div className="debug-topic__warning">
                  ⚠️ No messages received. Check if camera is publishing.
                </div>
              )}
            </div>

            {/* Odom Topic */}
            <div className="debug-topic">
              <div className="debug-topic__header">
                <span className="debug-topic__name">📍 /odom</span>
                <span
                  className="debug-topic__count"
                  style={{ color: getStatusColor(topicStats.odom.count) }}
                >
                  {topicStats.odom.count} msgs
                </span>
              </div>
              {topicStats.odom.lastMsg && (
                <div className="debug-topic__details">
                  <code>
                    pos: ({topicStats.odom.lastMsg.x}, {topicStats.odom.lastMsg.y}) |
                    vel: {topicStats.odom.lastMsg.linear} m/s
                  </code>
                </div>
              )}
            </div>

            {/* IMU Topic */}
            <div className="debug-topic">
              <div className="debug-topic__header">
                <span className="debug-topic__name">📊 /imu</span>
                <span
                  className="debug-topic__count"
                  style={{ color: getStatusColor(topicStats.imu.count) }}
                >
                  {topicStats.imu.count} msgs
                </span>
              </div>
              {topicStats.imu.lastMsg && (
                <div className="debug-topic__details">
                  <code>
                    accel_z: {topicStats.imu.lastMsg.accel_z} |
                    gyro_z: {topicStats.imu.lastMsg.gyro_z}
                  </code>
                </div>
              )}
            </div>

            {/* LiDAR Topic */}
            <div className="debug-topic">
              <div className="debug-topic__header">
                <span className="debug-topic__name">📡 /scan</span>
                <span
                  className="debug-topic__count"
                  style={{ color: getStatusColor(topicStats.scan.count) }}
                >
                  {topicStats.scan.count} msgs
                </span>
              </div>
              {topicStats.scan.lastMsg && (
                <div className="debug-topic__details">
                  <code>
                    {topicStats.scan.lastMsg.ranges} points |
                    range: {topicStats.scan.lastMsg.min} - {topicStats.scan.lastMsg.max} m
                  </code>
                </div>
              )}
            </div>
          </div>

          <div className="ros-debug-panel__hint">
            💡 If message counts aren't increasing, check that topics are being published in Gazebo.
            Use <code>ros2 topic list</code> and <code>ros2 topic hz /qcar/camera/image_raw</code> to debug.
          </div>
        </div>
      )}
    </div>
  );
}
