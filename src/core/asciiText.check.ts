// Check for asciiText.ts: same output as FIGlet "Standard" at full width, only supported characters.
// Runs with npm test (alone: node src/core/asciiText.check.ts).
import assert from "node:assert/strict";
import figlet from "figlet";
import standard from "figlet/importable-fonts/Standard.js";
import { asciiText } from "./asciiText.ts";

figlet.parseFont("Standard", standard);
// Like the generator in the dashboard: lines without trailing spaces, without common indent and empty edge lines
function reference(text: string) {
  const rows = figlet.textSync(text, { font: "Standard", horizontalLayout: "full" }).split("\n").map(row => row.trimEnd());
  const indent = Math.min(...rows.filter(Boolean).map(row => row.length - row.trimStart().length));
  return rows.map(row => row.slice(indent)).join("\n").replace(/^\n+|\n+$/g, "");
}

// Twitch logins (lower case, digits, underscore) give the same picture as FIGlet in upper case
for (const login of ["rezondes", "neo_42", "agent_smith", "abcdefghijklmnopqrstuvwxyz", "0123456789", "w"]) {
  assert.equal(asciiText(login), reference(login.toUpperCase()), login);
}

// Other characters drop out, without supported characters it stays empty
assert.equal(asciiText("Neo-42!"), reference("NEO42"));
assert.equal(asciiText("äöü !"), "");

console.log("asciiText ok");
