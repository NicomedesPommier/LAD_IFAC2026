// src/minigames/ros2-concepts/ConceptsMatch.jsx
// Mini juego: relacionar cada concepto de ROS 2 con su definición.
import React from "react";
import { MiniGameShell, DragDropQuiz, useMiniGameProgress } from "../../components/minigames";

export const meta = {
  id: "ros2-concepts-match",
  title: "Mini juego: relaciona los conceptos de ROS 2",
  order: 3,
  objectiveCode: "ros2-minigame-concepts-match",
};

const ITEMS = [
  { id: "node", content: "Node" },
  { id: "topic", content: "Topic" },
  { id: "publisher", content: "Publisher" },
  { id: "subscriber", content: "Subscriber" },
];

const TARGETS = [
  {
    id: "t-node",
    label: "Proceso que ejecuta una tarea concreta del robot",
    expectedItemId: "node",
  },
  {
    id: "t-topic",
    label: "Canal con nombre por el que viajan los mensajes",
    expectedItemId: "topic",
  },
  {
    id: "t-publisher",
    label: "Envía mensajes a un canal",
    expectedItemId: "publisher",
  },
  {
    id: "t-subscriber",
    label: "Recibe los mensajes de un canal",
    expectedItemId: "subscriber",
  },
];

export default function ConceptsMatch({ onObjectiveHit }) {
  const progress = useMiniGameProgress({
    steps: ["match"],
    onObjectiveHit,
    objectiveCode: meta.objectiveCode,
  });

  return (
    <MiniGameShell
      title={meta.title}
      description="Arrastra cada concepto hasta la definición que le corresponde."
      done={progress.done}
      doneTitle="🎉 ¡Perfecto!"
      doneText="Has relacionado correctamente todos los conceptos de ROS 2."
    >
      <DragDropQuiz
        title="Conceptos de ROS 2"
        description="Coloca cada término junto a su definición."
        items={ITEMS}
        targets={TARGETS}
        onComplete={() => progress.complete("match")}
      />
    </MiniGameShell>
  );
}
