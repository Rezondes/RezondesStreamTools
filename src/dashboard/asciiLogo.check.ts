// Check for asciiLogo.ts: every font creates multi-line art without trailing spaces and without empty
// edge lines; an empty name gives nothing. Runs with npm test.
import assert from "node:assert/strict";
import { ASCII_FONTS, asciiLogo } from "./asciiLogo.ts";

for (const font of ASCII_FONTS) {
  const art = asciiLogo("REZ", font);
  const rows = art.split("\n");
  assert.ok(rows.length >= 3, `${font}: too few lines`);
  assert.ok(rows.every(row => row === row.trimEnd()), `${font}: Leerzeichen am Zeilenende`);
  assert.ok(rows[0] && rows.at(-1), `${font}: empty edge line`);
}

// Default font like the bundled logo, a second call uses the already loaded font
assert.equal(asciiLogo("R", "Standard"), asciiLogo("R", "Standard"));
assert.ok(asciiLogo("R", "Standard").startsWith(" ____"));
assert.equal(asciiLogo("", "Standard"), "");

console.log("asciiLogo ok");
