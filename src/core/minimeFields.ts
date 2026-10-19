// Settings of the minimes that are the same for every theme with minimes: commands, rules of the list and movement.
// A theme has minimes exactly when its schema includes MINIME_BASE_FIELDS (hasMinimes). Color themes take
// MINIME_FIELDS (base fields and color fields), variant themes the base fields and minimeVariantFields of their variants,
// themes with factions additionally minimeTeamFields.
// The theme creates the look and its own animations itself. readMinimeOptions reads the values for the server (rules)
// and the hook (movement).
// Check: minimeFields.check.ts.
import { choice, color, flag, number, sound, text, withDefaults, type ValuesOf } from "./fields.ts";
import { INFO_GROUP } from "./infoFields.ts";
import { normalizeName, type MinimeRules, type MinimeVariantRule } from "./minimes.ts";
import { resolveSettings } from "./settings.ts";
import type { MinimeVariantSet, SettingField, SettingValues, ThemeSchema } from "./theme.ts";

export const MINIME_COMMANDS = "Minimes: Befehle";
export const MINIME_RULES = "Minimes: Regeln";
export const MINIME_MOTION = "Minimes: Bewegung";
export const MINIME_VARIANTS = "Minimes: Typen";
export const MINIME_TEAMS = "Minimes: Fraktionen";
export const MINIME_HOP = "Minimes: Hüpfen";
export const MINIME_COMBAT = "Minimes: Gefechte";

// Minimum role: whoever has it or one above may (order = rank)
const ROLES = ["everyone", "subscriber", "vip", "moderator", "broadcaster"] as const;
const WHEN_FULL = ["replace", "reject"] as const;
// Where new minimes appear: anywhere or on evenly spread places
const PLACEMENTS = ["random", "slots"] as const;
// The role that revives in fights; it never shoots, so it has no aim and fire durations
export const MEDIC = "medic";
// Sounds of a fight
export const COMBAT_SOUNDS = { shot: "minimeSoundShot", explosion: "minimeSoundExplosion", hit: "minimeSoundHit", revive: "minimeSoundRevive" } as const;
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
  choice("minimePlacement", "Plätze: frei verteilt (random) oder feste Plätze (slots)", MINIME_MOTION, "random", PLACEMENTS),
] as const satisfies readonly SettingField[];

// Hopping while moving (opt-in): height, duration of one hop, squash on landing
export const MINIME_HOP_FIELDS = [
  number("hopHeight", "Sprunghöhe", MINIME_HOP, 26, 0, 200, "px"),
  number("hopMs", "Dauer eines Sprungs", MINIME_HOP, 420, 150, 3000, "ms"),
  number("hopSquash", "Stauchen beim Aufkommen", MINIME_HOP, 0.2, 0, 0.6, undefined, 0.05),
] as const satisfies readonly SettingField[];

// Keys of the aim and fire durations of a role in fights
export const minimeAimKey = (id: string) => `minimeAimMs_${id}`;
export const minimeFireKey = (id: string) => `minimeFireMs_${id}`;

// Fights of the minimes (opt-in, the variants are the roles): switch, pace, hit chance, lying time, reviving, sounds and per
// role except the medic the durations of aiming and firing
export function minimeCombatFields(set: MinimeVariantSet): SettingField[] {
  return [
    flag("minimeCombat", "Gefechte an", MINIME_COMBAT, true),
    number("minimeCombatMinS", "Abstand zwischen Gefechten: mindestens", MINIME_COMBAT, 20, 5, 600, "s"),
    number("minimeCombatMaxS", "Abstand zwischen Gefechten: höchstens", MINIME_COMBAT, 60, 5, 600, "s"),
    number("minimeCombatMax", "Gleichzeitige Gefechte", MINIME_COMBAT, 2, 1, 10),
    number("minimeHitChance", "Trefferchance", MINIME_COMBAT, 70, 0, 100, "%"),
    number("minimeDownMs", "Liegezeit bis zum Selbst-Aufstehen", MINIME_COMBAT, 12_000, 1000, 120_000, "ms"),
    number("minimeReviveMs", "Wiederbeleben: Dauer", MINIME_COMBAT, 2500, 200, 20_000, "ms"),
    number("minimeMedicSpeed", "Medic: Tempo (px pro Sekunde)", MINIME_COMBAT, 140, 5, 600),
    number("minimeMedicGap", "Medic: Abstand zum Getroffenen", MINIME_COMBAT, 40, 0, 300, "px"),
    number("minimeUpMs", "Aufstehen: Dauer", MINIME_COMBAT, 600, 50, 10_000, "ms"),
    flag("minimeCombatSounds", "Gefechtstöne", MINIME_COMBAT, false),
    sound(COMBAT_SOUNDS.shot, "Ton: Schuss", MINIME_COMBAT),
    sound(COMBAT_SOUNDS.explosion, "Ton: Explosion", MINIME_COMBAT),
    sound(COMBAT_SOUNDS.hit, "Ton: Treffer", MINIME_COMBAT),
    sound(COMBAT_SOUNDS.revive, "Ton: Wiederbeleben", MINIME_COMBAT),
    ...set.variants.filter(role => role.id !== MEDIC).flatMap(role => [
      number(minimeAimKey(role.id), `${role.label}: Zielen`, MINIME_COMBAT, 800, 100, 10_000, "ms"),
      number(minimeFireKey(role.id), `${role.label}: Schuss`, MINIME_COMBAT, 600, 100, 10_000, "ms"),
    ]),
  ];
}

