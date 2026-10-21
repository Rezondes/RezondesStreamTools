// Check for rain.ts: columns follow from the seed, the head grows with the time and starts again at the top, before
// its start a column is empty; glyphs change more often at the tip than in the trail. Runs with npm test.
import assert from "node:assert/strict";
import { glyphAt, headAt, rainColumns } from "./rain.ts";

const options = { seed: 7, width: 1920, density: 1 };

// Spalten: same seed, same columns; another seed, other columns; density 0 empties the layer
assert.deepEqual(rainColumns(1, 24, options), rainColumns(1, 24, options));
assert.notDeepEqual(rainColumns(1, 24, options), rainColumns(1, 24, { ...options, seed: 8 }));
assert.equal(rainColumns(0, 15, { ...options, density: 0 }).length, 0);
assert.ok(rainColumns(2, 36, options).length < rainColumns(0, 15, options).length);

const [column] = rainColumns(2, 36, options);
assert.equal(headAt(column, 36, 1080, column.start - 0.1), null);
const early = headAt(column, 36, 1080, column.start + 0.5)!;
const later = headAt(column, 36, 1080, column.start + 1.5)!;
assert.ok(later.row > early.row);
// After one full run the head is back at the top
const span = (1080 + column.trail * 36) / column.speed;
const again = headAt(column, 36, 1080, column.start + span + 0.01)!;
assert.equal(again.run, 1);
assert.ok(again.row <= 1);

// Zeichenwechsel: over one second the tip changes more often than the trail; same input, same glyph
const changes = (behind: number) => {
  let count = 0;
  for (let step = 1; step <= 100; step++) {
    if (glyphAt(7, column, 5, behind, step / 100, 60, { tip: 14, trail: 3 }) !== glyphAt(7, column, 5, behind, (step - 1) / 100, 60, { tip: 14, trail: 3 })) count++;
  }
  return count;
};
assert.ok(changes(0) > changes(10));
assert.equal(glyphAt(7, column, 5, 2, 0.4, 60, { tip: 14, trail: 3 }), glyphAt(7, column, 5, 2, 0.4, 60, { tip: 14, trail: 3 }));

console.log("matrix rain ok");
