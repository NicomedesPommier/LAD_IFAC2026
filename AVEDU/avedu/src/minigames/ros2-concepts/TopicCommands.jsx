// src/minigames/ros2-concepts/TopicCommands.jsx
// Mini juego: comandos de tópicos de ROS 2.
import React from "react";
import { MiniGameShell, CardPicker, useMiniGameProgress } from "../../components/minigames";

export const meta = {
  id: "topic-commands",
  title: "Comandos de tópicos de ROS 2",
  order: 1,
  objectiveCode: "ros2-minigame-commands",
};

const COMMANDS = [
  {
    command: "ros2 topic list",
    description: "Lista todos los tópicos activos en la red ROS 2",
    example: "$ ros2 topic list\n/chatter\n/parameter_events\n/rosout",
    useWhen: "Quieres ver qué tópicos hay disponibles",
  },
  {
    command: "ros2 topic echo /topic_name",
    description: "Muestra en tiempo real los mensajes publicados en un tópico",
    example: "$ ros2 topic echo /chatter\ndata: 'Hello ROS 2: 0'\n---\ndata: 'Hello ROS 2: 1'",
    useWhen: "Quieres ver qué datos se están publicando",
  },
  {
    command: "ros2 topic info /topic_name",
    description: "Muestra información del tópico (tipo, publicadores, suscriptores)",
    example: "$ ros2 topic info /chatter\nType: std_msgs/msg/String\nPublisher count: 1\nSubscription count: 1",
    useWhen: "Quieres saber quién está usando un tópico",
  },
  {
    command: "ros2 topic hz /topic_name",
    description: "Mide la frecuencia de publicación de un tópico",
    example: "$ ros2 topic hz /chatter\naverage rate: 2.000\n\tmin: 0.500s max: 0.500s",
    useWhen: "Quieres comprobar a qué velocidad llegan los mensajes",
  },
  {
    command: "ros2 topic pub /topic_name msg_type data",
    description: "Publica manualmente un mensaje en un tópico desde la terminal",
    example: "$ ros2 topic pub /chatter std_msgs/msg/String \"data: 'Hello from CLI'\"",
    useWhen: "Quieres probar un suscriptor o enviar datos de prueba",
  },
];

export default function TopicCommands({ onObjectiveHit }) {
  const progress = useMiniGameProgress({
    steps: COMMANDS.map((c) => c.command),
    onObjectiveHit,
    objectiveCode: meta.objectiveCode,
  });

  return (
    <MiniGameShell
      title={meta.title}
      description="ROS 2 trae herramientas de terminal para inspeccionar y depurar tópicos. Recorre cada comando para aprender qué hace."
      current={progress.count}
      total={progress.total}
      unitLabel="comandos"
      doneTitle="🎉 ¡Enhorabuena!"
      doneText="Has aprendido los comandos esenciales de tópicos de ROS 2."
    >
      <CardPicker
        items={COMMANDS}
        getKey={(cmd) => cmd.command}
        // Etiqueta corta: 'list', 'echo', 'info'…
        getLabel={(cmd) => cmd.command.split(" ")[2] ?? cmd.command}
        isComplete={progress.isComplete}
        onComplete={progress.complete}
        renderDetail={(cmd) => (
          <>
            <div className="slide-card__title">
              <code className="slide-text--neon">{cmd.command}</code>
            </div>

            <div className="slide-mt-md">
              <b>Qué hace:</b>
              <p className="slide-text--sm slide-muted">{cmd.description}</p>
            </div>

            <div className="slide-mt-md">
              <b>Cuándo usarlo:</b>
              <p className="slide-text--sm slide-muted">{cmd.useWhen}</p>
            </div>

            <div className="slide-mt-md">
              <b>Ejemplo de salida:</b>
              <pre className="slide-code slide-text--sm slide-mt-sm">
                <code>{cmd.example}</code>
              </pre>
            </div>

            <div className="slide-actions slide-mt-md">
              <button
                type="button"
                className="btn"
                onClick={() => navigator.clipboard?.writeText(cmd.command)}
              >
                Copiar comando
              </button>
            </div>
          </>
        )}
      />
    </MiniGameShell>
  );
}
