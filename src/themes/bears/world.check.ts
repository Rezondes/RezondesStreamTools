// Check for world.ts (shapes of the backdrop): every path starts with M; the drawn ground lines and groundAt agree; every
// fir and tree stands on the meadow, the city on the far shore above the water, the bridge ends on land at both ends
// with its towers in the water, the water lies between the far shore and the meadow, the path leads to the bridge;
// windows stay inside their block.
// Runs with npm test.
import assert from "node:assert/strict";
import {
  BRIDGE, bridgeShapes, blockBase, CITY, FAR_SHORE, FIRS, firPath, groundAt, linePath, MEADOW, ROAD_END, SCENE, SHAPES, TREES, WATER_LINE, windowsPath, WORLD,
} from "./world.ts";

for (const [name, path] of Object.entries(SHAPES)) assert.match(path, /^M-?\d/, name);
for (const [name, path] of Object.entries(SCENE)) if (typeof path === "string") assert.match(path, /^M-?\d/, name);

// groundAt follows the drawn line: at the points of the smoothing (the middles) it is exact, flat past the ends
assert.equal(groundAt(MEADOW, -500), MEADOW[0][1]);
assert.equal(groundAt(MEADOW, 5000), MEADOW[MEADOW.length - 1][1]);
for (let index = 0; index < MEADOW.length - 1; index++) {
  const [x, y] = [(MEADOW[index][0] + MEADOW[index + 1][0]) / 2, (MEADOW[index][1] + MEADOW[index + 1][1]) / 2];
  assert.ok(Math.abs(groundAt(MEADOW, x) - y) < 0.01, `meadow at ${x}`);
  assert.ok(linePath(MEADOW).includes(`${x} ${y}`), `drawn through ${x} ${y}`);
}

// Firs and trees stand with their foot on the meadow (within 2 px), a fir reaches from its top down to its foot
for (const [x, height, width] of FIRS) {
  const ground = groundAt(MEADOW, x);
  assert.ok(firPath(x, ground, height, width).includes(`L${x - width / 2} ${ground}`), `fir at ${x}`);
}
for (const [index, tree] of SCENE.trees.entries()) assert.ok(Math.abs(tree.base - groundAt(MEADOW, TREES[index][0])) <= 2);

// The water lies below the far shore and above the meadow wherever it shows
for (let x = 1120; x <= 1920; x += 20) {
  assert.ok(groundAt(WATER_LINE, x) > groundAt(FAR_SHORE, x), `water over the far shore at ${x}`);
  assert.ok(groundAt(WATER_LINE, x) < groundAt(MEADOW, x), `no water at ${x}`);
}

// The city stands on the far shore, every block above the water line under it
for (const block of CITY) {
  const [x, width] = block;
  const base = blockBase(block);
  assert.ok(Math.abs(base - Math.max(groundAt(FAR_SHORE, x), groundAt(FAR_SHORE, x + width))) < 0.01);
  assert.ok(base < groundAt(WATER_LINE, x) && base < groundAt(WATER_LINE, x + width), `block at ${x} in the water`);
}

// The bridge: both ends on land (left on the meadow, right on the far shore, above the water there), towers in the water
const bridge = bridgeShapes();
const [[left, leftY], [right, rightY]] = bridge.ends;
assert.ok(Math.abs(leftY - groundAt(MEADOW, left)) <= 3 && Math.abs(rightY - groundAt(FAR_SHORE, right)) <= 3);
assert.ok(rightY < groundAt(WATER_LINE, right), "right end in the water");
for (const tower of BRIDGE.towers) {
  assert.ok(tower > left && tower < right);
  assert.ok(groundAt(WATER_LINE, tower) < groundAt(MEADOW, tower), `tower at ${tower} not in the water`);
  assert.ok(bridge.deckAt(tower) < groundAt(WATER_LINE, tower), `deck under water at ${tower}`);
}

// The path leads from the front edge to the left abutment of the bridge and ends there on the meadow
assert.deepEqual([ROAD_END.left, ROAD_END.right], [BRIDGE.left - BRIDGE.abutment, BRIDGE.left]);
assert.ok(Math.abs(ROAD_END.y - groundAt(MEADOW, BRIDGE.left)) <= 6);
assert.match(SCENE.road, new RegExp(` ${ROAD_END.left} ${ROAD_END.y} L${ROAD_END.right} ${ROAD_END.y} `));
assert.match(SCENE.road, new RegExp(`^M\\d+ ${WORLD.height} `));

// Windows: a 40 x 60 block gets cells inside it only, a too small block none
const cells = windowsPath([[0, 40, 60]], () => 100, 8, 14).split(" Z").filter(Boolean);
assert.ok(cells.length > 0);
for (const cell of cells) {
  const [x, y] = /M(\S+) (\S+)/.exec(cell)!.slice(1).map(Number);
  assert.ok(x >= 0 && x + 8 <= 40 && y >= 40 && y + 8 <= 100, cell);
}
assert.equal(windowsPath([[0, 10, 10]], () => 100), "");

console.log("world ok");
