// Check für asciiLogo.ts: jede Schrift erzeugt mehrzeilige Kunst ohne Leerzeichen am Zeilenende und ohne leere
// Rand-Zeilen; leerer Name ergibt nichts. Läuft mit npm test.
import assert from "node:assert/strict";
import { ASCII_FONTS, asciiLogo } from "./asciiLogo.ts";

for (const font of ASCII_FONTS) {
  const art = asciiLogo("REZ", font);
  const rows = art.split("\n");
  assert.ok(rows.length >= 3, `${font}: zu wenige Zeilen`);
  assert.ok(rows.every(row => row === row.trimEnd()), `${font}: Leerzeichen am Zeilenende`);
  assert.ok(rows[0] && rows.at(-1), `${font}: leere Rand-Zeile`);
}

// Standard-Schrift wie das mitgelieferte Logo, zweiter Aufruf nutzt die schon geladene Schrift
assert.equal(asciiLogo("R", "Standard"), asciiLogo("R", "Standard"));
assert.ok(asciiLogo("R", "Standard").startsWith(" ____"));
assert.equal(asciiLogo("", "Standard"), "");

console.log("asciiLogo ok");
