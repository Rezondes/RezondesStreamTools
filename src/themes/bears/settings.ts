// Settings schema of the Bärenbande theme: three bear brothers (Eisbär, Grizzly, Panda) as cartoons with a clear outline in
// front of a watercolor world of forest, cave and a far city. One bear per scene (or the tower of all three), chosen
// per scene. The only place of the theme with fixed colors, texts and numbers. BearsValues is the type of the resolved
// values (useBears).
import { markBasic, choice, color, flag, font, inScene, lines, number, text } from "../../core/fields.ts";
import { alertSoundFields } from "../../core/alerts/alerts.ts";
import { badgeFields } from "../../core/chat/chat.ts";
import { INFO_FIELDS, INFO_GROUP } from "../../core/infoFields.ts";
import { MINIME_BASE_FIELDS, MINIME_COMMANDS, MINIME_MOTION, MINIME_RULES, MINIME_STACK, MINIME_VARIANTS, minimeStackFields, minimeVariantFields } from "../../core/minimeFields.ts";
import { withStingerFields } from "../../core/stingerOptions.ts";
import type { SettingField, ThemeSchema } from "../../core/theme.ts";
import { BEAR_CHOICES, BEAR_IDS } from "./bears.ts";
import { ICON_NAMES } from "./icons.ts";
import { BEAR_SET } from "./minimeBears.ts";

export const FONTS = ["Nunito", "Fredoka", "Baloo 2", "Inter", "DM Sans"] as const;
const TITLE_FONTS = ["Sniglet", "Fredoka", "Baloo 2", "Nunito"] as const;
const TIMES = ["morgen", "mittag", "abend", "nacht"] as const;
const LOCALES = ["de-DE", "de-CH", "de-AT", "en-US", "en-GB", "fr-FR", "es-ES", "nl-NL"] as const;
const SIDES = ["links", "rechts"] as const;
const MOTIONS = ["watscheln", "plopp", "gleiten", "blenden", "keins"] as const;

