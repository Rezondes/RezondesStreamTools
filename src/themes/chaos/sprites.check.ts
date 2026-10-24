// Check of sprites.ts: the slice fit of the viewBox, the pixel exact box of a take with its filter region, the reach of
// a filter
import assert from "node:assert/strict";
import { filterReach, packAtlases, sliceFit, spriteBox } from "./sprites.ts";

const view = { x: 0, y: 0, width: 1920, height: 1080 };
assert.deepEqual(sliceFit(view, { width: 1920, height: 1080 }), { scale: 1, x: 0, y: 0 }, "same size");
assert.deepEqual(sliceFit(view, { width: 960, height: 540 }), { scale: 0.5, x: 0, y: 0 }, "half size");
assert.deepEqual(sliceFit(view, { width: 1080, height: 1080 }), { scale: 1, x: -420, y: 0 }, "a square cuts the sides");
assert.deepEqual(sliceFit({ x: 100, y: 0, width: 100, height: 100 }, { width: 200, height: 400 }), { scale: 4, x: -500, y: 0 }, "a viewBox that does not start at 0");

assert.deepEqual(spriteBox({ x: 100, y: 50, width: 40, height: 20 }, 0.5, 1), { x: 80, y: 40, width: 80, height: 40 }, "the region of the filter");
const odd = spriteBox({ x: 10.3, y: 0, width: 5, height: 5 }, 0, 2);
assert.deepEqual(odd, { x: 10, y: 0, width: 5.5, height: 5 }, "rounded out to whole pixels");
assert.deepEqual(spriteBox({ x: 0, y: 0, width: 0, height: 0 }, 0.2, 1), { x: 0, y: 0, width: 1, height: 1 }, "never empty");

const packed = packAtlases([{ width: 4, height: 3 }, { width: 4, height: 5 }, { width: 4, height: 2 }, { width: 6, height: 6 }], 10, 1);
assert.deepEqual(packed.cells, [
  { atlas: 0, x: 0, y: 0, width: 4, height: 3 },
  { atlas: 0, x: 5, y: 0, width: 4, height: 5 },
  { atlas: 0, x: 0, y: 6, width: 4, height: 2 },
  { atlas: 1, x: 0, y: 0, width: 6, height: 6 },
], "rows with a gap, a new row when the width is full, a new atlas when the height is");
assert.deepEqual(packed.atlases, [{ width: 9, height: 8 }, { width: 6, height: 6 }]);
assert.deepEqual(packAtlases([{ width: 20, height: 2 }], 10, 1).cells, [{ atlas: 0, x: 0, y: 0, width: 20, height: 2 }], "a bitmap wider than the side still gets a cell");

assert.equal(filterReach("-40%"), 0.4);
assert.equal(filterReach("0"), 0.1, "not a share: the default region");
assert.equal(filterReach(null), 0.1);
assert.equal(filterReach("5%"), 0, "a region inside the box reaches nothing beyond it");

console.log("sprites ok");
