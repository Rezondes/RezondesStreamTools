// Einstellungs-Schema des Starter-Themes: klarer, moderner Look mit Verlauf, abgerundeten Karten und weichen
// Übergängen, unabhängig vom Matrix-Theme (eigene Szenen, Schriften, Stinger und Banner). Vorlage für eigene Themes
// (THEMES.md). Einzige Stelle des Themes mit festen Farben, Texten und Zahlen. StarterValues ist der Typ der
// aufgelösten Werte, den die Szenen über useStarter lesen.
import { choice, color, flag, font, inScene, number, sound, text, type ValuesOf } from "../../core/fields.ts";
import { INFO_FIELDS, INFO_GROUP } from "../../core/infoFields.ts";
import type { SettingField, ThemeSchema } from "../../core/theme.ts";

export const STARTER_FONTS = ["Inter", "Manrope", "DM Sans", "Space Grotesk"] as const;
const LOCALES = ["de-DE", "de-CH", "de-AT", "en-US", "en-GB", "fr-FR", "es-ES", "nl-NL"] as const;

const GENERAL = "Allgemein";
const SCREENS = "Starting, BRB, Ending";
const ALERTS = "Alerts";
const CHAT = "Chat";
const CAM = "Kamera-Rahmen";
const MUSIC = "Musik";
const FX = "Effekte";
const STINGER = "Stinger";
const BANNER = "Banner";

