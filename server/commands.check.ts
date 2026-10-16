// Check für commands.ts (Server): Hilfe-Befehl prüfen, mit Standardwerten laden und speichern. Dateien liegen in
// einem temporären Ordner. Läuft mit npm test.
import assert from "node:assert/strict";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { DEFAULT_HELP, loadHelp, publicCommands, saveHelp, toHelpConfig } from "./commands.ts";

// Prüfen: gültig wird übernommen (Befehl in Kleinbuchstaben), alles andere ist null
const valid = { enabled: false, command: "!Hilfe", reply: "Befehle: {commands} {link}", cooldown: 10 };
assert.deepEqual(toHelpConfig(valid), { ...valid, command: "!hilfe" });
assert.equal(toHelpConfig({ ...valid, command: "hilfe" }), null);
assert.equal(toHelpConfig({ ...valid, command: "!zwei worte" }), null);
assert.equal(toHelpConfig({ ...valid, reply: "x".repeat(401) }), null);
assert.equal(toHelpConfig({ ...valid, cooldown: -1 }), null);
assert.equal(toHelpConfig({ ...valid, cooldown: 3601 }), null);
assert.equal(toHelpConfig({ ...valid, enabled: "ja" }), null);
assert.equal(toHelpConfig(null), null);

const folder = await mkdtemp(join(tmpdir(), "rz-commands-"));
try {
  // Ohne Datei oder mit kaputter Datei: Standard; gespeichert: der neue Stand
  assert.deepEqual(await loadHelp(folder), DEFAULT_HELP);
  await writeFile(join(folder, "commands.json"), "{kaputt");
  assert.deepEqual(await loadHelp(folder), DEFAULT_HELP);
  await saveHelp(folder, { ...valid, command: "!hilfe" });
  assert.deepEqual(await loadHelp(folder), { ...valid, command: "!hilfe" });

  // Öffentliche Liste: Hilfe aus der Datei, Minimes des gewählten Themes, Trigger aus triggers.json; abgeschaltete
  // Funktionen fehlen
  await writeFile(join(folder, "triggers.json"), JSON.stringify({ triggers: [{ name: "lizard", when: { type: "command", match: "!lizard" }, do: [] }] }));
  await saveHelp(folder, DEFAULT_HELP);
  // Minimes hat nur ein Theme mit der Funktion (Matrix); das Standard-Theme Standard hat keine
  await writeFile(join(folder, "settings.json"), JSON.stringify({ theme: "matrix", values: {} }));
  const all = { minimes: true, triggers: true, fx: true };
  const kinds = async (features: Record<string, boolean>) => (await publicCommands(folder, "rezondes", features)).items.map(item => item.kind);
  assert.deepEqual(await kinds(all), ["help", "join", "look", "leave", "trigger"]);
  assert.deepEqual(await kinds({ ...all, minimes: false, fx: false }), ["help"]);
  assert.equal((await publicCommands(folder, "rezondes", all)).channel, "rezondes");
  // Kaputte triggers.json: keine Trigger, der Rest bleibt
  await writeFile(join(folder, "triggers.json"), "{kaputt");
  assert.deepEqual(await kinds(all), ["help", "join", "look", "leave"]);
} finally {
  await rm(folder, { recursive: true, force: true });
}

console.log("server commands ok");
