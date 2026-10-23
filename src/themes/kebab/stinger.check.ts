// Check for stinger.ts (and the canvas ink of clipInk.ts): both styles draw at every time, the paper stands whole and
// without a shadow at the cut, the knife style covers the picture with slices at the cut, the badge only shows from
// its start, and the same look draws the same picture twice. Exports the recording canvas for the other clip checks.
// Runs with npm test.
import assert from "node:assert/strict";
import { makeStinger, type StingerLook } from "./stinger.ts";

// Path2D does not exist in Node: a stand-in that keeps its path data
class FakePath {
  readonly data: string;
  constructor(data = "") {
    this.data = data;
  }
}
(globalThis as { Path2D?: unknown }).Path2D ??= FakePath;

// A canvas context that records every call and every property set; text is 10 px per letter wide
export function recorder() {
  const calls: string[] = [];
  const show = (value: unknown) => (value instanceof FakePath ? `path(${value.data.length})` : typeof value === "number" ? value.toFixed(3) : String(value));
  const target: Record<string, unknown> = { measureText: (text: string) => ({ width: text.length * 10 }) };
  const context = new Proxy(target, {
    get: (object, key: string) => object[key] ?? ((...args: unknown[]) => { calls.push(`${key}(${args.map(show).join(",")})`); }),
    set: (_, key: string, value) => { calls.push(`${key}=${show(value)}`); return true; },
  });
  return { context: context as unknown as CanvasRenderingContext2D, calls };
}

export const INK = { roughness: 0.55, bowing: 0.6, width: 1, seed: 11 };
const look = (style: StingerLook["style"]): StingerLook => ({
  style, text: "DÖNER KEBAB", duration: 1.6, cut: 0.8, jag: 4, slices: 9, shavings: true, seed: 7, titleFont: "Titan One", ink: INK,
  colors: { red: "#f85449", redText: "#c8261b", paper: "#fff8ec", brown: "#3a1a12" },
});
const draw = (style: StingerLook["style"], time: number, own: Partial<StingerLook> = {}) => {
  const canvas = recorder();
  makeStinger({ ...look(style), ...own })(canvas.context, time);
  return canvas.calls;
};

for (const style of ["papier", "messer"] as const) {
  for (const time of [0, 0.3, 0.8, 1.2, 1.6]) assert.ok(draw(style, time).length > 0, `${style} at ${time}`);
  // Same look, same picture
  assert.deepEqual(draw(style, 0.7), draw(style, 0.7), style);
}

// Papier: at the cut one sheet of paper without a shadow; folding flaps and flying halves cast one
const cut = draw("papier", 0.8);
assert.ok(!cut.some(call => call.startsWith("shadowBlur")), "no seam: no shadow at the cut");
assert.ok(cut.includes("lineTo(1920.000,0.000)") && cut.includes("lineTo(0.000,1080.000)"), "the whole picture");
assert.ok(draw("papier", 0.3).some(call => call.startsWith("shadowBlur=18")));
assert.ok(draw("papier", 1.2).some(call => call.startsWith("shadowBlur=22")));
// A longer clip draws its cut like the drawing does at 0.8
assert.deepEqual(draw("papier", 1.5, { duration: 3, cut: 1.5 }), cut);

// The badge: no letters before they start, all of them at the cut
const letters = (calls: string[]) => calls.filter(call => call.startsWith("fillText(")).length;
assert.equal(letters(draw("papier", 0.5)), 0);
assert.equal(letters(cut), "DÖNERKEBAB".length);

// Messer: every slice fills the full width at the cut; without shavings no curves
const slices = draw("messer", 0.8);
assert.equal(slices.filter(call => call === "fillRect(0.000,0.000,1920.000,122.000)").length, 9);
assert.equal(draw("messer", 0.8, { slices: 4 }).filter(call => call === "fillRect(0.000,0.000,1920.000,272.000)").length, 4);
const curves = (calls: string[]) => calls.filter(call => call.startsWith("quadraticCurveTo")).length;
assert.ok(curves(draw("messer", 0.5)) > 0);
assert.equal(curves(draw("messer", 0.5, { shavings: false })), 0);

console.log("kebab stinger ok");
