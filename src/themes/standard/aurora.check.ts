// Check for aurora.ts of the standard theme: the light fields and the light dust follow from seed, index and time
// alone, stay on the stage, repeat after their loop, and take their colors between the two accents. Runs with npm test.
import assert from "node:assert/strict";
import { hexNumber } from "../../core/color.ts";
import { effectiveSettings } from "../../core/settings.ts";
import { auroraField, type AuroraOptions, auroraOptions, breathLight, introShare, moteAt, MOTE_PERIOD, pacedTime, sceneLight, sinkAt } from "./aurora.ts";
import { type StandardValues, standardSettings } from "./settings.ts";

// The options of the default settings, with a lower strength
const DEFAULTS = auroraOptions(effectiveSettings(standardSettings, {}) as StandardValues);
const OPTIONS: AuroraOptions = { ...DEFAULTS, strength: 0.55 };
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

// Tempo ohne Sprung: the orbit time eases from full speed to the pace, it never jumps and never runs backwards
const ramp = 1.2;
assert.equal(pacedTime(0, 0.5, ramp), 0);
assert.equal(pacedTime(5, 1, ramp), 5, "pace 1 is the plain time");
assert.equal(pacedTime(5, 0.5, 0), 2.5, "without a ramp the pace holds at once");
for (let step = 0; step < 300; step++) {
  const [before, after] = [pacedTime(step / 50, 0.5, ramp), pacedTime((step + 1) / 50, 0.5, ramp)];
  assert.ok(after >= before && after - before <= 1 / 50 + 1e-9, `no jump at ${step / 50}`);
}
assert.ok(Math.abs(pacedTime(ramp + 2, 0.5, ramp) - pacedTime(ramp, 0.5, ramp) - 1) < 1e-9, "after the ramp at the pace");

// Atmen: brbDim 1 is as bright as Starting; otherwise between the dim and full, bright at the start
assert.equal(breathLight(3.3, 1, 6), 1);
assert.equal(breathLight(0, 0.6, 6), 1);
assert.ok(Math.abs(breathLight(3, 0.6, 6) - 0.6) < 1e-9, "darkest at half a breath");
assert.equal(breathLight(2, 0.6, 0), 0.6, "without breathing the dim holds");

// Ausblenden: the Ending lets the fields sink and fade after endingFadeAt
assert.deepEqual(sinkAt(5, 10, 4000, 240), { drop: 0, alpha: 1 });
assert.equal(sinkAt(20, 10, 4000, 240).alpha, 0);
assert.equal(sinkAt(20, 10, 4000, 240).drop, 240, "sunk as far as the setting");
assert.equal(sinkAt(10, 10, 0, 240).alpha, 0, "without a fade duration at once");

// Szenen: Starting as before, BRB dimmed and slower, Ending sinking
const scene = { introMs: 1200, brbPace: 0.5, brbDim: 0.6, brbBreatheSeconds: 6, endingFadeAt: 10, endingFadeMs: 4000, endingSink: 240 };
assert.deepEqual(sceneLight("starting", 5, scene), { time: 5, alpha: 1, drop: 0 });
assert.equal(sceneLight("brb", 5, scene).time, pacedTime(5, 0.5, 1.2));
assert.equal(sceneLight("brb", 3, scene).alpha, breathLight(3, 0.6, 6));
assert.deepEqual(sceneLight("ending", 20, scene), { time: 20, ...sinkAt(20, 10, 4000, 240) });
assert.equal(sceneLight("starting", 0.6, scene).alpha, 0.5, "every scene fades in");

// Optionen: the settings feed the options; the colors follow the accents until set
assert.deepEqual([DEFAULTS.seed, DEFAULTS.count, DEFAULTS.loop, DEFAULTS.accent, DEFAULTS.accent2, DEFAULTS.strength], [7, 4, 24, "#7c5cff", "#22d3ee", 0.7]);
assert.deepEqual(DEFAULTS.slots, [[0.22, 0.3], [0.78, 0.7], [0.69, 0.2], [0.32, 0.83]]);
const own = auroraOptions(effectiveSettings(standardSettings, { auroraColor: "#ff0000", dustColor2: "#00ff00", auroraRadius: 100 }) as StandardValues);
assert.deepEqual([own.accent, own.accent2, own.mote.accent2, own.radius], ["#ff0000", "#22d3ee", "#00ff00", 100]);
// the look of the fields and motes comes from the settings
assert.equal(auroraField({ ...OPTIONS, radius: 50, radiusSpread: 0, breathe: 0 }, 0, 3).radius, 50);
assert.equal(moteAt({ ...OPTIONS, mote: { ...OPTIONS.mote, size: 12, sizeSpread: 0 } }, 2, 3).size, 12);

console.log("aurora ok");
