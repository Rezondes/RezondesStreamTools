// Check for glyphs.ts: random characters come from the character set, characters outside the BMP stay whole too.
// Runs with npm test.
import assert from "node:assert/strict";
import { GLYPHS, glyph } from "./glyphs.ts";

const standard = Array.from(GLYPHS);
for (let round = 0; round < 50; round++) assert.ok(standard.includes(glyph()));

// Own character set with emoji (two UTF-16 units per character)
const emoji = Array.from("😀😎🦎");
for (let round = 0; round < 50; round++) assert.ok(emoji.includes(glyph("😀😎🦎")));

// Empty character set: no character instead of undefined
assert.equal(glyph(""), "");

console.log("glyphs ok");
