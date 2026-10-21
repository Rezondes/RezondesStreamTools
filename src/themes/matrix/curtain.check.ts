// Check for curtain.ts: the curtain stops at the bottom edge of the box and is empty once the box is on; in the
// dissolve every cell falls once, the bottom rows first, and all are gone at the end. Runs with npm test.
import assert from "node:assert/strict";
import { cellLife, curtainAt, curtainLength, dissolveAt } from "./curtain.ts";

const area = { width: 860, height: 260 };

// Vorhang endet an der Box: no glyph below the bottom edge at any time, none after the curtain
for (let step = 0; step <= 40; step++) {
  for (const glyph of curtainAt(area, 22, step / 40, 1, 3)) assert.ok(glyph.y <= area.height && glyph.y >= 0, `t = ${step / 40}`);
}
assert.ok(curtainAt(area, 22, 0.3, 1, 3).length > 0);
assert.deepEqual(curtainAt(area, 22, curtainLength(1), 1, 3), []);
assert.ok(curtainLength(2) < curtainLength(1));

// Zerfall: bottom rows start earlier, each cell's fall ends exactly at the duration, nothing is left after it
const rows = 12;
assert.ok(cellLife(rows - 1, rows, 1, 0.5).start < cellLife(0, rows, 1, 0.5).start);
for (let row = 0; row < rows; row++) {
  const life = cellLife(row, rows, 1, 0.3);
  assert.ok(Math.abs(life.start + life.length - 1) < 1e-9);
}
const cells = Math.ceil(area.width / 22) * Math.ceil(area.height / 22);
assert.equal(dissolveAt(area, 22, 0, 1, 3).length, cells);
assert.deepEqual(dissolveAt(area, 22, 1, 1, 3), []);
// A falling cell only goes down
const early = dissolveAt(area, 22, 0.6, 1, 3);
const late = dissolveAt(area, 22, 0.7, 1, 3);
const sample = late.find(glyph => early.some(other => other.key === glyph.key))!;
assert.ok(sample.y >= early.find(other => other.key === sample.key)!.y);

console.log("matrix curtain ok");
