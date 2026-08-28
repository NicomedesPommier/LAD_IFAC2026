// Perception nodes: lane detection (OpenCV) + LIDAR obstacle detector.

import { pascalCase, enforceWorkspace } from "./utils";

const SECTOR_DEGS = {
  front: { minDeg:  -30, maxDeg:   30 },
  left:  { minDeg:   60, maxDeg:  120 },
  rear:  { minDeg:  150, maxDeg:  210 },
  right: { minDeg:  240, maxDeg:  300 },
  all:   { minDeg:    0, maxDeg:  360 },
};

export function generateLaneDetectionCode(d) {
  if (!d) return "";

  const {
    nodeName      = "lane_detector",
    cameraTopic   = "/camera/image_raw",
    outputTopic   = "/lane_detection/image",
    laneTopic     = "/lane_center",
    method        = "combined",
    roiTop        = 45,
    cannyLow      = 50,
    cannyHigh     = 150,
    hsvPreset     = "white+yellow",
    minLineLen    = 40,
    maxLineGap    = 20,
    canvasId,
  } = d;

  const isQCarMode = d?.isQCarMode || false;
  const ctx = { canvasId, isQCarMode };

  const internalCameraTopic = enforceWorkspace(cameraTopic, ctx);
  const internalOutputTopicTmp = enforceWorkspace(outputTopic, ctx);
  const internalOutputTopic = internalOutputTopicTmp.replace(/\/compressed$/, '') + '/compressed';
  const internalLaneTopic = enforceWorkspace(laneTopic, ctx);

  const cameraIsCompressed = internalCameraTopic.endsWith('/compressed');

  const className = pascalCase(nodeName);

  const useHsv   = method === "hsv"   || method === "combined";
  const useCanny = method === "canny" || method === "combined";
  const roiFrac  = (1.0 - roiTop / 100.0).toFixed(4);

  const hsvLines = !useHsv ? "" :
    (hsvPreset === "yellow"
      ? `        # ── HSV colour mask (yellow lanes) ───────────────────────────────────────
        hsv          = cv2.cvtColor(frame, cv2.COLOR_BGR2HSV)
        lower_yellow = np.array([15,  80,  80],  dtype=np.uint8)
        upper_yellow = np.array([40,  255, 255], dtype=np.uint8)
        color_mask   = cv2.inRange(hsv, lower_yellow, upper_yellow)`
      : hsvPreset === "white"
      ? `        # ── HSV colour mask (white lanes) ────────────────────────────────────────
        hsv         = cv2.cvtColor(frame, cv2.COLOR_BGR2HSV)
        lower_white = np.array([0,   0,   180], dtype=np.uint8)
        upper_white = np.array([255, 40,  255], dtype=np.uint8)
        color_mask  = cv2.inRange(hsv, lower_white, upper_white)`
      : `        # ── HSV colour mask (white + yellow lanes) ──────────────────────────────
        hsv          = cv2.cvtColor(frame, cv2.COLOR_BGR2HSV)
        lower_white  = np.array([0,   0,   180], dtype=np.uint8)
        upper_white  = np.array([255, 40,  255], dtype=np.uint8)
        mask_white   = cv2.inRange(hsv, lower_white, upper_white)
        lower_yellow = np.array([15,  80,  80],  dtype=np.uint8)
        upper_yellow = np.array([40,  255, 255], dtype=np.uint8)
        mask_yellow  = cv2.inRange(hsv, lower_yellow, upper_yellow)
        color_mask   = cv2.bitwise_or(mask_white, mask_yellow)`);

  const cannyGraySrc = useHsv
    ? "cv2.cvtColor(cv2.bitwise_and(frame, frame, mask=color_mask), cv2.COLOR_BGR2GRAY)"
    : "cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)";
  const cannyLines = !useCanny
    ? `        # Use colour mask directly as edge source
        edges = color_mask`
    : `        # ── Canny edge detection ─────────────────────────────────────────────────
        gray    = ${cannyGraySrc}
        blurred = cv2.GaussianBlur(gray, (5, 5), 0)
        edges   = cv2.Canny(blurred, self.canny_low, self.canny_high)`;

  return `#!/usr/bin/env python3
# =============================================================================
# 🧩 This file was generated from visual blocks!
# You can edit it as text, but re-opening it will show the block editor.
# =============================================================================
#
# Lane Detection Node
# Camera  : ${cameraTopic}
# Method  : ${method}
# ROI     : bottom ${roiTop}% of image
# Outputs : ${outputTopic}  (annotated Image)
#           ${laneTopic}  (Float32 offset, range −1..+1)
# =============================================================================

import cv2
import numpy as np
import rclpy
from rclpy.node import Node
from sensor_msgs.msg import ${cameraIsCompressed ? "CompressedImage" : "Image, CompressedImage"}${cameraIsCompressed ? "" : "\nfrom cv_bridge import CvBridge"}
from std_msgs.msg import Float32


class ${className}(Node):
    def __init__(self):
        super().__init__('${nodeName}')

        self.declare_parameter('camera_topic',      '${internalCameraTopic}')
        self.declare_parameter('output_topic',      '${internalOutputTopic}')
        self.declare_parameter('lane_topic',        '${internalLaneTopic}')
        self.declare_parameter('roi_top_percent',   ${roiTop})
        self.declare_parameter('canny_low',         ${cannyLow})
        self.declare_parameter('canny_high',        ${cannyHigh})
        self.declare_parameter('min_line_length',   ${minLineLen})
        self.declare_parameter('max_line_gap',      ${maxLineGap})

        cam_topic  = self.get_parameter('camera_topic').value
        out_topic  = self.get_parameter('output_topic').value
        lane_topic = self.get_parameter('lane_topic').value
        self.roi_top     = self.get_parameter('roi_top_percent').value
        self.canny_low   = self.get_parameter('canny_low').value
        self.canny_high  = self.get_parameter('canny_high').value
        self.min_line_len = self.get_parameter('min_line_length').value
        self.max_line_gap = self.get_parameter('max_line_gap').value

        ${cameraIsCompressed ? "" : "self.bridge = CvBridge()\n        "}
        self.sub = self.create_subscription(
            ${cameraIsCompressed ? "CompressedImage" : "Image"}, cam_topic, self.image_callback, 10)

        # Publish a CompressedImage so the frontend RosRxPanel can render it directly
        self.pub_image = self.create_publisher(CompressedImage, out_topic,  10)
        self.pub_lane  = self.create_publisher(Float32,         lane_topic, 10)

        self.get_logger().info(
            f'Lane detector ready — camera: {cam_topic}'
            f' | output: {out_topic}'
            f' | lane: {lane_topic}'
        )

    def apply_roi(self, img):
        """Trapezoidal mask — keeps only the bottom ${roiTop}% of the image."""
        h, w = img.shape[:2]
        y_top = int(h * ${roiFrac})
        pts   = np.array([[
            (int(w * 0.05), h),
            (int(w * 0.35), y_top),
            (int(w * 0.65), y_top),
            (int(w * 0.95), h),
        ]], dtype=np.int32)
        mask = np.zeros_like(img)
        cv2.fillPoly(mask, pts, 255 if img.ndim == 2 else (255, 255, 255))
        return cv2.bitwise_and(img, mask)

    def fit_lines(self, edges, shape):
        """Detect Hough segments, split into left/right, fit one line each."""
        h, w = shape[:2]
        raw = cv2.HoughLinesP(
            edges, rho=1, theta=np.pi / 180, threshold=40,
            minLineLength=self.min_line_len, maxLineGap=self.max_line_gap)

        left_pts, right_pts = [], []
        if raw is not None:
            for seg in raw:
                x1, y1, x2, y2 = seg[0]
                if x2 == x1:
                    continue
                slope = (y2 - y1) / (x2 - x1)
                if abs(slope) < 0.3:
                    continue
                (left_pts if slope < 0 else right_pts).extend([(x1, y1), (x2, y2)])

        y_bot = h
        y_top = int(h * ${roiFrac})

        def make_line(pts):
            if len(pts) < 2:
                return None
            arr = np.array(pts, dtype=np.float32)
            [vx, vy, cx, cy] = cv2.fitLine(arr, cv2.DIST_L2, 0, 0.01, 0.01)
            s = float(vy) / (float(vx) + 1e-9)
            return (int(float(cx) + (y_bot - float(cy)) / s), y_bot,
                    int(float(cx) + (y_top - float(cy)) / s), y_top)

        return make_line(left_pts), make_line(right_pts)

    def image_callback(self, msg):
        try:
            ${cameraIsCompressed
              ? `# CompressedImage — decode with OpenCV directly (no cv_bridge needed)
            np_arr = np.frombuffer(msg.data, np.uint8)
            frame  = cv2.imdecode(np_arr, cv2.IMREAD_COLOR)`
              : `frame = self.bridge.imgmsg_to_cv2(msg, desired_encoding='bgr8')`}
        except Exception as exc:
            self.get_logger().error(f'decode error: {exc}')
            return

        h, w   = frame.shape[:2]
        output = frame.copy()

${hsvLines}
${cannyLines}

        roi_edges              = self.apply_roi(edges)
        left_line, right_line  = self.fit_lines(roi_edges, frame.shape)

        lane_cx     = w / 2.0
        lines_found = 0

        for line, col in [(left_line, (0, 255, 255)), (right_line, (0, 255, 255))]:
            if line:
                cv2.line(output, (line[0], line[1]), (line[2], line[3]), col, 3)
                lines_found += 1

        if left_line and right_line:
            lane_cx = (left_line[0] + right_line[0]) / 2.0
            poly = np.array([
                [left_line[0],  left_line[1]],
                [left_line[2],  left_line[3]],
                [right_line[2], right_line[3]],
                [right_line[0], right_line[1]],
            ], np.int32)
            overlay = output.copy()
            cv2.fillPoly(overlay, [poly], (0, 229, 255))
            cv2.addWeighted(overlay, 0.18, output, 0.82, 0, output)

        y_top = int(h * ${roiFrac})
        cx    = int(lane_cx)
        cv2.line(output,   (cx, h), (cx, y_top), (0, 200, 255), 2)
        cv2.circle(output, (cx, h - 10), 5, (0, 200, 255), -1)

        offset = (lane_cx - w / 2.0) / (w / 2.0)
        cv2.putText(output, f'offset: {offset:+.2f}  lines: {lines_found}',
                    (10, 30), cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 229, 255), 2)

        out_msg              = CompressedImage()
        out_msg.header.stamp = self.get_clock().now().to_msg()
        out_msg.format       = 'jpeg'
        out_msg.data         = cv2.imencode('.jpg', output)[1].tobytes()
        self.pub_image.publish(out_msg)
        lane_msg      = Float32()
        lane_msg.data = float(np.clip(offset, -1.0, 1.0))
        self.pub_lane.publish(lane_msg)


def main(args=None):
    rclpy.init(args=args)
    node = ${className}()
    try:
        rclpy.spin(node)
    except KeyboardInterrupt:
        pass
    finally:
        node.destroy_node()
        rclpy.shutdown()


if __name__ == '__main__':
    main()
`;
}

