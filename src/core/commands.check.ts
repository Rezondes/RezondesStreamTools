// Check for commands.ts: list of chat commands from the help command, minimes (colors or variants) and public
// triggers. Runs with npm test.
import assert from "node:assert/strict";
import { commandList, helpReply, MAX_CHAT, type TriggerInfo } from "./commands.ts";
import { readMinimeOptions } from "./minimeFields.ts";

const HELP = { enabled: true, command: "!befehle", reply: "x", cooldown: 30 };
const colors = readMinimeOptions({ minimeJoinRole: "subscriber" }).rules;
const fruits = readMinimeOptions({}, { command: "!frucht", label: "Frucht", variants: [{ id: "mango", label: "Mango", names: ["mango"] }] }).rules;

const TRIGGERS: TriggerInfo[] = [
  { name: "lizard", when: { type: "command", match: "!lizard" }, who: ["vip"], cooldown: 5, userCooldown: 60, description: "Echse" },
  { name: "off", enabled: false, when: { type: "word", match: "off" } },
  { name: "geheim", public: false, when: { type: "word", match: "geheim" } },
  { name: "muster", when: { type: "regex", match: "^a+$" } },
];

// Everything on: help, minimes with colors (roles from the settings), only active and public triggers,
// regex without search text; missing fields get defaults
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

// Variants instead of colors: the theme's command and the allowed variants with names; without help, minimes and triggers empty
const typed = commandList("rezondes", null, fruits, []).items;
assert.deepEqual(typed.find(item => item.kind === "look"), { kind: "look", command: "!frucht", who: ["everyone"], variants: [{ id: "mango", names: ["mango"] }] });
assert.deepEqual(typed.find(item => item.kind === "join"), { kind: "join", command: "!join", who: ["everyone"], variants: [{ id: "mango", names: ["mango"] }] });
assert.deepEqual(commandList("rezondes", { ...HELP, enabled: false }, null, []).items, []);

// Chat reply: commands without duplicates (words and commands of the triggers, no substrings or patterns), placeholders
// replaced, never longer than Twitch allows
const list = commandList("rezondes", HELP, colors, [...TRIGGERS, { name: "zwei", when: { type: "word", match: "!lizard" } }, { name: "teil", when: { type: "contains", match: "lol" } }]);
assert.equal(helpReply("Befehle: {commands} | {link}", list, "https://x/s/rezondes/"), "Befehle: !join, !color, !leave, !lizard | https://x/s/rezondes/");
assert.equal(helpReply("{link}", commandList("rezondes", null, null, []), "L"), "L");
assert.equal(helpReply("{commands}", commandList("rezondes", null, null, []), "L"), "");
assert.equal(helpReply("x".repeat(600), list, "L").length, MAX_CHAT);

// Factions: the team command comes before leave and is in the help reply
const roles = { command: "!rolle", label: "Rolle", variants: [{ id: "medic", label: "Medic", names: ["medic"] }] };
const teams = { command: "!team", label: "Fraktion", variants: [{ id: "blau", label: "Blau", names: ["blau"] }] };
const army = commandList("rezondes", null, readMinimeOptions({}, roles, teams).rules, []);
assert.deepEqual(army.items.map(item => item.kind), ["join", "look", "team", "leave"]);
assert.deepEqual(army.items[2], { kind: "team", command: "!team", who: ["everyone"], teams: [{ id: "blau", names: ["blau"] }] });
assert.equal(helpReply("{commands}", army, ""), "!join, !rolle, !team, !leave");

console.log("commands ok");
