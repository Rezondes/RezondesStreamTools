// Settings schema of the Chaos theme: neon graffiti at night, magenta and cyan scribble, spray and glow on almost black
// (src/themes/chaos/docs/DESIGN-CHAOS.md). The only place of the theme with fixed colors, texts and numbers; the Rust
// schema (server-rs/crates/rst-domain/src/themes/chaos.rs) stays equal to it. ChaosValues is the type of the resolved
// values that the scenes read via useChaos.
import { alertSoundFields } from "../../core/alerts/alerts.ts";
import { badgeFields } from "../../core/chat/chat.ts";
import { choice, color, flag, font, inScene, lines, markBasic, number, text } from "../../core/fields.ts";
import { qualityField } from "../../core/graphicsFields.ts";
import { INFO_FIELDS, INFO_GROUP } from "../../core/infoFields.ts";
import { MINIME_COMMANDS, MINIME_FIELDS, MINIME_HOP, MINIME_HOP_FIELDS, MINIME_MOTION, MINIME_RULES } from "../../core/minimeFields.ts";
import { stingerFields } from "../../core/stingerOptions.ts";
import type { SettingField, ThemeSchema } from "../../core/theme.ts";

const FONTS = ["Space Grotesk", "Inter", "Manrope", "DM Sans"] as const;
const TITLE_FONTS = ["Permanent Marker", "Black Ops One", "Sniglet", "Pacifico"] as const;
const GESTURES = ["zweix", "x", "strich", "keine"] as const;
const GESTURE_COLORS = ["cyan", "magenta"] as const;

const GENERAL = "Allgemein";
const SCRIBBLES = "Kritzeleien";
const SCREENS = "Starting, BRB, Ending";
const MOTION = "Bewegung";
const ALERTS = "Alerts";
const CHAT = "Chat";
const CAM = "Kamera-Rahmen";
const MUSIC = "Musik";
const FX = "Effekte";
const STINGER = "Stinger";
const BANNER = "Banner";
const MINIME_LOOK = "Minimes: Aussehen";
const MINIME_MOVES = "Minimes: Animationen";

