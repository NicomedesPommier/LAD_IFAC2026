// src/minigames/ros2-concepts/index.jsx
// ORQUESTADOR de los mini juegos de conceptos de ROS 2.
//
// Este archivo solo declara QUÉ mini juegos hay y en qué orden.
// Toda la navegación (flechas, puntos, botones) vive en MiniGameRunner.
import React, { lazy } from "react";
import { MiniGameRunner } from "../../components/minigames";

// Cada mini juego se carga bajo demanda: el nivel no paga el coste de
// ReactFlow hasta que el alumno llega a esa pantalla.
const TopicCommands = lazy(() => import("./TopicCommands"));
const ConnectTheFlow = lazy(() => import("../../levels/slidesROS2Concepts/09-ConnectTheFlowGame"));
const ConceptsMatch = lazy(() => import("./ConceptsMatch"));

export const GAMES = [
  {
    id: "topic-commands",
    title: "Comandos de tópicos de ROS 2",
    order: 1,
    objectiveCode: "ros2-minigame-commands",
    Component: TopicCommands,
  },
  {
    id: "connect-flow-game",
    title: "Mini juego: conecta el flujo de comunicación",
    order: 2,
    objectiveCode: "ros2-minigame-connect-flow",
    Component: ConnectTheFlow,
  },
  {
    id: "ros2-concepts-match",
    title: "Mini juego: relaciona los conceptos de ROS 2",
    order: 3,
    objectiveCode: "ros2-minigame-concepts-match",
    Component: ConceptsMatch,
  },
];

export default function Ros2ConceptsMiniGames({ onObjectiveHit, onLevelCompleted }) {
  return (
    <MiniGameRunner
      games={GAMES}
      onObjectiveHit={onObjectiveHit}
      onLevelCompleted={onLevelCompleted}
    />
  );
}
