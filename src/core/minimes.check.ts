// Check für minimes.ts: Farben, Chatbefehle und die Minime-Liste. Läuft mit npm test (einzeln: node src/core/minimes.check.ts).
import assert from "node:assert/strict";
import { applyMinime, emptyMinimeState, MAX_STORED_COLORS, normalizeName, parseColor, parseCommand, type MinimeEvent, type MinimeRules, type MinimeState } from "./minimes.ts";

const RULES: MinimeRules = {
  commands: { join: "!join", look: "!color", leave: "!leave" },
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
  variants: null,
};
const MINUTE = 60_000;
// Zufall fest: der erste erlaubte Typ (im Farb-Modus ohne Wirkung)
const apply = (state: MinimeState, event: MinimeEvent, now: number, rules: MinimeRules, random = () => 0) => applyMinime(state, event, now, rules, random);

// Mehrere Ereignisse nacheinander anwenden, Zeitpunkt je Ereignis
function run(steps: [MinimeEvent, number][], rules: MinimeRules = RULES, start: MinimeState = emptyMinimeState()) {
  return steps.reduce((state, [event, now]) => apply(state, event, now, rules).state, start);
}
const logins = (state: MinimeState) => state.roster.map(minime => minime.login);
const join = (login: string, color: string | null = null, twitchColor: string | null = null, variant: string | null = null): MinimeEvent => ({ type: "join", login, user: login.toUpperCase(), color, variant, twitchColor });

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
assert.deepEqual(parseCommand("!join", [], RULES), { type: "join", color: null, variant: null });
assert.deepEqual(parseCommand("!JOIN #f0a", [], RULES), { type: "join", color: "#ff00aa", variant: null });
assert.deepEqual(parseCommand("!join kaputt", [], RULES), { type: "join", color: null, variant: null });
assert.deepEqual(parseCommand("!color 255 0 0", [], RULES), { type: "color", color: "#ff0000" });
assert.equal(parseCommand("!color lila", [], RULES), null);
assert.deepEqual(parseCommand("!leave", [], RULES), { type: "leave" });
assert.equal(parseCommand("!joinx", [], RULES), null);
assert.equal(parseCommand("hallo !join", [], RULES), null);
// Befehlswörter sind einstellbar
assert.deepEqual(parseCommand("!geist", [], { ...RULES, commands: { ...RULES.commands, join: "!geist" } }), { type: "join", color: null, variant: null });

// Rollen: fremde Minimes rauswerfen nur mit erlaubter Rolle, einklinken nur mit erlaubter Rolle
assert.deepEqual(parseCommand("!leave @Neo_42", ["moderator"], RULES), { type: "kick", login: "neo_42" });
assert.deepEqual(parseCommand("!leave @Neo_42", [], RULES), { type: "leave" });
assert.deepEqual(parseCommand("!leave @../x", ["moderator"], RULES), { type: "leave" });
assert.equal(parseCommand("!join", [], { ...RULES, joinRoles: ["subscriber"] }), null);
assert.equal(parseCommand("!color #fff", ["vip"], { ...RULES, joinRoles: ["subscriber"] }), null);
assert.deepEqual(parseCommand("!join", ["subscriber"], { ...RULES, joinRoles: ["subscriber"] }), { type: "join", color: null, variant: null });
// Der Streamer darf immer
assert.deepEqual(parseCommand("!join", ["broadcaster"], { ...RULES, joinRoles: ["vip"] }), { type: "join", color: null, variant: null });

// Liste: einklinken, raus, wieder rein mit der gemerkten Farbe
{
  const first = apply(emptyMinimeState(), join("neo", "#ff00aa"), 0, RULES);
  assert.equal(first.changed, true);
  const left = apply(first.state, { type: "leave", login: "neo" }, 1000, RULES);
  assert.equal(left.changed, true);
  assert.deepEqual(logins(left.state), []);
  const back = apply(left.state, join("neo"), 20_000, RULES);
  assert.deepEqual(back.state.roster, [{ login: "neo", user: "NEO", color: "#ff00aa", variant: null, lastSeen: 20_000 }]);
  // Nochmal einklinken ohne Änderung meldet nichts
  assert.equal(apply(back.state, join("neo"), 21_000, RULES).changed, false);
}

// Liste: ohne eigene Farbe gilt die Twitch-Farbe (aufgehellt), wenn eingeschaltet, sonst null
assert.equal(run([[join("neo", null, "#000000"), 0]]).roster[0].color, "#505050");
assert.equal(run([[join("neo", null, "#000000"), 0]], { ...RULES, useTwitchColor: false }).roster[0].color, null);

// Chat: hält am Leben und meldet die Reaktion, je nach Schalter; Unbekannte ändern nichts
{
  const state = run([[join("neo"), 0]]);
  const chat: MinimeEvent = { type: "chat", login: "neo" };
  const result = apply(state, chat, 5000, RULES);
  assert.deepEqual({ lastSeen: result.state.roster[0].lastSeen, react: result.react, changed: result.changed }, { lastSeen: 5000, react: "neo", changed: false });
  assert.equal(apply(state, chat, 5000, { ...RULES, reactToChat: false }).react, null);
  assert.equal(apply(state, chat, 5000, { ...RULES, chatKeepsAlive: false }).state.roster[0].lastSeen, 0);
  const stranger = apply(state, { type: "chat", login: "smith" }, 5000, RULES);
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
  const cleared = apply(state, { type: "clear" }, 1, RULES);
  assert.deepEqual({ roster: cleared.state.roster, changed: cleared.changed }, { roster: [], changed: true });
  assert.equal(apply(cleared.state, { type: "clear" }, 2, RULES).changed, false);
  assert.equal(apply(state, { type: "leave", login: "fremd" }, 1, RULES).changed, false);
}

