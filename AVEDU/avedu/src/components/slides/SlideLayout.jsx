// =============================================================
// FILE: src/components/slides/SlideLayout.jsx
// Base reusable slide layout with navigation and progress
// =============================================================
import React from "react";
import "./SlideLayout.scss";

/**
 * Base layout for slides with consistent styling and navigation
 * @param {object} props
 * @param {React.ReactNode} props.children - Slide content
 * @param {string} props.title - Slide title
 * @param {string} [props.className] - Additional CSS classes
 * @param {object} [props.style] - Additional inline styles
 */
export function SlideLayout({ children, title, className = "", style = {} }) {
  return (
    <div className={`slide ${className}`} style={style}>
      {title && <h2>{title}</h2>}
      {children}
    </div>
  );
}

/**
 * Slide card/section component (glass morphism style)
 * @param {object} props
 * @param {React.ReactNode} props.children - Card content
 * @param {string} [props.title] - Card title
 * @param {string} [props.variant] - Layout variant: 'default', 'aside'
 * @param {string} [props.className] - Additional CSS classes
 */
export function SlideCard({ children, title, variant = "default", className = "" }) {
  const variantClass = variant === "aside" ? "slide-card--aside" : "";
  return (
    <div className={`slide-card ${variantClass} ${className}`}>
      {title && <div className="slide-card__title">{title}</div>}
      {children}
    </div>
  );
}

/**
 * Two-column layout for slides
 * @param {object} props
 * @param {React.ReactNode} props.left - Left column content
 * @param {React.ReactNode} props.right - Right column content
 * @param {string} [props.ratio] - Column ratio: '50-50', '30-70', '70-30'
 * @param {string} [props.className] - Additional CSS classes
 */
export function SlideColumns({ left, right, ratio = "50-50", className = "" }) {
  const ratioClass = ratio === "30-70" ? "slide-columns--30-70" : ratio === "70-30" ? "slide-columns--70-30" : "";
  return (
    <div className={`slide-columns ${ratioClass} ${className}`}>
      <div>{left}</div>
      <div>{right}</div>
    </div>
  );
}

/**
 * Code block with terminal styling
 * @param {object} props
 * @param {string} props.children - Code content
 * @param {string} [props.language] - Programming language (for future syntax highlighting)
 * @param {string} [props.className] - Additional CSS classes
 */
export function SlideCode({ children, language = "", className = "" }) {
  return (
    <pre className={`slide-code ${className}`} data-language={language}>
      {children}
    </pre>
  );
}

/**
 * Figure/Image container with optional caption
 * @param {object} props
 * @param {string} [props.src] - Image source URL
 * @param {string} [props.alt] - Image alt text
 * @param {string} [props.caption] - Figure caption
 * @param {React.ReactNode} [props.children] - Custom content (canvas, video, etc.)
 * @param {string} [props.className] - Additional CSS classes
 */
export function SlideFigure({ src, alt, caption, children, className = "" }) {
  return (
    <figure className={`slide-figure ${className}`}>
      {src ? <img src={src} alt={alt || ""} /> : children}
      {caption && <figcaption>{caption}</figcaption>}
    </figure>
  );
}

/**
 * Callout box with different variants
 * @param {object} props
 * @param {React.ReactNode} props.children - Callout content
 * @param {string} [props.variant] - Variant: 'info', 'warn', 'success', 'error'
 * @param {string} [props.className] - Additional CSS classes
 */
export function SlideCallout({ children, variant = "info", className = "" }) {
  const variantClass = `slide-callout--${variant}`;
  return <div className={`slide-callout ${variantClass} ${className}`}>{children}</div>;
}

/**
 * Action buttons container
 * @param {object} props
 * @param {React.ReactNode} props.children - Buttons
 * @param {string} [props.className] - Additional CSS classes
 */
export function SlideActions({ children, className = "" }) {
  return <div className={`slide-actions ${className}`}>{children}</div>;
}

