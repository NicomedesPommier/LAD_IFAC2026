// components/ide/Terminal.jsx
//
// WebSocket PTY terminal — connects to Django Channels TerminalConsumer which
// spawns a real `docker exec -it` bash session.  xterm.js handles all
// rendering; keystrokes go to the PTY over the WebSocket, output comes back.
//
// Falls back to the HTTP-based command runner when no canvasId is given.

import React, { useEffect, useRef, useCallback } from "react";
import PropTypes from "prop-types";
import "./Terminal.scss";
import { USE_INGRESS, INGRESS_BASE } from "../../config";

import { Terminal as XTerm } from "@xterm/xterm";
import { FitAddon } from "@xterm/addon-fit";
import { WebLinksAddon } from "@xterm/addon-web-links";
import "@xterm/xterm/css/xterm.css";

// ── Helpers ────────────────────────────────────────────────────────────────────

function buildWsUrl(canvasId) {
  const token = localStorage.getItem("token") || "";
  const proto = window.location.protocol === "https:" ? "wss" : "ws";
  if (USE_INGRESS) {
    // Same-origin through the reverse proxy: the JWT rides over wss and no
    // extra port (8000) has to be exposed on the public tunnel.
    return `${proto}://${window.location.host}${INGRESS_BASE}/ws/terminal/${canvasId}/?token=${encodeURIComponent(token)}`;
  }
  // Local dev: connect directly to the Django/Daphne server on :8000 rather
  // than through the CRA dev proxy (WS proxying is unreliable in CRA dev mode).
  const host = window.location.hostname; // e.g. "localhost" or "192.168.x.x"
  const port = 8000;
  return `${proto}://${host}:${port}/ws/terminal/${canvasId}/?token=${encodeURIComponent(token)}`;
}

function isUuid(str) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str);
}

// ── Component ──────────────────────────────────────────────────────────────────

