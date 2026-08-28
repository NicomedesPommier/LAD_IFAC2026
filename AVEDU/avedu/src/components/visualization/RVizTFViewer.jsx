// src/components/visualization/RVizTFViewer.jsx
import React, { useState, useEffect, useCallback } from "react";
import RVizViewer from "./RVizViewer";
import "../../styles/components/_rviz-tf-viewer.scss";

/**
 * RVizTFViewer - Reusable RViz viewer component for TF visualization
 *
 * A wrapper around RVizViewer with header, status indicator, frame controls, and TF-specific configuration
 *
 * @param {Object} props
 * @param {Object} props.ros - ROS connection object
 * @param {boolean} props.connected - ROS connection status
 * @param {string} props.fixedFrame - Fixed frame for RViz (default: "world")
 * @param {boolean} props.showGrid - Show grid in RViz (default: true)
 * @param {boolean} props.showAxes - Show axes in RViz (default: true)
 * @param {number} props.axisLength - Length of axes (default: 0.3)
 * @param {string} props.title - Custom title (default: "TF Visualization (RViz)")
 * @param {string} props.className - Additional CSS class
 * @param {boolean} props.showFrameControls - Show frame visibility controls (default: true)
 * @param {function} props.onFramesUpdate - Callback when frames list updates
 */
export default function RVizTFViewer({
  ros,
  connected = false,
  fixedFrame = "world",
  showGrid = true,
  showAxes = true,
  axisLength = 0.3,
  title = "TF Visualization (RViz)",
  className = "",
  showFrameControls = true,
  onFramesUpdate,
}) {
  const [visibleFrames, setVisibleFrames] = useState(new Set());
  const [allFrames, setAllFrames] = useState([]);
  const [showAllFrames, setShowAllFrames] = useState(true);
  const [controlsCollapsed, setControlsCollapsed] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  // Update visible frames when all frames change
  useEffect(() => {
    if (showAllFrames) {
      setVisibleFrames(new Set(allFrames));
    }
  }, [allFrames, showAllFrames]);

  // Handle frame visibility toggle
  const toggleFrame = useCallback((frameName) => {
    setVisibleFrames((prev) => {
      const next = new Set(prev);
      if (next.has(frameName)) {
        next.delete(frameName);
      } else {
        next.add(frameName);
      }
      // If toggling manually, disable "show all" mode
      setShowAllFrames(false);
      return next;
    });
  }, []);

  // Toggle all frames
  const toggleAllFrames = useCallback(() => {
    if (showAllFrames) {
      // Hide all frames
      setVisibleFrames(new Set());
      setShowAllFrames(false);
    } else {
      // Show all frames
      setVisibleFrames(new Set(allFrames));
      setShowAllFrames(true);
    }
  }, [showAllFrames, allFrames]);

  // Handle frames update from RVizViewer
  const handleFramesUpdate = useCallback((frames) => {
    setAllFrames(frames);
    onFramesUpdate?.(frames);
  }, [onFramesUpdate]);

  // Filter frames based on search term
  const filteredFrames = allFrames.filter((frame) =>
    frame.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <aside className={`rviz-tf-viewer ${className}`}>
      {/* Header */}
      <div className="rviz-tf-viewer__header">
        <span className="rviz-tf-viewer__title">🎯 {title}</span>
        <span className={`rviz-tf-viewer__status ${connected ? 'connected' : 'disconnected'}`}>
          {connected ? "Connected" : "Waiting..."}
        </span>
      </div>

      {/* Frame Controls Panel */}
      {showFrameControls && allFrames.length > 0 && (
        <div className={`rviz-tf-viewer__controls ${controlsCollapsed ? 'collapsed' : ''}`}>
          <div className="rviz-tf-viewer__controls-header">
            <span className="rviz-tf-viewer__controls-title">
              TF Frames ({visibleFrames.size}/{allFrames.length})
            </span>
            <button
              className="rviz-tf-viewer__controls-toggle"
              onClick={() => setControlsCollapsed(!controlsCollapsed)}
              title={controlsCollapsed ? "Expand" : "Collapse"}
            >
              {controlsCollapsed ? '▼' : '▲'}
            </button>
          </div>

          {!controlsCollapsed && (
            <div className="rviz-tf-viewer__controls-content">
              {/* Search and Toggle All */}
              <div className="rviz-tf-viewer__controls-actions">
                <input
                  type="text"
                  className="rviz-tf-viewer__search"
                  placeholder="Search frames..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                <button
                  className="rviz-tf-viewer__toggle-all"
                  onClick={toggleAllFrames}
                  title={showAllFrames ? "Hide all frames" : "Show all frames"}
                >
                  {showAllFrames ? '👁️ All' : '👁️‍🗨️ None'}
                </button>
              </div>

              {/* Frame List */}
              <div className="rviz-tf-viewer__frames-list">
                {filteredFrames.length > 0 ? (
                  filteredFrames.map((frame) => (
                    <label key={frame} className="rviz-tf-viewer__frame-item">
                      <input
                        type="checkbox"
                        checked={visibleFrames.has(frame)}
                        onChange={() => toggleFrame(frame)}
                      />
                      <span className="rviz-tf-viewer__frame-icon">📐</span>
                      <span className="rviz-tf-viewer__frame-name">{frame}</span>
                    </label>
                  ))
                ) : (
                  <div className="rviz-tf-viewer__empty">
                    {searchTerm ? `No frames matching "${searchTerm}"` : 'No frames detected'}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Viewer */}
      <div className="rviz-tf-viewer__wrapper">
        <RVizViewer
          ros={ros}
          fixedFrame={fixedFrame}
          showGrid={showGrid}
          showAxes={showAxes}
          axisLength={axisLength}
          visibleFrames={Array.from(visibleFrames)}
          onFramesUpdate={handleFramesUpdate}
        />
      </div>
    </aside>
  );
}
