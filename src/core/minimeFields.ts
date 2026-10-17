// Settings of the minimes that are the same for every theme with minimes: commands, rules of the list and movement.
// A theme has minimes exactly when its schema includes MINIME_BASE_FIELDS (hasMinimes). Color themes take
// MINIME_FIELDS (base fields and color fields), variant themes the base fields and minimeVariantFields of their variants.
// The theme creates the look and its own animations itself. readMinimeOptions reads the values for the server (rules)
// and the hook (movement).
// Check: minimeFields.check.ts.
import { choice, flag, number, text, type ValuesOf } from "./fields.ts";
import { normalizeName, type MinimeRules, type MinimeVariantRule } from "./minimes.ts";
import { resolveSettings } from "./settings.ts";
import type { MinimeVariantSet, SettingField, SettingValues, ThemeSchema } from "./theme.ts";

export const MINIME_COMMANDS = "Minimes: Befehle";
export const MINIME_RULES = "Minimes: Regeln";
export const MINIME_MOTION = "Minimes: Bewegung";
export const MINIME_VARIANTS = "Minimes: Typen";

// Minimum role: whoever has it or one above may (order = rank)
const ROLES = ["everyone", "subscriber", "vip", "moderator", "broadcaster"] as const;
const WHEN_FULL = ["replace", "reject"] as const;
const COMMAND = /^!\S{1,24}$/;

// For all themes with minimes: commands to join and leave, roles, rules of the list, movement
export const MINIME_BASE_FIELDS = [
  text("minimeJoinCommand", "Befehl: einklinken (optional mit Farbe oder Typ)", MINIME_COMMANDS, "!join", 25),
  text("minimeLeaveCommand", "Befehl: verlassen (Mods: mit @name rauswerfen)", MINIME_COMMANDS, "!leave", 25),
  choice("minimeJoinRole", "Einklinken ab Rolle", MINIME_COMMANDS, "everyone", ROLES),
  choice("minimeKickRole", "Fremde rauswerfen ab Rolle", MINIME_COMMANDS, "moderator", ROLES),
  flag("minimeColorJoins", "Befehl für Farbe oder Typ klinkt auch ein", MINIME_COMMANDS, true),
  number("minimeMax", "Höchstzahl gleichzeitig", MINIME_RULES, 30, 1, 100),
  choice("minimeWhenFull", "Wenn voll: Inaktivsten ersetzen (replace) oder Neue abweisen (reject)", MINIME_RULES, "replace", WHEN_FULL),
  number("minimeIdleMinutes", "Verschwindet nach Minuten ohne Nachricht (0 = nie)", MINIME_RULES, 20, 0, 240),
  number("minimeColorCooldown", "Abklingzeit Farb- oder Typwechsel", MINIME_RULES, 10, 0, 300, "s"),
  flag("minimeChatKeepsAlive", "Chatnachrichten halten das Minime im Bild", MINIME_RULES, true),
  flag("minimeReactToChat", "Minime reagiert auf Chatnachrichten", MINIME_RULES, true),
  flag("minimeClearOffline", "Alle entfernen, wenn der Stream endet", MINIME_RULES, true),
  flag("minimeRemoveOnBan", "Bei Ban oder Timeout entfernen", MINIME_RULES, true),
  number("minimeSpeed", "Laufgeschwindigkeit (px pro Sekunde)", MINIME_MOTION, 60, 5, 600),
  number("minimeMargin", "Abstand zum Rand", MINIME_MOTION, 60, 0, 600, "px"),
  number("minimeWalkMin", "Kürzeste Laufstrecke", MINIME_MOTION, 100, 10, 1920, "px"),
  number("minimeWalkMax", "Längste Laufstrecke", MINIME_MOTION, 600, 10, 1920, "px"),
  number("minimeWalkWeight", "Häufigkeit: wandern", MINIME_MOTION, 40, 0, 100),
  number("minimeIdleWeight", "Häufigkeit: auf der Stelle schweben", MINIME_MOTION, 40, 0, 100),
  number("minimeIdleMinMs", "Schweben mindestens", MINIME_MOTION, 2000, 200, 60_000, "ms"),
  number("minimeIdleMaxMs", "Schweben höchstens", MINIME_MOTION, 6000, 200, 60_000, "ms"),
  number("minimeEnterMs", "Dauer: erscheinen", MINIME_MOTION, 1200, 0, 10_000, "ms"),
  number("minimeExitMs", "Dauer: verschwinden", MINIME_MOTION, 900, 0, 10_000, "ms"),
] as const satisfies readonly SettingField[];

// Only for color themes: command to change color, minimum brightness, Twitch name color
const MINIME_COLOR_FIELDS = [
  text("minimeColorCommand", "Befehl: Farbe ändern", MINIME_COMMANDS, "!color", 25),
  number("minimeMinBrightness", "Mindesthelligkeit der Farbe (0 bis 255)", MINIME_RULES, 80, 0, 255),
  flag("minimeUseTwitchColor", "Ohne eigene Farbe die Twitch-Namensfarbe nehmen", MINIME_RULES, true),
] as const satisfies readonly SettingField[];

