// Settings schema of the Plantage theme: mango plantation with rows of mango trees, soil, crates and the streamer as the
// mango picker for all scenes, stinger and banners, plus mango soldiers as minimes that hop and fight. The only place of
// the theme with fixed colors, texts and numbers. PlantageValues is the type of the resolved values (usePlantage).
import { markBasic, choice, color, flag, font, inScene, lines, number, text, withDefaults } from "../../core/fields.ts";
import {
  MINIME_BASE_FIELDS, MINIME_COMBAT, MINIME_COMMANDS, MINIME_HOP, MINIME_HOP_FIELDS, MINIME_MOTION, MINIME_RULES, MINIME_VARIANTS, minimeAimKey,
  minimeCombatFields, minimeFireKey, minimeVariantFields,
} from "../../core/minimeFields.ts";
import { qualityField } from "../../core/graphicsFields.ts";
import { INFO_FIELDS, INFO_GROUP } from "../../core/infoFields.ts";
import { alertSoundFields } from "../../core/alerts/alerts.ts";
import { badgeFields } from "../../core/chat/chat.ts";
import { withStingerFields } from "../../core/stingerOptions.ts";
import type { SettingField, ThemeSchema } from "../../core/theme.ts";
import { ICON_NAMES } from "./field.ts";
import { ROLE_IDS, ROLE_SET } from "./mangos.ts";

export const FONTS = ["Baloo 2", "Fredoka", "Nunito", "Inter", "DM Sans"] as const;
const TITLE_FONTS = ["Fredoka", "Baloo 2", "Pacifico", "Nunito"] as const;
const TIMES = ["morgen", "mittag", "abend", "nacht"] as const;
const LOCALES = ["de-DE", "de-CH", "de-AT", "en-US", "en-GB", "fr-FR", "es-ES", "nl-NL"] as const;
const MOTIONS = ["fallen", "plopp", "gleiten", "blenden", "keins"] as const;

const GENERAL = "Allgemein";
const FIELD = "Plantage";
const SCREENS = "Starting, BRB, Ending";
const WORLD = "Welt";
const ALERTS = "Alerts";
const CHAT = "Chat";
const CAM = "Kamera-Rahmen";
const MUSIC = "Musik";
const FX = "Effekte";
const STINGER = "Stinger";
const PROFILE_BANNER = "Profilbanner";
const OFFLINE_BANNER = "Offline-Banner";
const MINIME_LOOK = "Minimes: Aussehen";
const MINIME_MOVES = "Minimes: Animationen";

