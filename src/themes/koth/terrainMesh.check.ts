// Check for terrainMesh.ts: every point of the ground lies on hillHeight, the summit is olive and the plain sand. Runs
// with npm test.
import assert from "node:assert/strict";
import { hillHeight, WORLD_SEGMENTS } from "./terrain.ts";
import { groundGeometry } from "./terrainMesh.ts";

const colors = { sand: "#ff0000", hill: "#00ff00", shade: "#00ff00" };
const ground = groundGeometry(7.2, 301, colors);
const position = ground.attributes.position;
assert.equal(position.count, (WORLD_SEGMENTS + 1) ** 2);
for (let index = 0; index < position.count; index += 97) {
  assert.ok(Math.abs(position.getY(index) - hillHeight(position.getX(index), position.getZ(index), 7.2)) < 1e-4, `point ${index}`);
}
// The point nearest the summit is green (olive), a corner of the plain mostly red (sand)
const color = ground.attributes.color;
const middle = Math.floor(position.count / 2);
assert.ok(color.getY(middle) > color.getX(middle), "olive top");
assert.ok(color.getX(0) > color.getY(0), "sand plain");
ground.dispose();

console.log("koth terrainMesh ok");
