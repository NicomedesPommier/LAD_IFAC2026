import React from "react";

/**
 * WASD-style keyboard with an optional legend underneath.
 * Shared by KeyboardInputNode (WASD/arrow teleop) and QCarTeleopNode.
 *
 * `rows` is the top-down key layout; each cell is `{ label, wide? }` (or
 * just a string). `legend` is an array of `{ key, action }` lines printed
 * below the keys.
 *
 *   <KeyboardVisualizer
 *     rows={[
 *       [{ label: "W" }],
 *       [{ label: "A" }, { label: "S" }, { label: "D" }],
 *       [{ label: "SPC", wide: true }],
 *     ]}
 *     legend={[
 *       { key: "W/S", action: "forward/backward" },
 *       { key: "A/D", action: "steer left/right" },
 *     ]}
 *   />
 *
 * Colors come from the enclosing NodeCard's accent — no color prop.
 */
export default function KeyboardVisualizer({ rows = [], legend = [] }) {
  return (
    <div className="rf-keyboard">
      {rows.map((row, ri) => (
        <div key={ri} className="rf-keyboard__row">
          {row.map((cell, ci) => {
            const c = typeof cell === "string" ? { label: cell } : cell;
            const cls = c.wide
              ? "rf-keyboard__key rf-keyboard__key--wide"
              : "rf-keyboard__key";
            return (
              <div key={ci} className={cls}>
                {c.label}
              </div>
            );
          })}
        </div>
      ))}
      {legend.length > 0 && (
        <div className="rf-keyboard__legend">
          {legend.map(({ key, action }) => (
            <span key={key} className="rf-keyboard__legend-item">
              <b className="rf-keyboard__legend-key">{key}</b> {action}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
