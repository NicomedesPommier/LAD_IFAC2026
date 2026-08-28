# Simulaciones en diapositiva

Simulaciones interactivas de las lecciones, **agrupadas por tema**. El nombre
de la carpeta y el del archivo dicen de qué van: nada de `simulation1`,
`simulation2`…

```
src/simulations/
├── index.js
└── vehicle-dynamics/                     ← el tema
    ├── index.jsx                         ← ORQUESTADOR: declara la lista
    ├── InstantaneousCenterRotation.jsx   ← ICR
    └── BicycleModel.jsx                  ← modelo de bicicleta
```

El orquestador es `index.jsx`, así que se importa por carpeta:

```js
import VehicleDynamicsSimulations from "../simulations/vehicle-dynamics";
```

Piezas reutilizables en `src/components/simulations/`:

| Pieza | Para qué sirve |
|---|---|
| `SimCanvas` | Lienzo 2D: crea el ref, limpia el fondo y redibuja. Solo aportas `draw(ctx, size)`. |
| `SimSlider` | Deslizador con etiqueta y valor. |
| `SimControls` | Botones de Play/Pausa y Reiniciar. |
| `SimPanel` | Marco: lienzo + controles, al lado (`side`) o apilados (`stacked`). |
| `useAnimationLoop` | Bucle rAF con delta de tiempo y limpieza automática. |
| `vehicleMath` | `turningRadius`, `icrPosition`, `stepBicycle`, `ackermannAngles`, `yawRate`… |

## Cómo llegan al mazo de diapositivas

`VehicleDynamics.jsx` descubre las diapositivas con `require.context` sobre
`src/levels/slidesVehicleDynamics/`, **ordenadas por el número del archivo**.
Por eso ahí queda un archivo de dos líneas que reexporta el código real:

```js
// src/levels/slidesVehicleDynamics/02-InstantaneousCenterRotation.jsx
export { default, meta } from "../../simulations/vehicle-dynamics/InstantaneousCenterRotation";
```

Si mueves una simulación, actualiza ese reexport. Y mantén `meta.order` igual
al número del archivo (`02-` → `order: 2`) para no tener dos numeraciones.

## Añadir una simulación

Crea el archivo con el nombre de lo que enseña, p. ej. `SlipAngles.jsx`:

```jsx
import React, { useState } from "react";
import "../../styles/pages/_slides.scss";
import "../../styles/components/_simulations.scss";
import { SimCanvas, SimSlider, SimPanel, themePalette } from "../../components/simulations";

export const meta = { id: "vd-slip", title: "Ángulos de deriva", order: 5 };

export default function SlipAngles() {
  const [angulo, setAngulo] = useState(0);

  const draw = (ctx, { width, height }) => {
    // Colores del tema: nunca hex a mano, o el modo claro se rompe.
    const C = themePalette();
    ctx.strokeStyle = C.accent;
    ctx.strokeRect(width / 2 - 20, height / 2 - 20, 40, 40);
  };

  return (
    <SimPanel
      title="Ángulos de deriva"
      canvas={<SimCanvas draw={draw} deps={[angulo]} />}
      controls={
        <SimSlider label="Ángulo" value={angulo} onChange={setAngulo}
                   min={-30} max={30} step={1} unit="°" />
      }
    />
  );
}
```

**Importante:** lo que cambie el dibujo debe ir en `deps` de `SimCanvas`,
igual que en un `useEffect`.

Después regístrala en el array `SIMULATIONS` de `vehicle-dynamics/index.jsx`.

## Matemáticas compartidas

No reescribas `R = L / tan(δ)` en cada slide. Está en `vehicleMath.js`:

```js
import { icrPosition, stepBicycle, deg2rad } from "../../components/simulations";

const icr = icrPosition({ carX, carY, heading, wheelbase, steeringRad: deg2rad(delta) });
// icr === null  -> marcha recta (ICR en el infinito)
// icr.radius    -> radio de giro
```
