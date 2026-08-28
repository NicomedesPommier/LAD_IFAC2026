// src/levels/slidesROS2Advanced/10-RetryStrategies.jsx
import React from "react";

export const meta = {
  id: "retry-strategies",
  title: "Retry and Backoff Strategies",
  order: 10,
  objectiveCode: "ros2-algorithms-2",
};

export default function RetryStrategies() {
  return (
    <div className="slide">
      <h2>Retry and Backoff Strategies</h2>

      <div className="slide-card">
        <div className="slide-card__title">Handling Service Call Failures</div>
        <p>
          Service calls (request/response) can fail due to network issues or unavailable servers.
          Implementing smart retry logic makes your system more robust.
        </p>
      </div>

      <div className="slide-card">
        <div className="slide-card__title">Exponential Backoff Pattern</div>
        <p>
          Instead of retrying immediately (which can overwhelm a struggling server),
          wait progressively longer between retries.
        </p>

        <pre className="slide-code" style={{ fontSize: "0.8em" }}>{`import rclpy
from rclpy.node import Node
import time

class RetryClient(Node):
    def __init__(self):
        super().__init__('retry_client')
        self.cli = self.create_client(MyService, '/my_service')

    def call_with_retry(self, request, max_retries=5):
        """Call service with exponential backoff."""
        retry_delay = 0.1  # Start with 100ms

        for attempt in range(max_retries):
            if not self.cli.wait_for_service(timeout_sec=1.0):
                self.get_logger().warn(
                    f'Service not available (attempt {attempt + 1}/{max_retries})'
                )
                time.sleep(retry_delay)
                retry_delay *= 2  # Exponential backoff: 0.1s, 0.2s, 0.4s, 0.8s, 1.6s
                continue

            try:
                future = self.cli.call_async(request)
                rclpy.spin_until_future_complete(self, future, timeout_sec=2.0)

                if future.done():
                    return future.result()
                else:
                    self.get_logger().warn(f'Timeout on attempt {attempt + 1}')

            except Exception as e:
                self.get_logger().error(f'Error on attempt {attempt + 1}: {e}')

            time.sleep(retry_delay)
            retry_delay *= 2

        raise RuntimeError(f'Service call failed after {max_retries} retries')
`}</pre>
      </div>

      <div className="slide-card">
        <div className="slide-card__title">Best Practices</div>
        <ul style={{ fontSize: "0.9em" }}>
          <li><b>Set Maximum Retries:</b> Prevent infinite retry loops</li>
          <li><b>Use Exponential Backoff:</b> Avoid overwhelming the network/server</li>
          <li><b>Add Jitter:</b> Randomize delays slightly to prevent synchronized retries from multiple clients</li>
          <li><b>Log Failures:</b> Track retry patterns to identify systemic issues</li>
          <li><b>Circuit Breaker:</b> After many failures, stop trying for a while to let the system recover</li>
        </ul>
      </div>

      <div className="slide-callout slide-callout--warn">
        <b>Warning:</b> Don't retry operations that aren't idempotent (e.g., "increment counter")
        unless you can guarantee exactly-once semantics!
      </div>
    </div>
  );
}