const FIELDS = [
  text("channelName", "Kanal-Name", GENERAL, "Plantage", 40),
  font("font", "Schrift", GENERAL, "Baloo 2", FONTS),
  font("titleFont", "Titelschrift", GENERAL, "Fredoka", TITLE_FONTS),
  number("fontSize", "Schriftgrösse", GENERAL, 22, 10, 60, "px"),
  color("textColor", "Textfarbe", GENERAL, "#ffffff"),
  color("textOnWood", "Text auf Holz und Papier", GENERAL, "#3a2410"),
  color("wood", "Holz", GENERAL, "#c8935a"),
  color("woodDark", "Holz dunkel (Maserung, Rand)", GENERAL, "#7a4a24"),
  color("paper", "Erntezettel", GENERAL, "#fff6df"),
  color("soil", "Erde", GENERAL, "#8b5e3c"),
  color("soilDark", "Erde dunkel", GENERAL, "#5e3b22"),
  color("leaf", "Blätter", GENERAL, "#2f8f3a"),
  color("leafDark", "Blätter dunkel", GENERAL, "#1d5e27"),
  color("trunk", "Baumstamm", GENERAL, "#6d4c2f"),
  color("mango", "Mango", GENERAL, "#ffb02e"),
  color("mangoBlush", "Mango rot", GENERAL, "#ff5e3a"),
  color("accent", "Akzent (Mango-Orange)", GENERAL, "#ff8c1a"),
  color("accent2", "Akzent 2 (Blattgrün)", GENERAL, "#4caf50"),
  number("shadowStrength", "Schatten (Stärke)", GENERAL, 0.35, 0, 1, undefined, 0.05),
  number("radius", "Eckenradius", GENERAL, 14, 0, 60, "px"),
  number("fadeDuration", "Ein- und Ausblenden", GENERAL, 500, 0, 3000, "ms"),
  choice("locale", "Uhrzeit-Format", GENERAL, "de-DE", LOCALES),

  color("skyMorningTop", "Himmel Morgen oben", FIELD, "#ff9a76"),
  color("skyMorningBottom", "Himmel Morgen unten", FIELD, "#ffe2b0"),
  color("skyDayTop", "Himmel Mittag oben", FIELD, "#3aa0e0"),
  color("skyDayBottom", "Himmel Mittag unten", FIELD, "#c8ecff"),
  color("skyEveningTop", "Himmel Abend oben", FIELD, "#ff6f61"),
  color("skyEveningBottom", "Himmel Abend unten", FIELD, "#ffc371"),
  color("skyNightTop", "Himmel Nacht oben", FIELD, "#0b1d3a"),
  color("skyNightBottom", "Himmel Nacht unten", FIELD, "#2c4a5a"),
  color("sun", "Sonne", FIELD, "#ffd23f"),
  number("sunGlow", "Sonnenschein (Stärke)", FIELD, 1, 0, 3, undefined, 0.1),
  color("moon", "Mond", FIELD, "#f5f1d6"),
  flag("clouds", "Wolken", FIELD, true),
  number("cloudCount", "Anzahl Wolken", FIELD, 4, 0, 8),
  number("cloudSpeed", "Wolken: Zeit für eine Durchquerung", FIELD, 90, 10, 600, "s"),
  flag("hills", "Hügel im Hintergrund", FIELD, true),
  color("hillColor", "Hügel", FIELD, "#8fbf5a"),
  color("hillFarColor", "Hügel fern", FIELD, "#bcd88a"),
  number("treeSway", "Bäume wiegen (Grad)", FIELD, 2, 0, 15),
  number("treeSwaySpeed", "Bäume wiegen (Dauer)", FIELD, 6, 1, 30, "s"),
  flag("mangosOnTrees", "Mangos an den Bäumen", FIELD, true),
  flag("crates", "Kisten am Feldrand", FIELD, true),
  number("birdEvery", "Vögel: alle", FIELD, 18, 4, 120, "s"),
  flag("crateName", "Kanal-Name auf der Kiste", FIELD, true),

  // The PixiJS world of the screens (PLAN-PLANTAGE.md package 2)
  qualityField(WORLD),
  number("worldSeed", "Startwert der Welt", WORLD, 42, 1, 9999),
  color("skyDawnTop", "Himmel Dämmerung oben", WORLD, "#3b3a6b"),
  color("skyDawnBottom", "Himmel Dämmerung unten", WORLD, "#f2a477"),
  flag("sunriseOn", "Sonnenaufgang", WORLD, true),
  number("sunriseMs", "Sonnenaufgang (Dauer)", WORLD, 3200, 0, 20000, "ms"),
  flag("raysOn", "Sonnenstrahlen", WORLD, true),
  flag("parallaxOn", "Kamera schwenkt", WORLD, true),
  number("parallaxAmount", "Kamera: Weite", WORLD, 120, 0, 600, "px"),
  number("parallaxSeconds", "Kamera: Dauer eines Schwenks", WORLD, 14, 2, 120, "s"),
  number("treeRowsFar", "Bäume in der fernen Reihe", WORLD, 11, 2, 30),
  number("treeRowsMid", "Bäume in der mittleren Reihe", WORLD, 8, 2, 20),
  number("farBlur", "Unschärfe in der Ferne", WORLD, 1.5, 0, 6, "px", 0.1),
  number("hazeFar", "Dunst in der Ferne", WORLD, 55, 0, 100, "%"),
  number("swayAmount", "Wiegen (Faktor)", WORLD, 1, 0, 4, undefined, 0.1),
  flag("leavesOn", "Fallende Blätter", WORLD, true),
  // fixed: at most 200 leaves, more costs too much on weak PCs
  number("worldLeafCount", "Anzahl fallende Blätter", WORLD, 18, 0, 200),
  flag("motesOn", "Lichtstaub", WORLD, true),
  // fixed: at most 500 motes
  number("moteCount", "Anzahl Lichtstaub", WORLD, 70, 0, 500),
  inScene("ending", flag("sunsetOn", "Sonnenuntergang (Ending)", WORLD, true)),
  inScene("ending", number("sunsetMs", "Sonnenuntergang (Dauer)", WORLD, 4000, 0, 20000, "ms")),
  inScene("ending", flag("firefliesOn", "Glühwürmchen (Ending)", WORLD, true)),
  // fixed: at most 300 fireflies
  inScene("ending", number("fireflyCount", "Anzahl Glühwürmchen", WORLD, 40, 0, 300)),

  inScene("starting", text("startingEyebrow", "Starting: Überzeile", SCREENS, "Gleich geht's los")),
  inScene("starting", text("startingTitle", "Starting: Titel", SCREENS, "Stream startet gleich")),
  inScene("starting", text("startingNote", "Starting: Untertitel", SCREENS, "Die Mangos sind fast reif!")),
  inScene("brb", text("brbEyebrow", "BRB: Überzeile", SCREENS, "Kurze Pause")),
  inScene("brb", text("brbTitle", "BRB: Titel", SCREENS, "Bin gleich zurück")),
  inScene("brb", text("brbNote", "BRB: Untertitel", SCREENS, "Kurz eine Reihe abernten.")),
  inScene("ending", text("endingEyebrow", "Ending: Überzeile", SCREENS, "Danke fürs Zuschauen")),
  inScene("ending", text("endingTitle", "Ending: Titel", SCREENS, "Stream beendet")),
  inScene("ending", text("endingNote", "Ending: Untertitel", SCREENS, "Bis zur nächsten Ernte!")),
  number("signWidth", "Schild: Breite", SCREENS, 1100, 400, 1800, "px"),
  number("titleSize", "Titelgrösse", SCREENS, 110, 30, 240, "px"),
  flag("picker", "Mangopflücker zeigen", SCREENS, true),
  choice("pickerSide", "Mangopflücker: Seite", SCREENS, "links", ["links", "rechts"]),
  number("pickerSize", "Mangopflücker: Grösse (Faktor)", SCREENS, 1, 0.4, 2, undefined, 0.05),
  color("pickerHat", "Mangopflücker: Hut", SCREENS, "#e8c770"),
  color("pickerShirt", "Mangopflücker: Hemd", SCREENS, "#3f7fbf"),
  color("pickerSkin", "Mangopflücker: Haut", SCREENS, "#f1c27d"),
  inScene("starting", number("countdown", "Countdown-Standard", SCREENS, 300, 0, 86400, "s")),
  inScene("starting", text("countdownPrefix", "Countdown-Präfix", SCREENS, "")),
  inScene("starting", text("countdownDone", "Text nach dem Countdown", SCREENS, "Gleich live!")),
  inScene("starting", choice("progressStyle", "Fortschritt", SCREENS, "korb", ["korb", "ast", "aus"])),
  inScene("starting", number("cardDropMs", "Starting: Karten fallen herein (Dauer)", SCREENS, 1100, 0, 5000, "ms")),
  inScene("starting", number("basketMangos", "Starting: Mangos im Korb", SCREENS, 5, 1, 12)),
  inScene("starting", flag("pickerReach", "Starting: Pflücker greift in den Baum", SCREENS, true)),
  inScene("brb", number("brbPickEvery", "BRB: Pflücker pflückt alle", SCREENS, 2.4, 0.8, 20, "s", 0.1)),
  inScene("brb", flag("brbMangoBounce", "BRB: Mango springt im Korb", SCREENS, true)),
  inScene("brb", text("afkPrefix", "BRB-Zähler-Präfix", SCREENS, "Pause seit ")),
  inScene("ending", text("endingNextLabel", "Nächster Stream (Beschriftung)", SCREENS, "Nächster Stream")),
  inScene("ending", text("endingNext", "Nächster Stream (leer = ausblenden)", SCREENS, "")),
  inScene("starting", lines("startingLines", "Sprüche Starting", SCREENS, ["Mangos werden gezählt ...", "Leiter wird aufgestellt ...", "Körbe werden geflochten ...", "Pflückstange wird geschärft ..."])),
  inScene("brb", lines("brbLines", "Sprüche BRB", SCREENS, ["Kurz eine Reihe abernten ...", "Mangosaft wird gepresst ...", "Kisten werden gestapelt ..."])),
  inScene("ending", lines("endingLines", "Sprüche Ending", SCREENS, ["Die Körbe sind voll ...", "Die Sonne geht über der Plantage unter ...", "Bis zur nächsten Ernte!"])),
  number("linesEvery", "Sprüche wechseln alle", SCREENS, 6, 2, 120, "s"),
  text("ticker", "Ticker-Text (leer = aus)", SCREENS, "", 300),
  choice("tickerStyle", "Ticker", SCREENS, "flugzeug", ["flugzeug", "leiste"]),
  number("tickerSpeed", "Ticker: Zeit pro Durchlauf", SCREENS, 30, 5, 300, "s"),

  choice("alertStyle", "Stil", ALERTS, "kiste", ["kiste", "zettel", "korb"]),
  text("followTag", "Follow: Kopfzeile", ALERTS, "Neuer Follower"),
  text("followLine", "Follow: Zeile", ALERTS, "{user} hilft bei der Ernte!"),
  choice("followIcon", "Follow: Symbol", ALERTS, "blatt", ICON_NAMES),
  text("subTag", "Sub: Kopfzeile", ALERTS, "Neues Abo"),
  text("subLine", "Sub: Zeile", ALERTS, "{user} kommt in die Kiste!"),
  choice("subIcon", "Sub: Symbol", ALERTS, "kiste", ICON_NAMES),
  text("resubTag", "Resub: Kopfzeile", ALERTS, "Abo x{amount}"),
  text("resubLine", "Resub: Zeile", ALERTS, "{user} pflückt seit {amount} Monaten mit!"),
  choice("resubIcon", "Resub: Symbol", ALERTS, "baum", ICON_NAMES),
  text("giftTag", "Gift: Kopfzeile", ALERTS, "Abos verschenkt"),
  text("giftLine", "Gift: Zeile", ALERTS, "{user} verschenkt {amount} Abos!"),
  choice("giftIcon", "Gift: Symbol", ALERTS, "korb", ICON_NAMES),
  text("raidTag", "Raid: Kopfzeile", ALERTS, "Raid"),
  text("raidLine", "Raid: Zeile", ALERTS, "{user} kommt mit {amount} Erntehelfern!"),
  choice("raidIcon", "Raid: Symbol", ALERTS, "leiter", ICON_NAMES),
  text("cheerTag", "Bits: Kopfzeile", ALERTS, "{amount} Bits"),
  text("cheerLine", "Bits: Zeile", ALERTS, "{user} wirft {amount} Bits in den Korb!"),
  choice("cheerIcon", "Bits: Symbol", ALERTS, "stern", ICON_NAMES),
  text("redeemTag", "Kanalpunkte: Kopfzeile", ALERTS, "Kanalpunkte"),
  text("redeemLine", "Kanalpunkte: Zeile", ALERTS, "{user} löst {detail} ein."),
  choice("redeemIcon", "Kanalpunkte: Symbol", ALERTS, "mango", ICON_NAMES),
  text("hypeTag", "Hype Train: Kopfzeile", ALERTS, "Hype Train"),
  text("hypeBeginLine", "Hype Train: Start", ALERTS, "Der Hype Train fährt zur Ernte!"),
  text("hypeEndLine", "Hype Train: Ende", ALERTS, "Hype Train Level {amount} geschafft!"),
  choice("hypeIcon", "Hype Train: Symbol", ALERTS, "sonne", ICON_NAMES),
  flag("alertQuote", "Nachricht zeigen", ALERTS, true),
  text("quoteFormat", "Nachricht ({text})", ALERTS, "\"{text}\""),
  number("alertDuration", "Dauer", ALERTS, 7000, 2000, 60000, "ms"),
  number("alertScale", "Grösse", ALERTS, 1, 0.3, 2, undefined, 0.05),
  number("alertTop", "Abstand oben", ALERTS, 80, 0, 1000, "px"),
  choice("alertAlign", "Position", ALERTS, "center", ["left", "center", "right"]),
  number("alertWidth", "Breite", ALERTS, 760, 300, 1800, "px"),
  flag("alertTimer", "Restzeit als Ast", ALERTS, true),
  flag("leafConfetti", "Blätter-Konfetti", ALERTS, true),
  number("leafCount", "Anzahl Blätter", ALERTS, 14, 0, 40),
  flag("juice", "Saftspritzer", ALERTS, true),
  flag("alertMangoOn", "Mango fällt aufs Medaillon", ALERTS, true),
  number("alertSquash", "Mango staucht sich beim Aufprall", ALERTS, 28, 0, 60, "%"),
  // fixed: at most 200 juice drops
  number("alertSplashDrops", "Anzahl Safttropfen", ALERTS, 40, 0, 200),
  // fixed: at least 24 px between medallion and text, for legibility
  number("alertGap", "Abstand Medaillon zum Text", ALERTS, 48, 24, 200, "px"),
  flag("alertSound", "Töne", ALERTS, true),
  ...alertSoundFields(ALERTS),

  choice("chatStyle", "Stil", CHAT, "zettel", ["zettel", "brett", "blatt"]),
  ...badgeFields(CHAT),
  flag("chatBadges", "Badges zeigen", CHAT, true),
  number("chatFontSize", "Schriftgrösse", CHAT, 20, 8, 60, "px"),
  number("emoteSize", "Emote-Grösse", CHAT, 28, 8, 120, "px"),
  number("chatFade", "Ausblenden nach (0 = nie)", CHAT, 30, 0, 3600, "s"),
  number("chatMax", "Max. Nachrichten", CHAT, 12, 1, 100),
  choice("chatAlign", "Neue Nachrichten", CHAT, "bottom", ["bottom", "top"]),
  number("chatOpacity", "Deckkraft", CHAT, 0.94, 0, 1, undefined, 0.01),
  number("chatGap", "Abstand", CHAT, 10, 0, 40, "px"),
  flag("chatSway", "Sanft schaukeln", CHAT, true),

  choice("camStyle", "Rahmen", CAM, "kiste", ["kiste", "holz", "seil"]),
  number("camFrameWidth", "Rahmenbreite", CAM, 18, 2, 60, "px"),
  number("camRadius", "Eckenradius", CAM, 16, 0, 80, "px"),
  number("camLeaves", "Mangoblätter in den Ecken", CAM, 3, 0, 4),
  number("camLeafSize", "Mangoblatt: Grösse", CAM, 150, 40, 400, "px"),
  flag("camLeafSway", "Blätter wiegen", CAM, true),
  flag("camMango", "Mango in der Ecke", CAM, true),
  text("camLabel", "Namensschild ({channel})", CAM, "{channel}"),
  flag("camLive", "Live-Anzeige", CAM, true),
  text("camLiveText", "Live-Text", CAM, "LIVE"),

  choice("musicStyle", "Stil", MUSIC, "radio", ["radio", "kiste", "schlicht"]),
  text("musicHeadPlaying", "Kopfzeile bei Wiedergabe", MUSIC, "Plantagenradio"),
  text("musicHeadPaused", "Kopfzeile bei Pause", MUSIC, "Pause"),
  text("musicIdleTitle", "Titel ohne Wiedergabe", MUSIC, "Keine Musik"),
  text("musicIdleArtist", "Interpret ohne Wiedergabe", MUSIC, "Nur Grillenzirpen"),
  flag("musicAlbum", "Album zeigen", MUSIC, false),
  flag("musicProgress", "Fortschritt zeigen", MUSIC, true),
  flag("equalizer", "Mango-Equalizer", MUSIC, true),
  number("equalizerBars", "Equalizer: Balken", MUSIC, 7, 1, 16),
  choice("coverShape", "Cover-Form", MUSIC, "eckig", ["rund", "eckig"]),
  number("coverSize", "Cover-Grösse", MUSIC, 120, 40, 400, "px"),
  number("musicTitleSize", "Titelgrösse", MUSIC, 26, 10, 80, "px"),
  flag("musicHide", "Bei Pause ausblenden", MUSIC, true),
  flag("musicMarquee", "Lange Titel laufen durch", MUSIC, true),
  number("musicMarqueeSpeed", "Lange Titel: Lauftempo (px pro Sekunde)", MUSIC, 40, 5, 400),

  number("fxDuration", "Standarddauer", FX, 4, 0.5, 120, "s", 0.5),
  number("fxSize", "Standardgrösse", FX, 360, 20, 1920, "px"),
  number("fxTextSize", "Textgrösse", FX, 44, 8, 300, "px"),
  number("fxMargin", "Zufallsposition: Abstand zum Rand", FX, 20, 0, 50, "%"),
  number("fxMax", "Max. gleichzeitig", FX, 8, 1, 30),
  choice("fxIn", "Einblenden", FX, "plopp", MOTIONS),
  choice("fxOut", "Ausblenden", FX, "blenden", MOTIONS),
  flag("fxBubble", "Text auf einem Erntezettel", FX, true),

  number("stingerDuration", "Länge", STINGER, 1.4, 0.5, 5, "s", 0.05),
  number("stingerCut", "Übergangspunkt", STINGER, 0.7, 0.1, 5, "s", 0.05),
  text("stingerText", "Text ({channel})", STINGER, "{channel}"),
  flag("stingerLeaves", "Blätter fliegen mit", STINGER, true),
  // fixed: at most 120 leaves in the stinger
  number("stingerLeafCount", "Anzahl Blätter im Stinger", STINGER, 24, 0, 120),

  text("bannerTitle", "Titel ({channel})", PROFILE_BANNER, "{channel}"),
  text("bannerOfflineName", "Kanalzeile ({channel})", OFFLINE_BANNER, "{channel}"),
  text("bannerProfileText", "Text", PROFILE_BANNER, "Mangos, Ernte und gute Streams"),
  text("bannerOfflineTitle", "Titel", OFFLINE_BANNER, "Gerade auf der Plantage"),
  text("bannerOfflineText", "Text", OFFLINE_BANNER, "Folge dem Kanal und verpasse keine Ernte."),
  lines("bannerOfflineLines", "Zeilen", OFFLINE_BANNER, ["Bald wieder live", "Die Mangos reifen noch"]),

  ...MINIME_BASE_FIELDS,
  number("mangoSize", "Grösse", MINIME_LOOK, 84, 30, 300, "px"),
  number("mangoGround", "Abstand zum unteren Rand", MINIME_LOOK, 20, 0, 300, "px"),
  number("mangoShadow", "Schatten (Stärke)", MINIME_LOOK, 0.3, 0, 1, undefined, 0.05),
  flag("mangoFaces", "Gesichter", MINIME_LOOK, true),
  color("mangoEye", "Augen", MINIME_LOOK, "#2b1b17"),
  color("mangoCheek", "Bäckchen", MINIME_LOOK, "#ff7a9a"),
  color("mangoMouth", "Mund", MINIME_LOOK, "#6b2a1f"),
  color("mangoOutline", "Umriss", MINIME_LOOK, "#5a3a22"),
  number("mangoOutlineWidth", "Umriss: Stärke", MINIME_LOOK, 2.5, 0, 8, undefined, 0.5),
  color("helmet", "Helm", MINIME_LOOK, "#5b6b3a"),
  color("weapon", "Waffen", MINIME_LOOK, "#3a3a42"),
  color("weaponMark", "Zielfernrohr und Streifen", MINIME_LOOK, "#9fb3c8"),
  color("medicCross", "Medic: Kreuz", MINIME_LOOK, "#e53935"),
  color("muzzle", "Mündungsfeuer", MINIME_LOOK, "#ffd23f"),
  choice("mangoDefault", "Rolle ohne Wahl (alle aus)", MINIME_LOOK, "sturm", ROLE_IDS),
  flag("mangoNames", "Namen zeigen", MINIME_LOOK, true),
  choice("mangoNameStyle", "Namen auf", MINIME_LOOK, "kiste", ["kiste", "band"]),
  number("mangoNameSize", "Name: Schriftgrösse", MINIME_LOOK, 15, 8, 48, "px"),
  number("mangoBlinkEvery", "Blinzeln alle (0 = nie)", MINIME_LOOK, 4000, 0, 30000, "ms"),
  choice("mangoEnter", "Erscheinen", MINIME_LOOK, "fallen", ["fallen", "blenden"]),
  choice("mangoExit", "Verschwinden", MINIME_LOOK, "wegspringen", ["wegspringen", "versinken"]),
  ...MINIME_HOP_FIELDS,
  number("reloadWeight", "Nachladen: Häufigkeit", MINIME_MOVES, 10, 0, 100),
  number("reloadMs", "Nachladen: Dauer", MINIME_MOVES, 1400, 300, 10000, "ms"),
  number("helmetWeight", "Helm richten: Häufigkeit", MINIME_MOVES, 8, 0, 100),
  number("helmetMs", "Helm richten: Dauer", MINIME_MOVES, 1200, 300, 10000, "ms"),
  number("lookWeight", "Umschauen: Häufigkeit", MINIME_MOVES, 12, 0, 100),
  number("lookMs", "Umschauen: Dauer", MINIME_MOVES, 2400, 300, 10000, "ms"),
  number("sleepWeight", "Schlafen: Häufigkeit", MINIME_MOVES, 4, 0, 100),
  number("sleepMs", "Schlafen: Dauer", MINIME_MOVES, 7000, 1000, 60000, "ms"),
  text("sleepText", "Schlafen: aufsteigendes Zeichen", MINIME_MOVES, "z", 4),
  number("cheerMs", "Reaktion auf Chat: Dauer", MINIME_MOVES, 900, 200, 5000, "ms"),
  number("cheerHeight", "Reaktion auf Chat: Sprunghöhe", MINIME_MOVES, 50, 0, 300, "px"),
  // Commands page (public, /s/<login>/): shared texts from the core, plus the look
  ...INFO_FIELDS,
  choice("timeInfo", "Befehlsseite: Tageszeit auf der Plantage", INFO_GROUP, "mittag", TIMES),
] as const satisfies readonly SettingField[];

