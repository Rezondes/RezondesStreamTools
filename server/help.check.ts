// Check für help.ts: Hilfe-Befehl im Chat erkennen, Abklingzeit, Antwort aus der Befehlsliste, Status des
// Schreibrechts. Uhr und Senden sind nachgebaut. Läuft mit npm test.
import assert from "node:assert/strict";
import { commandList } from "../src/core/commands.ts";
import type { ChatLine } from "./chat.ts";
import { startHelp } from "./help.ts";

const HELP = { enabled: true, command: "!befehle", reply: "Befehle: {commands} | {link}", cooldown: 30 };
const line = (text: string): ChatLine => ({ user: "Neo", login: "neo", text, roles: [] });
const sent: string[] = [];
let answer: "ok" | "missing-scope" = "ok";
let now = 0;
const help = startHelp({
  login: "rezondes",
  help: HELP,
  link: "https://x/s/rezondes/",
  now: () => now,
  commands: () => Promise.resolve(commandList("rezondes", HELP, null, [{ name: "a", when: { type: "command", match: "!lizard" } }])),
  say: message => { sent.push(message); return Promise.resolve(answer); },
});

// Vor der ersten Antwort unbekannt, danach aus der Antwort von Twitch
assert.equal(help.canChat(), null);
help.setCanChat(true);
assert.equal(help.canChat(), true);

// Befehl am Anfang, egal ob gross oder klein, mit Rest; andere Nachrichten nicht
await help.handle(line("hallo !befehle"));
await help.handle(line("!BEFEHLE bitte"));
assert.deepEqual(sent, ["Befehle: !lizard | https://x/s/rezondes/"]);
// Die eigene Antwort kommt im Chat zurück: als Echo erkannt (sonst lösten Wort-Trigger aus der Liste aus)
assert.ok(help.isEcho({ ...line("Befehle: !lizard | https://x/s/rezondes/"), login: "rezondes" }));
assert.ok(!help.isEcho(line("Befehle: !lizard | https://x/s/rezondes/")));

// Abklingzeit für alle
now = 29_000;
await help.handle(line("!befehle"));
assert.equal(sent.length, 1);
now = 30_000;
answer = "missing-scope";
await help.handle(line("!befehle"));
assert.equal(sent.length, 2);
assert.equal(help.canChat(), false);

// Neue Einstellung: anderer Befehl, aus = keine Antwort
help.setConfig({ ...HELP, command: "!hilfe", cooldown: 0 });
await help.handle(line("!befehle"));
await help.handle(line("!hilfe"));
assert.equal(sent.length, 3);
help.setConfig({ ...HELP, enabled: false });
now = 100_000;
await help.handle(line("!befehle"));
assert.equal(sent.length, 3);

console.log("help ok");