const FIELDS = [
  text("channelName", "Kanal-Name", GENERAL, "CHAOS", 40),
  font("font", "Schrift", GENERAL, "Space Grotesk", FONTS),
  font("titleFont", "Titelschrift", GENERAL, "Permanent Marker", TITLE_FONTS),
  number("fontSize", "Schriftgrösse", GENERAL, 30, 12, 60, "px"),
  number("titleSize", "Titelgrösse", GENERAL, 150, 40, 260, "px"),
  color("ground", "Grund (Wand aussen)", GENERAL, "#120910"),
  color("wall", "Wand (Mitte)", GENERAL, "#22182f"),
  color("accent", "Signatur Magenta", GENERAL, "#d123a0"),
  color("accentText", "Magenta für Text", GENERAL, "#ff5ccb"),
  color("accent2", "Zweiter Akzent Cyan", GENERAL, "#09d0fe"),
  color("onAccent2", "Schrift auf Cyan und Klebeband", GENERAL, "#120910"),
  color("violet", "Violett (Flecken, Schatten)", GENERAL, "#502a5f"),
  color("violetLight", "Violett hell", GENERAL, "#986ea9"),
  color("lilac", "Flieder (Klebeband)", GENERAL, "#d39dd4"),
  color("surface", "Fläche (Zettel)", GENERAL, "#2b2041"),
  color("surfaceLight", "Fläche hell", GENERAL, "#3a2c55"),
  color("textColor", "Textfarbe", GENERAL, "#ffffff"),
  color("mutedColor", "Gedämpfte Textfarbe", GENERAL, "#b8a6c4"),
  number("grain", "Körnung (0 = aus)", GENERAL, 0.55, 0, 1, undefined, 0.05),
  number("jitter", "Zittern der Linien (0 = glatt)", GENERAL, 0.5, 0, 1, undefined, 0.05),
  number("glow", "Leuchten (0 = aus)", GENERAL, 0.6, 0, 1, undefined, 0.05),
  number("flicker", "Neon-Flackern (0 = aus)", GENERAL, 0.2, 0, 1, undefined, 0.05),
  number("glitch", "Glitch-Stärke (0 = aus)", GENERAL, 0.3, 0, 1, undefined, 0.05),
  number("glitchEvery", "Glitch alle", GENERAL, 9, 2, 120, "s"),
  number("fadeDuration", "Ein- und Ausblenden", GENERAL, 450, 0, 3000, "ms"),
  // The PixiJS wall of the screens (PLAN-CHAOS.md package 6)
  qualityField(GENERAL),
  number("glowStrength", "Leuchten der Striche (Unschärfe)", GENERAL, 22, 0, 60, "px"),
  number("glowAlpha", "Leuchten der Striche (Stärke)", GENERAL, 0.75, 0, 1, undefined, 0.05),
  number("roughShare", "Kritzeleien mit Füllung (Anteil)", GENERAL, 35, 0, 100, "%"),
  flag("roughFill", "Kritzeleien gefüllt", GENERAL, true),

  flag("idleOn", "Bewegung nach dem Aufbau", MOTION, true),
  flag("boilOn", "Kritzeleien kochen", MOTION, true),
  number("boilFps", "Kochen: Bilder pro Sekunde", MOTION, 8, 1, 24),
  inScene("brb", number("brbBoilFps", "BRB: Kochen (Bilder pro Sekunde)", MOTION, 5, 1, 24)),
  number("driftAmount", "Treiben der Kritzeleien", MOTION, 2.5, 0, 20, "px", 0.5),
  number("bristleShimmer", "Schimmern der Borsten (Faktor)", MOTION, 1, 0, 4, undefined, 0.1),
  flag("dripLoop", "Laufnasen tropfen ab", MOTION, true),
  flag("dustOn", "Sprühstaub schwebt", MOTION, true),
  // fixed: at most 600 grains of dust
  number("dustCount", "Sprühstaub (Anzahl)", MOTION, 90, 0, 600),

  number("scribbleCount", "Anzahl", SCRIBBLES, 340, 0, 600),
  number("scribbleWidth", "Strichstärke (Faktor)", SCRIBBLES, 1, 0.3, 3, undefined, 0.1),
  color("scribbleColor1", "Farbe 1", SCRIBBLES, "#d123a0"),
  color("scribbleColor2", "Farbe 2", SCRIBBLES, "#09d0fe"),
  color("scribbleColor3", "Farbe 3", SCRIBBLES, "#986ea9"),
  color("scribbleColor4", "Farbe 4", SCRIBBLES, "#d39dd4"),
  flag("scribbleWhite", "Ab und zu weiss", SCRIBBLES, true),
  number("drawMs", "Zeichnen: Dauer je Zeichen", SCRIBBLES, 700, 0, 5000, "ms"),
  number("drawGapMs", "Zeichnen: Abstand zwischen Zeichen", SCRIBBLES, 8, 0, 200, "ms"),
  flag("drips", "Laufnasen", SCRIBBLES, true),

  inScene("starting", choice("gestureStarting", "Starting: Pinselstriche", SCREENS, "zweix", GESTURES)),
  inScene("starting", choice("gestureColorStarting", "Starting: Farbe bei einem X oder Strich", SCREENS, "cyan", GESTURE_COLORS)),
  number("haze", "Dunkler Dunst hinter dem Text", SCREENS, 0.78, 0, 1, undefined, 0.05),
  inScene("brb", choice("gestureBrb", "BRB: Pinselstriche", SCREENS, "zweix", GESTURES)),
  inScene("brb", choice("gestureColorBrb", "BRB: Farbe bei einem X oder Strich", SCREENS, "magenta", GESTURE_COLORS)),
  inScene("ending", choice("gestureEnding", "Ending: Pinselstriche", SCREENS, "zweix", GESTURES)),
  inScene("ending", choice("gestureColorEnding", "Ending: Farbe bei einem X oder Strich", SCREENS, "cyan", GESTURE_COLORS)),
  inScene("starting", text("startingEyebrow", "Starting: Überzeile", SCREENS, "Stream startet")),
  inScene("starting", text("startingTitle", "Starting: Titel", SCREENS, "Gleich geht's los")),
  inScene("starting", lines("startingLines", "Starting: Sprüche", SCREENS, ["... vielleicht.", "Snacks holen, Chaos vorbereiten.", "Kabel sortieren? Niemals.", "Ordnung ist was für Anfänger."])),
  inScene("brb", text("brbEyebrow", "BRB: Überzeile", SCREENS, "Kurze Pause")),
  inScene("brb", text("brbTitle", "BRB: Titel", SCREENS, "Bin gleich zurück")),
  inScene("brb", lines("brbLines", "BRB: Sprüche", SCREENS, ["Nicht weggehen.", "Das Chaos bleibt, wo es ist.", "Chat, pass auf die Kritzeleien auf."])),
  inScene("brb", text("afkPrefix", "BRB: Text vor der Pausenzeit", SCREENS, "")),
  inScene("ending", text("endingEyebrow", "Ending: Überzeile", SCREENS, "Danke fürs Zuschauen")),
  inScene("ending", text("endingTitle", "Ending: Titel", SCREENS, "Chaos beendet")),
  inScene("ending", lines("endingLines", "Ending: Sprüche", SCREENS, ["Aufräumen? Morgen vielleicht.", "Bis zum nächsten Chaos!", "Danke, dass ihr da wart."])),
  inScene("ending", text("endingNextLabel", "Ending: Nächster Stream (Beschriftung)", SCREENS, "Nächster Stream")),
  inScene("ending", text("endingNext", "Ending: Nächster Stream (leer = ausblenden)", SCREENS, "")),
  number("linesEvery", "Sprüche wechseln alle", SCREENS, 8, 0, 600, "s"),
  inScene("starting", number("countdown", "Countdown-Standard", SCREENS, 300, 0, 86400, "s")),
  inScene("starting", text("countdownPrefix", "Text vor dem Countdown", SCREENS, "")),
  inScene("starting", text("countdownDone", "Text nach dem Countdown", SCREENS, "Gleich live")),
  inScene("starting", choice("progressStyle", "Fortschritt", SCREENS, "zickzack", ["zickzack", "balken", "aus"])),
  inScene("starting", number("strokeMs", "Starting: Pinselstrich (Dauer)", SCREENS, 550, 100, 3000, "ms")),
  inScene("starting", number("scribbleStagger", "Starting: Kritzeleien nacheinander (Abstand)", SCREENS, 45, 0, 500, "ms")),
  inScene("starting", number("sprayTitleMs", "Starting: Titel aufsprühen (Dauer)", SCREENS, 1200, 0, 5000, "ms")),
  inScene("ending", number("endingDrips", "Ending: zusätzliche Laufnasen am Titel", SCREENS, 6, 0, 30)),
  text("ticker", "Klebeband unten (leer = aus)", SCREENS, "", 300),
  number("tickerSpeed", "Klebeband: Dauer eines Durchlaufs", SCREENS, 25, 5, 200, "s"),
  choice("powerOn", "Einschalten", SCREENS, "spray", ["spray", "blende", "keins"]),
  number("powerOnDuration", "Einschalten: Dauer", SCREENS, 2500, 0, 10000, "ms"),

  // Placeholders: {user}, {amount}, {detail}, {text}
  text("followTag", "Follow: Kopfzeile", ALERTS, "Neuer Follower"),
  text("followLine", "Follow: Zeile", ALERTS, "{user} stiftet jetzt mit Chaos!"),
  text("subTag", "Sub: Kopfzeile", ALERTS, "Neues Abo"),
  text("subLine", "Sub: Zeile", ALERTS, "{user} sprüht ab jetzt mit!"),
  text("resubTag", "Resub: Kopfzeile", ALERTS, "Abo x{amount}"),
  text("resubLine", "Resub: Zeile", ALERTS, "{user} ist seit {amount} Monaten im Chaos!"),
  text("giftTag", "Gift: Kopfzeile", ALERTS, "Abos verschenkt"),
  text("giftLine", "Gift: Zeile", ALERTS, "{user} verschenkt {amount} Abos!"),
  text("raidTag", "Raid: Kopfzeile", ALERTS, "Raid"),
  text("raidLine", "Raid: Zeile", ALERTS, "{user} bringt {amount} Leute ins Chaos!"),
  text("cheerTag", "Bits: Kopfzeile", ALERTS, "{amount} Bits"),
  text("cheerLine", "Bits: Zeile", ALERTS, "{user} wirft {amount} Bits an die Wand!"),
  text("redeemTag", "Kanalpunkte: Kopfzeile", ALERTS, "Kanalpunkte"),
  text("redeemLine", "Kanalpunkte: Zeile", ALERTS, "{user} löst {detail} ein."),
  text("hypeTag", "Hype Train: Kopfzeile", ALERTS, "Hype Train"),
  text("hypeBeginLine", "Hype Train: Start", ALERTS, "Der Hype Train rast los!"),
  text("hypeEndLine", "Hype Train: Ende", ALERTS, "Hype Train Level {amount} geschafft!"),
  flag("alertQuote", "Nachricht zeigen", ALERTS, true),
  text("quoteFormat", "Nachricht ({text})", ALERTS, "\"{text}\""),
  number("alertDuration", "Dauer", ALERTS, 7000, 2000, 60000, "ms"),
  number("alertTop", "Abstand oben", ALERTS, 120, 0, 1000, "px"),
  number("alertWidth", "Breite", ALERTS, 820, 300, 1800, "px"),
  choice("alertSide", "Schwaden von", ALERTS, "wechselnd", ["links", "rechts", "wechselnd"]),
  number("swathDensity", "Schwaden: Striche", ALERTS, 90, 0, 300),
  flag("alertTimer", "Restzeit als Markerstrich", ALERTS, true),
  flag("confetti", "Konfetti aus Kritzeleien", ALERTS, true),
  number("confettiCount", "Anzahl Konfetti", ALERTS, 18, 0, 60),
  flag("alertSound", "Töne", ALERTS, true),
  ...alertSoundFields(ALERTS),

  choice("chatStyle", "Stil", CHAT, "zettel", ["zettel", "blasen", "schlicht"]),
  ...badgeFields(CHAT),
  flag("chatBadges", "Badges zeigen", CHAT, true),
  number("chatFontSize", "Schriftgrösse", CHAT, 22, 8, 60, "px"),
  number("emoteSize", "Emote-Grösse", CHAT, 28, 8, 120, "px"),
  number("chatFade", "Ausblenden nach (0 = nie)", CHAT, 30, 0, 3600, "s"),
  number("chatMax", "Max. Nachrichten", CHAT, 8, 1, 100),
  choice("chatAlign", "Neue Nachrichten", CHAT, "bottom", ["bottom", "top"]),
  number("chatGap", "Abstand", CHAT, 12, 0, 40, "px"),

  choice("camStyle", "Rahmen", CAM, "marker", ["marker", "neon", "schlicht"]),
  number("camFrameWidth", "Rahmenbreite", CAM, 12, 2, 60, "px"),
  flag("camScribbles", "Kritzeleien an den Ecken", CAM, true),
  text("camLabel", "Namensschild ({channel})", CAM, "{channel}"),
  flag("camLive", "Live-Anzeige", CAM, true),
  text("camLiveText", "Live-Text", CAM, "LIVE"),

  choice("musicStyle", "Stil", MUSIC, "zettel", ["zettel", "kassette", "schlicht"]),
  text("musicLabel", "Überzeile", MUSIC, "Läuft gerade"),
  text("musicIdle", "Text ohne Wiedergabe", MUSIC, "Stille im Chaos"),
  flag("musicHide", "Bei Pause ausblenden", MUSIC, true),
  flag("musicCover", "Cover zeigen", MUSIC, true),
  flag("musicProgress", "Fortschritt zeigen", MUSIC, true),
  flag("equalizer", "Equalizer", MUSIC, true),
  number("equalizerBars", "Equalizer: Striche", MUSIC, 9, 1, 24),
  flag("musicMarquee", "Lange Titel laufen durch", MUSIC, true),
  number("musicMarqueeSpeed", "Lange Titel: Lauftempo (px pro Sekunde)", MUSIC, 40, 5, 400),
  number("coverSize", "Cover-Grösse", MUSIC, 130, 40, 400, "px"),

  number("fxDuration", "Standarddauer", FX, 4, 0.5, 120, "s", 0.5),
  number("fxSize", "Standardgrösse", FX, 360, 20, 1920, "px"),
  number("fxTextSize", "Textgrösse", FX, 72, 8, 300, "px"),
  number("fxMargin", "Zufallsposition: Abstand zum Rand", FX, 20, 0, 50, "%"),
  number("fxMax", "Max. gleichzeitig", FX, 8, 1, 30),

  number("stingerDuration", "Länge", STINGER, 1.4, 0.5, 5, "s", 0.05),
  number("stingerCut", "Übergangspunkt", STINGER, 0.7, 0.1, 5, "s", 0.05),
  text("stingerText", "Text in der Mitte ({channel})", STINGER, "{channel}"),
  number("stingerTextSize", "Textgrösse", STINGER, 260, 40, 600, "px"),

  text("bannerTitle", "Titel ({channel})", BANNER, "{channel}"),
  text("bannerProfileText", "Profilbanner: Text", BANNER, "Kritzeleien, Neon und gute Laune"),
  text("bannerOfflineTitle", "Offline-Banner: Titel", BANNER, "Offline"),
  text("bannerOfflineText", "Offline-Banner: Text", BANNER, "Die Farbe trocknet noch. Folge dem Kanal!"),
  // Minimes: commands, rules, movement and hopping are the same for all themes with minimes; the look is the monster
  ...MINIME_FIELDS,
  ...MINIME_HOP_FIELDS,
  color("minimeDefaultColor", "Farbe ohne eigene Wahl", MINIME_LOOK, "#d123a0"),
  number("minimeSize", "Breite der Figur", MINIME_LOOK, 90, 30, 300, "px"),
  number("minimeGround", "Abstand zum unteren Rand", MINIME_LOOK, 30, 0, 300, "px"),
  number("minimeStroke", "Strichstärke", MINIME_LOOK, 3, 0.5, 10, undefined, 0.5),
  number("minimeGlow", "Leuchten (Stärke)", MINIME_LOOK, 1, 0, 3, undefined, 0.1),
  number("minimeShadow", "Schatten (Stärke)", MINIME_LOOK, 0.5, 0, 1, undefined, 0.05),
  flag("minimeNames", "Namen anzeigen", MINIME_LOOK, true),
  number("minimeNameSize", "Name: Schriftgrösse", MINIME_LOOK, 20, 8, 48, "px"),
  number("minimeNameGap", "Name: Abstand zum Kopf", MINIME_LOOK, 2, 0, 60, "px"),
  number("minimeWiggleWeight", "Zappeln: Häufigkeit", MINIME_MOVES, 10, 0, 100),
  number("minimeWiggleMs", "Zappeln: Dauer", MINIME_MOVES, 1200, 200, 10000, "ms"),
  number("minimeGrinWeight", "Grinsen: Häufigkeit", MINIME_MOVES, 8, 0, 100),
  number("minimeGrinMs", "Grinsen: Dauer", MINIME_MOVES, 1800, 200, 10000, "ms"),
  number("minimeStarWeight", "Kritzel-Stern: Häufigkeit", MINIME_MOVES, 6, 0, 100),
  number("minimeStarMs", "Kritzel-Stern: Dauer", MINIME_MOVES, 2000, 200, 10000, "ms"),
  number("minimeTumbleWeight", "Umfallen: Häufigkeit", MINIME_MOVES, 5, 0, 100),
  number("minimeTumbleMs", "Umfallen: Dauer", MINIME_MOVES, 2400, 500, 10000, "ms"),
  number("minimeSleepWeight", "Schlafen: Häufigkeit", MINIME_MOVES, 4, 0, 100),
  number("minimeSleepMs", "Schlafen: Dauer", MINIME_MOVES, 7000, 1000, 60000, "ms"),
  number("minimeSleepScrawls", "Schlafen: aufsteigende Krakel", MINIME_MOVES, 3, 1, 8),
  number("minimeSplatMs", "Reaktion auf Chat (Spray-Klecks): Dauer", MINIME_MOVES, 900, 200, 5000, "ms"),
  number("minimeSplatSize", "Spray-Klecks: Grösse (Faktor)", MINIME_MOVES, 1.4, 0.5, 4, undefined, 0.1),
  // Commands page (public, /s/<login>/): shared texts from the core, plus the look
  ...INFO_FIELDS,
  number("infoWidth", "Befehlsseite: Breite der Spalte", INFO_GROUP, 900, 400, 1600, "px"),
] as const satisfies readonly SettingField[];

