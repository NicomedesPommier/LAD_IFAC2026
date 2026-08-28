import React, { useEffect, useRef } from "react";
import PropTypes from "prop-types";

/** Canvas que dibuja el mundo, las tortugas y la zona objetivo */
export function TSimCanvas({ turtles, active, worldSize, goalBounds }) {
  const canvasRef = useRef(null);

  // DPR sync (HiDPI)
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const ro = new ResizeObserver((entries) => {
      const { width, height } = entries[0].contentRect;
      const dpr = Math.max(1, window.devicePixelRatio || 1);
      const bw = Math.round(width * dpr);
      const bh = Math.round(height * dpr);
      if (canvas.width !== bw || canvas.height !== bh) {
        canvas.width = bw; canvas.height = bh;
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      }
    });
    ro.observe(canvas);
    return () => ro.disconnect();
  }, []);

  // Draw loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");

    let rafId;
    const draw = () => {
      const rect = canvas.getBoundingClientRect();
      const W = rect.width, H = rect.height;

      ctx.clearRect(0, 0, W, H);
      ctx.fillStyle = "rgba(0,0,0,.55)";
      ctx.fillRect(0, 0, W, H);

      const scale = Math.min(W, H) / worldSize;
      const view = worldSize * scale;
      const ox = (W - view) / 2;
      const oy = (H - view) / 2;
      const mapX = (x) => ox + x * scale;
      const mapY = (y) => oy + (worldSize - y) * scale;

      // Grid
      ctx.strokeStyle = "#1f2a4a";
      ctx.lineWidth = 1;
      for (let i = 0; i <= 11; i++) {
        const g = (i / worldSize) * view;
        ctx.beginPath(); ctx.moveTo(ox + g, oy); ctx.lineTo(ox + g, oy + view); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(ox, oy + g); ctx.lineTo(ox + view, oy + g); ctx.stroke();
      }

      // Goal zone
      const gx0 = mapX(goalBounds.minX);
      const gy0 = mapY(goalBounds.minY);
      const gx1 = mapX(worldSize);
      const gy1 = mapY(worldSize);
      ctx.fillStyle = "rgba(125,249,255,0.08)";
      ctx.fillRect(gx0, gy1, gx1 - gx0, gy0 - gy1);
      ctx.strokeStyle = "rgba(125,249,255,0.35)";
      ctx.strokeRect(gx0, gy1, gx1 - gx0, gy0 - gy1);

      // Turtles
      Object.entries(turtles).forEach(([name, data]) => {
        const p = data.pose; if (!p) return;
        const px = mapX(p.x), py = mapY(p.y);
        const k = view / 560;
        const nose = 16 * k, tail = 12 * k;

        ctx.save();
        ctx.translate(px, py);
        ctx.rotate(-p.theta);
        const isActive = name === active;
        ctx.fillStyle = isActive ? "#7df9ff" : "#10b981";
        ctx.strokeStyle = isActive ? "#7df9ffAA" : "#10b981AA";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(nose, 0);
        ctx.lineTo(-tail, 8);
        ctx.lineTo(-tail * 0.66, 0);
        ctx.lineTo(-tail, -8);
        ctx.closePath();
        ctx.fill(); ctx.stroke();
        ctx.restore();

        ctx.fillStyle = "#e6f1ff";
        ctx.font = "12px ui-monospace, monospace";
        ctx.fillText(name, px + 6, py - 6);
      });

      rafId = requestAnimationFrame(draw);
    };

    rafId = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(rafId);
  }, [turtles, active, worldSize, goalBounds]);

  return (
    <div className="tsim-canvasWrap">
      <canvas ref={canvasRef} className="tsim-canvas" />
    </div>
  );
}

TSimCanvas.propTypes = {
  turtles: PropTypes.object.isRequired,
  active: PropTypes.string.isRequired,
  worldSize: PropTypes.number.isRequired,
  goalBounds: PropTypes.shape({
    minX: PropTypes.number.isRequired,
    minY: PropTypes.number.isRequired,
  }).isRequired,
};
