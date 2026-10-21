// Check for stinger.ts: the wall wipes in from the left, covers the picture at the transition point and wipes out to the
// right, the text is sprayed on at the cut, the scribbles boil through their takes, and the same time gives the same
// drawing. A recording mock canvas stands in for the browser. Runs with npm test.
import assert from "node:assert/strict";
import { COLORS, fakePath, recorder } from "./paint.check.ts";
import { scribbleTakes } from "./roughScribbles.ts";
import { HEIGHT, makeChaosStinger, stingerEdges, stingerText, WIDTH, type ChaosStingerOptions } from "./stinger.ts";

const options: ChaosStingerOptions = {
  duration: 1.4, cut: 0.7, text: "CHAOS", textSize: 260, titleFont: "Permanent Marker", colors: COLORS, glow: 0.6, drips: true, scribbleCount: 80, scribbleWidth: 1,
  rough: { share: 0.35, fill: true }, boilFps: 8,
};
const { cut, duration } = options;

// Edges: both outside on the left at the start, the enter edge right outside before the cut, both right outside at the end
assert.deepEqual(stingerEdges(0, cut, duration), { enter: 0, exit: 0 });
assert.deepEqual(stingerEdges(cut, cut, duration), { enter: 1, exit: 0 });
assert.deepEqual(stingerEdges(duration, cut, duration), { enter: 1, exit: 1 });
const half = stingerEdges(cut / 2, cut, duration).enter;
assert.ok(half > 0 && half < 1);
// The wall only moves forward: the exit starts after the cut
assert.equal(stingerEdges(cut + 0.05, cut, duration).exit, 0);

// The text: not there at the start, fully sprayed on at the cut
assert.equal(stingerText(0, cut), 0);
assert.equal(stingerText(cut, cut), 1);

// Nothing is drawn at the start and the end, only the clear
const draw = makeChaosStinger(options, fakePath);
for (const time of [0, duration]) {
  const empty = recorder();
  draw(empty.context, time);
  assert.deepEqual(empty.calls.map(call => call.name), ["clearRect"], `t = ${time}`);
}

// At the cut the wall is drawn and the text is sprayed in the middle
const atCut = recorder();
draw(atCut.context, cut);
assert.ok(atCut.calls.some(call => call.name === "clip"));
assert.ok(atCut.calls.some(call => call.name === "fillText" && call.args[0] === "CHAOS"));

// gedeckt am Übergang: at the cut the clipped wall reaches past both sides of the picture over its whole height
const outline = atCut.calls.slice(0, atCut.calls.findIndex(call => call.name === "clip")).filter(call => call.name === "moveTo" || call.name === "lineTo").map(call => call.args as [number, number]);
const middle = outline.length / 2;
assert.ok(outline.slice(0, middle).every(([x]) => x <= 0), "left edge outside");
assert.ok(outline.slice(middle).every(([x]) => x >= WIDTH), "right edge outside");
assert.ok(outline.some(([, y]) => y <= 0) && outline.some(([, y]) => y >= HEIGHT), "whole height");

// The painted edge strokes and their mist show while the wall moves
const moving = recorder();
draw(moving.context, cut / 2);
assert.ok(moving.calls.some(call => call.name === "fill" && call.shadowBlur > 0));
assert.ok(moving.calls.filter(call => call.name === "fillRect").length > 1800);

// Boiling: with Rough takes the scribbles change between two frames a boil step apart, standing still without boilFps
const strokesAt = (stinger: ReturnType<typeof makeChaosStinger>, time: number) => {
  const calls = recorder();
  stinger(calls.context, time);
  return calls.calls.filter(call => call.name === "stroke").map(call => call.args[0]);
};
const boiling = makeChaosStinger(options, fakePath, scribbleTakes);
assert.notDeepEqual(strokesAt(boiling, cut), strokesAt(boiling, cut + 1 / 8));
const still = makeChaosStinger({ ...options, boilFps: 0 }, fakePath, scribbleTakes);
assert.deepEqual(strokesAt(still, cut), strokesAt(still, cut + 1 / 8));

// Deterministic: the same time twice gives the same calls
const again = recorder();
draw(again.context, cut);
assert.deepEqual(again.calls, atCut.calls);

console.log("chaos stinger ok");
