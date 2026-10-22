// Check for stinger.ts of the standard theme: at the transition point the stripes cover the whole picture, at the start and end
// nothing is visible. A mock canvas counts the filled areas. Runs with npm test.
import assert from "node:assert/strict";
import { drawStandardStinger, HEIGHT, WIDTH, type StandardStingerOptions } from "./stinger.ts";

function recorder() {
  const rects: number[][] = [];
  const texts: number[][] = [];
  const target: Record<string, unknown> = {
    fillRect: (...args: number[]) => rects.push(args),
    fillText: (_text: string, ...args: number[]) => texts.push(args),
    measureText: () => ({ width: 10 }),
    createLinearGradient: () => ({ addColorStop: () => {} }),
    createRadialGradient: () => ({ addColorStop: () => {} }),
  };
  const context = new Proxy(target, {
    get: (object, key: string) => object[key] ?? (() => {}),
    set: (object, key: string, value) => { object[key] = value; return true; },
  });
  return { context: context as unknown as CanvasRenderingContext2D, rects, texts };
}

const lights = { seed: 7, count: 4, loop: 24, accent: "#7c5cff", accent2: "#22d3ee", strength: 0.7, dust: 20 };
const options: StandardStingerOptions = { duration: 1.2, cut: 0.6, panels: 3, text: "REZONDES", font: "Inter", accent: "#7c5cff", accent2: "#22d3ee", textColor: "#ffffff", background: "#0b0b12", lights };

// At the transition point: every stripe over the full width, together at least the full height (1 px overlap)
const atCut = recorder();
drawStandardStinger(atCut.context, options.cut, options);
const stripes = atCut.rects.filter(([x, , width]) => x <= 0 && x + width >= WIDTH);
assert.equal(stripes.length, options.panels);
assert.ok(stripes.reduce((sum, [, , , height]) => sum + height, 0) >= HEIGHT);

// No area at the start and at the end
for (const time of [0, options.duration]) {
  const empty = recorder();
  drawStandardStinger(empty.context, time, options);
  assert.deepEqual(empty.rects.filter(([, , width]) => width > 0), [], `t = ${time}`);
}

// Every position from seed and time: the same frame twice gives the same areas
const again = recorder();
drawStandardStinger(again.context, 0.4, options);
const once = recorder();
drawStandardStinger(once.context, 0.4, options);
assert.deepEqual(again.rects, once.rects);

// The text rises at the transition point: a little before it sits lower than at it
const before = recorder();
drawStandardStinger(before.context, options.cut - 0.1, options);
assert.ok(before.texts[0][1] > atCut.texts[0][1], "the text rises into place");

console.log("standard stinger ok");
