from launch import LaunchDescription
from launch.actions import DeclareLaunchArgument, ExecuteProcess, IncludeLaunchDescription, SetEnvironmentVariable
from launch.conditions import IfCondition
from launch.launch_description_sources import PythonLaunchDescriptionSource
from launch.substitutions import LaunchConfiguration, PathJoinSubstitution
from launch_ros.actions import Node
from launch_ros.substitutions import FindPackageShare
from ament_index_python.packages import get_package_share_directory
import os

def generate_launch_description():
    cors_origin     = LaunchConfiguration('cors_allow_origin')
    static_port     = LaunchConfiguration('static_port')
    enable_rosapi   = LaunchConfiguration('enable_rosapi')
    enable_jsp      = LaunchConfiguration('enable_jsp')
    enable_wvs      = LaunchConfiguration('enable_wvs')
    wvs_port        = LaunchConfiguration('wvs_port')
    enable_turtle   = LaunchConfiguration('enable_turtlesim')
    enable_gazebo   = LaunchConfiguration('enable_gazebo')
    gazebo_world    = LaunchConfiguration('gazebo_world')
    enable_dummy_cameras = LaunchConfiguration('enable_dummy_cameras')

    # Rutas desde qcar_description instalado
    qcar_share  = get_package_share_directory('qcar_description')
    static_root = os.path.dirname(qcar_share)  # .../install/.../share
    urdf_file   = os.path.join(qcar_share, 'urdf', 'robot_runtime.urdf')
    gazebo_urdf = os.path.join(qcar_share, 'urdf', 'robot_gazebo.urdf')

    env = [
        SetEnvironmentVariable(name='CORS_ALLOW_ORIGIN', value=cors_origin),
        SetEnvironmentVariable(name='QT_QPA_PLATFORM', value='offscreen')
    ]

    # HTTP estático con CORS (sirve /share, por lo tanto /qcar_description/...)
    http = ExecuteProcess(
        cmd=['python3', '-u', '/http_cors.py', '--dir', static_root, '--port', static_port],
        output='screen',
        additional_env={'CORS_ALLOW_ORIGIN': cors_origin}
    )

    # Use Node (not ExecuteProcess) so we can inject ROS parameters.
    # Key params for browser-sim use:
    #   use_sim_time: false  — browser publishes wall-clock stamps; without this,
    #                          rosbridge would wait for /clock and drop messages.
    #   unregister_timeout:  How long (s) to keep an advertised topic alive after
    #                        the browser tab closes / refreshes.  10 s is enough to
    #                        survive a hot-reload without topic churn.
    #   max_message_size:    Raise from default 10 MB to handle large costmaps if
    #                        nav2 is attached; LaserScan (270 floats) is ~2 KB so
    #                        this is just headroom.
    rosbridge = Node(
        package='rosbridge_server',
        executable='rosbridge_websocket',
        name='rosbridge_websocket',
        output='screen',
        parameters=[{
            'port':                          9090,
            'address':                       '0.0.0.0',
            'use_sim_time':                  False,
            'unregister_timeout':            10.0,
            'fragment_timeout':              600,
            'delay_between_messages':        0.0,
            'max_message_size':              10485760,   # 10 MB
            'send_action_goals_in_new_thread': True,
            'authenticate':                  False,
        }],
    )

    tf2web = Node(
        package='tf2_web_republisher_py', executable='tf2_web_republisher',
        name='tf2_web_republisher', output='screen'
    )

    # Publica TF desde el URDF plano generado por el entrypoint
    rsp = Node(
        package='robot_state_publisher', executable='robot_state_publisher',
        name='robot_state_publisher', output='screen',
        parameters=[{
            'robot_description': open(urdf_file).read(),
            'use_tf_static':     True,
            'use_sim_time':      False,   # browser uses wall-clock stamps
        }]
    )

    jsp = Node(
        package='joint_state_publisher', executable='joint_state_publisher',
        name='joint_state_publisher', output='screen',
        condition=IfCondition(enable_jsp)
    )

    rosapi = Node(
        package='rosapi', executable='rosapi_node', name='rosapi',
        output='screen', condition=IfCondition(enable_rosapi)
    )

    wvs = Node(
        package='web_video_server', executable='web_video_server', name='web_video_server',
        output='screen', arguments=['--port', wvs_port],
        condition=IfCondition(enable_wvs)
    )

    # Dummy camera publisher - provides test images when Gazebo cameras are unavailable
    # (e.g., in headless Docker without GPU/OpenGL support)
    # Set ENABLE_DUMMY_CAMERAS=1 in docker-compose.yml to enable
    dummy_camera_publisher = Node(
        package='qcar_bringup',
        executable='dummy_camera_publisher',
        name='dummy_camera_publisher',
        output='screen',
        condition=IfCondition(enable_dummy_cameras)
    )

    # Compressed image republisher for better streaming performance over rosbridge
    # Converts raw images to compressed JPEG, improving FPS from ~5 to 30+
    compressed_republisher = Node(
        package='qcar_bringup',
        executable='compressed_republisher',
        name='compressed_republisher',
        output='screen',
        parameters=[{
            'jpeg_quality': 85,  # Higher quality for better image (80-95 recommended)
            'topics': [
                '/qcar/rgb/image_color',
                '/qcar/csi_front/image_raw',
                '/qcar/csi_right/image_raw',
                '/qcar/csi_back/image_raw',
                '/qcar/csi_left/image_raw',
                '/qcar/overhead/image_raw'
            ]
        }],
        condition=IfCondition(enable_gazebo)  # Only run when Gazebo is enabled
    )

    turtlesim = ExecuteProcess(
        cmd=['ros2', 'run', 'turtlesim', 'turtlesim_node'],
        output='screen',
        condition=IfCondition(enable_turtle),
        additional_env={'DISPLAY': ':99'}  # Use the same Xvfb display as Gazebo
    )

    # Gazebo simulation (headless mode for Docker)
    pkg_gazebo_ros = FindPackageShare('gazebo_ros')
    pkg_qcar_description = FindPackageShare('qcar_description')

    # Launch Gazebo server with required plugins
    # Use custom world if provided, otherwise use empty world
    gzserver = ExecuteProcess(
        cmd=[
            'gzserver',
            '--verbose',
            '-s', 'libgazebo_ros_init.so',
            '-s', 'libgazebo_ros_factory.so',
            gazebo_world  # This will be the world file path or empty string
        ],
        output='screen',
        condition=IfCondition(enable_gazebo)
    )

    # Spawn QCar in Gazebo (with longer timeout for Gazebo initialization)
    # Use gazebo_urdf (with file:// URLs) instead of urdf_file (with http:// URLs)
    spawn_qcar = Node(
        package='gazebo_ros',
        executable='spawn_entity.py',
        arguments=[
            '-entity', 'qcar',
            '-file', gazebo_urdf,  # Use Gazebo-specific URDF with file:// mesh URLs
            '-x', '0.0',
            '-y', '0.0',
            '-z', '0.1',
            '-timeout', '120.0'  # Increase timeout to 120 seconds for model database
        ],
        output='screen',
        condition=IfCondition(enable_gazebo)
    )

    return LaunchDescription([
        DeclareLaunchArgument('cors_allow_origin', default_value='http://localhost:8000'),
        DeclareLaunchArgument('static_port',      default_value='7000'),
        DeclareLaunchArgument('enable_rosapi',    default_value='true'),
        DeclareLaunchArgument('enable_jsp',       default_value='true'),
        DeclareLaunchArgument('enable_wvs',       default_value='false'),
        DeclareLaunchArgument('wvs_port',         default_value='8080'),
        DeclareLaunchArgument('enable_turtlesim', default_value='true'),
        DeclareLaunchArgument('enable_gazebo',    default_value='false'),
        DeclareLaunchArgument('gazebo_world',     default_value=''),
        DeclareLaunchArgument('enable_dummy_cameras', default_value='false'),
        *env, http, rosbridge, tf2web, rsp, jsp, rosapi, wvs, dummy_camera_publisher, compressed_republisher, turtlesim, gzserver, spawn_qcar
    ])
