import React from "react";
import PropTypes from "prop-types";

export function TSimHeader({ connected, objectives, active, activePose }) {
  return (
    <header className="tsim-header">
      <div className={`tsim-status ${connected ? "ok" : "down"}`}>
        {connected ? "Connected" : "Disconnected"}
      </div>

      <h1 className="tsim-title">Turtlesim</h1>
      <div className="tsim-header__spacer" />

      <ul className="tsim-objectives">
        {objectives.map((o) => {
          const desc = o.description || o.Description || o.code;
          const done = o.user_progress?.achieved;
          return (
            <li key={o.code} className={done ? "done" : ""} title={o.code}>
              <span className="dot" />
              <span className="desc">{desc}</span>
              {done && <span className="check">✔</span>}
            </li>
          );
        })}
      </ul>

      <div className="tsim-header__active">
        {activePose ? (
          <span>
            {active} · x:{activePose.x.toFixed(2)} y:{activePose.y.toFixed(2)} θ:{activePose.theta.toFixed(2)}
          </span>
        ) : "…"}
      </div>
    </header>
  );
}

TSimHeader.propTypes = {
  connected: PropTypes.bool.isRequired,
  objectives: PropTypes.array.isRequired,
  active: PropTypes.string.isRequired,
  activePose: PropTypes.object,
};
