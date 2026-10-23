// Wave equalizer of the Urlaub music player in PixiJS (PLAN-URLAUB.md package 7): rounded bars of sea water with a
// foam cap, their levels a wave running along them (core/music/equalizer.ts); the time stands still while the track is paused.
import type { Graphics } from "pixi.js";
import { hexNumber } from "../../../core/color.ts";
import { equalizerLevels } from "../../../core/music/equalizer.ts";

type EqLook = { bar: number; gap: number; height: number; sea: string; foam: string };

export function drawEqualizer(graphics: Graphics, seconds: number, bars: number, look: EqLook) {
  graphics.clear();
  equalizerLevels(seconds, bars).forEach((level, index) => {
    const tall = level * look.height;
    const x = index * (look.bar + look.gap);
    graphics.roundRect(x, look.height - tall, look.bar, tall, look.bar / 2).fill(hexNumber(look.sea));
    graphics.circle(x + look.bar / 2, look.height - tall + look.bar / 2, look.bar / 2).fill(hexNumber(look.foam));
  });
}
