// components/ide/IDETutorial.jsx
import React, { useEffect, useRef, useState } from "react";
import { driver } from "driver.js";
import "driver.js/dist/driver.css";
import PropTypes from "prop-types";
import "./IDETutorial.scss";

export function IDETutorial({ steps = [], onComplete, onSkip, autoStart = false, startFresh = false }) {
  const driverRef   = useRef(null);
  const completedRef = useRef(false);

  // Persistent progress — keyed on the first step title so different tutorials don't collide
  const storageKey = `ide-tutorial:${steps[0]?.title ?? "default"}`;

  const getSavedStep = () => {
    try { return Math.max(0, parseInt(localStorage.getItem(storageKey) ?? "0", 10)); }
    catch { return 0; }
  };
  const saveStep = (idx) => { try { localStorage.setItem(storageKey, String(idx)); } catch {} };
  const clearSavedStep = () => { try { localStorage.removeItem(storageKey); } catch {} };

  // Label shown on the resume button — updated as steps advance
  const [btnLabel, setBtnLabel] = useState(() => {
    const saved = startFresh ? 0 : getSavedStep();
    return saved > 0 ? `Resume (${saved + 1} / ${steps.length})` : "Tutorial";
  });

  useEffect(() => {
    if (!autoStart || steps.length === 0) return;

    const driverSteps = steps.map((step, i) => {
      const isLast = i === steps.length - 1;

      let desc = `<span class="idt-text">${step.text}</span>`;
      if (step.warning)
        desc += `<div class="idt-warning">⚠️ ${step.warning}</div>`;
      if (step.tip) {
        const label = step.tipLabel ?? "Run:";
        desc += `<div class="idt-tip"><span class="idt-tip-label">${label}</span>${step.tip}</div>`;
      }

      const popover = {
        title: step.title,
        description: desc,
        side: step.position || "bottom",
        align: "start",
        nextBtnText: step.buttonText || (isLast ? "Complete ✓" : "Next →"),
        prevBtnText: "← Prev",
        popoverClass: "ide-tutorial",
        ...(step.hideControls && { showButtons: [], disableButtons: ["close"] }),
      };

      const driverStep = { popover };
      if (step.target) driverStep.element = step.target;
      return driverStep;
    });

    const driverObj = driver({
      steps: driverSteps,
      animate: true,
      overlayOpacity: 0.72,
      smoothScroll: true,
      allowClose: true,
      allowKeyboardControl: false,
      stagePadding: 6,
      stageRadius: 8,
      popoverClass: "ide-tutorial",
      showProgress: true,
      progressText: "{{current}} / {{total}}",

      onHighlighted: (el, step, { driver: d }) => {
        const idx = d.getActiveIndex();
        if (idx !== undefined) {
          saveStep(idx);
          setBtnLabel(`Resume (${idx + 1} / ${steps.length})`);
        }
      },

      onNextClick: (el, step, { driver: d }) => {
        if (d.isLastStep()) {
          completedRef.current = true;
          d.destroy();
        } else {
          d.moveNext();
        }
      },

      onDestroyStarted: (el, step, { driver: d }) => {
        d.destroy();
        if (completedRef.current) {
          clearSavedStep();
          setBtnLabel("Tutorial");
          onComplete?.();
        } else {
          onSkip?.();
        }
      },
    });

    driverRef.current = driverObj;
    completedRef.current = false;

    // Start beta missions fresh; clamp any resumed index so a stale/out-of-range
    // value (e.g. saved from a tutorial that has since changed length) can't make
    // driver.js immediately destroy → fire onSkip → bounce the user out.
    if (startFresh) clearSavedStep();
    const savedStep = startFresh ? 0 : Math.min(getSavedStep(), steps.length - 1);
    const timer = setTimeout(() => driverObj.drive(savedStep), 200);

    return () => {
      clearTimeout(timer);
      if (driverRef.current?.isActive()) driverRef.current.destroy();
      driverRef.current = null;
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const handleKeyDown = (e) => {
      const d = driverRef.current;
      if (!d?.isActive()) return;
      if (e.key === "ArrowRight" || e.key === "Enter") {
        e.preventDefault();
        e.stopPropagation();
        if (d.isLastStep()) {
          completedRef.current = true;
          clearSavedStep();
          d.destroy();
          onComplete?.();
        } else {
          d.moveNext();
        }
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        e.stopPropagation();
        d.movePrevious();
      } else if (e.key === "Escape") {
        e.preventDefault();
        e.stopPropagation();
        if (d.isActive()) d.destroy();
        onSkip?.();
      }
    };
    window.addEventListener("keydown", handleKeyDown, true);
    return () => window.removeEventListener("keydown", handleKeyDown, true);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!autoStart || steps.length === 0) return null;

  const handleReopen = () => {
    if (!driverRef.current) return;
    completedRef.current = false;
    driverRef.current.drive(getSavedStep());
  };

  // The button is always in the DOM, but CSS hides it while body.driver-active is set
  // (driver.js adds that class automatically when the tour is running)
  return (
    <button className="ide-tutorial__reopen-btn" onClick={handleReopen} title={btnLabel}>
      <span className="ide-tutorial__reopen-icon">?</span>
      <span className="ide-tutorial__reopen-label">{btnLabel}</span>
    </button>
  );
}

IDETutorial.propTypes = {
  steps: PropTypes.arrayOf(
    PropTypes.shape({
      title: PropTypes.string.isRequired,
      text: PropTypes.string.isRequired,
      target: PropTypes.string,
      position: PropTypes.oneOf(["top", "bottom", "left", "right", "over"]),
      backdropClickable: PropTypes.bool,
      hideControls: PropTypes.bool,
      buttonText: PropTypes.string,
      warning: PropTypes.string,
      tip: PropTypes.string,
      tipLabel: PropTypes.string,
    })
  ).isRequired,
  onComplete: PropTypes.func,
  onSkip: PropTypes.func,
  autoStart: PropTypes.bool,
  startFresh: PropTypes.bool,
};

export default IDETutorial;