const GENERAL = "Allgemein";
// The bears themselves (fur, face, blinking, tower) apply everywhere, so their fields are general
const BEARS = GENERAL;
const WORLD = "Welt";
const MOTION = "Bewegung";
const SCREENS = "Starting, BRB, Ending";
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
  text("channelName", "Kanal-Name", GENERAL, "Bärenbande", 40),
  font("font", "Schrift", GENERAL, "Nunito", FONTS),
  font("titleFont", "Titelschrift", GENERAL, "Sniglet", TITLE_FONTS),
  number("fontSize", "Schriftgrösse", GENERAL, 24, 10, 60, "px"),
  color("outline", "Kontur", GENERAL, "#1c1a19"),
  number("outlineWidth", "Kontur: Stärke", GENERAL, 4.5, 0, 20, undefined, 0.5),
  color("textColor", "Text hell", GENERAL, "#ffffff"),
  color("textDark", "Text auf Papier", GENERAL, "#2b2522"),
  color("textDim", "Text gedämpft", GENERAL, "#6b5d55"),
  color("paper", "Papier (Karten, Schilder)", GENERAL, "#fbf3e0"),
  color("paperShade", "Papier: Schattenton", GENERAL, "#e9dcc0"),
  color("accent", "Akzent (Ziegelrot)", GENERAL, "#e2573f"),
  color("accentText", "Akzent für Text", GENERAL, "#b83c28"),
  color("accent2", "Akzent 2 (Himmelblau)", GENERAL, "#4d9de0"),
  number("radius", "Eckenradius", GENERAL, 22, 0, 60, "px"),
  number("fadeDuration", "Ein- und Ausblenden", GENERAL, 500, 0, 3000, "ms"),
  choice("locale", "Uhrzeit-Format", GENERAL, "de-DE", LOCALES),
  choice("facing", "Blickrichtung der Bären", GENERAL, "links", SIDES),

  color("iceFur", "Eisbär: Fell", BEARS, "#ffffff"),
  color("iceShade", "Eisbär: Schattenton", BEARS, "#d5dcda"),
  color("grizzlyFur", "Grizzly: Fell", BEARS, "#96693f"),
  color("grizzlyShade", "Grizzly: Schattenton", BEARS, "#7d5533"),
  color("pandaFur", "Panda: weisses Fell", BEARS, "#f3eeeb"),
  color("pandaShade", "Panda: Schattenton auf Weiss", BEARS, "#d9d2ce"),
  color("pandaPatch", "Panda: schwarzes Fell", BEARS, "#64615c"),
  color("pandaPatchShade", "Panda: Schattenton auf Schwarz", BEARS, "#4e4b47"),
  color("bearEye", "Augen", BEARS, "#111111"),
  color("bearNose", "Nase", BEARS, "#111111"),
  color("grizzlyMouth", "Grizzly: Mund innen", BEARS, "#6b3833"),
  color("grizzlyTongue", "Grizzly: Zunge", BEARS, "#e0868a"),
  color("bearTeeth", "Zähne", BEARS, "#ffffff"),
  color("phoneCase", "Handy: Hülle", BEARS, "#f4a493"),
  color("phoneScreen", "Handy: Bildschirm", BEARS, "#2d2926"),
  color("prop", "Pfanne und Geräte", BEARS, "#4a4542"),
  color("food", "Essen in der Pfanne", BEARS, "#f6c945"),
  number("blinkEvery", "Blinzeln alle (0 = nie)", BEARS, 5000, 0, 30000, "ms"),
  flag("breathe", "Atmen", BEARS, true),
  number("breatheMs", "Atmen: Dauer eines Atemzugs", BEARS, 3600, 1000, 10000, "ms"),
  number("towerSway", "Bärenturm: Wanken (Grad)", BEARS, 2, 0, 10),
  number("towerSwayMs", "Bärenturm: Wanken (Dauer)", BEARS, 2400, 500, 10000, "ms"),

  inScene("starting", choice("timeStarting", "Tageszeit Starting", WORLD, "mittag", TIMES)),
  inScene("brb", choice("timeBrb", "Tageszeit BRB", WORLD, "mittag", TIMES)),
  inScene("ending", choice("timeEnding", "Tageszeit Ending", WORLD, "abend", TIMES)),
  color("skyMorningTop", "Himmel Morgen oben", WORLD, "#f6b38a"),
  color("skyMorningBottom", "Himmel Morgen unten", WORLD, "#fde4c6"),
  color("skyDayTop", "Himmel Mittag oben", WORLD, "#7fc3e8"),
  color("skyDayBottom", "Himmel Mittag unten", WORLD, "#cfe9f5"),
  color("skyEveningTop", "Himmel Abend oben", WORLD, "#e8846a"),
  color("skyEveningBottom", "Himmel Abend unten", WORLD, "#f7c99a"),
  color("skyNightTop", "Himmel Nacht oben", WORLD, "#1f2d4f"),
  color("skyNightBottom", "Himmel Nacht unten", WORLD, "#4a5a7c"),
  color("sun", "Sonne", WORLD, "#fff1b8"),
  color("moon", "Mond", WORLD, "#f4f0dc"),
  color("cloud", "Wolken", WORLD, "#ffffff"),
  number("cloudCount", "Anzahl Wolken", WORLD, 4, 0, 8),
  number("cloudSpeed", "Wolken: Zeit für eine Durchquerung", WORLD, 140, 10, 600, "s"),
  color("meadow", "Wiese", WORLD, "#b9cf63"),
  color("meadowDark", "Wiese dunkel", WORLD, "#8fb24a"),
  color("fir", "Tannen", WORLD, "#5e8f6a"),
  color("firDark", "Tannen dunkel", WORLD, "#3f6b52"),
  color("treeLeaf", "Laubbäume", WORLD, "#7fae5a"),
  color("hills", "Hügel in der Ferne", WORLD, "#a9c7b9"),
  color("city", "Stadt", WORLD, "#d8dde3"),
  color("cityWindow", "Stadt: Fenster", WORLD, "#9fb0c0"),
  color("bridge", "Brücke", WORLD, "#d9573b"),
  color("water", "Wasser", WORLD, "#9cc9d9"),
  color("road", "Weg", WORLD, "#a3a5a6"),
  color("cave", "Höhlenhügel", WORLD, "#8b6352"),
  color("caveDark", "Höhleneingang", WORLD, "#4a3128"),
  color("wood", "Holz", WORLD, "#9a6a44"),
  color("flower", "Blumen", WORLD, "#fff7e8"),
  flag("flowers", "Blumen und Gras", WORLD, true),
  flag("showCity", "Stadt in der Ferne", WORLD, true),
  flag("showBridge", "Brücke in der Ferne", WORLD, true),
  flag("showCave", "Höhle", WORLD, true),
  number("paperGrain", "Aquarell: Papierstruktur", WORLD, 0.5, 0, 1, undefined, 0.05),
  number("sketchLines", "Aquarell: Skizzenlinien", WORLD, 0.35, 0, 1, undefined, 0.05),
  number("worldSeed", "Aquarell: Startwert", WORLD, 3, 0, 9999),
  number("washLayers", "Aquarell: Lasuren je Fläche", WORLD, 4, 1, 8),
  number("washAlpha", "Aquarell: Deckkraft je Lasur", WORLD, 0.3, 0.05, 1, undefined, 0.05),
  number("washRoughness", "Aquarell: unruhiger Rand", WORLD, 2.4, 0, 6, undefined, 0.1),
  flag("waddleIn", "Bär watschelt herein", MOTION, true),
  number("bearWaddle", "Watscheln: Schaukeln (Grad)", MOTION, 6, 0, 20),
  number("landSquash", "Landen: Stauchen", MOTION, 10, 0, 40, "%"),
  number("waveSpeed", "Winken: Tempo (Faktor)", MOTION, 1, 0.2, 3, undefined, 0.1),
  number("headSway", "Kopf wiegen (Grad)", MOTION, 4, 0, 15),
  number("breathAmount", "Atmen: Stärke", MOTION, 1.2, 0, 5, "%", 0.1),
  number("flashEvery", "Selfie: Blitz alle (0 = nie)", MOTION, 4, 0, 30, "s", 0.5),

  inScene("starting", choice("bearStarting", "Starting: Bär", SCREENS, "grizzly", BEAR_CHOICES)),
  inScene("brb", choice("bearBrb", "BRB: Bär", SCREENS, "eisbaer", BEAR_CHOICES)),
  inScene("ending", choice("bearEnding", "Ending: Bär", SCREENS, "panda", BEAR_CHOICES)),
  number("bearSize", "Bär: Grösse (Höhe)", SCREENS, 520, 100, 1000, "px"),
  choice("bearSide", "Bär: Seite", SCREENS, "links", SIDES),
  inScene("starting", text("startingEyebrow", "Starting: Überzeile", SCREENS, "Gleich geht's los")),
  inScene("starting", text("startingTitle", "Starting: Titel", SCREENS, "Stream startet gleich")),
  inScene("starting", text("startingNote", "Starting: Untertitel", SCREENS, "Die Bande sammelt sich noch.")),
  inScene("brb", text("brbEyebrow", "BRB: Überzeile", SCREENS, "Kurze Pause")),
  inScene("brb", text("brbTitle", "BRB: Titel", SCREENS, "Bin gleich zurück")),
  inScene("brb", text("brbNote", "BRB: Untertitel", SCREENS, "Hier wird gerade gekocht.")),
  inScene("brb", text("brbSign", "BRB: Schild des Grizzly", SCREENS, "Gleich zurück!", 24)),
  inScene("ending", text("endingEyebrow", "Ending: Überzeile", SCREENS, "Danke fürs Zuschauen")),
  inScene("ending", text("endingTitle", "Ending: Titel", SCREENS, "Stream beendet")),
  inScene("ending", text("endingNote", "Ending: Untertitel", SCREENS, "Bis zum nächsten Mal!")),
  number("signWidth", "Schild: Breite", SCREENS, 1000, 400, 1800, "px"),
  number("titleSize", "Titelgrösse", SCREENS, 104, 30, 240, "px"),
  inScene("starting", number("countdown", "Countdown: Dauer", SCREENS, 300, 0, 86400, "s")),
  inScene("starting", text("countdownAt", "Countdown: bis Uhrzeit (z.B. 20:00, leer = Dauer)", SCREENS, "", 5)),
  inScene("starting", text("countdownPrefix", "Countdown-Präfix", SCREENS, "")),
  inScene("starting", text("countdownDone", "Text nach dem Countdown", SCREENS, "Gleich live!")),
  inScene("starting", choice("progressStyle", "Fortschritt", SCREENS, "weg", ["weg", "balken", "aus"])),
  inScene("brb", text("afkPrefix", "BRB-Zähler-Präfix", SCREENS, "Pause seit ")),
  inScene("ending", text("endingNextLabel", "Nächster Stream (Beschriftung)", SCREENS, "Nächster Stream")),
  inScene("ending", text("endingNext", "Nächster Stream (leer = ausblenden)", SCREENS, "")),
  inScene("starting", lines("startingLines", "Sprüche Starting", SCREENS, ["Snacks werden verteilt ...", "Das Handy wird aufgeladen ...", "Die Höhle wird aufgeräumt ...", "Die Begrüssung wird geübt ..."])),
  inScene("brb", lines("brbLines", "Sprüche BRB", SCREENS, ["Es wird etwas Feines gekocht ...", "Kurz die Höhle fegen ...", "Nachrichten werden gecheckt ..."])),
  inScene("ending", lines("endingLines", "Sprüche Ending", SCREENS, ["Die Bande winkt zum Abschied ...", "Zeit für ein Nickerchen in der Höhle ...", "Bis bald!"])),
  number("linesEvery", "Sprüche wechseln alle", SCREENS, 6, 2, 120, "s"),
  text("ticker", "Ticker-Text (leer = aus)", SCREENS, "", 300),
  number("tickerSpeed", "Ticker: Zeit pro Durchlauf", SCREENS, 30, 5, 300, "s"),
  choice("powerOn", "Einschalten", SCREENS, "aquarell", ["aquarell", "blenden", "keins"]),
  number("powerOnDuration", "Einschalten (Dauer)", SCREENS, 1600, 0, 10000, "ms"),

  choice("bearAlerts", "Bär", ALERTS, "grizzly", BEAR_CHOICES),
  number("alertBearSize", "Bär: Grösse (Höhe)", ALERTS, 300, 80, 800, "px"),
  text("followTag", "Follow: Kopfzeile", ALERTS, "Neuer Follower"),
  text("followLine", "Follow: Zeile", ALERTS, "{user} gehört jetzt zur Bande!"),
  choice("followIcon", "Follow: Symbol", ALERTS, "pfote", ICON_NAMES),
  text("subTag", "Sub: Kopfzeile", ALERTS, "Neues Abo"),
  text("subLine", "Sub: Zeile", ALERTS, "{user} zieht mit in die Höhle!"),
  choice("subIcon", "Sub: Symbol", ALERTS, "herz", ICON_NAMES),
  text("resubTag", "Resub: Kopfzeile", ALERTS, "Abo x{amount}"),
  text("resubLine", "Resub: Zeile", ALERTS, "{user} ist seit {amount} Monaten dabei!"),
  choice("resubIcon", "Resub: Symbol", ALERTS, "honig", ICON_NAMES),
  text("giftTag", "Gift: Kopfzeile", ALERTS, "Abos verschenkt"),
  text("giftLine", "Gift: Zeile", ALERTS, "{user} verschenkt {amount} Abos!"),
  choice("giftIcon", "Gift: Symbol", ALERTS, "stern", ICON_NAMES),
  text("raidTag", "Raid: Kopfzeile", ALERTS, "Raid"),
  text("raidLine", "Raid: Zeile", ALERTS, "{user} kommt mit {amount} Gästen zu Besuch!"),
  choice("raidIcon", "Raid: Symbol", ALERTS, "blatt", ICON_NAMES),
  text("cheerTag", "Bits: Kopfzeile", ALERTS, "{amount} Bits"),
  text("cheerLine", "Bits: Zeile", ALERTS, "{user} spendiert {amount} Bits für Snacks!"),
  choice("cheerIcon", "Bits: Symbol", ALERTS, "fisch", ICON_NAMES),
  text("redeemTag", "Kanalpunkte: Kopfzeile", ALERTS, "Kanalpunkte"),
  text("redeemLine", "Kanalpunkte: Zeile", ALERTS, "{user} löst {detail} ein."),
  choice("redeemIcon", "Kanalpunkte: Symbol", ALERTS, "handy", ICON_NAMES),
  text("hypeTag", "Hype Train: Kopfzeile", ALERTS, "Hype Train"),
  text("hypeBeginLine", "Hype Train: Start", ALERTS, "Der Hype Train rollt los!"),
  text("hypeEndLine", "Hype Train: Ende", ALERTS, "Hype Train Level {amount} geschafft!"),
  choice("hypeIcon", "Hype Train: Symbol", ALERTS, "muetze", ICON_NAMES),
  flag("alertQuote", "Nachricht zeigen", ALERTS, true),
  text("quoteFormat", "Nachricht ({text})", ALERTS, "\"{text}\""),
  number("alertDuration", "Dauer", ALERTS, 7000, 2000, 60000, "ms"),
  number("alertScale", "Grösse", ALERTS, 1, 0.3, 2, undefined, 0.05),
  number("alertWidth", "Breite", ALERTS, 900, 300, 1800, "px"),
  choice("alertIn", "Einblenden", ALERTS, "plopp", MOTIONS),
  choice("alertOut", "Ausblenden", ALERTS, "plopp", MOTIONS),
  flag("alertTimer", "Restzeit als Balken", ALERTS, true),
  flag("confetti", "Konfetti aus Pfoten und Blättern", ALERTS, true),
  number("confettiCount", "Anzahl Konfetti", ALERTS, 14, 0, 40),
  flag("alertSound", "Töne", ALERTS, true),
  ...alertSoundFields(ALERTS),

  choice("bearChat", "Bär", CHAT, "panda", BEAR_IDS),
  choice("chatStyle", "Stil", CHAT, "handy", ["handy", "zettel", "blasen"]),
  ...badgeFields(CHAT),
  flag("chatBadges", "Badges zeigen", CHAT, true),
  number("chatFontSize", "Schriftgrösse", CHAT, 20, 8, 60, "px"),
  number("emoteSize", "Emote-Grösse", CHAT, 28, 8, 120, "px"),
  number("chatFade", "Ausblenden nach (0 = nie)", CHAT, 30, 0, 3600, "s"),
  number("chatMax", "Max. Nachrichten", CHAT, 8, 1, 100),
  choice("chatAlign", "Neue Nachrichten", CHAT, "bottom", ["bottom", "top"]),
  number("chatGap", "Abstand", CHAT, 10, 0, 40, "px"),
  number("chatBearSize", "Bär: Grösse (Höhe)", CHAT, 240, 60, 800, "px"),
  number("chatPhoneWidth", "Handy: Breite", CHAT, 440, 200, 1200, "px"),

  choice("bearCam", "Bär", CAM, "grizzly", BEAR_CHOICES),
  choice("camStyle", "Rahmen", CAM, "papier", ["papier", "holz", "polaroid"]),
  choice("camBearSpot", "Bär: Platz", CAM, "rechts", ["links", "rechts", "oben"]),
  number("camBearSize", "Bär: Grösse (Höhe)", CAM, 260, 60, 800, "px"),
  number("camFrameWidth", "Rahmenbreite", CAM, 18, 2, 60, "px"),
  number("camRadius", "Eckenradius", CAM, 22, 0, 80, "px"),
  text("camLabel", "Namensschild ({channel})", CAM, "{channel}"),
  flag("camLive", "Live-Anzeige", CAM, true),
  text("camLiveText", "Live-Text", CAM, "LIVE"),

  choice("bearMusic", "Bär", MUSIC, "panda", BEAR_CHOICES),
  choice("musicStyle", "Stil", MUSIC, "kopfhoerer", ["kopfhoerer", "kofferradio", "schlicht"]),
  text("musicHeadPlaying", "Kopfzeile bei Wiedergabe", MUSIC, "Läuft gerade"),
  text("musicHeadPaused", "Kopfzeile bei Pause", MUSIC, "Pause"),
  text("musicIdleTitle", "Titel ohne Wiedergabe", MUSIC, "Keine Musik"),
  text("musicIdleArtist", "Interpret ohne Wiedergabe", MUSIC, "Nur Vogelgezwitscher"),
  flag("musicAlbum", "Album zeigen", MUSIC, false),
  flag("musicProgress", "Fortschritt zeigen", MUSIC, true),
  flag("equalizer", "Equalizer", MUSIC, true),
  number("equalizerBars", "Equalizer: Balken", MUSIC, 7, 1, 16),
  choice("coverShape", "Cover-Form", MUSIC, "eckig", ["rund", "eckig"]),
  number("coverSize", "Cover-Grösse", MUSIC, 120, 40, 400, "px"),
  number("musicTitleSize", "Titelgrösse", MUSIC, 26, 10, 80, "px"),
  flag("musicHide", "Bei Pause ausblenden", MUSIC, true),
  flag("musicMarquee", "Lange Titel laufen durch", MUSIC, true),
  number("musicMarqueeSpeed", "Lange Titel: Lauftempo (px pro Sekunde)", MUSIC, 40, 5, 400),
  number("musicBearSize", "Bär: Grösse (Höhe)", MUSIC, 220, 60, 800, "px"),
  number("bopStrength", "Bär: Wippen im Takt (Grad)", MUSIC, 4, 0, 20),

  choice("bearFx", "Bär", FX, "grizzly", BEAR_IDS),
  choice("fxStyle", "Text", FX, "schild", ["schild", "blase"]),
  number("fxBearSize", "Bär: Grösse (Höhe)", FX, 240, 60, 800, "px"),
  number("fxDuration", "Standarddauer", FX, 4, 0.5, 120, "s", 0.5),
  number("fxSize", "Standardgrösse", FX, 360, 20, 1920, "px"),
  number("fxTextSize", "Textgrösse", FX, 40, 8, 300, "px"),
  number("fxMargin", "Zufallsposition: Abstand zum Rand", FX, 20, 0, 50, "%"),
  number("fxMax", "Max. gleichzeitig", FX, 8, 1, 30),
  choice("fxIn", "Einblenden", FX, "plopp", MOTIONS),
  choice("fxOut", "Ausblenden", FX, "blenden", MOTIONS),

  choice("stingerBear", "Bär", STINGER, "grizzly", BEAR_CHOICES),
  number("stingerDuration", "Länge", STINGER, 1.6, 0.5, 5, "s", 0.05),
  number("stingerCut", "Übergangspunkt", STINGER, 0.8, 0.1, 5, "s", 0.05),
  text("stingerText", "Text ({channel})", STINGER, "{channel}"),
  number("stingerWaddle", "Watscheln (Grad)", STINGER, 6, 0, 20),
  color("stingerCurtain", "Vorhang: Stoff", STINGER, "#c8553d"),
  color("stingerCurtainShade", "Vorhang: Falten", STINGER, "#a8432f"),
  flag("stingerCurtainPattern", "Vorhang: Pfotenabdrücke", STINGER, true),
  number("stingerFolds", "Vorhang: Falten (Anzahl)", STINGER, 7, 1, 20),
  choice("stingerFrom", "Bär kommt von", STINGER, "links", ["links", "rechts"]),
  choice("stingerOpen", "Öffnen: zurückziehen oder hochziehen", STINGER, "ziehen", ["ziehen", "heben"]),

  choice("bannerProfileBear", "Bär", PROFILE_BANNER, "turm", BEAR_CHOICES),
  choice("bannerOfflineBear", "Bär", OFFLINE_BANNER, "grizzly", BEAR_CHOICES),
  text("bannerTitle", "Titel ({channel})", PROFILE_BANNER, "{channel}"),
  text("bannerOfflineName", "Kanalzeile ({channel})", OFFLINE_BANNER, "{channel}"),
  text("bannerProfileText", "Text", PROFILE_BANNER, "Gemütliche Streams mit der Bande"),
  text("bannerOfflineTitle", "Titel", OFFLINE_BANNER, "Gerade nicht live"),
  text("bannerOfflineText", "Text", OFFLINE_BANNER, "Die Bande macht ein Nickerchen in der Höhle."),
  lines("bannerOfflineLines", "Zeilen", OFFLINE_BANNER, ["Bald wieder live", "Folgen nicht vergessen"]),
  flag("fairyLights", "Lichterkette", OFFLINE_BANNER, true),
  text("bannerSleepText", "Schlafzeichen", OFFLINE_BANNER, "z", 4),

  ...MINIME_BASE_FIELDS,
  number("minimeBearSize", "Grösse (Höhe)", MINIME_LOOK, 120, 40, 400, "px"),
  number("minimeGround", "Abstand zum unteren Rand", MINIME_LOOK, 16, 0, 300, "px"),
  number("minimeShadow", "Schatten (Stärke)", MINIME_LOOK, 0.3, 0, 1, undefined, 0.05),
  choice("minimeDefault", "Bär ohne Wahl (alle aus)", MINIME_LOOK, "grizzly", BEAR_IDS),
  flag("minimeNames", "Namen zeigen", MINIME_LOOK, true),
  number("minimeNameSize", "Name: Schriftgrösse", MINIME_LOOK, 15, 8, 48, "px"),
  number("waddleAngle", "Watscheln: Kippen (Grad)", MINIME_LOOK, 6, 0, 20),
  number("waddleMs", "Watscheln: Dauer eines Schritts", MINIME_LOOK, 600, 200, 3000, "ms"),
  choice("minimeEnter", "Erscheinen", MINIME_LOOK, "watscheln", ["watscheln", "plopp"]),
  choice("minimeExit", "Verschwinden", MINIME_LOOK, "watscheln", ["watscheln", "plopp"]),
  number("selfieWeight", "Selfie: Häufigkeit", MINIME_MOVES, 8, 0, 100),
  number("selfieMs", "Selfie: Dauer", MINIME_MOVES, 2400, 300, 10000, "ms"),
  number("snackWeight", "Snack: Häufigkeit", MINIME_MOVES, 8, 0, 100),
  number("snackMs", "Snack: Dauer", MINIME_MOVES, 3000, 300, 10000, "ms"),
  number("waveWeight", "Winken: Häufigkeit", MINIME_MOVES, 10, 0, 100),
  number("waveMs", "Winken: Dauer", MINIME_MOVES, 1600, 300, 10000, "ms"),
  number("danceWeight", "Tanzen: Häufigkeit", MINIME_MOVES, 6, 0, 100),
  number("danceMs", "Tanzen: Dauer", MINIME_MOVES, 2600, 300, 10000, "ms"),
  number("lookWeight", "Umschauen: Häufigkeit", MINIME_MOVES, 10, 0, 100),
  number("lookMs", "Umschauen: Dauer", MINIME_MOVES, 2200, 300, 10000, "ms"),
  number("sleepWeight", "Schlafen: Häufigkeit", MINIME_MOVES, 4, 0, 100),
  number("sleepMs", "Schlafen: Dauer", MINIME_MOVES, 7000, 1000, 60000, "ms"),
  text("sleepText", "Schlafen: aufsteigendes Zeichen", MINIME_MOVES, "z", 4),
  number("waveReactMs", "Reaktion auf Chat (Winken): Dauer", MINIME_MOVES, 1200, 200, 5000, "ms"),
  // Towers of the minimes (core): on, Eisbär at the bottom, Panda in the middle, Grizzly on top; every level stands on the
  // back below (from the model), stackFit corrects each level by hand
  ...minimeStackFields(BEAR_SET, { minimeStack: true, minimeStackLevel1: "eisbaer", minimeStackLevel2: "panda", minimeStackLevel3: "grizzly" }),
  number("stackFit", "Turm: Feinkorrektur je Stufe", MINIME_LOOK, 0, -60, 60, "px"),
  number("stackSway", "Turm: Wanken (Grad)", MINIME_LOOK, 2, 0, 10),
  number("stackSwayMs", "Turm: Wanken (Dauer)", MINIME_LOOK, 2400, 500, 10000, "ms"),
  number("stackNameOffset", "Turm: Namen seitlich versetzt", MINIME_LOOK, 40, 0, 300, "px"),
  number("minimeOutlineWidth", "Kontur: Stärke", MINIME_LOOK, 4.5, 0, 20, undefined, 0.5),

  // Commands page (public, /s/<login>/): shared texts from the core, plus the look
  ...INFO_FIELDS,
  choice("bearInfo", "Befehlsseite: Bär", INFO_GROUP, "grizzly", BEAR_CHOICES),
  choice("timeInfo", "Befehlsseite: Tageszeit", INFO_GROUP, "mittag", TIMES),
] as const satisfies readonly SettingField[];

