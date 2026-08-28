# QCar2 full bringup with rosbridge WebSocket server
# Use this instead of qcar2_launch.py when you need the LAD web interface
# to receive live topic data (Viz tab on the research page).
#
# rosbridge listens on ws://192.168.137.227:9090 by default.

from launch import LaunchDescription
from launch_ros.actions import Node


def generate_launch_description():

    lidar_node = Node(
        package='qcar2_nodes',
        executable='lidar',
        name='Lidar',
    )

    realsense_camera_node = Node(
        package='qcar2_nodes',
        executable='rgbd',
        name='RealsenseCamera',
    )

    csi_camera_node = Node(
        package='qcar2_nodes',
        executable='csi',
        name='csi_camera',
    )

    qcar2_hardware = Node(
        package='qcar2_nodes',
        executable='qcar2_hardware',
        name='qcar2_hardware',
    )

    qcar2_sensor_tf_node = Node(
        package='qcar2_nodes',
        executable='fixed_lidar_frame',
        name='fixed_lidar_frame',
    )

    rosbridge_node = Node(
        package='rosbridge_server',
        executable='rosbridge_websocket',
        name='rosbridge_websocket',
        parameters=[{
            'port': 9090,
            'address': '',          # listen on all interfaces
            'ssl': False,
            'authenticate': False,
        }],
    )

    web_video_server_node = Node(
        package='web_video_server',
        executable='web_video_server',
        name='web_video_server',
        parameters=[{
            'port': 8080,
            'address': '0.0.0.0',
            'default_stream_type': 'mjpeg',
        }],
    )

    return LaunchDescription([
        lidar_node,
        qcar2_sensor_tf_node,
        realsense_camera_node,
        csi_camera_node,
        qcar2_hardware,
        rosbridge_node,
        web_video_server_node,
    ])
