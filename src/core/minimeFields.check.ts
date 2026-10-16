// Check für minimeFields.ts: Standardwerte und Prüfung der Minime-Einstellungen, welches Schema Minimes hat.
// Läuft mit npm test (einzeln: node src/core/minimeFields.check.ts).
import assert from "node:assert/strict";
import { hasMinimes, MINIME_BASE_FIELDS, MINIME_FIELDS, minimeVariantFields, readMinimeOptions } from "./minimeFields.ts";
import type { MinimeVariantSet } from "./theme.ts";
import { validateSettings } from "./settings.ts";

// Standardwerte: ohne gespeicherte Werte gelten genau diese Regeln und diese Bewegung
assert.deepEqual(readMinimeOptions({}), {
  rules: {
    commands: { join: "!join", look: "!color", leave: "!leave" },
    joinRoles: ["everyone"],
    kickRoles: ["moderator", "broadcaster"],
    colorJoins: true,
    max: 30,
    whenFull: "replace",
    idleMinutes: 20,
    colorCooldownS: 10,
    minBrightness: 80,
    useTwitchColor: true,
    chatKeepsAlive: true,
    reactToChat: true,
    clearOffline: true,
    removeOnBan: true,
    variants: null,
  },
  motion: {
    speedPxPerS: 60, marginPx: 60, walkMinPx: 100, walkMaxPx: 600, walkWeight: 40, idleWeight: 40,
    idleMinMs: 2000, idleMaxMs: 6000, enterMs: 1200, exitMs: 900,
  },
});
// Die Standardwerte bestehen das eigene Schema
const probe = { id: "probe", name: "Probe", fields: MINIME_FIELDS };
const defaults = Object.fromEntries(MINIME_FIELDS.map(field => [field.key, field.default]));
assert.deepEqual(validateSettings(probe, defaults).errors, []);

// Ungültige Werte ergeben die Standardwerte; vertauschte Grenzen werden getauscht
{
  const options = readMinimeOptions({ minimeJoinCommand: "join", minimeColorCommand: "!farbe wechseln", minimeLeaveCommand: "!tschüss", minimeMax: 999, minimeWalkMin: 700, minimeWalkMax: 100, minimeIdleMinMs: 9000, minimeIdleMaxMs: 3000 });
  assert.deepEqual(options.rules.commands, { join: "!join", look: "!color", leave: "!tschüss" });
  assert.equal(options.rules.max, 30);
  assert.deepEqual([options.motion.walkMinPx, options.motion.walkMaxPx], [100, 700]);
  assert.deepEqual([options.motion.idleMinMs, options.motion.idleMaxMs], [3000, 9000]);
  assert.deepEqual(readMinimeOptions(null), readMinimeOptions({}));
}

// Rollen: die gewählte Mindestrolle und alle darüber
assert.deepEqual(readMinimeOptions({ minimeJoinRole: "vip" }).rules.joinRoles, ["vip", "moderator", "broadcaster"]);
assert.deepEqual(readMinimeOptions({ minimeKickRole: "broadcaster" }).rules.kickRoles, ["broadcaster"]);
assert.equal(readMinimeOptions({ minimeWhenFull: "reject" }).rules.whenFull, "reject");

// Minimes hat nur ein Schema, das die Felder einbindet (die Grundfelder reichen, Farben sind optional)
assert.equal(hasMinimes(probe), true);
assert.equal(hasMinimes({ id: "basis", name: "Basis", fields: MINIME_BASE_FIELDS }), true);
assert.equal(hasMinimes({ id: "ohne", name: "Ohne", fields: [] }), false);

// Farb-Themes behalten genau ihre Schlüssel (gespeicherte Werte der Matrix bleiben gültig)
assert.deepEqual(MINIME_FIELDS.map(field => field.key).sort(), [
  "minimeChatKeepsAlive", "minimeClearOffline", "minimeColorCommand", "minimeColorCooldown", "minimeColorJoins", "minimeEnterMs",
  "minimeExitMs", "minimeIdleMaxMs", "minimeIdleMinMs", "minimeIdleMinutes", "minimeIdleWeight", "minimeJoinCommand", "minimeJoinRole",
  "minimeKickRole", "minimeLeaveCommand", "minimeMargin", "minimeMax", "minimeMinBrightness", "minimeReactToChat", "minimeRemoveOnBan",
  "minimeSpeed", "minimeUseTwitchColor", "minimeWalkMax", "minimeWalkMin", "minimeWalkWeight", "minimeWhenFull",
]);

// Typ-Felder: Befehl mit dem Standardwort des Themes, je Typ die Namen im Chat (leer = aus) in der Gruppe "Minimes: Typen"
{
  const set: MinimeVariantSet = { command: "!frucht", label: "Frucht", variants: [{ id: "mango", label: "Mango", names: ["mango", "mangos"] }, { id: "kiwi", label: "Kiwi", names: ["kiwi", "mango"] }] };
  const fields = minimeVariantFields(set);
  assert.deepEqual(fields.map(field => [field.key, field.default, field.group]), [
    ["minimeVariantCommand", "!frucht", "Minimes: Typen"],
    ["minimeNames_mango", "mango, mangos", "Minimes: Typen"],
    ["minimeNames_kiwi", "kiwi, mango", "Minimes: Typen"],
  ]);
  assert.deepEqual(validateSettings({ id: "probe", name: "Probe", fields }, Object.fromEntries(fields.map(field => [field.key, field.default]))).errors, []);
  // Namen vereinheitlicht und doppelte nur beim ersten Typ; eine leere Liste schaltet den Typ aus
  const rules = readMinimeOptions({ minimeNames_mango: "Mango,  MANGOS, ", minimeVariantCommand: "!obst" }, set).rules;
  assert.equal(rules.commands.look, "!obst");
  assert.deepEqual(rules.variants, [{ id: "mango", names: ["mango", "mangos"] }, { id: "kiwi", names: ["kiwi"] }]);
  assert.deepEqual(readMinimeOptions({ minimeNames_mango: "" }, set).rules.variants, [{ id: "kiwi", names: ["kiwi", "mango"] }]);
  assert.equal(readMinimeOptions({ minimeVariantCommand: "obst" }, set).rules.commands.look, "!frucht");
}

console.log("minimeFields ok");
