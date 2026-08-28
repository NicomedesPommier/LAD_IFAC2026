// src/simulations/vehicle-dynamics/BicycleModel.jsx
// Simulación: modelo de bicicleta (simplificación de 2 ruedas).
import React, { useState } from "react";
import {
  SimCanvas,
  SimSlider,
  SimPanel,
  deg2rad,
  yawRate,
  themePalette,
} from "../../components/simulations";

export const meta = {
  id: "vd-bicycle",
  title: "Modelo de bicicleta (2 ruedas)",
  order: 4,
  objectiveCode: "vd-slide-bicycle",
};

const SCALE = 100; // píxeles por metro

export default function BicycleModel() {
  const [lf, setLf] = useState(1.2);
  const [lr, setLr] = useState(1.5);
  const [delta, setDelta] = useState(5);
  const [beta, setBeta] = useState(0);
  const [velocity, setVelocity] = useState(10);
  const [showVelocities, setShowVelocities] = useState(true);

  const L = lf + lr;
  const psiDot = yawRate(velocity, L, deg2rad(delta));

  const draw = (ctx, { width, height }) => {
    const C = themePalette();
    const cx = width / 2;
    const cy = height / 2;
    const deltaRad = deg2rad(delta);
    const betaRad = deg2rad(beta);

    // Ejes de referencia
    ctx.strokeStyle = C.gridLine;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, cy);
    ctx.lineTo(width, cy);
    ctx.moveTo(cx, 0);
    ctx.lineTo(cx, height);
    ctx.stroke();

    ctx.font = "11px monospace";
    ctx.fillStyle = C.dim;
    ctx.fillText("X", width - 15, cy - 5);
    ctx.fillText("Y", cx + 5, 15);

    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(betaRad);

    // Chasis: del eje trasero al delantero
    ctx.strokeStyle = C.accent;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(0, -lf * SCALE);
    ctx.lineTo(0, lr * SCALE);
    ctx.stroke();

    const frontY = -lf * SCALE;

    // Rueda delantera (gira con la dirección)
    ctx.strokeStyle = C.accent2;
    ctx.lineWidth = 4;
    ctx.save();
    ctx.translate(0, frontY);
    ctx.rotate(deltaRad);
    ctx.beginPath();
    ctx.moveTo(0, -15);
    ctx.lineTo(0, 15);
    ctx.stroke();
    ctx.restore();

    // Rueda trasera (fija)
    ctx.strokeStyle = C.accent;
    ctx.beginPath();
    ctx.moveTo(0, lr * SCALE - 15);
    ctx.lineTo(0, lr * SCALE + 15);
    ctx.stroke();

    // Centro de gravedad
    ctx.fillStyle = C.highlight;
    ctx.beginPath();
    ctx.arc(0, 0, 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.font = "12px monospace";
    ctx.fillText("CG", 10, -5);

    if (showVelocities && velocity > 0) {
      const vScale = velocity * 15;

      // Velocidad en el CG
      ctx.strokeStyle = C.accent;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(vScale, 0);
      ctx.stroke();

      ctx.fillStyle = C.accent;
      ctx.beginPath();
      ctx.moveTo(vScale, 0);
      ctx.lineTo(vScale - 8, -5);
      ctx.lineTo(vScale - 8, 5);
      ctx.closePath();
      ctx.fill();
      ctx.font = "11px monospace";
      ctx.fillText("V", vScale + 5, -5);

      // Velocidad de la rueda delantera
      ctx.save();
      ctx.translate(0, frontY);
      ctx.rotate(deltaRad);
      ctx.strokeStyle = C.accent2;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(0, -vScale * 0.8);
      ctx.stroke();

      ctx.fillStyle = C.accent2;
      ctx.beginPath();
      ctx.moveTo(0, -vScale * 0.8);
      ctx.lineTo(-4, -vScale * 0.8 + 6);
      ctx.lineTo(4, -vScale * 0.8 + 6);
      ctx.closePath();
      ctx.fill();
      ctx.fillText("Vf", 5, -vScale * 0.8 + 5);
      ctx.restore();
    }

    ctx.restore();

    // Cotas lf / lr
    ctx.strokeStyle = C.gridLine;
    ctx.setLineDash([3, 3]);
    ctx.lineWidth = 1;
    const cosB = Math.cos(betaRad);

    ctx.beginPath();
    ctx.moveTo(cx + 30, cy);
    ctx.lineTo(cx + 30, cy - lf * SCALE * cosB);
    ctx.stroke();
    ctx.font = "12px monospace";
    ctx.fillStyle = C.accent2;
    ctx.fillText(`lf=${lf.toFixed(1)}m`, cx + 35, cy - lf * SCALE * 0.5 * cosB);

    ctx.beginPath();
    ctx.moveTo(cx + 30, cy);
    ctx.lineTo(cx + 30, cy + lr * SCALE * cosB);
    ctx.stroke();
    ctx.fillStyle = C.accent;
    ctx.fillText(`lr=${lr.toFixed(1)}m`, cx + 35, cy + lr * SCALE * 0.5 * cosB);
    ctx.setLineDash([]);

    // Parámetros
    ctx.font = "13px monospace";
    ctx.fillStyle = C.dim;
    [
      `δ (dirección): ${delta.toFixed(1)}°`,
      `β (deriva): ${beta.toFixed(1)}°`,
      `V (velocidad): ${velocity.toFixed(1)} m/s`,
      `L (entre ejes): ${L.toFixed(2)} m`,
    ].forEach((line, i) => ctx.fillText(line, 15, height - 80 + i * 20));
  };

  return (
    <div className="slide">
      <h2>Modelo de bicicleta (simplificación de 2 ruedas)</h2>

      <div className="slide-card">
        <div className="slide-card__title">Simplificación del modelo</div>
        <p>
          El <b>modelo de bicicleta</b> reduce un vehículo de 4 ruedas a uno de 2,
          combinando las ruedas izquierda y derecha de cada eje en una sola rueda
          "virtual". Captura la dinámica lateral esencial sin complicar las matemáticas.
        </p>
      </div>

      <div className="slide-card slide-mt-md">
        <div className="slide-card__title">Ecuaciones cinemáticas</div>
        <div className="slide-code">
          {`dx/dt = V·cos(ψ + β)
dy/dt = V·sin(ψ + β)
dψ/dt = (V/L)·tan(δ)

Donde:
• x, y = Posición
• ψ = Ángulo de guiñada (rumbo)
• β = Ángulo de deriva en el CG
• δ = Ángulo de dirección
• V = Velocidad
• L = Distancia entre ejes (lf + lr)`}
        </div>
      </div>

      <SimPanel
        title="Simulación interactiva"
        caption="Vista superior. El CG (dorado) está entre la rueda delantera (rosa) y la trasera (cian)."
        canvas={
          <SimCanvas
            draw={draw}
            deps={[lf, lr, delta, beta, velocity, showVelocities]}
          />
        }
        controls={
          <>
            <SimSlider label="lf (delantero)" value={lf} onChange={setLf} min={0.8} max={2.0} step={0.1} unit=" m" />
            <SimSlider label="lr (trasero)" value={lr} onChange={setLr} min={0.8} max={2.0} step={0.1} unit=" m" />
            <SimSlider label="Dirección δ" value={delta} onChange={setDelta} min={-30} max={30} step={0.5} unit="°" />
            <SimSlider label="Deriva β" value={beta} onChange={setBeta} min={-15} max={15} step={0.5} unit="°" />
            <SimSlider label="Velocidad" value={velocity} onChange={setVelocity} min={0} max={30} step={1} unit=" m/s" />

            <label className="sim-checkbox">
              <input
                type="checkbox"
                checked={showVelocities}
                onChange={(e) => setShowVelocities(e.target.checked)}
              />
              <span>Mostrar vectores de velocidad</span>
            </label>

            <div className="slide-code sim-readout">
              Distancia entre ejes L = <b>{L.toFixed(2)} m</b>
              <br />
              Velocidad de guiñada:{" "}
              <b className="sim-readout__alt">{psiDot.toFixed(3)} rad/s</b>
            </div>
          </>
        }
      />

      <div className="slide-callout slide-callout--info slide-mt-md">
        <b>Supuestos:</b> el modelo cinemático asume que los neumáticos no deslizan
        (rigidez infinita). Funciona bien a baja velocidad. Para velocidades altas hace
        falta el <b>modelo dinámico</b>, que incluye fuerzas y ángulos de deriva.
      </div>
    </div>
  );
}
