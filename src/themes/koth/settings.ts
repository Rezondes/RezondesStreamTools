// Settings schema of the King of the Hill theme: military look after the KOTH mode of Arma 3, Arma Reforger and Wardogs,
// a hill with radio mast and flag in the middle, three factions fight for it; all scenes, stinger and banners, plus
// soldiers as minimes in roles and factions that stand on fixed places and fight. The only place of the theme with fixed
// colors, texts and numbers. KothValues is the type of the resolved values (useKoth).
import { markBasic, choice, color, flag, font, inScene, lines, number, text, withDefaults } from "../../core/fields.ts";
import {
  MINIME_BASE_FIELDS, MINIME_COMBAT, MINIME_COMMANDS, MINIME_MOTION, MINIME_RULES, MINIME_TEAMS, MINIME_VARIANTS, minimeAimKey, minimeCombatFields,
  minimeFireKey, minimeTeamFields, minimeVariantFields,
} from "../../core/minimeFields.ts";
import { qualityField } from "../../core/graphicsFields.ts";
import { INFO_FIELDS, INFO_GROUP } from "../../core/infoFields.ts";
import { alertSoundFields } from "../../core/alerts/alerts.ts";
import { badgeFields } from "../../core/chat/chat.ts";
import { withStingerFields } from "../../core/stingerOptions.ts";
import type { MinimeVariantSet, SettingField, ThemeSchema } from "../../core/theme.ts";
import { ICON_NAMES } from "./hill.ts";
import { ROLE_IDS, ROLE_SET } from "./soldiers3d.ts";

export const FONTS = ["Inter", "Share Tech Mono", "IBM Plex Mono", "DM Sans"] as const;
const TITLE_FONTS = ["Black Ops One", "Stardos Stencil", "Share Tech Mono", "Inter"] as const;
const TIMES = ["morgen", "mittag", "abend", "nacht"] as const;
const LOCALES = ["de-DE", "de-CH", "de-AT", "en-US", "en-GB", "fr-FR", "es-ES", "nl-NL"] as const;
const MOTIONS = ["funk", "plopp", "gleiten", "blenden", "keins"] as const;

const GENERAL = "Allgemein";
const HILL = "Hügel";
const SCREENS = "Starting, BRB, Ending";
const ALERTS = "Alerts";
const CHAT = "Chat";
const CAM = "Kamera-Rahmen";
const MUSIC = "Musik";
const FX = "Effekte";
const STINGER = "Stinger";
const PROFILE_BANNER = "Profilbanner";
const OFFLINE_BANNER = "Offline-Banner";
const WORLD = "Welt";
const CAMP = "Lager";
const CAMERA = "Kamera";
const NIGHT = "BRB: Nacht";
const DUSK = "Ending: Abend";
const MINIME_LOOK = "Minimes: Aussehen";
const MINIME_MOVES = "Minimes: Animationen";

// The three factions with their default colors, chosen with !team (or together with the role in !join)
export const TEAM_SET: MinimeVariantSet = {
  command: "!team",
  label: "Fraktion",
  variants: [
    { id: "blufor", label: "BLUFOR", names: ["blau", "blue", "blufor", "nato"], color: "#2f6fd6" },
    { id: "opfor", label: "OPFOR", names: ["rot", "red", "opfor"], color: "#d63a2f" },
    { id: "indfor", label: "INDFOR", names: ["gruen", "green", "indfor", "independent"], color: "#3a9a3a" },
  ],
};

const TEAM_IDS = TEAM_SET.variants.map(variant => variant.id);

// Soldiers stand on fixed places at the hill and do not wander off (core fields with own defaults)
const MINIME_FIELDS = withDefaults(MINIME_BASE_FIELDS, { minimePlacement: "slots", minimeWalkWeight: 0 });

