// TF transform generation helpers for BlockCanvas

/**
 * Generate ROS2 static_transform_publisher command from TF block data
 */
export function generateTfStaticCommand(frameData, parentFrameId = "world") {
  if (!frameData) return "";

  const {
    frameId = "",
    childFrameId = "",
    position = { x: 0, y: 0, z: 0 },
    rotation = { roll: 0, pitch: 0, yaw: 0 },
    broadcastType = "static"
  } = frameData;

  // Determine which frame ID to use (tfFrame uses frameId, tfChild uses childFrameId)
  const targetFrameId = childFrameId || frameId;

  if (!targetFrameId) {
    return "# Frame ID required";
  }

  const { x, y, z } = position;
  const { roll, pitch, yaw } = rotation;

  // Format: ros2 run tf2_ros static_transform_publisher x y z yaw pitch roll parent_frame child_frame
  const cmd = `ros2 run tf2_ros static_transform_publisher ${x} ${y} ${z} ${yaw} ${pitch} ${roll} ${parentFrameId} ${targetFrameId}`;

  return cmd;
}

/**
 * Generate Python script for TF broadcaster node
 */
export function generateTfBroadcasterCode(frameData, parentFrameId = "world") {
  if (!frameData) return "";

  const {
    frameId = "",
    childFrameId = "",
    position = { x: 0, y: 0, z: 0 },
    rotation = { roll: 0, pitch: 0, yaw: 0 },
    broadcastType = "static"
  } = frameData;

  const targetFrameId = childFrameId || frameId;
  if (!targetFrameId) return "";

  const { x, y, z } = position;
  const { roll, pitch, yaw } = rotation;

  const nodeName = `${targetFrameId}_broadcaster`;
  const className = targetFrameId
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join('') + "Broadcaster";

  // Generate code based on broadcast type
  if (broadcastType === "static") {
    // Static TF broadcaster
    const code = `#!/usr/bin/env python3
# =============================================================================
# 🧩 This file was generated from visual blocks!
# Static TF broadcaster for ${targetFrameId} frame
# =============================================================================

import rclpy
from rclpy.node import Node
from geometry_msgs.msg import TransformStamped
import tf2_ros
from tf_transformations import quaternion_from_euler


class ${className}(Node):
    def __init__(self):
        super().__init__('${nodeName}')

        # Create static transform broadcaster
        self.tf_static_broadcaster = tf2_ros.StaticTransformBroadcaster(self)

        # Publish static transform
        self.publish_static_transform()

        self.get_logger().info(f'Static TF broadcaster initialized for ${targetFrameId}')

    def publish_static_transform(self):
        static_transform = TransformStamped()

        static_transform.header.stamp = self.get_clock().now().to_msg()
        static_transform.header.frame_id = '${parentFrameId}'
        static_transform.child_frame_id = '${targetFrameId}'

        # Set translation
        static_transform.transform.translation.x = ${x}
        static_transform.transform.translation.y = ${y}
        static_transform.transform.translation.z = ${z}

        # Convert RPY to quaternion
        quat = quaternion_from_euler(${roll}, ${pitch}, ${yaw})
        static_transform.transform.rotation.x = quat[0]
        static_transform.transform.rotation.y = quat[1]
        static_transform.transform.rotation.z = quat[2]
        static_transform.transform.rotation.w = quat[3]

        self.tf_static_broadcaster.sendTransform(static_transform)


def main(args=None):
    rclpy.init(args=args)
    node = ${className}()

    try:
        rclpy.spin(node)
    except KeyboardInterrupt:
        pass
    finally:
        node.destroy_node()
        rclpy.shutdown()


if __name__ == '__main__':
    main()`;

    return code;
  } else {
    // Dynamic TF broadcaster
    const code = `#!/usr/bin/env python3
# =============================================================================
# 🧩 This file was generated from visual blocks!
# Dynamic TF broadcaster for ${targetFrameId} frame
# =============================================================================

import rclpy
from rclpy.node import Node
from geometry_msgs.msg import TransformStamped
import tf2_ros
from tf_transformations import quaternion_from_euler


class ${className}(Node):
    def __init__(self):
        super().__init__('${nodeName}')

        # Create dynamic transform broadcaster
        self.tf_broadcaster = tf2_ros.TransformBroadcaster(self)

        # Publish transform at 10 Hz
        self.timer = self.create_timer(0.1, self.publish_transform)

        self.get_logger().info(f'Dynamic TF broadcaster initialized for ${targetFrameId}')

    def publish_transform(self):
        transform = TransformStamped()

        transform.header.stamp = self.get_clock().now().to_msg()
        transform.header.frame_id = '${parentFrameId}'
        transform.child_frame_id = '${targetFrameId}'

        # Set translation
        transform.transform.translation.x = ${x}
        transform.transform.translation.y = ${y}
        transform.transform.translation.z = ${z}

        # Convert RPY to quaternion
        quat = quaternion_from_euler(${roll}, ${pitch}, ${yaw})
        transform.transform.rotation.x = quat[0]
        transform.transform.rotation.y = quat[1]
        transform.transform.rotation.z = quat[2]
        transform.transform.rotation.w = quat[3]

        self.tf_broadcaster.sendTransform(transform)


def main(args=None):
    rclpy.init(args=args)
    node = ${className}()

    try:
        rclpy.spin(node)
    except KeyboardInterrupt:
        pass
    finally:
        node.destroy_node()
        rclpy.shutdown()


if __name__ == '__main__':
    main()`;

    return code;
  }
}

