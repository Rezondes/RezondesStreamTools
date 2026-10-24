// Particles of the Dogs theme as pure functions of start and time (DESIGN-DOGS.md "Bewegung"): the hearts that burst
// from the head of the chosen dog in the Starting scene. The stage places a sprite at every position each frame, so
// stills with ?t= match. Check: particles.check.ts.
import type { Point } from "./pixels.ts";

// fixed: the burst of the prototype: each heart starts 0.04 s after the one before, flies 1.2 s on a half circle
// 26 by 18 pixels wide and rises 10 pixels; near the end some blink out
const HEARTS = { stagger: 0.04, flight: 1.2, reachX: 26, reachY: 18, rise: 10, blinkFrom: 0.75, blinkSteps: 8, blinkEvery: 5, offset: [-3, -6] };

const easeOut = (share: number) => 1 - (1 - share) ** 3;

// The hearts visible at time, burst from origin at start; count hearts spread over the upper half circle
export function heartsAt(time: number, start: number, count: number, origin: Point): Point[] {
  const hearts: Point[] = [];
  for (let heart = 0; heart < count; heart++) {
    const share = (time - start - heart * HEARTS.stagger) / HEARTS.flight;
    if (share <= 0 || share >= 1) continue;
    if (share > HEARTS.blinkFrom && (heart + Math.floor(share * HEARTS.blinkSteps)) % HEARTS.blinkEvery === 0) continue;
    const angle = (count > 1 ? heart / (count - 1) : 0.5) * Math.PI - Math.PI;
    const flown = easeOut(share);
    hearts.push([
      Math.round(origin[0] + HEARTS.offset[0] + Math.cos(angle) * HEARTS.reachX * flown),
      Math.round(origin[1] + HEARTS.offset[1] + Math.sin(angle) * HEARTS.reachY * flown - share * HEARTS.rise),
    ]);
  }
  return hearts;
}