const FIELDS = [
  text("channelName", "Kanal-Name", GENERAL, "KOTH", 40),
  font("font", "Schrift", GENERAL, "Inter", FONTS),
  font("titleFont", "Titelschrift", GENERAL, "Black Ops One", TITLE_FONTS),
  number("fontSize", "Schriftgrösse", GENERAL, 22, 10, 60, "px"),
  color("textColor", "Textfarbe", GENERAL, "#f2f0e6"),
  color("olive", "Oliv", GENERAL, "#4b5320"),
  color("oliveDark", "Oliv dunkel", GENERAL, "#2f3416"),
  color("sand", "Sand", GENERAL, "#c2b280"),
  color("sandDark", "Sand dunkel", GENERAL, "#8f7f55"),
  color("steel", "Stahl (Geräte, Rahmen)", GENERAL, "#3c4146"),
  color("paper", "Papier (Karten, Berichte)", GENERAL, "#e9e4d0"),
  color("ink", "Schrift auf Papier", GENERAL, "#23251c"),
  color("accent", "Akzent (Signal-Orange)", GENERAL, "#ff8a1f"),
  color("accent2", "Akzent 2 (Funk-Grün)", GENERAL, "#7cff6b"),
  number("shadowStrength", "Schatten (Stärke)", GENERAL, 0.4, 0, 1, undefined, 0.05),
  number("radius", "Eckenradius", GENERAL, 6, 0, 60, "px"),
  number("fadeDuration", "Ein- und Ausblenden", GENERAL, 400, 0, 3000, "ms"),
  choice("locale", "Uhrzeit-Format", GENERAL, "de-DE", LOCALES),

  color("skyMorningTop", "Himmel Morgen oben", HILL, "#c9a77c"),
  color("skyMorningBottom", "Himmel Morgen unten", HILL, "#f0dcb4"),
  color("skyDayTop", "Himmel Mittag oben", HILL, "#6f9fc8"),
  color("skyDayBottom", "Himmel Mittag unten", HILL, "#d6e6ef"),
  color("skyEveningTop", "Himmel Abend oben", HILL, "#8a4b3a"),
  color("skyEveningBottom", "Himmel Abend unten", HILL, "#e0a060"),
  color("skyNightTop", "Himmel Nacht oben", HILL, "#0d1420"),
  color("skyNightBottom", "Himmel Nacht unten", HILL, "#2a3440"),
  color("sun", "Sonne", HILL, "#ffe08a"),
  color("moon", "Mond", HILL, "#e8e6d0"),
  flag("mountains", "Berge im Hintergrund", HILL, true),
  color("mountainColor", "Berge", HILL, "#6b7280"),
  color("hillColor", "Hügel", HILL, "#6b7a3a"),
  color("hillDark", "Hügel im Schatten", HILL, "#4a5628"),
  flag("tower", "Funkmast", HILL, true),
  color("towerBlink", "Funkmast: Blinklicht", HILL, "#ff3b30"),
  color("flagColor", "Flagge auf dem Hügel", HILL, "#c2b280"),
  flag("sandbags", "Sandsäcke", HILL, true),
  flag("smoke", "Rauch am Horizont", HILL, true),
  number("smokeSpeed", "Rauch: Dauer eines Aufsteigens", HILL, 12, 2, 60, "s"),
  flag("dust", "Staub in der Luft", HILL, true),

  // 3D world (PLAN-KOTH.md package 2); colors of hill, mountains and beacon and the switches of tower, sandbags, smoke and
  // dust come from the group Hügel
  qualityField(WORLD),
  number("worldSeed", "Startwert der Welt", WORLD, 301, 1, 9999),
  color("skyTop", "Himmel oben", WORLD, "#5d4a3a"),
  color("skyHorizon", "Himmel am Horizont", WORLD, "#f3dcb0"),
  number("fogNear", "Nebel ab (m)", WORLD, 50, 5, 400),
  number("fogFar", "Nebel dicht ab (m)", WORLD, 210, 10, 600),
  color("sunColor", "Sonnenlicht", WORLD, "#ffd29a"),
  number("bloomStrength", "Leuchten (Bloom)", WORLD, 0.55, 0, 2, undefined, 0.05),
  flag("shadows", "Schatten", WORLD, true),
  number("hillHeight", "Hügelhöhe (m)", WORLD, 7.2, 2, 14, undefined, 0.1),
  color("sandColor", "Sand am Fuss", WORLD, "#b9a06a"),
  number("mastHeight", "Funkmast: Höhe (m)", CAMP, 9.5, 4, 20, undefined, 0.1),
  flag("mastWires", "Funkmast: Abspannseile", CAMP, true),
  flag("mastDish", "Funkmast: Schüssel und Plattform", CAMP, true),
  number("beaconEvery", "Funkmast: Blinken alle", CAMP, 1.4, 0.3, 10, "s", 0.1),
  choice("flagFaction", "Flagge: Fraktion", CAMP, "blufor", TEAM_IDS),
  number("flagSize", "Flagge: Länge (m)", CAMP, 2.8, 1, 6, undefined, 0.1),
  number("flagWind", "Flagge: Wind", CAMP, 1, 0, 3, undefined, 0.1),
  flag("bunkerOn", "Bunker", CAMP, true),
  number("tents", "Zelte", CAMP, 2, 0, 6),
  number("crateStacks", "Kistenstapel", CAMP, 3, 0, 8),
  color("campBagColor", "Lager: Sandsäcke", CAMP, "#c2b280"),
  color("campBunkerColor", "Lager: Bunker", CAMP, "#8f7f55"),
  color("campTentColor", "Lager: Zelte", CAMP, "#4b5320"),
  color("campCrateColor", "Lager: Kisten", CAMP, "#4b5320"),
  color("campCrateLidColor", "Lager: Kistendeckel", CAMP, "#6b7a3a"),
  color("campJeepColor", "Lager: Jeep", CAMP, "#4b5320"),
  color("campJeepCabColor", "Lager: Jeep-Kabine", CAMP, "#2f3416"),
  flag("fenceOn", "Stacheldrahtzaun", CAMP, true),
  // fixed: at most 200 pines and rocks, more costs too much on weak PCs
  number("trees", "Kiefern", CAMP, 46, 0, 200),
  number("rocks", "Felsen", CAMP, 30, 0, 200),
  flag("jeepOn", "Jeep", CAMP, true),
  flag("helicopterOn", "Hubschrauber", CAMP, true),
  flag("markerFlagsOn", "Fähnchen der anderen Fraktionen", CAMP, true),
  number("smokeColumns", "Rauchsäulen", CAMP, 3, 0, 6),
  number("smokeAmount", "Rauch: Wolken je Säule", CAMP, 22, 4, 60),
  // fixed: at most 2000 grains of dust
  number("dustAmount", "Staub im Licht (Körner)", CAMP, 300, 0, 2000),
  flag("cameraIntro", "Kamerafahrt am Anfang", CAMERA, true),
  number("cameraRadius", "Abstand (m)", CAMERA, 40, 10, 120),
  number("cameraHeight", "Höhe (m)", CAMERA, 12, 2, 60),
  number("cameraSpeed", "Kreisen: Tempo", CAMERA, 0.045, 0, 0.5, undefined, 0.005),
  number("buildSpeed", "Aufbau: Tempo", CAMERA, 1, 0.25, 4, undefined, 0.05),
  // BRB at night and Ending with flares and report (PLAN-KOTH.md package 3); moon and searchlight light from the colors
  // moon and sun of the group Hügel
  color("brbSkyTop", "Himmel oben", NIGHT, "#0b1020"),
  color("brbSkyHorizon", "Himmel am Horizont", NIGHT, "#2a3150"),
  flag("moonOn", "Mond", NIGHT, true),
  flag("searchlightOn", "Suchscheinwerfer", NIGHT, true),
  number("searchlightSpeed", "Suchscheinwerfer: Tempo", NIGHT, 1, 0, 4, undefined, 0.1),
  number("searchlightFrom", "Suchscheinwerfer: Winkel von (Grad)", NIGHT, -50, -90, 90),
  number("searchlightTo", "Suchscheinwerfer: Winkel bis (Grad)", NIGHT, 40, -90, 90),
  flag("campfireOn", "Lagerfeuer", NIGHT, true),
  number("brbCameraHeight", "Kamera: Höhe (m)", NIGHT, 9, 2, 60),
  color("endingSkyTop", "Himmel oben", DUSK, "#3a2a4a"),
  color("endingSkyHorizon", "Himmel am Horizont", DUSK, "#e9a46a"),
  flag("flaresOn", "Leuchtraketen", DUSK, true),
  number("flaresEvery", "Leuchtraketen: alle", DUSK, 2.2, 0.5, 10, "s", 0.1),
  // fixed: at most 400 sparks per flare
  number("flareSparks", "Leuchtraketen: Funken", DUSK, 80, 10, 400),
  flag("flareSound", "Leuchtraketen: Zischen", DUSK, false),
  flag("reportOn", "Einsatzbericht", DUSK, true),
  text("reportTitle", "Einsatzbericht: Titel", DUSK, "EINSATZBERICHT"),
  lines("reportLines", "Einsatzbericht: Zeilen (Wert|Text)", DUSK, ["follows|Neue Rekruten", "subs|Verstärkung", "raids|Verbündete Trupps", "bits|Munition", "chatMessages|Funksprüche"], 8),
  number("countUpMs", "Einsatzbericht: Hochzählen", DUSK, 1000, 0, 10000, "ms"),
  text("stampText", "Stempel (leer = aus)", DUSK, "AUFTRAG ERFÜLLT"),
  number("stampAt", "Stempel nach", DUSK, 6, 0, 60, "s", 0.5),

  inScene("starting", text("startingEyebrow", "Starting: Überzeile", SCREENS, "Einsatzbesprechung")),
  inScene("starting", text("startingTitle", "Starting: Titel", SCREENS, "Stream startet gleich")),
  inScene("brb", text("brbEyebrow", "BRB: Überzeile", SCREENS, "Funkstille")),
  inScene("brb", text("brbTitle", "BRB: Titel", SCREENS, "Bin gleich zurück")),
  inScene("ending", text("endingEyebrow", "Ending: Überzeile", SCREENS, "Einsatzbericht")),
  inScene("ending", text("endingTitle", "Ending: Titel", SCREENS, "Stream beendet")),
  flag("mapGrid", "Lagekarte mit Raster", SCREENS, true),
  number("titleSize", "Titelgrösse", SCREENS, 104, 30, 240, "px"),
  inScene("starting", number("countdown", "Countdown-Standard", SCREENS, 300, 0, 86400, "s")),
  inScene("starting", text("countdownPrefix", "Countdown-Präfix", SCREENS, "T-")),
  inScene("starting", text("countdownDone", "Text nach dem Countdown", SCREENS, "Einsatz läuft!")),
  inScene("starting", choice("progressStyle", "Fortschritt", SCREENS, "balken", ["balken", "funk", "aus"])),
  inScene("brb", text("afkPrefix", "BRB-Zähler-Präfix", SCREENS, "Funkstille seit ")),
  inScene("ending", text("endingNextLabel", "Nächster Stream (Beschriftung)", SCREENS, "Nächster Einsatz")),
  inScene("ending", text("endingNext", "Nächster Stream (leer = ausblenden)", SCREENS, "")),
  inScene("starting", lines("startingLines", "Sprüche Starting", SCREENS, ["Funkgeräte werden geprüft ...", "Munition wird verteilt ...", "Fahrzeuge werden betankt ...", "Lagekarte wird aktualisiert ..."])),
  inScene("brb", lines("brbLines", "Sprüche BRB", SCREENS, ["Position halten ...", "Kaffee aus der Feldküche ...", "Funkkanal bleibt offen ..."])),
  inScene("ending", lines("endingLines", "Sprüche Ending", SCREENS, ["Hügel gesichert ...", "Rückzug zur Basis ...", "Bis zum nächsten Einsatz!"])),
  number("linesEvery", "Sprüche wechseln alle", SCREENS, 6, 2, 120, "s"),
  text("ticker", "Ticker-Text (leer = aus)", SCREENS, "", 300),
  number("tickerSpeed", "Ticker: Zeit pro Durchlauf", SCREENS, 30, 5, 300, "s"),
  inScene("starting", flag("briefingMapOn", "Starting: Lagekarte", SCREENS, true)),
  inScene("starting", text("briefingLabel", "Starting: Lagekarte Beschriftung", SCREENS, "LAGEKARTE  M 1:25 000")),
  inScene("starting", text("briefingTarget", "Starting: Lagekarte Ziel", SCREENS, "ZIEL: HÜGEL 301")),
  inScene("starting", flag("radioLinesOn", "Starting: Funkzeilen", SCREENS, true)),
  inScene("starting", number("radioStaticMs", "Starting: Rauschen zwischen Funkzeilen", SCREENS, 350, 0, 3000, "ms")),

  choice("alertStyle", "Stil", ALERTS, "marke", ["marke", "funk", "akte"]),
  // Dog tag with radio (PLAN-KOTH.md package 4): stamped lines take the placeholders of the alert texts
  flag("dogtagOn", "Hundemarke", ALERTS, true),
  lines("dogtagLines", "Hundemarke: Prägung ({channel}, {user}, {amount})", ALERTS, ["{channel}", "{user}", "{amount}", "O POS"], 6),
  color("dogtagMetal", "Hundemarke: Metall", ALERTS, "#d9dde1"),
  number("dogtagSwing", "Hundemarke: Pendeln", ALERTS, 1, 0, 3, undefined, 0.1),
  flag("alertSmokeOn", "Rauchstoss", ALERTS, true),
  text("radioChannel", "Funkgerät: Kanal", ALERTS, "KANAL 7  //  41.250 MHZ"),
  number("alertStaticMs", "Funkgerät: Rauschen", ALERTS, 500, 0, 3000, "ms"),
  number("alertOpenMs", "Funkgerät: Aufklappen", ALERTS, 450, 0, 3000, "ms"),
  number("alertCloseMs", "Funkgerät: Zuklappen", ALERTS, 350, 0, 3000, "ms"),
  text("alertCallsign", "Rufzeichen ({channel})", ALERTS, "{channel} an alle"),
  text("followTag", "Follow: Kopfzeile", ALERTS, "Neuer Rekrut"),
  text("followLine", "Follow: Zeile", ALERTS, "{user} meldet sich zum Dienst!"),
  choice("followIcon", "Follow: Symbol", ALERTS, "helm", ICON_NAMES),
  text("subTag", "Sub: Kopfzeile", ALERTS, "Verstärkung"),
  text("subLine", "Sub: Zeile", ALERTS, "{user} verstärkt die Truppe!"),
  choice("subIcon", "Sub: Symbol", ALERTS, "abzeichen", ICON_NAMES),
  text("resubTag", "Resub: Kopfzeile", ALERTS, "Dienstzeit x{amount}"),
  text("resubLine", "Resub: Zeile", ALERTS, "{user} dient seit {amount} Monaten!"),
  choice("resubIcon", "Resub: Symbol", ALERTS, "stern", ICON_NAMES),
  text("giftTag", "Gift: Kopfzeile", ALERTS, "Nachschub"),
  text("giftLine", "Gift: Zeile", ALERTS, "{user} verteilt {amount} Abos!"),
  choice("giftIcon", "Gift: Symbol", ALERTS, "kiste", ICON_NAMES),
  text("raidTag", "Raid: Kopfzeile", ALERTS, "Luftlandung"),
  text("raidLine", "Raid: Zeile", ALERTS, "{user} landet mit {amount} Soldaten!"),
  choice("raidIcon", "Raid: Symbol", ALERTS, "fallschirm", ICON_NAMES),
  text("cheerTag", "Bits: Kopfzeile", ALERTS, "{amount} Bits"),
  text("cheerLine", "Bits: Zeile", ALERTS, "{user} wirft {amount} Bits ab!"),
  choice("cheerIcon", "Bits: Symbol", ALERTS, "granate", ICON_NAMES),
  text("redeemTag", "Kanalpunkte: Kopfzeile", ALERTS, "Kanalpunkte"),
  text("redeemLine", "Kanalpunkte: Zeile", ALERTS, "{user} löst {detail} ein."),
  choice("redeemIcon", "Kanalpunkte: Symbol", ALERTS, "funk", ICON_NAMES),
  text("hypeTag", "Hype Train: Kopfzeile", ALERTS, "Hype Train"),
  text("hypeBeginLine", "Hype Train: Start", ALERTS, "Der Hype Train rollt an die Front!"),
  text("hypeEndLine", "Hype Train: Ende", ALERTS, "Hype Train Level {amount} erreicht!"),
  choice("hypeIcon", "Hype Train: Symbol", ALERTS, "flagge", ICON_NAMES),
  flag("alertQuote", "Nachricht zeigen", ALERTS, true),
  text("quoteFormat", "Nachricht ({text})", ALERTS, "\"{text}\""),
  number("alertDuration", "Dauer", ALERTS, 7000, 2000, 60000, "ms"),
  number("alertScale", "Grösse", ALERTS, 1, 0.3, 2, undefined, 0.05),
  number("alertTop", "Abstand oben", ALERTS, 80, 0, 1000, "px"),
  choice("alertAlign", "Position", ALERTS, "center", ["left", "center", "right"]),
  number("alertWidth", "Breite", ALERTS, 760, 300, 1800, "px"),
  choice("alertIn", "Einblenden", ALERTS, "funk", MOTIONS),
  choice("alertOut", "Ausblenden", ALERTS, "funk", MOTIONS),
  flag("alertTimer", "Restzeit als Balken", ALERTS, true),
  flag("alertStatic", "Funkrauschen beim Einblenden", ALERTS, true),
  flag("alertSound", "Töne", ALERTS, true),
  ...alertSoundFields(ALERTS),

  choice("chatStyle", "Stil", CHAT, "funk", ["funk", "papier", "schlicht"]),
  ...badgeFields(CHAT),
  flag("chatBadges", "Badges zeigen", CHAT, true),
  flag("chatTime", "Zeitstempel", CHAT, true),
  number("chatFontSize", "Schriftgrösse", CHAT, 20, 8, 60, "px"),
  number("emoteSize", "Emote-Grösse", CHAT, 28, 8, 120, "px"),
  number("chatFade", "Ausblenden nach (0 = nie)", CHAT, 30, 0, 3600, "s"),
  number("chatMax", "Max. Nachrichten", CHAT, 12, 1, 100),
  choice("chatAlign", "Neue Nachrichten", CHAT, "bottom", ["bottom", "top"]),
  number("chatOpacity", "Deckkraft", CHAT, 0.9, 0, 1, undefined, 0.01),
  number("chatGap", "Abstand", CHAT, 6, 0, 40, "px"),

  choice("camStyle", "Rahmen", CAM, "helm", ["helm", "visier", "schlicht"]),
  number("camFrameWidth", "Rahmenbreite", CAM, 12, 2, 60, "px"),
  number("camRadius", "Eckenradius", CAM, 8, 0, 80, "px"),
  flag("camMarks", "Markierungen in den Ecken", CAM, true),
  flag("camCross", "Fadenkreuz in der Mitte", CAM, false),
  flag("camBattery", "Akku-Anzeige", CAM, true),
  text("camLabel", "Namensschild ({channel})", CAM, "{channel}"),
  flag("camLive", "Live-Anzeige", CAM, true),
  text("camLiveText", "Live-Text", CAM, "REC"),

  choice("musicStyle", "Stil", MUSIC, "funkgeraet", ["funkgeraet", "kiste", "schlicht"]),
  text("musicHeadPlaying", "Kopfzeile bei Wiedergabe", MUSIC, "Feldfunk"),
  text("musicHeadPaused", "Kopfzeile bei Pause", MUSIC, "Funkstille"),
  text("musicIdleTitle", "Titel ohne Wiedergabe", MUSIC, "Keine Musik"),
  text("musicIdleArtist", "Interpret ohne Wiedergabe", MUSIC, "Nur Rauschen"),
  flag("musicAlbum", "Album zeigen", MUSIC, false),
  flag("musicProgress", "Fortschritt zeigen", MUSIC, true),
  flag("equalizer", "Signal-Anzeige", MUSIC, true),
  number("equalizerBars", "Signal-Anzeige: Balken", MUSIC, 8, 1, 16),
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
  flag("fxBubble", "Text auf einem Funkzettel", FX, true),

  number("stingerDuration", "Länge", STINGER, 1.6, 0.5, 5, "s", 0.05),
  number("stingerCut", "Übergangspunkt", STINGER, 0.8, 0.1, 5, "s", 0.05),
  text("stingerText", "Text ({channel})", STINGER, "{channel}"),
  flag("stingerFlag", "Flaggenwechsel", STINGER, true),
  color("smokeColor", "Rauch", STINGER, "#9ea3a0"),
  number("stingerPuffs", "Rauchwolken", STINGER, 40, 10, 120),

  text("bannerTitle", "Titel ({channel})", PROFILE_BANNER, "{channel}"),
  text("bannerOfflineName", "Kanalzeile ({channel})", OFFLINE_BANNER, "{channel}"),
  text("bannerProfileText", "Text", PROFILE_BANNER, "Halte den Hügel."),
  text("bannerOfflineTitle", "Titel", OFFLINE_BANNER, "Funkstille"),
  text("bannerOfflineText", "Text", OFFLINE_BANNER, "Folge dem Kanal und verpasse keinen Einsatz."),
  lines("bannerOfflineLines", "Zeilen", OFFLINE_BANNER, ["Bald wieder im Einsatz", "Der Hügel wartet"]),

  ...MINIME_FIELDS,
  number("soldierSize", "Grösse", MINIME_LOOK, 70, 30, 300, "px"),
  number("soldierGround", "Abstand zum unteren Rand", MINIME_LOOK, 20, 0, 300, "px"),
  number("soldierShadow", "Schatten (Stärke)", MINIME_LOOK, 0.35, 0, 1, undefined, 0.05),
  flag("soldierFaces", "Gesichter", MINIME_LOOK, true),
  color("skin", "Haut", MINIME_LOOK, "#e0b48a"),
  color("soldierEye", "Augen", MINIME_LOOK, "#1d1d1d"),
  color("helmet", "Helm", MINIME_LOOK, "#4b5320"),
  color("weapon", "Waffen", MINIME_LOOK, "#2b2d2f"),
  color("weaponMark", "Zielfernrohr und Munition", MINIME_LOOK, "#9fb3c8"),
  color("medicCross", "Medic: Kreuz", MINIME_LOOK, "#e53935"),
  color("muzzle", "Mündungsfeuer", MINIME_LOOK, "#ffd23f"),
  color("dustColor", "Staubwolke bei Treffern", MINIME_LOOK, "#b8a888"),
  color("soldierLight", "Licht auf den Soldaten", MINIME_LOOK, "#fff4e0"),
  choice("soldierDefault", "Rolle ohne Wahl (alle aus)", MINIME_LOOK, "sturm", ROLE_IDS),
  flag("soldierNames", "Namen zeigen", MINIME_LOOK, true),
  choice("soldierNameStyle", "Namen auf", MINIME_LOOK, "band", ["band", "schild"]),
  number("soldierNameSize", "Name: Schriftgrösse", MINIME_LOOK, 14, 8, 48, "px"),
  number("soldierBlinkEvery", "Blinzeln alle (0 = nie)", MINIME_LOOK, 4000, 0, 30000, "ms"),
  choice("soldierEnter", "Erscheinen", MINIME_LOOK, "fallschirm", ["fallschirm", "blenden"]),
  choice("soldierExit", "Verschwinden", MINIME_LOOK, "abzug", ["abzug", "blenden"]),
  flag("holderBanner", "Anzeige: wer den Hügel hält", MINIME_LOOK, true),
  text("holderText", "Anzeige: Hügel gehalten ({team})", MINIME_LOOK, "{team} hält den Hügel"),
  text("contestedText", "Anzeige: Gleichstand", MINIME_LOOK, "Hügel umkämpft"),
  number("sightWeight", "Anvisieren: Häufigkeit", MINIME_MOVES, 12, 0, 100),
  number("sightMs", "Anvisieren: Dauer", MINIME_MOVES, 2000, 300, 10000, "ms"),
  number("reloadWeight", "Nachladen: Häufigkeit", MINIME_MOVES, 10, 0, 100),
  number("reloadMs", "Nachladen: Dauer", MINIME_MOVES, 1400, 300, 10000, "ms"),
  number("coverWeight", "Deckung: Häufigkeit", MINIME_MOVES, 8, 0, 100),
  number("coverMs", "Deckung: Dauer", MINIME_MOVES, 3000, 300, 20000, "ms"),
  number("proneWeight", "Hinlegen: Häufigkeit", MINIME_MOVES, 6, 0, 100),
  number("proneMs", "Hinlegen: Dauer", MINIME_MOVES, 4000, 300, 30000, "ms"),
  number("lookWeight", "Umschauen: Häufigkeit", MINIME_MOVES, 12, 0, 100),
  number("lookMs", "Umschauen: Dauer", MINIME_MOVES, 2400, 300, 10000, "ms"),
  number("saluteWeight", "Salutieren: Häufigkeit", MINIME_MOVES, 4, 0, 100),
  number("saluteMs", "Salutieren: Dauer", MINIME_MOVES, 1600, 300, 10000, "ms"),
  number("cheerMs", "Reaktion auf Chat: Dauer", MINIME_MOVES, 900, 200, 5000, "ms"),
  // Commands page (public, /s/<login>/): shared texts from the core, plus the look
  ...INFO_FIELDS,
  choice("timeInfo", "Befehlsseite: Tageszeit am Hügel", INFO_GROUP, "mittag", TIMES),
] as const satisfies readonly SettingField[];

