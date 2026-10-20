// Check for paint.ts: scribbles stroke every path with glow only on neon lines, a brush fills its body and drips only when
// switched on, swathes fill tongues and stroke streaks, sprayed text is centered and returns its width. A recording mock
// canvas stands in for the browser. Runs with npm test.
import assert from "node:assert/strict";
import { chance } from "./chance.ts";
import { paintBrush, paintScribbles, paintSpray, paintSwath, paintWall, type ChaosColors } from "./paint.ts";
import { layoutScribbles } from "./scribbles.ts";
import { brushStroke } from "./strokes.ts";
import { swathes } from "./swathes.ts";
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

// Brush: body filled with glow, drips only when switched on
const brush = brushStroke([100, 500], [900, 500], 200, chance(2));
const withDrips = recorder();
paintBrush(withDrips.context, brush, COLORS.accent2, COLORS.textColor, 0.6, true, fakePath);
const withoutDrips = recorder();
paintBrush(withoutDrips.context, brush, COLORS.accent2, COLORS.textColor, 0.6, false, fakePath);
const fills = (calls: Call[]) => calls.filter(call => call.name === "fill").length;
assert.equal(fills(withDrips.calls) - fills(withoutDrips.calls), brush.drips.length);
assert.ok(withDrips.calls.find(call => call.name === "fill")!.shadowBlur > 0);

// Swathes: every tongue filled, every streak stroked
const swath = swathes("left", 4, 30);
const swathed = recorder();
paintSwath(swathed.context, swath, COLORS, 0.6, fakePath);
assert.equal(fills(swathed.calls), swath.tongues.length);
assert.equal(swathed.calls.filter(call => call.name === "stroke").length, swath.streaks.length);

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
