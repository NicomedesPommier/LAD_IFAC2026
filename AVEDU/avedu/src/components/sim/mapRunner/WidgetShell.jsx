// WidgetShell — chrome around a docked widget: a title bar (name + move/close
// controls) and a content area. Used in both the right and bottom zones.

import React from 'react';
import { WIDGETS } from './widgets';

export default function WidgetShell({ id, zone, onClose, onMoveZone, children }) {
  const def = WIDGETS[id];
  const otherZone = zone === 'right' ? 'bottom' : 'right';
  const zoneIcon = otherZone === 'right' ? '→' : '↓';

  return (
    <div className={`widget-shell widget-shell--${zone}`}>
      <div className="widget-shell__titlebar">
        {def.icon && <span style={{ fontSize: 12 }}>{def.icon}</span>}
        <span className="widget-shell__title">{def.title}</span>

        <button
          className="widget-shell__btn widget-shell__btn--move"
          onClick={() => onMoveZone(id, otherZone)}
          title={`Move to ${otherZone}`}
        >
          {zoneIcon}
        </button>

        <button
          className="widget-shell__btn widget-shell__btn--close"
          onClick={() => onClose(id)}
          title="Close panel"
        >
          ✕
        </button>
      </div>

      <div className="widget-shell__content">{children}</div>
    </div>
  );
}
