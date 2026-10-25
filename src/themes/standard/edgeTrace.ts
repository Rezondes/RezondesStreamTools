// Gradient edge and sparks of the standard alert card (PLAN-STANDARD.md package 3, prototype refs/alert.html): how
// much of the rounded edge is drawn after a time, and where the sparks are that start on the edge and fly outwards
// (burstAt of the core per spark), all from seed and time. Check: edgeTrace.check.ts.
import { hash } from "../../core/hash.ts";
import { burstAt } from "../../core/motion/burst.ts";
import type { StandardValues } from "./settings.ts";

export type Spark = { x: number; y: number; opacity: number; size: number };

// Perimeter of a card with rounded corners; the radius is at most half the shorter side
export function perimeter(width: number, height: number, radius: number): number {
  const round = Math.min(radius, width / 2, height / 2);
  return 2 * (width + height) - 8 * round + 2 * Math.PI * round;
}

// Drawn length of the edge after seconds: eases in and out over traceMs, then stays full
export function traceLength(seconds: number, traceMs: number, length: number): number {
  if (seconds < 0) return 0;
  const linear = traceMs > 0 ? Math.min(1, (seconds * 1000) / traceMs) : 1;
  const eased = linear < 0.5 ? 2 * linear * linear : 1 - (-2 * linear + 2) ** 2 / 2;
  return length * eased;
}

// Point on the edge of the card (corners square) at a share of the way clockwise from the top left corner, with the
// angle of the outward normal
export function edgePoint(share: number, width: number, height: number): { x: number; y: number; normal: number } {
  const path = (((share % 1) + 1) % 1) * 2 * (width + height);
  if (path < width) return { x: path, y: 0, normal: -Math.PI / 2 };
  if (path < width + height) return { x: width, y: path - width, normal: 0 };
  if (path < 2 * width + height) return { x: width - (path - width - height), y: height, normal: Math.PI / 2 };
  return { x: 0, y: height - (path - 2 * width - height), normal: Math.PI };
}

// How the sparks fly (settings): life of a spark in s, the latest start in s, fan of the flight, speed in px/s, the
// pull down, size in px and how far it shrinks over its life
export type SparkLook = { life: number; latest: number; spread: number; speedMin: number; speedMax: number; gravity: number; size: number; sizeSpread: number; shrink: number };

export const sparkLookOf = (values: StandardValues): SparkLook => ({
  life: values.alertSparkLife, latest: values.alertSparkLatest, spread: values.alertSparkSpread, speedMin: values.alertSparkSpeedMin, speedMax: values.alertSparkSpeedMax,
  gravity: values.alertSparkGravity, size: values.alertSparkSize, sizeSpread: values.alertSparkSizeSpread, shrink: values.alertSparkShrink,
});

// Seconds after the burst when every spark is gone
export const sparksDone = (look: SparkLook) => look.life + look.latest;
// fixed: room around the card in px for the flight of the sparks (their canvas, and the OBS source of the alerts)
export const SPARK_ROOM = 360;

// Sparks seconds after the burst: each starts at its own point of the edge a little later than the burst, flies out
// along the normal and fades; positions relative to the top left corner of the card
export function sparksAt(seed: number, count: number, seconds: number, card: { width: number; height: number }, look: SparkLook): Spark[] {
  const burst = { spread: look.spread, speed: [look.speedMin, look.speedMax] as const, gravity: look.gravity, drag: 0, life: look.life };
  return Array.from({ length: count }, (_, index) => {
    const value = (property: number) => hash(seed * 7919 + index * 31 + property);
    const point = edgePoint(value(1), card.width, card.height);
    const age = seconds - value(2) * look.latest;
    const [flying] = burstAt(seed * 131 + index, 1, age, { ...burst, origin: point, direction: point.normal });
    const size = (look.size + value(3) * look.sizeSpread) * (1 - (Math.max(0, age) / Math.max(look.life, Number.EPSILON)) * look.shrink);
    return { x: flying.x, y: flying.y, opacity: flying.opacity, size };
  });
}