// The resolved values as the server generates them (src/generated/themes, npm run gen:types)
export type { PlantageValues } from "../../generated/themes/plantage.ts";

// Fights with own durations per role: the sniper aims long and fires once, the MG fires a long burst
const COMBAT_FIELDS = withDefaults(minimeCombatFields(ROLE_SET), {
  [minimeAimKey("sniper")]: 1600,
  [minimeFireKey("sniper")]: 300,
  [minimeFireKey("mg")]: 1400,
  [minimeFireKey("grenadier")]: 900,
});

const SCREEN_SCENES = ["starting", "brb", "ending"] as const;
const GROUP_SCENES = {
  [FIELD]: [...SCREEN_SCENES, "info"],
  [WORLD]: SCREEN_SCENES,
  [SCREENS]: SCREEN_SCENES,
  [ALERTS]: ["alerts"],
  [CHAT]: ["chat"],
  [CAM]: ["cam"],
  [MUSIC]: ["music"],
  [FX]: ["fx"],
  [STINGER]: [],
  [PROFILE_BANNER]: [],
  [OFFLINE_BANNER]: [],
  [MINIME_COMMANDS]: ["minimes"],
  [MINIME_RULES]: ["minimes"],
  [MINIME_MOTION]: ["minimes"],
  [MINIME_VARIANTS]: ["minimes"],
  [MINIME_LOOK]: ["minimes"],
  [MINIME_HOP]: ["minimes"],
  [MINIME_MOVES]: ["minimes"],
  [MINIME_COMBAT]: ["minimes"],
  [INFO_GROUP]: ["info"],
} as const;

