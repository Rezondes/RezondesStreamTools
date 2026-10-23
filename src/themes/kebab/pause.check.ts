// Check for pause.ts: the tea arm holds the glass, the knife lies on the counter, the sign hangs from the spit bar.
// Runs with npm test.
import assert from "node:assert/strict";
import { GRID, pathPoints } from "./chef.ts";
import { COUNTER_Y, GLASS_TOP, pauseParts, SIGN } from "./pause.ts";

const parts = pauseParts();
const points = (outline: string) => pathPoints(outline);

// Every point lies in the grid
for (const part of Object.values(parts)) {
  for (const line of part.lines) if (line.shape.kind === "path") for (const point of points(line.shape.d)) assert.ok(point.x >= 0 && point.x <= GRID.width && point.y >= 0 && point.y <= GRID.height);
}

// The knife lies on the counter: its lowest point is the counter line or just above it
const knifeY = points(parts.knife.fills[0]).map(point => point.y);
assert.ok(Math.max(...knifeY) <= COUNTER_Y && Math.max(...knifeY) >= COUNTER_Y - 2, "on the counter");

// The glass stands on the hand of the arm (its bottom at the height of the hand) and its top is where the steam starts
const glassY = points(parts.glass.fills[0]).map(point => point.y);
const glassX = points(parts.glass.fills[0]).map(point => point.x);
assert.ok(Math.max(...glassY) >= 376 && Math.max(...glassY) <= 390, "the glass sits on the hand");
assert.ok(Math.min(...glassX) >= 214 && Math.max(...glassX) <= 250, "above the hand of the arm");
assert.equal(Math.min(...glassY) - 4, GLASS_TOP.y);

// The sign hangs below its hook on the spit bar
assert.ok(SIGN.y > SIGN.hook.y && SIGN.x >= SIGN.hook.x);
assert.equal(parts.sign.dots[0].x, SIGN.hook.x);

console.log("kebab pause ok");
