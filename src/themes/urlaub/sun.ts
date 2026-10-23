// The sun of the realistic Urlaub beach (PLAN-URLAUB.md package 5): its height over the horizon in degrees from the time
// of the scene (a sunrise from below the horizon, eased) and its direction for the sky, the water and the light.
// Check: sun.check.ts.

// fixed: where the sunrise starts (degrees, just below the horizon)
export const SUNRISE_FROM = -2.5;

type SunOptions = { sunriseOn: boolean; sunriseSeconds: number; height: number };

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

// fixed: where the sunset ends (degrees, below the horizon)
export const SUNSET_TO = -4;

type SceneSun = SunOptions & { noon: number; sunsetSeconds: number };
export type SunScene = "starting" | "brb" | "ending" | "info";

// The sun of a scene: the Starting rises, the BRB (and the commands page) stands at noon, the Ending sets from the set
// height below the horizon
export function sceneSunHeight(scene: SunScene, seconds: number, sun: SceneSun): number {
  if (scene === "starting") return sunHeight(seconds, sun);
  if (scene === "ending") {
    const share = sun.sunsetSeconds > 0 ? Math.min(1, Math.max(0, seconds / sun.sunsetSeconds)) : 1;
    return sun.height + (SUNSET_TO - sun.height) * easeInOut(share);
  }
  return sun.noon;
}

// fixed: the exposure of the settings fits the low sun up to this height (degrees); above it the sky gets brighter, so
// the exposure falls by half every this many degrees more; below the horizon it rises by this much per degree, at most
const LOW_SUN = 5;
const CLIMB = 20;
const DUSK = { per: 0.5, most: 2 };

// The factor on the exposure for a sun height: 1 for the low sun, less for a high one, more in the dusk
export function exposureFactor(height: number): number {
  if (height < 0) return 1 + Math.min(DUSK.most, -height * DUSK.per);
  return 1 / (1 + Math.max(0, height - LOW_SUN) / CLIMB);
}
