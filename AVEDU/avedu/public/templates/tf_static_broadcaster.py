#!/usr/bin/env python3
"""
Static TF Broadcaster Example
This node broadcasts a static transformation between two frames.
Use this for transforms that never change (e.g., sensor mounts, calibration)
"""

import rclpy
from rclpy.node import Node
from geometry_msgs.msg import TransformStamped
from tf2_ros import StaticTransformBroadcaster
import math

class StaticTFBroadcaster(Node):
    def __init__(self):
        super().__init__('static_tf_broadcaster')

        # Create a static transform broadcaster
        self.tf_static_broadcaster = StaticTransformBroadcaster(self)

        # Broadcast the static transform once
        self.broadcast_static_transform()

        self.get_logger().info('Static TF broadcaster initialized')

    def broadcast_static_transform(self):
        """Broadcast a static transform from world to parent_frame"""

        # Create a TransformStamped message
        t = TransformStamped()

        # Set header
        t.header.stamp = self.get_clock().now().to_msg()
        t.header.frame_id = 'world'  # Parent frame
        t.child_frame_id = 'parent_frame'  # Child frame

        # Set translation (position in meters)
        t.transform.translation.x = 1.0  # 1 meter in X direction
        t.transform.translation.y = 0.0
        t.transform.translation.z = 0.0

        # Set rotation (quaternion for no rotation)
        # For no rotation: w=1, x=y=z=0
        t.transform.rotation.x = 0.0
        t.transform.rotation.y = 0.0
        t.transform.rotation.z = 0.0
        t.transform.rotation.w = 1.0

        # Broadcast the transform
        self.tf_static_broadcaster.sendTransform(t)

        self.get_logger().info(
            f'Broadcasting static TF: {t.header.frame_id} -> {t.child_frame_id}'
        )

def main(args=None):
    rclpy.init(args=args)

    node = StaticTFBroadcaster()

    try:
        rclpy.spin(node)
    except KeyboardInterrupt:
        pass

    node.destroy_node()
    rclpy.shutdown()

if __name__ == '__main__':
    main()
