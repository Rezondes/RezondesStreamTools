// Check for stats.ts: reading the lines setting and formatting numbers and the duration. Runs with npm test.
import assert from "node:assert/strict";
import { describeStats, parseStatLines } from "./stats.ts";
import type { StreamStats } from "../types.ts";

// Reading lines: order kept, unknown keys and empty lines skipped, without | the key is the text
assert.deepEqual(parseStatLines("follows|Neue Dachdecker\nbits|Bits"), [{ key: "follows", label: "Neue Dachdecker" }, { key: "bits", label: "Bits" }]);
assert.deepEqual(parseStatLines("\n  \nunknown|Nope\nraids\n"), [{ key: "raids", label: "raids" }]);
assert.deepEqual(parseStatLines(" duration | Dauer "), [{ key: "duration", label: "Dauer" }]);

// Formatting numbers and duration with a fixed clock
const stats: StreamStats = { follows: 1284, subs: 3, giftedSubs: 0, raids: 1, raiders: 42, bits: 500, redeems: 7, hypeLevel: 2, chatMessages: 9, chatters: 4, startedAt: 0 };
const now = (3 * 60 + 42) * 60_000 + 30_000;
const lines = parseStatLines("follows|Follows\nduration|Dauer\nhypeLevel|Hype");
assert.deepEqual(describeStats(stats, lines, "de-DE", now), [
  { key: "follows", label: "Follows", value: "1.284" },
  { key: "duration", label: "Dauer", value: "3:42 h" },
  { key: "hypeLevel", label: "Hype", value: "2" },
]);
// Without a start the duration is 0
assert.equal(describeStats({ ...stats, startedAt: null }, lines, "de-DE", now)[1].value, "0:00 h");

console.log("stats ok");
