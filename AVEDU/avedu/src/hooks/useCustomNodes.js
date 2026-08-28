import { useState, useCallback } from "react";

const STORAGE_KEY = "lad_custom_nodes";

function load() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function persist(nodes) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(nodes));
  } catch {}
}

export function useCustomNodes() {
  const [customNodes, setCustomNodes] = useState(load);

  const saveNode = useCallback((nodeDef) => {
    setCustomNodes((prev) => {
      const idx = prev.findIndex((n) => n.id === nodeDef.id);
      const next = idx >= 0
        ? prev.map((n) => (n.id === nodeDef.id ? nodeDef : n))
        : [...prev, nodeDef];
      persist(next);
      return next;
    });
  }, []);

  const deleteNode = useCallback((nodeId) => {
    setCustomNodes((prev) => {
      const next = prev.filter((n) => n.id !== nodeId);
      persist(next);
      return next;
    });
  }, []);

  return { customNodes, saveNode, deleteNode };
}
