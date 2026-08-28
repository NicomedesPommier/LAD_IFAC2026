// src/levels/slidesPerception/04-PerceptionTasks.jsx
import React from "react";
import { SlideCodeSnippet, SlideGrid, SlideFeatured, SlidePipeline, SlidePipelineArrow } from "../../components/slides/SlideLayout";

export const meta = {
  id: "perception-tasks",
  title: "Autonomous Vehicle Perception Tasks",
  order: 1,
  objectiveCode: "PERC_TASKS_COMPLETE",
};

export default function PerceptionTasks() {
  return (
    <div className="slide">
      <h2>Autonomous Vehicle Perception Tasks</h2>

      <div className="slide-card">
        <div className="slide-card__title">Overview of AV Perception</div>
        <p>
          Autonomous vehicles rely on a comprehensive perception system that combines multiple
          sensors and algorithms to understand the driving environment. This unit summarizes
          the key perception tasks required for safe autonomous driving.
        </p>
      </div>

      <div className="slide-card">
        <div className="slide-card__title">Core Perception Tasks</div>
        <SlideGrid col={3} className="slide-gap-md slide-mt-md">
          <SlideFeatured variant="blue">
            <b>Object Detection</b>
            <p className="slide-text--sm slide-mt-sm">
              Identify vehicles, pedestrians, cyclists, and other road users using cameras and LiDAR.
            </p>
            <div className="slide-text--xs slide-text-muted slide-mt-sm">
              Topics: /detections, /objects
            </div>
          </SlideFeatured>

          <SlideFeatured variant="magenta">
            <b>Lane Detection</b>
            <p className="slide-text--sm slide-mt-sm">
              Find lane markings and road boundaries for lane keeping and lane change maneuvers.
            </p>
            <div className="slide-text--xs slide-text-muted slide-mt-sm">
              Topics: /lanes, /road_geometry
            </div>
          </SlideFeatured>

          <SlideFeatured variant="orange">
            <b>Free Space Detection</b>
            <p className="slide-text--sm slide-mt-sm">
              Determine drivable areas and obstacles to avoid in the vehicle's path.
            </p>
            <div className="slide-text--xs slide-text-muted slide-mt-sm">
              Topics: /free_space, /occupancy_grid
            </div>
          </SlideFeatured>

          <SlideFeatured variant="green">
            <b>Traffic Sign Recognition</b>
            <p className="slide-text--sm slide-mt-sm">
              Detect and classify traffic signs (speed limits, stop signs, yields).
            </p>
            <div className="slide-text--xs slide-text-muted slide-mt-sm">
              Topics: /traffic_signs
            </div>
          </SlideFeatured>

          <SlideFeatured variant="red">
            <b>Traffic Light Detection</b>
            <p className="slide-text--sm slide-mt-sm">
              Identify traffic light states (red, yellow, green) for intersection navigation.
            </p>
            <div className="slide-text--xs slide-text-muted slide-mt-sm">
              Topics: /traffic_lights
            </div>
          </SlideFeatured>

          <SlideFeatured variant="purple">
            <b>Object Tracking</b>
            <p className="slide-text--sm slide-mt-sm">
              Track detected objects across frames to predict their motion trajectories.
            </p>
            <div className="slide-text--xs slide-text-muted slide-mt-sm">
              Topics: /tracks, /predictions
            </div>
          </SlideFeatured>
        </SlideGrid>
      </div>

      <div className="slide-card">
        <div className="slide-card__title">Sensor Fusion Architecture</div>
        <SlidePipeline steps={3} className="slide-mt-md">
          {/* Sensors Column */}
          <div className="slide-flex slide-flex--col slide-gap-sm">
            <SlideFeatured variant="blue" className="slide-text-center">
              <b>Camera</b>
              <div className="slide-text--xs">RGB, Semantic</div>
            </SlideFeatured>
            <SlideFeatured variant="magenta" className="slide-text-center">
              <b>LiDAR</b>
              <div className="slide-text--xs">3D Point Cloud</div>
            </SlideFeatured>
            <SlideFeatured variant="orange" className="slide-text-center">
              <b>Radar</b>
              <div className="slide-text--xs">Velocity, Range</div>
            </SlideFeatured>
          </div>

          <SlidePipelineArrow />

          {/* Fusion */}
          <SlideFeatured variant="green" className="slide-flex--col slide-justify-center slide-text-center slide-h-full">
            <b>Sensor Fusion</b>
            <div className="slide-text--xs slide-mt-sm">
              Early / Late / Deep Fusion
            </div>
          </SlideFeatured>

          <SlidePipelineArrow />

          {/* Output */}
          <div className="slide-flex slide-flex--col slide-gap-sm">
            <SlideFeatured variant="purple" className="slide-text-center">
              <b>3D Objects</b>
            </SlideFeatured>
            <SlideFeatured variant="purple" className="slide-text-center">
              <b>Lane Model</b>
            </SlideFeatured>
            <SlideFeatured variant="purple" className="slide-text-center">
              <b>Free Space</b>
            </SlideFeatured>
          </div>
        </SlidePipeline>
      </div>

      <div className="slide-card slide-card--aside">
        <div>
          <div className="slide-card__title">Perception Challenges</div>
          <ul>
            <li><b>Adverse Weather:</b> Rain, fog, snow degrade sensor performance</li>
            <li><b>Lighting Conditions:</b> Glare, low light, tunnels</li>
            <li><b>Occlusions:</b> Objects hidden by other vehicles or structures</li>
            <li><b>Edge Cases:</b> Unusual objects, debris, construction zones</li>
            <li><b>Real-time Processing:</b> Must process at sensor frame rate (10-30 Hz)</li>
          </ul>
        </div>
        <div className="slide-callout slide-callout--info">
          <b>Industry Standard:</b> Modern AV stacks use multiple redundant sensors and
          deep learning models trained on millions of miles of driving data to handle
          these challenges robustly.
        </div>
      </div>

      <div className="slide-card">
        <div className="slide-card__title">ROS 2 Perception Messages</div>
        <SlideGrid col={2} className="slide-gap-md slide-mt-md">
          <div className="slide-featured">
            <b>vision_msgs</b>
            <pre className="slide-code slide-code--sm slide-mt-sm">
              {`Detection2D
Detection3D
Detection2DArray
Detection3DArray
BoundingBox2D
BoundingBox3D
ObjectHypothesis`}
            </pre>
          </div>
          <div className="slide-featured">
            <b>Common Topics</b>
            <pre className="slide-code slide-code--sm slide-mt-sm">
              {`/camera/image_raw
/scan (LaserScan)
/points (PointCloud2)
/detections_2d
/detections_3d
/tracks`}
            </pre>
          </div>
        </SlideGrid>
      </div>

      <div className="slide-card">
        <div className="slide-card__title">Perception Unit Summary</div>
        <p>In this unit, you learned:</p>
        <ul className="slide-mt-sm">
          <li><b>Perception Libraries:</b> OpenCV, PCL, TensorFlow for sensor processing</li>
          <li><b>Obstacle Detection:</b> LiDAR-based clustering and camera-based detection</li>
          <li><b>Lane Detection:</b> Traditional CV pipelines and deep learning approaches</li>
          <li><b>Sensor Fusion:</b> Combining multiple sensors for robust perception</li>
        </ul>
        <div className="slide-callout slide-callout--success slide-mt-md">
          <b>Next Steps:</b> Apply these perception concepts in the Simulation unit to
          test your algorithms in Gazebo, then integrate with Planning and Control
          for full autonomous driving!
        </div>
      </div>
    </div>
  );
}

