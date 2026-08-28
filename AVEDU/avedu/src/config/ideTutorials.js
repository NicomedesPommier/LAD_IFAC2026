// src/config/ideTutorials.js
// Tutorial step configurations for IDE-based ROS2 lessons

/**
 * Tutorial for Creating Package lesson
 * Guides user through creating a ROS2 package using visual blocks
 */
export const createPackageTutorial = [
  {
    title: "Welcome to the ROS2 IDE! 👋",
    text: "This interactive IDE will guide you through creating your first ROS2 package. We'll use visual blocks to generate the ros2 pkg create command, then build it in the terminal.",
    position: "center",
    target: null,
    buttonText: "Let's Start!",
  },
  {
    title: "Block Palette",
    text: "This is your block palette. It contains all the visual blocks you can use. Different tabs organize blocks by category.",
    position: "right",
    target: ".ide-test__palette",
    offset: 30,
    scrollIntoView: true,
  },
  {
    title: "Navigate to ROS Tab",
    text: "Click on the 'ROS' tab in the palette to see ROS2-specific blocks like 'Create Package'.",
    position: "bottom",
    target: ".categorized-palette__tab[data-category='ROS']",
    offset: 20,
    backdropClickable: false,
    hideControls: true,
    tip: "Click the ROS tab to continue",
  },
  {
    title: "Create Package Block",
    text: "Great! Now you can see the 'Create Package' block. Drag it onto the canvas to start building your package configuration.",
    position: "right",
    target: ".categorized-palette__block[data-type='createPackage']",
    offset: 20,
    tip: "Drag the 'Create Package' block to the canvas",
  },
  {
    title: "Canvas Workspace",
    text: "This is your visual programming canvas. You can drag blocks here, connect them together, and configure them to generate ROS2 commands.",
    position: "left",
    target: ".ide-test__canvas-content",
    offset: 30,
  },
  {
    title: "Configure the Package",
    text: "Click on the 'Create Package' block you just placed. You can edit the package name, node name, and dependencies directly in the block.",
    position: "bottom",
    target: ".rf-node[data-type='createPackage']",
    offset: 20,
    tip: "Try changing the package name to 'my_robot_pkg'",
  },
  {
    title: "Input Blocks (Optional)",
    text: "You can also use Text and List blocks from the Input tab to connect dynamic values. But for now, editing the block directly is fine!",
    position: "right",
    target: ".categorized-palette__tab[data-category='Input']",
    offset: 20,
  },
  {
    title: "Output Blocks",
    text: "Now navigate to the 'Output' tab. This contains the 'Convert to Code' block that will generate the actual terminal command.",
    position: "bottom",
    target: ".categorized-palette__tab[data-category='Output']",
    offset: 20,
    tip: "Click on the Output tab",
  },
  {
    title: "Convert to Code Block",
    text: "Drag the 'Convert to Code' block onto the canvas. This will generate the ros2 pkg create command from your package configuration.",
    position: "right",
    target: ".categorized-palette__block[data-type='toCode']",
    offset: 20,
    tip: "Drag this block to the canvas",
  },
  {
    title: "Connect the Blocks",
    text: "Connect the 'Create Package' block to the 'Convert to Code' block by dragging from the output handle (right side) to the input handle (left side).",
    position: "top",
    target: ".rf-node[data-type='createPackage'] .react-flow__handle-right",
    offset: 20,
    tip: "Drag from the circle on the right of 'Create Package' to the circle on the left of 'Convert to Code'",
  },
  {
    title: "View Generated Command",
    text: "Once connected, the 'Convert to Code' block shows the generated command. You can copy it or click 'Run in Terminal' to execute it directly!",
    position: "left",
    target: ".rf-node[data-type='toCode']",
    offset: 30,
  },
  {
    title: "Terminal Panel",
    text: "Now let's switch to the terminal to run the command. Click on the Terminal tab at the top of the IDE.",
    position: "bottom",
    target: ".ide-test__tab[data-tab='terminal']",
    offset: 20,
    tip: "Click the Terminal tab",
    hideControls: true,
  },
  {
    title: "Execute the Command",
    text: "The terminal is now active. Type or paste the generated command, or click 'Run in Terminal' from the Convert to Code block. This will create your ROS2 package in the src/ folder.",
    position: "top",
    target: ".terminal",
    offset: 30,
    warning: "Make sure you're in the workspace directory before running the command",
  },
  {
    title: "Build the Package",
    text: "After creating the package, you need to build it with colcon. Type 'colcon build' in the terminal and press Enter. This compiles your package and makes it ready to use.",
    position: "top",
    target: ".terminal",
    offset: 30,
    tip: "Run: colcon build",
  },
  {
    title: "Source the Workspace",
    text: "Finally, source your workspace with 'source install/setup.bash'. This tells ROS2 where to find your newly built package.",
    position: "top",
    target: ".terminal",
    offset: 30,
    tip: "Run: source install/setup.bash",
  },
  {
    title: "Package Created! 🎉",
    text: "Congratulations! You've created and built your first ROS2 package using the visual IDE. You can now see it in the file explorer and use it to create publisher and subscriber nodes!",
    position: "center",
    target: null,
    buttonText: "Finish Tutorial",
  },
];

/**
 * Tutorial for Creating Publishers lesson
 * Guides user through creating ROS2 publisher nodes
 */
export const createPublisherTutorial = [
  {
    title: "Creating ROS2 Publishers 📡",
    text: "In this lesson, you'll learn to create publisher nodes that send messages to ROS2 topics. We'll use visual blocks to configure the publisher, then generate and test the code!",
    position: "center",
    target: null,
    buttonText: "Start Learning",
  },
  {
    title: "ROS2 Tab",
    text: "Navigate to the 'ROS2' tab in the block palette. This contains the Publisher and Subscriber blocks.",
    position: "bottom",
    target: ".categorized-palette__tab[data-category='ROS2']",
    offset: 20,
    tip: "Click the ROS2 tab",
    hideControls: true,
  },
  {
    title: "ROS2 Publisher Block",
    text: "This is the Publisher block! It lets you configure everything about your publisher: topic name, message type, publish frequency, and the data to send.",
    position: "right",
    target: ".categorized-palette__block[data-type='rosPublisher']",
    offset: 20,
    tip: "Drag the Publisher block to the canvas",
  },
  {
    title: "Configure Your Publisher",
    text: "Click on the Publisher block to configure it. You can set the topic name (e.g., '/chatter'), choose the message type (String, Int32, etc.), and set how fast it publishes.",
    position: "bottom",
    target: ".rf-node[data-type='rosPublisher']",
    offset: 20,
    tip: "Try setting topic to '/chatter' and message type to 'String'",
  },
  {
    title: "Publisher Name",
    text: "Give your publisher a unique name. This will be used as the Python class name and helps identify the node when it's running.",
    position: "left",
    target: ".ros-publisher-node__field input[type='text']",
    offset: 20,
  },
  {
    title: "Message Type Selection",
    text: "Choose the message type carefully! Common types include String (text), Int32 (numbers), Float64 (decimals), and Twist (robot movement). Each type has specific uses.",
    position: "left",
    target: ".ros-publisher-node__grid-2",
    offset: 20,
    tip: "std_msgs/String is great for beginners!",
  },
  {
    title: "Publish Frequency",
    text: "The frequency controls how often messages are sent (in Hz). 1.0 = 1 message per second, 10.0 = 10 messages per second. Start with 1.0 for testing.",
    position: "left",
    target: ".ros-publisher-node input[placeholder='1.0']",
    offset: 20,
  },
  {
    title: "Optional: Data Input",
    text: "You can connect a Text block from the Input tab to provide custom data. Or just configure the data directly in the publisher block!",
    position: "right",
    target: ".categorized-palette__tab[data-category='Input']",
    offset: 20,
  },
  {
    title: "Generate Publisher Code",
    text: "Now connect your Publisher block to a 'Convert to Code' block (from Output tab). This generates a complete Python ROS2 publisher node file!",
    position: "top",
    target: ".rf-node[data-type='rosPublisher'] .react-flow__handle-right",
    offset: 20,
    tip: "Connect to a 'Convert to Code' block",
  },
  {
    title: "File Explorer",
    text: "Your generated publisher code will be saved to your ROS2 package. You can see it appear in the file explorer after generating.",
    position: "right",
    target: ".ide-test__explorer",
    offset: 30,
  },
  {
    title: "Save to Package",
    text: "Click 'Generate Publisher Code' or 'Save File' to create the Python file in your package directory (src/your_package/your_package/).",
    position: "bottom",
    target: ".btn--primary",
    offset: 20,
    warning: "Make sure you created a package first in lesson 3!",
  },
  {
    title: "Update setup.py",
    text: "Important! You need to add an entry point in setup.py for your publisher. Open setup.py and add your publisher node to the console_scripts list.",
    position: "left",
    target: ".ide-test__explorer",
    offset: 30,
    tip: "Add: 'publisher_node = your_pkg.publisher_node:main'",
  },
  {
    title: "Build Your Package",
    text: "Switch to the Terminal tab and run 'colcon build' to compile your package with the new publisher node.",
    position: "bottom",
    target: ".ide-test__tab[data-tab='terminal']",
    offset: 20,
    tip: "Run: colcon build",
  },
  {
    title: "Run Your Publisher",
    text: "After building, source the workspace ('source install/setup.bash') and run your publisher with 'ros2 run your_package publisher_node'. You should see messages being published!",
    position: "top",
    target: ".terminal",
    offset: 30,
    tip: "Run: ros2 run your_pkg publisher_node",
  },
  {
    title: "Test with ros2 topic",
    text: "Open another terminal (or press Ctrl+C to stop the publisher) and run 'ros2 topic echo /chatter' to see the messages your publisher is sending!",
    position: "top",
    target: ".terminal",
    offset: 30,
    tip: "Run: ros2 topic echo /chatter",
  },
  {
    title: "Publisher Created! 🎉",
    text: "Excellent work! You've created a working ROS2 publisher node. Try changing the message type, frequency, or data and rebuild to see how it affects the output!",
    position: "center",
    target: null,
    buttonText: "Complete Tutorial",
  },
];

