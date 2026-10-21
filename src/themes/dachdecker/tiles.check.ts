// Check for tiles.ts of the Dachdecker theme: fixed randomness, offset rows, nothing past the gables, copper share
// without stripes. Runs with npm test.
import assert from "node:assert/strict";
import { ridgeOf, TILE, tileLayout } from "./tiles.ts";

const dims = { span: 8.4, rise: 3.25, trusses: 5, gap: 1.5, overhang: 0.12 };
const tiles = tileLayout(dims, 11, 7, 0.15, 2);

// Same seed, same list; another seed, other copper tiles
assert.deepEqual(tileLayout(dims, 11, 7, 0.15, 2), tiles);
assert.notDeepEqual(tileLayout(dims, 11, 8, 0.15, 2).map(tile => tile.copper), tiles.map(tile => tile.copper));

// Every second row is offset by half a tile
const firstOf = (row: number) => Math.max(...tiles.filter(tile => tile.side === 1 && tile.row === row).map(tile => tile.position[2]));
assert.ok(Math.abs(firstOf(0) - firstOf(1) - TILE.width / 2) < 1e-9);
assert.ok(Math.abs(firstOf(0) - firstOf(2)) < 1e-9);

// No tile past the gables (front purlin end at 0.5, back at -6.5)
for (const tile of tiles) {
  assert.ok(tile.position[2] + TILE.depth / 2 <= 0.5 + 1e-9, `front ${tile.position[2]}`);
  assert.ok(tile.position[2] - TILE.depth / 2 >= -6.5 - 1e-9, `back ${tile.position[2]}`);
}

// Copper share 15 % plus minus 5 points, no row or column only copper
const share = tiles.filter(tile => tile.copper).length / tiles.length;
assert.ok(share >= 0.1 && share <= 0.2, `share ${share}`);
const groups = (key: (tile: (typeof tiles)[number]) => string) => {
  const byKey = new Map<string, typeof tiles>();
  for (const tile of tiles) byKey.set(key(tile), [...(byKey.get(key(tile)) ?? []), tile]);
  return byKey.values();
};
for (const row of groups(tile => `${tile.side} ${tile.row}`)) assert.ok(row.some(tile => !tile.copper));
for (const column of groups(tile => `${tile.side} ${tile.position[2].toFixed(3)}`)) assert.ok(column.some(tile => !tile.copper));

// One side and fewer rows: only the right face from the eaves, rows climb
const starting = tileLayout(dims, 4, 7, 0.15, 1);
assert.deepEqual([...new Set(starting.map(tile => tile.row))], [0, 1, 2, 3]);
assert.ok(starting.every(tile => tile.side === 1 && tile.position[0] > 0));
const heightOf = (row: number) => starting.find(tile => tile.row === row)!.position[1];
assert.ok(heightOf(0) < heightOf(1) && heightOf(1) < heightOf(3));

// The ridge pipe runs from gable to gable just above the ridge
const ridge = ridgeOf(dims);
assert.ok(ridge.length > 7 && ridge.center[1] > 3.25 && Math.abs(ridge.center[2] + 3) < 1e-9);

console.log("dachdecker tiles ok");
