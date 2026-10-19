// Check for minimeBears.ts: the three bears as minime variants with the ids of the character model, chat names unique
// after normalizing, a pose of the model for every action, no catalog name taken by the fights. Runs with npm test.
import assert from "node:assert/strict";
import { COMBAT_ACTIONS } from "../../core/minimeCombat.ts";
import { normalizeName } from "../../core/minimes.ts";
import { BEAR_IDS, POSES } from "./bears.ts";
import { BEAR_SET, MINIME_MOVES, MINIME_REACTION, minimePose } from "./minimeBears.ts";

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
for (const move of MINIME_MOVES) assert.ok(!(COMBAT_ACTIONS as readonly string[]).includes(move), `${move} is an action of the fights`);

console.log("bears minime variants ok");