/**
 * Tutorial for Creating Subscribers lesson
 * Guides user through creating ROS2 subscriber nodes
 */
export const createSubscriberTutorial = [
  {
    title: "Creating ROS2 Subscribers 📥",
    text: "Subscribers listen to topics and process incoming messages. You'll create a subscriber node that receives messages from the publisher you created earlier!",
    position: "center",
    target: null,
    buttonText: "Let's Build!",
  },
  {
    title: "ROS2 Subscriber Block",
    text: "Navigate to the ROS2 tab and find the 'ROS2 Subscriber' block. This will help you create a node that listens to messages.",
    position: "right",
    target: ".categorized-palette__block[data-type='rosSubscriber']",
    offset: 20,
    tip: "Drag the Subscriber block to the canvas",
  },
  {
    title: "Configure Topic Name",
    text: "Set the topic name to match your publisher! If your publisher sends to '/chatter', your subscriber should listen to '/chatter'. Topic names must match exactly.",
    position: "left",
    target: ".ros-subscriber-node input[placeholder='/chatter']",
    offset: 20,
    warning: "Topic and message type must match the publisher!",
  },
  {
    title: "Message Type Match",
    text: "Select the SAME message type as your publisher. If the publisher uses String, the subscriber must also use String. Mismatched types won't communicate!",
    position: "left",
    target: ".ros-subscriber-node__grid-2",
    offset: 20,
  },
  {
    title: "Subscriber Name",
    text: "Give your subscriber a unique name. This helps identify it when debugging and allows you to run multiple subscribers if needed.",
    position: "left",
    target: ".ros-subscriber-node input[type='text']",
    offset: 20,
  },
  {
    title: "Generate Subscriber Code",
    text: "Connect the Subscriber block to a 'Convert to Code' block to generate the complete Python subscriber node code.",
    position: "top",
    target: ".rf-node[data-type='rosSubscriber'] .react-flow__handle-right",
    offset: 20,
    tip: "Connect to Convert to Code block",
  },
  {
    title: "Save Subscriber File",
    text: "Generate and save the subscriber code to your package directory. It will create a file like 'subscriber_node.py' or 'listener_node.py'.",
    position: "bottom",
    target: ".btn--primary",
    offset: 20,
  },
  {
    title: "Update setup.py Again",
    text: "Don't forget to add the subscriber entry point in setup.py! Add something like 'subscriber_node = your_pkg.subscriber_node:main' to the console_scripts.",
    position: "left",
    target: ".ide-test__explorer",
    offset: 30,
    tip: "Add subscriber to console_scripts in setup.py",
  },
  {
    title: "Rebuild Package",
    text: "Run 'colcon build' in the terminal to compile your package with both publisher and subscriber nodes.",
    position: "top",
    target: ".terminal",
    offset: 30,
    tip: "Run: colcon build",
  },
  {
    title: "Test Communication",
    text: "Now for the exciting part! You need TWO terminals: one for the publisher, one for the subscriber. Let's test them together!",
    position: "top",
    target: ".terminal",
    offset: 30,
    warning: "You'll need to run publisher and subscriber simultaneously",
  },
  {
    title: "Run Publisher First",
    text: "In one terminal, source the workspace and run your publisher: 'ros2 run your_pkg publisher_node'. You should see it publishing messages.",
    position: "top",
    target: ".terminal",
    offset: 30,
    tip: "Terminal 1: ros2 run your_pkg publisher_node",
  },
  {
    title: "Run Subscriber",
    text: "In the terminal (or use background with &), run the subscriber: 'ros2 run your_pkg subscriber_node'. You should now see it receiving the publisher's messages!",
    position: "top",
    target: ".terminal",
    offset: 30,
    tip: "Terminal 2: ros2 run your_pkg subscriber_node",
  },
  {
    title: "Press Ctrl+C to Stop",
    text: "Use Ctrl+C to stop running nodes. The terminal now supports real-time output streaming, so you can see messages as they arrive!",
    position: "top",
    target: ".terminal",
    offset: 30,
    tip: "Ctrl+C kills the running process",
  },
  {
    title: "Verify Communication",
    text: "Use 'ros2 topic list' to see active topics, 'ros2 topic info /chatter' to see publisher/subscriber counts, and 'ros2 topic hz /chatter' to check message frequency.",
    position: "top",
    target: ".terminal",
    offset: 30,
  },
  {
    title: "Subscriber Working! 🎉",
    text: "Congratulations! You've created a complete ROS2 publisher-subscriber system. This is the foundation of how ROS2 nodes communicate. Try creating more complex message types next!",
    position: "center",
    target: null,
    buttonText: "Tutorial Complete",
  },
];

/**
 * Tutorial for Creating LIDAR Subscriber
 * Guides user through subscribing to QCar LIDAR sensor data
 */
export const createLidarSubscriberTutorial = [
  {
    title: "Subscribing to LIDAR Sensor Data 🎯",
    text: "The QCar has a 360° LIDAR sensor that publishes distance measurements. You'll create a subscriber to receive this data and detect obstacles!",
    position: "center",
    target: null,
    buttonText: "Start Tutorial",
  },
  {
    title: "Understanding LIDAR Data",
    text: "LIDAR publishes to the /scan topic using the sensor_msgs/LaserScan message type. This includes arrays of distance measurements, angle information, and timing data.",
    position: "center",
    target: null,
    buttonText: "Next",
  },
  {
    title: "Create LIDAR Subscriber Node",
    text: "Navigate to the ROS2 tab and drag a Subscriber block to the canvas. We'll configure it to listen to the LIDAR sensor.",
    position: "right",
    target: ".categorized-palette__block[data-type='rosSubscriber']",
    offset: 20,
    tip: "Drag the Subscriber block to the canvas",
  },
  {
    title: "Configure Topic Name",
    text: "Set the topic name to '/scan'. This is where the QCar LIDAR publishes its sensor data.",
    position: "left",
    target: ".ros-subscriber-node input[placeholder='/chatter']",
    offset: 20,
    tip: "Enter: /scan",
  },
  {
    title: "Select Message Type",
    text: "Choose 'sensor_msgs/LaserScan' as the message type. This is the standard ROS2 message for LIDAR data containing range measurements.",
    position: "left",
    target: ".ros-subscriber-node__grid-2",
    offset: 20,
    warning: "Must use LaserScan for LIDAR data!",
  },
  {
    title: "Name Your Node",
    text: "Name your subscriber something like 'lidar_subscriber' or 'obstacle_detector'. This will be the node name shown in ROS2.",
    position: "left",
    target: ".ros-subscriber-node input[type='text']",
    offset: 20,
  },
  {
    title: "Generate Code",
    text: "Connect the subscriber to a 'Convert to Code' block to generate the Python node. The code will include callback handling for LaserScan messages.",
    position: "top",
    target: ".rf-node[data-type='rosSubscriber'] .react-flow__handle-right",
    offset: 20,
  },
  {
    title: "Processing LIDAR Data",
    text: "The generated callback receives a LaserScan message. You can access: msg.ranges (distance array), msg.angle_min/max (scan angles), and msg.range_min/max (distance limits).",
    position: "center",
    target: null,
    buttonText: "Understand",
  },
  {
    title: "Find Closest Obstacle",
    text: "In the callback, you can use min(msg.ranges) to find the closest obstacle distance. Add logic to warn if something is closer than 0.5 meters!",
    position: "top",
    target: ".terminal",
    offset: 30,
    tip: "Add: if min(msg.ranges) < 0.5: self.get_logger().warn('Obstacle detected!')",
  },
  {
    title: "Build and Test",
    text: "Save the file, build your package with 'colcon build', source the workspace, and run your node. If the QCar LIDAR is active, you'll see real-time distance data!",
    position: "top",
    target: ".terminal",
    offset: 30,
    tip: "Run: ros2 run your_pkg lidar_subscriber",
  },
  {
    title: "Visualize in RViz2",
    text: "Open RViz2 and add a LaserScan display with topic '/scan' to see the LIDAR data visually. You'll see a point cloud representing obstacles around the QCar!",
    position: "center",
    target: null,
    buttonText: "Got it!",
  },
  {
    title: "LIDAR Subscriber Complete! 🎉",
    text: "You've successfully subscribed to the QCar LIDAR sensor! Try processing the data to detect obstacles in specific directions or calculate safe navigation zones.",
    position: "center",
    target: null,
    buttonText: "Finish",
  },
];

/**
 * Tutorial for Creating Camera Subscriber
 * Guides user through subscribing to QCar camera feeds
 */
