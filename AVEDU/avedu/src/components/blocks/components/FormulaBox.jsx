import React from "react";

/**
 * Monospace formula / equation display box. Picks up the accent color
 * of the enclosing NodeCard via CSS variables — used in PIDErrorNode,
 * PIDControllerNode etc.
 */
export default function FormulaBox({ children }) {
  return <div className="rf-formula">{children}</div>;
}
