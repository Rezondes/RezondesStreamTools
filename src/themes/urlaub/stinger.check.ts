// Check for stinger.ts of the Urlaub theme: at the transition point the wave covers the whole picture, at the start and end
// nothing is visible, the same time gives the same draw commands. A mock canvas records everything.
// Runs with npm test.
import assert from "node:assert/strict";
import { drawUrlaubStinger, HEIGHT, WIDTH, type UrlaubStingerOptions } from "./stinger.ts";

function recorder() {
  const calls: unknown[][] = [];
  const target: Record<string, unknown> = { measureText: () => ({ width: 10 }) };
  const context = new Proxy(target, {
    get: (object, key: string) => object[key] ?? ((...args: unknown[]) => { calls.push([key, ...args]); }),
    set: (_, key: string, value) => { calls.push([`set ${key}`, value]); return true; },
  });
  const rects = () => calls.filter(call => call[0] === "fillRect").map(call => call.slice(1) as number[]);
  return { context: context as unknown as CanvasRenderingContext2D, calls, rects };
}

const options: UrlaubStingerOptions = {
  duration: 1.4, cut: 0.7, waves: 3, foam: true, palm: true, text: "Strand", font: "Pacifico",
  sea: "#1fb5c9", seaDeep: "#0b6f8e", foamColor: "#f4fffd", textColor: "#ffffff", palmColor: "#3b2412",
};

// At the transition point: one area over the whole picture, plus the text
const atCut = recorder();
drawUrlaubStinger(atCut.context, options.cut, options);
assert.ok(atCut.rects().some(([x, y, width, height]) => x <= 0 && x + width >= WIDTH && y <= 0 && height >= HEIGHT));
assert.ok(atCut.calls.some(call => call[0] === "fillText" && call[1] === "Strand"));

// No area and no text at the start and at the end
for (const time of [0, options.duration]) {
  const empty = recorder();
  drawUrlaubStinger(empty.context, time, options);
  assert.deepEqual(empty.rects().filter(([, , width]) => width > 0), [], `t = ${time}`);
  assert.ok(!empty.calls.some(call => call[0] === "fillText"), `t = ${time}`);
}

// Same time, same draw commands (no randomness)
const first = recorder();
const second = recorder();
drawUrlaubStinger(first.context, 0.37, options);
drawUrlaubStinger(second.context, 0.37, options);
assert.deepEqual(first.calls, second.calls);

console.log("urlaub stinger ok");