// Towers of the minimes (opt-in, only with variants): the type per level from the bottom, "keiner" ends the tower below
// level 3. Read by minimeStack.ts.
export const MINIME_STACK = "Minimes: Türme";
export const STACK_NONE = "keiner";
export const STACK_LEVEL_KEYS = ["minimeStackLevel1", "minimeStackLevel2", "minimeStackLevel3"] as const;
export const STACK_SOUND = "minimeSoundClimb";

// Switch, pace, levels, speed and durations of the steps, walking as a tower and the climb sound; a theme sets its own
// defaults (e.g. its types per level), without them towers are off
export function minimeStackFields(set: MinimeVariantSet, defaults: Readonly<Record<string, string | number | boolean>> = {}): SettingField[] {
  const ids = set.variants.map(variant => variant.id);
  const [level1, level2, level3] = STACK_LEVEL_KEYS;
  return withDefaults([
    flag("minimeStack", "Türme an", MINIME_STACK, false),
    number("minimeStackMinS", "Abstand zwischen Türmen: mindestens", MINIME_STACK, 30, 5, 600, "s"),
    number("minimeStackMaxS", "Abstand zwischen Türmen: höchstens", MINIME_STACK, 90, 5, 600, "s"),
    number("minimeStackMax", "Gleichzeitige Türme", MINIME_STACK, 1, 1, 5),
    choice(level1, "Stufe 1 (unten)", MINIME_STACK, ids[0] ?? STACK_NONE, ids),
    choice(level2, "Stufe 2", MINIME_STACK, ids[1] ?? ids[0] ?? STACK_NONE, ids),
    choice(level3, "Stufe 3 (oben)", MINIME_STACK, STACK_NONE, [...ids, STACK_NONE]),
    number("minimeStackSpeed", "Zusammenlaufen: Tempo (px pro Sekunde)", MINIME_STACK, 90, 5, 600),
    number("minimeClimbMs", "Klettern: Dauer je Stufe", MINIME_STACK, 900, 100, 10_000, "ms"),
    number("minimeStackedMs", "Stehen als Turm: Dauer", MINIME_STACK, 4000, 500, 60_000, "ms"),
    flag("minimeStackWalk", "Turm läuft", MINIME_STACK, true),
    number("minimeStackWalkMs", "Laufen als Turm: Dauer", MINIME_STACK, 5000, 500, 60_000, "ms"),
    number("minimeStackWalkPx", "Laufen als Turm: Strecke", MINIME_STACK, 300, 0, 1920, "px"),
    number("minimeDismountMs", "Absteigen: Dauer je Stufe", MINIME_STACK, 700, 100, 10_000, "ms"),
    flag("minimeStackSound", "Ton beim Aufsteigen", MINIME_STACK, false),
    sound(STACK_SOUND, "Ton: Aufsteigen", MINIME_STACK),
  ], defaults);
}

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

// Keys of a faction: names in chat, shown name, color
export const minimeTeamNamesKey = (id: string) => `minimeTeamNames_${id}`;
export const minimeTeamLabelKey = (id: string) => `minimeTeamLabel_${id}`;
export const minimeTeamColorKey = (id: string) => `minimeTeamColor_${id}`;

