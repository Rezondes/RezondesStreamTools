// Check for alerts.ts: every kind fills its head line, dish, line and item; a message replaces the line when quotes are
// on; the order number stays the same for the same viewer. Runs with npm test.
import assert from "node:assert/strict";
import { resolveSettings } from "../../core/settings.ts";
import type { Alert } from "../../core/types.ts";
import { alertTexts } from "./alerts.ts";
import { kebabSettings } from "./settings.ts";

const values = resolveSettings(kebabSettings, {});
const texts = (alert: Alert, changes: Record<string, unknown> = {}) => alertTexts(alert, { ...values, ...changes });

// Follow: dish, line and item from the defaults
assert.deepEqual(texts({ kind: "follow", user: "Trinity" }), {
  tag: "NEUER FOLLOW", dish: "1x Döner", line: "Mit alles?", item: { label: "Follow", note: "gratis" }, number: texts({ kind: "follow", user: "Trinity" }).number,
});
assert.match(texts({ kind: "follow", user: "Trinity" }).number, /^Bestellung Nr\. \d{3}$/);

// Placeholders in every part
const raid = texts({ kind: "raid", user: "Neo", amount: 12 });
assert.equal(raid.line, "Neo kommt mit 12 Leuten rein!");
assert.deepEqual(raid.item, { label: "12 Gäste", note: "willkommen" });
assert.equal(texts({ kind: "resub", user: "Neo", amount: 7 }).tag, "ABO x7");
assert.equal(texts({ kind: "cheer", user: "Neo", amount: 500 }).dish, "Extra-Soße");
assert.equal(texts({ kind: "redeem", user: "Neo", detail: "Lahmacun" }).line, "Lahmacun kommt sofort!");
assert.equal(texts({ kind: "hype", user: "", amount: 3, detail: "end" }).line, "Grillparty Level 3 geschafft!");
for (const kind of ["sub", "gift"] as const) assert.ok(texts({ kind, user: "Neo", amount: 2 }).dish.length > 0);

// The viewer's message replaces the line, unless quotes are off; a gift recipient is no quote
assert.equal(texts({ kind: "sub", user: "Neo", text: "Lecker" }).line, "„Lecker“");
assert.equal(texts({ kind: "sub", user: "Neo", text: "Lecker" }, { alertQuote: false }).line, "Ab jetzt Stammkunde!");
assert.equal(texts({ kind: "gift", user: "Neo", amount: 1, text: "Trinity" }).line, "Neo gibt 1 Döner aus!");

// Same viewer and kind, same number; an empty item gives none
assert.equal(texts({ kind: "sub", user: "Neo" }).number, texts({ kind: "sub", user: "Neo" }).number);
assert.equal(texts({ kind: "follow", user: "Neo" }, { followItem: "" }).item, null);
assert.match(alertTexts({ kind: "follow", user: "Neo" }, {}).number, /^\d{3}$/, "without settings the bare number");

console.log("kebab alerts ok");
