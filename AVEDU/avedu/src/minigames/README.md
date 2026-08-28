# Mini juegos

Todos los mini juegos viven aquí, **agrupados por tema**. El nombre de la
carpeta y el del archivo dicen de qué van: nada de `minigame1`, `minigame2`…

```
src/minigames/
├── index.js
└── ros2-concepts/            ← el tema
    ├── index.jsx             ← ORQUESTADOR: declara la lista
    ├── TopicCommands.jsx     ← comandos de tópicos
    └── ConceptsMatch.jsx     ← relacionar conceptos
```

El orquestador es `index.jsx`, así que se importa por carpeta:

```js
import Ros2ConceptsMiniGames from "../minigames/ros2-concepts";
```

Piezas reutilizables en `src/components/minigames/`:

| Pieza | Para qué sirve |
|---|---|
| `MiniGameRunner` | Navegación entre juegos (flechas, puntos, botones). |
| `MiniGameShell` | Marco de un juego: título, progreso y bloque de "completado". |
| `CardPicker` | Lista de opciones + panel de detalle. |
| `useMiniGameProgress` | Progreso y aviso único de objetivo cumplido. |
| `DragDropQuiz` | Quiz de arrastrar y soltar (reexportado de `components/games`). |

## Añadir un mini juego

Crea el archivo con el nombre de lo que enseña, p. ej.
`src/minigames/ros2-concepts/LaunchFiles.jsx`:

```jsx
import React from "react";
import { MiniGameShell, useMiniGameProgress } from "../../components/minigames";

export const meta = {
  id: "launch-files",
  title: "Archivos launch",
  order: 4,
  objectiveCode: "ros2-minigame-launch-files",
};

export default function LaunchFiles({ onObjectiveHit }) {
  const progress = useMiniGameProgress({
    steps: ["paso-1", "paso-2"],
    onObjectiveHit,
    objectiveCode: meta.objectiveCode,
  });

  return (
    <MiniGameShell title={meta.title} current={progress.count} total={progress.total}>
      <button className="btn" onClick={() => progress.complete("paso-1")}>
        Completar paso 1
      </button>
    </MiniGameShell>
  );
}
```

Después regístralo en el array `GAMES` de `ros2-concepts/index.jsx`.

`onObjectiveHit` se dispara **una sola vez**, al completarse todos los pasos.

## Añadir un tema nuevo

1. Crea `src/minigames/<tema>/index.jsx` (orquestador) con sus juegos al lado.
   Usa un nombre descriptivo: `perception`, `navigation`, `safety`…
2. Expórtalo en `src/minigames/index.js`.
3. Regístralo en `REGISTRY` de `src/pages/LearnLevel.jsx` con el slug del nivel.