// Fields of a theme with factions: command to choose, its texts on the commands page and per faction the names in chat
// (empty = off), the shown name and the color
export function minimeTeamFields(set: MinimeVariantSet): SettingField[] {
  return [
    text("minimeTeamCommand", `Befehl: ${set.label} wählen`, MINIME_TEAMS, set.command, 25),
    text("infoTeamText", `${set.label} wählen: Erklärung ({command})`, INFO_GROUP, `${set.label} wählen: {command} <Name>`),
    text("infoTeams", "Liste der Fraktionen ({names})", INFO_GROUP, "Zur Wahl: {names}"),
    ...set.variants.flatMap(team => [
      text(minimeTeamNamesKey(team.id), `${team.label}: Namen im Chat (leer = aus)`, MINIME_TEAMS, team.names.join(", "), 200),
      text(minimeTeamLabelKey(team.id), `${team.label}: Anzeigename`, MINIME_TEAMS, team.label, 40),
      color(minimeTeamColorKey(team.id), `${team.label}: Farbe`, MINIME_TEAMS, team.color ?? "#ffffff"),
    ]),
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
  placement: "random" | "slots";
};
type MinimeOptions = { rules: MinimeRules; motion: MinimeMotion };

const SCHEMA: ThemeSchema = { id: "minimes", name: "Minimes", fields: MINIME_FIELDS };

// Does this theme have minimes? (does it include the shared fields)
export const hasMinimes = (schema: ThemeSchema) => schema.fields.some(field => field.key === MINIME_BASE_FIELDS[0].key);

const rolesFrom = (role: string): string[] => (role === "everyone" ? ["everyone"] : ROLES.slice(Math.max(0, ROLES.indexOf(role as (typeof ROLES)[number]))));
const command = (value: string, fallback: string) => (COMMAND.test(value) ? value : fallback);
const ordered = (first: number, second: number) => [Math.min(first, second), Math.max(first, second)];

// Allowed entries of a set with normalized names; a name belongs to the first entry that lists it (taken carries names over
// from an earlier set), entries without names drop out
function variantRules(set: MinimeVariantSet, values: SettingValues, namesKey: (id: string) => string, taken: Set<string>): MinimeVariantRule[] {
  return set.variants.flatMap(variant => {
    const names = (values[namesKey(variant.id)] as string).split(",").map(normalizeName).filter(name => name && !taken.has(name));
    names.forEach(name => taken.add(name));
    return names.length ? [{ id: variant.id, names: [...new Set(names)] }] : [];
  });
}

// Rules and movement from arbitrary settings values; missing and invalid ones become the default.
// set: variants of the theme (variant mode), without set chatters choose colors. teams: factions, only with set; a name of a
// variant wins over the same name of a faction.
export function readMinimeOptions(stored: unknown, set?: MinimeVariantSet, teams?: MinimeVariantSet): MinimeOptions {
  const factions = set ? teams : undefined;
  const fields = [...MINIME_FIELDS, ...(set ? minimeVariantFields(set) : []), ...(factions ? minimeTeamFields(factions) : [])];
  const resolved = resolveSettings({ ...SCHEMA, fields }, stored);
  const taken = new Set<string>();
  const variants = set ? variantRules(set, resolved, minimeNamesKey, taken) : null;
  const values = resolved as MinimeValues;
  const [walkMinPx, walkMaxPx] = ordered(values.minimeWalkMin, values.minimeWalkMax);
  const [idleMinMs, idleMaxMs] = ordered(values.minimeIdleMinMs, values.minimeIdleMaxMs);
  return {
    rules: {
      commands: {
        join: command(values.minimeJoinCommand, MINIME_BASE_FIELDS[0].default),
        look: set ? command(resolved.minimeVariantCommand as string, set.command) : command(values.minimeColorCommand, MINIME_COLOR_FIELDS[0].default),
        leave: command(values.minimeLeaveCommand, MINIME_BASE_FIELDS[1].default),
        ...(factions ? { team: command(resolved.minimeTeamCommand as string, factions.command) } : {}),
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
      variants,
      ...(factions ? { teams: variantRules(factions, resolved, minimeTeamNamesKey, taken) } : {}),
    },
    motion: {
      speedPxPerS: values.minimeSpeed, marginPx: values.minimeMargin, walkMinPx, walkMaxPx,
      walkWeight: values.minimeWalkWeight, idleWeight: values.minimeIdleWeight, idleMinMs, idleMaxMs,
      enterMs: values.minimeEnterMs, exitMs: values.minimeExitMs, placement: values.minimePlacement === "slots" ? "slots" : "random",
    },
  };
}
