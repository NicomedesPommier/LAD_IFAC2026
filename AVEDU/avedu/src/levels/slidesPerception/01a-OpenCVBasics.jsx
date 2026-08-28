// src/levels/slidesPerception/01a-OpenCVBasics.jsx
import React from "react";
import { SlideCodeSnippet } from "../../components/slides/SlideLayout";

export const meta = {
  id: "opencv-basics",
  title: "OpenCV Basics for ROS 2",
  order: 2,
  objectiveCode: "PERC_OPENCV_BASICS",
};

const CODE_CV_BRIDGE = `import cv2
from cv_bridge import CvBridge
from sensor_msgs.msg import Image

class ImageProcessor(Node):
    def __init__(self):
        super().__init__('image_processor')
        self.bridge = CvBridge()
        self.subscription = self.create_subscription(
            Image,
            '/camera/image_raw',
            self.image_callback,
            10)

    def image_callback(self, msg):
        # Convert ROS Image to OpenCV format
        cv_image = self.bridge.imgmsg_to_cv2(
            msg, desired_encoding='bgr8')

        # Process with OpenCV
        gray = cv2.cvtColor(cv_image, cv2.COLOR_BGR2GRAY)
        edges = cv2.Canny(gray, 50, 150)

        # Convert back to ROS Image if needed
        ros_image = self.bridge.cv2_to_imgmsg(
            edges, encoding='mono8')`;

const CODE_COLOR = `gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
hsv = cv2.cvtColor(img, cv2.COLOR_BGR2HSV)`;

const CODE_EDGE = `edges = cv2.Canny(gray, 50, 150)
# Gaussian blur first for noise reduction
blur = cv2.GaussianBlur(gray, (5, 5), 0)`;

const CODE_THRESH = `_, binary = cv2.threshold(
    gray, 127, 255, cv2.THRESH_BINARY)
adaptive = cv2.adaptiveThreshold(
    gray, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C,
    cv2.THRESH_BINARY, 11, 2)`;

const CODE_CONTOUR = `contours, _ = cv2.findContours(
    binary, cv2.RETR_EXTERNAL,
    cv2.CHAIN_APPROX_SIMPLE)
cv2.drawContours(img, contours, -1,
    (0, 255, 0), 2)`;

export default function OpenCVBasics() {
  return (
    <div className="slide">
      <h2>OpenCV Basics for ROS 2</h2>

      <div className="slide-card">
        <div className="slide-card__title">What is OpenCV?</div>
        <p>
          <b>OpenCV (Open Source Computer Vision Library)</b> is the most widely used library
          for computer vision tasks. It provides over 2,500 optimized algorithms for image
          and video analysis.
        </p>
        <p>
          In ROS 2, OpenCV is used through the <code>cv_bridge</code> package, which converts
          between ROS Image messages and OpenCV's <code>cv::Mat</code> format.
        </p>
      </div>

      <div className="slide-card">
        <div className="slide-card__title">Using cv_bridge in ROS 2</div>
        <SlideCodeSnippet code={CODE_CV_BRIDGE} language="python" />
      </div>

      <div className="slide-card">
        <div className="slide-card__title">Common OpenCV Operations</div>
        <div className="slide-grid slide-grid--2 slide-gap-md slide-mt-md">
          <div className="slide-featured slide-featured--blue">
            <b>Color Space Conversion</b>
            <pre className="slide-code slide-code--sm slide-mt-sm">{CODE_COLOR}</pre>
          </div>

          <div className="slide-featured slide-featured--magenta">
            <b>Edge Detection</b>
            <pre className="slide-code slide-code--sm slide-mt-sm">{CODE_EDGE}</pre>
          </div>

          <div className="slide-featured slide-featured--orange">
            <b>Thresholding</b>
            <pre className="slide-code slide-code--sm slide-mt-sm">{CODE_THRESH}</pre>
          </div>

          <div className="slide-featured slide-featured--green">
            <b>Contour Detection</b>
            <pre className="slide-code slide-code--sm slide-mt-sm">{CODE_CONTOUR}</pre>
          </div>
        </div>
      </div>

      <div className="slide-card slide-card--aside">
        <div>
          <div className="slide-card__title">Key cv_bridge Functions</div>
          <ul>
            <li><b>imgmsg_to_cv2(msg, encoding):</b> Convert ROS Image to OpenCV Mat</li>
            <li><b>cv2_to_imgmsg(cv_image, encoding):</b> Convert OpenCV Mat to ROS Image</li>
            <li><b>compressed_imgmsg_to_cv2():</b> Handle compressed images</li>
            <li><b>cv2_to_compressed_imgmsg():</b> Create compressed images</li>
          </ul>
        </div>
        <div className="slide-callout slide-callout--warning">
          <b>Encoding Note:</b> Common encodings are 'bgr8' (color), 'rgb8' (color),
          'mono8' (grayscale), and '32FC1' (depth). Make sure to use the correct
          encoding for your sensor!
        </div>
      </div>
    </div>
  );
}

