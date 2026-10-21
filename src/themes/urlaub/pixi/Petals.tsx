// Hibiscus petals of the Urlaub alert in PixiJS (refs/alert.html): when the postmark hits, flowers fly up out of the card
// (burstAt of the core), turn, fall and fade; five petals around a yellow middle, in two flower colors.
import type { Graphics } from "pixi.js";
import { hexNumber } from "../../../core/color.ts";
import { burstAt } from "../../../core/motion/burst.ts";

export type PetalColors = { flower: string; other: string; middle: string };

// fixed: where the flowers fly from (px), how they fly, how big they are, petals per flower
const THROW = { direction: -Math.PI / 2, spread: Math.PI * 0.9, speed: [150, 500] as const, gravity: 320, drag: 2.2, life: 2 };
const SIZE = { min: 10, by: 8 };
const PETALS = 5;

export function drawPetals(graphics: Graphics, seconds: number, count: number, origin: { x: number; y: number }, colors: PetalColors) {
  graphics.clear();
  burstAt(7, count, seconds, { ...THROW, origin }).forEach((flower, index) => {
    if (flower.opacity <= 0) return;
    const size = SIZE.min + ((index * 37) % 10) / 10 * SIZE.by;
    const color = hexNumber(index % 2 ? colors.other : colors.flower);
    for (let petal = 0; petal < PETALS; petal++) {
      const angle = flower.angle + (petal * Math.PI * 2) / PETALS;
      graphics.ellipse(flower.x + Math.cos(angle) * size * 0.6, flower.y + Math.sin(angle) * size * 0.6, size * 0.55, size * 0.35).fill({ color, alpha: flower.opacity });
    }
    graphics.circle(flower.x, flower.y, size * 0.22).fill({ color: hexNumber(colors.middle), alpha: flower.opacity });
  });
}
