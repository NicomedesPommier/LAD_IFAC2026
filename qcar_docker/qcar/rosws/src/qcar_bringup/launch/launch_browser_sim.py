"""
launch_browser_sim.py
─────────────────────────────────────────────────────────────────────────────
Minimal ROS 2 launch for the Rapier+Three.js browser simulator.

Starts ONLY:
  1. rosbridge_server  — WebSocket on :9090, browser pub/sub endpoint
  2. robot_state_publisher — static TF tree from the Gazebo-free URDF
  3. joint_state_publisher — publishes angle=0 for the 4 continuous wheel
                             joints so RSP doesn't log "missing joint state"
  4. rosapi (optional)     — lets roslib.js call /rosapi/topics, /rosapi/msg
  5. tf2_web_republisher   — lets roslib.js call tf2_web_republisher/TFSubscription
                             (needed if algo nodes subscribe to transforms via web)

What is NOT started:
  • gzserver / gzclient / spawn_entity — no Gazebo in this mode
  • web_video_server — no camera streams from Gazebo
  • ROS-TCP-Endpoint — no Unity connection

Coordinate contract with the browser
─────────────────────────────────────────────────────────────────────────────
The browser simulator (QCarBody.jsx + useOdomPublisher.js + useTfPublisher.js)
publishes:
  /odom          nav_msgs/Odometry      frame_id=odom, child_frame_id=base_link
  /tf            tf2_msgs/TFMessage     odom → base_link  (20 Hz)
  /scan          sensor_msgs/LaserScan  frame_id=lidar_link (10 Hz)

This launch file's RSP then derives all other frames (lidar_link, camera_*,
wheel_*, etc.) relative to base_link via the static URDF joints.

use_sim_time = false EVERYWHERE
─────────────────────────────────────────────────────────────────────────────
The browser uses wall-clock timestamps (performance.now()).
use_sim_time=true would make every node wait for /clock, which nothing
publishes in browser-sim mode — they would hang.

To invoke from the entrypoint instead of web_viz.launch.py:
  ros2 launch qcar_bringup launch_browser_sim.py

To wire into entrypoint.sh, replace the final exec line with:
  if [ "${BROWSER_SIM:-0}" = "1" ]; then
    exec ros2 launch qcar_bringup launch_browser_sim.py "${LAUNCH_ARGS[@]}"
  else
    exec ros2 launch qcar_bringup web_viz.launch.py "${LAUNCH_ARGS[@]}"
  fi
"""

import os
import xacro

from launch import LaunchDescription
from launch.actions import DeclareLaunchArgument
from launch.conditions import IfCondition
from launch.substitutions import LaunchConfiguration
from launch_ros.actions import Node
from ament_index_python.packages import get_package_share_directory


def generate_launch_description():

    # ── Arguments ────────────────────────────────────────────────────────
    enable_rosapi  = LaunchConfiguration('enable_rosapi')
    enable_tf2web  = LaunchConfiguration('enable_tf2web')
    enable_jsp     = LaunchConfiguration('enable_jsp')

    # ── URDF: process the Gazebo-free xacro at launch time ───────────────
    # xacro.process_file() expands $(find ...) / package:// correctly when
    # run inside the container (the package is on the ament index).
    urdf_xacro = os.path.join(
        get_package_share_directory('qcar_description'),
        'urdf',
        'qcar_browser_sim.urdf.xacro',
    )
    robot_description = xacro.process_file(urdf_xacro).toxml()

    # ── 1. rosbridge_server ───────────────────────────────────────────────
    # All parameters are explicit so behaviour is predictable regardless of
    # any global ROS parameter state left over from a previous Gazebo run.
    rosbridge = Node(
        package='rosbridge_server',
        executable='rosbridge_websocket',
        name='rosbridge_websocket',
        output='screen',
        parameters=[{
            'port':                            9090,
            'address':                         '0.0.0.0',
            'use_sim_time':                    False,
            # unregister_timeout: keep the advertised topic alive this many
            # seconds after the browser tab closes / hot-reloads.  10 s is
            # enough to survive a React dev-server reload.
            'unregister_timeout':              10.0,
            # fragment_timeout: for large messages sent in fragments (not
            # relevant for /odom or /scan, but good to be explicit).
            'fragment_timeout':                600,
            'delay_between_messages':          0.0,
            # max_message_size: 10 MB — headroom for nav2 costmaps if attached.
            # LaserScan(270 floats) ≈ 2 KB; Odometry ≈ 1 KB.
            'max_message_size':                10485760,
            'send_action_goals_in_new_thread': True,
            # authenticate: False — no token required from browser clients.
            'authenticate':                    False,
        }],
    )

    # ── 2. robot_state_publisher ──────────────────────────────────────────
    # Publishes the static kinematic TF tree from the URDF.
    # The browser's /tf provides odom→base_link; RSP derives everything else.
    rsp = Node(
        package='robot_state_publisher',
        executable='robot_state_publisher',
        name='robot_state_publisher',
        output='screen',
        parameters=[{
            'robot_description': robot_description,
            'use_tf_static':     True,
            'use_sim_time':      False,
        }],
    )

    # ── 3. joint_state_publisher ──────────────────────────────────────────
    # Publishes angle=0 for the 4 continuous wheel axle joints.
    # Without this, RSP logs "waiting for joint states" every second and the
    # wheel TF frames are missing from the tree.
    # The browser's cosmetic wheel animation lives entirely inside Three.js;
    # it does NOT need to round-trip through /joint_states.
    jsp = Node(
        package='joint_state_publisher',
        executable='joint_state_publisher',
        name='joint_state_publisher',
        output='screen',
        condition=IfCondition(enable_jsp),
        parameters=[{'use_sim_time': False}],
    )

    # ── 4. rosapi (optional) ──────────────────────────────────────────────
    # Lets the browser call /rosapi/topics, /rosapi/get_param, etc.
    # Needed by roslib.js Ros.getTopics() and similar introspection calls.
    rosapi = Node(
        package='rosapi',
        executable='rosapi_node',
        name='rosapi',
        output='screen',
        condition=IfCondition(enable_rosapi),
        parameters=[{'use_sim_time': False}],
    )

    # ── 5. tf2_web_republisher (optional) ────────────────────────────────
    # Allows browser clients to subscribe to TF frames via the
    # tf2_web_republisher/TFSubscription service.
    # Not strictly needed if the browser only publishes TF (not subscribes),
    # but useful for RViz-web and for algo nodes that echo TF to the browser.
    tf2web = Node(
        package='tf2_web_republisher_py',
        executable='tf2_web_republisher',
        name='tf2_web_republisher',
        output='screen',
        condition=IfCondition(enable_tf2web),
        parameters=[{'use_sim_time': False}],
    )

    return LaunchDescription([
        DeclareLaunchArgument('enable_rosapi', default_value='true'),
        DeclareLaunchArgument('enable_tf2web', default_value='true'),
        DeclareLaunchArgument('enable_jsp',    default_value='true'),

        rosbridge,
        rsp,
        jsp,
        rosapi,
        tf2web,
    ])
