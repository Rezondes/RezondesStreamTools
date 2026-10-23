// Check for awning.ts: stripes fill the width and alternate, the edge has one scallop per stripe and stays in the box.
// Runs with npm test.
import assert from "node:assert/strict";
import { AWNING_BOX, awning } from "./awning.ts";
import { pathPoints } from "./chef.ts";

const eight = awning(8);
assert.equal(eight.stripes.length, 8);
assert.deepEqual(eight.stripes.map(stripe => stripe.red), [true, false, true, false, true, false, true, false]);
assert.equal(eight.stripes.reduce((sum, stripe) => sum + stripe.width, 0), AWNING_BOX.width);
assert.equal((eight.edge.match(/Q/g) ?? []).length, 8);
assert.ok(eight.edge.endsWith("Z"));
for (const point of pathPoints(eight.edge)) assert.ok(point.x >= 0 && point.x <= AWNING_BOX.width && point.y >= 0 && point.y <= AWNING_BOX.height);
assert.equal(awning(0).stripes.length, 1, "at least one stripe");

console.log("kebab awning ok");
