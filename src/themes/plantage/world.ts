// The world of the Plantage theme as data (DESIGN-PLANTAGE.md "Modernisierung"): depth layers from far to near (clouds,
// two hills, three tree rows, field, front trees, crates and grass), each with how far it moves with the camera, its
// blur and how much it mixes with the sky (air perspective); tree spots from the seed; hill lines, furrows and grass;
// sunrise and camera as pure functions of the time. Drawn by pixi/WorldLayer.tsx. Check: world.check.ts.
import { chance } from "../../core/three/chance.ts";
import { mango, type Shape } from "./tree.ts";

type LayerId = "clouds" | "hillsFar" | "hillsNear" | "treesFar" | "treesMid" | "field" | "treesNear" | "front";
type TreeSpot = { x: number; ground: number; scale: number; sway: number };
// move: share of the camera swing the layer follows (far small, near 1); blur in px; haze: mix with the sky 0 to 1
export type WorldLayer = { id: LayerId; move: number; blur: number; haze: number; trees: TreeSpot[] };
type WorldOptions = { seed: number; treeRowsFar: number; treeRowsMid: number; farBlur: number; hazeFar: number };

// fixed: the composition of the prototype (refs/starting.html) in stage px; per layer the share of the camera swing and
// the factors of the blur and the haze of the far tree row
const LAYERS: readonly { id: LayerId; move: number; blur: number; haze: number }[] = [
  { id: "clouds", move: 0.05, blur: 2, haze: 1.13 },
  { id: "hillsFar", move: 0.12, blur: 2, haze: 1.13 },
  { id: "hillsNear", move: 0.2, blur: 1.33, haze: 1.05 },
  { id: "treesFar", move: 0.3, blur: 1, haze: 1 },
  // The field lies before the middle row: that row stands on the field below the horizon, drawn behind it the field
  // hid its trunks and it looked pushed back
  { id: "field", move: 0.6, blur: 0, haze: 0 },
  { id: "treesMid", move: 0.5, blur: 0.4, haze: 0.55 },
  { id: "treesNear", move: 0.85, blur: 0, haze: 0 },
  { id: "front", move: 1, blur: 0, haze: 0 },
];
const ROWS = {
  treesFar: { from: -80, width: 2250, ground: 640, scale: 0.38, jitter: 40 },
  treesMid: { from: -60, width: 2320, ground: 690, scale: 0.6, jitter: 50 },
} as const;
export const NEAR_TREES: readonly TreeSpot[] = [{ x: 150, ground: 860, scale: 1.05, sway: 0 }, { x: 1760, ground: 880, scale: 1.1, sway: 2 }];
const SWAY_PHASE = 6;

function row(id: keyof typeof ROWS, count: number, random: () => number): TreeSpot[] {
  const { from, width, ground, scale, jitter } = ROWS[id];
  return Array.from({ length: count }, (_, index) => ({ x: from + (index * width) / count + random() * jitter, ground, scale, sway: random() * SWAY_PHASE }));
}

// The layers from far to near; the same seed gives the same trees
export function worldLayers(options: WorldOptions): WorldLayer[] {
  const random = chance(options.seed).next;
  const trees: Partial<Record<LayerId, TreeSpot[]>> = {
    treesFar: row("treesFar", options.treeRowsFar, random),
    treesMid: row("treesMid", options.treeRowsMid, random),
    treesNear: [...NEAR_TREES],
  };
  return LAYERS.map(layer => ({
    id: layer.id,
    move: layer.move,
    blur: layer.blur * options.farBlur,
    haze: Math.min(1, layer.haze * options.hazeFar),
    trees: trees[layer.id] ?? [],
  }));
}

// Outline of a hill row as a closed polygon (x, y pairs) from the left edge to the right one and down to the bottom
export const HILLS = { far: { y: 560, amplitude: 120, phase: 1 }, near: { y: 600, amplitude: 90, phase: 4 } } as const;
const EDGE = { left: -200, right: 2120, bottom: 1080, step: 40 };
export function hillLine({ y, amplitude, phase }: { y: number; amplitude: number; phase: number }): number[] {
  const points = [EDGE.left, EDGE.bottom];
  for (let x = EDGE.left; x <= EDGE.right; x += EDGE.step) points.push(x, y - amplitude * (0.5 + 0.5 * Math.sin(x * 0.0032 + phase) * Math.cos(x * 0.0011 + phase * 2)));
  points.push(EDGE.right, EDGE.bottom);
  return points;
}

// The field: horizon line, furrows as quads running from the vanishing point at the horizon to the bottom edge
export const FIELD = { horizon: 650, grassTop: 640, grassHeight: 18, furrows: 16 } as const;
export function furrows(): number[][] {
  const middle = 960;
  return Array.from({ length: FIELD.furrows * 2 + 1 }, (_, slot) => {
    const index = slot - FIELD.furrows;
    return [middle + index * 40, FIELD.horizon, middle + index * 44 + 6, FIELD.horizon, middle + index * 300 + 40, EDGE.bottom, middle + index * 300 - 10, EDGE.bottom];
  });
}

