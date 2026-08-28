import React from "react";

/**
 * Wraps a label + input pair so the input animates closed when a handle
 * is wired in (the connection becomes the source of truth, so the local
 * input is hidden but the label stays visible).
 *
 *   <CollapsibleField label="Package name" collapsed={isPkgConnected}>
 *     <input className="rf-input" ... />
 *   </CollapsibleField>
 *
 * Used in CreatePackageNode — when "pkgName" handle is connected the
 * package name input collapses smoothly.
 */
export default function CollapsibleField({ label, collapsed, children }) {
  const cls = `rf-field--collapsible ${collapsed ? "rf-field--collapsed" : ""}`;
  return (
    <div className={cls}>
      <span className="rf-field__label">{label}</span>
      <div className="rf-field__input-wrapper">{children}</div>
    </div>
  );
}
