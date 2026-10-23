// Settings schema of the Urlaub theme: southern tropical coast and sea look (sea, waves, sand, palms,
// wooden signs) for all scenes, stinger and banners, plus beach thing minimes that hop. The only place of the theme with
// fixed colors, texts and numbers. UrlaubValues is the type of the resolved values (useUrlaub).
import { markBasic, choice, color, flag, font, inScene, lines, number, text } from "../../core/fields.ts";
import { MINIME_BASE_FIELDS, MINIME_COMMANDS, MINIME_HOP, MINIME_HOP_FIELDS, MINIME_MOTION, MINIME_RULES, MINIME_VARIANTS, minimeVariantFields } from "../../core/minimeFields.ts";
import { INFO_FIELDS, INFO_GROUP } from "../../core/infoFields.ts";
import { alertSoundFields } from "../../core/alerts/alerts.ts";
import { badgeFields } from "../../core/chat/chat.ts";
import { qualityField } from "../../core/graphicsFields.ts";
import { withStingerFields } from "../../core/stingerOptions.ts";
import type { SettingField, ThemeSchema } from "../../core/theme.ts";
import { ICON_NAMES } from "./beach.ts";
import { BEACH_THINGS, THING_IDS, THING_SET } from "./beachThings.ts";

export const FONTS = ["Fredoka", "Baloo 2", "Nunito", "Inter", "DM Sans"] as const;
const TITLE_FONTS = ["Pacifico", "Fredoka", "Baloo 2", "Nunito"] as const;
const LOCALES = ["de-DE", "de-CH", "de-AT", "en-US", "en-GB", "fr-FR", "es-ES", "nl-NL"] as const;
const MOTIONS = ["welle", "plopp", "gleiten", "blenden", "keins"] as const;

const GENERAL = "Allgemein";
const BEACH = "Kulisse";
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
const THING_COLORS = "Typen: Farben";