/**
 * Calculate center of mass from geometry data
 */
export function calculateCenterOfMass(geometryData) {
  if (!geometryData || !geometryData.geometry) {
    return { x: 0, y: 0, z: 0 };
  }

  const { geometry } = geometryData;
  const { type, size = [1, 1, 1], radius = 0.5, length = 1.0 } = geometry;

  // For most primitives, center is at origin
  // This is simplified - real center of mass would consider material density
  switch (type) {
    case "box":
      return { x: 0, y: 0, z: 0 };

    case "sphere":
      return { x: 0, y: 0, z: 0 };

    case "cylinder":
      // Cylinder is centered on Z-axis by default in URDF
      return { x: 0, y: 0, z: 0 };

    case "mesh":
      // Would need to parse mesh file for actual center
      return { x: 0, y: 0, z: 0 };

    default:
      return { x: 0, y: 0, z: 0 };
  }
}

/**
 * Sync TF data throughout the node graph
 * Updates center of mass calculations and parent frame references
 */
export function syncTfData(nodes, edges, setNodes) {
  let changed = false;
  const updates = [];

  // Process CenterMass nodes
  const centerMassNodes = nodes.filter((n) => n.type === "centerMass");

  for (const cmNode of centerMassNodes) {
    // Find connected geometry node
    const incomingEdges = edges.filter((e) => e.target === cmNode.id && e.targetHandle === "geometry");

    if (incomingEdges.length > 0) {
      const geomNode = nodes.find((n) => n.id === incomingEdges[0].source);

      if (geomNode && geomNode.data) {
        // Calculate center from geometry
        const center = calculateCenterOfMass(geomNode.data);

        // Apply offset if enabled
        let finalCenter = { ...center };
        if (cmNode.data?.useOffset && cmNode.data?.offset) {
          finalCenter.x += cmNode.data.offset.x || 0;
          finalCenter.y += cmNode.data.offset.y || 0;
          finalCenter.z += cmNode.data.offset.z || 0;
        }

        const currentCenter = cmNode.data?.center || { x: 0, y: 0, z: 0 };
        const geometryName = geomNode.data?.name || geomNode.type;

        // Check if update needed
        if (
          currentCenter.x !== finalCenter.x ||
          currentCenter.y !== finalCenter.y ||
          currentCenter.z !== finalCenter.z ||
          cmNode.data?.geometryName !== geometryName
        ) {
          changed = true;
          updates.push({
            id: cmNode.id,
            data: {
              ...cmNode.data,
              center: finalCenter,
              geometryName,
              geometry: geomNode.data?.geometry,
            },
          });
        }
      }
    }
  }

  // Process TF Frame nodes - update position from connected center mass
  const tfFrameNodes = nodes.filter((n) => n.type === "tfFrame" || n.type === "tfChild");

  for (const tfNode of tfFrameNodes) {
    const incomingEdges = edges.filter((e) => e.target === tfNode.id && e.targetHandle === "center_mass");

    if (incomingEdges.length > 0) {
      const cmNode = nodes.find((n) => n.id === incomingEdges[0].source);

      if (cmNode && cmNode.type === "centerMass" && cmNode.data?.center) {
        const currentPosition = tfNode.data?.position || { x: 0, y: 0, z: 0 };
        const newPosition = cmNode.data.center;

        if (
          currentPosition.x !== newPosition.x ||
          currentPosition.y !== newPosition.y ||
          currentPosition.z !== newPosition.z
        ) {
          changed = true;
          updates.push({
            id: tfNode.id,
            data: {
              ...tfNode.data,
              position: { ...newPosition },
            },
          });
        }
      }
    }
  }

  // Apply updates
  if (changed && updates.length > 0) {
    setNodes((nds) =>
      nds.map((n) => {
        const update = updates.find((u) => u.id === n.id);
        if (!update) return n;

        return {
          ...n,
          data: update.data,
        };
      })
    );
  }
}

/**
 * Generate launch file for all TF broadcasters in the graph
 */
export function generateTfLaunchFile(nodes, edges) {
  const tfFrameNodes = nodes.filter((n) =>
    n.type === "tfFrame" || n.type === "tfChild"
  );

  if (tfFrameNodes.length === 0) {
    return "# No TF frames to broadcast";
  }

  // Build list of static transform publishers
  const transforms = [];

  for (const tfNode of tfFrameNodes) {
    // Find parent frame
    let parentFrameId = "world";
    const parentEdges = edges.filter((e) =>
      e.target === tfNode.id && e.targetHandle === "parent_frame"
    );

    if (parentEdges.length > 0) {
      const parentNode = nodes.find((n) => n.id === parentEdges[0].source);
      if (parentNode) {
        if (parentNode.type === "tfWorld") {
          parentFrameId = parentNode.data?.frameId || "world";
        } else if (parentNode.type === "tfFrame") {
          parentFrameId = parentNode.data?.frameId || "world";
        }
      }
    }

    const cmd = generateTfStaticCommand(tfNode.data, parentFrameId);
    if (cmd && !cmd.startsWith("#")) {
      transforms.push(cmd);
    }
  }

  if (transforms.length === 0) {
    return "# No valid TF frames configured";
  }

  // Create bash script to launch all transforms
  const script = `#!/bin/bash
# =============================================================================
# 🧩 TF Launch Script - Generated from visual blocks!
# Starts all static transform broadcasters
# =============================================================================

# Launch all static transforms in background
${transforms.map((cmd, i) => `${cmd} &`).join('\n')}

# Wait for all background processes
wait
`;

  return script;
}
