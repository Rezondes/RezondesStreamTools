// Check for alerts.ts: header and line of an alert from the texts of a theme, placeholders and quote.
// Runs with npm test.
import assert from "node:assert/strict";
import type { AlertKind } from "../types.ts";
import { ALERT_SOUND_KEYS, alertQuote, alertSoundFields, alertTextKeys, describeAlert, type AlertTextKeys } from "./alerts.ts";

const KINDS: AlertKind[] = ["follow", "sub", "resub", "gift", "raid", "cheer", "redeem", "hype"];
const keys = (extra: Partial<AlertTextKeys> = {}): AlertTextKeys => ({
  tag: Object.fromEntries(KINDS.map(kind => [kind, `${kind}Tag`])) as AlertTextKeys["tag"],
  line: Object.fromEntries(KINDS.map(kind => [kind, `${kind}Line`])) as AlertTextKeys["line"],
  hypeEndLine: "hypeEndLine",
  ...extra,
});
const values: Record<string, unknown> = {
  ...Object.fromEntries(KINDS.flatMap(kind => [[`${kind}Tag`, kind.toUpperCase()], [`${kind}Line`, `${kind} {user} {amount} {detail} {text}`]])),
  hypeEndLine: "ende {amount}",
  giftOneLine: "ein Abo von {user}",
  giftToLine: "Abo an {text}",
  tierSuffix: " [{detail}]",
};

// Placeholders {user}, {amount}, {detail}, {text}; missing values are empty or 0
assert.deepEqual(describeAlert({ kind: "follow", user: "neo" }, values, keys()), { tag: "FOLLOW", line: "follow neo 0  " });
assert.deepEqual(describeAlert({ kind: "raid", user: "smith", amount: 42 }, values, keys()), { tag: "RAID", line: "raid smith 42  " });

// Hype Train: own line for the end
assert.equal(describeAlert({ kind: "hype", user: "HYPE", amount: 4, detail: "end" }, values, keys()).line, "ende 4");

// Gift variants and sub tier only if the theme has the texts for them
assert.equal(describeAlert({ kind: "gift", user: "neo", amount: 1 }, values, keys()).line, "gift neo 1  ");
assert.equal(describeAlert({ kind: "gift", user: "neo", amount: 1 }, values, keys({ giftOneLine: "giftOneLine", giftToLine: "giftToLine" })).line, "ein Abo von neo");
assert.equal(describeAlert({ kind: "gift", user: "neo", amount: 1, text: "trinity" }, values, keys({ giftOneLine: "giftOneLine", giftToLine: "giftToLine" })).line, "Abo an trinity");
assert.equal(describeAlert({ kind: "gift", user: "neo", amount: 5 }, values, keys({ giftOneLine: "giftOneLine", giftToLine: "giftToLine" })).line, "gift neo 5  ");
assert.equal(describeAlert({ kind: "sub", user: "neo", detail: "Tier 2" }, values, keys({ tierSuffix: "tierSuffix" })).tag, "SUB [Tier 2]");
assert.equal(describeAlert({ kind: "sub", user: "neo", detail: "Tier 2" }, values, keys({ tierSuffix: "tierSuffix", tierUpper: true })).tag, "SUB [TIER 2]");
assert.equal(describeAlert({ kind: "sub", user: "neo" }, values, keys({ tierSuffix: "tierSuffix" })).tag, "SUB");

// Quote: the viewer's message, except for gift subs (there text is the recipient)
assert.equal(alertQuote({ kind: "sub", user: "neo", text: "hallo" }), "hallo");
assert.equal(alertQuote({ kind: "gift", user: "neo", amount: 1, text: "trinity" }), null);
assert.equal(alertQuote({ kind: "follow", user: "neo" }), null);

// Keys following the usual pattern, with an own header suffix and optional texts
assert.deepEqual(alertTextKeys("Tag"), { ...keys(), line: { ...keys().line, hype: "hypeBeginLine" } });
assert.equal(alertTextKeys("Label").tag.follow, "followLabel");
assert.equal(alertTextKeys("Tag", { tierSuffix: "tierSuffix" }).tierSuffix, "tierSuffix");

// Sound fields: one per alert kind (keys like ALERT_SOUND_KEYS) and one for fading out, all in the group
const sounds = alertSoundFields("Alerts");
assert.deepEqual(sounds.map(field => field.key), [...Object.values(ALERT_SOUND_KEYS), "soundLeave"]);
assert.ok(sounds.every(field => field.group === "Alerts" && field.type === "sound"));

console.log("alerts ok");
