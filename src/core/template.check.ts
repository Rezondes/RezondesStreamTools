// Check für template.ts: Platzhalter in Texten aus den Einstellungen. Läuft mit npm test.
import assert from "node:assert/strict";
import { fillTemplate, textBar } from "./template.ts";

// Bekannte Platzhalter werden ersetzt, auch mehrfach und Zahlen
assert.equal(fillTemplate("{user} cheert {amount} Bits, danke {user}!", { user: "NEO", amount: 100 }), "NEO cheert 100 Bits, danke NEO!");
// Unbekannte bleiben stehen
assert.equal(fillTemplate("hallo {wer}", { user: "NEO" }), "hallo {wer}");
// Eingesetzte Werte werden nicht noch einmal ersetzt (Chat-Nachricht mit "{user}")
assert.equal(fillTemplate("{message}", { message: "{user}", user: "NEO" }), "{user}");

// Textbalken: Anteil gerundet auf ganze Zeichen, ausserhalb von 0..1 begrenzt
assert.equal(textBar(0.5, 4, "#", "."), "##..");
assert.equal(textBar(0.3, 10, "█", "░"), "███░░░░░░░");
assert.equal(textBar(-1, 3, "#", "."), "...");
assert.equal(textBar(2, 3, "#", "."), "###");

console.log("template ok");