export const createCameraSubscriberTutorial = [
  {
    title: "Subscribing to Camera Data 📷",
    text: "The QCar has 5 cameras: 1 RGB camera and 4 CSI cameras (front, right, back, left). You'll create a subscriber to receive and process camera images!",
    position: "center",
    target: null,
    buttonText: "Let's Start",
  },
  {
    title: "QCar Camera Topics",
    text: "Camera topics: /camera/image_raw (RGB), /camera/csi_front/image_raw, /camera/csi_right/image_raw, /camera/csi_back/image_raw, /camera/csi_left/image_raw. All use sensor_msgs/Image message type.",
    position: "center",
    target: null,
    buttonText: "Next",
  },
  {
    title: "Create Camera Subscriber",
    text: "Drag a Subscriber block from the ROS2 tab. We'll configure it to receive images from the front camera.",
    position: "right",
    target: ".categorized-palette__block[data-type='rosSubscriber']",
    offset: 20,
    tip: "Drag Subscriber to canvas",
  },
  {
    title: "Set Camera Topic",
    text: "Set the topic to '/camera/csi_front/image_raw' to subscribe to the front camera. You can create separate subscribers for each camera if needed!",
    position: "left",
    target: ".ros-subscriber-node input[placeholder='/chatter']",
    offset: 20,
    tip: "Enter: /camera/csi_front/image_raw",
  },
  {
    title: "Select Image Message Type",
    text: "Choose 'sensor_msgs/Image' as the message type. This contains the image data, encoding format, dimensions, and timestamp.",
    position: "left",
    target: ".ros-subscriber-node__grid-2",
    offset: 20,
  },
  {
    title: "Name Your Camera Node",
    text: "Name it something like 'camera_subscriber' or 'front_camera_listener'. This helps identify which camera feed you're processing.",
    position: "left",
    target: ".ros-subscriber-node input[type='text']",
    offset: 20,
  },
  {
    title: "Generate Camera Subscriber Code",
    text: "Connect to 'Convert to Code' to generate the subscriber. The callback will receive Image messages with pixel data.",
    position: "top",
    target: ".rf-node[data-type='rosSubscriber'] .react-flow__handle-right",
    offset: 20,
  },
  {
    title: "Process Image Data",
    text: "The Image message contains: msg.width, msg.height, msg.encoding (RGB8, BGR8, etc.), and msg.data (raw pixel array). You can log image dimensions to verify it's working!",
    position: "center",
    target: null,
    buttonText: "Understand",
  },
  {
    title: "Optional: Use cv_bridge",
    text: "For image processing, install cv_bridge to convert ROS Images to OpenCV format. Add 'from cv_bridge import CvBridge' and use bridge.imgmsg_to_cv2(msg) in your callback.",
    position: "center",
    target: null,
    buttonText: "Good to know",
    warning: "Requires: pip install opencv-python",
  },
  {
    title: "Build and Run",
    text: "Build your package, source the workspace, and run the camera subscriber. If the camera is publishing, you'll see image messages arriving!",
    position: "top",
    target: ".terminal",
    offset: 30,
    tip: "Run: ros2 run your_pkg camera_subscriber",
  },
  {
    title: "Visualize with rqt_image_view",
    text: "To see the camera feed visually, run 'ros2 run rqt_image_view rqt_image_view' and select your camera topic. You'll see live video from the QCar!",
    position: "center",
    target: null,
    buttonText: "Try it!",
  },
  {
    title: "Monitor Multiple Cameras",
    text: "You can create multiple subscribers (one for each camera) in the same node, or create separate nodes for each camera feed. Great for 360° visual awareness!",
    position: "center",
    target: null,
    buttonText: "Interesting!",
  },
  {
    title: "Camera Subscriber Complete! 🎉",
    text: "You're now receiving camera data from the QCar! Next, try processing images for lane detection, object recognition, or motion detection.",
    position: "center",
    target: null,
    buttonText: "Finish Tutorial",
  },
];

/**
 * Tutorial for Creating a Bringup Package — granular micro-steps.
 * Each step = one UI action. Tooltip flies to the exact element.
 *
 * Selectors rely on:
 *  - ReactFlow node wrappers:  .react-flow__node-{type}
 *  - Palette tabs:             .rfp-palette__tab:nth-child(n)
 *                              (Input=1 Perception=2 ROS=3 URDF=4 Legacy=5 Output=6)
 *  - Palette chips:            div.rf-chip[title='Drag {Label} to canvas']
 *  - SweetAlert2 fields:       #swal-type  #swal-location  #swal-name  .lad-swal-confirm
 *  - IDE nav:                  button.bookmark-btn[title='Terminal|Code']
 *  - File explorer:            .file-explorer  /  button.file-explorer__action[title='New File or Folder']
 */
export const createLaunchFileTutorial = [

  // ── 1. Prerequisites ────────────────────────────────────────────────────────
  {
    title: "Before We Start",
    text: "Make sure you have already built your publisher and subscriber nodes from the previous lessons and run 'colcon build'.",
    position: "center",
    target: null,
    buttonText: "Ready — Let's Go!",
    warning: "publisher_node and subscriber_node must already be built before continuing.",
  },

  // ═══ PHASE 1 — CREATE THE BRINGUP PACKAGE ═══════════════════════════════════

  // ── 2. Open ROS tab ─────────────────────────────────────────────────────────
  {
    title: "Open the ROS Tab",
    text: "Click the ROS tab in the block palette to see the package and launch blocks.",
    position: "bottom",
    target: ".rfp-palette__tab:nth-child(3)",
    offset: 14,
  },

  // ── 3. Drag Create Package ───────────────────────────────────────────────────
  {
    title: "Drag 'Create Package' to the Canvas",
    text: "Drag this block onto the canvas. It generates the ros2 pkg create command for your bringup package.",
    position: "right",
    target: "div.rf-chip[title='Drag Create Package to canvas']",
    offset: 16,
  },

  // ── 4. Set package name ──────────────────────────────────────────────────────
  {
    title: "Set Package Name",
    text: "Type 'subpub_bringup' in the Package name field.",
    position: "right",
    target: ".react-flow__node-createPackage .rf-field--collapsible:first-child .rf-input",
    offset: 16,
    tip: "subpub_bringup",
    tipLabel: "Type:",
  },

  // ── 5. Set build type ────────────────────────────────────────────────────────
  {
    title: "Set Build Type to ament_cmake",
    text: "Select 'ament_cmake' here. This build type gives you CMakeLists.txt, which you'll need to install the launch folder.",
    position: "right",
    target: ".react-flow__node-createPackage .rf-grid-2 .rf-field:last-child .rf-input",
    offset: 16,
    tip: "ament_cmake",
    tipLabel: "Select:",
  },

  // ── 6. Open Output tab ───────────────────────────────────────────────────────
  {
    title: "Open the Output Tab",
    text: "Click the Output tab to find the 'Convert to Code' block.",
    position: "bottom",
    target: ".rfp-palette__tab:nth-child(6)",
    offset: 14,
  },

  // ── 7. Drag Convert to Code ──────────────────────────────────────────────────
  {
    title: "Drag 'Convert to Code' to the Canvas",
    text: "Drag this block onto the canvas, then connect the right handle of Create Package to its left input handle.",
    position: "right",
    target: "div.rf-chip[title='Drag Convert to Code to canvas']",
    offset: 16,
  },

  // ── 8. Click Run ─────────────────────────────────────────────────────────────
  {
    title: "Click ▶ Run",
    text: "Click the Run button on the Convert to Code block. The IDE will switch to the terminal and run the command automatically.",
    position: "left",
    target: ".react-flow__node-toCode button.btn:last-child",
    offset: 16,
  },

  // ── 9. Back to Code view + refresh ──────────────────────────────────────────
  {
    title: "Go Back to Code View",
    text: "Click Code to return to the editor. Then click ↻ in the file explorer — the new package won't appear until you refresh.",
    position: "top",
    target: "button.bookmark-btn[title='Code']",
    offset: 24,
    warning: "Don't see subpub_bringup? Click the ↻ refresh button in the file explorer.",
  },

  // ═══ PHASE 2 — CREATE THE launch/ FOLDER ════════════════════════════════════

  // ── 10. Switch to Terminal ───────────────────────────────────────────────────
  {
    title: "Switch to Terminal",
    text: "Click Terminal to open the shell.",
    position: "top",
    target: "button.bookmark-btn[title='Terminal']",
    offset: 24,
  },

  // ── 11. mkdir ────────────────────────────────────────────────────────────────
  {
    title: "Create the launch/ Folder",
    text: "Run this command. Every ROS 2 launch file must live in a folder named exactly 'launch'.",
    position: "top",
    target: "button.bookmark-btn[title='Terminal']",
    offset: 24,
    tip: "mkdir -p src/subpub_bringup/launch",
    warning: "After running, go back to Code and click ↻ to see the folder appear.",
  },

  // ═══ PHASE 3 — CREATE THE .canvas FILE ══════════════════════════════════════

  // ── 12. Back to Code ────────────────────────────────────────────────────────
  {
    title: "Back to Code View",
    text: "Click Code to return to the file explorer.",
    position: "top",
    target: "button.bookmark-btn[title='Code']",
    offset: 24,
  },

  // ── 13. Click + ─────────────────────────────────────────────────────────────
  {
    title: "Click + to Create a File",
    text: "Click this button to open the Create dialog.",
    position: "right",
    target: "button.file-explorer__action[title='New File or Folder']",
    offset: 16,
  },

  // ── 14. Set Type ─────────────────────────────────────────────────────────────
  {
    title: "Set Type → File",
    text: "Make sure 'File' is selected in the Type dropdown.",
    position: "right",
    target: "#swal-type",
    offset: 16,
    tip: "📄 File",
    tipLabel: "Select:",
  },

  // ── 15. Set Location ────────────────────────────────────────────────────────
  {
    title: "Set Location",
    text: "Choose the launch/ folder inside subpub_bringup as the location.",
    position: "right",
    target: "#swal-location",
    offset: 16,
    tip: "src/subpub_bringup/launch",
    tipLabel: "Select:",
  },

  // ── 16. Set Name ────────────────────────────────────────────────────────────
  {
    title: "Set File Name",
    text: "Type the file name. The .canvas extension tells the IDE to open it as a visual block diagram.",
    position: "right",
    target: "#swal-name",
    offset: 16,
    tip: "subpub_launch.canvas",
    tipLabel: "Type:",
  },

  // ── 17. Click Create ────────────────────────────────────────────────────────
  {
    title: "Click Create",
    text: "Confirm the dialog. Then click the new file in the file tree to open it as your active canvas.",
    position: "bottom",
    target: ".lad-swal-confirm",
    offset: 14,
  },

  // ═══ PHASE 4 — BUILD THE LAUNCH FILE WITH BLOCKS ════════════════════════════

  // ── 18. Open ROS tab ────────────────────────────────────────────────────────
  {
    title: "Open the ROS Tab",
    text: "Click the ROS tab to access the Launch Node and Launch File blocks.",
    position: "bottom",
    target: ".rfp-palette__tab:nth-child(3)",
    offset: 14,
  },

  // ── 19. Drag first Launch Node ──────────────────────────────────────────────
  {
    title: "Drag 'Launch Node' — Publisher",
    text: "Drag a Launch Node block to the canvas. This represents one node that will be started by the launch file.",
    position: "right",
    target: "div.rf-chip[title='Drag Launch Node to canvas']",
    offset: 16,
  },

  // ── 20. Select package ──────────────────────────────────────────────────────
  {
    title: "Select Your Pub/Sub Package",
    text: "Choose the package that contains your publisher and subscriber nodes — NOT subpub_bringup.",
    position: "right",
    target: ".react-flow__node-launchExecutable .rf-field:first-child .rf-input",
    offset: 16,
    warning: "If no packages appear, make sure you ran colcon build in the previous lesson.",
  },

  // ── 21. Select executable ────────────────────────────────────────────────────
  {
    title: "Select 'publisher_node'",
    text: "Choose publisher_node as the executable for this Launch Node.",
    position: "right",
    target: ".react-flow__node-launchExecutable .rf-field:nth-child(2) .rf-input",
    offset: 16,
    tip: "publisher_node",
    tipLabel: "Select:",
  },

  // ── 22. Drag second Launch Node + configure ──────────────────────────────────
  {
    title: "Add a Second Launch Node — Subscriber",
    text: "Drag another Launch Node block. Set the same package and choose 'subscriber_node' as the executable.",
    position: "right",
    target: "div.rf-chip[title='Drag Launch Node to canvas']",
    offset: 16,
    tip: "subscriber_node",
    tipLabel: "Executable:",
  },

  // ── 23. Drag Launch File ─────────────────────────────────────────────────────
  {
    title: "Drag 'Launch File' to the Canvas",
    text: "Drag the Launch File block. This is the container that wraps all your nodes into one launch file.",
    position: "right",
    target: "div.rf-chip[title='Drag Launch File to canvas']",
    offset: 16,
  },

  // ── 24. Set launch file name ─────────────────────────────────────────────────
  {
    title: "Set Launch File Name",
    text: "Type 'subpub_launch' in the File name field. It will be saved as subpub_launch.launch.py.",
    position: "right",
    target: ".react-flow__node-launchFile .rf-input",
    offset: 16,
    tip: "subpub_launch",
    tipLabel: "Type:",
  },

  // ── 25. Output tab + Convert to Code ────────────────────────────────────────
  {
    title: "Output Tab → Convert to Code",
    text: "Go to the Output tab, drag a Convert to Code block. Connect: Launch Nodes → Launch File → Convert to Code.",
    position: "bottom",
    target: ".rfp-palette__tab:nth-child(6)",
    offset: 14,
  },

  // ── 26. Run to save launch file ──────────────────────────────────────────────
  {
    title: "Click ▶ Run to Save the Launch File",
    text: "Click Run on the Convert to Code block. The generated .launch.py will be written to the terminal and saved to your launch/ folder.",
    position: "left",
    target: ".react-flow__node-toCode button.btn:last-child",
    offset: 16,
  },

  // ═══ PHASE 5 — EDIT package.xml ════════════════════════════════════════════

  // ── 27. Back to Code ─────────────────────────────────────────────────────────
  {
    title: "Back to Code View",
    text: "Click Code, then open package.xml inside src/subpub_bringup/ from the file tree.",
    position: "top",
    target: "button.bookmark-btn[title='Code']",
    offset: 24,
  },

  // ── 28. Open package.xml ────────────────────────────────────────────────────
  {
    title: "Open package.xml",
    text: "Click package.xml in the file tree to open it in the editor.",
    position: "right",
    target: ".file-explorer",
    offset: 20,
    tip: "src/subpub_bringup/package.xml",
    tipLabel: "→",
  },

  // ── 29. Add exec_depend ──────────────────────────────────────────────────────
  {
    title: "Add exec_depend",
    text: "After the <buildtool_depend> line, add this tag. Replace 'your_pubsub_pkg' with the real package name. This tells ROS 2 that subpub_bringup needs your nodes package at runtime.",
    position: "center",
    target: null,
    tip: "<exec_depend>your_pubsub_pkg</exec_depend>",
    tipLabel: "Add:",
  },

  // ═══ PHASE 6 — EDIT CMakeLists.txt ═════════════════════════════════════════

  // ── 30. Open CMakeLists.txt ──────────────────────────────────────────────────
  {
    title: "Open CMakeLists.txt",
    text: "Click CMakeLists.txt in the file tree to open it.",
    position: "right",
    target: ".file-explorer",
    offset: 20,
    tip: "src/subpub_bringup/CMakeLists.txt",
    tipLabel: "→",
  },

  // ── 31. Add install(DIRECTORY) ───────────────────────────────────────────────
  {
    title: "Add install(DIRECTORY)",
    text: "Before the ament_package() line at the bottom, add these lines. This copies your launch/ folder into the ROS 2 install directory so ros2 launch can find it.",
    position: "center",
    target: null,
    tip: "install(DIRECTORY\n  launch\n  DESTINATION share/${PROJECT_NAME})",
    tipLabel: "Add:",
    warning: "'launch' must match the folder name exactly.",
  },

  // ═══ PHASE 7 — BUILD AND LAUNCH ════════════════════════════════════════════

  // ── 32. Switch to Terminal ───────────────────────────────────────────────────
  {
    title: "Switch to Terminal",
    text: "Click Terminal to run the final build and launch commands.",
    position: "top",
    target: "button.bookmark-btn[title='Terminal']",
    offset: 24,
  },

  // ── 33. colcon build ────────────────────────────────────────────────────────
  {
    title: "Build the Package",
    text: "Run colcon build to compile subpub_bringup and copy the launch/ folder into the install directory.",
    position: "top",
    target: "button.bookmark-btn[title='Terminal']",
    offset: 24,
    tip: "colcon build --packages-select subpub_bringup",
  },

  // ── 34. Source and launch ────────────────────────────────────────────────────
  {
    title: "Source and Launch!",
    text: "Source the workspace, then launch both nodes with one command.",
    position: "top",
    target: "button.bookmark-btn[title='Terminal']",
    offset: 24,
    tip: "source install/setup.bash\nros2 launch subpub_bringup subpub_launch.launch.py",
    buttonText: "Complete!",
  },

  // ── 35. Done ────────────────────────────────────────────────────────────────
  {
    title: "Bringup Package Complete! 🎉",
    text: "You built a professional ROS 2 bringup package. One command now starts your entire pub/sub system.",
    position: "center",
    target: null,
    buttonText: "Finish",
  },
];

