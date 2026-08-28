import React from "react";
import { Handle, Position } from "@xyflow/react";

/**
 * HandleWithLabel - Standardized handle component with optional label
 *
 * @param {object} props
 * @param {string} props.type - "source" or "target"
 * @param {Position} props.position - Position.Left or Position.Right
 * @param {string} props.id - Handle ID
 * @param {string} [props.label] - Label text to display beside handle
 * @param {string} [props.color] - Handle color: "orange", "blue", "red", "green", "purple", or "neon" (default)
 * @param {string} [props.top] - CSS top position
 * @param {string} [props.title] - Tooltip text
 */
export default function HandleWithLabel({
  type,
  position,
  id,
  label,
  color = "neon",
  top,
  title
}) {
  const isLeft = position === Position.Left;

  return (
    <>
      <Handle
        type={type}
        position={position}
        id={id}
        style={{ top }}
        data-handlecolor={color}
        title={title || label}
      />
      {label && (
        <div
          className={`rf-handle-label rf-handle-label--${isLeft ? 'left' : 'right'}`}
          style={{ top }}
        >
          {isLeft ? `${label} |` : `| ${label}`}
        </div>
      )}
    </>
  );
}
