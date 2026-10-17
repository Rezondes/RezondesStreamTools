// Rules of the minimes (chatters as figures in the scene minimes): read colors or variants (e.g. fruits) from chat,
// detect chat commands and keep the list of joined chatters. Pure (rule 12): time comes in as now, all thresholds and switches
// as rules (settings of the streamer, see minimeFields.ts), randomness as random. The server applies the same
// rules in Rust (rst-domain minimes).
// Check: minimes.check.ts.
import type { Minime } from "./types.ts";

// All settings that decide what the list does. Roles: Twitch badges (subscriber, vip, moderator,
// broadcaster) or everyone; the streamer (broadcaster) may always do everything. look: command for color or variant.
// variants: allowed variants with their names in chat (normalized, see normalizeName); null = the theme uses colors.
export type MinimeRules = {
  commands: { join: string; look: string; leave: string };
  joinRoles: readonly string[];
  kickRoles: readonly string[];
  colorJoins: boolean; // !color joins chatters who have not joined
  max: number;
  whenFull: "replace" | "reject"; // replace: the longest inactive one is removed
  idleMinutes: number; // 0 = never
  colorCooldownS: number;
  minBrightness: number; // 0 to 255, brightest channel of a color
  useTwitchColor: boolean;
  chatKeepsAlive: boolean;
  reactToChat: boolean;
  clearOffline: boolean; // evaluated by the server on stream.offline
  removeOnBan: boolean;
  variants: readonly MinimeVariantRule[] | null;
};
export type MinimeVariantRule = { id: string; names: readonly string[] };

export type MinimeEntry = Minime & { lastSeen: number };
// Colors stay remembered even when the minime disappears. usedAt: last used (for the upper limit),
// changedAt: last changed (for the cooldown)
type StoredColor = { color: string; usedAt: number; changedAt: number };
type StoredVariant = { variant: string; usedAt: number; changedAt: number };
export type MinimeState = { roster: MinimeEntry[]; colors: Record<string, StoredColor>; variants: Record<string, StoredVariant> };

// Events from chat and from the server. twitchColor: name color from the Twitch tag color (or null)
export type MinimeEvent =
  | { type: "join"; login: string; user: string; color: string | null; variant: string | null; twitchColor: string | null }
  | { type: "color"; login: string; user: string; color: string; twitchColor: string | null }
  | { type: "variant"; login: string; user: string; variant: string }
  | { type: "leave" | "kick" | "chat" | "ban"; login: string }
  | { type: "prune" | "clear" };

type MinimeCommand =
  | { type: "join"; color: string | null; variant: string | null }
  | { type: "color"; color: string }
  | { type: "variant"; variant: string }
  | { type: "leave" }
  | { type: "kick"; login: string };

// changed: the visible list changed; react: login whose minime should react to chat
type MinimeResult = { state: MinimeState; changed: boolean; react: string | null };

// fixed: memory guard, so minimes.json does not grow without limit
export const MAX_STORED_COLORS = 2000;

const LOGIN = /^[a-z0-9_]{1,25}$/;
const HEX = /^#?([0-9a-f]{3}|[0-9a-f]{6})$/i;
const RGB_CALL = /^rgb\s*\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})\s*\)$/i;
const RGB_LIST = /^(\d{1,3})(?:\s*,\s*|\s+)(\d{1,3})(?:\s*,\s*|\s+)(\d{1,3})$/;

// Empty state: nobody joined, no colors and variants remembered
export const emptyMinimeState = (): MinimeState => ({ roster: [], colors: {}, variants: {} });

const SPELLED: Record<string, string> = { "ä": "ae", "ö": "oe", "ü": "ue", "ß": "ss" };

// Makes a name from chat or the settings comparable: lower case, ä/ö/ü/ß spelled out, without spaces and hyphens
export function normalizeName(text: string): string {
  return text.toLowerCase().replace(/[äöüß]/g, letter => SPELLED[letter]).replace(/[\s-]+/g, "");
}

// Variant for a name from chat, null if no allowed variant has that name
const findVariant = (text: string, variants: readonly MinimeVariantRule[]) =>
  variants.find(variant => variant.names.includes(normalizeName(text)))?.id ?? null;

// Channels 0 to 255 from an input, null if not a supported format
function channels(text: string): number[] | null {
  const hex = HEX.exec(text);
  if (hex) {
    const digits = hex[1].length === 3 ? [...hex[1]].map(digit => digit + digit).join("") : hex[1];
    return [0, 2, 4].map(offset => parseInt(digits.slice(offset, offset + 2), 16));
  }
  const rgb = RGB_CALL.exec(text) ?? RGB_LIST.exec(text);
  const values = rgb?.slice(1, 4).map(Number) ?? null;
  return values && values.every(value => value <= 255) ? values : null;
}