/**
 * ════════════════════════════════════════════════════════════════════════════
 * BETA TEST WALKTHROUGHS
 * Tight, self-contained tours for the beta missions (see config/betaMissions.js).
 * Selectors verified against the live DOM:
 *   • palette tab   → .rfp-palette__tab[data-category='X']   (data-category added to CategorizedPalette)
 *   • palette chip  → div.rf-chip[title='Drag <Label> to canvas']
 *   • canvas node   → .react-flow__node-<type>   (e.g. .react-flow__node-toCode)
 *   • IDE nav       → button.bookmark-btn[title='Code'|'Terminal'|'Simulation']
 *   • file explorer → button.file-explorer__action[title='New File or Folder']
 *   • create dialog → #swal-type / #swal-location / #swal-name / .lad-swal-confirm
 *   • editor mode   → .ide-test__editor-mode (🧩 Visual / 📝 Text)
 * Terminal command steps anchor on the Terminal bookmark button + a `tip`.
 * ════════════════════════════════════════════════════════════════════════════
 */

// ── Mission 1 — Create a workspace ──────────────────────────────────────────
export const betaCreateWorkspaceTutorial = [
  {
    title: "Welcome to the L.A.D Beta! 🚀",
    text: "Over the next missions you'll learn the RosFlow visual blocks: build a package, make nodes talk, design a robot, and more. First, every project needs a workspace.",
    position: "center",
    target: null,
    buttonText: "Let's go!",
  },
  {
    title: "Create a workspace",
    text: "If you see your workspace list, click the 'Create Canvas' card. (Already inside the IDE? You're set — skip to the next mission.)",
    position: "bottom",
    target: ".canvas-card--create",
    offset: 16,
    tip: "Click 'Create Canvas'",
    tipLabel: "Do:",
  },
  {
    title: "Name it",
    text: "Give your workspace a name — anything works, e.g. my_robot_ws.",
    position: "bottom",
    target: "#canvas-name",
    offset: 16,
    tip: "my_robot_ws",
    tipLabel: "Type:",
  },
  {
    title: "Confirm",
    text: "Click 'Create Canvas'. The moment your workspace is created, this mission completes and you'll pop back to the beta board to claim your points. 🗂️",
    position: "top",
    target: ".canvas-modal__button--create",
    offset: 16,
    buttonText: "Done",
  },
];

// ── Mission 2 — Create a package & build it ─────────────────────────────────
export const betaCreatePackageTutorial = [
  {
    title: "Make a ROS 2 package 📦",
    text: "A package groups your nodes and build rules. We'll generate one with a block instead of typing the command by hand. Tip: once you've done the steps, click the green ✓ Finish Mission button (top-right) to claim your points — you don't need to keep the tour open while you type in the terminal.",
    position: "center",
    target: null,
    buttonText: "Start",
  },
  {
    title: "Open your canvas",
    text: "Blocks live on a .canvas file. Click 'main.canvas' in the file list to open the visual block editor. No main.canvas? Click + and create a file named main.canvas, then open it.",
    position: "right",
    target: ".file-explorer",
    offset: 18,
    tip: "main.canvas",
    tipLabel: "Open / create:",
    warning: "If the list looks empty, click the ↻ button at the top to refresh.",
  },
  {
    title: "Open the ROS tab",
    text: "The palette groups blocks by category. Click the ROS tab.",
    position: "bottom",
    target: ".rfp-palette__tab[data-category='ROS']",
    offset: 14,
  },
  {
    title: "Drag 'Create Package'",
    text: "Drag this block onto the canvas. It builds the `ros2 pkg create` command for you.",
    position: "right",
    target: "div.rf-chip[title='Drag Create Package to canvas']",
    offset: 16,
  },
  {
    title: "Configure the package",
    text: "Click the block and set a package name (e.g. my_pkg). Leave build type as ament_python and keep rclpy + std_msgs as dependencies.",
    position: "left",
    target: ".react-flow__node-createPackage",
    offset: 20,
    tip: "my_pkg",
    tipLabel: "Name:",
    warning: "Remember this name — you'll reuse it in every later mission.",
  },
  {
    title: "Open the Output tab",
    text: "Now switch to the Output tab to find the block that turns your blocks into a real command.",
    position: "bottom",
    target: ".rfp-palette__tab[data-category='Output']",
    offset: 14,
  },
  {
    title: "Drag 'Convert to Code'",
    text: "Drag the Convert to Code block onto the canvas.",
    position: "right",
    target: "div.rf-chip[title='Drag Convert to Code to canvas']",
    offset: 16,
  },
  {
    title: "Connect the blocks",
    text: "Drag from the dot on the RIGHT of 'Create Package' to the dot on the LEFT of 'Convert to Code'. The generated command appears inside Convert to Code.",
    position: "top",
    target: ".react-flow__node-createPackage",
    offset: 20,
    tip: "Right handle of Create Package → left handle of Convert to Code",
    tipLabel: "Connect:",
  },
  {
    title: "Run it",
    text: "Click ▶ Run on the Convert to Code block. The IDE switches to the terminal and runs `ros2 pkg create` — your package folder appears under src/.",
    position: "left",
    target: ".react-flow__node-toCode",
    offset: 20,
  },
  {
    title: "Build the workspace",
    text: "In the terminal, compile everything with colcon. This turns your package into something ROS can run.",
    position: "top",
    target: "button.bookmark-btn[title='Terminal']",
    offset: 22,
    tip: "colcon build",
  },
  {
    title: "Source the workspace",
    text: "Tell this terminal where the freshly-built package is. Without sourcing, ROS won't find it.",
    position: "top",
    target: "button.bookmark-btn[title='Terminal']",
    offset: 22,
    tip: "source install/setup.bash",
  },
  {
    title: "Package built! 📦",
    text: "You generated, built and sourced a ROS 2 package — entirely from blocks. Next: put nodes inside it.",
    position: "center",
    target: null,
    buttonText: "Finish",
  },
];

