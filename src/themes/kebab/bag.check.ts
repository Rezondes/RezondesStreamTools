// Check for bag.ts: the bag and its print lie in the box, the outline is closed, the zigzag runs across the top.
// Runs with npm test.
import assert from "node:assert/strict";
import { BAG_BOX, BAG_TEXT, bagParts } from "./bag.ts";
import { pathPoints } from "./chef.ts";

const parts = bagParts();
for (const part of [parts.bag, parts.print]) {
  for (const line of part.lines) {
    if (line.shape.kind !== "path") continue;
    for (const point of pathPoints(line.shape.d)) assert.ok(point.x >= 0 && point.x <= BAG_BOX.width && point.y >= 0 && point.y <= BAG_BOX.height);
  }
}
// The outline of the bag is closed and filled with paper
assert.ok(parts.bag.fills[0].endsWith("Z"));
// The zigzag spans the top edge from left to right
const zigzag = parts.bag.lines[1].shape;
assert.ok(zigzag.kind === "path");
const xs = pathPoints(zigzag.d).map(point => point.x);
assert.equal(Math.min(...xs), 44);
assert.ok(Math.max(...xs) >= 344);
// The name fits between the side folds at its height (they stand at x 62 and 338 near the bottom)
assert.ok(BAG_TEXT.nameWidth <= 338 - 62);

console.log("kebab bag ok");
