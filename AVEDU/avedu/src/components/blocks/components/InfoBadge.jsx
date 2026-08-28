import React from "react";

/**
 * Small caption strip used at the bottom of nodes — pulls accent
 * color from the surrounding NodeCard's CSS variable cascade.
 *
 *   <InfoBadge>
 *     Subscribes <code>/measured</code> → Publishes <code>/pid/error</code>
 *   </InfoBadge>
 *
 * Use `size="xs"` for the slightly smaller variant in cards with many fields.
 */
export default function InfoBadge({ children, size }) {
  const cls = size === "xs" ? "rf-info-badge rf-info-badge--xs" : "rf-info-badge";
  return <div className={cls}>{children}</div>;
}
