// src/config.js
export const API_BASE = process.env.REACT_APP_API_BASE || '/api';
export const STATIC_BASE = '/qcar_static'; // opcional si la usas en más lados

// Same-origin routing behind a reverse proxy. Two triggers:
//  - K8s ingress sets PUBLIC_URL to a subpath (e.g. /lad)  -> INGRESS_BASE = /lad
//  - Tunnel/Caddy on a dedicated hostname sets REACT_APP_SAME_ORIGIN=1 -> root ('')
const _HAS_SUBPATH = process.env.PUBLIC_URL && process.env.PUBLIC_URL !== '/';
export const USE_INGRESS = process.env.REACT_APP_SAME_ORIGIN === '1' || _HAS_SUBPATH;
export const INGRESS_BASE = _HAS_SUBPATH ? process.env.PUBLIC_URL : '';

// ROS integration - uses ingress paths in K8s, localhost ports in local dev
export const ROS_STATIC_BASE = process.env.REACT_APP_ROS_STATIC ||
  (USE_INGRESS ? `${INGRESS_BASE}/ros-static` : 'http://localhost:7000');

export const ROS_WS_URL = process.env.REACT_APP_ROS_WS ||
  (USE_INGRESS
    ? `${window.location.protocol === 'https:' ? 'wss' : 'ws'}://${window.location.host}${INGRESS_BASE}/rosbridge`
    : 'ws://localhost:9090');
