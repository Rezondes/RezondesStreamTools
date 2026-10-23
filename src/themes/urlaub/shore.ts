// The shore of the realistic Urlaub beach (PLAN-URLAUB.md package 5): the height of the sand over the sea level (below
// it toward the sea, above it toward the camera, with soft ripples), how wet the sand is near the water line, and the
// surf bands that run up the beach and fade, placed from the time only. World units: x across, z toward the camera.
// Check: shore.check.ts.

// fixed: where the water line roughly lies (z), how steep the beach rises, its ripples, how far below sea level it starts
export const SHORE = 6;
const SLOPE = 0.085;
const RIPPLE = { wide: 0.18, small: 0.05 };
const DROP = 0.25;
// fixed: how high above the sea level the sand is still wet
const WET = 0.4;

export function shoreHeight(x: number, depth: number): number {
  return (depth - SHORE) * SLOPE + Math.sin(x * 0.09) * RIPPLE.wide + Math.sin(x * 0.31 + depth * 0.2) * RIPPLE.small - DROP;
}

// 1 at the water, 0 where the sand is dry
export const wetness = (height: number) => Math.min(1, Math.max(0, 1 - (height - 0.02) / WET));

// fixed: a band starts this far out in the water (z), runs this far up the beach, widens by this share at its end and
// drifts sideways this far
const SURF = { from: SHORE - 7, run: 9.5, widen: 0.8, drift: 3 };

type SurfBand = { z: number; opacity: number; stretch: number; x: number; share: number };

// Band index of bands at seconds; every band runs once per period seconds, the bands evenly out of step
export function surfBand(index: number, bands: number, seconds: number, period: number): SurfBand {
  const offset = index / Math.max(1, bands);
  const share = (((seconds / period + offset) % 1) + 1) % 1;
  return {
    z: SURF.from + share * SURF.run,
    opacity: Math.sin(share * Math.PI),
    stretch: 1 + share * SURF.widen,
    x: Math.sin(seconds * 0.1 + offset * 4) * SURF.drift,
    share,
  };
}
