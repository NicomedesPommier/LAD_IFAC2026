import React from "react";

/**
 * Label + text/number input row (rf-field + rf-input).
 *
 *   <LabeledInput label="Topic" value={topic} onChange={setTopic} />
 *   <LabeledInput label="Kp" type="number" step="0.01" value={kp} onChange={...} />
 *
 * The trailing `valueDisplay` slot is used by range-style headers where the
 * label needs to show the current value (e.g. "Linear speed  0.50 m/s").
 */
export default function LabeledInput({
  label,
  value,
  onChange,
  type = "text",
  placeholder,
  step,
  min,
  max,
  valueDisplay,    // optional ReactNode shown beside the label
  inputProps = {},
}) {
  // For numeric fields we keep the *raw string* the user is typing in local
  // state so intermediate/empty values ("", "-", "1.") don't get snapped back
  // to 0 mid-edit. The parsed number is only pushed up when it's actually a
  // number, and on blur an empty field resolves to 0.
  const isNumeric = type === "number" || type === "range";
  const [draft, setDraft] = React.useState(null);

  const handle = (e) => {
    if (isNumeric) {
      const raw = e.target.value;
      setDraft(raw);
      if (raw === "" || raw === "-" || raw === "." || raw === "-.") {
        return; // let the field be empty/partial without forcing a value
      }
      const v = parseFloat(raw);
      if (!Number.isNaN(v)) onChange(v);
    } else {
      onChange(e.target.value);
    }
  };

  const handleBlur = () => {
    if (!isNumeric) return;
    if (draft !== null && (draft === "" || Number.isNaN(parseFloat(draft)))) {
      onChange(0);
    }
    setDraft(null); // resync display with the committed value
  };

  // Show the in-progress draft while editing, otherwise the committed value.
  const displayValue = isNumeric && draft !== null ? draft : value;

  return (
    <label className="rf-field">
      <span>
        {label}
        {valueDisplay != null && <span className="rf-field__value">{valueDisplay}</span>}
      </span>
      <input
        className={type === "range" ? "rf-range" : "rf-input"}
        type={type}
        value={displayValue}
        onChange={handle}
        onBlur={handleBlur}
        placeholder={placeholder}
        step={step}
        min={min}
        max={max}
        {...inputProps}
      />
    </label>
  );
}
