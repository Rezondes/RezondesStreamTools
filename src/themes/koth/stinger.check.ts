// Check for stinger.ts of the KOTH theme: at the transition point the smoke covers the whole picture and the flag changes
// color there, at the start and end nothing is visible, the same time gives the same draw commands. A mock canvas records
// everything. Runs with npm test.
import assert from "node:assert/strict";
import { drawKothStinger, HEIGHT, WIDTH, type KothStingerOptions } from "./stinger.ts";

function recorder() {
  const calls: unknown[][] = [];
  const target: Record<string, unknown> = { measureText: () => ({ width: 10 }) };
  const context = new Proxy(target, {
    get: (object, key: string) => object[key] ?? ((...args: unknown[]) => { calls.push([key, ...args]); }),
    set: (_, key: string, value) => { calls.push([`set ${key}`, value]); return true; },
  });
  const rects = () => calls.filter(call => call[0] === "fillRect").map(call => call.slice(1) as number[]);
  const fills = () => calls.filter(call => call[0] === "set fillStyle").map(call => call[1]);
  return { context: context as unknown as CanvasRenderingContext2D, calls, rects, fills };
}

const options: KothStingerOptions = {
  duration: 1.6, cut: 0.8, flag: true, text: "KOTH", font: "Black Ops One",
  smoke: "#9ea3a0", flags: ["#2f6fd6", "#d63a2f"], pole: "#3c4146", textColor: "#f2f0e6",
};

// At the transition point: one area over the whole picture, the text and the flag in the second color
const atCut = recorder();
drawKothStinger(atCut.context, options.cut, options);
assert.ok(atCut.rects().some(([x, y, width, height]) => x <= 0 && x + width >= WIDTH && y <= 0 && height >= HEIGHT));
assert.ok(atCut.calls.some(call => call[0] === "fillText" && call[1] === "KOTH"));
assert.ok(atCut.fills().includes("#d63a2f"));

// Shortly before: smoke puffs, the flag still in the first color
const before = recorder();
drawKothStinger(before.context, options.cut * 0.7, options);
assert.ok(before.calls.some(call => call[0] === "arc"));
assert.ok(before.fills().includes("#2f6fd6"));

// Without flag change no flag
const plain = recorder();
drawKothStinger(plain.context, options.cut, { ...options, flag: false });
assert.ok(!plain.fills().includes("#d63a2f"));

// Nothing at the start and at the end
for (const time of [0, options.duration]) {
  const empty = recorder();
  drawKothStinger(empty.context, time, options);
  assert.ok(!empty.calls.some(call => call[0] === "arc" || call[0] === "fillRect" || call[0] === "fillText"), `t = ${time}`);
}

// Same time, same draw commands (no randomness)
const first = recorder();
const second = recorder();
drawKothStinger(first.context, 0.37, options);
drawKothStinger(second.context, 0.37, options);
assert.deepEqual(first.calls, second.calls);

console.log("koth stinger ok");
