// src/levels/slidesROS2Advanced/09-HeartbeatPattern.jsx
import React from "react";

export const meta = {
  id: "heartbeat-pattern",
  title: "Heartbeat and Watchdog Patterns",
  order: 9,
  objectiveCode: "ros2-algorithms-1",
};

export default function HeartbeatPattern() {
  return (
    <div className="slide">
      <h2>Heartbeat and Watchdog Patterns</h2>

      <div className="slide-card">
        <div className="slide-card__title">The Heartbeat Pattern</div>
        <p>
          A <b>heartbeat</b> is a periodic "I'm alive" message that nodes send to prove they're still running.
          This is essential for detecting crashes or network disconnections.
        </p>
      </div>

      <div className="slide-card">
        <div className="slide-card__title">Implementing a Heartbeat Publisher</div>
        <pre className="slide-code" style={{ fontSize: "0.8em" }}>{`import rclpy
from rclpy.node import Node
from std_msgs.msg import Header
from rclpy.qos import QoSProfile, ReliabilityPolicy

class HeartbeatNode(Node):
    def __init__(self):
        super().__init__('heartbeat_node')

        qos = QoSProfile(
            reliability=ReliabilityPolicy.BEST_EFFORT,
            depth=1
        )

        self.pub = self.create_publisher(Header, '/heartbeat', qos)
        self.timer = self.create_timer(1.0, self.publish_heartbeat)
        self.seq = 0

    def publish_heartbeat(self):
        msg = Header()
        msg.stamp = self.get_clock().now().to_msg()
        msg.frame_id = self.get_name()
        self.pub.publish(msg)
        self.seq += 1
        self.get_logger().debug(f'Heartbeat {self.seq}')`}</pre>
      </div>

      <div className="slide-card">
        <div className="slide-card__title">Implementing a Watchdog Subscriber</div>
        <pre className="slide-code" style={{ fontSize: "0.8em" }}>{`class WatchdogNode(Node):
    def __init__(self):
        super().__init__('watchdog_node')

        qos = QoSProfile(
            reliability=ReliabilityPolicy.BEST_EFFORT,
            depth=1
        )

        self.sub = self.create_subscription(
            Header, '/heartbeat', self.heartbeat_cb, qos
        )

        self.timeout = 3.0  # seconds
        self.last_heartbeat = self.get_clock().now()
        self.watchdog_timer = self.create_timer(0.5, self.check_heartbeat)

    def heartbeat_cb(self, msg):
        self.last_heartbeat = self.get_clock().now()
        self.get_logger().debug(f'Received heartbeat from {msg.frame_id}')

    def check_heartbeat(self):
        elapsed = (self.get_clock().now() - self.last_heartbeat).nanoseconds / 1e9
        if elapsed > self.timeout:
            self.get_logger().error(
                f'Heartbeat timeout! Last seen {elapsed:.1f}s ago'
            )
            # Trigger safety response: stop motors, alert operator, etc.
            self.trigger_safe_stop()`}</pre>
      </div>

      <div className="slide-callout slide-callout--info">
        <b>Design Choice:</b> We use BEST_EFFORT for heartbeats because we only care about recent messages.
        If a heartbeat is lost, the next one will arrive soon anyway.
      </div>
    </div>
  );
}
