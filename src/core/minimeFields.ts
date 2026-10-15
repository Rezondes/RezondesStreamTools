// Einstellungen der Minimes, die für jedes Theme mit Minimes gleich sind: Befehle, Regeln der Liste und Bewegung.
// Ein Theme hat Minimes genau dann, wenn sein Schema MINIME_FIELDS einbindet (hasMinimes); Aussehen und eigene
// Animationen legt das Theme selbst an. readMinimeOptions liest die Werte für Server (Regeln) und Hook (Bewegung).
// Check: minimeFields.check.ts.
import { choice, flag, number, text, type ValuesOf } from "./fields.ts";
import type { MinimeRules } from "./minimes.ts";
import { resolveSettings } from "./settings.ts";
import type { SettingField, ThemeSchema } from "./theme.ts";

export const MINIME_COMMANDS = "Minimes: Befehle";
export const MINIME_RULES = "Minimes: Regeln";
export const MINIME_MOTION = "Minimes: Bewegung";

// Mindestrolle: wer sie oder eine darüber hat, darf (Reihenfolge = Rang)
const ROLES = ["everyone", "subscriber", "vip", "moderator", "broadcaster"] as const;
const WHEN_FULL = ["replace", "reject"] as const;
const COMMAND = /^!\S{1,24}$/;

export const MINIME_FIELDS = [
  text("minimeJoinCommand", "Befehl: einklinken (optional mit Farbe)", MINIME_COMMANDS, "!join", 25),
  text("minimeColorCommand", "Befehl: Farbe ändern", MINIME_COMMANDS, "!color", 25),
  text("minimeLeaveCommand", "Befehl: verlassen (Mods: mit @name rauswerfen)", MINIME_COMMANDS, "!leave", 25),
  choice("minimeJoinRole", "Einklinken ab Rolle", MINIME_COMMANDS, "everyone", ROLES),
  choice("minimeKickRole", "Fremde rauswerfen ab Rolle", MINIME_COMMANDS, "moderator", ROLES),
  flag("minimeColorJoins", "Farbbefehl klinkt auch ein", MINIME_COMMANDS, true),
  number("minimeMax", "Höchstzahl gleichzeitig", MINIME_RULES, 30, 1, 100),
  choice("minimeWhenFull", "Wenn voll: Inaktivsten ersetzen (replace) oder Neue abweisen (reject)", MINIME_RULES, "replace", WHEN_FULL),
  number("minimeIdleMinutes", "Verschwindet nach Minuten ohne Nachricht (0 = nie)", MINIME_RULES, 20, 0, 240),
  number("minimeColorCooldown", "Abklingzeit Farbwechsel", MINIME_RULES, 10, 0, 300, "s"),
  number("minimeMinBrightness", "Mindesthelligkeit der Farbe (0 bis 255)", MINIME_RULES, 80, 0, 255),
  flag("minimeUseTwitchColor", "Ohne eigene Farbe die Twitch-Namensfarbe nehmen", MINIME_RULES, true),
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

type MinimeValues = ValuesOf<typeof MINIME_FIELDS>;

// Bewegung aller Minimes; die themeeigenen Animationen kommen aus dem Katalog der Szene
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
export type MinimeOptions = { rules: MinimeRules; motion: MinimeMotion };

const SCHEMA: ThemeSchema = { id: "minimes", name: "Minimes", fields: MINIME_FIELDS };

// Hat dieses Theme Minimes? (bindet es die gemeinsamen Felder ein)
export const hasMinimes = (schema: ThemeSchema) => schema.fields.some(field => field.key === MINIME_FIELDS[0].key);

const rolesFrom = (role: string): string[] => (role === "everyone" ? ["everyone"] : ROLES.slice(Math.max(0, ROLES.indexOf(role as (typeof ROLES)[number]))));
const command = (value: string, fallback: string) => (COMMAND.test(value) ? value : fallback);
const ordered = (first: number, second: number) => [Math.min(first, second), Math.max(first, second)];

// Regeln und Bewegung aus beliebigen Einstellungswerten; Fehlendes und Ungültiges wird zum Standardwert
export function readMinimeOptions(stored: unknown): MinimeOptions {
  const values = resolveSettings(SCHEMA, stored) as MinimeValues;
  const [walkMinPx, walkMaxPx] = ordered(values.minimeWalkMin, values.minimeWalkMax);
  const [idleMinMs, idleMaxMs] = ordered(values.minimeIdleMinMs, values.minimeIdleMaxMs);
  return {
    rules: {
      commands: {
        join: command(values.minimeJoinCommand, MINIME_FIELDS[0].default),
        color: command(values.minimeColorCommand, MINIME_FIELDS[1].default),
        leave: command(values.minimeLeaveCommand, MINIME_FIELDS[2].default),
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
    },
    motion: {
      speedPxPerS: values.minimeSpeed, marginPx: values.minimeMargin, walkMinPx, walkMaxPx,
      walkWeight: values.minimeWalkWeight, idleWeight: values.minimeIdleWeight, idleMinMs, idleMaxMs,
      enterMs: values.minimeEnterMs, exitMs: values.minimeExitMs,
    },
  };
}
