// src/components/sim/ROSContext.jsx
//
// React context that exposes a single ROSLIB connection for the sim page.
// Wrap the sim page (outside <Canvas>) with <ROSProvider> so that both
// Three.js components (inside Canvas) and HTML overlays share one socket.

import React, { createContext, useContext } from 'react';
import { useRoslib } from '../../hooks/useRoslib';

export const ROSContext = createContext(null);

export function ROSProvider({ children }) {
  const roslib = useRoslib();
  return (
    <ROSContext.Provider value={roslib}>
      {children}
    </ROSContext.Provider>
  );
}

/** Convenience hook — throws if used outside <ROSProvider>. */
export function useROS() {
  const ctx = useContext(ROSContext);
  if (!ctx) throw new Error('useROS must be used inside <ROSProvider>');
  return ctx;
}
