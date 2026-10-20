// Check for minimeBears.ts: the three bears as minime variants with the ids of the character model, chat names unique
// after normalizing, a pose of the model for every action, no catalog name taken by the fights. Runs with npm test.
import assert from "node:assert/strict";
import { COMBAT_ACTIONS } from "../../core/minimeCombat.ts";
import { normalizeName } from "../../core/minimes.ts";
import { BEAR_IDS } from "./bears.ts";
import { POSES } from "./rig.ts";
import { STACK_ACTIONS } from "../../core/minimeStack.ts";
import { BEAR_SET, MINIME_MOVES, MINIME_REACTION, minimePose, towerLift } from "./minimeBears.ts";

assert.deepEqual(BEAR_SET.variants.map(variant => variant.id), [...BEAR_IDS]);
assert.equal(BEAR_SET.command, "!baer");
const names = BEAR_SET.variants.flatMap(variant => variant.names.map(normalizeName));
assert.equal(new Set(names).size, names.length, "chat names twice");
assert.ok(BEAR_SET.variants.every(variant => variant.label && variant.names.length > 0));

// Every action shows a pose of the character model; the moves have their own pose except looking around
for (const action of [...MINIME_MOVES, MINIME_REACTION, "walk", "idle", "enter", "exit", "unknown"]) assert.ok(minimePose(action) in POSES, action);
assert.equal(minimePose("walk"), "stand");
assert.equal(minimePose("sleep"), "sleep");
assert.equal(minimePose("dance"), "cheer");
// Towers: the base braces on all fours, the climber reaches up, the top one of the stacked tower raises a front leg
assert.deepEqual([minimePose("brace"), minimePose("climb"), minimePose("stacked"), minimePose("stacked", false, true), minimePose("stacked", true), minimePose("stackWalk", true)], ["four", "climb", "four", "perch", "perchWave", "perchWave"]);
assert.deepEqual([minimePose("gather"), minimePose("dismount"), minimePose("wave", true)], ["stand", "stand", "wave"]);
for (const action of STACK_ACTIONS) assert.ok(minimePose(action, true) in POSES, action);
// Lift of a level from the model: the bottom stays, every level above stands higher, the fine correction adds per level
const lifts = [1, 2, 3].map(level => towerLift(["eisbaer", "panda", "grizzly"], level, 332).lift);
assert.ok(lifts[0] === 0 && lifts[1] > 60 && lifts[2] > lifts[1], `lifts ${lifts.join(", ")}`);
assert.equal(towerLift(["eisbaer", "panda"], 2, 332, 5).lift, towerLift(["eisbaer", "panda"], 2, 332).lift + 5);
assert.deepEqual(towerLift(["eisbaer", "koala"], 2, 332), { lift: 0, shift: 0, drops: {} });
for (const move of MINIME_MOVES) assert.ok(!(COMBAT_ACTIONS as readonly string[]).includes(move), `${move} is an action of the fights`);

console.log("bears minime variants ok");
