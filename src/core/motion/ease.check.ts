// Check for ease.ts: every named curve is a valid CustomEase path from 0,0 to 1,1 with a unique name. Runs with npm test.
import assert from "node:assert/strict";
import { EASE_NAMES, EASES } from "./ease.ts";

assert.equal(new Set(EASE_NAMES).size, EASE_NAMES.length);
for (const name of EASE_NAMES) {
  const path = EASES[name];
  assert.ok(path.startsWith("M0,0 C"), `${name}: starts at 0,0 with a curve`);
  assert.ok(path.endsWith(" 1,1"), `${name}: ends at 1,1`);
  // A cubic segment has three points, so all points after M come in threes
  const points = path.slice(path.indexOf("C") + 1).trim().split(/\s+/);
  assert.equal(points.length % 3, 0, `${name}: complete cubic segments`);
  assert.ok(points.every(point => /^-?\d+(\.\d+)?,-?\d+(\.\d+)?$/.test(point)), `${name}: x,y pairs`);
}
assert.deepEqual(EASE_NAMES, ["nagel", "federnd", "weich", "stempel"]);

console.log("ease ok");
