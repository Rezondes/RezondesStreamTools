// Check for bears.ts (shapes of the bears): every bear, every pose with body and outline lines, paths start with M,
// the panda has its patches, the size order of the bears, the tower and the open mouth of the loud bear.
// Runs with npm test.
import assert from "node:assert/strict";
import { BEAR_CHOICES, BEAR_IDS, BEARS, CLOSED_MOUTH, dot, isBearChoice, OPEN_MOUTH, partsFor, POSES, TOWER_LEVELS } from "./bears.ts";

// Every bear has every pose of the full-screen scenes
assert.deepEqual(BEAR_IDS, ["eisbaer", "grizzly", "panda"]);
assert.deepEqual(BEAR_CHOICES, ["eisbaer", "grizzly", "panda", "turm"]);
for (const name of ["stand", "wave", "four", "fourWave", "cook", "sign", "phone", "selfie"]) assert.ok(name in POSES, `pose ${name} missing`);

// Every pose: a body, at least one outline line and one shade, panda patches; every path starts with M
for (const [name, pose] of Object.entries(POSES)) {
  const paths = [pose.body, ...pose.shade, ...pose.patches, ...pose.back.map(part => part.d), ...pose.parts.map(part => part.d)];
  assert.ok(pose.body.length > 0, `${name}: body`);
  assert.ok(pose.parts.some(part => part.kind === "line"), `${name}: outline lines`);
  assert.ok(pose.shade.length > 0, `${name}: shade`);
  assert.ok(pose.patches.length > 0, `${name}: panda patches`);
  assert.equal(pose.parts.filter(part => part.kind === "eye").length, 2, `${name}: two eyes`);
  for (const path of paths) assert.match(path, /^M-?\d/, `${name}: path ${path.slice(0, 20)}`);
}

// Size order: Eisbär tallest, then Grizzly, then Panda; the panda is the widest and the only one with patches
assert.ok(BEARS.eisbaer.scaleY > BEARS.grizzly.scaleY && BEARS.grizzly.scaleY > BEARS.panda.scaleY);
assert.ok(BEARS.panda.scaleX > BEARS.eisbaer.scaleX);
assert.deepEqual(BEAR_IDS.filter(id => BEARS[id].patched), ["panda"]);

// Tower: Eisbär at the bottom, Panda in the middle, Grizzly on top with the raised arm
assert.deepEqual(TOWER_LEVELS.map(level => level.bear), ["eisbaer", "panda", "grizzly"]);
assert.equal(TOWER_LEVELS[2].pose, "fourWave");

// The loud bear opens its mouth only in excited poses, the others keep the closed mouth
assert.ok(partsFor("grizzly", "wave").includes(OPEN_MOUTH[0]));
assert.ok(!partsFor("grizzly", "wave").includes(CLOSED_MOUTH));
assert.ok(partsFor("grizzly", "stand").includes(CLOSED_MOUTH));
assert.ok(partsFor("eisbaer", "wave").includes(CLOSED_MOUTH));

// Circle path and choices
assert.equal(dot(10, 20, 5), "M5 20 A5 5 0 1 0 15 20 A5 5 0 1 0 5 20 Z");
assert.ok(isBearChoice("turm") && isBearChoice("panda") && !isBearChoice("koala"));

console.log("bears ok");
