// src/patches/eventemitter2-error-safe.js
import { EventEmitter2 } from "eventemitter2";

// Evita que EventEmitter2 lance si emiten 'error' sin oyentes (caso roslib/ws fallando)
if (EventEmitter2 && !EventEmitter2.___roslibErrorPatched) {
  const origEmit = EventEmitter2.prototype.emit;
  EventEmitter2.prototype.emit = function patchedEmit(type, ...args) {
    try {
      if (
        type === "error" &&
        typeof this.listeners === "function" &&
        this.listeners("error").length === 0
      ) {
        // eslint-disable-next-line no-console
        console.warn("[EventEmitter2] swallowed 'error' event:", args[0]);
        return true; // evita throw
      }
    } catch {}
    return origEmit.call(this, type, ...args);
  };
  EventEmitter2.___roslibErrorPatched = true;
}
