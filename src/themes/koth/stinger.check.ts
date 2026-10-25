// Check for stinger.ts of the KOTH theme: at the transition point the smoke wall covers the picture and the flag shows
// the second faction, at the start the grenade rolls and nothing covers, at the end everything is clear, the same time
// gives the same scene. Runs with npm test (no WebGL needed, only the scene graph).
import assert from "node:assert/strict";
import type { Mesh, MeshBasicMaterial, MeshLambertMaterial } from "three";
import { effectiveSettings } from "../../core/settings.ts";
import { kothStingerCloud, kothStingerLook } from "./render.ts";
import { type KothValues, kothSettings } from "./settings.ts";
import { type KothStingerOptions, stingerSetup } from "./stinger.ts";

// The look of the default settings
const defaults = effectiveSettings(kothSettings, {}) as unknown as KothValues;

const options: KothStingerOptions = {
  duration: 1.6, cut: 0.8, flag: true, smoke: "#9ea3a0", flags: ["#2f6fd6", "#d63a2f"], pole: "#3c4146", grenade: "#4b5320", puffs: 24, seed: 3,
  look: kothStingerLook(defaults), cloud: kothStingerCloud(defaults),
};
const setup = stingerSetup(options);
const part = (name: string) => setup.scene.getObjectByName(name) as Mesh;
const cover = () => (part("cover").material as MeshBasicMaterial).opacity;
const cloth = () => part("cloth").material as MeshLambertMaterial;

// At the cut: covered, flag fully shown in the second faction color
setup.update(options.cut);
assert.equal(cover(), 1);
assert.equal(cloth().opacity, 1);
assert.equal(`#${cloth().color.getHexString()}`, "#d63a2f");

// At the start: the grenade rolls, nothing covers; shortly before the cut the first color
setup.update(0.05);
assert.equal(part("grenade").visible, true);
assert.equal(cover(), 0);
setup.update(0.7);
assert.equal(`#${cloth().color.getHexString()}`, "#2f6fd6");

// At the end: clear
setup.update(options.duration);
assert.equal(cover(), 0);
assert.equal(cloth().opacity, 0);

// Same time, same scene
setup.update(0.5);
const first = JSON.stringify(setup.scene.children.map(child => [child.position.toArray(), child.scale.toArray()]));
setup.update(1.1);
setup.update(0.5);
assert.equal(JSON.stringify(setup.scene.children.map(child => [child.position.toArray(), child.scale.toArray()])), first);

// Without the flag change no flag
const plain = stingerSetup({ ...options, flag: false });
assert.equal(plain.scene.getObjectByName("cloth")?.parent?.visible, false);
setup.dispose?.();
plain.dispose?.();

console.log("koth stinger ok");
