from launch import LaunchDescription
from launch.actions import DeclareLaunchArgument, ExecuteProcess, IncludeLaunchDescription, RegisterEventHandler
from launch.event_handlers import OnProcessExit
from launch.launch_description_sources import PythonLaunchDescriptionSource
from launch.substitutions import Command, FindExecutable, LaunchConfiguration, PathJoinSubstitution
from launch_ros.actions import Node
from launch_ros.substitutions import FindPackageShare
from ament_index_python.packages import get_package_share_directory
import os


def generate_launch_description():
    # Launch arguments
    use_sim_time = LaunchConfiguration('use_sim_time', default='true')
    world_file = LaunchConfiguration('world')

    # Get package directories
    pkg_gazebo_ros = FindPackageShare('gazebo_ros')
    pkg_qcar_description = FindPackageShare('qcar_description')

    # URDF file path
    urdf_file = PathJoinSubstitution([pkg_qcar_description, 'urdf', 'robot_runtime.urdf'])

    # Gazebo server (gzserver)
    gzserver = IncludeLaunchDescription(
        PythonLaunchDescriptionSource(
            PathJoinSubstitution([pkg_gazebo_ros, 'launch', 'gzserver.launch.py'])
        ),
        launch_arguments={'world': world_file, 'verbose': 'false'}.items()
    )

    # Gazebo client (gzclient) - headless for Docker, but can be enabled
    gzclient = IncludeLaunchDescription(
        PythonLaunchDescriptionSource(
            PathJoinSubstitution([pkg_gazebo_ros, 'launch', 'gzclient.launch.py'])
        ),
        launch_arguments={'verbose': 'false'}.items()
    )

    # Spawn QCar robot in Gazebo
    # Position at center of track (0, 0) facing north (Y=0)
    # Z=0.1 ensures wheels are slightly above ground for stable physics
    spawn_qcar = Node(
        package='gazebo_ros',
        executable='spawn_entity.py',
        arguments=[
            '-entity', 'qcar',
            '-file', urdf_file,
            '-x', '0.0',      # Center X
            '-y', '-2.0',     # Slightly south of center to avoid obstacles
            '-z', '0.1',      # Standard ground clearance
            '-R', '0.0',
            '-P', '0.0',
            '-Y', '1.5708'    # 90 degrees - facing east (toward obstacle_1)
        ],
        output='screen'
    )

    return LaunchDescription([
        # Declare launch arguments
        DeclareLaunchArgument(
            'use_sim_time',
            default_value='true',
            description='Use simulation (Gazebo) clock if true'
        ),
        DeclareLaunchArgument(
            'world',
            default_value='',
            description='Path to world file to load. Empty = default empty world'
        ),

        # Launch Gazebo
        gzserver,
        gzclient,

        # Spawn robot
        spawn_qcar,
    ])
