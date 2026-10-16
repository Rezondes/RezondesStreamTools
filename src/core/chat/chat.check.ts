// Check für chat.ts: Anzeigename eines Badges aus den Texten eines Themes. Läuft mit npm test.
import assert from "node:assert/strict";
import { BADGE_KEYS, badgeLabel } from "./chat.ts";

const labels = { badgeHost: "[H]", badgeMod: "[M]", badgeVip: "[V]", badgeSub: "[S]" };
assert.equal(badgeLabel("MOD", labels), "[M]");
assert.equal(badgeLabel("SUB", labels), "[S]");
// Ohne Text im Theme oder unbekannt: das Kürzel selbst
assert.equal(badgeLabel("MOD", {}), "MOD");
assert.equal(badgeLabel("ARTIST", labels), "ARTIST");

assert.deepEqual(BADGE_KEYS, ["badgeHost", "badgeMod", "badgeVip", "badgeSub"]);

console.log("chat ok");
