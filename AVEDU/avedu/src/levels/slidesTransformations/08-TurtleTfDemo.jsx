// src/levels/slidesTransformations/08-TurtleTfDemo.jsx
import React, { useCallback, useEffect, useRef, useState } from "react";
import { useRoslib } from "../../hooks/useRoslib";
import RVizTFViewer from "../../components/visualization/RVizTFViewer";

export const meta = {
  id: "turtle-tf-demo",
  title: "TF2 Turtle Demo - Interactive",
  order: 8,
  objectiveCode: "tf-turtle-demo",
};

const WORLD_SIZE = 11.0889;
const CANVAS_SIZE = 600;
const SCALE = CANVAS_SIZE / WORLD_SIZE;

/**
 * TF2 Turtle Demo - Interactive demonstration of TF2 concepts
 *
 * This slide demonstrates the ROS2 TF2 turtle tutorial with:
 * - Custom Canvas visualization of two turtles
 * - RVizTFViewer showing the TF tree (world → turtle1, world → turtle2)
 * - Interactive controls to move turtle1
 * - Automatic following behavior for turtle2
 */
export default function TurtleTfDemo({ meta: propsMeta, onObjectiveHit }) {
  const { ros, connected, advertise } = useRoslib();
  const canvasRef = useRef(null);
  const cmdVelRef = useRef(null);
  const holdTimerRef = useRef(null);

  // Turtle states
  const [turtle1, setTurtle1] = useState({
    x: WORLD_SIZE / 2,
    y: WORLD_SIZE / 2,
    theta: 0,
  });

  const [turtle2, setTurtle2] = useState({
    x: WORLD_SIZE / 3,
    y: WORLD_SIZE / 3,
    theta: 0,
  });

  // Current velocity for turtle1 (for simulation)
  const [velocity, setVelocity] = useState({ linear: 0, angular: 0 });

  const [objectiveHit, setObjectiveHit] = useState(false);

  // Initialize ROS publishers
  useEffect(() => {
    if (!connected) return;

    try {
      cmdVelRef.current = advertise("/turtle1/cmd_vel", "geometry_msgs/msg/Twist");
      console.log("[TF Demo] Advertised /turtle1/cmd_vel");
    } catch (err) {
      console.error("[TF Demo] Error advertising cmd_vel:", err);
    }

    return () => {
      try {
        cmdVelRef.current?.unadvertise?.();
      } catch (err) {
        console.error("[TF Demo] Error unadvertising:", err);
      }
    };
  }, [connected, advertise]);

  // Publish velocity command
  const publishVelocity = useCallback((linear, angular) => {
    // Update local velocity state for simulation
    setVelocity({ linear, angular });

    // Publish to ROS if connected
    if (cmdVelRef.current) {
      const twist = {
        linear: { x: linear, y: 0, z: 0 },
        angular: { x: 0, y: 0, z: angular },
      };
      cmdVelRef.current.publish(twist);
    }
  }, []);

  // Start holding a movement command
  const startHold = useCallback((linear, angular) => {
    publishVelocity(linear, angular);
    clearInterval(holdTimerRef.current);
    holdTimerRef.current = setInterval(() => {
      publishVelocity(linear, angular);
    }, 100);
  }, [publishVelocity]);

  // Stop movement
  const stopHold = useCallback(() => {
    clearInterval(holdTimerRef.current);
    publishVelocity(0, 0);
  }, [publishVelocity]);

  // Update turtle1 position (simulate movement)
  useEffect(() => {
    const dt = 0.05; // 50ms timestep
    const interval = setInterval(() => {
      setTurtle1((prev) => {
        // Integrate velocity into position
        const newTheta = prev.theta + velocity.angular * dt;
        const newX = prev.x + velocity.linear * Math.cos(prev.theta) * dt;
        const newY = prev.y + velocity.linear * Math.sin(prev.theta) * dt;

        // Clamp to world bounds
        const clampedX = Math.max(0, Math.min(WORLD_SIZE, newX));
        const clampedY = Math.max(0, Math.min(WORLD_SIZE, newY));

        return {
          x: clampedX,
          y: clampedY,
          theta: newTheta,
        };
      });
    }, 50);

    return () => clearInterval(interval);
  }, [velocity]);

  // Update turtle2 to follow turtle1
  useEffect(() => {
    const interval = setInterval(() => {
      setTurtle2((prev) => {
        // Calculate direction to turtle1
        const dx = turtle1.x - prev.x;
        const dy = turtle1.y - prev.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        // If close enough, don't move
        if (distance < 0.5) return prev;

        // Calculate angle to turtle1
        const targetTheta = Math.atan2(dy, dx);

        // Move towards turtle1
        const speed = Math.min(0.1, distance * 0.1);
        const newX = prev.x + Math.cos(targetTheta) * speed;
        const newY = prev.y + Math.sin(targetTheta) * speed;

        return {
          x: newX,
          y: newY,
          theta: targetTheta,
        };
      });
    }, 100);

    return () => clearInterval(interval);
  }, [turtle1]);

  // Check if turtle2 reached turtle1 (objective)
  useEffect(() => {
    const dx = turtle1.x - turtle2.x;
    const dy = turtle1.y - turtle2.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    if (distance < 1.0 && !objectiveHit) {
      setObjectiveHit(true);
      onObjectiveHit?.(propsMeta?.objectiveCode || meta.objectiveCode);
    }
  }, [turtle1, turtle2, objectiveHit, onObjectiveHit, propsMeta]);

  // Draw turtles on canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);

    // Background
    ctx.fillStyle = "#1a1a2e";
    ctx.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);

    // Grid
    ctx.strokeStyle = "rgba(125, 249, 255, 0.1)";
    ctx.lineWidth = 1;
    for (let i = 0; i <= WORLD_SIZE; i++) {
      const pos = i * SCALE;
      // Vertical lines
      ctx.beginPath();
      ctx.moveTo(pos, 0);
      ctx.lineTo(pos, CANVAS_SIZE);
      ctx.stroke();
      // Horizontal lines
      ctx.beginPath();
      ctx.moveTo(0, CANVAS_SIZE - pos);
      ctx.lineTo(CANVAS_SIZE, CANVAS_SIZE - pos);
      ctx.stroke();
    }

    // Draw turtle1
    const drawTurtle = (turtle, color, label) => {
      const x = turtle.x * SCALE;
      const y = CANVAS_SIZE - (turtle.y * SCALE);

      // Body
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(x, y, 15, 0, Math.PI * 2);
      ctx.fill();

      // Direction indicator
      ctx.strokeStyle = color;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(
        x + Math.cos(turtle.theta) * 25,
        y - Math.sin(turtle.theta) * 25
      );
      ctx.stroke();

      // Label
      ctx.fillStyle = "#ffffff";
      ctx.font = "12px monospace";
      ctx.textAlign = "center";
      ctx.fillText(label, x, y - 25);
    };

    drawTurtle(turtle1, "#ff6b6b", "turtle1");
    drawTurtle(turtle2, "#4ecdc4", "turtle2");

    // Connection line
    ctx.strokeStyle = "rgba(255, 255, 255, 0.2)";
    ctx.lineWidth = 1;
    ctx.setLineDash([5, 5]);
    ctx.beginPath();
    ctx.moveTo(turtle1.x * SCALE, CANVAS_SIZE - (turtle1.y * SCALE));
    ctx.lineTo(turtle2.x * SCALE, CANVAS_SIZE - (turtle2.y * SCALE));
    ctx.stroke();
    ctx.setLineDash([]);

  }, [turtle1, turtle2]);

  // Keyboard controls
  useEffect(() => {
    const handleKeyDown = (e) => {
      switch (e.key) {
        case "ArrowUp":
        case "w":
          startHold(2.0, 0);
          break;
        case "ArrowDown":
        case "s":
          startHold(-2.0, 0);
          break;
        case "ArrowLeft":
        case "a":
          startHold(0, 2.0);
          break;
        case "ArrowRight":
        case "d":
          startHold(0, -2.0);
          break;
        default:
          break;
      }
    };

    const handleKeyUp = (e) => {
      if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", "w", "a", "s", "d"].includes(e.key)) {
        stopHold();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
      stopHold();
    };
  }, [startHold, stopHold]);

  return (
    <div className="slide">
      <h2>TF2 Turtle Demo - Interactive</h2>

      <div className="slide-card">
        <div className="slide-card__title">Understanding TF2 with Turtles</div>
        <p>
          This interactive demo showcases the classic ROS2 TF2 tutorial where <b>turtle2</b> follows <b>turtle1</b>.
          Use the controls below to move turtle1 and watch how turtle2 uses TF transforms to track it!
        </p>
        <div className="slide-callout slide-callout--info" style={{ marginTop: "0.75rem", fontSize: "0.85em" }}>
          <b>RViz TF Visualization:</b> To see TF frames in RViz (right panel), you need to run the actual ROS2 turtlesim demo:
          <br/>
          <code style={{ display: "block", marginTop: "0.5rem", padding: "0.5rem", background: "rgba(0,0,0,0.3)", borderRadius: "4px" }}>
            ros2 launch turtle_tf2_py turtle_tf2_demo.launch.py
          </code>
          <br/>
          The canvas visualization (left) works standalone without ROS!
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginTop: "1rem" }}>
        {/* Left side: Canvas visualization */}
        <div className="slide-card">
          <div className="slide-card__title">Turtle Visualization</div>
          <div style={{
            display: "flex",
            flexDirection: "column",
            gap: "0.5rem",
            alignItems: "center"
          }}>
            <canvas
              ref={canvasRef}
              width={CANVAS_SIZE}
              height={CANVAS_SIZE}
              style={{
                border: "2px solid rgba(125, 249, 255, 0.3)",
                borderRadius: "8px",
                maxWidth: "100%",
                height: "auto",
              }}
            />

            {/* Controls */}
            <div style={{
              display: "grid",
              gridTemplateColumns: "repeat(3, 1fr)",
              gap: "0.5rem",
              width: "200px",
              marginTop: "0.5rem"
            }}>
              <div></div>
              <button
                className="btn"
                onMouseDown={() => startHold(2.0, 0)}
                onMouseUp={stopHold}
                onMouseLeave={stopHold}
                style={{ padding: "0.5rem" }}
              >
                ↑
              </button>
              <div></div>

              <button
                className="btn"
                onMouseDown={() => startHold(0, 2.0)}
                onMouseUp={stopHold}
                onMouseLeave={stopHold}
                style={{ padding: "0.5rem" }}
              >
                ←
              </button>
              <button
                className="btn"
                onMouseDown={() => startHold(-2.0, 0)}
                onMouseUp={stopHold}
                onMouseLeave={stopHold}
                style={{ padding: "0.5rem" }}
              >
                ↓
              </button>
              <button
                className="btn"
                onMouseDown={() => startHold(0, -2.0)}
                onMouseUp={stopHold}
                onMouseLeave={stopHold}
                style={{ padding: "0.5rem" }}
              >
                →
              </button>
            </div>

            <div style={{ fontSize: "0.8em", opacity: 0.7, textAlign: "center" }}>
              Use arrow keys or buttons to control turtle1
            </div>

            {/* Turtle positions (for debugging) */}
            <div style={{ fontSize: "0.75em", opacity: 0.6, marginTop: "0.5rem", fontFamily: "monospace" }}>
              <div>Turtle1: ({turtle1.x.toFixed(2)}, {turtle1.y.toFixed(2)}, θ={turtle1.theta.toFixed(2)})</div>
              <div>Turtle2: ({turtle2.x.toFixed(2)}, {turtle2.y.toFixed(2)}, θ={turtle2.theta.toFixed(2)})</div>
              <div>Velocity: linear={velocity.linear.toFixed(1)}, angular={velocity.angular.toFixed(1)}</div>
            </div>
          </div>
        </div>

        {/* Right side: TF Visualization */}
        <div style={{ minHeight: "400px" }}>
          <RVizTFViewer
            ros={ros.current}
            connected={connected}
            fixedFrame="world"
            showGrid={true}
            showAxes={true}
            axisLength={0.5}
            title="TF Tree Visualization"
            showFrameControls={true}
          />
          {!connected && (
            <div style={{
              padding: "1rem",
              background: "rgba(255, 165, 0, 0.1)",
              border: "1px solid rgba(255, 165, 0, 0.3)",
              borderRadius: "6px",
              marginTop: "0.5rem",
              fontSize: "0.85em"
            }}>
              ⚠️ Not connected to ROS. TF frames will appear when you run the turtlesim demo.
            </div>
          )}
        </div>
      </div>

      {/* Explanation cards */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "1rem", marginTop: "1rem" }}>
        <div className="slide-card">
          <div className="slide-card__title" style={{ color: "#ff6b6b", fontSize: "0.9em" }}>
            world → turtle1
          </div>
          <p style={{ fontSize: "0.85em", opacity: 0.9 }}>
            The first turtle's frame is published relative to the world frame.
            This transform updates as turtle1 moves.
          </p>
        </div>

        <div className="slide-card">
          <div className="slide-card__title" style={{ color: "#4ecdc4", fontSize: "0.9em" }}>
            world → turtle2
          </div>
          <p style={{ fontSize: "0.85em", opacity: 0.9 }}>
            The second turtle's frame is also published relative to world.
            Turtle2 uses TF to calculate its position relative to turtle1.
          </p>
        </div>

        <div className="slide-card">
          <div className="slide-card__title" style={{ color: "#7df9ff", fontSize: "0.9em" }}>
            TF Listener
          </div>
          <p style={{ fontSize: "0.85em", opacity: 0.9 }}>
            Turtle2 uses a TF listener to compute the transform from turtle2 → turtle1,
            allowing it to follow turtle1 automatically.
          </p>
        </div>
      </div>

      <div className="slide-callout slide-callout--info" style={{ marginTop: "1rem" }}>
        <b>Try it:</b> Move turtle1 around and observe how turtle2 automatically follows it.
        Watch the TF tree visualization to see the coordinate frames update in real-time!
        {objectiveHit && <span style={{ color: "#7df9ff", marginLeft: "1rem" }}>✓ Objective Complete!</span>}
      </div>

      <div className="slide-card" style={{ marginTop: "1rem" }}>
        <div className="slide-card__title">Key TF2 Concepts</div>
        <ul style={{ fontSize: "0.9em", lineHeight: "1.6" }}>
          <li><b>Transform Broadcasting:</b> Each turtle publishes its position as a TF transform</li>
          <li><b>Transform Listening:</b> Turtle2 listens to transforms to find turtle1's relative position</li>
          <li><b>Coordinate Frames:</b> All transforms are relative to the "world" reference frame</li>
          <li><b>Real-time Updates:</b> TF automatically handles time-stamped transforms</li>
        </ul>
      </div>
    </div>
  );
}
