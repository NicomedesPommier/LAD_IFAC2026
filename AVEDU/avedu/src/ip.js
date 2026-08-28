// src/ip.js
import React from "react";
import { USE_INGRESS, INGRESS_BASE } from "./config";

/** Config base (puedes cambiar los puertos si quieres otros defaults) */
const DEFAULTS = {
  HOST: "localhost",
  PORTS: {
    ROSBRIDGE: 9090,  // ws(s)://HOST:9090
    STATIC: 7000,     // http(s)://HOST:7000
    API: 8000,        // http(s)://HOST:8000
    WVS: 8080,        // http(s)://HOST:8080  (si lo usas)
  },
};

/** Estado module-level (single source of truth) */
let CURRENT_HOST = process.env.REACT_APP_HOST || DEFAULTS.HOST;
let CURRENT_PORTS = {
  ...DEFAULTS.PORTS,
  ...(process.env.REACT_APP_ROSBRIDGE_PORT ? { ROSBRIDGE: +process.env.REACT_APP_ROSBRIDGE_PORT } : {}),
  ...(process.env.REACT_APP_STATIC_PORT ? { STATIC: +process.env.REACT_APP_STATIC_PORT } : {}),
  ...(process.env.REACT_APP_API_PORT ? { API: +process.env.REACT_APP_API_PORT } : {}),
  ...(process.env.REACT_APP_WVS_PORT ? { WVS: +process.env.REACT_APP_WVS_PORT } : {}),
};

/** Si pasas ?host=IP o ?ros=ws://IP:9090 en la URL, lo respeta (útil en laboratorio) */
try {
  const qs = new URLSearchParams(window.location.search);
  const hostQs = qs.get("host");
  if (hostQs) CURRENT_HOST = hostQs;

  const rosQs = qs.get("ros"); // p.ej. ws://10.0.0.5:9090
  if (rosQs) {
    const u = new URL(rosQs);
    CURRENT_HOST = u.hostname || CURRENT_HOST;
    if (u.port) CURRENT_PORTS.ROSBRIDGE = +u.port;
  }
} catch {}

/** Detecta http/https y ajusta ws/wss automáticamente */
const isHttps = () => window.location?.protocol === "https:";
const wsScheme = () => (isHttps() ? "wss" : "ws");
const httpScheme = () => (isHttps() ? "https" : "http");

/** Helpers genéricos */
const makeWs = (port, path = "") => `${wsScheme()}://${CURRENT_HOST}:${port}${path}`;
const makeHttp = (port, path = "") => `${httpScheme()}://${CURRENT_HOST}:${port}${path.replace(/^\//, "/")}`;

/** Getters específicos - use ingress paths in Kubernetes, ports in local dev */
export const getRosbridgeUrl = (path = "") => {
  if (USE_INGRESS) {
    // Kubernetes: use ingress path
    return `${wsScheme()}://${window.location.host}${INGRESS_BASE}/rosbridge${path}`;
  }
  return makeWs(CURRENT_PORTS.ROSBRIDGE, path);
};

export const getStaticBase = () => {
  if (USE_INGRESS) {
    // Kubernetes: use ingress path for ROS static files
    return `${INGRESS_BASE}/ros-static`;
  }
  return makeHttp(CURRENT_PORTS.STATIC);
};

export const getApiBase = () => {
  if (USE_INGRESS) {
    // Kubernetes: use ingress path
    return `${INGRESS_BASE}/api`;
  }
  return makeHttp(CURRENT_PORTS.API);
};

export const getWvsBase = () => {
  if (USE_INGRESS) {
    // Kubernetes: use ingress path
    return `${INGRESS_BASE}/wvs`;
  }
  return makeHttp(CURRENT_PORTS.WVS);
};

/** QCar physical rosbridge — connects directly to the QCar's IP, bypassing Docker */
export const getQcarRosbridgeUrl = (qcarIp) =>
  `${wsScheme()}://${qcarIp}:${CURRENT_PORTS.ROSBRIDGE}`;

/** Componente "una línea": fija HOST y puertos para toda la app */
export function IP({ host, ports = {}, children }) {
  if (host) CURRENT_HOST = host;
  CURRENT_PORTS = { ...CURRENT_PORTS, ...ports };
  return <>{children}</>;
}
