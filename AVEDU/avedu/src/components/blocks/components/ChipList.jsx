import React from "react";

/**
 * Tag/chip list wrapper. Falls back to a ghost chip when there are no items.
 *
 *   <ChipList items={args} emptyLabel="No args" />
 *   <ChipList items={deps} emptyLabel="No deps" onRemove={removeDep} />
 *
 * If `onRemove` is supplied, each chip becomes clickable and appends ` ✕`.
 */
export default function ChipList({ items = [], emptyLabel = "Empty", onRemove }) {
  if (!items.length) {
    return (
      <div className="rf-chips">
        <span className="rf-chip rf-chip--ghost">{emptyLabel}</span>
      </div>
    );
  }

  return (
    <div className="rf-chips">
      {items.map((item, i) => (
        <span
          key={`${item}-${i}`}
          className="rf-chip"
          onClick={onRemove ? () => onRemove(item) : undefined}
          title={onRemove ? "Remove" : undefined}
          style={onRemove ? undefined : { cursor: "default" }}
        >
          {item}{onRemove && " ✕"}
        </span>
      ))}
    </div>
  );
}