/**
 * Button component for slides
 * @param {object} props
 * @param {React.ReactNode} props.children - Button text
 * @param {Function} [props.onClick] - Click handler
 * @param {boolean} [props.disabled] - Disabled state
 * @param {string} [props.variant] - Button variant: 'primary', 'secondary', 'danger'
 * @param {string} [props.className] - Additional CSS classes
 */
export function SlideButton({ children, onClick, disabled = false, variant = "primary", className = "" }) {
  return (
    <button className={`btn btn--${variant} ${className}`} onClick={onClick} disabled={disabled}>
      {children}
    </button>
  );
}

/**
 * Keyboard hint component
 * @param {object} props
 * @param {string} props.children - Key text (e.g., "Ctrl", "Space")
 */
export function SlideKbd({ children }) {
  return <kbd className="slide-kbd">{children}</kbd>;
}

/**
 * Progress indicator (dots)
 * @param {object} props
 * @param {number} props.total - Total number of slides
 * @param {number} props.current - Current slide index (0-based)
 * @param {Function} [props.onDotClick] - Handler when dot is clicked
 */
export function SlideProgress({ total, current, onDotClick }) {
  return (
    <div className="slide-progress">
      {Array.from({ length: total }, (_, i) => (
        <button
          key={i}
          className={`slide-progress__dot ${i === current ? "is-active" : ""}`}
          onClick={() => onDotClick?.(i)}
          aria-label={`Go to slide ${i + 1}`}
        />
      ))}
    </div>
  );
}

/**
 * Muted text utility
 */
export function SlideMuted({ children, className = "" }) {
  return <span className={`slide-muted ${className}`}>{children}</span>;
}

/**
 * Centered content utility
 */
export function SlideCenter({ children, className = "" }) {
  return <div className={`slide-center ${className}`}>{children}</div>;
}

/**
 * Featured box for highlighted content (pipeline steps, feature highlights)
 * @param {object} props
 * @param {React.ReactNode} props.children - Content
 * @param {string} [props.variant] - Color variant: 'default', 'magenta', 'orange', 'yellow', 'green', 'purple'
 * @param {string} [props.className] - Additional CSS classes
 */
export function SlideFeatured({ children, variant = "default", className = "" }) {
  const variantClass = variant !== "default" ? `slide-featured--${variant}` : "";
  return <div className={`slide-featured ${variantClass} ${className}`}>{children}</div>;
}

/**
 * Pipeline diagram with arrows between steps
 * @param {object} props
 * @param {React.ReactNode} props.children - Pipeline steps (use SlideFeatured for each step)
 * @param {number} [props.steps] - Number of steps: 3, 4 (default), 5
 * @param {string} [props.className] - Additional CSS classes
 */
export function SlidePipeline({ children, steps = 4, className = "" }) {
  const stepsClass = steps === 3 ? "slide-pipeline--3" : steps === 5 ? "slide-pipeline--5" : "";
  return <div className={`slide-pipeline ${stepsClass} ${className}`}>{children}</div>;
}

/**
 * Pipeline arrow separator
 */
export function SlidePipelineArrow() {
  return <div className="slide-pipeline__arrow">→</div>;
}

/**
 * Code snippet with copy button and optional title
 * @param {object} props
 * @param {string} props.code - Code content
 * @param {string} [props.title] - Optional title above code block
 * @param {string} [props.language] - Programming language for syntax hints
 * @param {boolean} [props.showCopy] - Show copy button (default: true)
 * @param {string} [props.hint] - Optional hint text below code
 * @param {string} [props.className] - Additional CSS classes
 */
export function SlideCodeSnippet({ code, title, language = "", showCopy = true, hint, className = "" }) {
  const [copied, setCopied] = React.useState(false);

  const handleCopy = () => {
    navigator.clipboard?.writeText(code).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }).catch(() => { });
  };

  return (
    <div className={`cmd-card ${className}`}>
      {title && <div className="cmd-card__title">{title}</div>}
      <pre className="cmd-card__code" data-language={language}>{code}</pre>
      {(showCopy || hint) && (
        <div className="cmd-card__actions">
          {showCopy && (
            <button className="btn btn--sm" onClick={handleCopy}>
              {copied ? "✓ Copied" : "Copy"}
            </button>
          )}
        </div>
      )}
      {hint && <div className="cmd-card__hint">{hint}</div>}
    </div>
  );
}

