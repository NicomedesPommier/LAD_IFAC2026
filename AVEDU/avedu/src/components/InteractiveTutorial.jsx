// src/components/InteractiveTutorial.jsx
import React, { useEffect, useState, useCallback, useRef } from 'react';
import './InteractiveTutorial.scss';

/**
 * Interactive Tutorial Component - Game-style step-by-step guide
 * Overlays on the interface and highlights specific elements
 */
export default function InteractiveTutorial({ steps, onComplete, onSkip }) {
  const [currentStep, setCurrentStep] = useState(0);
  const [isActive, setIsActive] = useState(true);
  const [targetRect, setTargetRect] = useState(null);
  const observerRef = useRef(null);

  const step = steps[currentStep];
  const isLastStep = currentStep === steps.length - 1;

  // Find and highlight the target element
  const updateTargetPosition = useCallback(() => {
    if (!step?.target || !isActive) return;

    const element = document.querySelector(step.target);
    if (element) {
      const rect = element.getBoundingClientRect();
      setTargetRect({
        top: rect.top,
        left: rect.left,
        width: rect.width,
        height: rect.height,
      });

      // Scroll element into view if needed
      if (step.scrollIntoView) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    } else {
      setTargetRect(null);
    }
  }, [step, isActive]);

  // Update position when step changes or window resizes
  useEffect(() => {
    updateTargetPosition();

    // Set up ResizeObserver for dynamic updates
    if (step?.target) {
      const element = document.querySelector(step.target);
      if (element) {
        observerRef.current = new ResizeObserver(updateTargetPosition);
        observerRef.current.observe(element);
      }
    }

    window.addEventListener('resize', updateTargetPosition);
    window.addEventListener('scroll', updateTargetPosition, true);

    return () => {
      window.removeEventListener('resize', updateTargetPosition);
      window.removeEventListener('scroll', updateTargetPosition, true);
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [step, updateTargetPosition]);

  const handleNext = () => {
    if (step.onNext) {
      step.onNext();
    }

    if (isLastStep) {
      setIsActive(false);
      onComplete?.();
    } else {
      setCurrentStep(prev => prev + 1);
    }
  };

  const handleSkip = () => {
    setIsActive(false);
    onSkip?.();
  };

  if (!isActive || !step) return null;

  // Calculate tooltip position with boundary detection
  const getTooltipPosition = () => {
    if (!targetRect) return { top: '50%', left: '50%', transform: 'translate(-50%, -50%)' };

    const { top, left, width, height } = targetRect;
    const position = step.position || 'bottom';
    const offset = step.offset || 20;

    // Tooltip dimensions (approximate)
    const tooltipWidth = 420;
    const tooltipHeight = 200;
    const padding = 20;

    // Viewport dimensions
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    let finalPosition = {};
    let finalTransform = '';

    switch (position) {
      case 'top':
        finalPosition = {
          top: `${Math.max(padding, top - offset)}px`,
          left: `${left + width / 2}px`
        };
        finalTransform = 'translate(-50%, -100%)';
        break;
      case 'bottom':
        finalPosition = {
          top: `${Math.min(viewportHeight - tooltipHeight - padding, top + height + offset)}px`,
          left: `${left + width / 2}px`
        };
        finalTransform = 'translateX(-50%)';
        break;
      case 'left':
        finalPosition = {
          top: `${top + height / 2}px`,
          left: `${Math.max(padding, left - offset)}px`
        };
        finalTransform = 'translate(-100%, -50%)';
        break;
      case 'right':
        finalPosition = {
          top: `${top + height / 2}px`,
          left: `${Math.min(viewportWidth - tooltipWidth - padding, left + width + offset)}px`
        };
        finalTransform = 'translateY(-50%)';
        break;
      default:
        finalPosition = {
          top: `${Math.min(viewportHeight - tooltipHeight - padding, top + height + offset)}px`,
          left: `${left + width / 2}px`
        };
        finalTransform = 'translateX(-50%)';
    }

    // Ensure horizontal boundaries for centered tooltips
    if (position === 'top' || position === 'bottom') {
      const centerX = left + width / 2;
      const tooltipLeft = centerX - tooltipWidth / 2;
      const tooltipRight = centerX + tooltipWidth / 2;

      if (tooltipLeft < padding) {
        finalPosition.left = `${padding + tooltipWidth / 2}px`;
      } else if (tooltipRight > viewportWidth - padding) {
        finalPosition.left = `${viewportWidth - padding - tooltipWidth / 2}px`;
      }
    }

    return { ...finalPosition, transform: finalTransform };
  };

  const tooltipStyle = getTooltipPosition();

  return (
    <div className="tutorial-overlay">
      {/* Backdrop with spotlight */}
      <div className="tutorial-backdrop" onClick={step.backdropClickable ? handleNext : undefined}>
        {targetRect && (
          <div
            className="tutorial-spotlight"
            style={{
              top: `${targetRect.top - 8}px`,
              left: `${targetRect.left - 8}px`,
              width: `${targetRect.width + 16}px`,
              height: `${targetRect.height + 16}px`,
            }}
          />
        )}
      </div>

      {/* Tutorial tooltip */}
      <div className="tutorial-tooltip" style={tooltipStyle}>
        {/* Arrow indicator */}
        {targetRect && (
          <div className={`tutorial-arrow tutorial-arrow--${step.position || 'bottom'}`} />
        )}

        {/* Step counter */}
        <div className="tutorial-header">
          <span className="tutorial-step-counter">
            Step {currentStep + 1} of {steps.length}
          </span>
          <button className="tutorial-skip" onClick={handleSkip} aria-label="Skip tutorial">
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="tutorial-content">
          {step.title && <h3 className="tutorial-title">{step.title}</h3>}
          <p className="tutorial-text">{step.text}</p>

          {step.image && (
            <img src={step.image} alt={step.title} className="tutorial-image" />
          )}
        </div>

        {/* Actions */}
        <div className="tutorial-actions">
          {!step.hideControls && (
            <>
              {currentStep > 0 && (
                <button
                  className="tutorial-btn tutorial-btn--secondary"
                  onClick={() => setCurrentStep(prev => prev - 1)}
                >
                  ← Back
                </button>
              )}
              <button
                className="tutorial-btn tutorial-btn--primary"
                onClick={handleNext}
              >
                {isLastStep ? 'Finish' : step.buttonText || 'Next'} →
              </button>
            </>
          )}
        </div>

        {/* Progress dots */}
        <div className="tutorial-progress">
          {steps.map((_, index) => (
            <button
              key={index}
              className={`tutorial-dot ${index === currentStep ? 'is-active' : ''} ${index < currentStep ? 'is-completed' : ''}`}
              onClick={() => setCurrentStep(index)}
              aria-label={`Go to step ${index + 1}`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
