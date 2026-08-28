// src/levels/slidesTransformations/07-NavigationGoals.jsx
import React from "react";

export const meta = {
  id: "navigation-goals",
  title: "Setting Navigation Goals with TF",
  order: 7,
  objectiveCode: "tf-robot-navigation-2",
};

export default function NavigationGoals() {
  return (
    <div className="slide">
      <h2>Setting Navigation Goals with TF</h2>

      <div className="slide-card">
        <div className="slide-card__title">Goal Frames for Navigation</div>
        <p>
          Navigation goals can be expressed in different frames depending on the task:
        </p>
        <ul style={{ fontSize: "0.9em", marginTop: "0.5rem" }}>
          <li><b>map frame:</b> "Drive to (10, 5) in the warehouse"</li>
          <li><b>base_link frame:</b> "Move forward 2 meters"</li>
          <li><b>marker frame:</b> "Dock at this charging station"</li>
        </ul>
        <p style={{ marginTop: "0.75rem", fontSize: "0.9em" }}>
          TF allows you to convert between these representations seamlessly.
        </p>
      </div>

      <div className="slide-card">
        <div className="slide-card__title">Example: Relative Navigation</div>
        <p style={{ fontSize: "0.9em", marginBottom: "0.75rem" }}>
          "Move to a point 3 meters forward and 1 meter left of current position"
        </p>

        <pre className="slide-code" style={{ fontSize: "0.8em" }}>{`from geometry_msgs.msg import PoseStamped
import tf2_geometry_msgs

class RelativeNavigator(Node):
    def __init__(self):
        super().__init__('relative_navigator')

        self.tf_buffer = Buffer()
        self.tf_listener = TransformListener(self.tf_buffer, self)

        self.goal_pub = self.create_publisher(PoseStamped, '/goal_pose', 10)

    def send_relative_goal(self, forward, left):
        """Send goal relative to current robot pose"""

        # Create goal in base_link frame (relative to robot)
        goal_in_base = PoseStamped()
        goal_in_base.header.stamp = self.get_clock().now().to_msg()
        goal_in_base.header.frame_id = 'base_link'
        goal_in_base.pose.position.x = forward  # 3.0 meters forward
        goal_in_base.pose.position.y = left     # 1.0 meters left
        goal_in_base.pose.orientation.w = 1.0   # facing forward

        try:
            # Transform to map frame for global planning
            goal_in_map = self.tf_buffer.transform(
                goal_in_base,
                'map',
                timeout=rclpy.duration.Duration(seconds=1.0)
            )

            self.get_logger().info(
                f'Sending goal: ({goal_in_map.pose.position.x:.2f}, '
                f'{goal_in_map.pose.position.y:.2f}) in map frame'
            )

            self.goal_pub.publish(goal_in_map)

        except Exception as e:
            self.get_logger().error(f'Failed to transform goal: {e}')

# Usage
navigator = RelativeNavigator()
navigator.send_relative_goal(forward=3.0, left=1.0)`}</pre>
      </div>

      <div className="slide-card">
        <div className="slide-card__title">Dynamic Goal Tracking</div>
        <p style={{ fontSize: "0.9em" }}>
          For following moving targets (e.g., "follow this person"), continuously transform
          the target's position to the map frame:
        </p>
        <pre className="slide-code" style={{ fontSize: "0.75em", marginTop: "0.5rem" }}>{`def follow_person(self, person_frame='person_0'):
    """Continuously navigate toward a moving person"""

    # Create a goal at the person's location
    goal = PoseStamped()
    goal.header.frame_id = person_frame
    goal.pose.orientation.w = 1.0  # at person's position

    # Transform to map frame
    goal_in_map = self.tf_buffer.transform(goal, 'map')

    # Send to navigation stack
    self.goal_pub.publish(goal_in_map)`}</pre>
      </div>
    </div>
  );
}
