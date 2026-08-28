// src/components/minigames/index.js
// Punto único de importación de las piezas compartidas de mini juegos:
//   import { MiniGameShell, useMiniGameProgress } from "../../components/minigames";

export { default as MiniGameRunner } from "./MiniGameRunner";
export { default as MiniGameShell } from "./MiniGameShell";
export { default as CardPicker } from "./CardPicker";
export { default as useMiniGameProgress } from "./useMiniGameProgress";

// Reutilizamos el quiz existente para no duplicarlo.
export { default as DragDropQuiz } from "../games/DragDropQuiz";
