// Check für minimeFields.ts: Standardwerte und Prüfung der Minime-Einstellungen, welches Schema Minimes hat.
// Läuft mit npm test (einzeln: node src/core/minimeFields.check.ts).
import assert from "node:assert/strict";
import { hasMinimes, MINIME_FIELDS, readMinimeOptions } from "./minimeFields.ts";
import { validateSettings } from "./settings.ts";

// Standardwerte: ohne gespeicherte Werte gelten genau diese Regeln und diese Bewegung
assert.deepEqual(readMinimeOptions({}), {
  rules: {
    commands: { join: "!join", color: "!color", leave: "!leave" },
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
  assert.deepEqual(options.rules.commands, { join: "!join", color: "!color", leave: "!tschüss" });
  assert.equal(options.rules.max, 30);
  assert.deepEqual([options.motion.walkMinPx, options.motion.walkMaxPx], [100, 700]);
  assert.deepEqual([options.motion.idleMinMs, options.motion.idleMaxMs], [3000, 9000]);
  assert.deepEqual(readMinimeOptions(null), readMinimeOptions({}));
}

// Rollen: die gewählte Mindestrolle und alle darüber
assert.deepEqual(readMinimeOptions({ minimeJoinRole: "vip" }).rules.joinRoles, ["vip", "moderator", "broadcaster"]);
assert.deepEqual(readMinimeOptions({ minimeKickRole: "broadcaster" }).rules.kickRoles, ["broadcaster"]);
assert.equal(readMinimeOptions({ minimeWhenFull: "reject" }).rules.whenFull, "reject");

// Minimes hat nur ein Schema, das die Felder einbindet
assert.equal(hasMinimes(probe), true);
assert.equal(hasMinimes({ id: "ohne", name: "Ohne", fields: [] }), false);

console.log("minimeFields ok");