const FIELDS = [
  text("channelName", "Kanal-Name", GENERAL, "Strand", 40),
  font("font", "Schrift", GENERAL, "Fredoka", FONTS),
  font("titleFont", "Titelschrift", GENERAL, "Pacifico", TITLE_FONTS),
  number("fontSize", "Schriftgrösse", GENERAL, 22, 10, 60, "px"),
  color("textColor", "Textfarbe", GENERAL, "#ffffff"),
  color("textOnWood", "Text auf Holz", GENERAL, "#3b2412"),
  color("wood", "Holz", GENERAL, "#d39a5c"),
  color("woodDark", "Holz dunkel (Maserung, Rand)", GENERAL, "#8a5527"),
  color("sea", "Meer", GENERAL, "#1fb5c9"),
  color("seaDeep", "Meer tief", GENERAL, "#0b6f8e"),
  color("foam", "Gischt", GENERAL, "#f4fffd"),
  color("sand", "Sand", GENERAL, "#f2d49b"),
  color("palmLeaf", "Palmblätter", GENERAL, "#2e9e4f"),
  color("palmTrunk", "Palmstamm", GENERAL, "#8b5a2b"),
  color("accent", "Akzent (Hibiskus)", GENERAL, "#ff4f8b"),
  color("accent2", "Akzent 2 (Mango)", GENERAL, "#ffa62b"),
  number("shadowStrength", "Schatten (Stärke)", GENERAL, 0.35, 0, 1, undefined, 0.05),
  number("radius", "Eckenradius", GENERAL, 18, 0, 60, "px"),
  number("fadeDuration", "Ein- und Ausblenden", GENERAL, 500, 0, 3000, "ms"),
  choice("locale", "Uhrzeit-Format", GENERAL, "de-DE", LOCALES),

  color("skyMorningBottom", "Himmel Morgen unten", BEACH, "#ffe2b0"),
  color("sun", "Sonne", BEACH, "#ffd23f"),
  number("palmsLeft", "Palmen links", BEACH, 2, 0, 3),
  number("palmsRight", "Palmen rechts", BEACH, 1, 0, 3),
  number("palmSway", "Palmen wiegen (Grad)", BEACH, 3, 0, 20),
  flag("boat", "Segelboot am Horizont", BEACH, true),
  flag("gulls", "Möwen", BEACH, true),
  qualityField(BEACH),
  number("worldSeed", "Startwert der Welt", BEACH, 12, 0, 9999),
  flag("sunriseOn", "Sonnenaufgang im Starting", BEACH, true),
  number("sunriseMs", "Sonnenaufgang (Dauer)", BEACH, 4000, 0, 20000, "ms"),
  number("sunHeight", "Sonnenhöhe (Grad)", BEACH, 4.5, -5, 90, undefined, 0.5),
  number("sunAzimuth", "Sonnenrichtung (Grad)", BEACH, 196, 0, 360),
  number("turbidity", "Dunst am Himmel", BEACH, 6, 1, 20, undefined, 0.5),
  number("exposure", "Belichtung", BEACH, 0.42, 0.1, 2, undefined, 0.02),
  color("waterColor", "Meer in der Tiefe (3D)", BEACH, "#0a4a5e"),
  number("waveDistortion", "Wellen: Verzerrung der Spiegelung", BEACH, 2.6, 0, 10, undefined, 0.1),
  flag("surfOn", "Brandung", BEACH, true),
  number("surfBands", "Brandung: Bänder", BEACH, 3, 1, 6),
  number("surfSeconds", "Brandung: Zeit je Welle", BEACH, 7, 2, 30, "s"),
  number("rocks", "Felsen an der Wasserlinie", BEACH, 9, 0, 30),
  number("gullCount", "Möwen (Anzahl)", BEACH, 5, 1, 40),
  number("cameraHeight", "Kamera: Höhe", BEACH, 3.2, 1, 10, undefined, 0.1),
  flag("cameraDrift", "Kamera schwankt leicht", BEACH, true),
  inScene("brb", number("brbSunHeight", "BRB: Sonnenhöhe (Grad)", BEACH, 55, 0, 90)),
  inScene("brb", number("brbExposure", "BRB: Belichtung (Faktor)", BEACH, 0.8, 0.2, 2, undefined, 0.05)),
  inScene("brb", flag("umbrellaOn", "BRB: Sonnenschirm und Liegestuhl", BEACH, true)),
  inScene("brb", color("umbrellaColor", "BRB: Sonnenschirm", BEACH, "#ff4f8b")),
  inScene("ending", number("sunsetMs", "Ending: Sonnenuntergang (Dauer)", BEACH, 5000, 0, 30000, "ms")),
  inScene("ending", flag("torchesOn", "Ending: Fackeln", BEACH, true)),
  inScene("ending", number("torches", "Ending: Anzahl Fackeln", BEACH, 4, 1, 8)),

  inScene("starting", text("startingEyebrow", "Starting: Überzeile", SCREENS, "Gleich geht's los")),
  inScene("starting", text("startingTitle", "Starting: Titel", SCREENS, "Stream startet gleich")),
  inScene("starting", text("startingNote", "Starting: Untertitel", SCREENS, "Schnapp dir einen Cocktail!")),
  inScene("brb", text("brbEyebrow", "BRB: Überzeile", SCREENS, "Kurze Pause")),
  inScene("brb", text("brbTitle", "BRB: Titel", SCREENS, "Bin gleich zurück")),
  inScene("brb", text("brbNote", "BRB: Untertitel", SCREENS, "Kurz im Meer, gleich wieder da.")),
  inScene("ending", text("endingEyebrow", "Ending: Überzeile", SCREENS, "Danke fürs Zuschauen")),
  inScene("ending", text("endingTitle", "Ending: Titel", SCREENS, "Stream beendet")),
  inScene("ending", text("endingNote", "Ending: Untertitel", SCREENS, "Bis zum nächsten Sonnenuntergang!")),
  flag("woodGrain", "Schild: Holzmaserung", SCREENS, true),
  number("signSwing", "Schild: Pendeln (Grad)", SCREENS, 8, 0, 30),
  number("signWidth", "Schild: Breite", SCREENS, 1100, 400, 1800, "px"),
  number("titleSize", "Titelgrösse", SCREENS, 110, 30, 240, "px"),
  inScene("starting", number("countdown", "Countdown: Dauer", SCREENS, 300, 0, 86400, "s")),
  inScene("starting", text("countdownAt", "Countdown: bis Uhrzeit (z.B. 20:00, leer = Dauer)", SCREENS, "", 5)),
  inScene("starting", text("countdownPrefix", "Countdown-Präfix", SCREENS, "")),
  inScene("starting", text("countdownDone", "Text nach dem Countdown", SCREENS, "Gleich live!")),
  inScene("starting", choice("progressStyle", "Fortschritt", SCREENS, "welle", ["welle", "seil", "aus"])),
  inScene("brb", text("afkPrefix", "BRB-Zähler-Präfix", SCREENS, "Pause seit ")),
  inScene("ending", text("endingNextLabel", "Nächster Stream (Beschriftung)", SCREENS, "Nächster Stream")),
  inScene("ending", text("endingNext", "Nächster Stream (leer = ausblenden)", SCREENS, "")),
  inScene("starting", lines("startingLines", "Sprüche Starting", SCREENS, ["Sonnencreme wird aufgetragen ...", "Liegestuhl wird aufgestellt ...", "Kokosnuss wird geöffnet ...", "Surfbrett wird gewachst ...", "Wellen werden gezählt ..."])),
  inScene("brb", lines("brbLines", "Sprüche BRB", SCREENS, ["Kurz eine Runde schwimmen ...", "Cocktail wird nachgefüllt ...", "Sandburg wird gebaut ...", "Muscheln werden gesammelt ..."])),
  inScene("ending", lines("endingLines", "Sprüche Ending", SCREENS, ["Handtuch wird ausgeschüttelt ...", "Sonnenuntergang wird genossen ...", "Bis zum nächsten Mal am Strand!"])),
  number("linesEvery", "Sprüche wechseln alle", SCREENS, 6, 2, 120, "s"),
  text("ticker", "Ticker-Text (leer = aus)", SCREENS, "", 300),
  choice("tickerStyle", "Ticker", SCREENS, "flugzeug", ["flugzeug", "leiste"]),
  number("tickerSpeed", "Ticker: Zeit pro Durchlauf", SCREENS, 30, 5, 300, "s"),
  choice("powerOn", "Einschalten", SCREENS, "sonnenaufgang", ["sonnenaufgang", "blenden", "keins"]),
  number("powerOnDuration", "Einschalten (Dauer)", SCREENS, 1800, 0, 10000, "ms"),

  choice("alertStyle", "Stil", ALERTS, "postkarte", ["postkarte", "surfbrett", "flaschenpost"]),
  text("followTag", "Follow: Kopfzeile", ALERTS, "Neuer Follower"),
  text("followLine", "Follow: Zeile", ALERTS, "{user} ist mit an Bord!"),
  choice("followIcon", "Follow: Symbol", ALERTS, "muschel", ICON_NAMES),
  text("subTag", "Sub: Kopfzeile", ALERTS, "Neues Abo"),
  text("subLine", "Sub: Zeile", ALERTS, "{user} hat abonniert!"),
  choice("subIcon", "Sub: Symbol", ALERTS, "hibiskus", ICON_NAMES),
  text("resubTag", "Resub: Kopfzeile", ALERTS, "Abo x{amount}"),
  text("resubLine", "Resub: Zeile", ALERTS, "{user} ist seit {amount} Monaten am Strand!"),
  choice("resubIcon", "Resub: Symbol", ALERTS, "sonne", ICON_NAMES),
  text("giftTag", "Gift: Kopfzeile", ALERTS, "Abos verschenkt"),
  text("giftLine", "Gift: Zeile", ALERTS, "{user} verschenkt {amount} Abos!"),
  choice("giftIcon", "Gift: Symbol", ALERTS, "kokosnuss", ICON_NAMES),
  text("raidTag", "Raid: Kopfzeile", ALERTS, "Raid"),
  text("raidLine", "Raid: Zeile", ALERTS, "{user} landet mit {amount} Leuten am Strand!"),
  choice("raidIcon", "Raid: Symbol", ALERTS, "boot", ICON_NAMES),
  text("cheerTag", "Bits: Kopfzeile", ALERTS, "{amount} Bits"),
  text("cheerLine", "Bits: Zeile", ALERTS, "{user} wirft {amount} Bits ins Meer!"),
  choice("cheerIcon", "Bits: Symbol", ALERTS, "seestern", ICON_NAMES),
  text("redeemTag", "Kanalpunkte: Kopfzeile", ALERTS, "Kanalpunkte"),
  text("redeemLine", "Kanalpunkte: Zeile", ALERTS, "{user} löst {detail} ein."),
  choice("redeemIcon", "Kanalpunkte: Symbol", ALERTS, "ananas", ICON_NAMES),
  text("hypeTag", "Hype Train: Kopfzeile", ALERTS, "Hype Train"),
  text("hypeBeginLine", "Hype Train: Start", ALERTS, "Der Hype Train fährt ab!"),
  text("hypeEndLine", "Hype Train: Ende", ALERTS, "Hype Train Level {amount} geschafft!"),
  choice("hypeIcon", "Hype Train: Symbol", ALERTS, "welle", ICON_NAMES),
  flag("alertQuote", "Nachricht zeigen", ALERTS, true),
  text("quoteFormat", "Nachricht ({text})", ALERTS, "\"{text}\""),
  number("alertDuration", "Dauer", ALERTS, 7000, 2000, 60000, "ms"),
  number("alertScale", "Grösse", ALERTS, 1, 0.3, 2, undefined, 0.05),
  number("alertTop", "Abstand oben", ALERTS, 80, 0, 1000, "px"),
  choice("alertAlign", "Position", ALERTS, "center", ["left", "center", "right"]),
  number("alertWidth", "Breite", ALERTS, 760, 300, 1800, "px"),
  flag("alertTimer", "Restzeit als Seil", ALERTS, true),
  flag("petals", "Hibiskus-Konfetti", ALERTS, true),
  number("petalCount", "Anzahl Blüten", ALERTS, 14, 0, 40),
  flag("splash", "Wasserspritzer", ALERTS, true),
  text("alertGreeting", "Postkarte: Gruss auf der Vorderseite", ALERTS, "Grüße aus dem Chat", 40),
  number("alertSwellIn", "Welle herein (Dauer)", ALERTS, 1300, 300, 5000, "ms"),
  number("alertSwellOut", "Welle hinaus (Dauer)", ALERTS, 1300, 300, 5000, "ms"),
  number("alertSwellHeight", "Welle: Höhe", ALERTS, 300, 50, 600, "px"),
  number("alertSpray", "Gischt: Tropfen", ALERTS, 60, 0, 200),
  text("alertStamp", "Poststempel ({date} = Datum)", ALERTS, "STRAND {date}", 30),
  text("alertAddress", "Postkarte: Adresse ({channel} = Kanal, Zeilen mit / trennen)", ALERTS, "An: {channel} / Strandkorb 7 / Am Meer", 80),
  flag("alertSound", "Töne", ALERTS, true),
  ...alertSoundFields(ALERTS),

  choice("chatStyle", "Stil", CHAT, "blase", ["blase", "planke", "muschel"]),
  ...badgeFields(CHAT),
  flag("chatBadges", "Badges zeigen", CHAT, true),
  number("chatFontSize", "Schriftgrösse", CHAT, 20, 8, 60, "px"),
  number("emoteSize", "Emote-Grösse", CHAT, 28, 8, 120, "px"),
  number("chatFade", "Ausblenden nach (0 = nie)", CHAT, 30, 0, 3600, "s"),
  number("chatMax", "Max. Nachrichten", CHAT, 12, 1, 100),
  choice("chatAlign", "Neue Nachrichten", CHAT, "bottom", ["bottom", "top"]),
  number("chatOpacity", "Deckkraft", CHAT, 0.92, 0, 1, undefined, 0.01),
  number("chatGap", "Abstand", CHAT, 10, 0, 40, "px"),
  flag("chatSway", "Sanft schaukeln", CHAT, true),
  flag("chatBubbles", "Luftblasen steigen auf", CHAT, true),
  number("chatBubbleCount", "Luftblasen: Anzahl", CHAT, 14, 0, 60),
  number("chatBubbleRise", "Luftblasen: Steigen (px pro s)", CHAT, 60, 10, 300),

  choice("camStyle", "Rahmen", CAM, "bambus", ["bambus", "holz", "seil"]),
  number("camFrameWidth", "Rahmenbreite", CAM, 18, 2, 60, "px"),
  number("camRadius", "Eckenradius", CAM, 22, 0, 80, "px"),
  number("camLeaves", "Palmblätter in den Ecken", CAM, 3, 0, 4),
  number("camLeafSize", "Palmblatt: Grösse", CAM, 150, 40, 400, "px"),
  flag("camLeafSway", "Palmblätter wiegen", CAM, true),
  flag("camFlower", "Hibiskusblüte", CAM, true),
  text("camLabel", "Namensschild ({channel})", CAM, "{channel}"),
  flag("camLive", "Live-Anzeige", CAM, true),
  text("camLiveText", "Live-Text", CAM, "LIVE"),

  choice("musicStyle", "Stil", MUSIC, "radio", ["radio", "muschel", "schlicht"]),
  text("musicHeadPlaying", "Kopfzeile bei Wiedergabe", MUSIC, "Strandradio"),
  text("musicHeadPaused", "Kopfzeile bei Pause", MUSIC, "Pause"),
  text("musicIdleTitle", "Titel ohne Wiedergabe", MUSIC, "Keine Musik"),
  text("musicIdleArtist", "Interpret ohne Wiedergabe", MUSIC, "Nur Meeresrauschen"),
  flag("musicAlbum", "Album zeigen", MUSIC, false),
  flag("musicProgress", "Fortschritt zeigen", MUSIC, true),
  flag("equalizer", "Wellen-Equalizer", MUSIC, true),
  number("equalizerBars", "Equalizer: Balken", MUSIC, 7, 1, 16),
  choice("coverShape", "Cover-Form", MUSIC, "rund", ["rund", "eckig"]),
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
  flag("fxBubble", "Text in Sprechblase", FX, true),

  number("stingerDuration", "Länge", STINGER, 1.4, 0.5, 5, "s", 0.05),
  number("stingerCut", "Übergangspunkt", STINGER, 0.7, 0.1, 5, "s", 0.05),
  text("stingerText", "Text ({channel})", STINGER, "{channel}"),
  number("stingerWaves", "Wellenschichten", STINGER, 3, 1, 5),
  flag("stingerFoam", "Schaumkrone", STINGER, true),
  flag("stingerPalm", "Palme im Bild", STINGER, true),
  number("stingerSpray", "Gischt: Tropfen", STINGER, 50, 0, 200),

  number("bannerSunHeight", "Sonnenhöhe (Grad)", PROFILE_BANNER, 30, 0, 90),
  number("bannerSunset", "Sonnenhöhe (Grad)", OFFLINE_BANNER, 3, -4, 20),
  text("bannerTitle", "Titel ({channel})", PROFILE_BANNER, "{channel}"),
  text("bannerOfflineName", "Kanalzeile ({channel})", OFFLINE_BANNER, "{channel}"),
  text("bannerProfileText", "Text", PROFILE_BANNER, "Sonne, Strand und gute Streams"),
  text("bannerOfflineTitle", "Titel", OFFLINE_BANNER, "Gerade am Strand"),
  text("bannerOfflineText", "Text", OFFLINE_BANNER, "Folge dem Kanal und verpasse keinen Stream."),
  lines("bannerOfflineLines", "Zeilen", OFFLINE_BANNER, ["Bald wieder live", "Sonnencreme nicht vergessen"]),

  ...MINIME_BASE_FIELDS,
  number("fruitSize", "Grösse", MINIME_LOOK, 84, 30, 300, "px"),
  number("fruitGround", "Abstand zum unteren Rand", MINIME_LOOK, 20, 0, 300, "px"),
  number("fruitShadow", "Schatten (Stärke)", MINIME_LOOK, 0.3, 0, 1, undefined, 0.05),
  flag("fruitFaces", "Gesichter", MINIME_LOOK, true),
  color("fruitEye", "Augen", MINIME_LOOK, "#2b1b17"),
  color("fruitCheek", "Bäckchen", MINIME_LOOK, "#ff7a9a"),
  color("fruitMouth", "Mund", MINIME_LOOK, "#6b2a1f"),
  color("fruitOutline", "Umriss", MINIME_LOOK, "#5a3a22"),
  number("fruitOutlineWidth", "Umriss: Stärke", MINIME_LOOK, 2.5, 0, 8, undefined, 0.5),
  color("fruitLeaf", "Akzent", MINIME_LOOK, "#3aa655"),
  color("fruitStem", "Holz und Griffe", MINIME_LOOK, "#6b4423"),
  choice("fruitDefault", "Typ ohne Wahl (alle aus)", MINIME_LOOK, "rettungsring", THING_IDS),
  flag("fruitNames", "Namen zeigen", MINIME_LOOK, true),
  choice("fruitNameStyle", "Namen auf", MINIME_LOOK, "schild", ["schild", "band"]),
  number("fruitNameSize", "Name: Schriftgrösse", MINIME_LOOK, 15, 8, 48, "px"),
  number("fruitBlinkEvery", "Blinzeln alle (0 = nie)", MINIME_LOOK, 4000, 0, 30000, "ms"),
  choice("fruitEnter", "Erscheinen", MINIME_LOOK, "fallen", ["fallen", "blenden"]),
  choice("fruitExit", "Verschwinden", MINIME_LOOK, "wegspringen", ["wegspringen", "versinken"]),
  ...MINIME_HOP_FIELDS,
  number("bounceWeight", "Freudensprünge: Häufigkeit", MINIME_MOVES, 10, 0, 100),
  number("bounceMs", "Freudensprünge: Dauer", MINIME_MOVES, 1500, 300, 10000, "ms"),
  number("bounceHeight", "Freudensprünge: Höhe", MINIME_MOVES, 34, 0, 200, "px"),
  number("spinWeight", "Pirouette: Häufigkeit", MINIME_MOVES, 6, 0, 100),
  number("spinMs", "Pirouette: Dauer", MINIME_MOVES, 900, 200, 10000, "ms"),
  number("spinTurns", "Pirouette: Umdrehungen", MINIME_MOVES, 1, 1, 6),
  number("wobbleWeight", "Wackeln: Häufigkeit", MINIME_MOVES, 10, 0, 100),
  number("wobbleMs", "Wackeln: Dauer", MINIME_MOVES, 1200, 200, 10000, "ms"),
  number("wobbleAngle", "Wackeln: Winkel", MINIME_MOVES, 12, 0, 45),
  number("sunglassesWeight", "Sonnenbrille: Häufigkeit", MINIME_MOVES, 6, 0, 100),
  number("sunglassesMs", "Sonnenbrille: Dauer", MINIME_MOVES, 5000, 1000, 30000, "ms"),
  color("sunglasses", "Sonnenbrille", MINIME_MOVES, "#1d1d2b"),
  number("lookWeight", "Umschauen: Häufigkeit", MINIME_MOVES, 12, 0, 100),
  number("lookMs", "Umschauen: Dauer", MINIME_MOVES, 2400, 300, 10000, "ms"),
  number("sleepWeight", "Schlafen: Häufigkeit", MINIME_MOVES, 4, 0, 100),
  number("sleepMs", "Schlafen: Dauer", MINIME_MOVES, 7000, 1000, 60000, "ms"),
  text("sleepText", "Schlafen: aufsteigendes Zeichen", MINIME_MOVES, "z", 4),
  number("splashMs", "Reaktion auf Chat: Dauer", MINIME_MOVES, 900, 200, 5000, "ms"),
  number("splashHeight", "Reaktion auf Chat: Sprunghöhe", MINIME_MOVES, 50, 0, 300, "px"),
  number("splashDrops", "Reaktion auf Chat: Wasserspritzer", MINIME_MOVES, 8, 0, 20),
  // Commands page (public, /s/<login>/): shared texts from the core, plus the look
  ...INFO_FIELDS,
] as const satisfies readonly SettingField[];

