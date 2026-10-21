// Waving flag on the KOTH hill (DESIGN-KOTH.md "Modernisierung"): the offset of a point of the cloth as a pure function
// of its place and the time; at the pole the cloth is still, the wave grows towards the free end. Check: flag.check.ts.

// fixed: wave of the prototype (refs/starting.html), lengths in m and speeds per second
const WAVE = { length: 2.2, speed: 6.5, depth: 0.28 };
const RIPPLE = { length: 4.1, speed: 9, depth: 0.06 };
const SAG = 0.18;

// along: distance from the pole in m, across: height on the cloth in m, size: length of the cloth, wind: strength factor.
// depth: out of the cloth plane, sag: down, both in m
export function flagOffset(along: number, across: number, time: number, size: number, wind: number) {
  const share = size > 0 ? along / size : 0;
  const wave = Math.sin(along * WAVE.length - time * WAVE.speed) * WAVE.depth;
  const ripple = Math.sin(along * RIPPLE.length - time * RIPPLE.speed + across) * RIPPLE.depth;
  return { depth: (wave + ripple) * share * wind, sag: -share * share * SAG };
}
