// PanelDock — bar of toggle pills to open/close each dockable widget, plus a
// slot on the right (`extraControls`) for the Cam Viz / Lidar Viz toggles.

import React from 'react';
import { WIDGETS } from './widgets';
import TogglePill from './TogglePill';

export default function PanelDock({ openWidgets, onToggle, extraControls }) {
  return (
    <div className="panel-dock">
      <span className="panel-dock__label">PANELS</span>

      {Object.entries(WIDGETS).map(([id, def]) => {
        const active = openWidgets.includes(id);
        return (
          <TogglePill
            key={id}
            active={active}
            onClick={() => onToggle(id)}
            title={active ? `Close ${def.title}` : `Open ${def.title}`}
            icon={def.icon}
            label={def.title}
          />
        );
      })}

      {extraControls && <div className="panel-dock__extras">{extraControls}</div>}
    </div>
  );
}
