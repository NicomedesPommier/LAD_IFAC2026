// src/levels/slidesSensing/01a-ExploringTopicsInteractive.jsx
import React, { useState, useCallback } from "react";
import { useProgress } from "../../context/ProgressContext";
import EmbeddedIDE from "../../components/ide/EmbeddedIDE";
import "../../styles/_rosflow.scss";

export const meta = {
  id: "exploring-topics-interactive",
  title: "Exploring QCar Sensor Topics (Interactive)",
  order: 2,
  objectiveCode: "SENSE_EXPLORE_TOPICS",
};

export default function ExploringTopicsInteractive({ onObjectiveHit, goNext }) {
  const { hitObjective } = useProgress();
  const [quizAnswers, setQuizAnswers] = useState({
    lidarMessageType: "",
    lidarPublishers: "",
    cameraFrontTopic: "",
    totalCameras: "",
  });
  const [quizResults, setQuizResults] = useState({});
  const [showHints, setShowHints] = useState(false);

  // Correct answers
  const correctAnswers = {
    lidarMessageType: "sensor_msgs/msg/LaserScan",
    lidarPublishers: "1",
    cameraFrontTopic: "/camera/csi_front/image_raw",
    totalCameras: "5",
  };

  const handleAnswerChange = (question, value) => {
    setQuizAnswers(prev => ({ ...prev, [question]: value }));
    // Clear result for this question when user changes answer
    setQuizResults(prev => ({ ...prev, [question]: null }));
  };

  const checkAnswer = (question) => {
    const userAnswer = quizAnswers[question].trim();
    const correct = correctAnswers[question];
    const isCorrect = userAnswer.toLowerCase() === correct.toLowerCase();

    setQuizResults(prev => ({ ...prev, [question]: isCorrect }));

    // Check if all answers are correct
    const allAnswered = Object.keys(correctAnswers).every(q => quizAnswers[q].trim());
    const allCorrect = Object.keys(correctAnswers).every(q => {
      const updatedResults = { ...quizResults, [question]: isCorrect };
      return updatedResults[q] === true;
    });

    if (allAnswered && allCorrect) {
      handleComplete();
    }
  };

  const handleComplete = useCallback(() => {
    console.log(`[Tutorial] Completed: Exploring Topics`);

    if (meta.objectiveCode && hitObjective) {
      hitObjective(meta.objectiveCode);
    }

    if (onObjectiveHit) {
      onObjectiveHit(meta.objectiveCode);
    }

    if (goNext) {
      setTimeout(() => goNext(), 1500);
    }
  }, [hitObjective, onObjectiveHit, goNext]);

  return (
    <div className="slide" style={{ maxWidth: "100%", height: "100%" }}>
      <h2>Exploring QCar Sensor Topics 🔍</h2>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", height: "calc(100% - 80px)" }}>
        {/* Left side: Terminal */}
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          <div className="slide-card">
            <div className="slide-card__title">Terminal Commands</div>
            <p style={{ fontSize: "0.9em", marginBottom: "1rem" }}>
              Use these commands to explore the QCar sensor topics:
            </p>

            <div style={{
              background: "rgba(0,0,0,0.3)",
              padding: "1rem",
              borderRadius: "8px",
              fontSize: "0.85em",
              fontFamily: "monospace"
            }}>
              <div style={{ marginBottom: "0.75rem" }}>
                <div style={{ color: "var(--neon, #7df9ff)", marginBottom: "0.25rem" }}>
                  # List all active topics
                </div>
                <code>ros2 topic list</code>
              </div>

              <div style={{ marginBottom: "0.75rem" }}>
                <div style={{ color: "var(--neon, #7df9ff)", marginBottom: "0.25rem" }}>
                  # Show topic information
                </div>
                <code>ros2 topic info /scan</code>
              </div>

              <div style={{ marginBottom: "0.75rem" }}>
                <div style={{ color: "var(--neon, #7df9ff)", marginBottom: "0.25rem" }}>
                  # Display live messages
                </div>
                <code>ros2 topic echo /scan</code>
              </div>

              <div>
                <div style={{ color: "var(--neon, #7df9ff)", marginBottom: "0.25rem" }}>
                  # Show message rate (Hz)
                </div>
                <code>ros2 topic hz /scan</code>
              </div>
            </div>

            <button
              className="btn"
              onClick={() => setShowHints(!showHints)}
              style={{ marginTop: "1rem", width: "100%" }}
            >
              {showHints ? "Hide Hints" : "Show Hints"}
            </button>

            {showHints && (
              <div className="slide-callout slide-callout--info" style={{ marginTop: "1rem" }}>
                <b>Hints:</b>
                <ul style={{ fontSize: "0.85em", marginTop: "0.5rem" }}>
                  <li>Use <code>ros2 topic info /scan</code> to see message type and publisher count</li>
                  <li>Look for camera topics with <code>ros2 topic list | grep camera</code></li>
                  <li>The QCar has 1 RGB camera + 4 CSI cameras (front, right, back, left)</li>
                  <li>Message types follow the format: package/msg/MessageType</li>
                </ul>
              </div>
            )}
          </div>

          {/* Embedded IDE with terminal */}
          <div style={{ flex: 1, minHeight: "400px" }}>
            <EmbeddedIDE
              workspaceName="sensing"
              tutorial={null}
              defaultTab="terminal"
            />
          </div>
        </div>

        {/* Right side: Quiz */}
        <div className="slide-card" style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          <div className="slide-card__title">Sensor Topics Quiz</div>
          <p style={{ fontSize: "0.9em" }}>
            Answer the following questions using the terminal commands. Run the commands and find the information!
          </p>

          {/* Question 1 */}
          <div style={{
            padding: "1rem",
            background: "rgba(125, 249, 255, 0.05)",
            borderRadius: "8px",
            border: `2px solid ${quizResults.lidarMessageType === true ? 'rgba(0, 255, 0, 0.5)' : quizResults.lidarMessageType === false ? 'rgba(255, 0, 0, 0.5)' : 'rgba(125, 249, 255, 0.2)'}`
          }}>
            <div style={{ fontWeight: "bold", marginBottom: "0.5rem" }}>
              1. What is the message type for the LIDAR /scan topic?
            </div>
            <input
              type="text"
              value={quizAnswers.lidarMessageType}
              onChange={(e) => handleAnswerChange("lidarMessageType", e.target.value)}
              placeholder="e.g., sensor_msgs/msg/..."
              style={{
                width: "100%",
                padding: "0.5rem",
                borderRadius: "4px",
                border: "1px solid rgba(255,255,255,0.2)",
                background: "rgba(0,0,0,0.3)",
                color: "inherit",
                fontFamily: "monospace"
              }}
            />
            <button
              className="btn"
              onClick={() => checkAnswer("lidarMessageType")}
              style={{ marginTop: "0.5rem", width: "100%" }}
            >
              Check Answer
            </button>
            {quizResults.lidarMessageType === true && (
              <div style={{ color: "#00ff00", marginTop: "0.5rem", fontSize: "0.9em" }}>
                ✓ Correct!
              </div>
            )}
            {quizResults.lidarMessageType === false && (
              <div style={{ color: "#ff4444", marginTop: "0.5rem", fontSize: "0.9em" }}>
                ✗ Try again. Use: ros2 topic info /scan
              </div>
            )}
          </div>

          {/* Question 2 */}
          <div style={{
            padding: "1rem",
            background: "rgba(255, 95, 244, 0.05)",
            borderRadius: "8px",
            border: `2px solid ${quizResults.lidarPublishers === true ? 'rgba(0, 255, 0, 0.5)' : quizResults.lidarPublishers === false ? 'rgba(255, 0, 0, 0.5)' : 'rgba(255, 95, 244, 0.2)'}`
          }}>
            <div style={{ fontWeight: "bold", marginBottom: "0.5rem" }}>
              2. How many publishers are publishing to /scan?
            </div>
            <input
              type="text"
              value={quizAnswers.lidarPublishers}
              onChange={(e) => handleAnswerChange("lidarPublishers", e.target.value)}
              placeholder="Enter a number"
              style={{
                width: "100%",
                padding: "0.5rem",
                borderRadius: "4px",
                border: "1px solid rgba(255,255,255,0.2)",
                background: "rgba(0,0,0,0.3)",
                color: "inherit",
                fontFamily: "monospace"
              }}
            />
            <button
              className="btn"
              onClick={() => checkAnswer("lidarPublishers")}
              style={{ marginTop: "0.5rem", width: "100%" }}
            >
              Check Answer
            </button>
            {quizResults.lidarPublishers === true && (
              <div style={{ color: "#00ff00", marginTop: "0.5rem", fontSize: "0.9em" }}>
                ✓ Correct!
              </div>
            )}
            {quizResults.lidarPublishers === false && (
              <div style={{ color: "#ff4444", marginTop: "0.5rem", fontSize: "0.9em" }}>
                ✗ Check the "Publisher count" in ros2 topic info /scan
              </div>
            )}
          </div>

          {/* Question 3 */}
          <div style={{
            padding: "1rem",
            background: "rgba(255, 200, 87, 0.05)",
            borderRadius: "8px",
            border: `2px solid ${quizResults.cameraFrontTopic === true ? 'rgba(0, 255, 0, 0.5)' : quizResults.cameraFrontTopic === false ? 'rgba(255, 0, 0, 0.5)' : 'rgba(255, 200, 87, 0.2)'}`
          }}>
            <div style={{ fontWeight: "bold", marginBottom: "0.5rem" }}>
              3. What is the topic name for the front CSI camera image?
            </div>
            <input
              type="text"
              value={quizAnswers.cameraFrontTopic}
              onChange={(e) => handleAnswerChange("cameraFrontTopic", e.target.value)}
              placeholder="/camera/..."
              style={{
                width: "100%",
                padding: "0.5rem",
                borderRadius: "4px",
                border: "1px solid rgba(255,255,255,0.2)",
                background: "rgba(0,0,0,0.3)",
                color: "inherit",
                fontFamily: "monospace"
              }}
            />
            <button
              className="btn"
              onClick={() => checkAnswer("cameraFrontTopic")}
              style={{ marginTop: "0.5rem", width: "100%" }}
            >
              Check Answer
            </button>
            {quizResults.cameraFrontTopic === true && (
              <div style={{ color: "#00ff00", marginTop: "0.5rem", fontSize: "0.9em" }}>
                ✓ Correct!
              </div>
            )}
            {quizResults.cameraFrontTopic === false && (
              <div style={{ color: "#ff4444", marginTop: "0.5rem", fontSize: "0.9em" }}>
                ✗ Look for camera topics with: ros2 topic list | grep csi_front
              </div>
            )}
          </div>

          {/* Question 4 */}
          <div style={{
            padding: "1rem",
            background: "rgba(125, 249, 255, 0.05)",
            borderRadius: "8px",
            border: `2px solid ${quizResults.totalCameras === true ? 'rgba(0, 255, 0, 0.5)' : quizResults.totalCameras === false ? 'rgba(255, 0, 0, 0.5)' : 'rgba(125, 249, 255, 0.2)'}`
          }}>
            <div style={{ fontWeight: "bold", marginBottom: "0.5rem" }}>
              4. How many total cameras does the QCar have?
            </div>
            <input
              type="text"
              value={quizAnswers.totalCameras}
              onChange={(e) => handleAnswerChange("totalCameras", e.target.value)}
              placeholder="Enter a number"
              style={{
                width: "100%",
                padding: "0.5rem",
                borderRadius: "4px",
                border: "1px solid rgba(255,255,255,0.2)",
                background: "rgba(0,0,0,0.3)",
                color: "inherit",
                fontFamily: "monospace"
              }}
            />
            <button
              className="btn"
              onClick={() => checkAnswer("totalCameras")}
              style={{ marginTop: "0.5rem", width: "100%" }}
            >
              Check Answer
            </button>
            {quizResults.totalCameras === true && (
              <div style={{ color: "#00ff00", marginTop: "0.5rem", fontSize: "0.9em" }}>
                ✓ Correct! All questions answered! 🎉
              </div>
            )}
            {quizResults.totalCameras === false && (
              <div style={{ color: "#ff4444", marginTop: "0.5rem", fontSize: "0.9em" }}>
                ✗ Count camera topics: 1 RGB + 4 CSI cameras
              </div>
            )}
          </div>

          {Object.values(quizResults).filter(r => r === true).length === 4 && (
            <div className="slide-callout slide-callout--success">
              <b>Perfect! 🎉</b> You've successfully explored all QCar sensor topics!
              Click "Next" to continue.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
