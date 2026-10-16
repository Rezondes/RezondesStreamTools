// Check für infoFields.ts: aus der Befehlsliste und den Texten der Einstellungen werden Abschnitte mit Einträgen.
// Läuft mit npm test.
import assert from "node:assert/strict";
import { commandList } from "./commands.ts";
import { describeCommands, INFO_FIELDS } from "./infoFields.ts";
import { readMinimeOptions } from "./minimeFields.ts";
import { resolveSettings } from "./settings.ts";

const values = resolveSettings({ id: "probe", name: "Probe", fields: INFO_FIELDS }, {});
const HELP = { enabled: true, command: "!befehle", reply: "", cooldown: 30 };
const colors = readMinimeOptions({ minimeJoinRole: "subscriber" }).rules;
const fruits = readMinimeOptions({}, { command: "!frucht", label: "Frucht", variants: [{ id: "mango", label: "Mango", names: ["mango", "mangue"] }] }).rules;

// Alle drei Abschnitte mit Überschrift, Befehl, Text und Details (wer, Abklingzeiten)
const sections = describeCommands(commandList("rezondes", HELP, colors, [
  { name: "lizard", description: "Eine Echse läuft durchs Bild", when: { type: "command", match: "!lizard" }, who: ["vip", "moderator"], cooldown: 5, userCooldown: 60 },
  { name: "hallo", when: { type: "word", match: "hallo" } },
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
  { command: "hallo", text: "", details: ["Schreib das Wort hallo", "Für: alle"] },
  { command: "", text: "", details: ["Eine besondere Nachricht", "Für: alle"] },
]);

// Typen statt Farben: Namen der Typen zum Wählen; leere Liste = keine Abschnitte, aber Text für leer bleibt einstellbar
const typed = describeCommands(commandList("rezondes", null, fruits, []), values)[0].entries;
assert.equal(typed[1].text, "Typ deiner Figur wählen: !frucht <Name>");
// Je Typ nur der erste Name, die übrigen versteht der Chat trotzdem
assert.deepEqual(typed[1].details, ["Für: alle", "Zur Wahl: mango"]);
assert.deepEqual(typed[0].details, ["Für: alle", "Mit Typ: !join mango"]);
assert.deepEqual(describeCommands(commandList("rezondes", null, null, []), values), []);

console.log("infoFields ok");
