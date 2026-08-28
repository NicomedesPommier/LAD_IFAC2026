import React from "react";

/**
 * Small dim caption shown below an input — e.g. format hints
 * ("e.g. package://my_robot/meshes/body.stl") or a one-line explanation.
 *
 * Use `tone="warn"` for inline warnings (currently rendered in orange).
 */
export default function HintText({ children, tone }) {
  const cls = tone ? `rf-hint rf-hint--${tone}` : "rf-hint";
  return <small className={cls}>{children}</small>;
}
