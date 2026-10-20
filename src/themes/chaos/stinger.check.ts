// Check for stinger.ts: the wall is closed at the transition point and gone at the start and the end, the text flares up
// at the cut, and the same time gives the same drawing. A recording mock canvas stands in for the browser. Runs with
// npm test.
import assert from "node:assert/strict";
import { COLORS, fakePath, recorder } from "./paint.check.ts";
import { makeChaosStinger, stingerCover, type ChaosStingerOptions } from "./stinger.ts";

const options: ChaosStingerOptions = {
  duration: 1.4, cut: 0.7, text: "CHAOS", titleFont: "Permanent Marker", colors: COLORS, glow: 0.6, drips: true, scribbleCount: 80, scribbleWidth: 1, swathDensity: 30,
};

// Cover: open at the start, closed (half the width from each side) at the cut, torn away at the end
assert.deepEqual(stingerCover(0, options.cut, options.duration), { reach: 0, open: 0 });
assert.deepEqual(stingerCover(options.cut, options.cut, options.duration), { reach: 0.5, open: 0 });
assert.equal(stingerCover(options.duration, options.cut, options.duration).open, 1);
assert.ok(stingerCover(options.cut / 2, options.cut, options.duration).reach < 0.5);

// Nothing is drawn at the start and the end, only the clear
const draw = makeChaosStinger(options, fakePath);
for (const time of [0, options.duration]) {
  const empty = recorder();
  draw(empty.context, time);
  assert.deepEqual(empty.calls.map(call => call.name), ["clearRect"], `t = ${time}`);
}

// At the cut the wall is drawn and the text is sprayed in the middle
const atCut = recorder();
draw(atCut.context, options.cut);
assert.ok(atCut.calls.some(call => call.name === "clip"));
assert.ok(atCut.calls.some(call => call.name === "fillText" && call.args[0] === "CHAOS"));

// Deterministic: the same time twice gives the same calls
const again = recorder();
draw(again.context, options.cut);
assert.deepEqual(again.calls, atCut.calls);

console.log("chaos stinger ok");
