import React from "react";

/**
 * 3-column number input for XYZ, RPY, or any other small numeric vector.
 *
 *   <VectorInput
 *     label="Position (m)"
 *     value={[x, y, z]}
 *     onChange={(next) => setPosition(next)}
 *     placeholders={["X", "Y", "Z"]}
 *     step={0.1}
 *   />
 *
 * `value` may be an array `[a, b, c]` or an object — pass `keys` for objects:
 *
 *   <VectorInput
 *     label="Rotation"
 *     value={rotation}
 *     keys={["roll", "pitch", "yaw"]}
 *     onChange={(next) => setRotation(next)}
 *     placeholders={["Roll", "Pitch", "Yaw"]}
 *   />
 */
export default function VectorInput({
  label,
  value,
  keys,             // object-mode: e.g. ["x", "y", "z"]
  onChange,
  placeholders = ["", "", ""],
  step = 0.1,
  size = 3,
}) {
  const isArray = Array.isArray(value);
  const arr = isArray
    ? value
    : (keys || ["x", "y", "z"]).map((k) => value?.[k] ?? 0);

  // Per-column raw drafts so a partially-typed/empty cell ("", "-", "1.")
  // isn't snapped back to 0 on every keystroke.
  const [drafts, setDrafts] = React.useState({});

  const commit = (i, next) => {
    if (isArray) {
      const out = [...arr];
      out[i] = next;
      onChange(out);
    } else {
      const k = keys[i];
      onChange({ ...value, [k]: next });
    }
  };

  const update = (i, raw) => {
    setDrafts((d) => ({ ...d, [i]: raw }));
    if (raw === "" || raw === "-" || raw === "." || raw === "-.") return;
    const v = parseFloat(raw);
    if (!Number.isNaN(v)) commit(i, v);
  };

  const handleBlur = (i) => {
    const raw = drafts[i];
    if (raw !== undefined && (raw === "" || Number.isNaN(parseFloat(raw)))) {
      commit(i, 0);
    }
    setDrafts((d) => {
      const { [i]: _drop, ...rest } = d;
      return rest;
    });
  };

  const cols = `repeat(${size}, 1fr)`;

  return (
    <div className="rf-field">
      {label && <label>{label}</label>}
      <div className="rf-grid" style={{ gridTemplateColumns: cols, gap: ".3rem" }}>
        {arr.slice(0, size).map((v, i) => (
          <input
            key={i}
            className="rf-input"
            type="number"
            step={step}
            placeholder={placeholders[i]}
            value={drafts[i] !== undefined ? drafts[i] : v}
            onChange={(e) => update(i, e.target.value)}
            onBlur={() => handleBlur(i)}
          />
        ))}
      </div>
    </div>
  );
}
