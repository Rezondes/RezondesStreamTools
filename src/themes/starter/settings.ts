// Einstellungs-Schema des Starter-Themes: schlichte Karten mit Akzentkante für Alerts und Chat. Vorlage für eigene
// Themes (THEMES.md); alle anderen Szenen erbt es vom Standard-Theme "matrix". Einzige Stelle des Themes mit festen
// Farben, Texten und Zahlen. StarterValues ist der Typ der aufgelösten Werte, den die Szenen über useStarter lesen.
import { color, flag, font, number, sound, text, type ValuesOf } from "../../core/fields.ts";
import type { SettingField, ThemeSchema } from "../../core/theme.ts";

const GENERAL = "Allgemein";
const ALERTS = "Alerts";
const CHAT = "Chat";

const FIELDS = [
  color("accent", "Akzentfarbe", GENERAL, "#7c5cff"),
  color("textColor", "Textfarbe", GENERAL, "#ffffff"),
  color("card", "Kartenfarbe", GENERAL, "#16161d"),
  number("cardOpacity", "Deckkraft der Karte", GENERAL, 0.9, 0, 1, undefined, 0.05),
  number("radius", "Eckenradius", GENERAL, 12, 0, 48, "px"),
  font("font", "Schrift", GENERAL, "IBM Plex Mono", ["IBM Plex Mono", "Fira Mono", "Share Tech Mono", "VT323", "Courier New"]),
  number("fontSize", "Schriftgrösse", GENERAL, 22, 10, 60, "px"),
  number("fadeDuration", "Ein- und Ausblenden", GENERAL, 300, 0, 3000, "ms"),

  // Platzhalter: {user}, {amount}, {detail}, {text}
  text("followLine", "Follow", ALERTS, "{user} folgt jetzt!"),
  text("subLine", "Sub", ALERTS, "{user} hat abonniert!"),
  text("resubLine", "Resub", ALERTS, "{user} ist seit {amount} Monaten dabei!"),
  text("giftLine", "Gift", ALERTS, "{user} verschenkt {amount} Subs!"),
  text("raidLine", "Raid", ALERTS, "{user} raidet mit {amount} Leuten!"),
  text("cheerLine", "Bits", ALERTS, "{user} cheert {amount} Bits!"),
  text("redeemLine", "Kanalpunkte", ALERTS, "{user} löst {detail} ein."),
  text("hypeBeginLine", "Hype Train Start", ALERTS, "Der Hype Train ist abgefahren!"),
  text("hypeEndLine", "Hype Train Ende", ALERTS, "Hype Train Level {amount} geschafft!"),
  flag("alertMessage", "Nachricht zeigen", ALERTS, true),
  number("alertDuration", "Dauer", ALERTS, 6000, 2000, 60000, "ms"),
  number("alertTop", "Abstand oben", ALERTS, 48, 0, 1000, "px"),
  number("alertWidth", "Breite", ALERTS, 640, 200, 1900, "px"),
  sound("alertSound", "Ton (leer = kein Ton)", ALERTS),

  number("chatMax", "Max. Nachrichten", CHAT, 20, 1, 200),
  number("chatFade", "Ausblenden nach (0 = nie)", CHAT, 30, 0, 3600, "s"),
  number("chatGap", "Abstand zwischen Nachrichten", CHAT, 6, 0, 40, "px"),
  number("emoteSize", "Emote-Grösse", CHAT, 28, 8, 120, "px"),
  flag("chatBadges", "Badges zeigen", CHAT, true),
] as const satisfies readonly SettingField[];

export type StarterValues = ValuesOf<typeof FIELDS>;

export const starterSettings: ThemeSchema = { id: "starter", name: "Starter", fields: FIELDS };