// ── Mission 3 — Publisher & Subscriber (the full RosFlow workflow) ──────────
export const betaPubSubTutorial = [
  {
    title: "Publisher & Subscriber 📡",
    text: "Here's the core RosFlow workflow: build blocks on a .canvas file → Convert to Code turns them into a .py file → register the .py in setup.py → build → run. Let's do it. Tip: when you've finished the steps, click the green ✓ Finish Mission button (top-right) to claim your points.",
    position: "center",
    target: null,
    buttonText: "Start",
    warning: "Use the package you created in Mission 2 (we'll call it my_pkg here).",
  },
  {
    title: "Create the publisher's canvas",
    text: "Blocks live on a .canvas file. In the file explorer, click + to create one.",
    position: "right",
    target: "button.file-explorer__action[title='New File or Folder']",
    offset: 16,
  },
  {
    title: "Choose the location",
    text: "Open the Location dropdown and pick your package's module folder. Saving the canvas here means the generated .py lands right inside your package — no path typing later.",
    position: "right",
    target: "#swal-location",
    offset: 16,
    tip: "src/my_pkg/my_pkg",
    tipLabel: "Select:",
    warning: "Pick the folder that ends in your package name twice (src/my_pkg/my_pkg). Replace my_pkg with YOUR package name.",
  },
  {
    title: "Name it publisher_node.canvas",
    text: "Name it after the node. Convert to Code saves the Python next to the canvas with the same name — so this becomes publisher_node.py inside your package.",
    position: "right",
    target: "#swal-name",
    offset: 16,
    tip: "publisher_node.canvas",
    tipLabel: "Type:",
  },
  {
    title: "Create & open it",
    text: "Confirm the dialog, then click publisher_node.canvas in the file tree to open the visual editor.",
    position: "bottom",
    target: ".lad-swal-confirm",
    offset: 14,
  },
  {
    title: "Use the visual editor",
    text: "Make sure 🧩 Visual is selected (not 📝 Text). .canvas files open straight into the block editor.",
    position: "bottom",
    target: ".ide-test__editor-mode",
    offset: 16,
  },
  {
    title: "Open the ROS tab",
    text: "Click the ROS tab to find the Publisher and Subscriber blocks.",
    position: "bottom",
    target: ".rfp-palette__tab[data-category='ROS']",
    offset: 14,
  },
  {
    title: "Drag 'ROS2 Publisher'",
    text: "Drag a Publisher block onto the canvas.",
    position: "right",
    target: "div.rf-chip[title='Drag ROS2 Publisher to canvas']",
    offset: 16,
  },
  {
    title: "Configure the publisher",
    text: "Set the topic to /chatter, message type to String, and a name like publisher_node. The topic + type are how nodes find each other.",
    position: "left",
    target: ".react-flow__node-rosPublisher",
    offset: 20,
    tip: "/chatter · std_msgs/String",
    tipLabel: "Set:",
  },
  {
    title: "Add Convert to Code",
    text: "Open the Output tab and drag a Convert to Code block onto the canvas.",
    position: "bottom",
    target: ".rfp-palette__tab[data-category='Output']",
    offset: 14,
  },
  {
    title: "Connect & save",
    text: "Connect the Publisher's right handle to Convert to Code, then click 💾 Save File. Because your canvas lives in the package, it writes publisher_node.py right there — nothing to type.",
    position: "left",
    target: ".react-flow__node-toCode",
    offset: 20,
    tip: "→ src/my_pkg/my_pkg/publisher_node.py",
    tipLabel: "Saves:",
  },
  {
    title: "Now make the subscriber",
    text: "Same flow for the subscriber. Click + again to create another canvas.",
    position: "right",
    target: "button.file-explorer__action[title='New File or Folder']",
    offset: 16,
  },
  {
    title: "Location + name",
    text: "Pick the SAME location (src/my_pkg/my_pkg) and name it subscriber_node.canvas, then Create and open it.",
    position: "right",
    target: "#swal-location",
    offset: 16,
    tip: "src/my_pkg/my_pkg  ·  subscriber_node.canvas",
    tipLabel: "Set:",
  },
  {
    title: "Build the subscriber",
    text: "In the ROS tab drag a ROS2 Subscriber, set the SAME topic /chatter and type String, then connect it to a Convert to Code block and click 💾 Save File.",
    position: "left",
    target: "div.rf-chip[title='Drag ROS2 Subscriber to canvas']",
    offset: 16,
    tip: "→ src/my_pkg/my_pkg/subscriber_node.py",
    tipLabel: "Saves:",
    warning: "Topic and message type must match the publisher.",
  },
  {
    title: "Register them in setup.py",
    text: "Open src/my_pkg/setup.py and add BOTH nodes inside the entry_points → console_scripts list so `ros2 run` can find them. It should look like this (notice EVERY line ends with a comma):",
    position: "right",
    target: ".file-explorer",
    offset: 18,
    tip: "entry_points={\n    'console_scripts': [\n        'my_pkg = my_pkg.my_pkg:main',\n        'publisher_node = my_pkg.publisher_node:main',\n        'subscriber_node = my_pkg.subscriber_node:main',\n    ],\n},",
    tipLabel: "setup.py:",
    warning: "Each entry needs a trailing comma, and the name = my_pkg.<file_without_.py>:main (replace my_pkg with YOUR package name).",
  },
  {
    title: "Build",
    text: "Compile the package with your two new nodes.",
    position: "top",
    target: "button.bookmark-btn[title='Terminal']",
    offset: 22,
    tip: "colcon build",
  },
  {
    title: "Source",
    text: "Re-source so ROS picks up the new executables.",
    position: "top",
    target: "button.bookmark-btn[title='Terminal']",
    offset: 22,
    tip: "source install/setup.bash",
  },
  {
    title: "Run the publisher",
    text: "Start the publisher — it begins sending messages on /chatter.",
    position: "top",
    target: "button.bookmark-btn[title='Terminal']",
    offset: 22,
    tip: "ros2 run my_pkg publisher_node",
  },
  {
    title: "Run the subscriber",
    text: "Open a second terminal tab (+) and run the subscriber. Watch it print the messages the publisher sends — they're talking!",
    position: "top",
    target: "button.bookmark-btn[title='Terminal']",
    offset: 22,
    tip: "ros2 run my_pkg subscriber_node",
  },
  {
    title: "They're talking! 🎉",
    text: "You built two nodes from blocks, turned them into Python, registered them, and ran a live publisher/subscriber pair. That's the whole RosFlow loop.",
    position: "center",
    target: null,
    buttonText: "Finish",
  },
];

