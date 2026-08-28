import React, { useEffect, useState, useRef } from 'react';
import '../../styles/components/GazeboSimViewer.css';

/**
 * GazeboSimViewer - Displays Gazebo simulation data via ROS topics
 *
 * This component shows:
 * - Camera feeds from Gazebo sensors
 * - Robot odometry and state
 * - LIDAR visualization
 *
 * Props:
 * - ros: ROS connection object from useRoslib hook
 * - connected: Boolean indicating ROS connection status
 */
const GazeboSimViewer = ({ ros, connected }) => {
  const [cameraImage, setCameraImage] = useState(null);
  const [odomData, setOdomData] = useState(null);
  const [lidarData, setLidarData] = useState(null);
  const [selectedCamera, setSelectedCamera] = useState('rgb');

  const canvasRef = useRef(null);

  // Subscribe to camera topic
  useEffect(() => {
    if (!connected || !ros?.subscribeTopic) return;

    const cameraTopicMap = {
      'rgb': '/qcar/rgb/image_color/compressed',
      'front': '/qcar/csi_front/image_raw/compressed',
      'right': '/qcar/csi_right/image_raw/compressed',
      'back': '/qcar/csi_back/image_raw/compressed',
      'left': '/qcar/csi_left/image_raw/compressed'
    };

    const cameraTopic = cameraTopicMap[selectedCamera];

    const unsubCamera = ros.subscribeTopic(
      cameraTopic,
      'sensor_msgs/msg/CompressedImage',
      (message) => {
        // Convert compressed JPEG data to displayable format
        // CompressedImage message has 'data' field with JPEG bytes
        const blob = new Blob([new Uint8Array(message.data)], { type: 'image/jpeg' });
        const imageUrl = URL.createObjectURL(blob);

        // Clean up previous URL to prevent memory leak
        if (cameraImage && cameraImage.startsWith('blob:')) {
          URL.revokeObjectURL(cameraImage);
        }

        setCameraImage(imageUrl);
      }
    );

    return () => {
      if (unsubCamera) unsubCamera();
    };
  }, [connected, ros, selectedCamera]);

  // Subscribe to odometry
  useEffect(() => {
    if (!connected || !ros?.subscribeTopic) return;

    const unsubOdom = ros.subscribeTopic(
      '/qcar/odom',
      'nav_msgs/msg/Odometry',
      (message) => {
        setOdomData({
          position: {
            x: message.pose.pose.position.x.toFixed(3),
            y: message.pose.pose.position.y.toFixed(3),
            z: message.pose.pose.position.z.toFixed(3)
          },
          linear: {
            x: message.twist.twist.linear.x.toFixed(3),
            y: message.twist.twist.linear.y.toFixed(3)
          },
          angular: {
            z: message.twist.twist.angular.z.toFixed(3)
          }
        });
      }
    );

    return () => {
      if (unsubOdom) unsubOdom();
    };
  }, [connected, ros]);

  // Subscribe to LIDAR
  useEffect(() => {
    if (!connected || !ros?.subscribeTopic) return;

    const unsubLidar = ros.subscribeTopic(
      '/qcar/lidar/scan',
      'sensor_msgs/msg/LaserScan',
      (message) => {
        setLidarData({
          rangeMin: message.range_min,
          rangeMax: message.range_max,
          ranges: message.ranges,
          angleMin: message.angle_min,
          angleMax: message.angle_max,
          angleIncrement: message.angle_increment
        });
      }
    );

    return () => {
      if (unsubLidar) unsubLidar();
    };
  }, [connected, ros]);

  // Draw LIDAR visualization
  useEffect(() => {
    if (!lidarData || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const scale = 30; // pixels per meter

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw grid
    ctx.strokeStyle = '#333';
    ctx.lineWidth = 1;
    for (let i = 1; i <= 5; i++) {
      ctx.beginPath();
      ctx.arc(centerX, centerY, i * scale, 0, 2 * Math.PI);
      ctx.stroke();
    }

    // Draw LIDAR points
    ctx.fillStyle = '#00ff00';
    lidarData.ranges.forEach((range, index) => {
      if (range >= lidarData.rangeMin && range <= lidarData.rangeMax) {
        const angle = lidarData.angleMin + index * lidarData.angleIncrement;
        const x = centerX + range * scale * Math.cos(angle);
        const y = centerY + range * scale * Math.sin(angle);
        ctx.fillRect(x - 2, y - 2, 4, 4);
      }
    });

    // Draw robot
    ctx.fillStyle = '#ff0000';
    ctx.beginPath();
    ctx.arc(centerX, centerY, 5, 0, 2 * Math.PI);
    ctx.fill();
  }, [lidarData]);

  if (!connected) {
    return (
      <div className="gazebo-sim-viewer">
        <div className="connection-status error">
          Not connected to ROS. Please check your connection.
        </div>
      </div>
    );
  }

  return (
    <div className="gazebo-sim-viewer">
      <div className="gazebo-header">
        <h2>Gazebo Simulation</h2>
        <div className="connection-status success">Connected</div>
      </div>

      <div className="gazebo-content">
        {/* Camera View */}
        <div className="camera-section">
          <div className="section-header">
            <h3>Camera View</h3>
            <select
              value={selectedCamera}
              onChange={(e) => setSelectedCamera(e.target.value)}
              className="camera-selector"
            >
              <option value="rgb">RGB Camera</option>
              <option value="front">Front CSI</option>
              <option value="right">Right CSI</option>
              <option value="back">Back CSI</option>
              <option value="left">Left CSI</option>
            </select>
          </div>
          <div className="camera-view">
            {cameraImage ? (
              <img src={cameraImage} alt="Camera feed" />
            ) : (
              <div className="no-image">Waiting for camera data...</div>
            )}
          </div>
        </div>

        {/* LIDAR Visualization */}
        <div className="lidar-section">
          <h3>LIDAR Scan</h3>
          <canvas
            ref={canvasRef}
            width={400}
            height={400}
            className="lidar-canvas"
          />
        </div>

        {/* Odometry Data */}
        <div className="odometry-section">
          <h3>Odometry</h3>
          {odomData ? (
            <div className="odom-data">
              <div className="odom-group">
                <h4>Position (m)</h4>
                <p>X: {odomData.position.x}</p>
                <p>Y: {odomData.position.y}</p>
                <p>Z: {odomData.position.z}</p>
              </div>
              <div className="odom-group">
                <h4>Linear Velocity (m/s)</h4>
                <p>X: {odomData.linear.x}</p>
                <p>Y: {odomData.linear.y}</p>
              </div>
              <div className="odom-group">
                <h4>Angular Velocity (rad/s)</h4>
                <p>Z: {odomData.angular.z}</p>
              </div>
            </div>
          ) : (
            <div className="no-data">Waiting for odometry data...</div>
          )}
        </div>
      </div>
    </div>
  );
};

export default GazeboSimViewer;
