// Check for paint.ts: scribbles stroke every path with glow only on neon lines and draw the take asked for, a painted brush
// fills its body with glow and strokes every bristle, drips run down with the time, mist paints only visible dots,
// sprayed text is centered and returns its width. A recording mock canvas stands in for the browser. Runs with npm test.
import assert from "node:assert/strict";
import { burstAt } from "../../core/motion/burst.ts";
import { brushAt, makeBrush } from "./brush.ts";
import { paintBrushDrips, paintBrushFrame, paintMist, paintScribbles, paintSpray, paintWall, type ChaosColors } from "./paint.ts";
import { layoutScribbles } from "./scribbles.ts";
import { blotches, dust } from "./wall.ts";

export type Call = { name: string; args: unknown[]; shadowBlur: number };

// A canvas that records every call with the shadow blur in effect
export function recorder() {
  const calls: Call[] = [];
  const state: Record<string, unknown> = { shadowBlur: 0 };
  const target: Record<string, unknown> = {
    measureText: (text: string) => ({ width: text.length * 10 }),
    createRadialGradient: () => ({ addColorStop: () => {} }),
  };
  const context = new Proxy(target, {
    get: (object, key: string) => object[key] ?? (key in state ? state[key] : (...args: unknown[]) => { calls.push({ name: key, args, shadowBlur: state.shadowBlur as number }); }),
    set: (_, key: string, value) => { state[key] = value; return true; },
  });
  return { context: context as unknown as CanvasRenderingContext2D, calls };
}
export const fakePath = (data: string) => data as unknown as Path2D;
export const COLORS: ChaosColors = {
  ground: "#120910", wall: "#22182f", accent: "#d123a0", accentText: "#ff5ccb", accent2: "#09d0fe", violet: "#502a5f", violetLight: "#986ea9", lilac: "#d39dd4",
  textColor: "#ffffff", mutedColor: "#b8a6c4", scribbles: ["#d123a0", "#09d0fe", "#986ea9", "#d39dd4"],
};

// Scribbles: one stroke per path; only neon marks glow
const marks = layoutScribbles(3, 120, { x: 0.3, y: 0.3, width: 0.4, height: 0.4 }, true);
const scribbled = recorder();
paintScribbles(scribbled.context, marks, COLORS, 1, 0.6, 1, fakePath);
const strokes = scribbled.calls.filter(call => call.name === "stroke");
assert.equal(strokes.length, marks.reduce((sum, mark) => sum + mark.paths.length, 0));
assert.ok(strokes.some(call => call.shadowBlur > 0) && strokes.some(call => call.shadowBlur === 0));

// Takes: a rough take is drawn in pixels (no scaling by the mark), its fill strokes thinner than its outline
const rough = recorder();
paintScribbles(rough.context, marks.slice(0, 1), COLORS, 1, 0.6, 1, fakePath, () => ({ rough: true, parts: [{ d: "M0 0", filled: false }, { d: "M1 1", filled: true }] }));
assert.deepEqual(rough.calls.find(call => call.name === "scale")!.args, [1, 1]);
assert.deepEqual(rough.calls.filter(call => call.name === "stroke").map(call => call.args[0]), ["M0 0", "M1 1"]);

// Painted brush: the body filled with glow, every bristle stroked; nothing before the brush starts
const brush = makeBrush({ from: [100, 500], to: [900, 500], width: 200 }, 2);
const frame = brushAt(brush, 1);
const painted = recorder();
paintBrushFrame(painted.context, frame, COLORS.accent2, COLORS.textColor, 0.6);
const fills = (calls: Call[]) => calls.filter(call => call.name === "fill");
assert.equal(fills(painted.calls).length, 1);
assert.ok(fills(painted.calls)[0].shadowBlur > 0);
assert.equal(painted.calls.filter(call => call.name === "stroke").length, frame.bristles.length);
const unpainted = recorder();
paintBrushFrame(unpainted.context, brushAt(brush, 0), COLORS.accent2, COLORS.textColor, 0.6);
assert.equal(unpainted.calls.filter(call => call.name === "fill" || call.name === "stroke").length, 0);

// Drips: none right as the brush passes, all of them once they ran
const dripping = (since: number) => {
  const calls = recorder();
  paintBrushDrips(calls.context, brush, COLORS.accent2, since, fakePath);
  return fills(calls.calls).length;
};
assert.equal(dripping(0), 0);
assert.equal(dripping(Infinity), brush.drips.length);

// Mist: one dot per visible particle, none after the life
const burst = { origin: { x: 0, y: 0 }, direction: 0, spread: 1, speed: [10, 20] as const, gravity: 0, drag: 0, life: 1 };
const misty = (time: number) => {
  const calls = recorder();
  paintMist(calls.context, burstAt(4, 12, time, burst), COLORS.accent);
  return calls.calls.filter(call => call.name === "fillRect").length;
};
assert.equal(misty(0.3), 12);
assert.equal(misty(2), 0);

// Sprayed text: centered on x, the width comes back
const sprayed = recorder();
const width = paintSpray(sprayed.context, { text: "CHAOS", x: 960, y: 540, size: 160, font: "Permanent Marker", color: COLORS.accentText, glowColor: COLORS.accent, glow: 0.6, seed: 1, drips: true }, fakePath);
assert.equal(width, 50);
assert.deepEqual(sprayed.calls.find(call => call.name === "fillText")!.args, ["CHAOS", 935, 540]);

// Wall: ground, every blotch and every dot
const walled = recorder();
paintWall(walled.context, 1920, 1080, COLORS, blotches(1, 4), dust(1, 50), 1);
assert.equal(walled.calls.filter(call => call.name === "fillRect").length, 1 + 4 + 50);

console.log("chaos paint ok");
