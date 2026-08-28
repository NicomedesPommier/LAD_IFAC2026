#!/usr/bin/env python3
"""
Compressed Image Republisher for QCar
Subscribes to raw image topics and republishes as compressed JPEG for better streaming performance.
This dramatically improves FPS over rosbridge WebSocket from ~5 FPS to 30+ FPS.
"""

import rclpy
from rclpy.node import Node
from sensor_msgs.msg import Image, CompressedImage
from PIL import Image as PILImage
import io
import numpy as np


class CompressedRepublisher(Node):
    def __init__(self):
        super().__init__('compressed_republisher')

        # Declare parameters with defaults
        self.declare_parameter('jpeg_quality', 80)
        self.declare_parameter('topics', [
            '/qcar/rgb/image_color',
            '/qcar/csi_front/image_raw',
            '/qcar/csi_right/image_raw',
            '/qcar/csi_back/image_raw',
            '/qcar/csi_left/image_raw'
        ])

        # Get parameters
        self.jpeg_quality = self.get_parameter('jpeg_quality').value
        topics = self.get_parameter('topics').value

        self.topic_subscribers = {}
        self.topic_publishers = {}

        # Create subscriber/publisher pairs for each topic
        for topic in topics:
            # Subscribe to raw image
            self.topic_subscribers[topic] = self.create_subscription(
                Image,
                topic,
                lambda msg, t=topic: self.image_callback(msg, t),
                10
            )

            # Publish compressed image
            compressed_topic = topic + '/compressed'
            self.topic_publishers[topic] = self.create_publisher(
                CompressedImage,
                compressed_topic,
                10
            )

            self.get_logger().info(f'Republishing {topic} -> {compressed_topic} (quality={self.jpeg_quality})')

    def image_callback(self, msg, topic):
        """Convert raw image to compressed JPEG and republish"""
        try:
            # Convert ROS Image to numpy array
            if msg.encoding == 'rgb8':
                # RGB8 format
                img_array = np.frombuffer(msg.data, dtype=np.uint8).reshape((msg.height, msg.width, 3))
                pil_image = PILImage.fromarray(img_array, mode='RGB')
            elif msg.encoding == 'bgr8':
                # BGR8 format - need to convert to RGB
                img_array = np.frombuffer(msg.data, dtype=np.uint8).reshape((msg.height, msg.width, 3))
                # Convert BGR to RGB
                img_array = img_array[:, :, ::-1]
                pil_image = PILImage.fromarray(img_array, mode='RGB')
            else:
                self.get_logger().warn(f'Unsupported encoding: {msg.encoding} for {topic}')
                return

            # Compress to JPEG
            buffer = io.BytesIO()
            pil_image.save(buffer, format='JPEG', quality=self.jpeg_quality, optimize=True)
            jpeg_data = buffer.getvalue()

            # Create CompressedImage message
            compressed_msg = CompressedImage()
            compressed_msg.header = msg.header
            compressed_msg.format = "jpeg"
            compressed_msg.data = list(jpeg_data)

            # Publish compressed image
            self.topic_publishers[topic].publish(compressed_msg)

        except Exception as e:
            self.get_logger().error(f'Error processing {topic}: {str(e)}')


def main(args=None):
    rclpy.init(args=args)
    node = CompressedRepublisher()

    try:
        rclpy.spin(node)
    except KeyboardInterrupt:
        pass
    finally:
        node.destroy_node()
        rclpy.shutdown()


if __name__ == '__main__':
    main()
