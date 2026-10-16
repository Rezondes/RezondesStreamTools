// Check für commands.ts: Liste der Chat-Befehle aus Hilfe-Befehl, Minimes (Farben oder Typen) und öffentlichen
// Triggern. Läuft mit npm test.
import assert from "node:assert/strict";
import { commandList, type TriggerInfo } from "./commands.ts";
import { readMinimeOptions } from "./minimeFields.ts";

const HELP = { enabled: true, command: "!befehle", reply: "x", cooldown: 30 };
const colors = readMinimeOptions({ minimeJoinRole: "subscriber" }).rules;
const fruits = readMinimeOptions({}, { command: "!frucht", label: "Frucht", variants: [{ id: "mango", label: "Mango", names: ["mango"] }] }).rules;

const TRIGGERS: TriggerInfo[] = [
  { name: "lizard", when: { type: "command", match: "!lizard" }, who: ["vip"], cooldown: 5, userCooldown: 60, description: "Echse" },
  { name: "aus", enabled: false, when: { type: "word", match: "aus" } },
  { name: "geheim", public: false, when: { type: "word", match: "geheim" } },
  { name: "muster", when: { type: "regex", match: "^a+$" } },
];

// Alles an: Hilfe, Minimes mit Farben (Rollen aus den Einstellungen), nur aktive und öffentliche Trigger,
// Regex ohne Suchtext; fehlende Felder bekommen Standardwerte
assert.deepEqual(commandList("rezondes", HELP, colors, TRIGGERS), {
  channel: "rezondes",
  items: [
    { kind: "help", command: "!befehle", cooldown: 30 },
    { kind: "join", command: "!join", who: ["subscriber", "vip", "moderator", "broadcaster"], variants: null },
    { kind: "look", command: "!color", who: ["subscriber", "vip", "moderator", "broadcaster"], variants: null },
    { kind: "leave", command: "!leave", kickWho: ["moderator", "broadcaster"] },
    { kind: "trigger", name: "lizard", when: "command", match: "!lizard", description: "Echse", who: ["vip"], cooldown: 5, userCooldown: 60 },
    { kind: "trigger", name: "muster", when: "regex", match: null, description: "", who: ["everyone"], cooldown: 0, userCooldown: 0 },
  ],
});

// Typen statt Farben: der Befehl des Themes und die erlaubten Typen mit Namen; ohne Hilfe, Minimes und Trigger leer
const typed = commandList("rezondes", null, fruits, []).items;
assert.deepEqual(typed.find(item => item.kind === "look"), { kind: "look", command: "!frucht", who: ["everyone"], variants: [{ id: "mango", names: ["mango"] }] });
assert.deepEqual(typed.find(item => item.kind === "join"), { kind: "join", command: "!join", who: ["everyone"], variants: [{ id: "mango", names: ["mango"] }] });
assert.deepEqual(commandList("rezondes", { ...HELP, enabled: false }, null, []).items, []);

console.log("commands ok");
