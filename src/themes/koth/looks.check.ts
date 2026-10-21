// Check for looks.ts: every screen takes its own sky, the night has moon light and circles lower without the ride, the
// moon can be switched off. Runs with npm test.
import assert from "node:assert/strict";
import { resolveSettings } from "../../core/settings.ts";
import { worldLook } from "./looks.ts";
import { type KothValues, kothSettings } from "./settings.ts";

const values = resolveSettings(kothSettings, {}) as unknown as KothValues;

const starting = worldLook(values, "starting");
assert.deepEqual(starting.sky, { top: values.skyTop, horizon: values.skyHorizon });
assert.equal(starting.light.color, values.sunColor);
assert.equal(starting.camera.intro, values.cameraIntro);
assert.equal(starting.camera.top, values.hillHeight);

const night = worldLook(values, "brb");
assert.deepEqual(night.sky, { top: values.brbSkyTop, horizon: values.brbSkyHorizon });
assert.equal(night.light.color, values.moon);
assert.ok(night.light.strength < starting.light.strength, "the night is darker");
assert.deepEqual([night.camera.intro, night.camera.height], [false, values.brbCameraHeight]);
assert.equal(night.disc?.color, values.moon);
assert.equal(worldLook({ ...values, moonOn: false }, "brb").disc, null);

const dusk = worldLook(values, "ending");
assert.deepEqual(dusk.sky, { top: values.endingSkyTop, horizon: values.endingSkyHorizon });
assert.equal(dusk.camera.intro, values.cameraIntro);
assert.ok(dusk.disc !== null && dusk.disc.position[1] < starting.disc!.position[1], "the sun sinks");

console.log("koth looks ok");
