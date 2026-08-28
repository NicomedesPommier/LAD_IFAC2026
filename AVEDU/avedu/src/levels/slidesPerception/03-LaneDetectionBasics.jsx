// src/levels/slidesPerception/03-LaneDetectionBasics.jsx
import React from "react";
import { SlideCodeSnippet, SlideGrid, SlideFeatured, SlidePipeline, SlidePipelineArrow } from "../../components/slides/SlideLayout";

export const meta = {
  id: "lane-detection-basics",
  title: "Lane Detection Basics",
  order: 1,
  objectiveCode: "PERC_LANE_DETECT",
};

const CODE_LANE_DETECTION = `import cv2
import numpy as np

def detect_lanes(image):
    # Convert to grayscale
    gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)

    # Apply Gaussian blur
    blur = cv2.GaussianBlur(gray, (5, 5), 0)

    # Canny edge detection
    edges = cv2.Canny(blur, 50, 150)

    # Define region of interest (trapezoid)
    height, width = edges.shape
    roi_vertices = np.array([
        [(width * 0.1, height),
         (width * 0.4, height * 0.6),
         (width * 0.6, height * 0.6),
         (width * 0.9, height)]
    ], dtype=np.int32)

    mask = np.zeros_like(edges)
    cv2.fillPoly(mask, roi_vertices, 255)
    masked_edges = cv2.bitwise_and(edges, mask)

    # Hough Line Transform
    lines = cv2.HoughLinesP(
        masked_edges, rho=1, theta=np.pi/180,
        threshold=50, minLineLength=100, maxLineGap=50
    )

    return lines`;

const CODE_WHITE_LANES = `# HLS thresholding for white
lower = np.array([0, 200, 0])
upper = np.array([255, 255, 255])
white_mask = cv2.inRange(hls, lower, upper)`;

const CODE_YELLOW_LANES = `# HSV thresholding for yellow
lower = np.array([15, 100, 100])
upper = np.array([35, 255, 255])
yellow_mask = cv2.inRange(hsv, lower, upper)`;

export default function LaneDetectionBasics() {
  return (
    <div className="slide">
      <h2>Lane Detection Basics</h2>

      <div className="slide-card">
        <div className="slide-card__title">What is Lane Detection?</div>
        <p>
          <b>Lane detection</b> is the process of identifying road lane markings from camera
          images. This is essential for lane keeping, lane departure warnings, and autonomous
          highway driving.
        </p>
        <p>
          Modern lane detection combines traditional computer vision techniques with deep
          learning for robust performance in various conditions.
        </p>
      </div>

      <div className="slide-card">
        <div className="slide-card__title">Traditional Lane Detection Pipeline</div>
        <SlideGrid col={2} className="slide-gap-md slide-mt-md">
          <SlideFeatured variant="blue">
            <b>1. Region of Interest (ROI)</b>
            <p className="slide-text--sm slide-mt-sm">
              Crop the image to focus only on the road area, typically the bottom
              half of the image in a trapezoidal shape.
            </p>
          </SlideFeatured>

          <SlideFeatured variant="magenta">
            <b>2. Color Thresholding</b>
            <p className="slide-text--sm slide-mt-sm">
              Convert to HSV/HLS and extract white and yellow lane markings
              using color masks.
            </p>
          </SlideFeatured>

          <SlideFeatured variant="orange">
            <b>3. Edge Detection</b>
            <p className="slide-text--sm slide-mt-sm">
              Apply Canny edge detection to find the boundaries of lane lines
              in the thresholded image.
            </p>
          </SlideFeatured>

          <SlideFeatured variant="green">
            <b>4. Hough Transform</b>
            <p className="slide-text--sm slide-mt-sm">
              Use Hough Line Transform to detect straight line segments
              from the edge image.
            </p>
          </SlideFeatured>
        </SlideGrid>
      </div>

      <div className="slide-card">
        <div className="slide-card__title">Lane Detection Code Example</div>
        <SlideCodeSnippet code={CODE_LANE_DETECTION} language="python" />
      </div>

      <div className="slide-card slide-card--aside">
        <div>
          <div className="slide-card__title">Perspective Transform</div>
          <p>
            For more accurate lane detection, we can use perspective transform (bird's-eye view)
            to convert the camera image to a top-down view:
          </p>
          <ul>
            <li><b>Warp perspective:</b> Transform road to bird's-eye view</li>
            <li><b>Fit polynomial:</b> Fit curves to lane pixels</li>
            <li><b>Calculate curvature:</b> Estimate road curvature</li>
            <li><b>Unwarp:</b> Project lanes back to original view</li>
          </ul>
        </div>
        <div className="slide-callout slide-callout--info">
          <b>Deep Learning:</b> Modern approaches use CNNs like LaneNet, SCNN, or PINet
          for end-to-end lane detection, achieving better robustness in challenging conditions
          like shadows, occlusions, and varying weather.
        </div>
      </div>

      <div className="slide-card">
        <div className="slide-card__title">Lane Detection Pipeline</div>
        <SlidePipeline steps={5} className="slide-mt-md">
          <SlideFeatured variant="blue" className="slide-flex--col slide-items-center slide-text-center">
            <b>Camera</b>
          </SlideFeatured>
          <SlidePipelineArrow />
          <SlideFeatured variant="magenta" className="slide-flex--col slide-items-center slide-text-center">
            <b>ROI</b>
          </SlideFeatured>
          <SlidePipelineArrow />
          <SlideFeatured variant="orange" className="slide-flex--col slide-items-center slide-text-center">
            <b>Edges</b>
          </SlideFeatured>
          <SlidePipelineArrow />
          <SlideFeatured variant="green" className="slide-flex--col slide-items-center slide-text-center">
            <b>Hough</b>
          </SlideFeatured>
          <SlidePipelineArrow />
          <SlideFeatured variant="default" className="slide-flex--col slide-items-center slide-text-center">
            <b>Lanes</b>
          </SlideFeatured>
        </SlidePipeline>
      </div>

      <div className="slide-card">
        <div className="slide-card__title">Color Space for Lane Detection</div>
        <SlideGrid col={2} className="slide-gap-md slide-mt-md">
          <div className="slide-featured">
            <b>White Lanes (HLS)</b>
            <pre className="slide-code slide-code--sm slide-mt-sm">{CODE_WHITE_LANES}</pre>
          </div>

          <div className="slide-featured slide-featured--orange">
            <b>Yellow Lanes (HSV)</b>
            <pre className="slide-code slide-code--sm slide-mt-sm">{CODE_YELLOW_LANES}</pre>
          </div>
        </SlideGrid>
      </div>
    </div>
  );
}

