// Settings schema of the standard theme: clear, modern look with gradient, rounded cards and soft
// transitions, independent of the matrix theme (own scenes, fonts, stinger and banners). Template for own themes
// (THEMES.md). The only place of the theme with fixed colors, texts and numbers. StandardValues is the type of the
// resolved values that the scenes read via useStandard.
import { alertSoundFields } from "../../core/alerts/alerts.ts";
import { markBasic, choice, color, flag, font, inScene, lines, number, text } from "../../core/fields.ts";
import { qualityField } from "../../core/graphicsFields.ts";
import { INFO_FIELDS, INFO_GROUP } from "../../core/infoFields.ts";
import { withStingerFields } from "../../core/stingerOptions.ts";
import type { SettingField, ThemeSchema } from "../../core/theme.ts";

const STANDARD_FONTS = ["Inter", "Manrope", "DM Sans", "Space Grotesk"] as const;
const LOCALES = ["de-DE", "de-CH", "de-AT", "en-US", "en-GB", "fr-FR", "es-ES", "nl-NL"] as const;
const ALERT_EXITS = ["Unschärfe", "Gleiten", "Blenden"] as const;

const GENERAL = "Allgemein";
const SCREENS = "Starting, BRB, Ending";
const BACKGROUND = "Hintergrund";
const ALERTS = "Alerts";
const CHAT = "Chat";
const CAM = "Kamera-Rahmen";
const MUSIC = "Musik";
const FX = "Effekte";
const STINGER = "Stinger";
const PROFILE_BANNER = "Profilbanner";
const OFFLINE_BANNER = "Offline-Banner";

