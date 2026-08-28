from launch import LaunchDescription
from launch.actions import DeclareLaunchArgument, IncludeLaunchDescription
from launch.launch_description_sources import PythonLaunchDescriptionSource
from launch.substitutions import LaunchConfiguration, PathJoinSubstitution
from launch_ros.actions import Node
from launch_ros.substitutions import FindPackageShare
from ament_index_python.packages import get_package_share_directory
import os


def generate_launch_description():
    # Launch arguments
    use_sim_time = LaunchConfiguration('use_sim_time', default='true')

    # Get package directories
    pkg_gazebo_ros = FindPackageShare('gazebo_ros')
    pkg_qcar_description = FindPackageShare('qcar_description')

    # World file path (the one we just created with walls)
    world_path = os.path.join('/worlds', 'qcar_lidar_test.world')

    # URDF file path
    urdf_file = PathJoinSubstitution([pkg_qcar_description, 'urdf', 'robot_runtime.urdf'])

    # Gazebo server (gzserver) with our world
    gzserver = IncludeLaunchDescription(
        PythonLaunchDescriptionSource(
            PathJoinSubstitution([pkg_gazebo_ros, 'launch', 'gzserver.launch.py'])
        ),
        launch_arguments={'world': world_path, 'verbose': 'true'}.items()
    )

    # Gazebo client (gzclient) - optional for visualization in container
    gzclient = IncludeLaunchDescription(
        PythonLaunchDescriptionSource(
            PathJoinSubstitution([pkg_gazebo_ros, 'launch', 'gzclient.launch.py'])
        ),
        launch_arguments={'verbose': 'false'}.items()
    )

    # Spawn QCar robot in center of room
    spawn_qcar = Node(
        package='gazebo_ros',
        executable='spawn_entity.py',
        arguments=[
            '-entity', 'qcar',
            '-file', urdf_file,
            '-x', '0.0',       # Center of room
            '-y', '0.0',
            '-z', '0.1',       # Slightly above ground
            '-R', '0.0',
            '-P', '0.0',
            '-Y', '0.0'        # Facing north
        ],
        output='screen'
    )

    # Robot state publisher (publishes TF tree from URDF)
    robot_state_publisher = Node(
        package='robot_state_publisher',
        executable='robot_state_publisher',
        name='robot_state_publisher',
        output='screen',
        parameters=[
            {'use_sim_time': use_sim_time},
            {'robot_description': open(os.path.join(
                get_package_share_directory('qcar_description'),
                'urdf',
                'robot_runtime.urdf'
            )).read()}
        ]
    )

    # Joint state publisher (for robot joints)
    joint_state_publisher = Node(
        package='joint_state_publisher',
        executable='joint_state_publisher',
        name='joint_state_publisher',
        parameters=[{'use_sim_time': use_sim_time}]
    )

    # rosbridge server (for web visualization)
    rosbridge = Node(
        package='rosbridge_server',
        executable='rosbridge_websocket',
        name='rosbridge_websocket',
        parameters=[
            {'port': 9090},
            {'address': '0.0.0.0'},
            {'use_sim_time': use_sim_time}
        ],
        output='screen'
    )

    # TF2 web republisher (for TF data over rosbridge)
    tf2_web_republisher = Node(
        package='tf2_web_republisher',
        executable='tf2_web_republisher',
        name='tf2_web_republisher',
        output='screen'
    )

    return LaunchDescription([
        # Declare launch arguments
        DeclareLaunchArgument(
            'use_sim_time',
            default_value='true',
            description='Use simulation (Gazebo) clock'
        ),

        # Launch Gazebo with world
        gzserver,
        # gzclient,  # Comment out if running headless in Docker

        # Spawn robot
        spawn_qcar,

        # Robot state publishers
        robot_state_publisher,
        joint_state_publisher,

        # Web visualization support
        rosbridge,
        tf2_web_republisher,
    ])