// ── Mission 4 — Build your own CAR (URDF) ───────────────────────────────────
// On-theme for L.A.D (Learn Autonomous Driving): students assemble a little
// self-driving car — a chassis plus a wheel that actually spins.
// Block wiring (all verified against the node files + BlockCanvas sync):
//   Geometry → Visual('geometry') → Link('visual') → Robot('links')
//   Coordinates → Visual('origin')  (lays the wheel cylinder flat)
//   Coordinates → Joint('origin');  Joint → Robot('joints')
//   Joint Controller('states') → URDF Viewer('states')
// BlockCanvas.syncUrdfDerived auto-feeds the robot XML into the URDF Viewer
// and Joint Controller blocks (NO xml wire needed). syncJointStates, however,
// only animates the viewer when an explicit Controller→Viewer 'states' edge
// exists — so that one connection is required. The wheel joint must be
// continuous (not fixed) for the controller to spin it.
// A URDF cylinder's length runs along Z; pitch=1.57 on the wheel's Visual
// origin lays it flat so its axle aligns with the joint's default X spin axis.
// Handles are LABELLED in the UI, so steps reference those labels by name.
// TF blocks are intentionally NOT used here: they render but don't generate
// code in the /research canvas (only in the Transformations curriculum level).
export const betaUrdfRobotTutorial = [
  {
    title: "Build your own car 🚗",
    text: "Every self-driving car starts as a URDF: LINKS (rigid parts like the chassis and wheels) joined by JOINTS (a wheel that spins). You'll wire a few blocks, watch the IDE render your car live in 3D, then spin a wheel. Tip: the green ✓ Finish Mission button (top-right) claims your points whenever you're done.",
    position: "center",
    target: null,
    buttonText: "Start",
  },
  {
    title: "Make a canvas for the car",
    text: "URDF blocks live on a .canvas file. In the file explorer click + to create a fresh one (keeping it separate from your code).",
    position: "right",
    target: "button.file-explorer__action[title='New File or Folder']",
    offset: 16,
  },
  {
    title: "Name it car.canvas",
    text: "Leave the location at the workspace root and name the file car.canvas. The .canvas extension opens it as a visual block editor.",
    position: "right",
    target: "#swal-name",
    offset: 16,
    tip: "car.canvas",
    tipLabel: "Type:",
  },
  {
    title: "Create & open it",
    text: "Confirm the dialog, then click car.canvas in the file tree to open the block editor.",
    position: "bottom",
    target: ".lad-swal-confirm",
    offset: 14,
  },
  {
    title: "Open the URDF tab",
    text: "Click the URDF tab in the palette to find the Robot, Link, Visual and Joint blocks.",
    position: "bottom",
    target: ".rfp-palette__tab[data-category='URDF']",
    offset: 14,
  },
  {
    title: "Drag the 'Robot' block",
    text: "Drag a Robot block onto the canvas. It's the root: every Link and Joint plugs into it, and it outputs the final URDF.",
    position: "right",
    target: "div.rf-chip[title='Drag Robot to canvas']",
    offset: 16,
  },
  {
    title: "Name your car",
    text: "Click the Robot block and set its name to my_car. Notice its left handles labelled links / joints — that's where parts plug in.",
    position: "left",
    target: ".react-flow__node-urdfRobot",
    offset: 20,
    tip: "my_car",
    tipLabel: "Name:",
  },
  {
    title: "Drag a 'Link' block — the chassis",
    text: "Drag a Link block. A link is one rigid part. Name this one base_link — it's the car's chassis (the main body that everything attaches to).",
    position: "right",
    target: "div.rf-chip[title='Drag Link to canvas']",
    offset: 16,
    tip: "base_link",
    tipLabel: "Link name:",
  },
  {
    title: "Drag a 'Visual' block",
    text: "Drag a Visual block. It gives a link its appearance — a shape plus an optional colour. We'll feed it a shape from a dedicated Geometry block next.",
    position: "right",
    target: "div.rf-chip[title='Drag Visual to canvas']",
    offset: 16,
  },
  {
    title: "Shape the chassis with 'Geometry'",
    text: "Open the Input tab and drag a Geometry block. Keep its Type as Box and set a chassis-like size: 0.4 (length) × 0.2 (width) × 0.1 (height). Then connect its 'geometry' dot (right) to the Visual's 'geometry' dot (left).",
    position: "right",
    target: ".rfp-palette__tab[data-category='Input']",
    offset: 14,
    tip: "Box 0.4 × 0.2 × 0.1 · Geometry('geometry') → Visual('geometry')",
    tipLabel: "Do:",
  },
  {
    title: "Wire the chassis together",
    text: "Now chain the chassis: Visual → base_link, then base_link → Robot. Drag Visual's 'visual' dot (right) to the Link's 'visual' dot (left); then the Link's 'link' dot (right) to the Robot's 'links' dot (left).",
    position: "top",
    target: ".react-flow__node-urdfVisual",
    offset: 20,
    tip: "Visual → Link('visual')   then   Link → Robot('links')",
    tipLabel: "Connect:",
    warning: "The Link has three left dots — inertial, visual, collision. Use the 'visual' one.",
  },
  {
    title: "See it in 3D — on the canvas! 🧊",
    text: "Open the Visualization tab and drag a 'URDF 3D Viewer' block onto the canvas. It automatically receives your car's description (no wire needed) and renders the chassis live, right beside your blocks.",
    position: "right",
    target: ".rfp-palette__tab[data-category='Visualization']",
    offset: 14,
    tip: "Drag 'URDF 3D Viewer' — it auto-renders the car",
    tipLabel: "Do:",
  },
  {
    title: "Add a wheel",
    text: "Now a wheel. Switch back to the URDF tab for the Link and Visual (Geometry stays in the Input tab). Drag a Link (name it wheel_fl), a Visual, and a Geometry set to Type Cylinder (radius ~0.06, length ~0.04). Wire Geometry → Visual('geometry'), Visual → wheel_fl('visual'), wheel_fl → Robot('links').",
    position: "right",
    target: "div.rf-chip[title='Drag Link to canvas']",
    offset: 16,
    tip: "wheel_fl · Cylinder r0.06 L0.04 · Geometry → Visual → wheel_fl → Robot",
    tipLabel: "Repeat:",
  },
  {
    title: "Lay the wheel on its side",
    text: "A cylinder stands upright by default. Drag a Coordinates block (Input tab), set Rotation pitch to 1.57, and connect its 'coordinates' dot to the WHEEL Visual's 'origin' dot. Now the cylinder lies flat — a proper wheel.",
    position: "right",
    target: ".rfp-palette__tab[data-category='Input']",
    offset: 14,
    tip: "Coordinates pitch = 1.57 → wheel Visual's 'origin'",
    tipLabel: "Do:",
    warning: "Connect to the WHEEL's Visual 'origin' dot — not the chassis Visual.",
  },
  {
    title: "Connect the wheel with a 'Joint'",
    text: "A joint connects two links. In the URDF tab drag a Joint, name it wheel_fl_joint, and set Type to CONTINUOUS (so the wheel spins freely, no end stops). Type the Parent (base_link) and Child (wheel_fl).",
    position: "right",
    target: "div.rf-chip[title='Drag Joint to canvas']",
    offset: 16,
    tip: "name wheel_fl_joint · type continuous · parent base_link · child wheel_fl",
    tipLabel: "Set:",
    warning: "Use continuous (not fixed) — a fixed joint can't move, so the controller would have nothing to spin.",
  },
  {
    title: "Position the wheel & attach the joint",
    text: "Place the wheel at a front corner. Drag another Coordinates block, set Position to about x 0.15, y 0.11, z 0, and connect it to the Joint's 'origin' dot. Then connect the Joint's 'joint' dot (right) to the Robot's 'joints' dot (left). The wheel snaps to the corner in the Viewer.",
    position: "top",
    target: ".react-flow__node-urdfJoint",
    offset: 20,
    tip: "Coordinates(x 0.15, y 0.11) → Joint('origin')   then   Joint → Robot('joints')",
    tipLabel: "Connect:",
  },
  {
    title: "Add a 'Joint Controller'",
    text: "Back in the Visualization tab, drag a Joint Controller block. It reads your car, finds the movable wheel_fl_joint, and gives you a slider. (Fixed joints wouldn't show up here.)",
    position: "right",
    target: ".rfp-palette__tab[data-category='Visualization']",
    offset: 14,
    tip: "Drag 'Joint Controller' — it auto-detects the continuous wheel joint",
    tipLabel: "Do:",
  },
  {
    title: "Wire the controller into the viewer",
    text: "Connect the Joint Controller's 'states' dot (right) to the URDF Viewer's 'states' dot (left). This sends live joint angles into the 3D render.",
    position: "top",
    target: ".react-flow__node-urdfControl",
    offset: 20,
    tip: "Joint Controller (right, 'states') → URDF Viewer (left, 'states')",
    tipLabel: "Connect:",
  },
  {
    title: "Spin the wheel! 🛞",
    text: "Drag the wheel_fl_joint slider on the Joint Controller and watch the wheel spin in the URDF Viewer — in real time. You're driving your car's wheel straight from the blocks.",
    position: "left",
    target: ".react-flow__node-urdfControl",
    offset: 20,
  },
  {
    title: "Optional: add the other 3 wheels",
    text: "A real car has four wheels. Repeat the wheel recipe three more times (wheel_fr, wheel_rl, wheel_rr) with mirrored x/y positions — or skip ahead and add them later. Either way, you've got the pattern down.",
    position: "center",
    target: null,
  },
  {
    title: "Export it as a .urdf file",
    text: "To save your car as a file, click the URDF button in the header to open the floating URDF window, then click 'Copy XML' to copy the full description.",
    position: "bottom",
    target: "button[title='Toggle URDF Viewer window']",
    offset: 16,
    tip: "URDF button → Copy XML",
    tipLabel: "Do:",
  },
  {
    title: "Create my_car.urdf",
    text: "Click + in the file explorer, name the file my_car.urdf at the workspace root, Create, then open it. It opens as a text file.",
    position: "right",
    target: "button.file-explorer__action[title='New File or Folder']",
    offset: 16,
    tip: "my_car.urdf",
    tipLabel: "Type:",
  },
  {
    title: "Paste & save",
    text: "Click inside the editor, paste with Ctrl+V, then save with Ctrl+S (or the 💾 Save button). You now have a real, reusable URDF file in your workspace.",
    position: "left",
    target: ".ide-test__editor-container",
    offset: 16,
    tip: "Ctrl+V to paste · Ctrl+S to save",
    tipLabel: "Do:",
  },
  {
    title: "Car built! 🏎️",
    text: "You assembled a car from Geometry, Link, Visual and Joint blocks, rendered it live, spun a wheel with a controller, and exported a .urdf — the same description format that drives the QCar. (Want to broadcast its frames over TF? That's covered in the Transformations unit.)",
    position: "center",
    target: null,
    buttonText: "Finish",
  },
];

