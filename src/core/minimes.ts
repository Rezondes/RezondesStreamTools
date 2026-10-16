// Regeln der Minimes (Chatter als Figuren in der Szene minimes): Farben oder Typen (z.B. Früchte) aus dem Chat lesen,
// Chatbefehle erkennen und die Liste der eingeklinkten Chatter führen. Rein (Regel 12): Zeit kommt als now herein, alle Schwellen und Schalter
// als rules (Einstellungen des Streamers, siehe minimeFields.ts), Zufall als random. Genutzt vom Server (server/minimes.ts).
// Check: minimes.check.ts.
import type { Minime } from "./types.ts";

// Alle Einstellungen, die bestimmen, was die Liste tut. Rollen: Twitch-Badges (subscriber, vip, moderator,
// broadcaster) oder everyone; der Streamer (broadcaster) darf immer alles. look: Befehl für Farbe oder Typ.
// variants: erlaubte Typen mit ihren Namen im Chat (vereinheitlicht, siehe normalizeName); null = das Theme nutzt Farben.
export type MinimeRules = {
  commands: { join: string; look: string; leave: string };
  joinRoles: readonly string[];
  kickRoles: readonly string[];
  colorJoins: boolean; // !color klinkt Nicht-Eingeklinkte ein
  max: number;
  whenFull: "replace" | "reject"; // replace: der am längsten Inaktive fliegt raus
  idleMinutes: number; // 0 = nie
  colorCooldownS: number;
  minBrightness: number; // 0 bis 255, hellster Kanal einer Farbe
  useTwitchColor: boolean;
  chatKeepsAlive: boolean;
  reactToChat: boolean;
  clearOffline: boolean; // vom Server bei stream.offline ausgewertet
  removeOnBan: boolean;
  variants: readonly MinimeVariantRule[] | null;
};
export type MinimeVariantRule = { id: string; names: readonly string[] };

export type MinimeEntry = Minime & { lastSeen: number };
// Farben bleiben gemerkt, auch wenn das Minime verschwindet. usedAt: zuletzt benutzt (für die Obergrenze),
// changedAt: zuletzt geändert (für den Cooldown)
export type StoredColor = { color: string; usedAt: number; changedAt: number };
export type StoredVariant = { variant: string; usedAt: number; changedAt: number };
export type MinimeState = { roster: MinimeEntry[]; colors: Record<string, StoredColor>; variants: Record<string, StoredVariant> };

// Ereignisse aus dem Chat und vom Server. twitchColor: Namensfarbe aus dem Twitch-Tag color (oder null)
export type MinimeEvent =
  | { type: "join"; login: string; user: string; color: string | null; variant: string | null; twitchColor: string | null }
  | { type: "color"; login: string; user: string; color: string; twitchColor: string | null }
  | { type: "variant"; login: string; user: string; variant: string }
  | { type: "leave" | "kick" | "chat" | "ban"; login: string }
  | { type: "prune" | "clear" };

export type MinimeCommand =
  | { type: "join"; color: string | null; variant: string | null }
  | { type: "color"; color: string }
  | { type: "variant"; variant: string }
  | { type: "leave" }
  | { type: "kick"; login: string };

// changed: die sichtbare Liste hat sich geändert; react: Login, dessen Minime auf Chat reagieren soll
export type MinimeResult = { state: MinimeState; changed: boolean; react: string | null };

// fixed: Speicherschutz, damit minimes.json nicht unbegrenzt wächst
export const MAX_STORED_COLORS = 2000;

const LOGIN = /^[a-z0-9_]{1,25}$/;
const HEX = /^#?([0-9a-f]{3}|[0-9a-f]{6})$/i;
const RGB_CALL = /^rgb\s*\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})\s*\)$/i;
const RGB_LIST = /^(\d{1,3})(?:\s*,\s*|\s+)(\d{1,3})(?:\s*,\s*|\s+)(\d{1,3})$/;

// Leerer Zustand: niemand eingeklinkt, keine Farben und Typen gemerkt
export const emptyMinimeState = (): MinimeState => ({ roster: [], colors: {}, variants: {} });

