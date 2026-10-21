// Check for color.ts: hex to number, short hex, mixes at both ends and in the middle, shares outside 0 to 1 are clamped.
// Runs with npm test.
import assert from "node:assert/strict";
import { hexNumber, mixHex } from "./color.ts";

assert.equal(hexNumber("#ff8000"), 0xff8000);
assert.equal(hexNumber("#f80"), 0xff8800);
assert.equal(hexNumber("nonsense"), 0);
assert.equal(mixHex("#000000", "#ffffff", 0), "#000000");
assert.equal(mixHex("#000000", "#ffffff", 1), "#ffffff");
assert.equal(mixHex("#000000", "#ffffff", 0.5), "#808080");
assert.equal(mixHex("#102030", "#ffffff", -1), "#102030");
assert.equal(mixHex("#102030", "#ffffff", 2), "#ffffff");

console.log("color ok");