/**
 * Interactive folder tree component
 * @param {object} props
 * @param {Array} props.items - Array of {id, label, kind: 'dir'|'file', desc}
 * @param {string} [props.selectedId] - Currently selected item ID
 * @param {Function} [props.onSelect] - Selection handler (id) => void
 * @param {string} [props.className] - Additional CSS classes
 */
export function SlideFolderTree({ items, selectedId, onSelect, className = "" }) {
  return (
    <div className={`tree ${className}`}>
      <pre className="tree__pre">
        {items.map((item) => (
          <div
            key={item.id}
            role="button"
            onClick={() => onSelect?.(item.id)}
            title="Click to see details"
            className={`tree__item ${selectedId === item.id ? "is-selected" : ""}`}
          >
            <code>{item.label}</code>
          </div>
        ))}
      </pre>
    </div>
  );
}

/**
 * Folder tree detail panel
 * @param {object} props
 * @param {string} props.label - Item label
 * @param {string} props.description - Item description
 * @param {string} [props.className] - Additional CSS classes
 */
export function SlideFolderDetail({ label, description, className = "" }) {
  return (
    <div className={`detail ${className}`}>
      <div className="detail__label">{label?.replace(/^\s+/, "")}</div>
      <div className="detail__desc">{description}</div>
    </div>
  );
}

/**
 * Visualization wrapper for canvas-based interactive content
 * Manages responsive sizing and provides consistent styling
 * @param {object} props
 * @param {React.ReactNode} props.children - Canvas or visualization content
 * @param {Function} [props.renderCanvas] - Optional render function that receives (width, height)
 * @param {string} [props.caption] - Optional caption below visualization
 * @param {string} [props.className] - Additional CSS classes
 */
export function SlideVisualization({ children, caption, className = "" }) {
  return (
    <div className={`slide-canvas ${className}`}>
      {children}
      {caption && <figcaption className="slide-text--sm slide-muted slide-p-md">{caption}</figcaption>}
    </div>
  );
}

/**
 * Slider control for interactive visualizations
 * @param {object} props
 * @param {string} props.label - Slider label
 * @param {number} props.value - Current value
 * @param {Function} props.onChange - Change handler
 * @param {number} [props.min] - Minimum value
 * @param {number} [props.max] - Maximum value
 * @param {number} [props.step] - Step increment
 * @param {string} [props.unit] - Unit suffix (e.g., "°", "m/s")
 * @param {string} [props.className] - Additional CSS classes
 */
export function SlideSlider({ label, value, onChange, min = 0, max = 100, step = 1, unit = "", className = "" }) {
  return (
    <div className={`slide-slider ${className}`}>
      <span className="slide-slider__label">
        {label}: <span className="slide-slider__value">{value}{unit}</span>
      </span>
      <input
        type="range"
        className="slide-slider__input"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
      />
    </div>
  );
}

/**
 * Tip/info box for contextual hints
 * @param {object} props
 * @param {React.ReactNode} props.children - Tip content
 * @param {string} [props.className] - Additional CSS classes
 */
export function SlideTip({ children, className = "" }) {
  return <div className={`slide-tip ${className}`}>{children}</div>;
}

/**
 * Grid layout utility
 * @param {object} props
 * @param {React.ReactNode} props.children - Grid items
 * @param {number} [props.cols] - Number of columns: 2, 3, 4
 * @param {string} [props.className] - Additional CSS classes
 */
export function SlideGrid({ children, cols = 2, className = "" }) {
  return <div className={`slide-grid slide-grid--${cols} ${className}`}>{children}</div>;
}

// Default export for convenience
export default SlideLayout;
