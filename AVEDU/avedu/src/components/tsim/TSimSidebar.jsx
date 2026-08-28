import React from "react";
import PropTypes from "prop-types";

export function TSimSidebar({ connected, active, setActive, turtleNames, spawnTurtle }) {
  return (
    <aside className="tsim-panel">
      <div className="tsim-row tsim-row--inline">
        <label className="tsim-label">Active</label>
        <select
          className="tsim-select"
          value={active}
          onChange={(e) => setActive(e.target.value)}
          disabled={!connected || turtleNames.length === 0}
        >
          {[active, ...turtleNames.filter((n) => n !== active)].map((n) => (
            <option key={n} value={n}>{n}</option>
          ))}
        </select>
      </div>

      <div className="tsim-row tsim-row--inline">
        <label className="tsim-label">Spawn</label>
        <div className="tsim-spawn">
          <input className="tsim-input" placeholder="optional name" id="tname" />
          <button
            className="btn"
            disabled={!connected}
            onClick={() => {
              const el = document.getElementById("tname");
              const name = el.value.trim();
              spawnTurtle(name || undefined);
              el.value = "";
            }}
          >+ Add</button>
        </div>
      </div>
    </aside>
  );
}

TSimSidebar.propTypes = {
  connected: PropTypes.bool.isRequired,
  active: PropTypes.string.isRequired,
  setActive: PropTypes.func.isRequired,
  turtleNames: PropTypes.array.isRequired,
  spawnTurtle: PropTypes.func.isRequired,
};
