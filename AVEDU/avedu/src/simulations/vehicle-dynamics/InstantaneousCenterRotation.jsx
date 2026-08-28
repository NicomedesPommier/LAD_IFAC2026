// src/simulations/vehicle-dynamics/InstantaneousCenterRotation.jsx
// Simulación: Centro Instantáneo de Rotación (ICR).
import React, { useCallback, useState } from "react";
import {
  SimCanvas,
  SimSlider,
  SimControls,
  SimPanel,
  useAnimationLoop,
  deg2rad,
  rad2deg,
  icrPosition,
  stepBicycle,
  themePalette,
} from "../../components/simulations";

export const meta = {
  id: "vd-icr",
  title: "Centro Instantáneo de Rotación (ICR)",
  order: 2,
  objectiveCode: "vd-slide-icr",
};

const SPEED = 2.5;      // m/s
const SCALE = 30;       // píxeles por metro
const TRAIL_MAX = 100;  // puntos guardados de la estela

/** Dibuja el coche visto desde arriba, centrado en (0,0) y ya rotado. */
function drawCar(ctx, { wheelbase, trackWidth, steerRad, C }) {
  const halfW = (trackWidth * SCALE) / 2;
  const halfL = (wheelbase * SCALE) / 2;

  // Carrocería
  ctx.strokeStyle = C.accent;
  ctx.lineWidth = 3;
  ctx.strokeRect(-halfW, -halfL, trackWidth * SCALE, wheelbase * SCALE);

  // Ruedas delanteras (giran con la dirección)
  ctx.strokeStyle = C.accent2;
  ctx.lineWidth = 4;
  [-halfW, halfW].forEach((x) => {
    ctx.save();
    ctx.translate(x, -halfL);
    ctx.rotate(steerRad);
    ctx.beginPath();
    ctx.moveTo(0, -15);
    ctx.lineTo(0, 15);
    ctx.stroke();
    ctx.restore();
  });

  // Ruedas traseras (fijas)
  ctx.strokeStyle = C.dim;
  [-halfW - 10, halfW + 10].forEach((x) => {
    ctx.beginPath();
    ctx.moveTo(x, halfL - 15);
    ctx.lineTo(x, halfL + 15);
    ctx.stroke();
  });

  // Indicador de morro
  ctx.fillStyle = C.accent;
  ctx.beginPath();
  ctx.moveTo(0, -halfL - 10);
  ctx.lineTo(-8, -halfL - 20);
  ctx.lineTo(8, -halfL - 20);
  ctx.closePath();
  ctx.fill();
}