const FIELDS = [
  color("accent", "Akzentfarbe", GENERAL, "#7c5cff"),
  color("accent2", "Zweite Akzentfarbe (Verlauf)", GENERAL, "#22d3ee"),
  color("textColor", "Textfarbe", GENERAL, "#ffffff"),
  color("mutedColor", "Gedämpfte Textfarbe", GENERAL, "#a1a1b5"),
  color("card", "Kartenfarbe", GENERAL, "#14141c"),
  color("background", "Hintergrund (Vollbild-Szenen)", GENERAL, "#0b0b12"),
  number("cardOpacity", "Deckkraft der Karten", GENERAL, 0.88, 0, 1, undefined, 0.01),
  number("radius", "Eckenradius", GENERAL, 16, 0, 48, "px"),
  font("font", "Schrift", GENERAL, "Inter", STARTER_FONTS),
  number("fontSize", "Schriftgrösse", GENERAL, 22, 10, 60, "px"),
  number("fadeDuration", "Ein- und Ausblenden", GENERAL, 400, 0, 3000, "ms"),
  text("channelName", "Kanal-Name", GENERAL, "STREAM", 40),
  choice("locale", "Uhrzeit-Format", GENERAL, "de-DE", LOCALES),

  inScene("starting", text("startingEyebrow", "Starting: Überzeile", SCREENS, "Gleich geht's los")),
  inScene("starting", text("startingTitle", "Starting: Titel", SCREENS, "Stream startet gleich")),
  inScene("brb", text("brbEyebrow", "BRB: Überzeile", SCREENS, "Kurze Pause")),
  inScene("brb", text("brbTitle", "BRB: Titel", SCREENS, "Bin gleich zurück")),
  inScene("brb", text("brbNote", "BRB: Untertitel", SCREENS, "Der Chat bleibt offen.")),
  inScene("ending", text("endingEyebrow", "Ending: Überzeile", SCREENS, "Danke fürs Zuschauen")),
  inScene("ending", text("endingTitle", "Ending: Titel", SCREENS, "Stream beendet")),
  inScene("ending", text("endingNextLabel", "Ending: Nächster Stream (Beschriftung)", SCREENS, "Nächster Stream")),
  inScene("ending", text("endingNext", "Ending: Nächster Stream (leer = ausblenden)", SCREENS, "")),
  inScene("starting", number("countdown", "Countdown-Standard", SCREENS, 300, 0, 86400, "s")),
  inScene("starting", text("countdownDone", "Text nach dem Countdown", SCREENS, "Gleich live")),
  inScene("starting", flag("progressBar", "Fortschrittsbalken", SCREENS, true)),
  flag("showClock", "Uhrzeit oben rechts", SCREENS, true),
  text("ticker", "Hinweis unten (leer = aus)", SCREENS, "", 300),
  flag("blobs", "Bewegter Farbhintergrund", SCREENS, true),
  number("blobSpeed", "Tempo des Farbhintergrunds", SCREENS, 24, 4, 120, "s"),

  // Platzhalter: {user}, {amount}, {detail}, {text}
  text("followLabel", "Follow: Kopfzeile", ALERTS, "Neuer Follower"),
  text("followLine", "Follow: Zeile", ALERTS, "{user} folgt jetzt!"),
  text("subLabel", "Sub: Kopfzeile", ALERTS, "Neues Abo"),
  text("subLine", "Sub: Zeile", ALERTS, "{user} hat abonniert!"),
  text("resubLabel", "Resub: Kopfzeile", ALERTS, "Abo verlängert"),
  text("resubLine", "Resub: Zeile", ALERTS, "{user} ist seit {amount} Monaten dabei!"),
  text("giftLabel", "Gift: Kopfzeile", ALERTS, "Abos verschenkt"),
  text("giftLine", "Gift: Zeile", ALERTS, "{user} verschenkt {amount} Subs!"),
  text("raidLabel", "Raid: Kopfzeile", ALERTS, "Raid"),
  text("raidLine", "Raid: Zeile", ALERTS, "{user} raidet mit {amount} Leuten!"),
  text("cheerLabel", "Bits: Kopfzeile", ALERTS, "Bits"),
  text("cheerLine", "Bits: Zeile", ALERTS, "{user} cheert {amount} Bits!"),
  text("redeemLabel", "Kanalpunkte: Kopfzeile", ALERTS, "Kanalpunkte"),
  text("redeemLine", "Kanalpunkte: Zeile", ALERTS, "{user} löst {detail} ein."),
  text("hypeLabel", "Hype Train: Kopfzeile", ALERTS, "Hype Train"),
  text("hypeBeginLine", "Hype Train: Start", ALERTS, "Der Hype Train ist abgefahren!"),
  text("hypeEndLine", "Hype Train: Ende", ALERTS, "Hype Train Level {amount} geschafft!"),
  flag("alertMessage", "Nachricht zeigen", ALERTS, true),
  flag("alertProgress", "Restzeit-Balken", ALERTS, true),
  number("alertDuration", "Dauer", ALERTS, 6000, 2000, 60000, "ms"),
  number("alertTop", "Abstand oben", ALERTS, 48, 0, 1000, "px"),
  number("alertWidth", "Breite", ALERTS, 640, 200, 1900, "px"),
  sound("alertSound", "Ton (leer = kein Ton)", ALERTS),

  number("chatMax", "Max. Nachrichten", CHAT, 20, 1, 200),
  number("chatFade", "Ausblenden nach (0 = nie)", CHAT, 30, 0, 3600, "s"),
  number("chatGap", "Abstand zwischen Nachrichten", CHAT, 8, 0, 40, "px"),
  number("emoteSize", "Emote-Grösse", CHAT, 28, 8, 120, "px"),
  flag("chatBadges", "Badges zeigen", CHAT, true),

  text("camName", "Namensschild ({channel})", CAM, "{channel}"),
  flag("camLive", "Live-Anzeige", CAM, true),
  text("camLiveText", "Live-Text", CAM, "LIVE"),
  number("camBorder", "Rahmenstärke", CAM, 4, 0, 24, "px"),

  text("musicLabel", "Überzeile", MUSIC, "Läuft gerade"),
  text("musicIdle", "Text ohne Wiedergabe", MUSIC, "Keine Musik"),
  flag("musicHide", "Bei Pause ausblenden", MUSIC, true),
  flag("musicCover", "Cover zeigen", MUSIC, true),
  number("coverSize", "Cover-Grösse", MUSIC, 120, 40, 400, "px"),

  number("fxDuration", "Standarddauer", FX, 4, 0.5, 120, "s", 0.5),
  number("fxSize", "Standardgrösse", FX, 360, 20, 1920, "px"),
  number("fxTextSize", "Textgrösse", FX, 48, 8, 300, "px"),
  number("fxMargin", "Zufallsposition: Abstand zum Rand", FX, 20, 0, 50, "%"),
  number("fxMax", "Max. gleichzeitig", FX, 8, 1, 30),

  number("stingerDuration", "Länge", STINGER, 1.2, 0.5, 5, "s", 0.05),
  number("stingerCut", "Übergangspunkt", STINGER, 0.6, 0.1, 5, "s", 0.05),
  number("stingerPanels", "Anzahl Streifen", STINGER, 3, 1, 8),
  text("stingerText", "Text in der Mitte ({channel})", STINGER, "{channel}"),

  text("bannerTitle", "Titel ({channel})", BANNER, "{channel}"),
  text("bannerProfileText", "Profilbanner: Text", BANNER, "Games, Talk und gute Laune"),
  text("bannerOfflineTitle", "Offline-Banner: Titel", BANNER, "Gerade offline"),
  text("bannerOfflineText", "Offline-Banner: Text", BANNER, "Folge dem Kanal und verpasse keinen Stream."),
  number("bannerLoop", "Schleifenlänge", BANNER, 6, 1, 20, "s"),
  number("bannerProfileFps", "Profilbanner: Bildrate", BANNER, 12, 1, 30),
  number("bannerOfflineFps", "Offline-Banner: Bildrate", BANNER, 10, 1, 30),
  // Befehlsseite (öffentlich, /s/<login>/): gemeinsame Texte aus dem Kern, dazu das Aussehen
  ...INFO_FIELDS,
  number("infoWidth", "Befehlsseite: Breite der Spalte", INFO_GROUP, 860, 400, 1600, "px"),
] as const satisfies readonly SettingField[];

export type StarterValues = ValuesOf<typeof FIELDS>;

const GROUP_SCENES = {
  [SCREENS]: ["starting", "brb", "ending"],
  [ALERTS]: ["alerts"],
  [CHAT]: ["chat"],
  [CAM]: ["cam"],
  [MUSIC]: ["music"],
  [FX]: ["fx"],
  [STINGER]: [],
  [BANNER]: [],
  [INFO_GROUP]: ["info"],
} as const;

// Beim ersten Login: Kanal-Name aus dem Twitch-Login statt des Beispiels
const personalize = (login: string) => ({ channelName: login.toUpperCase() });

export const starterSettings: ThemeSchema = { id: "starter", name: "Starter", fields: FIELDS, groupScenes: GROUP_SCENES, personalize };
