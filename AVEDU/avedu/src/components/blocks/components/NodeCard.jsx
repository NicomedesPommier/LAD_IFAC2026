import React from "react";

/**
 * Standard wrapper for a ReactFlow node.
 *
 *   <NodeCard title="PID Error" accent="orange" size="md">
 *     {body…}
 *     {handles…}
 *   </NodeCard>
 *
 * Renders:
 *   <div class="rf-card rf-card--{size} rf-card--accent-{accent}">
 *     <div class="rf-card__title">{title}</div>
 *     <div class="rf-card__body rf-card__body--stack">{children body}</div>
 *     {handles passed in as siblings of body}
 *   </div>
 *
 * The accent prop lands on the card root so its CSS variable cascade reaches
 * the body (badges, formulas, sliders, keyboard widgets) as well as the title.
 *
 * Handles are passed via `handles` rather than mixed into children so the
 * body wrapper only stacks form fields, not absolute-positioned handles.
 */
export default function NodeCard({
  title,
  accent,           // "orange" | "amber" | "green" | "blue" | "red" | "purple" | undefined
  size = "md",      // "sm" | "md" | "lg" | "xl"
  bodyClassName = "",
  className = "",
  handles,
  children,
}) {
  const classes = [
    "rf-card",
    `rf-card--${size}`,
    accent && `rf-card--accent-${accent}`,
    className,
  ].filter(Boolean).join(" ");

  return (
    <div className={classes}>
      <div className="rf-card__title">{title}</div>
      <div className={`rf-card__body rf-card__body--stack ${bodyClassName}`}>
        {children}
      </div>
      {handles}
    </div>
  );
}
