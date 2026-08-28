#!/usr/bin/env python3
"""
TF Listener Example
This node listens to transformations and looks up transforms between frames.
Use this to get the relationship between any two frames in the TF tree.
"""

import rclpy
from rclpy.node import Node
from tf2_ros import TransformListener, Buffer
from tf2_ros import LookupException, ConnectivityException, ExtrapolationException
import math

class TFListener(Node):
    def __init__(self):
        super().__init__('tf_listener')

        # Create a TF2 buffer and listener
        self.tf_buffer = Buffer()
        self.tf_listener = TransformListener(self.tf_buffer, self)

        # Create a timer to lookup transforms at 1 Hz
        self.timer = self.create_timer(1.0, self.lookup_transform)

        # Frames to look up
        self.source_frame = 'world'
        self.target_frame = 'child_frame'

        self.get_logger().info('TF listener initialized')
        self.get_logger().info(f'Looking up transform: {self.source_frame} -> {self.target_frame}')

    def lookup_transform(self):
        """Look up the transform between source and target frames"""
        try:
            # Look up the transform
            # lookup_transform(target_frame, source_frame, time)
            transform = self.tf_buffer.lookup_transform(
                self.target_frame,
                self.source_frame,
                rclpy.time.Time()  # Get the latest available transform
            )

            # Extract translation (position)
            translation = transform.transform.translation

            # Extract rotation (quaternion)
            rotation = transform.transform.rotation

            # Convert quaternion to Euler angles for easier understanding
            # This is a simplified conversion for Z-axis rotation
            siny_cosp = 2 * (rotation.w * rotation.z + rotation.x * rotation.y)
            cosy_cosp = 1 - 2 * (rotation.y * rotation.y + rotation.z * rotation.z)
            yaw = math.atan2(siny_cosp, cosy_cosp)

            # Log the transform
            self.get_logger().info(
                f'\nTransform {self.source_frame} -> {self.target_frame}:\n'
                f'  Position: x={translation.x:.3f}, y={translation.y:.3f}, z={translation.z:.3f}\n'
                f'  Rotation: {math.degrees(yaw):.1f}° around Z-axis\n'
                f'  Quaternion: x={rotation.x:.3f}, y={rotation.y:.3f}, '
                f'z={rotation.z:.3f}, w={rotation.w:.3f}'
            )

        except LookupException as e:
            self.get_logger().warn(f'Transform lookup failed: {e}')
        except ConnectivityException as e:
            self.get_logger().warn(f'Connectivity error: {e}')
        except ExtrapolationException as e:
            self.get_logger().warn(f'Extrapolation error: {e}')
        except Exception as e:
            self.get_logger().error(f'Unexpected error: {e}')

    def destroy_node(self):
        """Clean up on node shutdown"""
        self.get_logger().info('Shutting down TF listener')
        super().destroy_node()

def main(args=None):
    rclpy.init(args=args)

    node = TFListener()

    try:
        rclpy.spin(node)
    except KeyboardInterrupt:
        pass

    node.destroy_node()
    rclpy.shutdown()

if __name__ == '__main__':
    main()
