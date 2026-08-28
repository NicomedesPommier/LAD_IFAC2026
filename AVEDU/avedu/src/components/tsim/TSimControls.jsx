import React, { useEffect } from "react";
import PropTypes from "prop-types";

function Btn({ text, onDown, onUp, onClick, disabled }) {
  return (
    <button
      className="tsim-btn"
      disabled={disabled}
      onMouseDown={onDown}
      onMouseUp={onUp}
      onMouseLeave={onUp}
      onTouchStart={(e) => { e.preventDefault(); onDown?.(); }}
      onTouchEnd={(e) => { e.preventDefault(); onUp?.(); }}
      onClick={onClick}
    >
      {text}
    </button>
  );
}

export function TSimControls({ connected, startHold, stopHold, publish }) {
  // Soporte de teclado (WASD / flechas / Space)
  useEffect(() => {
    const down = (e) => {
      if (!connected || e.repeat) return;
      if (["ArrowUp","KeyW"].includes(e.code)) startHold(1.5, 0);
      if (["ArrowDown","KeyS"].includes(e.code)) startHold(-1.0, 0);
      if (["ArrowLeft","KeyA"].includes(e.code)) startHold(0, 2.0);
      if (["ArrowRight","KeyD"].includes(e.code)) startHold(0, -2.0);
      if (e.code === "Space") publish(0, 0);
    };
    const up = () => stopHold();
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    return () => {
      window.removeEventListener("keydown", down);
      window.removeEventListener("keyup", up);
      stopHold();
    };
  }, [connected, startHold, stopHold, publish]);

  return (
    <div className="tsim-row">
      <label className="tsim-label">Control</label>
      <div className="tsim-controls">
        <Btn text="↑" onDown={() => startHold(1.5, 0)} onUp={stopHold} disabled={!connected} />
        <Btn text="↓" onDown={() => startHold(-1.0, 0)} onUp={stopHold} disabled={!connected} />
        <Btn text="←" onDown={() => startHold(0, 2.0)} onUp={stopHold} disabled={!connected} />
        <Btn text="→" onDown={() => startHold(0, -2.0)} onUp={stopHold} disabled={!connected} />
        <Btn text="■" onClick={() => publish(0, 0)} disabled={!connected} />
      </div>
      <div className="tsim-hint">W/A/S/D o flechas · Space para frenar</div>
    </div>
  );
}

TSimControls.propTypes = {
  connected: PropTypes.bool.isRequired,
  startHold: PropTypes.func.isRequired,
  stopHold: PropTypes.func.isRequired,
  publish: PropTypes.func.isRequired,
};