// Color from chat (#ff00aa, ff00aa, #f0a, "255 0 170", "255,0,170", "rgb(255, 0, 170)") as #rrggbb, otherwise null.
// If the brightest channel is below minBrightness, the color is brightened proportionally up to it.
export function parseColor(text: string, minBrightness: number): string | null {
  const values = channels(text.trim());
  if (!values) return null;
  const brightest = Math.max(...values);
  const lifted = brightest >= minBrightness ? values
    : brightest === 0 ? values.map(() => minBrightness)
    : values.map(value => Math.round((value * minBrightness) / brightest));
  return `#${lifted.map(value => value.toString(16).padStart(2, "0")).join("")}`;
}

const hasRole = (roles: readonly string[], allowed: readonly string[]) =>
  allowed.includes("everyone") || roles.includes("broadcaster") || roles.some(role => allowed.includes(role));

// Command at the start of a chat message, null for everything else or without an allowed role.
// Leave with a target (@name) kicks another minime if the role may, otherwise it is a normal leave.
export function parseCommand(text: string, roles: readonly string[], rules: MinimeRules): MinimeCommand | null {
  const [word = "", ...rest] = text.trim().split(/\s+/);
  const argument = rest.join(" ");
  const command = word.toLowerCase();
  if (command === rules.commands.leave.toLowerCase()) {
    const target = argument.replace(/^@/, "").toLowerCase();
    return argument && LOGIN.test(target) && hasRole(roles, rules.kickRoles) ? { type: "kick", login: target } : { type: "leave" };
  }
  if (!hasRole(roles, rules.joinRoles)) return null;
  const { variants } = rules;
  if (command === rules.commands.join.toLowerCase()) {
    if (variants) return { type: "join", color: null, variant: argument ? findVariant(argument, variants) : null };
    return { type: "join", color: argument ? parseColor(argument, rules.minBrightness) : null, variant: null };
  }
  if (command !== rules.commands.look.toLowerCase()) return null;
  if (variants) {
    const variant = findVariant(argument, variants);
    return variant ? { type: "variant", variant } : null;
  }
  const color = parseColor(argument, rules.minBrightness);
  return color ? { type: "color", color } : null;
}

type Remembered = { usedAt: number; changedAt: number };

// Remember a new color or variant when the cooldown is over (same: same value as remembered, make: new entry with
// changedAt); the longest unused entry drops out above the upper limit
function remember<Entry extends Remembered>(map: Record<string, Entry>, login: string, same: (stored: Entry) => boolean, make: (changedAt: number) => Entry, now: number, rules: MinimeRules) {
  const stored = map[login] as Entry | undefined;
  if (stored && !same(stored) && now - stored.changedAt < rules.colorCooldownS * 1000) return map;
  const next = { ...map, [login]: make(stored && same(stored) ? stored.changedAt : now) };
  const logins = Object.keys(next);
  if (logins.length <= MAX_STORED_COLORS) return next;
  const oldest = logins.reduce((found, candidate) => (next[candidate].usedAt < next[found].usedAt ? candidate : found));
  delete next[oldest];
  return next;
}

const storeColor = (colors: MinimeState["colors"], login: string, color: string, now: number, rules: MinimeRules) =>
  remember(colors, login, stored => stored.color === color, changedAt => ({ color, usedAt: now, changedAt }), now, rules);
const storeVariant = (variants: MinimeState["variants"], login: string, variant: string, now: number, rules: MinimeRules) =>
  remember(variants, login, stored => stored.variant === variant, changedAt => ({ variant, usedAt: now, changedAt }), now, rules);

// Allowed variant ids; empty in color mode
const allowedVariants = (rules: MinimeRules) => rules.variants?.map(variant => variant.id) ?? [];

// Variant of a chatter: chosen and allowed, otherwise remembered and allowed, otherwise random allowed (switchable right away).
// Without allowed variants or in color mode null.
function resolveVariant(variants: MinimeState["variants"], login: string, chosen: string | null, now: number, rules: MinimeRules, random: () => number) {
  const allowed = allowedVariants(rules);
  if (!allowed.length) return { variants, variant: null };
  const picked = chosen && allowed.includes(chosen) ? storeVariant(variants, login, chosen, now, rules) : variants;
  const stored = picked[login] as StoredVariant | undefined;
  if (stored && allowed.includes(stored.variant)) return { variants: { ...picked, [login]: { ...stored, usedAt: now } }, variant: stored.variant };
  const variant = allowed[Math.min(allowed.length - 1, Math.floor(random() * allowed.length))];
  const free = now - rules.colorCooldownS * 1000;
  return { variants: { ...picked, [login]: { variant, usedAt: now, changedAt: free } }, variant };
}

// List without the longest inactive ones, until at most max are left (order stays)
function trim(roster: MinimeEntry[], max: number) {
  const kept = new Set([...roster].sort((first, second) => second.lastSeen - first.lastSeen).slice(0, Math.max(0, max)));
  return roster.filter(entry => kept.has(entry));
}

