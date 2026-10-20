// Check for bears.ts (the bears and the shapes of their parts): the ids and choices, the size order of the bears, the
// panda as the only patched bear, the tower order, paths moved by shift, circles, no whole pose drawn outside the rig and
// a look in minimes.css for every tower action. Runs with npm test.
import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { STACK_ACTIONS } from "../../core/minimeStack.ts";
import { BEAR_CHOICES, BEAR_IDS, BEARS, dot, isBearChoice, shift, TOWER_LEVELS } from "./bears.ts";

assert.deepEqual(BEAR_IDS, ["eisbaer", "grizzly", "panda"]);
assert.deepEqual(BEAR_CHOICES, ["eisbaer", "grizzly", "panda", "turm"]);

// Size order: Eisbär tallest, then Grizzly, then Panda; the panda is the widest and the only one with patches
assert.ok(BEARS.eisbaer.scaleY > BEARS.grizzly.scaleY && BEARS.grizzly.scaleY > BEARS.panda.scaleY);
assert.ok(BEARS.panda.scaleX > BEARS.eisbaer.scaleX);
assert.deepEqual(BEAR_IDS.filter(id => BEARS[id].patched), ["panda"]);

// Tower: Eisbär at the bottom, Panda in the middle, Grizzly on top with the raised front leg
assert.deepEqual(TOWER_LEVELS.map(level => level.bear), ["eisbaer", "panda", "grizzly"]);
assert.equal(TOWER_LEVELS[2].pose, "fourWave");

// Moving paths: points move, arc radii and flags stay; circles
assert.equal(shift("M1 2 L3 4 C5 6 7 8 9 10 Z", 10, 20), "M11 22 L13 24 C15 26 17 28 19 30 Z");
assert.equal(shift(dot(10, 20, 5), 1, 1), "M6 21 A5 5 0 1 0 16 21 A5 5 0 1 0 6 21 Z");
assert.equal(shift("M1 2", 0, 0), "M1 2");
assert.equal(dot(10, 20, 5), "M5 20 A5 5 0 1 0 15 20 A5 5 0 1 0 5 20 Z");
assert.ok(isBearChoice("turm") && isBearChoice("panda") && !isBearChoice("koala"));

// One model: no file of the theme besides the rig builds poses or draws limbs itself
for (const file of readdirSync(import.meta.dirname, { recursive: true, encoding: "utf8" }).filter(name => /\.(ts|tsx)$/.test(name) && !/check|rig\.ts|bears\.ts/.test(name))) {
  const source = readFileSync(join(import.meta.dirname, file), "utf8");
  assert.ok(!/POSE_MODELS|partsFor|ARMS\./.test(source), `${file} builds poses outside the rig`);
}

// Every tower action of the core has a look in minimes.css
const minimesCss = readFileSync(join(import.meta.dirname, "minimes.css"), "utf8");
for (const action of STACK_ACTIONS) assert.ok(minimesCss.includes(`.action-${action} `), `minimes.css: action-${action} missing`);

console.log("bears ok");
