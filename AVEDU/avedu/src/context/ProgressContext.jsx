// src/context/ProgressContext.jsx
import React, { createContext, useContext, useMemo, useState, useCallback } from "react";
import { apiFetch } from "./AuthContext";
import { API_BASE } from "../config";
import Swal from "sweetalert2";
import Confetti from "react-confetti";
import { useWindowSize } from "react-use";

const Ctx = createContext(null);
export const useProgress = () => useContext(Ctx);

export function ProgressProvider({ children }) {
  const { width, height } = useWindowSize();
  const [showConfetti, setShowConfetti] = useState(false);
  
  // Basic XP system stored locally for now. 
  // TODO: Fetch existing accumulated XP from backend if possible.
  const [xp, setXp] = useState(() => {
    return parseInt(localStorage.getItem("lad_xp") || "0", 10);
  });

  const addXp = useCallback((amount) => {
    setXp((prev) => {
      const next = prev + amount;
      localStorage.setItem("lad_xp", next.toString());
      return next;
    });
  }, []);

  const triggerConfetti = useCallback(() => {
    setShowConfetti(true);
    setTimeout(() => setShowConfetti(false), 8000);
  }, []);

  async function hitObjective(code) {
    const url = `${API_BASE}/progress/objective/${encodeURIComponent(code)}/hit/`;
    console.log("[Progress] hitObjective ->", url);
    const res = await apiFetch(url, { method: "POST" });
    const text = await res.text();
    let body = null; try { body = text ? JSON.parse(text) : null; } catch {}
    
    if (!res.ok) throw new Error(`hitObjective failed (${res.status})`);
    
    // Only show reward if the objective was newly achieved
    // The backend might return { status: 'hit' } vs { status: 'already_hit' }
    // If we assume any success here is a hit, we show the toast.
    addXp(10);
    Swal.fire({
      toast: true,
      position: 'top-end',
      icon: 'success',
      title: `Objective Achieved! +10 XP`,
      showConfirmButton: false,
      timer: 3000,
      timerProgressBar: true,
      background: '#1a1a1a', 
      color: '#00ff88',
      iconColor: '#00ff88',
      customClass: {
        popup: 'gamification-toast'
      }
    });

    return body;
  }

  async function completeLevel(slug) {
    const url = `${API_BASE}/levels/${encodeURIComponent(slug)}/complete/`;
    console.log("[Progress] completeLevel ->", url);
    const res = await apiFetch(url, { method: "POST" });
    const text = await res.text();
    let body = null; try { body = text ? JSON.parse(text) : null; } catch {}
    
    if (!res.ok) throw new Error(`completeLevel failed (${res.status})`);
    
    addXp(50);
    triggerConfetti();
    Swal.fire({
      icon: 'success',
      title: 'Level Completed!',
      text: 'Outstanding work! +50 XP acquired.',
      confirmButtonText: 'Continue',
      confirmButtonColor: '#00ff88',
      background: '#1a1a1a',
      color: '#ffffff',
      backdrop: `rgba(0,0,0,0.6)`
    });

    return body;
  }

  async function resetLevel(slug) {
    const url = `${API_BASE}/levels/${encodeURIComponent(slug)}/reset/`;
    console.log("[Progress] resetLevel ->", url);
    const res = await apiFetch(url, { method: "POST" });
    const text = await res.text();
    let body = null; try { body = text ? JSON.parse(text) : null; } catch {}
    if (!res.ok) throw new Error(`resetLevel failed (${res.status})`);
    return body;
  }

  const value = useMemo(() => ({ hitObjective, completeLevel, resetLevel, xp, triggerConfetti }), [xp, triggerConfetti]);

  return (
    <Ctx.Provider value={value}>
      {showConfetti && (
        <Confetti 
          width={width} 
          height={height} 
          numberOfPieces={400} 
          recycle={false} 
          tweenDuration={8000}
        />
      )}
      {children}
    </Ctx.Provider>
  );
}
