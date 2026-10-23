// Check for slices.ts: the slices cover the picture at the cut (the lowest came first), they fall after it; the knife
// crosses the picture; shavings live only after they left the blade. Runs with npm test.
import assert from "node:assert/strict";
import { knifeAt, shavingsOffKnife, SLICE, sliceAt, sliceHeight } from "./slices.ts";

// At the cut every slice lies in place without a gap
for (let row = 0; row < 9; row++) assert.deepEqual(sliceAt(row, 9, 0.8, 7), { x: 0, y: 0, turn: 0 }, `row ${row}`);
assert.equal(sliceHeight(9) * 9, 1080);
assert.equal(sliceHeight(0), 1080);

// The lowest slice comes first
assert.ok(sliceAt(8, 9, 0.3, 7).x > sliceAt(0, 9, 0.3, 7).x);
assert.equal(sliceAt(0, 9, 0, 7).x, SLICE.from);

// After the cut they fall, each with its own turn
const late = sliceAt(4, 9, 1.6, 7);
assert.ok(late.y > 0 && late.turn !== 0);

// The knife starts outside at the bottom left and ends outside at the top right
assert.ok(knifeAt(0).x < 0 && knifeAt(0).y > 1080);
assert.ok(knifeAt(1).x > 1920 - 1500 && knifeAt(1).y < 0);

// Shavings: none before the first leaves the blade, some while it cuts, gone at the end
assert.equal(shavingsOffKnife(0, 60, 7).length, 0);
assert.ok(shavingsOffKnife(0.4, 60, 7).length > 10);
assert.equal(shavingsOffKnife(3, 60, 7).length, 0);
assert.deepEqual(shavingsOffKnife(0.4, 60, 7), shavingsOffKnife(0.4, 60, 7));

console.log("kebab slices ok");
