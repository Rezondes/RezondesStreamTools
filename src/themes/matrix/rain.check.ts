// Check for rain.ts: columns follow from the seed, the head grows with the time and starts again at the top, before
// its start a column is empty; glyphs change more often at the tip than in the trail. Runs with npm test.
import assert from "node:assert/strict";
import { effectiveSettings } from "../../core/settings.ts";
import { glyphAt, headAt, rainColumns, rainLookOf, rainTime } from "./rain.ts";
import { type MatrixValues, matrixSettings } from "./settings.ts";

const look = rainLookOf(effectiveSettings(matrixSettings, {}) as MatrixValues);
const options = { seed: 7, width: 1920, density: 1, look };
const change = { tip: 14, trail: 3, tipCells: 3 };

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
    if (glyphAt(7, column, 5, behind, step / 100, 60, change) !== glyphAt(7, column, 5, behind, (step - 1) / 100, 60, change)) count++;
  }
  return count;
};
assert.ok(changes(0) > changes(10));
assert.equal(glyphAt(7, column, 5, 2, 0.4, 60, change), glyphAt(7, column, 5, 2, 0.4, 60, change));

// Look from the settings: the layers as before by default, a faster near layer, no empty columns at all
assert.deepEqual(look.layers[0], { alpha: 0.32, speed: [70, 140], trail: [10, 26], empty: 0.15 });
const fast = { ...look, layers: [look.layers[0], look.layers[1], { ...look.layers[2], speed: [900, 900], empty: 0 }] as const };
assert.ok(rainColumns(2, 36, { ...options, look: fast }).every(item => item.speed === 900));
assert.ok(rainColumns(2, 36, { ...options, look: fast }).length > rainColumns(2, 36, options).length);

// Tempo ohne Sprung: the rain time grows steadily through every change of speed and is faster while pulling
const tempo = { base: 0.35, pulls: { every: 6, length: 0.8, boost: 1 } };
for (let step = 0; step < 2000; step++) {
  const time = step / 100;
  const next = rainTime(time + 0.001, tempo) - rainTime(time, tempo);
  assert.ok(next > 0 && next <= 0.001 * 1 + 1e-9, `t = ${time}`);
}
assert.ok(rainTime(6.8, tempo) - rainTime(6, tempo) > rainTime(5.8, tempo) - rainTime(5, tempo));
assert.equal(rainTime(4, { base: 2 }), 8);

console.log("matrix rain ok");
