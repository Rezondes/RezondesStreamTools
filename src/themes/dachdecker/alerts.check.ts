// Check for alerts.ts of the Dachdecker theme: head line, line and dimension text per kind with filled placeholders,
// the hype end line, stable chatter tones. Runs with npm test.
import assert from "node:assert/strict";
import { resolveSettings } from "../../core/settings.ts";
import type { Alert } from "../../core/types.ts";
import { alertTexts, toneOf } from "./alerts.ts";
import { dachdeckerSettings } from "./settings.ts";

const values = resolveSettings(dachdeckerSettings, {});
const texts = (alert: Alert) => alertTexts(alert, values);

assert.deepEqual(texts({ kind: "follow", user: "neo" }), { tag: "NEUER FOLLOWER", line: "neo deckt jetzt das Dach mit!", dim: "+1 DACHDECKER" });
assert.deepEqual(texts({ kind: "sub", user: "neo" }).dim, "+1 AZUBI");
assert.deepEqual(texts({ kind: "resub", user: "neo", amount: 12 }), { tag: "ABO x12", line: "neo deckt seit 12 Monaten mit!", dim: "12 MONATE" });
assert.equal(texts({ kind: "gift", user: "neo", amount: 5 }).dim, "+5 AZUBIS");
assert.equal(texts({ kind: "raid", user: "neo", amount: 42 }).line, "neo rückt mit einer Kolonne von 42 Leuten an!");
assert.deepEqual(texts({ kind: "cheer", user: "neo", amount: 500 }), { tag: "500 BITS", line: "neo legt 500 Ziegel aufs Dach!", dim: "+500 ZIEGEL" });
assert.equal(texts({ kind: "redeem", user: "neo", detail: "Hydrieren" }).line, "neo löst Hydrieren ein.");
assert.equal(texts({ kind: "hype", user: "HYPE", amount: 1, detail: "begin" }).dim, "RICHTFEST");
assert.equal(texts({ kind: "hype", user: "HYPE", amount: 3, detail: "end" }).line, "Richtfest Level 3 geschafft!");

// Chatter tones are stable and in range
assert.equal(toneOf("neo", 4), toneOf("neo", 4));
assert.ok(["a", "b", "c", "d", "e", "f"].every(login => toneOf(login, 4) >= 0 && toneOf(login, 4) < 4));

console.log("dachdecker alerts ok");
