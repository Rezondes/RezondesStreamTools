// Run: npm run check
import assert from "node:assert/strict";
import { vinyl } from "./vinyl.ts";

const plain = vinyl(0).split("\n");
assert.equal(plain.length, 21);
assert.ok(plain.every(line => line.length === 42));
assert.equal(plain[0][0], " "); // the corner is outside the record
assert.equal(plain[10][21], " "); // Mittelloch
assert.notEqual(vinyl(0), vinyl(Math.PI / 2)); // turning changes the picture
assert.equal(vinyl(1.234), vinyl(1.234 + Math.PI * 2)); // a full turn is the same again

// Over the cover: the edge stays, otherwise mostly free, so the image shows through
const spaces = (text: string) => text.split(" ").length - 1;
const cover = vinyl(0, 21, true);
assert.notEqual(cover.split("\n")[10][0], " ");
assert.equal(cover.split("\n")[10][21], " ");
assert.ok(spaces(cover) > spaces(vinyl(0)) + 300);

console.log(vinyl(0.6));
console.log("vinyl ok");
