// Check for infoFields.ts: sections with entries are built from the commands list and the texts of the settings.
// Runs with npm test.
import assert from "node:assert/strict";
import { commandList } from "./commands.ts";
import { describeCommands, INFO_FIELDS } from "./infoFields.ts";
import { readMinimeOptions } from "./minimeFields.ts";
import { resolveSettings } from "./settings.ts";

const values = resolveSettings({ id: "probe", name: "Probe", fields: INFO_FIELDS }, {});
const HELP = { enabled: true, command: "!befehle", reply: "", cooldown: 30 };
const colors = readMinimeOptions({ minimeJoinRole: "subscriber" }).rules;
const fruits = readMinimeOptions({}, { command: "!frucht", label: "Frucht", variants: [{ id: "mango", label: "Mango", names: ["mango", "mangue"] }] }).rules;

// All three sections with heading, command, text and details (who, cooldowns)
const sections = describeCommands(commandList("rezondes", HELP, colors, [
  { name: "lizard", description: "Eine Echse läuft durchs Bild", when: { type: "command", match: "!lizard" }, who: ["vip", "moderator"], cooldown: 5, userCooldown: 60 },
  { name: "hello", when: { type: "word", match: "hello" } },
  { name: "muster", when: { type: "regex", match: "^a+$" } },
]), values);
assert.deepEqual(sections.map(section => [section.id, section.heading]), [["help", "Hilfe"], ["minimes", "Minimes"], ["triggers", "Effekte"]]);
assert.deepEqual(sections[0].entries, [{ command: "!befehle", text: "Zeigt die Befehle im Chat.", details: ["Pause danach: 30 s"] }]);
assert.deepEqual(sections[1].entries.map(entry => entry.command), ["!join", "!color", "!leave"]);
assert.deepEqual(sections[1].entries[0].details, ["Für: Subs, VIPs, Mods", "Mit Farbe: !join #ff00aa oder !join 255 0 170"]);
assert.equal(sections[1].entries[1].text, "Farbe deiner Figur ändern, z.B. !color #00ffaa");
assert.deepEqual(sections[1].entries[2].details, ["Mods: !leave @name wirft eine Figur raus."]);
assert.deepEqual(sections[2].entries, [
  { command: "!lizard", text: "Eine Echse läuft durchs Bild", details: ["Tippe !lizard", "Für: VIPs, Mods", "Pause danach: 5 s", "Pro Person: 60 s"] },
  { command: "hello", text: "", details: ["Schreib das Wort hello", "Für: alle"] },
  { command: "", text: "", details: ["Eine besondere Nachricht", "Für: alle"] },
]);

// Variants instead of colors: names of the variants to choose; empty list = no sections, but the text for empty stays configurable
const typed = describeCommands(commandList("rezondes", null, fruits, []), values)[0].entries;
assert.equal(typed[1].text, "Typ deiner Figur wählen: !frucht <Name>");
// Only the first name per variant, chat understands the others anyway
assert.deepEqual(typed[1].details, ["Für: alle", "Zur Wahl: mango"]);
assert.deepEqual(typed[0].details, ["Für: alle", "Mit Typ: !join mango"]);
assert.deepEqual(describeCommands(commandList("rezondes", null, null, []), values), []);

console.log("infoFields ok");
