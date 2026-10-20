// Check for scribbles.ts: every mark is open lines in its unit box, the layout is deterministic, fills the count and keeps
// the free area empty. Runs with npm test.
import assert from "node:assert/strict";
import { STAGE } from "../../core/screens/screens.ts";
import { chance } from "./chance.ts";
import { pointsOf } from "./paths.ts";
import { layoutScribbles, SCRIBBLE_KINDS, scribbleShape } from "./scribbles.ts";

// The catalog: twenty different marks, each as lines inside the unit box around 0 (with a little wobble), open except
// the round ones that close on purpose
assert.equal(new Set(SCRIBBLE_KINDS).size, 20);
for (const kind of SCRIBBLE_KINDS) {
  const paths = scribbleShape(kind, chance(11));
  assert.ok(paths.length > 0, kind);
  for (const path of paths) {
    assert.ok(path.startsWith("M"), kind);
    assert.ok(pointsOf(path).every(([x, y]) => Math.abs(x) <= 0.6 && Math.abs(y) <= 0.6), `${kind} leaves its box`);
  }
}
assert.ok(scribbleShape("x", chance(1)).every(path => !path.endsWith("Z")));
// A hand never draws the same mark twice the same way
assert.notDeepEqual(scribbleShape("star", chance(1)), scribbleShape("star", chance(2)));

// Layout: the same seed gives the same wall, the count is reached, no middle inside the free ellipse
const free = { x: 0.25, y: 0.25, width: 0.5, height: 0.5 };
const wall = layoutScribbles(7, 200, free, true);
assert.deepEqual(layoutScribbles(7, 200, free, true), wall);
assert.equal(wall.length, 200);
const inside = ({ x, y }: { x: number; y: number }) => ((x - STAGE.width / 2) / (STAGE.width / 4)) ** 2 + ((y - STAGE.height / 2) / (STAGE.height / 4)) ** 2 < 1;
assert.ok(!wall.some(inside));
// Several sizes, line kinds and colors side by side; white only when allowed
assert.ok(new Set(wall.map(mark => mark.line)).size === 3);
assert.ok(wall.some(mark => mark.size < 26) && wall.some(mark => mark.size > 56));
assert.ok(wall.some(mark => mark.color === "white"));
assert.ok(!layoutScribbles(7, 200, free, false).some(mark => mark.color === "white"));
// A free area over the whole stage leaves no room: the layout stops instead of looping forever
assert.equal(layoutScribbles(3, 10, { x: -1, y: -1, width: 3, height: 3 }, true).length, 0);

console.log("chaos scribbles ok");
