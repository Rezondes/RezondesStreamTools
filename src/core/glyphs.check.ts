// Check für glyphs.ts: Zufallszeichen kommen aus dem Zeichensatz, auch Zeichen ausserhalb der BMP bleiben ganz.
// Läuft mit npm test.
import assert from "node:assert/strict";
import { GLYPHS, glyph } from "./glyphs.ts";

const standard = Array.from(GLYPHS);
for (let round = 0; round < 50; round++) assert.ok(standard.includes(glyph()));

// Eigener Zeichensatz mit Emoji (zwei UTF-16-Einheiten je Zeichen)
const emoji = Array.from("😀😎🦎");
for (let round = 0; round < 50; round++) assert.ok(emoji.includes(glyph("😀😎🦎")));

// Leerer Zeichensatz: kein Zeichen statt undefined
assert.equal(glyph(""), "");

console.log("glyphs ok");
