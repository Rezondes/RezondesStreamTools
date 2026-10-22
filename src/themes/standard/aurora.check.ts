// Check for aurora.ts of the standard theme: the light fields and the light dust follow from seed, index and time
// alone, stay on the stage, repeat after their loop, and take their colors between the two accents. Runs with npm test.
import assert from "node:assert/strict";
import { hexNumber } from "../../core/color.ts";
import { resolveSettings } from "../../core/settings.ts";
import { auroraField, type AuroraOptions, auroraOptions, introShare, moteAt, MOTE_PERIOD } from "./aurora.ts";
import { type StandardValues, standardSettings } from "./settings.ts";

const OPTIONS: AuroraOptions = { seed: 7, count: 4, loop: 24, accent: "#7c5cff", accent2: "#22d3ee", strength: 0.55 };
const STAGE = { width: 1920, height: 1080 };
const close = (first: Record<string, unknown>, second: Record<string, unknown>) =>
  Object.keys(first).every(key => (typeof first[key] === "number" ? Math.abs(first[key] -(second[key] as number)) < 1e-6 : first[key] === second[key]));
const between = (value: number, from: number, to: number) => value >= Math.min(from, to) && value <= Math.max(from, to);

// Bahnen: same seed, same field; the center stays inside the stage plus the radius; after one loop the same place
for (let index = 0; index < 8; index++) {
  for (const time of [0, 3.3, 11, 23.9, 61]) {
    const field = auroraField(OPTIONS, index, time);
    assert.deepEqual(field, auroraField(OPTIONS, index, time));
    assert.ok(field.x >= -field.radius && field.x <= STAGE.width + field.radius, `field ${index} x at ${time}`);
    assert.ok(field.y >= -field.radius && field.y <= STAGE.height + field.radius, `field ${index} y at ${time}`);
    assert.ok(field.radius > 0 && field.alpha > 0 && field.alpha <= OPTIONS.strength);
    assert.ok(close(field, auroraField(OPTIONS, index, time + OPTIONS.loop)), `field ${index} repeats after the loop`);
  }
}
assert.notDeepEqual(auroraField(OPTIONS, 0, 1), auroraField({ ...OPTIONS, seed: 8 }, 0, 1), "another seed, another field");
assert.notDeepEqual(auroraField(OPTIONS, 0, 1), auroraField(OPTIONS, 0, 2), "the fields move");

// Farben: every channel lies between both accents; with equal accents all fields have that color
for (let index = 0; index < 8; index++) {
  const color = hexNumber(auroraField(OPTIONS, index, 5).color);
  const [from, to] = [hexNumber(OPTIONS.accent), hexNumber(OPTIONS.accent2)];
  for (const shift of [16, 8, 0]) assert.ok(between((color >> shift) & 255, (from >> shift) & 255, (to >> shift) & 255), `field ${index} channel ${shift}`);
  assert.equal(auroraField({ ...OPTIONS, accent2: OPTIONS.accent }, index, 5).color, OPTIONS.accent);
}
// both accents show: at least one field nearer to each
const shares = Array.from({ length: OPTIONS.count }, (_, index) => auroraField(OPTIONS, index, 0).share);
assert.ok(shares.some(share => share < 0.5) && shares.some(share => share > 0.5), "both accents appear");

// Lichtstaub: from seed and time, on the stage, repeating, glowing up and down
for (let index = 0; index < 30; index++) {
  const mote = moteAt(OPTIONS, index, 9);
  assert.deepEqual(mote, moteAt(OPTIONS, index, 9));
  assert.ok(close(mote, moteAt(OPTIONS, index, 9 + MOTE_PERIOD)), `mote ${index} repeats`);
  assert.ok(mote.y >= -60 && mote.y <= STAGE.height + 60 && mote.x >= -60 && mote.x <= STAGE.width + 60);
  assert.ok(mote.alpha >= 0 && mote.alpha <= 1 && mote.size > 0);
}
assert.ok(moteAt(OPTIONS, 3, 10).y < moteAt(OPTIONS, 3, 9).y || moteAt(OPTIONS, 3, 10).y > moteAt(OPTIONS, 3, 9).y + 900, "motes rise (or wrap)");

// Einblenden: from 0 at the start to 1 after introMs, at once without an intro
assert.equal(introShare(0, 1200), 0);
assert.equal(introShare(0.6, 1200), 0.5);
assert.equal(introShare(9, 1200), 1);
assert.equal(introShare(0, 0), 1);

// Optionen: the settings feed the options
const values = resolveSettings(standardSettings, {}) as StandardValues;
assert.deepEqual(auroraOptions(values), { seed: 7, count: 4, loop: 24, accent: "#7c5cff", accent2: "#22d3ee", strength: 0.7 });

console.log("aurora ok");
