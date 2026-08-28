/**
 * LidarWidget2D.jsx
 *
 * DOM canvas 2D polar plot of the latest LIDAR scan.
 * Receives `rangesRef` — a React ref whose `.current` is a Float32Array / number[]
 * of range values (metres).  Redraws every animation frame.
 *
 * The QCar lidar sweeps 270° centred forward. We draw it the same way:
 *   angle 0 (forward) → top of canvas
 *   sweep ±135° each side
 */

import { useEffect, useRef } from 'react';

// QCar lidar parameters (matches useLidarSim)
const ANGLE_MIN  = -Math.PI * 135 / 180;  // -135°
const ANGLE_SPAN =  Math.PI * 270 / 180;  // 270°

export default function LidarWidget2D({ rangesRef }) {
  const canvasRef = useRef(null);
  const rafRef    = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    function draw() {
      rafRef.current = requestAnimationFrame(draw);

      const W = canvas.clientWidth  || canvas.width;
      const H = canvas.clientHeight || canvas.height;

      if (canvas.width !== W || canvas.height !== H) {
        canvas.width  = W;
        canvas.height = H;
      }

      const ctx = canvas.getContext('2d');
      ctx.clearRect(0, 0, W, H);

      // Background
      ctx.fillStyle = '#050d14';
      ctx.fillRect(0, 0, W, H);

      const cx   = W / 2;
      const cy   = H * 0.58;          // origin slightly below centre
      const maxR = Math.min(cx, cy) * 0.88;
      const maxM = 8.0;               // metres that map to maxR px

      // ── Grid rings ────────────────────────────────────────────────────────
      const gridRings = [1, 2, 4, 8];
      ctx.lineWidth = 0.5;
      for (const m of gridRings) {
        const r = (m / maxM) * maxR;
        if (r > maxR) continue;
        ctx.strokeStyle = 'rgba(0,180,120,0.15)';
        ctx.beginPath();
        ctx.arc(cx, cy, r, 0, Math.PI * 2);
        ctx.stroke();
        ctx.fillStyle = 'rgba(0,180,120,0.35)';
        ctx.font = `${Math.max(8, W * 0.028)}px monospace`;
        ctx.fillText(`${m}m`, cx + r + 2, cy - 2);
      }

      // ── Sweep-zone outline ────────────────────────────────────────────────
      ctx.strokeStyle = 'rgba(0,180,120,0.12)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      // forward = -Y in canvas (up), so we rotate by -π/2
      const startA = ANGLE_MIN - Math.PI / 2;
      const endA   = startA + ANGLE_SPAN;
      ctx.arc(cx, cy, maxR, startA, endA, false);
      ctx.lineTo(cx, cy);
      ctx.closePath();
      ctx.stroke();

      // ── Forward axis line ─────────────────────────────────────────────────
      ctx.strokeStyle = 'rgba(0,229,255,0.2)';
      ctx.lineWidth = 1;
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(cx, cy - maxR);
      ctx.stroke();
      ctx.setLineDash([]);

      // ── Scan points ────────────────────────────────────────────────────────
      const ranges = rangesRef?.current;
      if (!ranges || ranges.length < 2) {
        // No data label
        ctx.fillStyle = 'rgba(0,180,120,0.3)';
        ctx.font = `${Math.max(9, W * 0.035)}px monospace`;
        ctx.textAlign = 'center';
        ctx.fillText('Waiting for scan…', cx, cy - 10);
        ctx.textAlign = 'left';
        return;
      }

      const n    = ranges.length;
      const aInc = ANGLE_SPAN / (n - 1);

      // Build filled polygon for scan area
      const pts = [];
      for (let i = 0; i < n; i++) {
        const a  = ANGLE_MIN + i * aInc - Math.PI / 2;
        const d  = Math.min(ranges[i], maxM);
        const px = cx + Math.cos(a) * (d / maxM) * maxR;
        const py = cy + Math.sin(a) * (d / maxM) * maxR;
        pts.push([px, py]);
      }

      // Filled area
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      for (const [px, py] of pts) ctx.lineTo(px, py);
      ctx.closePath();
      ctx.fillStyle = 'rgba(0,229,255,0.06)';
      ctx.fill();

      // Outline + dots
      ctx.beginPath();
      ctx.moveTo(pts[0][0], pts[0][1]);
      for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i][0], pts[i][1]);
      ctx.strokeStyle = 'rgba(0,229,255,0.5)';
      ctx.lineWidth = 1;
      ctx.stroke();

      // Bright point for each ray
      ctx.fillStyle = '#00e5ff';
      for (const [px, py] of pts) {
        ctx.beginPath();
        ctx.arc(px, py, 1.2, 0, Math.PI * 2);
        ctx.fill();
      }

      // ── Car indicator ──────────────────────────────────────────────────────
      ctx.fillStyle = '#00ff88';
      ctx.beginPath();
      ctx.arc(cx, cy, 4, 0, Math.PI * 2);
      ctx.fill();
      // Forward arrow
      ctx.strokeStyle = '#00ff88';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(cx, cy - 10);
      ctx.stroke();
    }

    draw();

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [rangesRef]);

  return (
    <canvas
      ref={canvasRef}
      style={{ width: '100%', height: '100%', display: 'block' }}
    />
  );
}
