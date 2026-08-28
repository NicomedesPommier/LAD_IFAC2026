// src/components/simulations/vehicleMath.js
// Fórmulas de dinámica del vehículo compartidas por varias diapositivas.
// Estaban repetidas (y a veces con signos distintos) en cada slide.

export const deg2rad = (deg) => (deg * Math.PI) / 180;
export const rad2deg = (rad) => (rad * 180) / Math.PI;

/** Ángulo de dirección por debajo del cual se considera marcha recta. */
export const STRAIGHT_EPS = 0.001;

/**
 * Radio de giro del modelo de bicicleta: R = L / tan(δ).
 * Devuelve Infinity en marcha recta.
 */
export function turningRadius(wheelbase, steeringRad) {
  if (Math.abs(steeringRad) < STRAIGHT_EPS) return Infinity;
  return wheelbase / Math.tan(Math.abs(steeringRad));
}

/** Velocidad de guiñada: ψ̇ = (V / L)·tan(δ). */
export function yawRate(velocity, wheelbase, steeringRad) {
  if (wheelbase === 0) return 0;
  return (velocity / wheelbase) * Math.tan(steeringRad);
}

/**
 * Posición del ICR en coordenadas del mundo.
 *
 * El ICR está sobre la prolongación del eje trasero, a una distancia R,
 * perpendicular a la dirección de avance del coche.
 *
 * El coche se dibuja apuntando hacia -Y en su marco local, por eso la
 * dirección de avance real es (heading - π/2).
 *
 * @returns {{x:number, y:number, radius:number}|null} null si va recto.
 */
export function icrPosition({ carX, carY, heading, wheelbase, steeringRad }) {
  if (Math.abs(steeringRad) < STRAIGHT_EPS) return null;

  const R = turningRadius(wheelbase, steeringRad);

  // Centro del eje trasero: punto de referencia del modelo.
  const rearX = carX - (wheelbase / 2) * Math.cos(heading);
  const rearY = carY - (wheelbase / 2) * Math.sin(heading);

  const forward = heading - Math.PI / 2;
  const perp = forward + (steeringRad > 0 ? Math.PI / 2 : -Math.PI / 2);

  return {
    x: rearX + R * Math.cos(perp),
    y: rearY + R * Math.sin(perp),
    radius: R,
  };
}

/**
 * Derivada del estado del modelo cinemático de bicicleta.
 *
 *   x = [x, y, ψ]ᵀ        u = [V, δ]ᵀ
 *
 *   ẋ = V·cos(ψ)
 *   ẏ = V·sin(ψ)
 *   ψ̇ = (V/L)·tan(δ)
 *
 * Devolverla aparte permite enseñar el vector de estado en pantalla con los
 * mismos números que mueven el coche, en vez de recalcularlos para el texto.
 */
export function stateDerivative({ heading, speed, wheelbase, steeringRad }) {
  return {
    xDot: speed * Math.cos(heading),
    yDot: speed * Math.sin(heading),
    psiDot: yawRate(speed, wheelbase, steeringRad),
  };
}

/**
 * Jacobiano A = ∂f/∂x del modelo cinemático, linealizado en el estado actual.
 *
 *   A = | 0  0  −V·sin(ψ) |     B = | cos(ψ)   0                  |
 *       | 0  0   V·cos(ψ) |         | sin(ψ)   0                  |
 *       | 0  0   0        |         | tan(δ)/L  V/(L·cos²(δ))     |
 *
 * Solo las columnas/filas no nulas tienen interés didáctico: muestran que el
 * rumbo ψ es lo único que acopla la posición, y que δ entra por B.
 */
export function linearizedMatrices({ heading, speed, wheelbase, steeringRad }) {
  const cosD = Math.cos(steeringRad);

  return {
    A: [
      [0, 0, -speed * Math.sin(heading)],
      [0, 0, speed * Math.cos(heading)],
      [0, 0, 0],
    ],
    B: [
      [Math.cos(heading), 0],
      [Math.sin(heading), 0],
      [Math.tan(steeringRad) / wheelbase, speed / (wheelbase * cosD * cosD)],
    ],
  };
}

/**
 * Avanza un paso del modelo cinemático de bicicleta.
 * @returns {{x:number, y:number, heading:number}} nuevo estado.
 */
export function stepBicycle({ x, y, heading, speed, wheelbase, steeringRad, dt }) {
  let nextHeading = heading;

  if (Math.abs(steeringRad) >= STRAIGHT_EPS) {
    const R = turningRadius(wheelbase, steeringRad);
    const angular = speed / R;
    nextHeading = heading + angular * dt * (steeringRad > 0 ? 1 : -1);
  }

  return {
    heading: nextHeading,
    x: x + speed * dt * Math.cos(nextHeading),
    y: y + speed * dt * Math.sin(nextHeading),
  };
}

/**
 * Ángulos Ackermann de las ruedas interior y exterior, en radianes.
 *
 * Aquí `steeringRad` es el ángulo del modelo de bicicleta (rueda virtual en el
 * centro del eje delantero). El radio R se mide desde el ICR hasta el CENTRO
 * del eje trasero.
 *
 *   tan(δi) = L / (R − t/2)     tan(δo) = L / (R + t/2)
 */
export function ackermannAngles({ wheelbase, trackWidth, steeringRad }) {
  if (Math.abs(steeringRad) < STRAIGHT_EPS) return { inner: 0, outer: 0, radius: Infinity };

  const R = turningRadius(wheelbase, steeringRad);
  const sign = Math.sign(steeringRad);

  return {
    inner: sign * Math.atan(wheelbase / (R - trackWidth / 2)),
    outer: sign * Math.atan(wheelbase / (R + trackWidth / 2)),
    radius: R,
  };
}

/**
 * Geometría Ackermann partiendo del ángulo de la rueda INTERIOR.
 *
 * Es la entrada natural cuando el alumno mueve "ángulo interior" con un
 * deslizador. Devuelve también el radio al centro del eje trasero, que es
 * donde hay que dibujar el ICR:
 *
 *   tan(δi) = L / (R − t/2)   ⟹   R = L / tan(δi) + t/2
 *
 * Ojo: R ≠ L/tan(δi). Olvidar el término t/2 coloca el ICR medio ancho de vía
 * demasiado cerca del coche y los ejes de las ruedas dejan de cortarse ahí.
 */
export function ackermannFromInner({ wheelbase, trackWidth, innerRad }) {
  if (Math.abs(innerRad) < STRAIGHT_EPS) {
    return { inner: 0, outer: 0, radius: Infinity, steeringRad: 0 };
  }

  const sign = Math.sign(innerRad);
  const absInner = Math.abs(innerRad);

  // Radio desde el ICR hasta el centro del eje trasero.
  const R = wheelbase / Math.tan(absInner) + trackWidth / 2;
  const outer = Math.atan(wheelbase / (R + trackWidth / 2));

  return {
    inner: innerRad,
    outer: sign * outer,
    radius: R,
    // Ángulo equivalente del modelo de bicicleta, para mover el coche.
    steeringRad: sign * Math.atan(wheelbase / R),
  };
}
