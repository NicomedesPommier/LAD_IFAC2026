#!/usr/bin/env python3
"""
Dynamic TF Broadcaster Example
This node broadcasts a dynamic (continuously updating) transformation.
Use this for transforms that change over time (e.g., robot joints, moving objects)
"""

import rclpy
from rclpy.node import Node
from geometry_msgs.msg import TransformStamped
from tf2_ros import TransformBroadcaster
import math

class DynamicTFBroadcaster(Node):
    def __init__(self):
        super().__init__('dynamic_tf_broadcaster')

        # Create a transform broadcaster
        self.tf_broadcaster = TransformBroadcaster(self)

        # Create a timer to broadcast transforms at 10 Hz
        self.timer = self.create_timer(0.1, self.broadcast_transform)

        # Initialize angle for rotation animation
        self.angle = 0.0

        self.get_logger().info('Dynamic TF broadcaster initialized')

    def broadcast_transform(self):
        """Broadcast a dynamic transform that rotates around Z axis"""

        # Create a TransformStamped message
        t = TransformStamped()

        # Set header with current timestamp
        t.header.stamp = self.get_clock().now().to_msg()
        t.header.frame_id = 'parent_frame'  # Parent frame
        t.child_frame_id = 'child_frame'  # Child frame

        # Set translation (offset from parent)
        t.transform.translation.x = 0.0
        t.transform.translation.y = 0.5  # 0.5 meters in Y direction
        t.transform.translation.z = 0.0

        # Set rotation (rotating around Z axis)
        # Convert Euler angles to quaternion
        # For rotation around Z axis by angle theta:
        # x = 0, y = 0, z = sin(theta/2), w = cos(theta/2)
        half_angle = self.angle / 2.0
        t.transform.rotation.x = 0.0
        t.transform.rotation.y = 0.0
        t.transform.rotation.z = math.sin(half_angle)
        t.transform.rotation.w = math.cos(half_angle)

        # Broadcast the transform
        self.tf_broadcaster.sendTransform(t)

        # Update angle for next iteration (rotate 1 degree per update)
        self.angle += math.radians(1.0)
        if self.angle > 2 * math.pi:
            self.angle -= 2 * math.pi

    def destroy_node(self):
        """Clean up on node shutdown"""
        self.get_logger().info('Shutting down dynamic TF broadcaster')
        super().destroy_node()

def main(args=None):
    rclpy.init(args=args)

    node = DynamicTFBroadcaster()

    try:
        rclpy.spin(node)
    except KeyboardInterrupt:
        pass

    node.destroy_node()
    rclpy.shutdown()

if __name__ == '__main__':
    main()
