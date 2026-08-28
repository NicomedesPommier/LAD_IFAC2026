// src/simulations/vehicle-dynamics/AckermannSteering.jsx
// Simulación: geometría de dirección Ackermann + modelo de estado en vivo.
import React, { useCallback, useState } from "react";
import {
  SimCanvas,
  SimSlider,
  SimControls,
  SimPanel,
  StateVector,
  useAnimationLoop,
  themePalette,
  deg2rad,
  rad2deg,
  ackermannFromInner,
  stateDerivative,
  stepBicycle,
} from "../../components/simulations";

export const meta = {
  id: "vd-ackermann",
  title: "Geometría de dirección Ackermann",
  order: 3,
  objectiveCode: "vd-slide-ackermann",
};

const SCALE = 40;      // píxeles por metro
const TRAIL_MAX = 160;

export default function AckermannSteering() {
  const [innerAngle, setInnerAngle] = useState(24);
  const [wheelbase, setWheelbase] = useState(2.5);
  const [trackWidth, setTrackWidth] = useState(1.5);
  const [speed, setSpeed] = useState(2.5);
  const [playing, setPlaying] = useState(false);
  const [car, setCar] = useState({ x: 0, y: 0, heading: 0, trail: [] });

  // Geometría correcta a partir del ángulo INTERIOR.
  // R se mide desde el ICR al centro del eje trasero e incluye el término t/2.
  const geo = ackermannFromInner({
    wheelbase,
    trackWidth,
    innerRad: deg2rad(innerAngle),
  });

  // El coche se mueve con el ángulo equivalente del modelo de bicicleta, que
  // es coherente con el ICR dibujado.
  const derivative = stateDerivative({
    heading: car.heading,
    speed,
    wheelbase,
    steeringRad: geo.steeringRad,
  });

  useAnimationLoop(
    useCallback(
      (dt) => {
        setCar((prev) => {
          const next = stepBicycle({
            x: prev.x,
            y: prev.y,
            heading: prev.heading,
            speed,
            wheelbase,
            steeringRad: geo.steeringRad,
            dt,
          });
          return {
            ...next,
            trail: [...prev.trail, { x: prev.x, y: prev.y }].slice(-TRAIL_MAX),
          };
        });
      },
      [speed, wheelbase, geo.steeringRad]
    ),
    playing
  );

  const reset = () => {
    setPlaying(false);
    setCar({ x: 0, y: 0, heading: 0, trail: [] });
  };

  const draw = (ctx, { width, height }) => {
    const C = themePalette();
    const cx = width / 2;
    const cy = height / 2 + 40;
    const turning = Number.isFinite(geo.radius);
    const sign = Math.sign(innerAngle) || 1;

    const toScreen = (wx, wy) => [cx + (wx - car.x) * SCALE, cy + (wy - car.y) * SCALE];

    // ── Estela ────────────────────────────────────────────────────────────
    if (car.trail.length > 1) {
      ctx.strokeStyle = C.accentAlpha(0.35);
      ctx.lineWidth = 2;
      ctx.beginPath();
      car.trail.forEach((p, i) => {
        const [px, py] = toScreen(p.x, p.y);
        i === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py);
      });
      ctx.stroke();
    }

    // ── Geometría en el marco del coche ───────────────────────────────────
    // El coche se dibuja apuntando hacia -Y, así que "adelante" es -Y y el
    // lateral es X. El ICR está sobre la línea del eje trasero.
    const halfT = (trackWidth * SCALE) / 2;
    const halfL = (wheelbase * SCALE) / 2;
    const frontY = -halfL;
    const rearY = halfL;

    // Posición del ICR en el marco del coche: sobre el eje trasero, a R.
    const icrLocal = turning ? { x: sign * geo.radius * SCALE, y: rearY } : null;

    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(car.heading);

    if (icrLocal) {
      // Circunferencia que recorre el centro del eje trasero.
      ctx.strokeStyle = C.accentAlpha(0.25);
      ctx.setLineDash([4, 4]);
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(icrLocal.x, icrLocal.y, geo.radius * SCALE, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);

      // Radios: del ICR a cada rueda delantera y al eje trasero.
      // Ahora SÍ coinciden con la orientación dibujada de cada rueda.
      const innerX = sign * halfT;
      const outerX = -sign * halfT;

      ctx.setLineDash([5, 5]);
      ctx.lineWidth = 1.5;

      ctx.strokeStyle = C.accent2Alpha(0.75);
      ctx.beginPath();
      ctx.moveTo(icrLocal.x, icrLocal.y);
      ctx.lineTo(innerX, frontY);
      ctx.stroke();

      ctx.strokeStyle = C.accentAlpha(0.75);
      ctx.beginPath();
      ctx.moveTo(icrLocal.x, icrLocal.y);
      ctx.lineTo(outerX, frontY);
      ctx.stroke();

      // Eje trasero: la recta sobre la que siempre está el ICR.
      ctx.strokeStyle = C.gridLine;
      ctx.beginPath();
      ctx.moveTo(icrLocal.x, icrLocal.y);
      ctx.lineTo(0, rearY);
      ctx.stroke();
      ctx.setLineDash([]);
    }

    // ── Carrocería ────────────────────────────────────────────────────────
    ctx.strokeStyle = C.accent;
    ctx.lineWidth = 3;
    ctx.strokeRect(-halfT, -halfL, trackWidth * SCALE, wheelbase * SCALE);

    // Ruedas delanteras, cada una con SU ángulo.
    const drawWheel = (x, y, angle, color) => {
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(angle);
      ctx.strokeStyle = color;
      ctx.lineWidth = 5;
      ctx.beginPath();
      ctx.moveTo(0, -14);
      ctx.lineTo(0, 14);
      ctx.stroke();
      ctx.restore();
    };

    const innerX = sign * halfT;
    const outerX = -sign * halfT;
    drawWheel(innerX, frontY, geo.inner, C.accent2);
    drawWheel(outerX, frontY, geo.outer, C.accent);

    // Ruedas traseras (fijas).
    drawWheel(-halfT, rearY, 0, C.dim);
    drawWheel(halfT, rearY, 0, C.dim);

    // Morro.
    ctx.fillStyle = C.accent;
    ctx.beginPath();
    ctx.moveTo(0, -halfL - 8);
    ctx.lineTo(-7, -halfL - 18);
    ctx.lineTo(7, -halfL - 18);
    ctx.closePath();
    ctx.fill();

    // Punto ICR (dentro del marco del coche, para que no se desplace).
    if (icrLocal) {
      ctx.fillStyle = C.highlight;
      ctx.beginPath();
      ctx.arc(icrLocal.x, icrLocal.y, 7, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();

    // ── Etiqueta del ICR, sin rotar ───────────────────────────────────────
    if (icrLocal) {
      const sx = cx + icrLocal.x * Math.cos(car.heading) - icrLocal.y * Math.sin(car.heading);
      const sy = cy + icrLocal.x * Math.sin(car.heading) + icrLocal.y * Math.cos(car.heading);
      ctx.font = "bold 13px monospace";
      ctx.fillStyle = C.highlight;
      ctx.fillText("ICR", sx + 12, sy + 4);
    }

    // ── Lecturas ──────────────────────────────────────────────────────────
    ctx.font = "12px monospace";
    ctx.fillStyle = C.dim;
    ctx.fillText(`L = ${wheelbase.toFixed(2)} m    t = ${trackWidth.toFixed(2)} m`, 16, 24);

    ctx.fillStyle = C.accent2;
    ctx.fillText(`δi (interior) = ${Math.abs(innerAngle).toFixed(1)}°`, 16, 46);
    ctx.fillStyle = C.accent;
    ctx.fillText(`δo (exterior) = ${Math.abs(rad2deg(geo.outer)).toFixed(1)}°`, 16, 64);
    ctx.fillStyle = C.highlight;
    ctx.fillText(
      turning ? `R = ${geo.radius.toFixed(2)} m` : "Marcha recta (R → ∞)",
      16,
      82
    );
  };

  const turning = Number.isFinite(geo.radius);

  return (
    <div className="slide">
      <h2>{meta.title}</h2>

      <div className="slide-card">
        <div className="slide-card__title">¿Por qué Ackermann?</div>
        <p>
          En una curva la <b>rueda interior</b> recorre un radio más cerrado que la{" "}
          <b>exterior</b>. Si ambas girasen el mismo ángulo, pelearían entre sí y el
          neumático arrastraría. La <b>geometría Ackermann</b> hace que los ejes de
          las dos ruedas delanteras se corten en un <b>único ICR</b>: por eso las dos
          líneas discontinuas terminan exactamente en el mismo punto.
        </p>
      </div>

      <SimPanel
        title="Simulación interactiva"
        caption="Las líneas discontinuas son los radios desde el ICR a cada rueda. Si la geometría es correcta, cortan cada rueda justo en la perpendicular a su plano de rodadura."
        canvas={<SimCanvas draw={draw} deps={[car, wheelbase, trackWidth, innerAngle, speed]} />}
        controls={
          <>
            <SimSlider
              label="Ángulo interior δi"
              value={innerAngle}
              onChange={setInnerAngle}
              min={-35}
              max={35}
              step={0.5}
              unit="°"
            />
            <SimSlider
              label="Distancia entre ejes L"
              value={wheelbase}
              onChange={setWheelbase}
              min={2.0}
              max={4.0}
              step={0.1}
              unit=" m"
            />
            <SimSlider
              label="Ancho de vía t"
              value={trackWidth}
              onChange={setTrackWidth}
              min={1.2}
              max={2.0}
              step={0.1}
              unit=" m"
            />
            <SimSlider
              label="Velocidad V"
              value={speed}
              onChange={setSpeed}
              min={0}
              max={10}
              step={0.5}
              unit=" m/s"
            />

            <div className="slide-code sim-readout">
              δo calculado = <b>{Math.abs(rad2deg(geo.outer)).toFixed(2)}°</b>
              <br />
              Diferencia δi − δo ={" "}
              <b className="sim-readout__alt">
                {Math.abs(Math.abs(innerAngle) - Math.abs(rad2deg(geo.outer))).toFixed(2)}°
              </b>
              <br />
              R (al eje trasero) ={" "}
              <b>{turning ? `${geo.radius.toFixed(2)} m` : "∞"}</b>
            </div>

            <SimControls
              playing={playing}
              onTogglePlay={() => setPlaying((p) => !p)}
              onReset={reset}
              tip="mueve δi mientras conduces: el ICR se desplaza y las dos ruedas se reorientan a la vez."
            />
          </>
        }
      >
        <StateVector
          title="Modelo de estado ẋ = f(x, u)"
          caption="Estos son los mismos números que están moviendo el coche: la fila se ilumina cuando ese estado cambia."
          rows={[
            { key: "x", symbol: "x", value: car.x, unit: "m", equation: "posición" },
            { key: "y", symbol: "y", value: car.y, unit: "m", equation: "posición" },
            {
              key: "psi",
              symbol: "ψ",
              value: rad2deg(car.heading) % 360,
              unit: "°",
              equation: "rumbo",
            },
            {
              key: "xdot",
              symbol: "ẋ",
              value: derivative.xDot,
              unit: "m/s",
              equation: "= V·cos(ψ)",
            },
            {
              key: "ydot",
              symbol: "ẏ",
              value: derivative.yDot,
              unit: "m/s",
              equation: "= V·sin(ψ)",
            },
            {
              key: "psidot",
              symbol: "ψ̇",
              value: derivative.psiDot,
              unit: "rad/s",
              equation: "= (V/L)·tan(δ)",
              accent: "accent2",
            },
          ]}
        />
      </SimPanel>

      <div className="slide-card slide-mt-md">
        <div className="slide-card__title">La fórmula</div>
        <div className="slide-code">
          {`cot(δo) − cot(δi) = t / L

tan(δi) = L / (R − t/2)      ← rueda interior
tan(δo) = L / (R + t/2)      ← rueda exterior

R = L / tan(δi) + t/2        ← radio al centro del eje trasero

Donde:
• δi = ángulo de la rueda interior
• δo = ángulo de la rueda exterior
• L  = distancia entre ejes
• t  = ancho de vía
• R  = radio de giro`}
        </div>
      </div>

      <div className="slide-callout slide-callout--info slide-mt-md">
        <b>Ojo con el término t/2:</b> el radio de giro se mide desde el ICR hasta el{" "}
        <b>centro del eje trasero</b>, no hasta la rueda interior. Si se usa
        R = L/tan(δi) a secas, el ICR queda medio ancho de vía demasiado cerca y los
        ejes de las ruedas ya no se cortan en él.
      </div>

      <div className="slide-callout slide-callout--warn slide-mt-md">
        <b>En el mundo real:</b> casi ningún coche implementa Ackermann perfecto.
        Funciona muy bien a baja velocidad; a alta velocidad los ángulos de deriva
        pesan más y se usa Ackermann parcial (o incluso anti-Ackermann en competición).
      </div>
    </div>
  );
}