// Farbspeicher: begrenzt, der am längsten unbenutzte fällt heraus
{
  let state = emptyMinimeState();
  for (let chatter = 0; chatter <= MAX_STORED_COLORS; chatter++) {
    state = apply(state, { type: "color", login: `c${chatter}`, user: "C", color: "#ff0000", twitchColor: null }, chatter, { ...RULES, colorJoins: false }).state;
  }
  assert.equal(Object.keys(state.colors).length, MAX_STORED_COLORS);
  assert.equal(state.colors.c0, undefined);
  assert.ok(state.colors[`c${MAX_STORED_COLORS}`]);
}

// Namen vereinheitlichen: klein, Umlaute ausgeschrieben, ohne Leerzeichen und Bindestriche
assert.equal(normalizeName("Asiatische Birne"), "asiatischebirne");
assert.equal(normalizeName("Kaktus-Feige"), "kaktusfeige");
assert.equal(normalizeName("Süß"), "suess");
assert.equal(normalizeName("  MANGO "), "mango");

// Typ-Modus: Typen statt Farben, Namen im Chat je Typ
const TYPES: MinimeRules = {
  ...RULES,
  commands: { ...RULES.commands, look: "!frucht" },
  variants: [{ id: "mango", names: ["mango"] }, { id: "sternfrucht", names: ["sternfrucht", "karambole"] }],
};

// Befehle: Name hinter !join wählt den Typ, unbekannte Namen ergeben keinen (dann zufällig), !frucht wechselt
assert.deepEqual(parseCommand("!join mango", [], TYPES), { type: "join", color: null, variant: "mango" });
assert.deepEqual(parseCommand("!join", [], TYPES), { type: "join", color: null, variant: null });
assert.deepEqual(parseCommand("!join xyz", [], TYPES), { type: "join", color: null, variant: null });
assert.deepEqual(parseCommand("!join #f0a", [], TYPES), { type: "join", color: null, variant: null });
assert.deepEqual(parseCommand("!frucht Karambole", [], TYPES), { type: "variant", variant: "sternfrucht" });
assert.equal(parseCommand("!frucht xyz", [], TYPES), null);
// Im Farb-Modus bleibt der Typ immer leer
assert.deepEqual(parseCommand("!join mango", [], RULES), { type: "join", color: null, variant: null });

// Einklinken ohne Wahl: zufälliger erlaubter Typ, danach gemerkt; keine Farbe im Typ-Modus
{
  const first = apply(emptyMinimeState(), join("neo", null, "#ff0000"), 0, TYPES, () => 0.99).state;
  assert.deepEqual(first.roster[0], { login: "neo", user: "NEO", color: null, variant: "sternfrucht", lastSeen: 0 });
  const left = apply(first, { type: "leave", login: "neo" }, 1000, TYPES).state;
  assert.equal(apply(left, join("neo"), 2000, TYPES, () => 0).state.roster[0].variant, "sternfrucht");
  // Ein zufällig vergebener Typ lässt sich sofort wechseln
  assert.equal(apply(first, { type: "variant", login: "neo", user: "NEO", variant: "mango" }, 1000, TYPES).state.roster[0].variant, "mango");
}

// Typ wählen und wechseln mit Cooldown; !frucht klinkt ein, wenn eingeschaltet
{
  const pick = (variant: string): MinimeEvent => ({ type: "variant", login: "neo", user: "NEO", variant });
  const state = run([[join("neo", null, null, "mango"), 0], [pick("sternfrucht"), 3000]], TYPES);
  assert.equal(state.roster[0].variant, "mango");
  assert.equal(run([[pick("sternfrucht"), 12_000]], TYPES, state).roster[0].variant, "sternfrucht");
  assert.deepEqual(logins(run([[pick("mango"), 0]], { ...TYPES, colorJoins: false })), []);
  assert.equal(run([[pick("mango"), 0], [join("neo"), 1]], { ...TYPES, colorJoins: false }).roster[0].variant, "mango");
}

// Ausgeschalteter Typ: beim Aufräumen bekommt jeder einen erlaubten, ohne erlaubte Typen bleibt er leer
{
  const state = run([[join("neo", null, null, "mango"), 0]], TYPES);
  const onlyStar: MinimeRules = { ...TYPES, variants: [{ id: "sternfrucht", names: ["sternfrucht"] }] };
  const pruned = apply(state, { type: "prune" }, 1000, onlyStar);
  assert.deepEqual({ variant: pruned.state.roster[0].variant, changed: pruned.changed }, { variant: "sternfrucht", changed: true });
  assert.equal(apply(pruned.state, join("trinity"), 1000, onlyStar).state.roster[1].variant, "sternfrucht");
  assert.equal(apply(state, { type: "prune" }, 1000, { ...TYPES, variants: [] }).state.roster[0].variant, null);
  assert.equal(apply(state, { type: "prune" }, 1000, TYPES).changed, false);
}
