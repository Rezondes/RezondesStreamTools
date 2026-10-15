// Check für minimes.ts: Farben, Chatbefehle und die Minime-Liste. Läuft mit npm test (einzeln: node src/core/minimes.check.ts).
import assert from "node:assert/strict";
import { applyMinime, emptyMinimeState, MAX_STORED_COLORS, parseColor, parseCommand, type MinimeEvent, type MinimeRules, type MinimeState } from "./minimes.ts";

const RULES: MinimeRules = {
  commands: { join: "!join", color: "!color", leave: "!leave" },
  joinRoles: ["everyone"],
  kickRoles: ["moderator", "broadcaster"],
  colorJoins: true,
  max: 30,
  whenFull: "replace",
  idleMinutes: 20,
  colorCooldownS: 10,
  minBrightness: 80,
  useTwitchColor: true,
  chatKeepsAlive: true,
  reactToChat: true,
  clearOffline: true,
  removeOnBan: true,
};
const MINUTE = 60_000;

// Mehrere Ereignisse nacheinander anwenden, Zeitpunkt je Ereignis
function run(steps: [MinimeEvent, number][], rules: MinimeRules = RULES, start: MinimeState = emptyMinimeState()) {
  return steps.reduce((state, [event, now]) => applyMinime(state, event, now, rules).state, start);
}
const logins = (state: MinimeState) => state.roster.map(minime => minime.login);
const join = (login: string, color: string | null = null, twitchColor: string | null = null): MinimeEvent => ({ type: "join", login, user: login.toUpperCase(), color, twitchColor });

// Farben: alle unterstützten Formate ergeben #rrggbb in Kleinbuchstaben
for (const input of ["#FF00AA", "ff00aa", "#f0a", "255 0 170", "255,0,170", "rgb(255, 0, 170)", " RGB(255,0,170) "]) {
  assert.equal(parseColor(input, 80), "#ff00aa", input);
}

// Farben: alles andere ist ungültig
for (const input of ["#ff00a", "256 0 0", "#gg0000", "", "rot", "1 2", "rgb(1, 2)", "-1 0 0"]) {
  assert.equal(parseColor(input, 80), null, input);
}

// Farben: zu dunkle werden proportional bis zur Schwelle aufgehellt, Schwelle 0 lässt alles wie es ist
assert.equal(parseColor("#000000", 80), "#505050");
assert.equal(parseColor("#200010", 80), "#500028");
assert.equal(parseColor("#ff0000", 80), "#ff0000");
assert.equal(parseColor("#000000", 0), "#000000");

// Befehle: am Anfang der Nachricht, Gross-/Kleinschreibung egal, Farbe optional
assert.deepEqual(parseCommand("!join", [], RULES), { type: "join", color: null });
assert.deepEqual(parseCommand("!JOIN #f0a", [], RULES), { type: "join", color: "#ff00aa" });
assert.deepEqual(parseCommand("!join kaputt", [], RULES), { type: "join", color: null });
assert.deepEqual(parseCommand("!color 255 0 0", [], RULES), { type: "color", color: "#ff0000" });
assert.equal(parseCommand("!color lila", [], RULES), null);
assert.deepEqual(parseCommand("!leave", [], RULES), { type: "leave" });
assert.equal(parseCommand("!joinx", [], RULES), null);
assert.equal(parseCommand("hallo !join", [], RULES), null);
// Befehlswörter sind einstellbar
assert.deepEqual(parseCommand("!geist", [], { ...RULES, commands: { ...RULES.commands, join: "!geist" } }), { type: "join", color: null });

// Rollen: fremde Minimes rauswerfen nur mit erlaubter Rolle, einklinken nur mit erlaubter Rolle
assert.deepEqual(parseCommand("!leave @Neo_42", ["moderator"], RULES), { type: "kick", login: "neo_42" });
assert.deepEqual(parseCommand("!leave @Neo_42", [], RULES), { type: "leave" });
assert.deepEqual(parseCommand("!leave @../x", ["moderator"], RULES), { type: "leave" });
assert.equal(parseCommand("!join", [], { ...RULES, joinRoles: ["subscriber"] }), null);
assert.equal(parseCommand("!color #fff", ["vip"], { ...RULES, joinRoles: ["subscriber"] }), null);
assert.deepEqual(parseCommand("!join", ["subscriber"], { ...RULES, joinRoles: ["subscriber"] }), { type: "join", color: null });
// Der Streamer darf immer
assert.deepEqual(parseCommand("!join", ["broadcaster"], { ...RULES, joinRoles: ["vip"] }), { type: "join", color: null });

// Liste: einklinken, raus, wieder rein mit der gemerkten Farbe
{
  const first = applyMinime(emptyMinimeState(), join("neo", "#ff00aa"), 0, RULES);
  assert.equal(first.changed, true);
  const left = applyMinime(first.state, { type: "leave", login: "neo" }, 1000, RULES);
  assert.equal(left.changed, true);
  assert.deepEqual(logins(left.state), []);
  const back = applyMinime(left.state, join("neo"), 20_000, RULES);
  assert.deepEqual(back.state.roster, [{ login: "neo", user: "NEO", color: "#ff00aa", lastSeen: 20_000 }]);
  // Nochmal einklinken ohne Änderung meldet nichts
  assert.equal(applyMinime(back.state, join("neo"), 21_000, RULES).changed, false);
}

