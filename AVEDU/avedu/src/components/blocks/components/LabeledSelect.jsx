import React from "react";

/**
 * Label + select dropdown.
 *
 *   <LabeledSelect
 *     label="Key map"
 *     value={keyMap}
 *     onChange={setKeyMap}
 *     options={[{ value: "wasd", label: "WASD" }, { value: "arrows", label: "Arrow keys" }]}
 *   />
 *
 * `options` may also be plain strings — they're treated as `{ value: s, label: s }`.
 */
export default function LabeledSelect({ label, value, onChange, options = [] }) {
  return (
    <label className="rf-field">
      <span>{label}</span>
      <select
        className="rf-input"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      >
        {options.map((opt) => {
          const o = typeof opt === "string" ? { value: opt, label: opt } : opt;
          return (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          );
        })}
      </select>
    </label>
  );
}
