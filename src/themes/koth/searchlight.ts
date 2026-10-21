// Searchlight on the KOTH bunker at night (PLAN-KOTH.md package 3): it swings back and forth between two angles of the
// settings, as a pure function of the time. Check: searchlight.check.ts.

// fixed: one swing there and back takes 2 PI / 0.5 = 12.6 s at speed 1
const SWING = 0.5;
const DEGREE = Math.PI / 180;

// Angle in radians around the vertical axis; from, to in degrees, speed as a factor
export function searchlightAngle(time: number, from: number, to: number, speed: number): number {
  const middle = (from + to) / 2;
  const reach = (to - from) / 2;
  return (middle + reach * Math.sin(time * SWING * speed)) * DEGREE;
}
