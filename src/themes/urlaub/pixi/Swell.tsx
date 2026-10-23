// The swell of the Urlaub alert in PixiJS (swell.ts, refs/alert.html): the water body under the crest line, a darker
// band and a light band below the crest, a foam line on it and the foam curling over the steep front; spray drops fly
// where each swell breaks (burstAt of the core). Drawn every frame from the clock of the alert.
import type { Graphics } from "pixi.js";
import { hexNumber } from "../../../core/color.ts";
import { burstAt } from "../../../core/motion/burst.ts";
import { STRETCH, swellAt, type SwellTiming, waterHeight } from "../swell.ts";

type SwellColors = { sea: string; deep: string; foam: string };

// fixed: the step of the crest line (px), how far the back sinks below the water line, the bands below the crest, the
// foam curl (blobs, reach), the ripple of the crest
const STEP = 12;
const SINK = 50;
const BANDS = { deep: { offset: 36, width: 26, alpha: 0.45 }, light: { offset: 12, width: 10, alpha: 0.7 }, foam: 8 };
const CURL = { blobs: 18, reach: 90, start: 20, size: 9, fall: 40 };
const RIPPLE = { size: 5, speed: 9, wave: 0.05 };
// fixed: the spray of a break: drops, where they fly from, how fast, gravity, life
const SPRAY = { origin: { x: 960, y: 300 }, direction: -Math.PI / 2, spread: Math.PI * 0.8, speed: [420, 950] as const, gravity: 2600, drag: 0, life: 1.2, size: 8 };

export function drawSwell(graphics: Graphics, seconds: number, timing: SwellTiming, colors: SwellColors) {
  graphics.clear();
  const swell = swellAt(seconds, timing);
  if (!swell) return;
  const top: number[] = [];
  for (let x = STRETCH.from; x <= STRETCH.to; x += STEP) {
    const edge = Math.sin(((x - STRETCH.from) / (STRETCH.to - STRETCH.from)) * Math.PI);
    top.push(x, STRETCH.base - waterHeight(x, swell) + Math.sin(x * RIPPLE.wave + seconds * RIPPLE.speed) * RIPPLE.size * edge);
  }
  const back: number[] = [];
  for (let x = STRETCH.to; x >= STRETCH.from; x -= STEP * 3) back.push(x, STRETCH.base + Math.sin(((x - STRETCH.from) / (STRETCH.to - STRETCH.from)) * Math.PI) * SINK);
  const below = (offset: number) => top.map((value, index) => (index % 2 ? value + offset : value));
  graphics.poly([...top, ...back]).fill({ color: hexNumber(colors.sea), alpha: 0.94 });
  graphics.poly(below(BANDS.deep.offset), false).stroke({ width: BANDS.deep.width, color: hexNumber(colors.deep), alpha: BANDS.deep.alpha });
  graphics.poly(below(BANDS.light.offset), false).stroke({ width: BANDS.light.width, color: hexNumber(colors.foam), alpha: BANDS.light.alpha });
  graphics.poly(top, false).stroke({ width: BANDS.foam, color: hexNumber(colors.foam) });
  // The curl: foam tumbling over the steep front of the crest
  for (let blob = 0; blob < CURL.blobs; blob++) {
    const share = blob / CURL.blobs;
    const x = swell.crest + swell.direction * (CURL.start + share * CURL.reach);
    const y = STRETCH.base - waterHeight(x, swell) + Math.sin(seconds * 14 + blob) * 8 + share * CURL.fall;
    graphics.circle(x, y, 7 + (1 - share) * CURL.size).fill({ color: hexNumber(colors.foam), alpha: 0.9 - share * 0.5 });
  }
}

// Spray drops of the breaks at the given moments (s), drops per break
export function drawSpray(graphics: Graphics, seconds: number, breaks: readonly number[], drops: number, color: string) {
  graphics.clear();
  breaks.forEach((moment, index) => {
    for (const drop of burstAt(index + 1, drops, seconds - moment, SPRAY)) {
      if (drop.opacity <= 0) continue;
      graphics.circle(drop.x, drop.y, SPRAY.size * drop.opacity).fill({ color: hexNumber(color), alpha: drop.opacity });
    }
  });
}
