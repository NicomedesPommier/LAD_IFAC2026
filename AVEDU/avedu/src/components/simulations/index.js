// src/components/simulations/index.js
// Punto único de importación de las piezas compartidas de simulaciones:
//   import { SimCanvas, SimSlider } from "../../components/simulations";

export { default as SimCanvas } from "./SimCanvas";
export { default as SimSlider } from "./SimSlider";
export { default as SimControls } from "./SimControls";
export { default as SimPanel } from "./SimPanel";
export { default as StateVector } from "./StateVector";
export { default as useAnimationLoop } from "./useAnimationLoop";

// El navegador de pantallas es el mismo que usan los mini juegos; se
// reexporta con un nombre neutro para no importar desde "minigames" aquí.
export { default as SimulationRunner } from "../minigames/MiniGameRunner";

export * from "./vehicleMath";
export * from "./themeColors";
