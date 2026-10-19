// Check for world.ts (shapes of the backdrop): every fixed part and every built path starts with M, firs stand on their
// base, windows stay inside their block. Runs with npm test.
import assert from "node:assert/strict";
import { blocksPath, CITY, CITY_BASE, FIR_BASE, FIRS, firPath, firShadePath, flowerPath, SHAPES, tuftPath, windowsPath } from "./world.ts";

for (const [name, path] of Object.entries(SHAPES)) assert.match(path, /^M-?\d/, `${name}`);
for (const path of [firPath(100, 800, 300, 120), firShadePath(100, 800, 300, 120), tuftPath(10, 10, 5), flowerPath(10, 10, 4), blocksPath(CITY, CITY_BASE)]) {
  assert.match(path, /^M-?\d/);
}

// A fir starts at its top and reaches down to its base
assert.ok(firPath(100, 800, 300, 120).startsWith("M100 500"));
assert.ok(firPath(100, 800, 300, 120).includes("L40 800"));
assert.ok(FIRS.every(([, height]) => height < FIR_BASE));

// Windows: a 40 x 60 block gets cells inside it only, a too small block none
const cells = windowsPath([[0, 40, 60]], 100, 8, 14).split(" Z").filter(Boolean);
assert.ok(cells.length > 0);
for (const cell of cells) {
  const [x, y] = /M(\S+) (\S+)/.exec(cell)!.slice(1).map(Number);
  assert.ok(x >= 0 && x + 8 <= 40 && y >= 40 && y + 8 <= 100, cell);
}
assert.equal(windowsPath([[0, 10, 10]], 100), "");

console.log("world ok");