// The resolved values as the server generates them (src/generated/themes, npm run gen:types)
export type { KothValues } from "../../generated/themes/koth.ts";

// Fights with own durations per role: the sniper aims long and fires once, the MG fires a long burst
const COMBAT_FIELDS = withDefaults(minimeCombatFields(ROLE_SET), {
  [minimeAimKey("sniper")]: 1600,
  [minimeFireKey("sniper")]: 300,
  [minimeFireKey("mg")]: 1400,
  [minimeFireKey("grenadier")]: 900,
});

const SCREEN_SCENES = ["starting", "brb", "ending"] as const;
const GROUP_SCENES = {
  [HILL]: [...SCREEN_SCENES, "info"],
  [SCREENS]: SCREEN_SCENES,
  [ALERTS]: ["alerts"],
  [CHAT]: ["chat"],
  [CAM]: ["cam"],
  [MUSIC]: ["music"],
  [FX]: ["fx"],
  [WORLD]: SCREEN_SCENES,
  [CAMP]: SCREEN_SCENES,
  [CAMERA]: SCREEN_SCENES,
  [NIGHT]: ["brb"],
  [DUSK]: ["ending"],
  [STINGER]: [],
  [PROFILE_BANNER]: [],
  [OFFLINE_BANNER]: [],
  [MINIME_COMMANDS]: ["minimes"],
  [MINIME_RULES]: ["minimes"],
  [MINIME_MOTION]: ["minimes"],
  [MINIME_VARIANTS]: ["minimes"],
  [MINIME_TEAMS]: ["minimes"],
  [MINIME_LOOK]: ["minimes"],
  [MINIME_MOVES]: ["minimes"],
  [MINIME_COMBAT]: ["minimes"],
  [INFO_GROUP]: ["info"],
} as const;

