// Air bubbles of the Urlaub chat in PixiJS (PLAN-URLAUB.md package 7): bubbles rise behind the messages (waterMotion.ts),
// each a thin foam ring with a light spot, fading near the top.
import type { Graphics } from "pixi.js";
import { hexNumber } from "../../../core/color.ts";
import { bubbleAt } from "../waterMotion.ts";

// fixed: ring width, inner tint, the light spot (share of the radius, offset)
const RING = 2;
const TINT = 0.12;
const SPOT = { size: 0.28, offset: 0.35 };

export function drawBubbles(graphics: Graphics, seconds: number, count: number, area: { width: number; height: number }, rise: number, color: string) {
  graphics.clear();
  const foam = hexNumber(color);
  for (let index = 0; index < count; index++) {
    const bubble = bubbleAt(index, seconds, area, rise);
    if (bubble.alpha <= 0) continue;
    graphics.circle(bubble.x, bubble.y, bubble.radius).fill({ color: foam, alpha: TINT * bubble.alpha }).stroke({ width: RING, color: foam, alpha: bubble.alpha });
    const spot = bubble.radius * SPOT.offset;
    graphics.circle(bubble.x - spot, bubble.y - spot, bubble.radius * SPOT.size).fill({ color: foam, alpha: bubble.alpha });
  }
}