// The resolved values as the server generates them (src/generated/themes, npm run gen:types)
export type { UrlaubValues } from "../../generated/themes/urlaub.ts";

// Main and detail color per beach thing (keys thing<Id>Main, thing<Id>Detail; set on the SVG in BeachThing.tsx)
const THING_DEFAULT_COLORS: Record<string, readonly [string, string]> = {
  rettungsring: ["#ff3b30", "#ffffff"], badeente: ["#ffd22e", "#ff8c1a"], wasserball: ["#ffffff", "#ff4f6d"],
  surfbrett: ["#29b6f6", "#ffd166"], sonnenschirm: ["#ff6f61", "#fff3d6"], flamingo: ["#ff8fb8", "#ff5c99"],
  liegestuhl: ["#4fc3f7", "#ffffff"], sandeimer: ["#ff9f1c", "#ffe066"], eis: ["#ff8fab", "#fff1c1"],
  muschel: ["#ffd8c2", "#e8a07e"], seestern: ["#ff9a52", "#ffd27a"], krebs: ["#ff5a4e", "#c9372c"],
  schnorchel: ["#ffdd00", "#bfefff"], sonnenbrille: ["#2b2b3a", "#7fd8ff"], cocktail: ["#e8f8ff", "#ff7aa8"], strandtasche: ["#2ec4b6", "#ffe28a"],
};
const capital = (id: string) => id[0].toUpperCase() + id.slice(1);
export const thingColorKeys = (id: string) => ({ main: `thing${capital(id)}Main`, detail: `thing${capital(id)}Detail` });
const THING_COLOR_FIELDS: SettingField[] = BEACH_THINGS.flatMap(thing => [
  color(thingColorKeys(thing.id).main, `${thing.label}: Hauptfarbe`, THING_COLORS, THING_DEFAULT_COLORS[thing.id][0]),
  color(thingColorKeys(thing.id).detail, `${thing.label}: Detailfarbe`, THING_COLORS, THING_DEFAULT_COLORS[thing.id][1]),
]);