type LookEvent = Extract<MinimeEvent, { type: "join" | "color" | "variant" }>;

// Color of a chatter: chosen, otherwise remembered, otherwise Twitch color (if switched on); null in variant mode
function resolveColor(state: MinimeState, event: LookEvent, now: number, rules: MinimeRules) {
  if (rules.variants || event.type === "variant") return { colors: state.colors, color: null };
  const stored = event.color ? storeColor(state.colors, event.login, event.color, now, rules) : state.colors;
  const colors = stored[event.login] ? { ...stored, [event.login]: { ...stored[event.login], usedAt: now } } : stored;
  const twitchColor = rules.useTwitchColor && event.twitchColor ? parseColor(event.twitchColor, rules.minBrightness) : null;
  return { colors, color: colors[event.login]?.color ?? twitchColor };
}

// Join (or update color, variant and name of a joined chatter)
function join(state: MinimeState, event: LookEvent, now: number, rules: MinimeRules, random: () => number): MinimeResult {
  const { colors, color } = resolveColor(state, event, now, rules);
  const chosen = event.type === "color" ? null : event.variant;
  const { variants, variant } = resolveVariant(state.variants, event.login, chosen, now, rules, random);
  const minime: MinimeEntry = { login: event.login, user: event.user, color, variant, lastSeen: now };
  const present = state.roster.find(entry => entry.login === event.login);
  if (present) {
    const changed = present.user !== minime.user || present.color !== minime.color || present.variant !== minime.variant;
    return { state: { colors, variants, roster: state.roster.map(entry => (entry === present ? minime : entry)) }, changed, react: null };
  }
  if (state.roster.length >= rules.max && rules.whenFull === "reject") return { state: { ...state, colors, variants }, changed: false, react: null };
  return { state: { colors, variants, roster: [...trim(state.roster, rules.max - 1), minime] }, changed: true, react: null };
}

function remove(state: MinimeState, login: string): MinimeResult {
  const roster = state.roster.filter(entry => entry.login !== login);
  return { state: { ...state, roster }, changed: roster.length !== state.roster.length, react: null };
}

function chat(state: MinimeState, login: string, now: number, rules: MinimeRules): MinimeResult {
  if (!state.roster.some(entry => entry.login === login)) return { state, changed: false, react: null };
  const roster = rules.chatKeepsAlive ? state.roster.map(entry => (entry.login === login ? { ...entry, lastSeen: now } : entry)) : state.roster;
  return { state: { ...state, roster }, changed: false, react: rules.reactToChat ? login : null };
}

// Does the entry have a variant it may have according to the rules? (allowed, or null if none are allowed)
const variantFits = (entry: MinimeEntry, allowed: readonly string[]) => (entry.variant === null ? !allowed.length : allowed.includes(entry.variant));

// Remove inactive ones, shorten to max, and in variant mode give everyone an allowed variant (replace switched-off ones)
function prune(state: MinimeState, now: number, rules: MinimeRules, random: () => number): MinimeResult {
  const active = rules.idleMinutes > 0 ? state.roster.filter(entry => now - entry.lastSeen <= rules.idleMinutes * 60_000) : state.roster;
  const kept = trim(active, rules.max);
  const allowed = allowedVariants(rules);
  let variants = state.variants;
  const roster = kept.map(entry => {
    if (!rules.variants || variantFits(entry, allowed)) return entry;
    const resolved = resolveVariant(variants, entry.login, null, now, rules, random);
    variants = resolved.variants;
    return { ...entry, variant: resolved.variant };
  });
  const changed = roster.length !== state.roster.length || roster.some((entry, index) => entry !== kept[index]);
  return { state: { ...state, roster, variants }, changed, react: null };
}

// Applies an event to the list. prune removes inactive ones, shortens the list to max and replaces switched-off variants.
// random: randomness for assigning variants (0 to below 1)
export function applyMinime(state: MinimeState, event: MinimeEvent, now: number, rules: MinimeRules, random: () => number): MinimeResult {
  const present = "login" in event && state.roster.some(entry => entry.login === event.login);
  switch (event.type) {
    case "join": return join(state, event, now, rules, random);
    case "color":
      if (present || rules.colorJoins) return join(state, event, now, rules, random);
      return { state: { ...state, colors: storeColor(state.colors, event.login, event.color, now, rules) }, changed: false, react: null };
    case "variant":
      if (present || rules.colorJoins) return join(state, event, now, rules, random);
      return { state: { ...state, variants: storeVariant(state.variants, event.login, event.variant, now, rules) }, changed: false, react: null };
    case "leave":
    case "kick": return remove(state, event.login);
    case "ban": return rules.removeOnBan ? remove(state, event.login) : { state, changed: false, react: null };
    case "chat": return chat(state, event.login, now, rules);
    case "prune": return prune(state, now, rules, random);
    case "clear": return { state: { ...state, roster: [] }, changed: state.roster.length > 0, react: null };
  }
}