// ── Mission 5 — Create a custom map & run it ────────────────────────────────
// The Simulation tab opens with its side menu HIDDEN for a clean view. The
// 'Open Map Menu' button (IDE header) reveals the Run Map / Map Creator modes.
// MapCreator is a click-to-place 3D scene; saving uses a browser prompt().
// Switching to 'Run Map' re-hides the menu (by design) — the tour calls this
// out so the student isn't surprised.
export const betaCustomMapTutorial = [
  {
    title: "Create a custom map 🗺️",
    text: "You'll draw a little world for the QCar — a floor, a spawn point and a few obstacles — then load it in the physics simulator. Tip: the green ✓ Finish Mission button (top-right) claims your points whenever you're done.",
    position: "center",
    target: null,
    buttonText: "Start",
  },
  {
    title: "You're in the Simulation tab",
    text: "This mission opens straight in the Simulation workspace. The side menu is hidden for a clean view — we'll reveal it next.",
    position: "top",
    target: "button.bookmark-btn[title='Simulation']",
    offset: 22,
  },
  {
    title: "Open the map menu",
    text: "Click 'Open Map Menu' to show the simulator's controls.",
    position: "bottom",
    target: "[data-tour='sim-open-menu']",
    offset: 16,
  },
  {
    title: "Switch to Map Creator",
    text: "Click 'Map Creator' to start drawing a world. (The other mode, Run Map, is where you'll drive it.)",
    position: "bottom",
    target: "[data-tour='sim-create']",
    offset: 16,
  },
  {
    title: "Set the floor size",
    text: "In the Map Creator panel, set the floor Width and Height in meters (20 × 20 is a good start). You can also upload a floor image — optional.",
    position: "right",
    target: "[data-tour='map-creator-panel']",
    offset: 16,
    tip: "Width 20 · Height 20",
    tipLabel: "Set:",
  },
  {
    title: "Place the car's spawn point",
    text: "Click 'Move Spawn Point', then click anywhere on the floor to drop the green car marker. Set Yaw to rotate which way it faces.",
    position: "right",
    target: "[data-tour='map-spawn']",
    offset: 16,
    warning: "After clicking the button, click ON the 3D floor to place the spawn.",
  },
  {
    title: "Add some obstacles",
    text: "Pick an asset (a wall or cone), then click on the floor to place it. Drop a few so the QCar has something to drive around.",
    position: "right",
    target: "[data-tour='map-assets']",
    offset: 16,
    tip: "Select an asset → click the floor to place it",
    tipLabel: "Do:",
  },
  {
    title: "Save the map",
    text: "Click 'Save Map to IDE'. A small dialog asks for a file name — type track1 and confirm. It saves as track1.json in your workspace.",
    position: "right",
    target: "[data-tour='map-save']",
    offset: 16,
    tip: "track1.json",
    tipLabel: "Name:",
    warning: "This uses your browser's prompt box — type a name and press OK.",
  },
  {
    title: "Switch to Run Map",
    text: "Now click 'Run Map' to load your world into the physics simulator.",
    position: "bottom",
    target: "[data-tour='sim-run']",
    offset: 16,
    warning: "Run Map hides the side menu for an immersive view — that's normal, we'll bring it back.",
  },
  {
    title: "Re-open the menu",
    text: "Click 'Open Map Menu' again to show the Run controls (the map picker).",
    position: "bottom",
    target: "[data-tour='sim-open-menu']",
    offset: 16,
  },
  {
    title: "Pick your map",
    text: "In the Map Runner panel, choose track1.json from the dropdown.",
    position: "right",
    target: "[data-tour='map-select']",
    offset: 16,
    tip: "track1.json",
    tipLabel: "Select:",
  },
  {
    title: "Load & Run 🚗",
    text: "Click 'Load & Run'. Your QCar spawns on the map with real physics — plus live cameras and LIDAR in the side panels.",
    position: "right",
    target: "[data-tour='map-load']",
    offset: 16,
  },
  {
    title: "World alive! 🌍",
    text: "Your custom map is running a real physics QCar. In the final mission you'll wire up blocks to make it drive itself around this very world.",
    position: "center",
    target: null,
    buttonText: "Finish",
  },
];

