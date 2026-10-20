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
assert.deepEqual([minimePose("brace"), minimePose("climb"), minimePose("stacked"), minimePose("stacked", true), minimePose("stackWalk", true)], ["four", "climb", "four", "fourWave", "fourWave"]);
assert.deepEqual([minimePose("gather"), minimePose("dismount"), minimePose("wave", true)], ["stand", "stand", "wave"]);
for (const action of STACK_ACTIONS) assert.ok(minimePose(action, true) in POSES, action);
// Lift of a level: the steps of the bears below in percent of the size
const steps = { eisbaer: 30, panda: 20, grizzly: 25 };
assert.deepEqual([1, 2, 3].map(level => towerLift(["eisbaer", "panda", "grizzly"], level, steps, 100)), [0, 30, 50]);
assert.equal(towerLift(["eisbaer", "koala"], 3, steps, 100), 30);
for (const move of MINIME_MOVES) assert.ok(!(COMBAT_ACTIONS as readonly string[]).includes(move), `${move} is an action of the fights`);

console.log("bears minime variants ok");
