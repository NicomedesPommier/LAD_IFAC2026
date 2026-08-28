#!/usr/bin/env python3
"""
Dummy Camera Publisher Node

Publishes test images to camera topics when Gazebo cameras are unavailable
(e.g., in headless Docker environments without GPU/OpenGL support).

This allows frontend visualization and testing without real camera sensors.
"""

import rclpy
from rclpy.node import Node
from sensor_msgs.msg import Image
from std_msgs.msg import Header
import numpy as np
import cv2
from cv_bridge import CvBridge


class DummyCameraPublisher(Node):
    def __init__(self):
        super().__init__('dummy_camera_publisher')

        self.bridge = CvBridge()

        # Define camera topics to publish
        self.camera_topics = {
            '/qcar/rgb/image_color': 'RGB Camera',
            '/qcar/csi_front/image_raw': 'CSI Front',
            '/qcar/csi_right/image_raw': 'CSI Right',
            '/qcar/csi_back/image_raw': 'CSI Back',
            '/qcar/csi_left/image_raw': 'CSI Left',
            '/qcar/overhead/image_raw': 'Overhead Camera'
        }

        # Create publishers (use camera_publishers to avoid ROS 2 Node property conflict)
        self.camera_publishers = {}
        for topic, name in self.camera_topics.items():
            self.camera_publishers[topic] = self.create_publisher(Image, topic, 10)
            self.get_logger().info(f'Publishing dummy images to {topic}')

        # Publish at 10 Hz (sufficient for testing)
        self.timer = self.create_timer(0.1, self.publish_images)

        self.frame_count = 0

    def generate_test_image(self, camera_name, width=640, height=480):
        """Generate a test pattern image with camera name and frame count"""
        # Create a colorful gradient background
        img = np.zeros((height, width, 3), dtype=np.uint8)

        # Create gradient based on camera name (different color for each camera)
        color_map = {
            'RGB Camera': (50, 150, 255),       # Orange-ish
            'CSI Front': (50, 255, 50),         # Green
            'CSI Right': (255, 100, 50),        # Blue
            'CSI Back': (255, 50, 200),         # Purple
            'CSI Left': (50, 200, 255),         # Yellow
            'Overhead Camera': (200, 200, 200)  # Gray
        }

        base_color = color_map.get(camera_name, (128, 128, 128))

        # Create gradient
        for y in range(height):
            for x in range(width):
                img[y, x] = (
                    int(base_color[0] * (1 - y / height)),
                    int(base_color[1] * (1 - x / width)),
                    int(base_color[2] * (x / width))
                )

        # Add grid pattern
        for i in range(0, height, 50):
            cv2.line(img, (0, i), (width, i), (255, 255, 255), 1)
        for i in range(0, width, 50):
            cv2.line(img, (i, 0), (i, height), (255, 255, 255), 1)

        # Add camera name text
        font = cv2.FONT_HERSHEY_SIMPLEX
        text = f"{camera_name}"
        text_size = cv2.getTextSize(text, font, 1.5, 3)[0]
        text_x = (width - text_size[0]) // 2
        text_y = (height + text_size[1]) // 2

        # Add black outline for text visibility
        cv2.putText(img, text, (text_x, text_y), font, 1.5, (0, 0, 0), 5, cv2.LINE_AA)
        cv2.putText(img, text, (text_x, text_y), font, 1.5, (255, 255, 255), 3, cv2.LINE_AA)

        # Add frame counter
        frame_text = f"Frame: {self.frame_count}"
        cv2.putText(img, frame_text, (10, 30), font, 0.7, (0, 0, 0), 3, cv2.LINE_AA)
        cv2.putText(img, frame_text, (10, 30), font, 0.7, (255, 255, 255), 1, cv2.LINE_AA)

        # Add "TEST PATTERN" watermark
        watermark = "TEST PATTERN - No Gazebo Camera"
        cv2.putText(img, watermark, (10, height - 20), font, 0.5, (0, 0, 0), 2, cv2.LINE_AA)
        cv2.putText(img, watermark, (10, height - 20), font, 0.5, (200, 200, 200), 1, cv2.LINE_AA)

        return img

    def publish_images(self):
        """Publish test images to all camera topics"""
        self.frame_count += 1

        for topic, camera_name in self.camera_topics.items():
            # Generate test image
            img = self.generate_test_image(camera_name)

            # Convert to ROS Image message
            msg = self.bridge.cv2_to_imgmsg(img, encoding='rgb8')

            # Set header
            msg.header.stamp = self.get_clock().now().to_msg()
            msg.header.frame_id = f'{camera_name.lower().replace(" ", "_")}_optical_frame'

            # Publish
            self.camera_publishers[topic].publish(msg)


def main(args=None):
    rclpy.init(args=args)
    node = DummyCameraPublisher()

    try:
        rclpy.spin(node)
    except KeyboardInterrupt:
        pass
    finally:
        node.destroy_node()
        rclpy.shutdown()


if __name__ == '__main__':
    main()
