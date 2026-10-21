// The sun of the realistic Urlaub beach (PLAN-URLAUB.md package 5): its height over the horizon in degrees from the time
// of the scene (a sunrise from below the horizon, eased) and its direction for the sky, the water and the light.
// Check: sun.check.ts.

// fixed: where the sunrise starts (degrees, just below the horizon)
export const SUNRISE_FROM = -2.5;

export type SunOptions = { sunriseOn: boolean; sunriseSeconds: number; height: number };

// Ease in and out (power1.inOut of GSAP)
const easeInOut = (share: number) => (share < 0.5 ? 2 * share * share : 1 - 2 * (1 - share) * (1 - share));

// Height of the sun in degrees at seconds since the scene began
export function sunHeight(seconds: number, options: SunOptions): number {
  if (!options.sunriseOn || options.sunriseSeconds <= 0) return options.height;
  const share = Math.min(1, Math.max(0, seconds / options.sunriseSeconds));
  return SUNRISE_FROM + (options.height - SUNRISE_FROM) * easeInOut(share);
}

// Unit direction toward the sun (y up) for a height and an azimuth in degrees, as three.js setFromSphericalCoords
export function sunDirection(height: number, azimuth: number): [number, number, number] {
  const polar = Math.PI / 2 - (height * Math.PI) / 180;
  const around = (azimuth * Math.PI) / 180;
  return [Math.sin(polar) * Math.sin(around), Math.cos(polar), Math.sin(polar) * Math.cos(around)];
}

// How bright the direct sunlight is (0 below the horizon to 1 a little above it) and the sky light
export const sunLight = (height: number) => Math.min(1, Math.max(0, (height + 2) / 6));
export const skyLight = (height: number) => 0.25 + Math.min(1, Math.max(0, (height + 3) / 9)) * 0.7;
