// Check for stinger.ts: the transition covers everything at the transition point and is empty at the start and end.
// A mock canvas counts the filled rectangles. Runs with npm test.
import assert from "node:assert/strict";
import { effectiveSettings } from "../../core/settings.ts";
import { type MatrixValues, matrixSettings } from "./settings.ts";
import { HEIGHT, WIDTH, drawStinger, type StingerOptions, stingerOptions } from "./stinger.ts";

// The look of the default settings
const defaults = stingerOptions(effectiveSettings(matrixSettings, {}) as MatrixValues);

function recorder() {
  const rects: number[][] = [];
  const target: Record<string, unknown> = {
    fillRect: (...args: number[]) => rects.push(args),
    measureText: () => ({ width: 10 }),
  };
  const context = new Proxy(target, {
    get: (object, key: string) => object[key] ?? (() => {}),
    set: (object, key: string, value) => { object[key] = value; return true; },
  });
  return { context: context as unknown as CanvasRenderingContext2D, rects };
}

const options: StingerOptions = {
  duration: 2, cut: 1, fall: 0.42, column: 24, text: "> TEST", cursor: "_", showLogo: true, logo: "AB\nCD", glyphs: "01", font: "VT323",
  background: "#000000", accent: "#39ff14", dim: "#1e9e0f", flash: "#d8ffcc", look: defaults.look,
};
const columns = WIDTH / options.column;
const fullColumns = (rects: number[][]) => rects.filter(([, y, width, height]) => y === 0 && width === options.column && height === HEIGHT).length;

// At the transition point every column is black over the full height
const atCut = recorder();
drawStinger(atCut.context, options.cut, options);
assert.equal(fullColumns(atCut.rects), columns);

// Nothing is drawn at the start and at the end
for (const time of [0, options.duration]) {
  const empty = recorder();
  drawStinger(empty.context, time, options);
  assert.deepEqual(empty.rects, [], `t = ${time}`);
}

// Colors and the font follow the theme until set: an own background for the stinger only
assert.equal(defaults.background, "#000000");
assert.equal(stingerOptions(effectiveSettings(matrixSettings, { stingerBackground: "#123456" }) as MatrixValues).background, "#123456");
assert.equal(defaults.look.logo.size, 44, "the logo size of the settings");

console.log("stinger ok");