// Liste: ohne eigene Farbe gilt die Twitch-Farbe (aufgehellt), wenn eingeschaltet, sonst null
assert.equal(run([[join("neo", null, "#000000"), 0]]).roster[0].color, "#505050");
assert.equal(run([[join("neo", null, "#000000"), 0]], { ...RULES, useTwitchColor: false }).roster[0].color, null);

// Chat: hält am Leben und meldet die Reaktion, je nach Schalter; Unbekannte ändern nichts
{
  const state = run([[join("neo"), 0]]);
  const chat: MinimeEvent = { type: "chat", login: "neo" };
  const result = applyMinime(state, chat, 5000, RULES);
  assert.deepEqual({ lastSeen: result.state.roster[0].lastSeen, react: result.react, changed: result.changed }, { lastSeen: 5000, react: "neo", changed: false });
  assert.equal(applyMinime(state, chat, 5000, { ...RULES, reactToChat: false }).react, null);
  assert.equal(applyMinime(state, chat, 5000, { ...RULES, chatKeepsAlive: false }).state.roster[0].lastSeen, 0);
  const stranger = applyMinime(state, { type: "chat", login: "smith" }, 5000, RULES);
  assert.deepEqual({ state: stranger.state, react: stranger.react }, { state, react: null });
}

// Volle Liste: der am längsten Inaktive fliegt raus, oder der Neue wird abgewiesen
{
  const steps: [MinimeEvent, number][] = [[join("a"), 1], [join("b"), 2], [join("c"), 3]];
  assert.deepEqual(logins(run(steps, { ...RULES, max: 2 })), ["b", "c"]);
  assert.deepEqual(logins(run(steps, { ...RULES, max: 2, whenFull: "reject" })), ["a", "b"]);
}

// Aufräumen: Inaktive verschwinden (0 = nie), eine zu lange Liste wird gekürzt
{
  const steps: [MinimeEvent, number][] = [[join("a"), 0], [join("b"), 16 * MINUTE], [{ type: "prune" }, 21 * MINUTE]];
  assert.deepEqual(logins(run(steps)), ["b"]);
  assert.deepEqual(logins(run(steps, { ...RULES, idleMinutes: 0 })), ["a", "b"]);
  const full = run([[join("a"), 1], [join("b"), 2], [join("c"), 3]]);
  assert.deepEqual(logins(run([[{ type: "prune" }, 4]], { ...RULES, max: 1 }, full)), ["c"]);
}

// Farbe: Cooldown pro Chatter, und !color klinkt nur ein, wenn eingeschaltet (die Farbe wird trotzdem gemerkt)
{
  const color = (value: string): MinimeEvent => ({ type: "color", login: "b", user: "B", color: value, twitchColor: null });
  const state = run([[join("b"), 0], [color("#ff0000"), 1000], [color("#00ff00"), 4000]]);
  assert.equal(state.roster[0].color, "#ff0000");
  assert.equal(run([[color("#00ff00"), 12_000]], RULES, state).roster[0].color, "#00ff00");
  const outside = run([[color("#0000ff"), 0]], { ...RULES, colorJoins: false });
  assert.deepEqual(logins(outside), []);
  assert.equal(run([[join("b"), 1000]], RULES, outside).roster[0].color, "#0000ff");
  assert.deepEqual(logins(run([[color("#0000ff"), 0]])), ["b"]);
}

// Rauswerfen, Ban (abschaltbar) und Leeren
{
  const state = run([[join("a"), 0], [join("b"), 0]]);
  assert.deepEqual(logins(run([[{ type: "kick", login: "a" }, 1]], RULES, state)), ["b"]);
  assert.deepEqual(logins(run([[{ type: "ban", login: "a" }, 1]], RULES, state)), ["b"]);
  assert.deepEqual(logins(run([[{ type: "ban", login: "a" }, 1]], { ...RULES, removeOnBan: false }, state)), ["a", "b"]);
  const cleared = applyMinime(state, { type: "clear" }, 1, RULES);
  assert.deepEqual({ roster: cleared.state.roster, changed: cleared.changed }, { roster: [], changed: true });
  assert.equal(applyMinime(cleared.state, { type: "clear" }, 2, RULES).changed, false);
  assert.equal(applyMinime(state, { type: "leave", login: "fremd" }, 1, RULES).changed, false);
}

// Farbspeicher: begrenzt, der am längsten unbenutzte fällt heraus
{
  let state = emptyMinimeState();
  for (let chatter = 0; chatter <= MAX_STORED_COLORS; chatter++) {
    state = applyMinime(state, { type: "color", login: `c${chatter}`, user: "C", color: "#ff0000", twitchColor: null }, chatter, { ...RULES, colorJoins: false }).state;
  }
  assert.equal(Object.keys(state.colors).length, MAX_STORED_COLORS);
  assert.equal(state.colors.c0, undefined);
  assert.ok(state.colors[`c${MAX_STORED_COLORS}`]);
}
