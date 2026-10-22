// Check for glyphFont.ts: the glyph font stands between the font of the settings and monospace; loading resolves
// without a browser, in a browser it loads the file once, adds the face and resolves even when loading fails. Runs with
// npm test.
import assert from "node:assert/strict";
import { fontStack, GLYPH_FONT, loadGlyphFont } from "./glyphFont.ts";

assert.equal(fontStack("Share Tech Mono"), `"Share Tech Mono", "${GLYPH_FONT}", monospace`);
await loadGlyphFont();

const made: { family: string; source: string }[] = [];
const added: unknown[] = [];
const globals = globalThis as unknown as Record<string, unknown>;
globals.document = { fonts: { add: (face: unknown) => added.push(face) } };
globals.FontFace = class {
  constructor(family: string, source: string) { made.push({ family, source }); }
  load() { return Promise.resolve(this); }
};
await loadGlyphFont();
await loadGlyphFont();
assert.equal(made.length, 1);
assert.equal(made[0].family, GLYPH_FONT);
assert.ok(made[0].source.includes("matrix-katakana.woff2"));
assert.equal(added.length, 1);

console.log("matrix glyphFont ok");
