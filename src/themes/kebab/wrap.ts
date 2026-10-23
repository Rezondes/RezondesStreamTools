// The stinger "papier" as pure functions of the time (DESIGN-KEBAB.md "Stinger", prototype refs/stinger.html): four
// flaps of wrapping paper fold in from the edges and meet beyond the middle, the paper then stands as one piece without
// a seam, at the tear it splits along a jagged line and both halves fly to the sides. Sizes in px of the 1920 x 1080
// picture, times in s of a stinger of 1.6 s with its cut at 0.8 s (the clip warps its own times onto these).
// Check: wrap.check.ts.
import { hash } from "../../core/hash.ts";

export const PICTURE = { width: 1920, height: 1080 };
// fixed: the flaps start one after another and fold in with power3.in; the paper is whole from "whole", tears at "tear"
export const WRAP = { start: 0.05, stagger: 0.05, fold: 0.5, whole: 0.72, tear: 0.92, apart: 0.65, fly: 1150, turn: 7, overshoot: 0.08, steps: 20 };
export const FLAPS = ["top", "right", "bottom", "left"] as const;
export type Flap = (typeof FLAPS)[number];
type Point = [number, number];

const clamp01 = (value: number) => Math.min(1, Math.max(0, value));

// How far each flap has folded in (0 = at its edge, 1 = beyond the middle)
export const flapShare = (time: number, index: number) => clamp01((time - WRAP.start - index * WRAP.stagger) / WRAP.fold) ** 3;

// The triangle of a flap: its edge of the picture and the tip that moves to the middle and a little beyond
export function flapPolygon(flap: Flap, share: number): Point[] {
  const { width, height } = PICTURE;
  const reach = (0.5 + WRAP.overshoot) * share;
  switch (flap) {
    case "top": return [[0, 0], [width, 0], [width / 2, height * reach]];
    case "right": return [[width, 0], [width, height], [width * (1 - reach), height / 2]];
    case "bottom": return [[width, height], [0, height], [width / 2, height * (1 - reach)]];
    case "left": return [[0, height], [0, 0], [width * reach, height / 2]];
  }
}

// The jagged tear from top to bottom around the middle, the same for both halves
export function tearEdge(seed: number, jagPercent: number): Point[] {
  const jag = (jagPercent / 100) * PICTURE.width;
  return Array.from({ length: WRAP.steps + 1 }, (_, step) => [PICTURE.width / 2 + (hash(seed * 1000 + step) - 0.5) * jag, (step / WRAP.steps) * PICTURE.height]);
}

// The stingers are drawn for 1.6 s with the cut at 0.8 s; a clip with its own length and cut maps its time onto that
export const DESIGN = { duration: 1.6, cut: 0.8 };
export function designTime(time: number, duration: number, cut: number): number {
  if (time <= cut) return cut > 0 ? (time / cut) * DESIGN.cut : DESIGN.cut;
  const rest = duration - cut;
  return rest > 0 ? DESIGN.cut + ((time - cut) / rest) * (DESIGN.duration - DESIGN.cut) : DESIGN.duration;
}

export type Paper = { flaps: number[] | null; whole: boolean; apart: number };

// What the paper looks like at a time: folding flaps, one whole sheet, or two halves flying apart (0 to 1)
export function paperAt(time: number): Paper {
  if (time >= WRAP.tear) return { flaps: null, whole: false, apart: clamp01((time - WRAP.tear) / WRAP.apart) ** 2 };
  if (time >= WRAP.whole) return { flaps: null, whole: true, apart: 0 };
  return { flaps: FLAPS.map((_, index) => flapShare(time, index)), whole: false, apart: 0 };
}
