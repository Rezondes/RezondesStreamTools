// Check for closing.ts: rows count up one after another after the bon is printed. Runs with npm test.
import assert from "node:assert/strict";
import { rowShares as sharesWith } from "./closing.ts";

// fixed: printed after 1.5 s, each row a quarter second later
const PRINTED = 1.5;
const rowShares = (time: number, rows: number, countUpMs: number) => sharesWith(time, rows, countUpMs, PRINTED, 0.25);

assert.deepEqual(rowShares(0, 3, 1000), [0, 0, 0], "nothing before the bon is printed");
assert.deepEqual(rowShares(PRINTED + 0.5, 2, 1000), [0.5, 0.25]);
assert.deepEqual(rowShares(30, 3, 1000), [1, 1, 1]);
assert.deepEqual(rowShares(PRINTED, 2, 0), [1, 0], "without counting each row appears at its start");

console.log("kebab closing ok");
