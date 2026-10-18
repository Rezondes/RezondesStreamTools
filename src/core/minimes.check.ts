// Check for minimes.ts: names from chat and the settings become comparable like on the server. The rules themselves
// (commands, the list) are tested in Rust (rst-domain minimes). Runs with npm test (alone: node src/core/minimes.check.ts).
import assert from "node:assert/strict";
import { normalizeName } from "./minimes.ts";

// Normalize names: lower case, German umlauts spelled out, without spaces and hyphens
assert.equal(normalizeName("Asiatische Birne"), "asiatischebirne");
assert.equal(normalizeName("Kaktus-Feige"), "kaktusfeige");
assert.equal(normalizeName("Süß"), "suess");
assert.equal(normalizeName("  MANGO "), "mango");

console.log("minimes ok");
