// Check for help.ts: detect the help command in chat, cooldown, reply from the commands list, status of the
// write permission. Clock and sending are fakes. Runs with npm test.
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

// Unknown before the first reply, afterwards from Twitch's answer
assert.equal(help.canChat(), null);
help.setCanChat(true);
assert.equal(help.canChat(), true);

// Command at the start, upper or lower case, with a rest; other messages not
await help.handle(line("hello !befehle"));
await help.handle(line("!BEFEHLE bitte"));
assert.deepEqual(sent, ["Befehle: !lizard | https://x/s/rezondes/"]);
// Our own reply comes back in chat: detected as an echo (otherwise word triggers from the list would fire)
assert.ok(help.isEcho({ ...line("Befehle: !lizard | https://x/s/rezondes/"), login: "rezondes" }));
assert.ok(!help.isEcho(line("Befehle: !lizard | https://x/s/rezondes/")));

// Cooldown for everyone
now = 29_000;
await help.handle(line("!befehle"));
assert.equal(sent.length, 1);
now = 30_000;
answer = "missing-scope";
await help.handle(line("!befehle"));
assert.equal(sent.length, 2);
assert.equal(help.canChat(), false);

// New setting: other command, off = no reply
help.setConfig({ ...HELP, command: "!hilfe", cooldown: 0 });
await help.handle(line("!befehle"));
await help.handle(line("!hilfe"));
assert.equal(sent.length, 3);
help.setConfig({ ...HELP, enabled: false });
now = 100_000;
await help.handle(line("!befehle"));
assert.equal(sent.length, 3);

console.log("help ok");
