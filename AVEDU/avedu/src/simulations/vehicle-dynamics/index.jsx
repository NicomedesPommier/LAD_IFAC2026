// src/simulations/vehicle-dynamics/index.jsx
// ORQUESTADOR de las simulaciones de dinámica del vehículo.
//
// Solo declara QUÉ simulaciones hay y en qué orden. La navegación vive en
// SimulationRunner, que ya resuelve flechas, puntos de progreso y botones.
import React, { lazy } from "react";
import { SimulationRunner } from "../../components/simulations";

const InstantaneousCenterRotation = lazy(() => import("./InstantaneousCenterRotation"));
const AckermannSteering = lazy(() => import("./AckermannSteering"));
const BicycleModel = lazy(() => import("./BicycleModel"));

// `order` coincide con la posición de la diapositiva en el mazo de Vehicle
// Dynamics (02-…, 04-…), para que no haya dos numeraciones distintas.
export const SIMULATIONS = [
  {
    id: "vd-icr",
    title: "Centro Instantáneo de Rotación (ICR)",
    order: 2,
    objectiveCode: "vd-slide-icr",
    Component: InstantaneousCenterRotation,
  },
  {
    id: "vd-ackermann",
    title: "Geometría de dirección Ackermann",
    order: 3,
    objectiveCode: "vd-slide-ackermann",
    Component: AckermannSteering,
  },
  {
    id: "vd-bicycle",
    title: "Modelo de bicicleta",
    order: 4,
    objectiveCode: "vd-slide-bicycle",
    Component: BicycleModel,
  },
];

export default function VehicleDynamicsSimulations({ onObjectiveHit, onLevelCompleted }) {
  return (
    <SimulationRunner
      games={SIMULATIONS}
      onObjectiveHit={onObjectiveHit}
      onLevelCompleted={onLevelCompleted}
    />
  );
}
