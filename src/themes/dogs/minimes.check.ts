// Check of minimes.ts (PLAN-DOGS.md package 6, AC1 to AC3): six breeds as types with their names, every action has a
// valid pose (sleeping with "Z", sniffing with dust, the reaction wags faster), weight 0 leaves an action out, and no
// action name collides with fights or towers of the core. Run: node src/themes/dogs/minimes.check.ts
import assert from "node:assert/strict";
import { COMBAT_ACTIONS } from "../../core/minimeCombat.ts";
import { STACK_ACTIONS } from "../../core/minimeStack.ts";
import { resolveSettings } from "../../core/settings.ts";
import { hasMinimes } from "../../core/minimeFields.ts";
import { DOG_ACTIONS, DOG_SET, MINIME_REACTION, minimeCatalog, minimePose, minimeReaction } from "./minimes.ts";
import { MODES } from "./poses.ts";
import { dogsSettings, type DogsValues } from "./settings.ts";

const values = resolveSettings(dogsSettings, {}) as unknown as DogsValues;

// Schema: six breeds as types, minimes switched on
assert.deepEqual(DOG_SET.variants.map(variant => variant.id), ["corgi", "shiba", "labrador", "dalmatiner", "dackel", "mops"]);
assert.ok(DOG_SET.variants.every(variant => variant.names[0] === variant.id));
assert.ok(hasMinimes(dogsSettings));
assert.deepEqual(dogsSettings.minimeVariants, DOG_SET);

// Aktionen
for (const action of ["walk", "idle", "enter", "exit", ...DOG_ACTIONS, MINIME_REACTION]) assert.ok(MODES.includes(minimePose(action, values).mode), action);
assert.equal(minimePose("walk", values).mode, "walk");
assert.equal(minimePose("bark", values).mode, "bark");
assert.ok(minimePose("sleep", values).zzz && minimePose("sleep", values).mode === "lie");
assert.ok(minimePose("sniff", values).dust);
assert.ok(minimePose(MINIME_REACTION, values).wagSpeed > minimePose("idle", values).wagSpeed);
assert.deepEqual(minimeCatalog(values).map(action => action.name), [...DOG_ACTIONS]);
assert.deepEqual(minimeCatalog({ ...values, minimeSniffWeight: 0 }).map(action => action.name), ["bark", "lie", "sleep"]);
assert.equal(minimeCatalog(values)[0].durationMs, values.minimeBarkMs);
assert.deepEqual(minimeReaction(values), { name: "wag", durationMs: values.minimeWagMs, weight: 0 });
for (const name of [...DOG_ACTIONS, MINIME_REACTION]) assert.ok(![...COMBAT_ACTIONS, ...STACK_ACTIONS].includes(name as never), name);

console.log("dogs minimes ok");
