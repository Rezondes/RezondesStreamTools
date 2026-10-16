// Check für chat.ts: Anzeigename eines Badges aus den Texten eines Themes. Läuft mit npm test.
import assert from "node:assert/strict";
import { BADGE_KEYS, badgeFields, badgeLabel } from "./chat.ts";

const labels = { badgeHost: "[H]", badgeMod: "[M]", badgeVip: "[V]", badgeSub: "[S]" };
assert.equal(badgeLabel("MOD", labels), "[M]");
assert.equal(badgeLabel("SUB", labels), "[S]");
// Ohne Text im Theme oder unbekannt: das Kürzel selbst
assert.equal(badgeLabel("MOD", {}), "MOD");
assert.equal(badgeLabel("ARTIST", labels), "ARTIST");

assert.deepEqual(BADGE_KEYS, ["badgeHost", "badgeMod", "badgeVip", "badgeSub"]);

// Felder: eins je Badge, Schlüssel wie BADGE_KEYS, Standard ist das Kürzel
assert.deepEqual(badgeFields("Chat").map(field => [field.key, field.default, field.group]), BADGE_KEYS.map((key, index) => [key, ["HOST", "MOD", "VIP", "SUB"][index], "Chat"]));

console.log("chat ok");
