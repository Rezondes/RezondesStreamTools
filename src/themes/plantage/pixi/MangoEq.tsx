// Mango equalizer of the Plantage music player in PixiJS (PLAN-PLANTAGE.md package 4): leaf green stems that grow and
// shrink with the levels (core/music/equalizer.ts), a ripe mango on top of each; the time stands still while paused.
import type { Graphics } from "pixi.js";
import { hexNumber } from "../../../core/color.ts";
import { equalizerLevels } from "../../../core/music/equalizer.ts";

export type MangoEqLook = { bar: number; gap: number; height: number; leaf: string; leafDark: string; mango: string };

// fixed: the mango over the bar width, how far it sits above the stem
const MANGO = { size: 0.75, lift: 0.4 };

export function drawMangoEq(graphics: Graphics, seconds: number, bars: number, look: MangoEqLook) {
  graphics.clear();
  const radius = (look.bar * MANGO.size);
  equalizerLevels(seconds, bars).forEach((level, index) => {
    const tall = level * (look.height - radius * 2);
    const x = index * (look.bar + look.gap);
    const top = look.height - tall;
    graphics.roundRect(x + look.bar / 4, top, look.bar / 2, tall, look.bar / 4).fill(hexNumber(look.leafDark));
    graphics.ellipse(x + look.bar / 2, top - radius * MANGO.lift, radius, radius * 1.2).fill(hexNumber(look.mango));
    graphics.ellipse(x + look.bar / 2 + radius * 0.5, top - radius * (MANGO.lift + 1), radius * 0.45, radius * 0.25).fill(hexNumber(look.leaf));
  });
}