const capital = (login: string) => login[0].toUpperCase() + login.slice(1);
// On first login: channel name from the Twitch login (first letter upper case)
const personalize = (login: string) => ({ channelName: capital(login) });

// Simple view of the dashboard: per area the texts, main colors, figures and switches most streamers change
const BASIC = [
  "quality",
  "channelName", "font", "titleFont", "textColor", "accent", "accent2", "picker", "mangosOnTrees", "sunriseOn",
  "startingEyebrow", "startingTitle", "ticker", "brbMangoBounce", "brbTitle", "brbNote", "sunsetOn", "endingTitle", "endingNext", "alertStyle",
  "followLine", "subLine", "resubLine", "giftLine", "raidLine", "cheerLine", "redeemLine", "hypeBeginLine", "chatStyle", "chatBadges",
  "camStyle", "camLabel", "camLive", "musicStyle", "musicHide", "fxIn", "fxOut", "mangoDefault", "mangoNames",
];

export const plantageSettings: ThemeSchema = {
  id: "plantage",
  name: "Südfrucht-Plantage",
  fields: markBasic(withStingerFields([...FIELDS, ...minimeVariantFields(ROLE_SET), ...COMBAT_FIELDS], STINGER), BASIC),
  groupScenes: GROUP_SCENES,
  personalize,
  minimeVariants: ROLE_SET,
};
