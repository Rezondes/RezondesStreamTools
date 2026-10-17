// Check for minimes.ts: colors, chat commands and the minime list. Runs with npm test (alone: node src/core/minimes.check.ts).
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
// Fixed randomness: the first allowed variant (no effect in color mode)
const apply = (state: MinimeState, event: MinimeEvent, now: number, rules: MinimeRules, random = () => 0) => applyMinime(state, event, now, rules, random);

// Apply several events one after another, time per event
function run(steps: [MinimeEvent, number][], rules: MinimeRules = RULES, start: MinimeState = emptyMinimeState()) {
  return steps.reduce((state, [event, now]) => apply(state, event, now, rules).state, start);
}
const logins = (state: MinimeState) => state.roster.map(minime => minime.login);
const join = (login: string, color: string | null = null, twitchColor: string | null = null, variant: string | null = null): MinimeEvent => ({ type: "join", login, user: login.toUpperCase(), color, variant, twitchColor });

// Colors: all supported formats give #rrggbb in lower case
for (const input of ["#FF00AA", "ff00aa", "#f0a", "255 0 170", "255,0,170", "rgb(255, 0, 170)", " RGB(255,0,170) "]) {
  assert.equal(parseColor(input, 80), "#ff00aa", input);
}

// Colors: everything else is invalid
for (const input of ["#ff00a", "256 0 0", "#gg0000", "", "rot", "1 2", "rgb(1, 2)", "-1 0 0"]) {
  assert.equal(parseColor(input, 80), null, input);
}

// Colors: too dark ones are brightened proportionally up to the threshold, threshold 0 leaves everything as it is
assert.equal(parseColor("#000000", 80), "#505050");
assert.equal(parseColor("#200010", 80), "#500028");
assert.equal(parseColor("#ff0000", 80), "#ff0000");
assert.equal(parseColor("#000000", 0), "#000000");

// Commands: at the start of the message, case-insensitive, color optional
assert.deepEqual(parseCommand("!join", [], RULES), { type: "join", color: null, variant: null });
assert.deepEqual(parseCommand("!JOIN #f0a", [], RULES), { type: "join", color: "#ff00aa", variant: null });
assert.deepEqual(parseCommand("!join kaputt", [], RULES), { type: "join", color: null, variant: null });
assert.deepEqual(parseCommand("!color 255 0 0", [], RULES), { type: "color", color: "#ff0000" });
assert.equal(parseCommand("!color lila", [], RULES), null);
assert.deepEqual(parseCommand("!leave", [], RULES), { type: "leave" });
assert.equal(parseCommand("!joinx", [], RULES), null);
assert.equal(parseCommand("hello !join", [], RULES), null);
// Command words are configurable
assert.deepEqual(parseCommand("!geist", [], { ...RULES, commands: { ...RULES.commands, join: "!geist" } }), { type: "join", color: null, variant: null });

// Roles: kicking other minimes only with an allowed role, joining only with an allowed role
assert.deepEqual(parseCommand("!leave @Neo_42", ["moderator"], RULES), { type: "kick", login: "neo_42" });
assert.deepEqual(parseCommand("!leave @Neo_42", [], RULES), { type: "leave" });
assert.deepEqual(parseCommand("!leave @../x", ["moderator"], RULES), { type: "leave" });
assert.equal(parseCommand("!join", [], { ...RULES, joinRoles: ["subscriber"] }), null);
assert.equal(parseCommand("!color #fff", ["vip"], { ...RULES, joinRoles: ["subscriber"] }), null);
assert.deepEqual(parseCommand("!join", ["subscriber"], { ...RULES, joinRoles: ["subscriber"] }), { type: "join", color: null, variant: null });
// The streamer may always
assert.deepEqual(parseCommand("!join", ["broadcaster"], { ...RULES, joinRoles: ["vip"] }), { type: "join", color: null, variant: null });

// List: join, leave, join again with the remembered color
{
  const first = apply(emptyMinimeState(), join("neo", "#ff00aa"), 0, RULES);
  assert.equal(first.changed, true);
  const left = apply(first.state, { type: "leave", login: "neo" }, 1000, RULES);
  assert.equal(left.changed, true);
  assert.deepEqual(logins(left.state), []);
  const back = apply(left.state, join("neo"), 20_000, RULES);
  assert.deepEqual(back.state.roster, [{ login: "neo", user: "NEO", color: "#ff00aa", variant: null, lastSeen: 20_000 }]);
  // Joining again without a change reports nothing
  assert.equal(apply(back.state, join("neo"), 21_000, RULES).changed, false);
}

// List: without an own color the Twitch color applies (brightened) if switched on, otherwise null
assert.equal(run([[join("neo", null, "#000000"), 0]]).roster[0].color, "#505050");
assert.equal(run([[join("neo", null, "#000000"), 0]], { ...RULES, useTwitchColor: false }).roster[0].color, null);

// Chat: keeps alive and reports the reaction, depending on the switch; strangers change nothing
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

// Full list: the longest inactive one is removed, or the new one is rejected
{
  const steps: [MinimeEvent, number][] = [[join("a"), 1], [join("b"), 2], [join("c"), 3]];
  assert.deepEqual(logins(run(steps, { ...RULES, max: 2 })), ["b", "c"]);
  assert.deepEqual(logins(run(steps, { ...RULES, max: 2, whenFull: "reject" })), ["a", "b"]);
}

