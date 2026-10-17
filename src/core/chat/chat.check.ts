// Check for chat.ts: display name of a badge from the texts of a theme. Runs with npm test.
import assert from "node:assert/strict";
import { BADGE_KEYS, badgeFields, badgeLabel } from "./chat.ts";

const labels = { badgeHost: "[H]", badgeMod: "[M]", badgeVip: "[V]", badgeSub: "[S]" };
assert.equal(badgeLabel("MOD", labels), "[M]");
assert.equal(badgeLabel("SUB", labels), "[S]");
// Without a text in the theme or unknown: the abbreviation itself
assert.equal(badgeLabel("MOD", {}), "MOD");
assert.equal(badgeLabel("ARTIST", labels), "ARTIST");

assert.deepEqual(BADGE_KEYS, ["badgeHost", "badgeMod", "badgeVip", "badgeSub"]);

// Fields: one per badge, keys like BADGE_KEYS, the default is the abbreviation
assert.deepEqual(badgeFields("Chat").map(field => [field.key, field.default, field.group]), BADGE_KEYS.map((key, index) => [key, ["HOST", "MOD", "VIP", "SUB"][index], "Chat"]));

console.log("chat ok");