export function Terminal({
  onCommandExecute,
  workingDirectory = "/workspaces",
  username = "user",
  canvasId = "workspace",
  isActive = true,
}) {
  const terminalRef = useRef(null);
  const xtermRef   = useRef(null);
  const fitAddonRef = useRef(null);

  // HTTP-mode state (used only when no WebSocket)
  const currentLineRef   = useRef("");
  const historyRef       = useRef([]);
  const historyIndexRef  = useRef(-1);
  const runningProcessRef = useRef(null);
  const isExecutingRef   = useRef(false);

  // WebSocket refs
  const wsRef            = useRef(null);
  const wsConnectedRef   = useRef(false);
  const reconnectTimerRef = useRef(null);
  const heartbeatTimerRef = useRef(null);
  const lastPongRef       = useRef(0);
  const pongSupportedRef  = useRef(false);

  const useWs = isUuid(canvasId);

  // ── xterm initialisation ───────────────────────────────────────────────────

  useEffect(() => {
    if (!terminalRef.current) return;

    const term = new XTerm({
      cursorBlink: true,
      cursorStyle: "block",
      fontFamily: '"Cascadia Code", "Fira Code", Consolas, monospace',
      fontSize: 14,
      lineHeight: 1.4,
      theme: {
        background: "#0b1020",
        foreground: "#e6f1ff",
        cursor: "#7df9ff",
        cursorAccent: "#0b1020",
        selection: "rgba(125, 249, 255, 0.3)",
        black: "#1a1f2e",
        red: "#ff5c5c",
        green: "#7df9ff",
        yellow: "#ffcd1c",
        blue: "#5c9cff",
        magenta: "#ff5cf4",
        cyan: "#7df9ff",
        white: "#e6f1ff",
        brightBlack: "#475569",
        brightRed: "#ff8080",
        brightGreen: "#a0f7ff",
        brightYellow: "#ffd74d",
        brightBlue: "#80b3ff",
        brightMagenta: "#ff8cff",
        brightCyan: "#a0f7ff",
        brightWhite: "#ffffff",
      },
      allowTransparency: true,
      scrollback: 1000,
    });

    const fitAddon = new FitAddon();
    term.loadAddon(fitAddon);
    term.loadAddon(new WebLinksAddon());
    term.open(terminalRef.current);

    xtermRef.current   = term;
    fitAddonRef.current = fitAddon;

    setTimeout(() => { try { fitAddon.fit(); } catch {} }, 100);

    // Resize → send dimensions to backend
    const resizeObserver = new ResizeObserver(() => {
      try { fitAddon.fit(); } catch {}
      if (wsConnectedRef.current && wsRef.current) {
        wsRef.current.send(JSON.stringify({
          type: "resize",
          cols: term.cols,
          rows: term.rows,
        }));
      }
    });
    resizeObserver.observe(terminalRef.current);

    if (useWs) {
      // WebSocket PTY mode ─────────────────────────────────────────────────
      term.writeln("\x1b[1;36m╔═══════════════════════════════════════════╗\x1b[0m");
      term.writeln("\x1b[1;36m║\x1b[0m  \x1b[1;35mROS2 Terminal\x1b[0m  (Docker PTY)           \x1b[1;36m║\x1b[0m");
      term.writeln("\x1b[1;36m╚═══════════════════════════════════════════╝\x1b[0m");
      term.writeln("\x1b[90mConnecting to Docker container…\x1b[0m");

      // All keystrokes → WebSocket as binary. If the socket has silently died,
      // reconnect instead of dropping the keystroke (avoids the "looks
      // connected but can't type" freeze).
      term.onData((data) => {
        const sock = wsRef.current;
        if (wsConnectedRef.current && sock?.readyState === WebSocket.OPEN) {
          sock.send(new TextEncoder().encode(data));
        } else if ((!sock || sock.readyState >= WebSocket.CLOSING) && !reconnectTimerRef.current) {
          term.writeln("\r\n\x1b[33mReconnecting…\x1b[0m");
          connectWs(xtermRef.current, fitAddonRef.current);
        }
      });

      // Initial connection + auto-reconnect
      connectWs(term, fitAddon);

    } else {
      // HTTP fallback mode ─────────────────────────────────────────────────
      term.writeln("\x1b[1;36m╔═══════════════════════════════════════════╗\x1b[0m");
      term.writeln("\x1b[1;36m║\x1b[0m  \x1b[1;35mROS Visual IDE Terminal\x1b[0m                \x1b[1;36m║\x1b[0m");
      term.writeln("\x1b[1;36m╚═══════════════════════════════════════════╝\x1b[0m");
      term.writeln(`\x1b[90mWorking directory: ${workingDirectory}/${username}/${canvasId}\x1b[0m`);
      term.writeln(`\x1b[90mType 'help' for available commands\x1b[0m`);
      term.writeln("");
      writePrompt(term);

      term.onData((data) => handleTerminalInput(data, term));
    }

    return () => {
      resizeObserver.disconnect();
      clearTimeout(reconnectTimerRef.current);
      if (heartbeatTimerRef.current) clearInterval(heartbeatTimerRef.current);
      if (wsRef.current) {
        wsRef.current.onclose = null; // suppress reconnect on unmount
        wsRef.current.close();
        wsRef.current = null;
      }
      term.dispose();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canvasId]);

  // ── WebSocket connect / reconnect ──────────────────────────────────────────

  const connectWs = useCallback((term, fitAddon) => {
    const url = buildWsUrl(canvasId);
    const ws  = new WebSocket(url);
    ws.binaryType = "arraybuffer";
    wsRef.current = ws;

    ws.onopen = () => {
      wsConnectedRef.current = true;
      lastPongRef.current = Date.now();
      term.write("\r\x1b[2K"); // clear "connecting…" line
      // Send current terminal size
      ws.send(JSON.stringify({ type: "resize", cols: term.cols, rows: term.rows }));

      // Heartbeat: some networks/proxies silently drop idle WebSockets, leaving
      // them "half-open" (readyState OPEN but dead) — the classic "connected but
      // can't type" freeze. Ping periodically; once the server has proven it
      // pongs, close the socket if pongs stop so onclose triggers a reconnect.
      if (heartbeatTimerRef.current) clearInterval(heartbeatTimerRef.current);
      heartbeatTimerRef.current = setInterval(() => {
        const sock = wsRef.current;
        if (!sock || sock.readyState !== WebSocket.OPEN) return;
        if (pongSupportedRef.current && Date.now() - lastPongRef.current > 30000) {
          try { sock.close(); } catch {} // → onclose → reconnect
          return;
        }
        try { sock.send(JSON.stringify({ type: "ping" })); } catch {}
      }, 12000);
    };

    ws.onmessage = (event) => {
      if (event.data instanceof ArrayBuffer) {
        term.write(new Uint8Array(event.data));
        return;
      }
      // Text frame: a heartbeat pong, or a server status message.
      const text = String(event.data);
      if (text.indexOf('"type":"pong"') !== -1) {
        pongSupportedRef.current = true;
        lastPongRef.current = Date.now();
        return; // don't render heartbeat frames
      }
      term.write(text);
    };

    ws.onerror = () => {
      wsConnectedRef.current = false;
      term.writeln("\r\n\x1b[31mWebSocket error — check Django server & Docker container\x1b[0m");
    };

    ws.onclose = (e) => {
      wsConnectedRef.current = false;
      if (heartbeatTimerRef.current) { clearInterval(heartbeatTimerRef.current); heartbeatTimerRef.current = null; }
      // 4001 = auth failed, 4002 = docker error, 4003 = canvas not found
      // Don't reconnect on permanent errors
      if (e.code === 4001 || e.code === 4002 || e.code === 4003) {
        return;
      }
      term.writeln("\r\n\x1b[33mConnection closed. Reconnecting in 3 s…\x1b[0m");
      reconnectTimerRef.current = setTimeout(() => {
        reconnectTimerRef.current = null;
        if (xtermRef.current && fitAddonRef.current) {
          connectWs(xtermRef.current, fitAddonRef.current);
        }
      }, 3000);
    };
  }, [canvasId]);

  // Refocus + refit when this tab becomes active so the user can type right
  // away (xterm doesn't auto-focus after being hidden via display:none).
  useEffect(() => {
    if (!isActive || !useWs) return undefined;
    const t = setTimeout(() => {
      try { fitAddonRef.current?.fit(); } catch {}
      try { xtermRef.current?.focus(); } catch {}
      const sock = wsRef.current;
      const term = xtermRef.current;
      if (sock?.readyState === WebSocket.OPEN && term) {
        sock.send(JSON.stringify({ type: "resize", cols: term.cols, rows: term.rows }));
      }
    }, 100);
    return () => clearTimeout(t);
  }, [isActive, useWs]);

  // ── HTTP mode helpers (unchanged) ──────────────────────────────────────────

  const writePrompt = useCallback((term) => {
    term.write(`\r\n\x1b[1;32m${username}@ros\x1b[0m:\x1b[1;34m~/${canvasId}\x1b[0m$ `);
  }, [username, canvasId]);

  const clearCurrentLine = (term, length) => {
    for (let i = 0; i < length; i++) term.write("\b \b");
  };

  const isLongRunningCommand = (command) => {
    const patterns = [
      /^ros2\s+run\s+/,
      /^ros2\s+topic\s+echo\s+/,
      /^ros2\s+bag\s+play\s+/,
      /^python3?\s+.*\.py/,
      /^colcon\s+build/,
      /^gazebo/,
      /^rviz2?/,
      /tail\s+-f/,
    ];
    return patterns.some((p) => p.test(command));
  };

  const killRunningProcess = useCallback(async (term) => {
    if (!runningProcessRef.current) return;
    const { processId, pollInterval } = runningProcessRef.current;
    if (pollInterval) clearInterval(pollInterval);
    try {
      const fileApi = await import("../../services/fileApi");
      await fileApi.killProcess(canvasId, processId);
      term.writeln("\x1b[33m✓ Process killed\x1b[0m");
    } catch (error) {
      term.writeln(`\x1b[31m✗ Failed to kill process: ${error.message}\x1b[0m`);
    } finally {
      runningProcessRef.current = null;
      isExecutingRef.current = false;
      writePrompt(term);
    }
  }, [canvasId, writePrompt]);

  const pollProcessOutput = useCallback(async (processId, term) => {
    try {
      const fileApi = await import("../../services/fileApi");
      const result = await fileApi.getProcessOutput(canvasId, processId);
      if (result.output?.length > 0) {
        result.output.forEach(({ type, data }) => {
          const color = type === "stderr" ? "\x1b[31m" : "";
          term.writeln(`${color}${data}\x1b[0m`);
        });
      }
      if (result.status === "completed") {
        if (runningProcessRef.current?.pollInterval)
          clearInterval(runningProcessRef.current.pollInterval);
        runningProcessRef.current = null;
        isExecutingRef.current = false;
        if (result.exit_code === 0) {
          term.writeln("\x1b[32m✓ Process completed successfully\x1b[0m");
        } else {
          term.writeln(`\x1b[31m✗ Process exited with code ${result.exit_code}\x1b[0m`);
        }
        writePrompt(term);
      }
    } catch (error) {
      if (runningProcessRef.current?.pollInterval)
        clearInterval(runningProcessRef.current.pollInterval);
      runningProcessRef.current = null;
      isExecutingRef.current = false;
      term.writeln(`\x1b[31m✗ Error: ${error.message}\x1b[0m`);
      writePrompt(term);
    }
  }, [canvasId, writePrompt]);

  const executeCommand = useCallback(async (command, term) => {
    if (command === "help") {
      term.writeln("\x1b[1;36m╔══════════════════════════════════════════╗\x1b[0m");
      term.writeln("\x1b[1;36m║\x1b[0m  \x1b[1;35mROS2 Workspace Commands\x1b[0m                \x1b[1;36m║\x1b[0m");
      term.writeln("\x1b[1;36m╚══════════════════════════════════════════╝\x1b[0m");
      term.writeln("  \x1b[32mhelp\x1b[0m          - Show this help");
      term.writeln("  \x1b[32mclear\x1b[0m         - Clear the terminal");
      term.writeln("  \x1b[36mros2 topic list\x1b[0m                - List topics");
      term.writeln("  \x1b[36mros2 run <pkg> <node>\x1b[0m          - Run a node");
      term.writeln("  \x1b[36mcolcon build\x1b[0m                   - Build workspace");
      term.writeln("\x1b[90mAll commands run inside the Docker container\x1b[0m");
      writePrompt(term);
      return;
    }
    if (command === "clear") { term.clear(); writePrompt(term); return; }
    if (command === "pwd") { term.writeln(`\x1b[36m${workingDirectory}\x1b[0m`); writePrompt(term); return; }

    if (isLongRunningCommand(command)) {
      term.writeln(`\x1b[90m❯ Starting: ${command}\x1b[0m`);
      term.writeln("\x1b[90m(Press Ctrl+C to stop)\x1b[0m");
      isExecutingRef.current = true;
      try {
        const fileApi = await import("../../services/fileApi");
        const result  = await fileApi.startStreamingCommand(canvasId, command);
        if (result.process_id) {
          const pollInterval = setInterval(() => pollProcessOutput(result.process_id, term), 500);
          runningProcessRef.current = { processId: result.process_id, pollInterval };
          pollProcessOutput(result.process_id, term);
        }
      } catch (error) {
        isExecutingRef.current = false;
        term.writeln(`\x1b[31m✗ Failed to start: ${error.message}\x1b[0m`);
        writePrompt(term);
      }
    } else if (onCommandExecute) {
      term.writeln(`\x1b[90m❯ Executing: ${command}\x1b[0m`);
      isExecutingRef.current = true;
      onCommandExecute(command, (output) => {
        isExecutingRef.current = false;
        if (output && typeof output === "string") {
          const trimmed = output.trim();
          if (!trimmed) {
            term.writeln(command.startsWith("source")
              ? "\x1b[32m✓ Environment sourced\x1b[0m"
              : "\x1b[32m✓ Done\x1b[0m");
          } else {
            trimmed.split("\n").forEach((line) => {
              if (/error/i.test(line)) term.writeln(`\x1b[31m${line}\x1b[0m`);
              else if (/warn/i.test(line)) term.writeln(`\x1b[33m${line}\x1b[0m`);
              else term.writeln(line);
            });
          }
        } else {
          term.writeln(String(output));
        }
        writePrompt(term);
      });
    } else {
      term.writeln("\x1b[33m⚠ Backend not connected\x1b[0m");
      writePrompt(term);
    }
  }, [onCommandExecute, canvasId, workingDirectory, writePrompt, pollProcessOutput]);

  const handleTerminalInput = useCallback((data, term) => {
    const code = data.charCodeAt(0);

    if (code === 3) {
      if (runningProcessRef.current) {
        term.writeln("\r\n\x1b[33m^C\x1b[0m");
        killRunningProcess(term);
      } else {
        term.writeln("\r\n^C");
        currentLineRef.current = "";
        writePrompt(term);
      }
      return;
    }

    if (isExecutingRef.current) return;

    if (code === 13) {
      const command = currentLineRef.current.trim();
      term.write("\r\n");
      if (command) {
        historyRef.current.push(command);
        historyIndexRef.current = historyRef.current.length;
        executeCommand(command, term);
      } else {
        writePrompt(term);
      }
      currentLineRef.current = "";
    } else if (code === 127 || code === 8) {
      if (currentLineRef.current.length > 0) {
        currentLineRef.current = currentLineRef.current.slice(0, -1);
        term.write("\b \b");
      }
    } else if (data === "\x1b[A") {
      if (historyIndexRef.current > 0) {
        historyIndexRef.current--;
        const cmd = historyRef.current[historyIndexRef.current];
        clearCurrentLine(term, currentLineRef.current.length);
        currentLineRef.current = cmd;
        term.write(cmd);
      }
    } else if (data === "\x1b[B") {
      if (historyIndexRef.current < historyRef.current.length - 1) {
        historyIndexRef.current++;
        const cmd = historyRef.current[historyIndexRef.current];
        clearCurrentLine(term, currentLineRef.current.length);
        currentLineRef.current = cmd;
        term.write(cmd);
      } else {
        historyIndexRef.current = historyRef.current.length;
        clearCurrentLine(term, currentLineRef.current.length);
        currentLineRef.current = "";
      }
    } else if (code >= 32) {
      currentLineRef.current += data;
      term.write(data);
    }
  }, [writePrompt, killRunningProcess, executeCommand]);

  // Listen for external executeCommand events (from ConvertToCodeNode).
  // With multiple terminal tabs mounted, only the active one should consume
  // the event — otherwise the command would be typed into every PTY.
  useEffect(() => {
    if (!isActive) return undefined;
    const handler = (event) => {
      const { command } = event.detail;
      const term = xtermRef.current;
      if (!command || !term) return;

      if (useWs && wsConnectedRef.current && wsRef.current?.readyState === WebSocket.OPEN) {
        const bytes = new TextEncoder().encode(command + "\r");
        wsRef.current.send(bytes);
      } else if (!useWs) {
        currentLineRef.current = command;
        term.write(command + "\r\n");
        executeCommand(command, term);
        currentLineRef.current = "";
      }
    };
    window.addEventListener("executeCommand", handler);
    return () => window.removeEventListener("executeCommand", handler);
  }, [useWs, executeCommand, isActive]);

  return <div ref={terminalRef} className="terminal" />;
}

Terminal.propTypes = {
  onCommandExecute:  PropTypes.func,
  workingDirectory:  PropTypes.string,
  username:          PropTypes.string,
  canvasId:          PropTypes.string,
  isActive:          PropTypes.bool,
};

export default Terminal;
