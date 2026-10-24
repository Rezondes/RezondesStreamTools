// Check of alertPlan.ts: texts per kind, the raid with one dog, the message instead of the line, the toy per kind, the
// pack only for a raid with the switch on, the length grows with the raiders. Run: node src/themes/dogs/alertPlan.check.ts
import assert from "node:assert/strict";
import { resolveSettings } from "../../core/settings.ts";
import { alertLengthMs, planAlert } from "./alertPlan.ts";
import { dogsSettings, type DogsValues } from "./settings.ts";

const values = resolveSettings(dogsSettings, {}) as unknown as DogsValues;
const follow = planAlert({ kind: "follow", user: "neo" }, values);
assert.deepEqual([follow.tag, follow.line, follow.toy, follow.pack], ["NEUER FOLLOWER", "gehört jetzt zum Rudel!", "ball", null]);
assert.equal(planAlert({ kind: "sub", user: "neo" }, values).toy, "knochen");
assert.equal(planAlert({ kind: "cheer", user: "neo", amount: 500 }, values).tag, "500 BITS");
assert.equal(planAlert({ kind: "raid", user: "neo", amount: 42 }, values).line, "kommt mit 42 Hunden vorbei!");
assert.equal(planAlert({ kind: "raid", user: "neo", amount: 1 }, values).line, "kommt mit einem Hund vorbei!");
assert.equal(planAlert({ kind: "sub", user: "neo", text: "Hallo Rudel" }, values).line, "„Hallo Rudel“");
assert.equal(planAlert({ kind: "sub", user: "neo", text: "Hallo" }, { ...values, alertQuote: false }).line, "ist jetzt Teil des Rudels!");

// The pack: only for a raid with the switch on, at most raidMaxDogs; the length of the alert grows with it
assert.equal(planAlert({ kind: "raid", user: "neo", amount: 1000 }, values).pack?.runners.length, 300);
assert.equal(planAlert({ kind: "raid", user: "neo", amount: 42 }, { ...values, raidPack: false }).pack, null);
assert.equal(alertLengthMs({ kind: "follow", user: "neo" }, values), 8200);
assert.equal(Math.round(alertLengthMs({ kind: "raid", user: "neo", amount: 5 }, values)), 8200);
assert.equal(Math.round(alertLengthMs({ kind: "raid", user: "neo", amount: 15 }, values)), 9800);

console.log("dogs alertPlan ok");
