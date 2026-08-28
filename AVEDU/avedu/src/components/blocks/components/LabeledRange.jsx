import React from "react";
import LabeledInput from "./LabeledInput";

/**
 * Label + range slider that shows the current value inline.
 *
 *   <LabeledRange
 *     label="Linear speed"
 *     unit="m/s"
 *     value={linearSpeed}
 *     onChange={setLinearSpeed}
 *     min={0.1} max={2.0} step={0.05}
 *     format={(v) => v.toFixed(2)}
 *   />
 *
 * Color comes from the parent card's accent via the `.rf-range` CSS rule —
 * no need to pass a color prop.
 */
export default function LabeledRange({
  label,
  unit,
  value,
  onChange,
  min,
  max,
  step,
  format = (v) => v.toFixed(2),
}) {
  return (
    <LabeledInput
      label={label}
      value={value}
      onChange={onChange}
      type="range"
      min={min}
      max={max}
      step={step}
      valueDisplay={unit ? `${format(value)} ${unit}` : format(value)}
    />
  );
}
