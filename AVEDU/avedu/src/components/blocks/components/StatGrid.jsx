import React from "react";

const COLOR_MAP = {
  green:  "#4caf50",
  blue:   "#2196f3",
  orange: "#ff9800",
  red:    "#f44336",
  gray:   "#666",
};

/**
 * Compact status row used by URDF Link/Assembly/Robot nodes.
 *
 *   <StatGrid stats={[
 *     { value: linksCount,  label: "Links",   color: "green" },
 *     { value: jointsCount, label: "Joints",  color: "blue" },
 *     { value: hasXml ? "✓" : "○", label: "XML", color: hasXml ? "green" : "gray" },
 *   ]} />
 *
 * `note` per cell renders a small caption below the value
 * (used for "2 missing name" / "1 incomplete" sub-labels).
 */
export default function StatGrid({ stats = [] }) {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: `repeat(${stats.length}, 1fr)`,
        gap: "0.4rem",
        padding: "0.5rem",
        background: "rgba(0, 0, 0, 0.2)",
        borderRadius: 8,
      }}
    >
      {stats.map(({ value, label, color = "gray", note }, i) => (
        <div key={i} style={{ textAlign: "center" }}>
          <div style={{ fontSize: "1.5em", fontWeight: "bold", color: COLOR_MAP[color] || color }}>
            {value}
          </div>
          <div style={{ fontSize: "0.85em", opacity: 0.8 }}>{label}</div>
          {note && (
            <div style={{ fontSize: "0.7em", color: COLOR_MAP.orange, marginTop: "0.25rem" }}>
              {note}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