// The resolved values as the server generates them (src/generated/themes, npm run gen:types)
export type { ChaosValues } from "../../generated/themes/chaos.ts";

const GROUP_SCENES = {
  [SCREENS]: ["starting", "brb", "ending"],
  [MOTION]: ["starting", "brb", "ending"],
  [ALERTS]: ["alerts"],
  [CHAT]: ["chat"],
  [CAM]: ["cam"],
  [MUSIC]: ["music"],
  [FX]: ["fx"],
  [STINGER]: [],
  [BANNER]: [],
  [MINIME_LOOK]: ["minimes"],
  [MINIME_MOVES]: ["minimes"],
  [MINIME_COMMANDS]: ["minimes"],
  [MINIME_RULES]: ["minimes"],
  [MINIME_MOTION]: ["minimes"],
  [MINIME_HOP]: ["minimes"],
  [INFO_GROUP]: ["info"],
} as const;

// On first login: channel name from the Twitch login instead of the sample
const personalize = (login: string) => ({ channelName: login.toUpperCase() });

// Simple view of the dashboard: the texts, main colors and switches most streamers change
const BASIC = [
  "channelName", "font", "titleFont", "accent", "accent2", "textColor", "scribbleColor1", "gestureStarting",
  "startingEyebrow", "startingTitle", "startingLines", "countdownDone", "ticker", "brbEyebrow", "brbTitle", "brbLines", "endingEyebrow",
  "endingTitle", "endingNext", "followLine", "subLine", "resubLine", "giftLine", "raidLine", "cheerLine", "redeemLine",
  "hypeBeginLine", "alertSide", "chatStyle", "chatBadges", "camStyle", "camLabel", "camLive", "musicStyle", "musicLabel", "musicIdle",
  "minimeDefaultColor", "minimeNames",
];

export const chaosSettings: ThemeSchema = { id: "chaos", name: "Chaos", fields: markBasic([...FIELDS, ...stingerFields(STINGER)], BASIC), groupScenes: GROUP_SCENES, personalize };
