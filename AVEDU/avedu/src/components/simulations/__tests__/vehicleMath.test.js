import { ackermannFromInner, ackermannAngles, stateDerivative, deg2rad, rad2deg } from "../vehicleMath";

const L = 2.5, t = 1.5;

test("ackermannFromInner reproduces the screenshot numbers", () => {
  const r = ackermannFromInner({ wheelbase: L, trackWidth: t, innerRad: deg2rad(30) });
  expect(rad2deg(r.outer)).toBeCloseTo(23.21, 2);   // matches the slide
  expect(r.radius).toBeCloseTo(L / Math.tan(deg2rad(30)) + t / 2, 6);
});

test("ICR actually lies on BOTH wheel axes (the bug that was drawn wrong)", () => {
  const inner = deg2rad(30);
  const { outer, radius: R } = ackermannFromInner({ wheelbase: L, trackWidth: t, innerRad: inner });
  // angle implied by the geometry at each front wheel, given ICR at distance R
  expect(rad2deg(Math.atan(L / (R - t / 2)))).toBeCloseTo(30, 6);
  expect(rad2deg(Math.atan(L / (R + t / 2)))).toBeCloseTo(rad2deg(outer), 6);
});

test("old formula placed the ICR t/2 too close", () => {
  const inner = deg2rad(30);
  const rBad = L / Math.tan(inner);              // what the slide used
  const { radius: rGood } = ackermannFromInner({ wheelbase: L, trackWidth: t, innerRad: inner });
  expect(rGood - rBad).toBeCloseTo(t / 2, 9);
});

test("Ackermann condition cot(o) - cot(i) = t/L holds", () => {
  for (const d of [5, 12, 30, -20]) {
    const { inner, outer } = ackermannFromInner({ wheelbase: L, trackWidth: t, innerRad: deg2rad(d) });
    const cot = (a) => 1 / Math.tan(Math.abs(a));
    expect(cot(outer) - cot(inner)).toBeCloseTo(t / L, 9);
  }
});

test("round-trip: inner -> steeringRad -> ackermannAngles gives same wheels", () => {
  const from = ackermannFromInner({ wheelbase: L, trackWidth: t, innerRad: deg2rad(25) });
  const back = ackermannAngles({ wheelbase: L, trackWidth: t, steeringRad: from.steeringRad });
  expect(rad2deg(back.inner)).toBeCloseTo(25, 6);
  expect(rad2deg(back.outer)).toBeCloseTo(rad2deg(from.outer), 6);
});

test("stateDerivative matches the printed equations", () => {
  const d = stateDerivative({ heading: 0, speed: 10, wheelbase: L, steeringRad: deg2rad(30) });
  expect(d.xDot).toBeCloseTo(10, 9);
  expect(d.yDot).toBeCloseTo(0, 9);
  expect(d.psiDot).toBeCloseTo((10 / L) * Math.tan(deg2rad(30)), 9);
});

test("straight ahead is handled", () => {
  const r = ackermannFromInner({ wheelbase: L, trackWidth: t, innerRad: 0 });
  expect(r.radius).toBe(Infinity);
  expect(r.outer).toBe(0);
});
