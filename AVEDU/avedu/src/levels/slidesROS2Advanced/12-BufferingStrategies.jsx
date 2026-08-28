// src/levels/slidesROS2Advanced/12-BufferingStrategies.jsx
import React from "react";

export const meta = {
  id: "buffering-strategies",
  title: "Buffering and Smoothing Strategies",
  order: 12,
  objectiveCode: "ros2-algorithms-4",
};

export default function BufferingStrategies() {
  return (
    <div className="slide">
      <h2>Buffering and Smoothing Strategies</h2>

      <div className="slide-card">
        <div className="slide-card__title">Dealing with Jittery Data</div>
        <p>
          Network delays and packet loss cause irregular message arrival.
          Buffering strategies help smooth out irregularities and maintain consistent processing rates.
        </p>
      </div>

      <div className="slide-card">
        <div className="slide-card__title">Time-Based Buffering</div>
        <p style={{ fontSize: "0.9em", marginBottom: "0.75rem" }}>
          Collect messages over a time window before processing:
        </p>

        <pre className="slide-code" style={{ fontSize: "0.8em" }}>{`from collections import deque
from rclpy.time import Time

class TimeBasedBuffer:
    def __init__(self, window_duration_sec=1.0):
        self.buffer = deque()
        self.window_duration = window_duration_sec

    def add(self, msg, stamp):
        """Add message with its timestamp."""
        self.buffer.append((stamp, msg))
        self._cleanup_old()

    def _cleanup_old(self):
        """Remove messages older than window."""
        if not self.buffer:
            return

        latest_time = self.buffer[-1][0]
        cutoff_time = latest_time - self.window_duration * 1e9  # nanoseconds

        while self.buffer and self.buffer[0][0] < cutoff_time:
            self.buffer.popleft()

    def get_all(self):
        """Get all messages in current window."""
        return [msg for _, msg in self.buffer]

    def get_average_rate(self):
        """Calculate average message rate in window."""
        if len(self.buffer) < 2:
            return 0.0
        time_span = (self.buffer[-1][0] - self.buffer[0][0]) / 1e9
        return len(self.buffer) / time_span if time_span > 0 else 0.0
`}</pre>
      </div>

      <div className="slide-card">
        <div className="slide-card__title">Interpolation for Missing Data</div>
        <p style={{ fontSize: "0.9em", marginBottom: "0.75rem" }}>
          When messages are lost, interpolate between available data points:
        </p>

        <pre className="slide-code" style={{ fontSize: "0.8em" }}>{`class Interpolator:
    def __init__(self):
        self.last_msg = None
        self.last_time = None

    def interpolate(self, target_time):
        """Get interpolated value at target_time."""
        if self.last_msg is None:
            return None

        # If we have current message, interpolate
        if hasattr(self, 'current_msg'):
            dt_total = (self.current_time - self.last_time).nanoseconds / 1e9
            dt_target = (target_time - self.last_time).nanoseconds / 1e9

            if dt_total > 0:
                alpha = dt_target / dt_total  # interpolation factor [0, 1]

                # Linear interpolation
                interpolated_value = (
                    self.last_msg.data * (1 - alpha) +
                    self.current_msg.data * alpha
                )
                return interpolated_value

        # Otherwise return last known value
        return self.last_msg.data

    def update(self, msg, stamp):
        self.last_msg = self.current_msg if hasattr(self, 'current_msg') else msg
        self.last_time = self.current_time if hasattr(self, 'current_time') else stamp
        self.current_msg = msg
        self.current_time = stamp
`}</pre>
      </div>

      <div className="slide-card">
        <div className="slide-card__title">Exponential Moving Average (EMA)</div>
        <p style={{ fontSize: "0.9em", marginBottom: "0.75rem" }}>
          Smooth noisy sensor data with a simple exponential filter:
        </p>

        <pre className="slide-code" style={{ fontSize: "0.8em" }}>{`class ExponentialMovingAverage:
    def __init__(self, alpha=0.3):
        """
        alpha: Smoothing factor [0, 1]
               0 = very smooth (slow to respond)
               1 = no smoothing (raw data)
        """
        self.alpha = alpha
        self.value = None

    def update(self, new_value):
        if self.value is None:
            self.value = new_value
        else:
            self.value = self.alpha * new_value + (1 - self.alpha) * self.value
        return self.value

# Usage
ema = ExponentialMovingAverage(alpha=0.2)

def sensor_callback(msg):
    smoothed = ema.update(msg.data)
    # Use smoothed value for control...
`}</pre>
      </div>

      <div className="slide-callout slide-callout--warn">
        <b>Trade-off:</b> Buffering and smoothing add latency. Choose your window size and
        smoothing factor based on your real-time requirements!
      </div>
    </div>
  );
}
