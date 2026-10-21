// Confetti of the Bärenbande alert (PLAN-BEARS.md package 13, refs/alert.html): paw prints and leaves thrown up out of
// the card with burstAt of the core, falling back down, turning, fading at the end of their life; every piece from seed,
// index and the time since the throw. Check: confetti.check.ts.
import { burstAt } from "../../core/motion/burst.ts";
import type { IconName } from "./icons.ts";

export type ConfettiPiece = { x: number; y: number; rotation: number; alpha: number; icon: IconName };

// fixed: the throw of the prototype: up in a wide fan, speed px/s, gravity px/s², drag per second, life (s)
const THROW = { direction: -Math.PI / 2, spread: Math.PI * 0.9, speed: [500, 1100] as const, gravity: 900, drag: 0.6, life: 2.6 };
export const CONFETTI_LIFE = THROW.life;
// Paw prints and leaves take turns
const ICONS: readonly IconName[] = ["pfote", "blatt"];

export function confettiAt(seed: number, count: number, seconds: number, origin: { x: number; y: number }): ConfettiPiece[] {
  return burstAt(seed, count, seconds, { ...THROW, origin }).map((piece, index) => ({
    x: piece.x, y: piece.y, rotation: (piece.angle * 180) / Math.PI, alpha: piece.opacity, icon: ICONS[index % ICONS.length],
  }));
}