export function generateObstacleDetectorCode(d) {
  if (!d) return "";

  const {
    nodeName      = "obstacle_detector",
    scanTopic     = "/scan",
    sector        = "front",
    threshold     = 0.5,
    outputTopic   = "/obstacle/distance",
    detectedTopic = "/obstacle/detected",
    canvasId,
  } = d;

  const { minDeg, maxDeg } = SECTOR_DEGS[sector] || SECTOR_DEGS.front;

  // Match the simulator's workspace namespace so /scan comes from the in-sim
  // LIDAR and the detection flags reach the rest of the pipeline.
  const ctx = { canvasId, isQCarMode: d?.isQCarMode || false };
  const nsScan     = enforceWorkspace(scanTopic, ctx);
  const nsOutput   = enforceWorkspace(outputTopic, ctx);
  const nsDetected = enforceWorkspace(detectedTopic, ctx);

  const className = pascalCase(nodeName);

  return `#!/usr/bin/env python3
# =============================================================================
# 🧩 This file was generated from visual blocks!
# You can edit it as text, but re-opening it will show the block editor.
# =============================================================================
#
# Obstacle Detector Node
# Scan input  : ${scanTopic}  (sensor_msgs/LaserScan)
# Sector      : ${sector}  (${minDeg}° .. ${maxDeg}°)
# Threshold   : ${threshold} m
# Distance out: ${outputTopic}  (Float32)
# Detected out: ${detectedTopic}  (Bool)
# =============================================================================

import math
import rclpy
from rclpy.node import Node
from sensor_msgs.msg import LaserScan
from std_msgs.msg import Float32, Bool


class ${className}(Node):
    def __init__(self):
        super().__init__('${nodeName}')

        self.declare_parameter('scan_topic',     '${nsScan}')
        self.declare_parameter('output_topic',   '${nsOutput}')
        self.declare_parameter('detected_topic', '${nsDetected}')
        self.declare_parameter('threshold',      ${threshold})

        scan_topic     = self.get_parameter('scan_topic').value
        output_topic   = self.get_parameter('output_topic').value
        detected_topic = self.get_parameter('detected_topic').value
        self._threshold = self.get_parameter('threshold').value

        self._pub_dist     = self.create_publisher(Float32, output_topic,   10)
        self._pub_detected = self.create_publisher(Bool,    detected_topic, 10)

        self._sub = self.create_subscription(
            LaserScan, scan_topic, self._scan_cb, 10)

        self.get_logger().info(
            f'Obstacle Detector ready — scan: {scan_topic}'
            f' | sector: ${sector} (${minDeg}° .. ${maxDeg}°)'
            f' | threshold: {self._threshold} m'
        )

    def _scan_cb(self, msg):
        angle_min = msg.angle_min
        angle_inc = msg.angle_increment
        ranges    = msg.ranges
        r_min     = msg.range_min
        r_max     = msg.range_max

        sec_min_rad = math.radians(${minDeg})
        sec_max_rad = math.radians(${maxDeg})

        valid_ranges = []
        for i, r in enumerate(ranges):
            angle = angle_min + i * angle_inc
            if sec_min_rad <= angle <= sec_max_rad:
                if math.isfinite(r) and r_min <= r <= r_max:
                    valid_ranges.append(r)

        if valid_ranges:
            min_dist = min(valid_ranges)
        else:
            min_dist = float('inf')

        detected = min_dist < self._threshold

        dist_msg = Float32()
        dist_msg.data = float(min_dist) if math.isfinite(min_dist) else self._threshold * 10.0
        self._pub_dist.publish(dist_msg)

        det_msg = Bool()
        det_msg.data = bool(detected)
        self._pub_detected.publish(det_msg)


def main(args=None):
    rclpy.init(args=args)
    node = ${className}()
    try:
        rclpy.spin(node)
    except KeyboardInterrupt:
        pass
    finally:
        node.destroy_node()
        rclpy.shutdown()


if __name__ == '__main__':
    main()
`;
}