const FIELDS = [
  color("accent", "Akzentfarbe", GENERAL, "#7c5cff"),
  color("accent2", "Zweite Akzentfarbe (Verlauf)", GENERAL, "#22d3ee"),
  color("textColor", "Textfarbe", GENERAL, "#ffffff"),
  color("mutedColor", "Gedämpfte Textfarbe", GENERAL, "#a1a1b5"),
  color("card", "Kartenfarbe", GENERAL, "#14141c"),
  color("background", "Hintergrund (Vollbild-Szenen)", GENERAL, "#0b0b12"),
  number("cardOpacity", "Deckkraft der Karten", GENERAL, 0.88, 0, 1, undefined, 0.01),
  number("radius", "Eckenradius", GENERAL, 16, 0, 48, "px"),
  font("font", "Schrift", GENERAL, "Inter", STANDARD_FONTS),
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
  number("introMs", "Lichtfelder blenden auf", SCREENS, 1200, 0, 10000, "ms"),
  number("titleRiseMs", "Titel steigt auf (Dauer)", SCREENS, 900, 0, 5000, "ms"),
  // fixed: at most 900 ms, a digit has to settle before the next second
  number("digitRollMs", "Countdown und Pausenzeit: Ziffern rollen (Dauer)", SCREENS, 350, 0, 900, "ms"),
  inScene("starting", flag("progressShine", "Glanzlicht auf dem Fortschrittsbalken", SCREENS, true)),
  inScene("starting", number("shineEvery", "Glanzlicht: alle", SCREENS, 4, 2, 60, "s", 0.5)),
  inScene("brb", number("brbPace", "BRB: Tempo der Lichtfelder (Faktor)", SCREENS, 0.5, 0.1, 1, undefined, 0.05)),
  inScene("brb", number("brbDim", "BRB: Helligkeit beim Atmen", SCREENS, 0.6, 0, 1, undefined, 0.05)),
  inScene("brb", number("brbBreatheSeconds", "BRB: Dauer eines Atemzugs (0 = aus)", SCREENS, 6, 0, 60, "s", 0.5)),
  inScene("ending", lines("endingStats", "Ending: Zahlen (Schlüssel|Text)", SCREENS, ["follows|Follows", "subs|Abos", "raids|Raids", "bits|Bits", "chatMessages|Nachrichten"])),
  inScene("ending", number("countUpMs", "Ending: Hochzählen (Dauer)", SCREENS, 1200, 0, 10000, "ms")),
  inScene("ending", number("endingFadeAt", "Ending: Lichtfelder blenden aus nach", SCREENS, 10, 0, 600, "s")),
  inScene("ending", number("endingFadeMs", "Ending: Ausblenden (Dauer)", SCREENS, 4000, 0, 20000, "ms")),

  // Light fields, light dust and grain in a PixiJS stage (PLAN-STANDARD.md package 1)
  qualityField(BACKGROUND),
  flag("blobs", "Lichtfelder", BACKGROUND, true),
  number("blobSpeed", "Lichtfelder: Dauer einer Bahn", BACKGROUND, 24, 4, 120, "s"),
  number("worldSeed", "Startwert der Lichtfelder", BACKGROUND, 7, 1, 9999),
  // fixed: at most 8 fields, each one is a large blurred sprite
  number("auroraFields", "Anzahl Lichtfelder", BACKGROUND, 4, 1, 8),
  number("auroraBlur", "Lichtfelder: Unschärfe", BACKGROUND, 40, 0, 200, "px"),
  number("auroraStrength", "Lichtfelder: Helligkeit", BACKGROUND, 0.7, 0, 1, undefined, 0.01),
  flag("dustOn", "Lichtstaub", BACKGROUND, true),
  // fixed: at most 400 motes, more costs too much on weak PCs
  number("dustCount", "Anzahl Lichtstaub", BACKGROUND, 70, 0, 400),
  flag("grainOn", "Feines Korn gegen Farbstufen", BACKGROUND, true),
  number("grainStrength", "Korn: Stärke", BACKGROUND, 0.025, 0, 0.2, undefined, 0.005),

  // Placeholders: {user}, {amount}, {detail}, {text}
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
  flag("alertTraceOn", "Rand zeichnet sich ein", ALERTS, true),
  number("alertTraceMs", "Rand: Dauer", ALERTS, 700, 0, 3000, "ms"),
  number("alertGlow", "Schein um die Karte", ALERTS, 24, 0, 80, "px"),
  flag("alertSparksOn", "Funken", ALERTS, true),
  // fixed: at most 300 sparks, more costs too much in OBS
  number("alertSparks", "Anzahl Funken", ALERTS, 36, 0, 300),
  choice("alertExit", "Abgang", ALERTS, "Unschärfe", ALERT_EXITS),
  flag("alertSound", "Töne", ALERTS, true),
  ...alertSoundFields(ALERTS),

  number("chatMax", "Max. Nachrichten", CHAT, 20, 1, 200),
  number("chatFade", "Ausblenden nach (0 = nie)", CHAT, 30, 0, 3600, "s"),
  number("chatGap", "Abstand zwischen Nachrichten", CHAT, 8, 0, 40, "px"),
  number("emoteSize", "Emote-Grösse", CHAT, 28, 8, 120, "px"),
  flag("chatBadges", "Badges zeigen", CHAT, true),

  text("camName", "Namensschild ({channel})", CAM, "{channel}"),
  flag("camLive", "Live-Anzeige", CAM, true),
  text("camLiveText", "Live-Text", CAM, "LIVE"),
  number("camBorder", "Rahmenstärke", CAM, 4, 0, 24, "px"),
  flag("camSpinOn", "Verlauf wandert ringsum", CAM, true),
  number("camSpinSeconds", "Verlauf: Dauer einer Runde", CAM, 8, 2, 120, "s"),

  text("musicLabel", "Überzeile", MUSIC, "Läuft gerade"),
  text("musicIdle", "Text ohne Wiedergabe", MUSIC, "Keine Musik"),
  flag("musicHide", "Bei Pause ausblenden", MUSIC, true),
  flag("musicCover", "Cover zeigen", MUSIC, true),
  flag("musicMarquee", "Lange Zeilen laufen durch", MUSIC, true),
  number("musicMarqueeSpeed", "Lange Zeilen: Lauftempo (px pro Sekunde)", MUSIC, 40, 5, 400),
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

  text("bannerTitle", "Titel ({channel})", PROFILE_BANNER, "{channel}"),
  text("bannerOfflineName", "Kanalzeile ({channel})", OFFLINE_BANNER, "{channel}"),
  text("bannerProfileText", "Text", PROFILE_BANNER, "Games, Talk und gute Laune"),
  text("bannerOfflineTitle", "Titel", OFFLINE_BANNER, "Gerade offline"),
  text("bannerOfflineText", "Text", OFFLINE_BANNER, "Folge dem Kanal und verpasse keinen Stream."),
  // Commands page (public, /s/<login>/): shared texts from the core, plus the look
  ...INFO_FIELDS,
  number("infoWidth", "Befehlsseite: Breite der Spalte", INFO_GROUP, 860, 400, 1600, "px"),
] as const satisfies readonly SettingField[];

// The resolved values as the server generates them (src/generated/themes, npm run gen:types)
export type { StandardValues } from "../../generated/themes/standard.ts";

const GROUP_SCENES = {
  [SCREENS]: ["starting", "brb", "ending"],
  [BACKGROUND]: ["starting", "brb", "ending"],
  [ALERTS]: ["alerts"],
  [CHAT]: ["chat"],
  [CAM]: ["cam"],
  [MUSIC]: ["music"],
  [FX]: ["fx"],
  [STINGER]: [],
  [PROFILE_BANNER]: [],
  [OFFLINE_BANNER]: [],
  [INFO_GROUP]: ["info"],
} as const;

// On first login: channel name from the Twitch login instead of the sample
const personalize = (login: string) => ({ channelName: login.toUpperCase() });

// Simple view of the dashboard: per area the texts, main colors, figures and switches most streamers change
const BASIC = [
  "quality",
  "accent", "accent2", "textColor", "background", "font", "channelName", "startingEyebrow", "startingTitle", "countdownDone", "ticker",
  "brbEyebrow", "brbTitle", "brbNote", "endingEyebrow", "endingTitle", "endingNext", "followLine", "subLine", "resubLine", "giftLine",
  "raidLine", "cheerLine", "redeemLine", "hypeBeginLine", "chatBadges", "camName", "camLive", "musicLabel", "musicIdle", "musicHide",
];

export const standardSettings: ThemeSchema = { id: "standard", name: "Standard", fields: markBasic(withStingerFields([...FIELDS], STINGER), BASIC), groupScenes: GROUP_SCENES, personalize };