// ── Mission 6 — Self-driving demo (the capstone) ────────────────────────────
// Variant A from BETA_AND_METRICS_PLAN.md §A.6: a reactive, /scan-only pipeline
// that is guaranteed to run in the IDE Simulation tab (which publishes /scan and
// subscribes /cmd_vel; it does NOT publish odom, so waypoint following is out).
//
// The pipeline (3 generated nodes, all wired to ONE launch file):
//   Constant Float ──/target_speed──▶ Velocity Command.linear ──▶ /cmd_vel
//   /scan ─▶ Obstacle Detector ──/obstacle/detected──▶ Velocity Command.stop
// Result: the QCar cruises forward at a constant speed and emergency-stops when
// the LIDAR sees a wall/obstacle inside the threshold.
//
// Topic plumbing is automatic: constantFloat / obstacleDetector / velocityCommand
// all namespace their topics with enforceWorkspace(canvasId), which matches the
// simulator's /ws_<canvasId>/… namespace — so the student never types it.
// We reuse the package built in Mission 2 (referred to as my_pkg) and run the
// launch file by PATH, so there's no package.xml/CMakeLists editing.
export const betaSelfDrivingTutorial = [
  {
    title: "Self-driving demo 🏎️",
    text: "Time to make the QCar drive itself. You'll wire three blocks into an autonomy pipeline: a constant cruise speed, a LIDAR obstacle detector, and a velocity command that drives /cmd_vel — and stops the car when it sees a wall. One launch file starts the whole stack. Tip: the green ✓ Finish Mission button (top-right) claims your points whenever you're done.",
    position: "center",
    target: null,
    buttonText: "Start",
    warning: "Use the package you built in Mission 2 (we'll call it my_pkg). You'll also want a saved map from Mission 5 to drive in.",
  },

  // ═══ NODE 1 — Constant cruise speed ═════════════════════════════════════════
  {
    title: "Node 1: a constant cruise speed",
    text: "First, a block that publishes one steady number — the car's forward speed. In the file explorer, click + to make a new canvas.",
    position: "right",
    target: "button.file-explorer__action[title='New File or Folder']",
    offset: 16,
  },
  {
    title: "Location + name",
    text: "Pick your package's module folder (src/my_pkg/my_pkg) and name it cruise_speed.canvas, then Create and open it.",
    position: "right",
    target: "#swal-location",
    offset: 16,
    tip: "src/my_pkg/my_pkg  ·  cruise_speed.canvas",
    tipLabel: "Set:",
    warning: "Pick the folder that ends in your package name twice (src/my_pkg/my_pkg). Replace my_pkg with YOUR package name.",
  },
  {
    title: "Open the ROS tab",
    text: "Click the ROS tab — we'll publish the cruise speed with a normal ROS 2 Publisher (the same block from Mission 3).",
    position: "bottom",
    target: ".rfp-palette__tab[data-category='ROS']",
    offset: 14,
  },
  {
    title: "Drag 'ROS2 Publisher'",
    text: "Drag a ROS2 Publisher block onto the canvas. A publisher repeatedly sends a value on a topic — here, the car's forward speed.",
    position: "right",
    target: "div.rf-chip[title='Drag ROS2 Publisher to canvas']",
    offset: 16,
  },
  {
    title: "Publish a constant speed",
    text: "Set Topic to /target_speed, Package to std_msgs, Message Type to Float32, then type 0.4 in the Data Value field (0.4 m/s — a gentle cruise). That value is the input the car drives at.",
    position: "left",
    target: ".react-flow__node-rosPublisher",
    offset: 20,
    tip: "/target_speed · std_msgs/Float32 · data 0.4",
    tipLabel: "Set:",
  },
  {
    title: "Convert to Code & save",
    text: "Open the Output tab, drag a Convert to Code block, connect the Publisher → Convert to Code, then click 💾 Save File. It writes cruise_speed.py inside your package.",
    position: "left",
    target: ".react-flow__node-toCode",
    offset: 20,
    tip: "→ src/my_pkg/my_pkg/cruise_speed.py",
    tipLabel: "Saves:",
  },

  // ═══ NODE 2 — Obstacle detector ═════════════════════════════════════════════
  {
    title: "Node 2: the obstacle detector",
    text: "Now the eyes. This block reads the LIDAR and raises a flag when something is too close. Click + to make another canvas.",
    position: "right",
    target: "button.file-explorer__action[title='New File or Folder']",
    offset: 16,
  },
  {
    title: "Location + name",
    text: "Same location (src/my_pkg/my_pkg), name it obstacle_detector.canvas, Create and open it.",
    position: "right",
    target: "#swal-location",
    offset: 16,
    tip: "src/my_pkg/my_pkg  ·  obstacle_detector.canvas",
    tipLabel: "Set:",
  },
  {
    title: "Drag 'Obstacle Detector'",
    text: "In the Control tab, drag an Obstacle Detector block onto the canvas.",
    position: "right",
    target: "div.rf-chip[title='Drag Obstacle Detector to canvas']",
    offset: 16,
  },
  {
    title: "Configure the detector",
    text: "Leave Scan topic as /scan (the simulator's LIDAR), keep Sector = front, set Threshold to 0.6 m, and note the Detected topic is /obstacle/detected. That Bool flag is what stops the car.",
    position: "left",
    target: ".react-flow__node-obstacleDetector",
    offset: 20,
    tip: "/scan · front · 0.6 m · /obstacle/detected",
    tipLabel: "Set:",
  },
  {
    title: "Convert to Code & save",
    text: "Drag a Convert to Code (Output tab), connect Obstacle Detector → Convert to Code, and click 💾 Save File. It writes obstacle_detector.py.",
    position: "left",
    target: ".react-flow__node-toCode",
    offset: 20,
    tip: "→ src/my_pkg/my_pkg/obstacle_detector.py",
    tipLabel: "Saves:",
  },

  // ═══ NODE 3 — Velocity command (with stop gate) ═════════════════════════════
  {
    title: "Node 3: the velocity command",
    text: "The muscles. This block turns the speed into a /cmd_vel the QCar obeys — and stops it when the detector flag is true. Click + for one more canvas.",
    position: "right",
    target: "button.file-explorer__action[title='New File or Folder']",
    offset: 16,
  },
  {
    title: "Location + name",
    text: "Same location, name it velocity_command.canvas, Create and open it.",
    position: "right",
    target: "#swal-location",
    offset: 16,
    tip: "src/my_pkg/my_pkg  ·  velocity_command.canvas",
    tipLabel: "Set:",
  },
  {
    title: "Drag 'Velocity Command'",
    text: "In the Control tab, drag a Velocity Command block onto the canvas.",
    position: "right",
    target: "div.rf-chip[title='Drag Velocity Command to canvas']",
    offset: 16,
  },
  {
    title: "Wire the speed in, the stop in",
    text: "Set Linear topic to /target_speed (matches Node 1), set the Stop topic to /obstacle/detected (matches Node 2), and leave cmd_vel topic as /cmd_vel. Leave the angular topic empty so the car drives straight.",
    position: "left",
    target: ".react-flow__node-velocityCommand",
    offset: 20,
    tip: "linear /target_speed · stop /obstacle/detected · /cmd_vel",
    tipLabel: "Set:",
    warning: "The Linear topic MUST equal Node 1's output, and the Stop topic MUST equal Node 2's detected topic — that's how the blocks connect at runtime.",
  },
  {
    title: "Convert to Code & save",
    text: "Drag a Convert to Code (Output tab), connect Velocity Command → Convert to Code, and click 💾 Save File. It writes velocity_command.py.",
    position: "left",
    target: ".react-flow__node-toCode",
    offset: 20,
    tip: "→ src/my_pkg/my_pkg/velocity_command.py",
    tipLabel: "Saves:",
  },

  // ═══ REGISTER + BUILD ═══════════════════════════════════════════════════════
  {
    title: "Register all three nodes",
    text: "Open src/my_pkg/setup.py and add all three nodes to entry_points → console_scripts so ROS can run them (every line ends with a comma):",
    position: "right",
    target: ".file-explorer",
    offset: 18,
    tip: "'console_scripts': [\n    'cruise_speed = my_pkg.cruise_speed:main',\n    'obstacle_detector = my_pkg.obstacle_detector:main',\n    'velocity_command = my_pkg.velocity_command:main',\n],",
    tipLabel: "setup.py:",
    warning: "Replace my_pkg with YOUR package name. Keep any nodes you registered in earlier missions.",
  },
  {
    title: "Declare dependencies in package.xml",
    text: "Open src/my_pkg/package.xml and declare the libraries your nodes import, so colcon resolves them. Add these just before </package> (skip any that are already there):",
    position: "right",
    target: ".file-explorer",
    offset: 18,
    tip: "<depend>rclpy</depend>\n<depend>std_msgs</depend>\n<depend>sensor_msgs</depend>\n<depend>geometry_msgs</depend>",
    tipLabel: "package.xml:",
    warning: "rclpy is usually already present — don't duplicate it.",
  },
  {
    title: "Build",
    text: "Switch to the Terminal and compile the package with your three new nodes.",
    position: "top",
    target: "button.bookmark-btn[title='Terminal']",
    offset: 22,
    tip: "colcon build",
  },
  {
    title: "Source",
    text: "Re-source so ROS sees the new executables.",
    position: "top",
    target: "button.bookmark-btn[title='Terminal']",
    offset: 22,
    tip: "source install/setup.bash",
  },

  // ═══ LAUNCH FILE — start the whole stack at once ════════════════════════════
  {
    title: "Make a launch/ folder",
    text: "ROS 2 packages keep launch files in a folder named exactly 'launch'. Create it in the Terminal — then go back to Code and click ↻ to see it.",
    position: "top",
    target: "button.bookmark-btn[title='Terminal']",
    offset: 22,
    tip: "mkdir -p src/my_pkg/launch",
    warning: "Replace my_pkg with YOUR package name.",
  },
  {
    title: "One launch file to rule them all",
    text: "Instead of three terminals, you'll start all three nodes with ONE launch file. Back in Code view, click + to make a launch canvas.",
    position: "right",
    target: "button.file-explorer__action[title='New File or Folder']",
    offset: 16,
  },
  {
    title: "Location + name",
    text: "Save it in the new src/my_pkg/launch folder and name it drive.canvas, then Create and open it.",
    position: "right",
    target: "#swal-location",
    offset: 16,
    tip: "src/my_pkg/launch  ·  drive.canvas",
    tipLabel: "Set:",
  },
  {
    title: "Add three Launch Nodes",
    text: "Open the ROS tab and drag THREE Launch Node blocks. For each, set Package = my_pkg and Executable = cruise_speed, obstacle_detector, and velocity_command respectively.",
    position: "right",
    target: "div.rf-chip[title='Drag Launch Node to canvas']",
    offset: 16,
    tip: "my_pkg · cruise_speed / obstacle_detector / velocity_command",
    tipLabel: "Set each:",
    warning: "If no packages/executables appear, make sure colcon build succeeded above.",
  },
  {
    title: "Add the Launch File block",
    text: "Drag a Launch File block, set its File name to drive, then connect all three Launch Nodes → Launch File.",
    position: "right",
    target: "div.rf-chip[title='Drag Launch File to canvas']",
    offset: 16,
    tip: "drive  →  drive.launch.py",
    tipLabel: "Name:",
  },
  {
    title: "Convert to Code & save",
    text: "Drag a Convert to Code (Output tab), connect Launch File → Convert to Code, then 💾 Save File. Convert to Code recognizes a launch file and saves it as drive.launch.py inside launch/.",
    position: "left",
    target: ".react-flow__node-toCode",
    offset: 20,
    tip: "→ src/my_pkg/launch/drive.launch.py",
    tipLabel: "Saves:",
  },

  // ═══ INSTALL THE LAUNCH FOLDER INTO THE PACKAGE ═════════════════════════════
  {
    title: "Install the launch/ folder (setup.py)",
    text: "So you can run `ros2 launch my_pkg …` by name (not a long path), tell setup.py to install the launch folder. Add the two imports at the top of setup.py, then add the launch line inside the existing data_files list:",
    position: "right",
    target: ".file-explorer",
    offset: 18,
    tip: "import os\nfrom glob import glob\n\n# inside setup(... data_files=[ ... ]):\n(os.path.join('share', package_name, 'launch'), glob('launch/*.launch.py')),",
    tipLabel: "setup.py:",
    warning: "Keep the existing data_files entries; just add the launch line (with a trailing comma).",
  },
  {
    title: "Rebuild & re-source",
    text: "Build again so the launch/ folder is installed into the package, then re-source.",
    position: "top",
    target: "button.bookmark-btn[title='Terminal']",
    offset: 22,
    tip: "colcon build\nsource install/setup.bash",
  },

  // ═══ DRIVE IT ═══════════════════════════════════════════════════════════════
  {
    title: "Launch the autonomy stack",
    text: "Now start all three nodes the clean way — by package name, because the launch file is installed in your package:",
    position: "top",
    target: "button.bookmark-btn[title='Terminal']",
    offset: 22,
    tip: "ros2 launch my_pkg drive.launch.py",
    warning: "Replace my_pkg with YOUR package name. Source first if you opened a fresh terminal.",
  },
  {
    title: "Watch it drive 🚗",
    text: "Switch to the Simulation tab and load your map from Mission 5 (Run Map → Load & Run). The QCar drives forward on its own — and stops itself when the LIDAR sees a wall inside 0.6 m. That's perception → decision → motion, the whole autonomy loop.",
    position: "top",
    target: "button.bookmark-btn[title='Simulation']",
    offset: 22,
    buttonText: "Almost!",
  },
  // ═══ STRETCH — follow a drawn route (like vehicle_control.py) ════════════════
  {
    title: "Level up: follow a route 🏁",
    text: "Want the car to follow a path, not just stop at walls? With the Pure Pursuit block and a route you draw, it will — closed-loop, like Quanser's vehicle_control.py example. This is optional: finish here for your points, or try the stretch.",
    position: "center",
    target: null,
    buttonText: "Show me",
  },
  {
    title: "Draw a route on the cityscape",
    text: "Open the Simulation tab → Map Creator. Pick the built-in 🏙 SDCS Cityscape map, click 'Place Waypoints', and click along the road to drop an ordered route. Save the map. The simulator publishes your route on /planned_path and the car's pose on /odom.",
    position: "top",
    target: "button.bookmark-btn[title='Simulation']",
    offset: 22,
    tip: "Route Waypoints → Place Waypoints → click the road → Save Map",
    tipLabel: "Do:",
  },
  {
    title: "Add a Pure Pursuit node",
    text: "On a new canvas in your package, open the Control tab and drag a Pure Pursuit block. It reads /odom + /planned_path and steers /cmd_vel toward a lookahead point on the route. Convert to Code → Save → register in setup.py → colcon build → source — the same flow you just used.",
    position: "right",
    target: ".rfp-palette__tab[data-category='Control']",
    offset: 14,
    tip: "Pure Pursuit · /odom + /planned_path → /cmd_vel",
    tipLabel: "Use:",
  },
  {
    title: "Drive the route 🏙",
    text: "Run the follower (ros2 run my_pkg pure_pursuit), load the cityscape map, and watch the QCar follow your waypoints around the city — closed-loop path tracking, just like the Quanser example.",
    position: "top",
    target: "button.bookmark-btn[title='Terminal']",
    offset: 22,
    tip: "ros2 run my_pkg pure_pursuit",
    warning: "Tune cruise speed / lookahead on the Pure Pursuit block if it cuts corners or wobbles.",
  },
  {
    title: "Or drive the real SDCS roadmap 🗺",
    text: "Prefer the lab's exact map? Drag an 'SDCS Roadmap' block (Control tab) instead. You don't draw waypoints — you type a node sequence like 10, 4, 20, 10 (the red-numbered points on the SDCS right-hand-traffic map) and it generates the real curved roads and follows them. Use the built-in 🏙 SDCS Cityscape map. If the path looks shifted, nudge the block's x/y/yaw offset params.",
    position: "right",
    target: ".rfp-palette__tab[data-category='Control']",
    offset: 14,
    tip: "SDCS Roadmap · sequence 10, 4, 20, 10 → real roads",
    tipLabel: "Try:",
  },
  {
    title: "You built a self-driving car! 🏁",
    text: "Three blocks, one launch file: a constant speed, a LIDAR safety check, and a velocity command that fuses them into /cmd_vel — plus an optional Pure Pursuit follower that tracks a route. You just shipped a working autonomy pipeline in the browser. Thanks for testing L.A.D!",
    position: "center",
    target: null,
    buttonText: "Finish",
  },
];

// Export all tutorials
export default {
  createPackage: createPackageTutorial,
  createPublisher: createPublisherTutorial,
  createSubscriber: createSubscriberTutorial,
  createLidarSubscriber: createLidarSubscriberTutorial,
  createCameraSubscriber: createCameraSubscriberTutorial,
  createLaunchFile: createLaunchFileTutorial,

  // Beta walkthroughs
  betaCreateWorkspace: betaCreateWorkspaceTutorial,
  betaCreatePackage: betaCreatePackageTutorial,
  betaPubSub: betaPubSubTutorial,
  betaUrdfRobot: betaUrdfRobotTutorial,
  betaCustomMap: betaCustomMapTutorial,
  betaSelfDriving: betaSelfDrivingTutorial,
};