// The resolved values as the server generates them (src/generated/themes, npm run gen:types)
export type { BearsValues } from "../../generated/themes/bears.ts";

const SCREEN_SCENES = ["starting", "brb", "ending"] as const;
const GROUP_SCENES = {
  [WORLD]: [...SCREEN_SCENES, "info"],
  [SCREENS]: SCREEN_SCENES,
  [MOTION]: SCREEN_SCENES,
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
  [MINIME_STACK]: ["minimes"],
  [MINIME_LOOK]: ["minimes"],
  [MINIME_MOVES]: ["minimes"],
  [INFO_GROUP]: ["info"],
} as const;

const capital = (login: string) => login[0].toUpperCase() + login.slice(1);
// On first login: channel name from the Twitch login (first letter upper case)
const personalize = (login: string) => ({ channelName: capital(login) });

// Simple view of the dashboard: per area the texts, main colors, figures and switches most streamers change
const BASIC = [
  "channelName", "font", "titleFont", "accent", "accent2", "textColor", "paper", "showCity", "showBridge", "showCave",
  "flowers", "timeStarting", "bearStarting", "startingEyebrow", "startingTitle", "ticker", "timeBrb", "bearBrb", "brbTitle", "brbNote",
  "timeEnding", "bearEnding", "endingTitle", "endingNext", "bearAlerts", "followLine", "subLine", "resubLine", "giftLine", "raidLine",
  "cheerLine", "redeemLine", "hypeBeginLine", "bearChat", "chatStyle", "chatBadges", "bearCam", "camStyle", "camLabel", "camLive",
  "bearMusic", "musicStyle", "musicHide", "bearFx", "fxStyle", "minimeDefault", "minimeNames", "bearInfo", "timeInfo",
];

export const bearsSettings: ThemeSchema = {
  id: "bears",
  name: "Bärenbande",
  fields: markBasic(withStingerFields([...FIELDS, ...minimeVariantFields(BEAR_SET)], STINGER), BASIC),
  groupScenes: GROUP_SCENES,
  personalize,
  minimeVariants: BEAR_SET,
};
