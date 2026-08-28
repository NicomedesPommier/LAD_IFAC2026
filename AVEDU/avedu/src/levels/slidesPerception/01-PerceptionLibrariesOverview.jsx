// src/levels/slidesPerception/01-PerceptionLibrariesOverview.jsx
import React from "react";

export const meta = {
  id: "perception-libraries-overview",
  title: "Perception Libraries Overview",
  order: 1,
  objectiveCode: "PERC_LIBRARIES_INTRO",
};

export default function PerceptionLibrariesOverview() {
  return (
    <div className="slide">
      <h2>Perception Libraries Overview</h2>

      <div className="slide-card">
        <div className="slide-card__title">What is Perception in Autonomous Vehicles?</div>
        <p>
          <b>Perception</b> is the ability of an autonomous vehicle to understand its environment
          by processing sensor data. This includes detecting objects, recognizing lanes, estimating
          distances, and tracking moving entities.
        </p>
        <p>
          In ROS 2, perception tasks typically involve processing camera images, LiDAR point clouds,
          and radar data to create a comprehensive understanding of the surroundings.
        </p>
      </div>

      <div className="slide-card">
        <div className="slide-card__title">Key Perception Libraries</div>
        <div className="slide-grid slide-grid--2 slide-mt-md">
          <div className="slide-featured">
            <b>OpenCV</b>
            <p className="slide-text--sm slide-mt-sm">
              Computer vision library for image processing, feature detection, object recognition, and camera calibration.
            </p>
            <code className="slide-text--sm">cv2, cv_bridge</code>
          </div>

          <div className="slide-featured slide-featured--magenta">
            <b>PCL (Point Cloud Library)</b>
            <p className="slide-text--sm slide-mt-sm">
              3D point cloud processing for LiDAR data, segmentation, filtering, and object detection.
            </p>
            <code className="slide-text--sm">pcl_ros, pcl_conversions</code>
          </div>

          <div className="slide-featured slide-featured--yellow">
            <b>TensorFlow / PyTorch</b>
            <p className="slide-text--sm slide-mt-sm">
              Deep learning frameworks for neural network-based object detection (YOLO, SSD, Faster R-CNN).
            </p>
            <code className="slide-text--sm">tensorflow, torch</code>
          </div>

          <div className="slide-featured slide-featured--green">
            <b>image_geometry</b>
            <p className="slide-text--sm slide-mt-sm">
              ROS 2 package for camera geometry, projecting 3D points to 2D images and vice versa.
            </p>
            <code className="slide-text--sm">image_geometry</code>
          </div>
        </div>
      </div>

      <div className="slide-card slide-card--aside">
        <div>
          <div className="slide-card__title">ROS 2 Perception Stack</div>
          <ul>
            <li><b>sensor_msgs:</b> Standard message types for sensors (Image, PointCloud2, LaserScan)</li>
            <li><b>vision_msgs:</b> Detection and classification message types</li>
            <li><b>cv_bridge:</b> Converts ROS images to OpenCV format</li>
            <li><b>image_transport:</b> Efficient image topic transmission</li>
            <li><b>perception_pcl:</b> PCL integration with ROS 2</li>
          </ul>
        </div>
        <div className="slide-callout slide-callout--info">
          <b>Key Concept:</b> The perception pipeline takes raw sensor data and transforms it
          into meaningful information (detected objects, lane markings, free space) that other
          systems can use for planning and control.
        </div>
      </div>

      <div className="slide-card">
        <div className="slide-card__title">Perception Pipeline in ROS 2</div>
        <div className="slide-pipeline">
          <div className="slide-featured">
            <b>Raw Data</b>
            <p className="slide-text--sm">Camera, LiDAR</p>
          </div>

          <div className="slide-pipeline__arrow">→</div>

          <div className="slide-featured slide-featured--magenta">
            <b>Preprocessing</b>
            <p className="slide-text--sm">Filter, Transform</p>
          </div>

          <div className="slide-pipeline__arrow">→</div>

          <div className="slide-featured slide-featured--yellow">
            <b>Detection</b>
            <p className="slide-text--sm">Objects, Lanes</p>
          </div>

          <div className="slide-pipeline__arrow">→</div>

          <div className="slide-featured slide-featured--green">
            <b>Output</b>
            <p className="slide-text--sm">Detections, Tracks</p>
          </div>
        </div>
      </div>
    </div>
  );
}

