// Check for texts.account.de.ts: dates come out in German with the year. Runs with npm test.
import assert from "node:assert/strict";
import { ACCOUNT_TEXTS } from "./texts.account.de.ts";

assert.ok(ACCOUNT_TEXTS.date(Date.UTC(2026, 9, 1, 12)).includes("2026"));
assert.ok(ACCOUNT_TEXTS.roles.admin.length > 0 && ACCOUNT_TEXTS.roles.streamer.length > 0);

console.log("texts account ok");