// Clouds: start x, height and size; beyond the four of the prototype more follow shifted; they drift right and come back
// in from the left
const CLOUD_BASE: readonly { x: number; y: number; size: number }[] = [{ x: 260, y: 210, size: 1 }, { x: 1450, y: 150, size: 0.8 }, { x: 900, y: 90, size: 0.6 }, { x: 1750, y: 280, size: 0.9 }];
export const cloudSpots = (count: number) => Array.from({ length: count }, (_, index) => {
  const base = CLOUD_BASE[index % CLOUD_BASE.length];
  const round = Math.floor(index / CLOUD_BASE.length);
  return { x: base.x + round * 1100, y: base.y + round * 40, size: base.size * (1 - round * 0.15) };
});
const CLOUD_LOOP = 2200;
const CLOUD_ENTRY = 140;
export const cloudX = (start: number, index: number, time: number) => ((start + time * (8 + index * 3)) % CLOUD_LOOP) - CLOUD_ENTRY;

// A crate full of mangos (bottom middle at 0, 0): shadow, six mangos on top, dark box with three light slats
type CrateColors = { wood: string; woodDark: string; shadow: string; mango: string; mangoBlush: string; gloss: string };
export function crate(colors: CrateColors): Shape[] {
  const slats = [-108, -72, -36];
  return [
    { kind: "ellipse", x: 0, y: 6, rx: 150, ry: 14, color: colors.shadow, alpha: 0.25 },
    ...Array.from({ length: 6 }, (_, index) => mango(-105 + index * 42, -112 - (index % 2) * 8, 22, colors)).flat(),
    { kind: "rect", x: -130, y: -110, w: 260, h: 112, radius: 8, color: colors.woodDark },
    ...slats.map((dy): Shape => ({ kind: "rect", x: -126, y: dy, w: 252, h: 32, radius: 5, color: colors.wood })),
    ...slats.map((dy): Shape => ({ kind: "rect", x: -126, y: dy, w: 252, h: 7, color: colors.gloss, alpha: 0.16 })),
  ];
}
export const CRATES = [{ x: 1480, y: 1060, label: true }, { x: 220, y: 1075, label: false }] as const;

// Grass tufts along the bottom edge: x and blade heights from the seed
export function grassTufts(seed: number, count: number): { x: number; blades: number[] }[] {
  const random = chance(seed + 1).next;
  return Array.from({ length: count }, (_, index) => ({ x: 60 + index * 122 + random() * 40, blades: Array.from({ length: 5 }, () => 70 + random() * 30) }));
}

// Sunrise from 0 (dawn) to 1 (morning) with a soft start and end; without sunrise always morning
export function sunriseAt(seconds: number, durationMs: number, on: boolean): number {
  if (!on || durationMs <= 0) return 1;
  const part = Math.min(1, Math.max(0, (seconds * 1000) / durationMs));
  return part < 0.5 ? 2 * part * part : 1 - 2 * (1 - part) * (1 - part);
}

// The light of a screen at a time: sky = blend from the first sky to the second (0 to 1), sun = height of the sun (0 at
// the horizon, 1 high), bright = brightness of the world (1 = full day). Starting: dawn to morning with the sunrise; BRB:
// noon; Ending: from evening into dusk while the sun sinks and the world gets darker
export type LightKind = "starting" | "brb" | "ending";
// The color behind the world of a scene (the sky at its foot)
export const skyOf = (values: { skyMorningBottom: string; skyDayBottom: string; skyEveningBottom: string }, kind: LightKind) =>
  ({ starting: values.skyMorningBottom, brb: values.skyDayBottom, ending: values.skyEveningBottom })[kind];
// The scene that shows a time of day (commands page, dashboard): morning the Starting, noon the BRB, evening and night the
// Ending
export const kindOfTime = (time: string): LightKind => ({ morgen: "starting", mittag: "brb" } as Record<string, LightKind>)[time] ?? "ending";
type LightOptions = { sunriseMs: number; sunriseOn: boolean; sunsetMs: number; sunsetOn: boolean };
// fixed: brightness before the sunrise and at the end of the sunset; the sun stands higher at noon
const DARK = { dawn: 0.55, dusk: 0.65 };
const NOON_SUN = 1.25;
export function daylight(kind: LightKind, seconds: number, options: LightOptions): { sky: number; sun: number; bright: number } {
  if (kind === "brb") return { sky: 1, sun: NOON_SUN, bright: 1 };
  if (kind === "ending") {
    const sunset = options.sunsetOn ? 1 - sunriseAt(seconds, options.sunsetMs, true) : 1;
    return { sky: 1 - sunset, sun: sunset, bright: DARK.dusk + (1 - DARK.dusk) * sunset };
  }
  const sunrise = sunriseAt(seconds, options.sunriseMs, options.sunriseOn);
  return { sky: sunrise, sun: sunrise, bright: DARK.dawn + (1 - DARK.dawn) * sunrise };
}

// The camera swings from -1 to 1 and back in twice the given seconds, softly at the turns
export const cameraAt = (seconds: number, swingSeconds: number, on: boolean) => (on && swingSeconds > 0 ? -Math.cos((Math.PI * seconds) / swingSeconds) : 0);