export default function InstantaneousCenterRotation() {
  const [steeringAngle, setSteeringAngle] = useState(0);
  const [wheelbase, setWheelbase] = useState(2.7);
  const [trackWidth, setTrackWidth] = useState(1.5);
  const [playing, setPlaying] = useState(false);

  // Un único objeto de estado: antes eran cuatro useState anidados y la
  // estela leía posiciones ya caducadas.
  const [car, setCar] = useState({ x: 0, y: 0, heading: 0, trail: [] });

  const steerRad = deg2rad(steeringAngle);

  useAnimationLoop(
    useCallback(
      (dt) => {
        setCar((prev) => {
          const next = stepBicycle({
            x: prev.x,
            y: prev.y,
            heading: prev.heading,
            speed: SPEED,
            wheelbase,
            steeringRad: deg2rad(steeringAngle),
            dt,
          });
          return {
            ...next,
            trail: [...prev.trail, { x: prev.x, y: prev.y }].slice(-TRAIL_MAX),
          };
        });
      },
      [wheelbase, steeringAngle]
    ),
    playing
  );

  const reset = () => {
    setPlaying(false);
    setCar({ x: 0, y: 0, heading: 0, trail: [] });
  };

  const icr = icrPosition({
    carX: car.x,
    carY: car.y,
    heading: car.heading,
    wheelbase,
    steeringRad: steerRad,
  });

  const draw = (ctx, { width, height }) => {
    const C = themePalette();
    const cx = width / 2;
    const cy = height / 2 + 50;

    // La cámara sigue al coche: todo se dibuja relativo a su posición.
    const toScreen = (wx, wy) => [cx + (wx - car.x) * SCALE, cy + (wy - car.y) * SCALE];

    // Estela recorrida
    if (car.trail.length > 1) {
      ctx.strokeStyle = C.accentAlpha(0.4);
      ctx.lineWidth = 2;
      ctx.beginPath();
      car.trail.forEach((p, i) => {
        const [px, py] = toScreen(p.x, p.y);
        i === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py);
      });
      ctx.stroke();
    }

    if (icr) {
      const [ix, iy] = toScreen(icr.x, icr.y);

      // Solo pintamos el ICR si cae razonablemente cerca del lienzo.
      if (Math.abs(ix - cx) < width * 2) {
        ctx.fillStyle = C.accent2;
        ctx.beginPath();
        ctx.arc(ix, iy, 8, 0, Math.PI * 2);
        ctx.fill();

        ctx.font = "14px monospace";
        ctx.fillText("ICR", ix + 15, iy - 10);

        // Radio: del eje trasero al ICR
        const rearX = car.x - (wheelbase / 2) * Math.cos(car.heading);
        const rearY = car.y - (wheelbase / 2) * Math.sin(car.heading);
        const [rx, ry] = toScreen(rearX, rearY);

        ctx.strokeStyle = C.accent2Alpha(0.5);
        ctx.lineWidth = 2;
        ctx.setLineDash([5, 5]);
        ctx.beginPath();
        ctx.moveTo(rx, ry);
        ctx.lineTo(ix, iy);
        ctx.stroke();
        ctx.setLineDash([]);

        // Circunferencia de giro
        ctx.strokeStyle = C.accentAlpha(0.3);
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(ix, iy, icr.radius * SCALE, 0, Math.PI * 2);
        ctx.stroke();
      }

      ctx.font = "12px monospace";
      ctx.fillStyle = C.accent;
      ctx.fillText(`R = ${icr.radius.toFixed(2)} m`, 20, height - 20);
    } else {
      ctx.font = "14px monospace";
      ctx.fillStyle = C.dim;
      ctx.fillText("Marcha recta (ICR en el infinito)", cx - 120, height - 20);
    }

    // Coche
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(car.heading);
    drawCar(ctx, { wheelbase, trackWidth, steerRad, C });
    ctx.restore();

    ctx.font = "12px monospace";
    ctx.fillStyle = C.dim;
    ctx.fillText(`Posición: (${car.x.toFixed(1)}, ${car.y.toFixed(1)})`, 20, 30);
    ctx.fillText(`Rumbo: ${(rad2deg(car.heading) % 360).toFixed(1)}°`, 20, 50);
  };

  return (
    <div className="slide">
      <h2>{meta.title}</h2>

      <div className="slide-card">
        <div className="slide-card__title">Concepto</div>
        <p>
          El <b>Centro Instantáneo de Rotación (ICR)</b> es el punto alrededor del cual
          el vehículo parece girar en un instante dado. Con dirección en las ruedas
          delanteras, el ICR está sobre la prolongación del eje trasero.
        </p>
      </div>

      <div className="slide-card slide-mt-md">
        <div className="slide-card__title">Fórmula clave</div>
        <div className="slide-code">
          R = L / tan(δ)
          <br /><br />
          Donde:
          <br />• R = Radio de giro
          <br />• L = Distancia entre ejes
          <br />• δ = Ángulo de dirección
        </div>
      </div>

      <SimPanel
        title="Simulación interactiva"
        layout="stacked"
        caption="El punto rosa es el ICR y el círculo cian el radio de giro. La estela azul marca el camino recorrido."
        canvas={
          <SimCanvas
            draw={draw}
            deps={[car, wheelbase, trackWidth, steeringAngle]}
          />
        }
        controls={
          <>
            <SimSlider
              label="Dirección"
              value={steeringAngle}
              onChange={setSteeringAngle}
              min={-30}
              max={30}
              step={1}
              unit="°"
            />
            <SimSlider
              label="Distancia entre ejes"
              value={wheelbase}
              onChange={setWheelbase}
              min={2.0}
              max={4.0}
              step={0.1}
              unit=" m"
            />
            <SimSlider
              label="Ancho de vía"
              value={trackWidth}
              onChange={setTrackWidth}
              min={1.2}
              max={2.0}
              step={0.1}
              unit=" m"
            />
            <SimControls
              playing={playing}
              onTogglePlay={() => setPlaying((p) => !p)}
              onReset={reset}
              tip="cambia el ángulo de dirección mientras conduces para ver cómo se desplaza el ICR."
            />
          </>
        }
      />

      <div className="slide-callout slide-callout--info slide-mt-md">
        <b>Idea clave:</b> con el volante recto el ICR está en el infinito. Al aumentar
        el ángulo de dirección, el radio de giro disminuye y el ICR se acerca al vehículo.
      </div>
    </div>
  );
}
