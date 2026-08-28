// src/levels/slidesROS2Concepts/06-CreatingSubscribers.jsx
import React from "react";
import { SlideCodeSnippet } from "../../components/slides/SlideLayout";

export const meta = {
  id: "creating-subscribers",
  title: "Creating Subscribers",
  order: 6,
  objectiveCode: "ros2-subs-creating",
};

export default function CreatingSubscribers({ onObjectiveHit }) {
  const pythonCode = `import rclpy
from rclpy.node import Node
from std_msgs.msg import String

class SubscriberNode(Node):
    def __init__(self):
        super().__init__('subscriber_node')
        # Create subscriber: topic name, message type, callback
        self.subscription = self.create_subscription(
            String,
            'chatter',
            self.listener_callback,
            10)

    def listener_callback(self, msg):
        # This function is called every time a message arrives
        self.get_logger().info(f'I heard: "{msg.data}"')

def main():
    rclpy.init()
    node = SubscriberNode()
    rclpy.spin(node)  # Keep node alive to receive messages
    rclpy.shutdown()`;

  const cppCode = `#include "rclcpp/rclcpp.hpp"
#include "std_msgs/msg/string.hpp"

class SubscriberNode : public rclcpp::Node {
public:
  SubscriberNode() : Node("subscriber_node") {
    // Create subscriber
    subscription_ = this->create_subscription<std_msgs::msg::String>(
      "chatter", 10,
      std::bind(&SubscriberNode::listener_callback, this,
                std::placeholders::_1));
  }

private:
  void listener_callback(const std_msgs::msg::String::SharedPtr msg) {
    RCLCPP_INFO(this->get_logger(), "I heard: '%s'", msg->data.c_str());
  }

  rclcpp::Subscription<std_msgs::msg::String>::SharedPtr subscription_;
};

int main(int argc, char **argv) {
  rclcpp::init(argc, argv);
  rclcpp::spin(std::make_shared<SubscriberNode>());
  rclcpp::shutdown();
  return 0;
}`;

  const [language, setLanguage] = React.useState("python");

  return (
    <div className="slide">
      <h2>Creating Subscribers</h2>

      <div className="slide-card">
        <div className="slide-card__title">Subscriber Basics</div>
        <p>
          Subscribers receive messages published on topics. The key concept is the <b>callback function</b>:
          a function that automatically executes whenever a new message arrives.
        </p>
        <ol className="slide-list-ordered">
          <li><b>Create a subscriber</b> with topic name and message type</li>
          <li><b>Define a callback function</b> to process incoming messages</li>
          <li><b>Spin the node</b> to keep it listening for messages</li>
        </ol>
      </div>

      <div className="slide-card">
        <div className="slide-flex slide-flex--between slide-flex--center slide-mb-md">
          <div className="slide-card__title">Example: Simple Subscriber</div>
          <div className="slide-actions">
            <button
              className={language === "python" ? "btn btn--sm btn--primary" : "btn btn--sm"}
              onClick={() => setLanguage("python")}
            >
              Python
            </button>
            <button
              className={language === "cpp" ? "btn btn--sm btn--primary" : "btn btn--sm"}
              onClick={() => setLanguage("cpp")}
            >
              C++
            </button>
          </div>
        </div>

        <SlideCodeSnippet
          language={language}
          code={language === "python" ? pythonCode : cppCode}
          copyable={true}
        />

        <div className="slide-actions slide-mt-md">
          <button
            className="btn btn--primary"
            onClick={() => onObjectiveHit?.(meta.objectiveCode)}
          >
            Mark as Understood
          </button>
        </div>
      </div>

      <div className="slide-card slide-card--aside">
        <div className="slide-card__title">How It Works</div>
        <div className="slide-grid slide-grid--2">
          <ul>
            <li><b>Topic Name:</b> "chatter" - must match the publisher's topic</li>
            <li><b>Message Type:</b> String - must match the publisher's type</li>
          </ul>
          <ul>
            <li><b>Callback:</b> listener_callback() - runs for each message</li>
            <li><b>Queue Size:</b> 10 - buffers messages during processing</li>
          </ul>
        </div>
        <div className="slide-callout slide-callout--info slide-mt-md">
          <b>Try it together:</b> Run the publisher from the previous slide in one terminal,
          then run this subscriber in another. Watch them communicate!
        </div>
      </div>
    </div>
  );
}

