// src/components/simulations/themeColors.js
// Los lienzos no entienden de CSS, así que leemos las variables del tema y las
// pasamos a ctx.strokeStyle / ctx.fillStyle. Así una simulación respeta
// [data-theme="light"] igual que el resto de la interfaz, en vez de llevar los
// colores del tema oscuro escritos a mano.

/** Lee una variable CSS del documento. */
function cssVar(name, fallback) {
  if (typeof window === "undefined") return fallback;
  const v = getComputedStyle(document.documentElement).getPropertyValue(name);
  return v?.trim() || fallback;
}

/** Igual que cssVar pero devolviendo "r, g, b" para poder aplicar alfa. */
function cssVarRgb(name, fallback) {
  return cssVar(name, fallback);
}

/**
 * Paleta del tema actual para dibujar en canvas.
 *
 * Llámala DENTRO de draw(), no en el cuerpo del componente: así se relee al
 * cambiar de tema sin necesidad de recrear nada.
 */
export function themePalette() {
  const neonRgb = cssVarRgb("--neon-rgb", "125, 249, 255");
  const neon2Rgb = cssVarRgb("--neon2-rgb", "255, 92, 244");

  return {
    /** Acento principal (cian en oscuro, azul en claro). */
    accent: cssVar("--neon", "#7df9ff"),
    /** Acento secundario (magenta en oscuro, granate en claro). */
    accent2: cssVar("--neon2", "#ff5cf4"),
    /** Texto secundario / etiquetas. */
    dim: cssVar("--text-dim", "#a8b3d1"),
    /** Texto principal. */
    text: cssVar("--text", "#e6f1ff"),
    /** Destacado (centro de gravedad, avisos). */
    highlight: cssVar("--warning", "#f59e0b"),
    /** Bordes suaves. */
    border: cssVar("--border", "rgba(255,255,255,.2)"),
    /** Ejes y cotas: neutro, no debe competir con los acentos. */
    gridLine: cssVar("--border-light", cssVar("--border", "rgba(255,255,255,.2)")),

    /** Acento principal con transparencia. */
    accentAlpha: (a) => `rgba(${neonRgb}, ${a})`,
    /** Acento secundario con transparencia. */
    accent2Alpha: (a) => `rgba(${neon2Rgb}, ${a})`,
  };
}
