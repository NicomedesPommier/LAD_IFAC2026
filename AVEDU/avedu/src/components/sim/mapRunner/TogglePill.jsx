// TogglePill — the small rounded on/off pill used across MapRunner:
// the dock's panel toggles and the Cam Viz / Lidar Viz overlay toggles.
//
// `accent` selects the active-state color ('neon' | 'cam' | 'lidar').

import React from 'react';

export default function TogglePill({
  active,
  onClick,
  title,
  icon,
  label,
  accent = 'neon',
}) {
  const cls = [
    'toggle-pill',
    accent !== 'neon' && `toggle-pill--accent-${accent}`,
    active && 'toggle-pill--active',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <button className={cls} onClick={onClick} title={title}>
      {icon && <span>{icon}</span>}
      <span>{label}</span>
      {active && <span className="toggle-pill__close">✕</span>}
    </button>
  );
}
