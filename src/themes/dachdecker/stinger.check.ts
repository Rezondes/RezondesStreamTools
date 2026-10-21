// Check for stinger.ts of the Dachdecker theme: flat at the transition point, turned before and after, lower rows in
// earlier and out later, the same time gives the same scene. Runs with npm test.
import assert from "node:assert/strict";
import { stingerSetup, tileAngle } from "./stinger.ts";

const [duration, cut, rows] = [2.4, 1.2, 9];
for (let row = 0; row < rows; row++) {
  assert.equal(tileAngle(row, rows, cut, duration, cut), 0);
  assert.ok(Math.abs(tileAngle(row, rows, 0, duration, cut)) > 0);
  assert.ok(Math.abs(tileAngle(row, rows, duration, duration, cut)) > 0);
}
// Bottom row flips in first and out last
assert.ok(Math.abs(tileAngle(0, rows, 0.5, duration, cut)) < Math.abs(tileAngle(8, rows, 0.5, duration, cut)));
assert.ok(Math.abs(tileAngle(0, rows, 1.9, duration, cut)) < Math.abs(tileAngle(8, rows, 1.9, duration, cut)));

// The same time gives the same scene
const options = { duration, cut, rows, shine: true, copperShare: 0.15, seed: 7, slate: "#2c3e50", copper: "#d4a373", brick: "#d35400", line: "#ffffff" };
const angles = (time: number) => {
  const built = stingerSetup(options);
  built.update(time);
  const result = built.scene.children.flatMap(child => child.children.map(tile => tile.rotation.x));
  built.dispose?.();
  return result;
};
assert.deepEqual(angles(0.8), angles(0.8));
assert.ok(angles(cut).every(angle => angle === 0 || Number.isNaN(angle)));

console.log("dachdecker stinger ok");