const SCREEN_SCENES = ["starting", "brb", "ending"] as const;
const GROUP_SCENES = {
  [BEACH]: [...SCREEN_SCENES, "info"],
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
  [THING_COLORS]: ["minimes"],
  [INFO_GROUP]: ["info"],
} as const;

// On first login: channel name from the Twitch login (first letter upper case)
const personalize = (login: string) => ({ channelName: capital(login) });

// Simple view of the dashboard: per area the texts, main colors, figures and switches most streamers change
const BASIC = [
  "quality",
  "channelName", "font", "titleFont", "textColor", "accent", "accent2", "boat", "gulls",   "startingEyebrow", "startingTitle", "ticker", "brbTitle", "brbNote", "endingTitle", "endingNext", "alertStyle",
  "followLine", "subLine", "resubLine", "giftLine", "raidLine", "cheerLine", "redeemLine", "hypeBeginLine", "chatStyle", "chatBadges",
  "camStyle", "camLabel", "camLive", "musicStyle", "musicHide", "fxIn", "fxOut", "fruitDefault", "fruitNames",
];

export const urlaubSettings: ThemeSchema = {
  id: "urlaub",
  name: "Urlaub",
  fields: markBasic(withStingerFields([...FIELDS, ...minimeVariantFields(THING_SET), ...THING_COLOR_FIELDS], STINGER), BASIC),
  groupScenes: GROUP_SCENES,
  personalize,
  minimeVariants: THING_SET,
};