const capital = (login: string) => login[0].toUpperCase() + login.slice(1);
// On first login: channel name from the Twitch login (first letter upper case)
const personalize = (login: string) => ({ channelName: capital(login) });

// Simple view of the dashboard: per area the texts, main colors, figures and switches most streamers change
const BASIC = [
  "channelName", "font", "titleFont", "textColor", "accent", "accent2", "tower", "mountains", "smoke", "flagFaction",
  "startingEyebrow", "startingTitle", "ticker", "brbTitle", "searchlightOn", "endingTitle", "flaresOn", "endingNext", "alertStyle",
  "followLine", "subLine", "resubLine", "giftLine", "raidLine", "cheerLine", "redeemLine", "hypeBeginLine", "chatStyle", "chatBadges",
  "camStyle", "camLabel", "camLive", "musicStyle", "musicHide", "fxIn", "fxOut", "soldierDefault", "soldierNames",
];

export const kothSettings: ThemeSchema = {
  id: "koth",
  name: "King of the Hill",
  fields: markBasic(withStingerFields([...FIELDS, ...minimeVariantFields(ROLE_SET), ...minimeTeamFields(TEAM_SET), ...COMBAT_FIELDS], STINGER), BASIC),
  groupScenes: GROUP_SCENES,
  personalize,
  minimeVariants: ROLE_SET,
  minimeTeams: TEAM_SET,
};
