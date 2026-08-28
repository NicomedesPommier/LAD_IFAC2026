// src/index.jsx

// IMPORTANT: Import EventEmitter2 patch first to prevent uncaught 'error' events
// from roslib WebSocket failures when navigating between sections
import "./parches/eventemitter2-error-safe";

import React from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App";
import AuthProvider from "./context/AuthContext";
import { ThemeProvider } from "./context/ThemeContext";
import { ProgressProvider } from "./context/ProgressContext";
import { IP } from "./ip";

// Import centralized styles with theme variables
import "./styles/_variables.scss";

// Hojas GLOBALES: se importan una sola vez aquí, no dentro de los componentes.
//
// Por qué: con code-splitting, importar la misma hoja global desde 17 archivos
// distintos la mete en 17 chunks de CSS distintos. El orden en que se cargan
// depende de la ruta por la que entres, así que al recargar la página el
// último chunk que gana puede ser otro y los estilos cambian.
// Importándolas aquí quedan en el bundle principal, siempre en el mismo orden.
import "./styles/pages/_slides.scss";
import "./styles/components/_simulations.scss";
import "./styles/components/_minigames.scss";

/**
 * Host detection (auto-configured by start-all script via REACT_APP_HOST)
 * Falls back to localhost if not set
 */
const HOST = process.env.REACT_APP_HOST || "localhost";

/** (Opcional) si cambian puertos en ese PC:
 * const PORTS = { ROSBRIDGE: 9090, STATIC: 7000, API: 8000, WVS: 8080 };
 */

createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <ThemeProvider>
      <IP host={HOST /* , ports: PORTS */}>
        <BrowserRouter basename={process.env.PUBLIC_URL || "/"}>
          <AuthProvider>
            <ProgressProvider>
              <App />
            </ProgressProvider>
          </AuthProvider>
        </BrowserRouter>
      </IP>
    </ThemeProvider>
  </React.StrictMode>
);
