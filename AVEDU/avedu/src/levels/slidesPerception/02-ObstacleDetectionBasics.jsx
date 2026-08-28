// src/levels/slidesPerception/02-ObstacleDetectionBasics.jsx
import React from "react";
import { SlideCodeSnippet, SlideGrid, SlideFeatured, SlidePipeline, SlidePipelineArrow } from "../../components/slides/SlideLayout";

export const meta = {
  id: "obstacle-detection-basics",
  title: "Obstacle Detection Basics",
  order: 1,
  objectiveCode: "PERC_OBSTACLE_DETECT",
};

const CODE_LIDAR_DETECTION = `from sensor_msgs.msg import LaserScan

class ObstacleDetector(Node):
    def __init__(self):
        super().__init__('obstacle_detector')
        self.subscription = self.create_subscription(
            LaserScan,
            '/scan',
            self.scan_callback,
            10)
        self.min_distance = 0.5  # meters

    def scan_callback(self, msg):
        obstacles = []
        for i, distance in enumerate(msg.ranges):
            if 0 < distance < self.min_distance:
                # Calculate angle of this reading
                angle = msg.angle_min + i * msg.angle_increment
                obstacles.append({
                    'distance': distance,
                    'angle': angle
                })

        if obstacles:
            self.get_logger().warn(
                f'Detected {len(obstacles)} obstacles!')`;

export default function ObstacleDetectionBasics() {
  return (
    <div className="slide">
      <h2>Obstacle Detection Basics</h2>

      <div className="slide-card">
        <div className="slide-card__title">What is Obstacle Detection?</div>
        <p>
          <b>Obstacle detection</b> is the process of identifying objects in the vehicle's path
          that could pose a collision risk. This is one of the most critical perception tasks
          for autonomous vehicles.
        </p>
        <p>
          Obstacles can be detected using various sensors: LiDAR for precise 3D measurements,
          cameras for visual recognition, and radar for velocity estimation.
        </p>
      </div>

      <div className="slide-card">
        <div className="slide-card__title">LiDAR-Based Obstacle Detection</div>
        <p>LiDAR provides 3D point clouds that can be processed to detect obstacles:</p>
        <SlideGrid col={2} className="slide-gap-md slide-mt-md">
          <SlideFeatured variant="blue">
            <b>1. Ground Removal</b>
            <p className="slide-text--sm slide-mt-sm">
              Remove ground points using RANSAC plane fitting or height thresholding
              to isolate potential obstacles.
            </p>
          </SlideFeatured>

          <SlideFeatured variant="magenta">
            <b>2. Clustering</b>
            <p className="slide-text--sm slide-mt-sm">
              Group nearby points into clusters using Euclidean clustering or DBSCAN
              to identify individual objects.
            </p>
          </SlideFeatured>

          <SlideFeatured variant="orange">
            <b>3. Bounding Box Fitting</b>
            <p className="slide-text--sm slide-mt-sm">
              Fit 3D bounding boxes around each cluster to estimate object
              position, size, and orientation.
            </p>
          </SlideFeatured>

          <SlideFeatured variant="green">
            <b>4. Classification</b>
            <p className="slide-text--sm slide-mt-sm">
              Classify detected objects (car, pedestrian, cyclist) using shape
              features or neural networks.
            </p>
          </SlideFeatured>
        </SlideGrid>
      </div>

      <div className="slide-card">
        <div className="slide-card__title">Simple LiDAR Obstacle Detection Code</div>
        <SlideCodeSnippet code={CODE_LIDAR_DETECTION} language="python" />
      </div>

      <div className="slide-card slide-card--aside">
        <div>
          <div className="slide-card__title">Camera-Based Obstacle Detection</div>
          <ul>
            <li><b>Traditional CV:</b> HOG + SVM for pedestrian detection</li>
            <li><b>Deep Learning:</b> YOLO, SSD, Faster R-CNN for multi-class detection</li>
            <li><b>Depth Estimation:</b> Monocular depth networks or stereo matching</li>
            <li><b>Sensor Fusion:</b> Combine camera detections with LiDAR for accuracy</li>
          </ul>
        </div>
        <div className="slide-callout slide-callout--info">
          <b>Sensor Fusion:</b> Combining LiDAR and camera data provides the best results:
          LiDAR gives accurate distance, while cameras provide rich semantic information
          for classification.
        </div>
      </div>

      <div className="slide-card">
        <div className="slide-card__title">Obstacle Detection Pipeline</div>
        <SlidePipeline steps={5} className="slide-mt-md">
          <SlideFeatured variant="blue" className="slide-flex--col slide-items-center slide-text-center">
            <b>Sensor Data</b>
            <p className="slide-text--xs slide-mt-sm">/scan, /points</p>
          </SlideFeatured>
          <SlidePipelineArrow />
          <SlideFeatured variant="magenta" className="slide-flex--col slide-items-center slide-text-center">
            <b>Filter</b>
            <p className="slide-text--xs slide-mt-sm">Remove ground</p>
          </SlideFeatured>
          <SlidePipelineArrow />
          <SlideFeatured variant="orange" className="slide-flex--col slide-items-center slide-text-center">
            <b>Cluster</b>
            <p className="slide-text--xs slide-mt-sm">Group points</p>
          </SlideFeatured>
          <SlidePipelineArrow />
          <SlideFeatured variant="green" className="slide-flex--col slide-items-center slide-text-center">
            <b>Publish</b>
            <p className="slide-text--xs slide-mt-sm">/obstacles</p>
          </SlideFeatured>
        </SlidePipeline>
      </div>
    </div>
  );
}

