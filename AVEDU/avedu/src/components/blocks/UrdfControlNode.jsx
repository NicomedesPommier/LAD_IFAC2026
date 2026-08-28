// components/blocks/UrdfControlNode.jsx
import React, { useEffect, useMemo, useRef } from "react";
import { Position } from "@xyflow/react";
import HandleWithLabel from "./HandleWithLabel";

/**
 * URDF Control Node
 * Detects movable joints from robot XML and provides sliders to control them
 * Useful for testing joint articulation
 */
export default function UrdfControlNode({ id, data }) {
  // Use data.jointStates as single source of truth
  const jointStates = data?.jointStates || {};

  // Parse XML to extract joints
  const joints = useMemo(() => {
    if (!data?.xml) return [];

    try {
      const parser = new DOMParser();
      const xmlDoc = parser.parseFromString(data.xml, "text/xml");
      const jointElements = xmlDoc.querySelectorAll("joint");

      const movableJoints = [];
      jointElements.forEach((joint) => {
        const name = joint.getAttribute("name");
        const type = joint.getAttribute("type");

        // Only include movable joint types
        if (["revolute", "continuous", "prismatic"].includes(type)) {
          const axisElement = joint.querySelector("axis");
          const limitElement = joint.querySelector("limit");

          let min = -3.14159; // Default -π for revolute/continuous
          let max = 3.14159;  // Default π for revolute/continuous
          let unit = "rad";

          if (type === "prismatic") {
            min = -1.0;
            max = 1.0;
            unit = "m";
          }

          // Override with actual limits if present
          if (limitElement) {
            const lower = limitElement.getAttribute("lower");
            const upper = limitElement.getAttribute("upper");
            if (lower !== null) min = parseFloat(lower);
            if (upper !== null) max = parseFloat(upper);
          }

          movableJoints.push({
            name,
            type,
            min,
            max,
            unit,
            axis: axisElement ? axisElement.getAttribute("xyz") : "0 0 1",
          });
        }
      });

      return movableJoints;
    } catch (error) {
      console.error("Failed to parse URDF XML:", error);
      return [];
    }
  }, [data?.xml]);

  // Keep the latest jointStates in a ref so the init effect can read them
  // WITHOUT depending on their identity (which would make it re-fire on every
  // slider move and clobber the user's value back to center).
  const jointStatesRef = useRef(jointStates);
  jointStatesRef.current = jointStates;

  // Initialize missing joints to their center position — exactly once per
  // unique joint set. Guarding with a signature ref (instead of depending on
  // `data`/`jointStates`) prevents the re-entrant loop where onChange → new
  // `data` identity → effect re-runs → resets the slider.
  const initedSigRef = useRef("");
  useEffect(() => {
    if (joints.length === 0) return;

    const signature = joints.map((j) => j.name).sort().join("|");
    if (initedSigRef.current === signature) return; // already initialized this set

    const curr = jointStatesRef.current;
    const missing = joints.filter((joint) => !(joint.name in curr));
    initedSigRef.current = signature;

    if (missing.length === 0) return; // user/persisted values already present

    const initialStates = { ...curr };
    missing.forEach((joint) => {
      initialStates[joint.name] = (joint.min + joint.max) / 2;
    });
    data?.onChange?.(id, { jointStates: initialStates });
    // Only re-run when the detected joint set changes, not on data/state churn.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [joints]);

  const handleSliderChange = (jointName, value) => {
    const newValue = parseFloat(value);
    // Merge onto the latest states via the ref so a stale render-time closure
    // (onInput + onChange fire in quick succession while dragging) can't drop
    // the other joints' values.
    const newStates = {
      ...jointStatesRef.current,
      [jointName]: newValue,
    };

    // Notify parent immediately
    data?.onChange?.(id, { jointStates: newStates });
  };

  const handleReset = () => {
    const resetStates = {};
    joints.forEach((joint) => {
      resetStates[joint.name] = (joint.min + joint.max) / 2;
    });
    data?.onChange?.(id, { jointStates: resetStates });
  };

  return (
    <div className="rf-card" style={{ minWidth: 400, maxWidth: 500 }}>
      <div className="rf-card__title">Joint Controller</div>

      <div className="rf-card__body" style={{ display: "grid", gap: ".75rem" }}>
        {!data?.xml && (
          <div className="rf-hint">
            Connect Robot XML to detect movable joints
          </div>
        )}

        {data?.xml && joints.length === 0 && (
          <div className="rf-hint" style={{ color: "#ff9800" }}>
            No movable joints found in robot
            <br />
            <small style={{ fontSize: "0.85em", opacity: 0.8 }}>
              (Looking for revolute, continuous, or prismatic joints)
            </small>
          </div>
        )}

        {joints.length > 0 && (
          <>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                padding: ".5rem",
                background: "rgba(0, 0, 0, 0.2)",
                borderRadius: "8px",
              }}
            >
              <div>
                <div style={{ fontSize: "1.2em", fontWeight: "bold", color: "#2196f3" }}>
                  {joints.length}
                </div>
                <div style={{ fontSize: "0.85em", opacity: 0.8 }}>Movable Joints</div>
              </div>
              <button
                className="btn btn--sm"
                onClick={handleReset}
                title="Reset all joints to center position"
                style={{
                  padding: "0.4rem 0.8rem",
                  fontSize: "0.85em",
                }}
              >
                Reset All
              </button>
            </div>

            <div
              style={{
                maxHeight: "400px",
                overflowY: "auto",
                display: "grid",
                gap: ".75rem",
                padding: ".25rem",
              }}
            >
              {joints.map((joint) => {
                const value = jointStates[joint.name] ?? (joint.min + joint.max) / 2;
                const percentage = ((value - joint.min) / (joint.max - joint.min)) * 100;

                return (
                  <div
                    key={joint.name}
                    style={{
                      padding: ".75rem",
                      background: "rgba(255, 255, 255, 0.03)",
                      borderRadius: "8px",
                      border: "1px solid rgba(255, 255, 255, 0.1)",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        marginBottom: ".5rem",
                      }}
                    >
                      <div style={{ fontWeight: "600", fontSize: "0.95em" }}>
                        {joint.name}
                      </div>
                      <div
                        style={{
                          fontSize: "0.8em",
                          opacity: 0.7,
                          fontFamily: "monospace",
                          background: "rgba(0, 0, 0, 0.2)",
                          padding: "0.2rem 0.5rem",
                          borderRadius: "4px",
                        }}
                      >
                        {value.toFixed(3)} {joint.unit}
                      </div>
                    </div>

                    <div style={{ fontSize: "0.75em", opacity: 0.6, marginBottom: ".5rem" }}>
                      {joint.type} • axis: {joint.axis}
                    </div>

                    <input
                      type="range"
                      // `nodrag` / `nowheel` stop React Flow from hijacking the
                      // pointer: without them, pressing the slider also starts a
                      // node drag, which interrupts the interaction and makes the
                      // browser fire a final `input` event that snaps the thumb
                      // back to the range center (0).
                      className="nodrag nowheel"
                      min={joint.min}
                      max={joint.max}
                      step={(joint.max - joint.min) / 100}
                      value={value}
                      onInput={(e) => handleSliderChange(joint.name, e.target.value)}
                      onChange={(e) => handleSliderChange(joint.name, e.target.value)}
                      style={{
                        width: "100%",
                        cursor: "grab",
                        accentColor: "#2196f3",
                      }}
                    />

                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        fontSize: "0.7em",
                        opacity: 0.5,
                        marginTop: ".25rem",
                      }}
                    >
                      <span>
                        {joint.min.toFixed(2)} {joint.unit}
                      </span>
                      <span>
                        {joint.max.toFixed(2)} {joint.unit}
                      </span>
                    </div>

                    {/* Visual indicator bar */}
                    <div
                      style={{
                        marginTop: ".5rem",
                        height: "4px",
                        background: "rgba(0, 0, 0, 0.3)",
                        borderRadius: "2px",
                        overflow: "hidden",
                      }}
                    >
                      <div
                        style={{
                          height: "100%",
                          width: `${percentage}%`,
                          background: "linear-gradient(90deg, #2196f3, #21cbf3)",
                          transition: "width 0.1s ease",
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>

      {/* Input handle for XML */}
      <HandleWithLabel
        type="target"
        position={Position.Left}
        id="xml"
        label="xml"
        color="purple"
        top="50%"
      />

      {/* Output handle for joint states */}
      <HandleWithLabel
        type="source"
        position={Position.Right}
        id="jointStates"
        label="states"
        color="blue"
        top="50%"
      />
    </div>
  );
}