// Cleanup: inactive ones disappear (0 = never), a too long list is shortened
{
  const steps: [MinimeEvent, number][] = [[join("a"), 0], [join("b"), 16 * MINUTE], [{ type: "prune" }, 21 * MINUTE]];
  assert.deepEqual(logins(run(steps)), ["b"]);
  assert.deepEqual(logins(run(steps, { ...RULES, idleMinutes: 0 })), ["a", "b"]);
  const full = run([[join("a"), 1], [join("b"), 2], [join("c"), 3]]);
  assert.deepEqual(logins(run([[{ type: "prune" }, 4]], { ...RULES, max: 1 }, full)), ["c"]);
}

// Color: cooldown per chatter, and !color only joins if switched on (the color is remembered anyway)
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

// Kick, ban (can be switched off) and clear
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

// Color memory: limited, the longest unused one drops out
{
  let state = emptyMinimeState();
  for (let chatter = 0; chatter <= MAX_STORED_COLORS; chatter++) {
    state = apply(state, { type: "color", login: `c${chatter}`, user: "C", color: "#ff0000", twitchColor: null }, chatter, { ...RULES, colorJoins: false }).state;
  }
  assert.equal(Object.keys(state.colors).length, MAX_STORED_COLORS);
  assert.equal(state.colors.c0, undefined);
  assert.ok(state.colors[`c${MAX_STORED_COLORS}`]);
}

// Normalize names: lower case, German umlauts spelled out, without spaces and hyphens
assert.equal(normalizeName("Asiatische Birne"), "asiatischebirne");
assert.equal(normalizeName("Kaktus-Feige"), "kaktusfeige");
assert.equal(normalizeName("Süß"), "suess");
assert.equal(normalizeName("  MANGO "), "mango");

// Variant mode: variants instead of colors, names in chat per variant
const TYPES: MinimeRules = {
  ...RULES,
  commands: { ...RULES.commands, look: "!frucht" },
  variants: [{ id: "mango", names: ["mango"] }, { id: "sternfrucht", names: ["sternfrucht", "karambole"] }],
};

// Commands: a name after !join chooses the variant, unknown names give none (then random), !frucht switches
assert.deepEqual(parseCommand("!join mango", [], TYPES), { type: "join", color: null, variant: "mango" });
assert.deepEqual(parseCommand("!join", [], TYPES), { type: "join", color: null, variant: null });
assert.deepEqual(parseCommand("!join xyz", [], TYPES), { type: "join", color: null, variant: null });
assert.deepEqual(parseCommand("!join #f0a", [], TYPES), { type: "join", color: null, variant: null });
assert.deepEqual(parseCommand("!frucht Karambole", [], TYPES), { type: "variant", variant: "sternfrucht" });
assert.equal(parseCommand("!frucht xyz", [], TYPES), null);
// In color mode the variant always stays empty
assert.deepEqual(parseCommand("!join mango", [], RULES), { type: "join", color: null, variant: null });

// Joining without a choice: random allowed variant, remembered afterwards; no color in variant mode
{
  const first = apply(emptyMinimeState(), join("neo", null, "#ff0000"), 0, TYPES, () => 0.99).state;
  assert.deepEqual(first.roster[0], { login: "neo", user: "NEO", color: null, variant: "sternfrucht", lastSeen: 0 });
  const left = apply(first, { type: "leave", login: "neo" }, 1000, TYPES).state;
  assert.equal(apply(left, join("neo"), 2000, TYPES, () => 0).state.roster[0].variant, "sternfrucht");
  // A randomly assigned variant can be switched immediately
  assert.equal(apply(first, { type: "variant", login: "neo", user: "NEO", variant: "mango" }, 1000, TYPES).state.roster[0].variant, "mango");
}

// Choose and switch the variant with cooldown; !frucht joins if switched on
{
  const pick = (variant: string): MinimeEvent => ({ type: "variant", login: "neo", user: "NEO", variant });
  const state = run([[join("neo", null, null, "mango"), 0], [pick("sternfrucht"), 3000]], TYPES);
  assert.equal(state.roster[0].variant, "mango");
  assert.equal(run([[pick("sternfrucht"), 12_000]], TYPES, state).roster[0].variant, "sternfrucht");
  assert.deepEqual(logins(run([[pick("mango"), 0]], { ...TYPES, colorJoins: false })), []);
  assert.equal(run([[pick("mango"), 0], [join("neo"), 1]], { ...TYPES, colorJoins: false }).roster[0].variant, "mango");
}

// Switched-off variant: on cleanup everyone gets an allowed one, without allowed variants it stays empty
{
  const state = run([[join("neo", null, null, "mango"), 0]], TYPES);
  const onlyStar: MinimeRules = { ...TYPES, variants: [{ id: "sternfrucht", names: ["sternfrucht"] }] };
  const pruned = apply(state, { type: "prune" }, 1000, onlyStar);
  assert.deepEqual({ variant: pruned.state.roster[0].variant, changed: pruned.changed }, { variant: "sternfrucht", changed: true });
  assert.equal(apply(pruned.state, join("trinity"), 1000, onlyStar).state.roster[1].variant, "sternfrucht");
  assert.equal(apply(state, { type: "prune" }, 1000, { ...TYPES, variants: [] }).state.roster[0].variant, null);
  assert.equal(apply(state, { type: "prune" }, 1000, TYPES).changed, false);
}
