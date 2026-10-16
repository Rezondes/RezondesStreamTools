// Check für asciiText.ts: gleiche Ausgabe wie FIGlet "Standard" in voller Breite, nur unterstützte Zeichen.
// Läuft mit npm test (einzeln: node src/core/asciiText.check.ts).
import assert from "node:assert/strict";
import figlet from "figlet";
import standard from "figlet/importable-fonts/Standard.js";
import { asciiText } from "./asciiText.ts";

figlet.parseFont("Standard", standard);
// Wie der Generator im Dashboard: Zeilen ohne Leerzeichen am Ende, ohne gemeinsamen Einzug und leere Randzeilen
function reference(text: string) {
  const rows = figlet.textSync(text, { font: "Standard", horizontalLayout: "full" }).split("\n").map(row => row.trimEnd());
  const indent = Math.min(...rows.filter(Boolean).map(row => row.length - row.trimStart().length));
  return rows.map(row => row.slice(indent)).join("\n").replace(/^\n+|\n+$/g, "");
}

// Twitch-Logins (Kleinbuchstaben, Ziffern, Unterstrich) ergeben dasselbe Bild wie FIGlet in Grossbuchstaben
for (const login of ["rezondes", "neo_42", "agent_smith", "abcdefghijklmnopqrstuvwxyz", "0123456789", "w"]) {
  assert.equal(asciiText(login), reference(login.toUpperCase()), login);
}

// Andere Zeichen fallen weg, ohne unterstützte Zeichen bleibt es leer
assert.equal(asciiText("Neo-42!"), reference("NEO42"));
assert.equal(asciiText("äöü !"), "");

console.log("asciiText ok");