// All fields of a color theme
export const MINIME_FIELDS = [...MINIME_BASE_FIELDS, ...MINIME_COLOR_FIELDS] as const;

type MinimeValues = ValuesOf<typeof MINIME_FIELDS>;

// Key of the names of a variant in chat
export const minimeNamesKey = (id: string) => `minimeNames_${id}`;

// Fields of a variant theme: command to choose (the theme's default word) and per variant the names in chat, comma-separated;
// an empty list switches the variant off
export function minimeVariantFields(set: MinimeVariantSet): SettingField[] {
  return [
    text("minimeVariantCommand", `Befehl: ${set.label} wählen`, MINIME_VARIANTS, set.command, 25),
    ...set.variants.map(variant => text(minimeNamesKey(variant.id), `${variant.label}: Namen im Chat (leer = aus)`, MINIME_VARIANTS, variant.names.join(", "), 200)),
  ];
}

// Movement of all minimes; the theme's own animations come from the catalog of the scene
export type MinimeMotion = {
  speedPxPerS: number;
  marginPx: number;
  walkMinPx: number;
  walkMaxPx: number;
  walkWeight: number;
  idleWeight: number;
  idleMinMs: number;
  idleMaxMs: number;
  enterMs: number;
  exitMs: number;
};
type MinimeOptions = { rules: MinimeRules; motion: MinimeMotion };

const SCHEMA: ThemeSchema = { id: "minimes", name: "Minimes", fields: MINIME_FIELDS };

// Does this theme have minimes? (does it include the shared fields)
export const hasMinimes = (schema: ThemeSchema) => schema.fields.some(field => field.key === MINIME_BASE_FIELDS[0].key);

const rolesFrom = (role: string): string[] => (role === "everyone" ? ["everyone"] : ROLES.slice(Math.max(0, ROLES.indexOf(role as (typeof ROLES)[number]))));
const command = (value: string, fallback: string) => (COMMAND.test(value) ? value : fallback);
const ordered = (first: number, second: number) => [Math.min(first, second), Math.max(first, second)];

// Allowed variants with normalized names; a name belongs to the first variant that lists it, variants without names drop out
function variantRules(set: MinimeVariantSet, values: SettingValues): MinimeVariantRule[] {
  const taken = new Set<string>();
  return set.variants.flatMap(variant => {
    const names = (values[minimeNamesKey(variant.id)] as string).split(",").map(normalizeName).filter(name => name && !taken.has(name));
    names.forEach(name => taken.add(name));
    return names.length ? [{ id: variant.id, names: [...new Set(names)] }] : [];
  });
}

// Rules and movement from arbitrary settings values; missing and invalid ones become the default.
// set: variants of the theme (variant mode), without set chatters choose colors.
export function readMinimeOptions(stored: unknown, set?: MinimeVariantSet): MinimeOptions {
  const resolved = resolveSettings(set ? { ...SCHEMA, fields: [...MINIME_FIELDS, ...minimeVariantFields(set)] } : SCHEMA, stored);
  const values = resolved as MinimeValues;
  const [walkMinPx, walkMaxPx] = ordered(values.minimeWalkMin, values.minimeWalkMax);
  const [idleMinMs, idleMaxMs] = ordered(values.minimeIdleMinMs, values.minimeIdleMaxMs);
  return {
    rules: {
      commands: {
        join: command(values.minimeJoinCommand, MINIME_BASE_FIELDS[0].default),
        look: set ? command(resolved.minimeVariantCommand as string, set.command) : command(values.minimeColorCommand, MINIME_COLOR_FIELDS[0].default),
        leave: command(values.minimeLeaveCommand, MINIME_BASE_FIELDS[1].default),
      },
      joinRoles: rolesFrom(values.minimeJoinRole),
      kickRoles: rolesFrom(values.minimeKickRole),
      colorJoins: values.minimeColorJoins,
      max: values.minimeMax,
      whenFull: values.minimeWhenFull === "reject" ? "reject" : "replace",
      idleMinutes: values.minimeIdleMinutes,
      colorCooldownS: values.minimeColorCooldown,
      minBrightness: values.minimeMinBrightness,
      useTwitchColor: values.minimeUseTwitchColor,
      chatKeepsAlive: values.minimeChatKeepsAlive,
      reactToChat: values.minimeReactToChat,
      clearOffline: values.minimeClearOffline,
      removeOnBan: values.minimeRemoveOnBan,
      variants: set ? variantRules(set, resolved) : null,
    },
    motion: {
      speedPxPerS: values.minimeSpeed, marginPx: values.minimeMargin, walkMinPx, walkMaxPx,
      walkWeight: values.minimeWalkWeight, idleWeight: values.minimeIdleWeight, idleMinMs, idleMaxMs,
      enterMs: values.minimeEnterMs, exitMs: values.minimeExitMs,
    },
  };
}
