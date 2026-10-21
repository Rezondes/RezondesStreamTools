// Check for world.ts of the Dachdecker theme: frame dimensions, orbit, fog and bloom from the settings. Runs with npm
// test.
import assert from "node:assert/strict";
import { resolveSettings } from "../../core/settings.ts";
import type { DachdeckerValues } from "./settings.ts";
import { dachdeckerSettings } from "./settings.ts";
import { BOTH_FACES, frameDims, ONE_FACE, orbitOf, stageLook, tilesOf } from "./world.ts";

const values = resolveSettings(dachdeckerSettings, {}) as unknown as DachdeckerValues;
assert.deepEqual(frameDims(values), { span: 8.4, rise: 3.25, trusses: 5, gap: 1.5, overhang: 0.12 });
assert.deepEqual(orbitOf(values), { radius: 17, height: 6.4, speed: 0.07, intro: true });

// Tiles from the settings: the share is a percentage, one face or both
const oneFace = tilesOf(values, 4, ONE_FACE);
assert.ok(oneFace.length > 0 && oneFace.every(tile => tile.side === 1 && tile.row < 4));
assert.ok(tilesOf(values, 11, BOTH_FACES).some(tile => tile.side === -1));
assert.ok(tilesOf({ ...values, tileCopperShare: 0 }, 11, BOTH_FACES).every(tile => !tile.copper));

const look = stageLook(values);
assert.equal(look.fog?.color, "#192a56");
assert.ok(look.fog && look.fog.near < 17 && look.fog.far > 30);
assert.equal(look.bloom?.strength, 0.42 * 2.5);
assert.equal(stageLook({ ...values, fog: false, bloom: false }).fog, null);
assert.equal(stageLook({ ...values, fog: false, bloom: false }).bloom, null);

console.log("dachdecker world ok");
