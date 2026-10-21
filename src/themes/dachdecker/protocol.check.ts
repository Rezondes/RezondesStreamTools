// Check for protocol.ts of the Dachdecker theme: rows with the real numbers, counting up, dashes without stats. Runs
// with npm test.
import assert from "node:assert/strict";
import { parseStatLines } from "../../core/stats/stats.ts";
import { NO_VALUE, protocolRows } from "./protocol.ts";

const stats = { follows: 1284, subs: 37, giftedSubs: 25, raids: 2, raiders: 142, bits: 4200, redeems: 63, hypeLevel: 3, chatMessages: 2817, chatters: 211, startedAt: 0 };
const lines = parseStatLines("follows|Neue Dachdecker\nsubs|Abos\nchatMessages|Gelegte Ziegel");

assert.deepEqual(protocolRows(stats, lines, "de-DE", 0), [
  { label: "Neue Dachdecker", value: "1.284" }, { label: "Abos", value: "37" }, { label: "Gelegte Ziegel", value: "2.817" },
]);
// Counting up: half way shows half, not started shows 0
assert.deepEqual(protocolRows(stats, lines, "de-DE", 0, [0.5, 0]).map(row => row.value), ["642", "0", "2.817"]);
// Without stats: dashes instead of numbers
assert.deepEqual(protocolRows(null, lines, "de-DE", 0).map(row => row.value), [NO_VALUE, NO_VALUE, NO_VALUE]);

console.log("dachdecker protocol ok");