const SPELLED: Record<string, string> = { "ä": "ae", "ö": "oe", "ü": "ue", "ß": "ss" };

// Name aus dem Chat oder den Einstellungen vergleichbar machen: klein, ä/ö/ü/ß ausgeschrieben, ohne Leerzeichen und Bindestriche
export function normalizeName(text: string): string {
  return text.toLowerCase().replace(/[äöüß]/g, letter => SPELLED[letter]).replace(/[\s-]+/g, "");
}

// Typ zu einem Namen aus dem Chat, null wenn kein erlaubter Typ so heisst
const findVariant = (text: string, variants: readonly MinimeVariantRule[]) =>
  variants.find(variant => variant.names.includes(normalizeName(text)))?.id ?? null;

// Kanäle 0 bis 255 aus einer Eingabe, null wenn kein unterstütztes Format
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

// Farbe aus dem Chat (#ff00aa, ff00aa, #f0a, "255 0 170", "255,0,170", "rgb(255, 0, 170)") als #rrggbb, sonst null.
// Liegt der hellste Kanal unter minBrightness, wird die Farbe proportional bis dahin aufgehellt.
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

// Befehl am Anfang einer Chatnachricht, null für alles andere oder ohne erlaubte Rolle.
// Leave mit Ziel (@name) wirft ein fremdes Minime raus, wenn die Rolle das darf, sonst ist es ein normales Leave.
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

// Neue Farbe oder neuen Typ merken, wenn der Cooldown um ist (same: gleicher Wert wie gemerkt, make: neuer Eintrag mit
// changedAt); der am längsten unbenutzte Eintrag fällt über der Obergrenze heraus
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

// Erlaubte Typ-ids; leer im Farb-Modus
const allowedVariants = (rules: MinimeRules) => rules.variants?.map(variant => variant.id) ?? [];

// Typ eines Chatters: gewählt und erlaubt, sonst gemerkt und erlaubt, sonst zufällig erlaubt (sofort wieder wechselbar).
// Ohne erlaubte Typen oder im Farb-Modus null.
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

// Liste ohne die am längsten Inaktiven, bis höchstens max übrig sind (Reihenfolge bleibt)
function trim(roster: MinimeEntry[], max: number) {
  const kept = new Set([...roster].sort((first, second) => second.lastSeen - first.lastSeen).slice(0, Math.max(0, max)));
  return roster.filter(entry => kept.has(entry));
}

type LookEvent = Extract<MinimeEvent, { type: "join" | "color" | "variant" }>;

// Farbe eines Chatters: gewählt, sonst gemerkt, sonst Twitch-Farbe (wenn eingeschaltet); im Typ-Modus null
function resolveColor(state: MinimeState, event: LookEvent, now: number, rules: MinimeRules) {
  if (rules.variants || event.type === "variant") return { colors: state.colors, color: null };
  const stored = event.color ? storeColor(state.colors, event.login, event.color, now, rules) : state.colors;
  const colors = stored[event.login] ? { ...stored, [event.login]: { ...stored[event.login], usedAt: now } } : stored;
  const twitchColor = rules.useTwitchColor && event.twitchColor ? parseColor(event.twitchColor, rules.minBrightness) : null;
  return { colors, color: colors[event.login]?.color ?? twitchColor };
}

// Einklinken (oder Farbe, Typ und Name eines Eingeklinkten aktualisieren)
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

// Hat der Eintrag einen Typ, den er laut Regeln haben darf? (erlaubt, oder null wenn keine erlaubt sind)
const variantFits = (entry: MinimeEntry, allowed: readonly string[]) => (entry.variant === null ? !allowed.length : allowed.includes(entry.variant));

// Inaktive entfernen, auf max kürzen, und im Typ-Modus jedem einen erlaubten Typ geben (ausgeschaltete ersetzen)
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

// Ein Ereignis auf die Liste anwenden. prune entfernt Inaktive, kürzt die Liste auf max und ersetzt ausgeschaltete Typen.
// random: Zufall für die Vergabe von Typen (0 bis unter 1)
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
