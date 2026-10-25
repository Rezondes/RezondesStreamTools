// Settings schema of the Dogs theme (DESIGN-DOGS.md, PLAN-DOGS.md): pixel art dogs on a sunny meadow. The only place of
// the theme with fixed colors, texts and numbers. The coat colors of the 18 variants come from one table (COAT_COLORS,
// keys like corgiRotweissBase, coats.ts); server-rs/.../themes/dogs.rs builds the same fields from the same table.
// DogsValues is the type of the resolved values that the scenes read via useDogs.
import { alertSoundFields } from "../../core/alerts/alerts.ts";
import { badgeFields } from "../../core/chat/chat.ts";
import { choice, choiceBy, color, flag, font, inScene, lines, markBasic, number, sound, text, withDefaults } from "../../core/fields.ts";
import { qualityField } from "../../core/graphicsFields.ts";
import { INFO_FIELDS, INFO_GROUP } from "../../core/infoFields.ts";
import { MINIME_BASE_FIELDS, MINIME_COMMANDS, MINIME_MOTION, MINIME_RULES, MINIME_VARIANTS, minimeVariantFields } from "../../core/minimeFields.ts";
import { withStingerFields } from "../../core/stingerOptions.ts";
import type { SettingField, ThemeSchema } from "../../core/theme.ts";
import { BREED_IDS, BREEDS } from "./breeds.ts";
import { COATS, coatKey, coatsOf, type Coat } from "./coats.ts";
import { DOG_SET } from "./minimes.ts";

const FONTS = ["Pixelify Sans", "VT323", "Silkscreen"] as const;
const BARK_VOICES = ["klein", "mittel", "gross"] as const;

const GENERAL = "Allgemein";
const DOG = "Hund";
const SOUNDS = "Töne";
const WORLD = "Welt";
const STARTING = "Starting";
const BRB = "BRB";
const ENDING = "Ending";
const STATS = "Statistik";
const ALERTS = "Alerts";
const RAID = "Raid";
const TOYS = ["ball", "knochen", "frisbee", "leckerli"] as const;
const STINGER = "Stinger";
const PROFILE_BANNER = "Profilbanner";
const OFFLINE_BANNER = "Offline-Banner";
const MINIME_DOGS = "Minimes: Hunde";
const MINIME_SOUNDS = "Minimes: Töne";
const CHAT = "Chat";
const CAM = "Kamera-Rahmen";
const MUSIC = "Musik";
const FX = "Effekte";
const CHAT_STYLES = ["hund", "schilder", "schlicht"] as const;
const MUSIC_STYLES = ["hund", "schild", "schlicht"] as const;
const INFO_BACKGROUNDS = ["wiese", "creme"] as const;

// Per variant: base, mark, dark, nose (defaults of the prototypes, refs/dog.js)
const COAT_COLORS: Readonly<Record<string, readonly [string, string, string, string]>> = {
  corgiRotweiss: ["#cc7633", "#fbf6ee", "#a85a22", "#1d1715"], corgiZobel: ["#bd7a3c", "#fbf6ee", "#4e3322", "#1d1715"], corgiTricolor: ["#c27c40", "#fbf6ee", "#1f1b1a", "#111111"],
  shibaRot: ["#c9763a", "#f6e8d2", "#a85c27", "#1d1715"], shibaSesam: ["#c27a42", "#f4e5cf", "#3a2a20", "#1d1715"], shibaSchwarzloh: ["#231d1a", "#f3e3cc", "#c18750", "#111111"], shibaCreme: ["#ead6b4", "#fbf3e5", "#d7bd94", "#2a1d18"],
  labradorGelb: ["#e3bf86", "#f2dcb4", "#c99a5e", "#2a1d18"], labradorSchwarz: ["#1e1b1a", "#2a2523", "#141212", "#111111"], labradorBraun: ["#6a3f27", "#7a4b31", "#4a2a19", "#3d2419"],
  dalmatinerSchwarz: ["#f8f4ee", "#ffffff", "#1e1b1a", "#111111"], dalmatinerLeber: ["#f8f4ee", "#ffffff", "#6b3a22", "#5a3020"],
  dackelRot: ["#b4602f", "#c2743f", "#7f3e1c", "#1d1715"], dackelSchwarzrot: ["#1f1917", "#b5683a", "#141110", "#111111"], dackelSchokorot: ["#55301f", "#c07a45", "#3a2015", "#3a2218"],
  mopsBeige: ["#d9bb8b", "#e6cda2", "#231c19", "#111111"], mopsApricot: ["#d49b5d", "#e0b07a", "#251c16", "#111111"], mopsSchwarz: ["#1e1b1a", "#4a423d", "#141212", "#0a0a0a"],
};
const PART_LABELS = { Base: "Grundfarbe", Mark: "Abzeichen", Dark: "dunkel", Nose: "Nase" } as const;
const coatGroup = (variant: Coat) => `Fell: ${BREEDS[variant.breed].name}`;

// The four color fields of every variant, in the group of its breed
export function coatFields(): SettingField[] {
  return COATS.flatMap(variant => {
    const defaults = COAT_COLORS[coatKey(variant, "Base").replace(/Base$/, "")];
    return (["Base", "Mark", "Dark", "Nose"] as const).map((part, index) => color(coatKey(variant, part), `${variant.name}: ${PART_LABELS[part]}`, coatGroup(variant), defaults[index]));
  });
}

const volume = (value: number) => ({ file: "", volume: value });
const barkVoiceOf = (id: string) => (["labrador", "dalmatiner"].includes(id) ? "gross" : id === "shiba" ? "mittel" : "klein");

const FIELDS = [
  text("channelName", "Kanalname ({channel})", GENERAL, "RUDEL-STREAM", 40),
  font("font", "Schrift", GENERAL, "Pixelify Sans", FONTS),
  number("fontSize", "Schriftgrösse", GENERAL, 26, 10, 60, "px"),
  number("titleSize", "Titel: Grösse", GENERAL, 100, 40, 200, "px"),
  color("cream", "Schild", GENERAL, "#fff6e6"),
  color("edge", "Schild: Kante unten", GENERAL, "#e9d2bd"),
  color("ink", "Tinte (Kontur)", GENERAL, "#2e1d14"),
  color("textColor", "Text", GENERAL, "#4a3426"),
  color("muted", "Text gedämpft", GENERAL, "#7a5a46"),
  color("accent", "Signatur (Halsband-Rot)", GENERAL, "#c24535"),
  color("onAccent", "Schrift auf der Signatur", GENERAL, "#fff6e6"),
  color("ball", "Ball-Gelb", GENERAL, "#ffd23f"),
  color("light", "Licht (Augen, Wolken, Zaun)", GENERAL, "#ffffff"),
  number("boxShadow", "Schatten der Schilder", GENERAL, 28, 0, 100, "%"),
  qualityField(GENERAL),
  number("pixelScale", "Pixelgrösse", GENERAL, 5, 3, 8, "px"),

  choice("dog", "Hund des Streamers: Rasse", DOG, "corgi", BREED_IDS),
  choiceBy("coat", "Hund des Streamers: Fell (passend zur Rasse)", DOG, "rotweiss", "dog", Object.fromEntries(BREED_IDS.map(id => [id, coatsOf(id).map(coat => coat.id)]))),
  text("dogName", "Name des Hundes ({dog})", DOG, "Bello", 30),
  color("dogEye", "Augen", DOG, "#1d1412"),
  color("dogTongue", "Zunge und Ohren innen", DOG, "#e98a95"),
  number("blinkEvery", "Blinzeln: alle (0 = nie)", DOG, 3.3, 0, 30, "s", 0.1),
  number("wagSpeed", "Wedeln: Tempo", DOG, 10, 0, 30, undefined, 0.5),
  number("walkFps", "Laufen: Bilder pro Sekunde", DOG, 9, 2, 30),
  flag("pant", "Hecheln", DOG, true),
  ...BREED_IDS.map(id => choice(`barkVoice_${id}`, `Bellstimme: ${BREEDS[id].name}`, DOG, barkVoiceOf(id), BARK_VOICES)),

  number("soundMaxVoices", "Töne gleichzeitig höchstens", SOUNDS, 8, 1, 32),
  ...withDefaults([
    sound("soundStartingLand", "Starting: Hund landet", SOUNDS),
    sound("soundStartingHop", "Starting: Marker hüpft", SOUNDS),
    sound("soundStartingChosen", "Starting: Hund gewählt", SOUNDS),
    sound("soundStartingCard", "Starting: Karte", SOUNDS),
    sound("soundBark", "Bellen", SOUNDS),
    sound("soundBrbSniff", "BRB: Schnüffeln", SOUNDS),
    sound("soundBrbSteps", "BRB: Schritte", SOUNDS),
    sound("soundEndingLie", "Ending: Hinlegen", SOUNDS),
    sound("soundEndingLamp", "Ending: Lampe", SOUNDS),
    sound("soundEndingSnore", "Ending: Schnarchen", SOUNDS),
  ], {
    soundStartingLand: volume(0.4), soundStartingHop: volume(0.4), soundStartingChosen: volume(0.6), soundStartingCard: volume(0.5), soundBark: volume(0.7),
    soundBrbSniff: volume(0), soundBrbSteps: volume(0), soundEndingLie: volume(0.5), soundEndingLamp: volume(0.4), soundEndingSnore: volume(0.3),
  }),
  flag("startingBarkSound", "Starting: Hunde bellen hörbar", SOUNDS, true),
  number("snoreEvery", "Ending: Schnarchen alle", SOUNDS, 4, 1, 60, "s", 0.5),

  ...coatFields(),
  number("dalmatinerSpots", "Dalmatiner: Anteil der Flecken", "Fell: Dalmatiner", 42, 0, 100, "%"),
  number("spotSeed", "Dalmatiner: Startwert der Flecken", "Fell: Dalmatiner", 1, 1, 9999),

  color("sky", "Himmel oben", WORLD, "#9fd6ff"),
  color("skyLow", "Himmel unten", WORLD, "#e3f5ff"),
  color("grass", "Wiese", WORLD, "#86c45f"),
  color("grassLight", "Wiese: Oberkante", WORLD, "#a3d97a"),
  color("hillColor1", "Hügel links", WORLD, "#93d26e"),
  color("hillColor2", "Hügel rechts", WORLD, "#86c862"),
  color("hillColor3", "Hügel Mitte", WORLD, "#7cbf5a"),
  color("treeTrunk", "Baumstamm", WORLD, "#a8754a"),
  color("treeLeaf", "Baumkrone", WORLD, "#6fbf5a"),
  color("appleColor", "Äpfel", WORLD, "#f25c54"),
  flag("fence", "Zaun", WORLD, true),
  number("clouds", "Wolken", WORLD, 6, 0, 20),
  number("cloudSpeed", "Wolken: Tempo", WORLD, 4, 0, 60, undefined, 0.5),
  flag("trees", "Bäume", WORLD, true),
  number("flowers", "Blumen und Grasbüschel", WORLD, 56, 0, 300),
  color("flowerColor1", "Blumen: Farbe 1", WORLD, "#ffffff"),
  color("flowerColor2", "Blumen: Farbe 2", WORLD, "#ffd23f"),
  color("flowerColor3", "Blumen: Farbe 3", WORLD, "#f7a6c1"),
  color("flowerColor4", "Blumen: Farbe 4", WORLD, "#c9b6ff"),

  inScene("starting", text("startingPill", "Pille oben ({channel})", STARTING, "{channel}", 40)),
  inScene("starting", text("startingTitle", "Titel", STARTING, "Gleich geht's los!", 60)),
  inScene("starting", text("startingSubtitle", "Unterzeile", STARTING, "Wer begleitet uns heute?", 80)),
  inScene("starting", number("countdown", "Countdown: Dauer", STARTING, 300, 0, 86400, "s")),
  inScene("starting", text("countdownAt", "Countdown: bis Uhrzeit (z.B. 20:00, leer = Dauer)", STARTING, "", 5)),
  inScene("starting", text("countdownLabel", "Countdown: Beschriftung", STARTING, "LOS GEHT'S IN", 40)),
  inScene("starting", text("cardLabel", "Karte: Überzeile", STARTING, "HEUTE AN MEINER SEITE", 40)),
  inScene("starting", text("cardBreed", "Karte: Rasse ({breed}, {coat})", STARTING, "{breed} · {coat}", 60)),
  inScene("starting", text("bark", "Sprechblase", STARTING, "Wuff!", 20)),
  inScene("starting", color("cushionColor1", "Kissen 1", STARTING, "#bfe8d4")),
  inScene("starting", color("cushionColor2", "Kissen 2", STARTING, "#d8ccff")),
  inScene("starting", color("cushionColor3", "Kissen 3", STARTING, "#ffd2b8")),
  inScene("starting", color("cushionColor4", "Kissen 4", STARTING, "#bfe0ff")),
  inScene("starting", color("cushionColor5", "Kissen 5", STARTING, "#fff0a8")),
  inScene("starting", color("cushionColor6", "Kissen 6", STARTING, "#ffc9d9")),
  inScene("starting", color("rugColor", "Teppich", STARTING, "#c24535")),
  inScene("starting", number("dropEvery", "Hunde fallen: Abstand", STARTING, 0.2, 0, 2, "s", 0.05)),
  inScene("starting", number("markerStart", "Marker startet nach", STARTING, 2.6, 0, 20, "s", 0.1)),
  inScene("starting", number("markerHop", "Marker: Dauer je Sprung", STARTING, 0.45, 0.1, 3, "s", 0.05)),
  inScene("starting", number("hearts", "Herzen", STARTING, 7, 0, 30)),
  inScene("starting", number("walkSpeed", "Lauf zum Teppich: Tempo", STARTING, 48, 5, 300)),
  inScene("starting", number("barkEvery", "Bellen: alle", STARTING, 7, 1, 120, "s", 0.5)),
  inScene("starting", flag("labels", "Etiketten unter den Kissen", STARTING, true)),
  inScene("starting", text("ticker", "Laufband (leer = aus)", STARTING, "", 300)),
  inScene("starting", number("tickerSpeed", "Laufband: Tempo (px pro Sekunde)", STARTING, 90, 10, 400)),

  inScene("brb", text("brbPill", "Pille", BRB, "GASSI-PAUSE", 40)),
  inScene("brb", text("brbTitle", "Titel", BRB, "Bin gleich zurück!", 60)),
  inScene("brb", text("brbSubtitle", "Unterzeile ({dog})", BRB, "{dog} und ich drehen eine Runde.", 80)),
  inScene("brb", text("brbPauseLabel", "Pausenzeit: Beschriftung", BRB, "PAUSE SEIT", 40)),
  inScene("brb", text("brbStepsLabel", "Schritte: Beschriftung", BRB, "SCHRITTE", 40)),
  inScene("brb", text("brbSniff", "Sprechblase beim Schnüffeln", BRB, "Schnüff!", 20)),
  inScene("brb", number("walkPxPerSecond", "Gehen: Tempo", BRB, 24, 1, 200)),
  inScene("brb", number("walkPeriod", "Runde: Dauer bis zum nächsten Schnüffeln", BRB, 9, 3, 120, "s", 0.5)),
  inScene("brb", number("sniffSeconds", "Schnüffeln: Dauer", BRB, 2, 0, 30, "s", 0.5)),
  inScene("brb", number("stepPx", "Schritt: Länge (Pixel)", BRB, 3, 1, 50)),
  inScene("brb", flag("leash", "Leine", BRB, true)),
  inScene("brb", color("leashColor", "Leine: Farbe", BRB, "#c24535")),
  inScene("brb", number("leashSag", "Leine: Durchhang beim Gehen (stehend doppelt)", BRB, 8, 0, 40)),
  inScene("brb", flag("butterfly", "Schmetterling", BRB, true)),
  inScene("brb", color("butterflyColor", "Schmetterling: Farbe", BRB, "#f7a6c1")),
  inScene("brb", color("pathColor", "Weg", BRB, "#e3c49a")),
  inScene("brb", flag("parallax", "Parallaxe (ferne Ebenen langsamer)", BRB, true)),

  inScene("ending", text("endingTitle", "Titel", ENDING, "Gute Nacht!", 60)),
  inScene("ending", text("endingSubtitle", "Unterzeile ({dog})", ENDING, "Danke fürs Zuschauen. {dog} schläft schon.", 80)),
  inScene("ending", text("endingBye", "Pille", ENDING, "Bis zum nächsten Mal!", 40)),
  inScene("ending", color("night", "Wand bei Nacht", ENDING, "#3b3a63")),
  inScene("ending", color("nightSub", "Unterzeile auf der Wand", ENDING, "#f1dcc0")),
  inScene("ending", color("windowSky", "Nachthimmel im Fenster", ENDING, "#1b2547")),
  inScene("ending", color("floor", "Dielen", ENDING, "#7d5233")),
  inScene("ending", color("rug", "Teppich", ENDING, "#8f6fc7")),
  inScene("ending", color("lamp", "Lampe und Mond", ENDING, "#ffe9a8")),
  inScene("ending", color("basket", "Körbchen", ENDING, "#c48a4f")),
  inScene("ending", color("pillow", "Kissen im Körbchen", ENDING, "#ffc9d9")),
  inScene("ending", number("stars", "Sterne im Fenster", ENDING, 16, 0, 60)),
  inScene("ending", flag("moon", "Mond", ENDING, true)),
  inScene("ending", number("lampDim", "Lampe: Helligkeit am Ende", ENDING, 35, 0, 100, "%")),
  inScene("ending", number("lampDimFrom", "Lampe: dimmt ab", ENDING, 5, 0, 120, "s", 0.5)),
  inScene("ending", number("lampDimTo", "Lampe: gedimmt bei", ENDING, 7.5, 0, 120, "s", 0.5)),
  inScene("ending", flag("zzz", "Z beim Schlafen", ENDING, true)),
  inScene("ending", number("zzzEvery", "Z: Dauer je Aufstieg", ENDING, 1.8, 0.5, 10, "s", 0.1)),

  // Stream numbers (scene stats); keys: follows, subs, giftedSubs, raids, raiders, bits, redeems, hypeLevel, chatMessages,
  // chatters, duration
  text("statsLabel", "Überschrift", STATS, "HEUTE IM RUDEL", 40),
  lines("statsLines", "Zahlen (Schlüssel|Text)", STATS, ["follows|neue Follower", "subs|Abos", "raids|Raids"], 6),

  // Per kind: head line ({amount}) and line under the name (placeholders {user}, {amount}, {detail}, {text})
  text("followTag", "Follow: Kopfzeile", ALERTS, "NEUER FOLLOWER"),
  text("followLine", "Follow: Zeile", ALERTS, "gehört jetzt zum Rudel!"),
  text("subTag", "Sub: Kopfzeile", ALERTS, "NEUES ABO"),
  text("subLine", "Sub: Zeile", ALERTS, "ist jetzt Teil des Rudels!"),
  text("resubTag", "Resub: Kopfzeile", ALERTS, "ABO x{amount}"),
  text("resubLine", "Resub: Zeile", ALERTS, "seit {amount} Monaten im Rudel!"),
  text("giftTag", "Gift: Kopfzeile", ALERTS, "ABOS VERSCHENKT"),
  text("giftLine", "Gift: Zeile", ALERTS, "verschenkt {amount} Abos ans Rudel!"),
  text("raidTag", "Raid: Kopfzeile", ALERTS, "RAID"),
  text("raidLine", "Raid: Zeile", ALERTS, "kommt mit {amount} Hunden vorbei!"),
  text("raidLineOne", "Raid: Zeile bei einem Hund", ALERTS, "kommt mit einem Hund vorbei!"),
  text("cheerTag", "Bits: Kopfzeile", ALERTS, "{amount} BITS"),
  text("cheerLine", "Bits: Zeile", ALERTS, "Danke für die Frisbee-Runde!"),
  text("redeemTag", "Kanalpunkte: Kopfzeile", ALERTS, "KANALPUNKTE"),
  text("redeemLine", "Kanalpunkte: Zeile", ALERTS, "löst {detail} ein!"),
  text("hypeTag", "Hype Train: Kopfzeile", ALERTS, "HYPE TRAIN"),
  text("hypeBeginLine", "Hype Train: Start", ALERTS, "Das ganze Rudel rennt los!"),
  text("hypeEndLine", "Hype Train: Ende", ALERTS, "Hype Train Level {amount} geschafft!"),
  flag("alertQuote", "Nachricht statt Zeile zeigen", ALERTS, true),
  text("quoteFormat", "Nachricht ({text})", ALERTS, "„{text}“"),
  number("alertDuration", "Dauer (ohne Raid)", ALERTS, 8.2, 6, 60, "s", 0.1),
  text("alertBark", "Sprechblase", ALERTS, "Wuff!", 20),
  choice("toyFollow", "Spielzeug: Follow", ALERTS, "ball", TOYS),
  choice("toySub", "Spielzeug: Sub und Resub", ALERTS, "knochen", TOYS),
  choice("toyGift", "Spielzeug: Gift", ALERTS, "knochen", TOYS),
  choice("toyRaid", "Spielzeug: Raid", ALERTS, "ball", TOYS),
  choice("toyCheer", "Spielzeug: Bits", ALERTS, "frisbee", TOYS),
  choice("toyRedeem", "Spielzeug: Kanalpunkte", ALERTS, "leckerli", TOYS),
  choice("toyHype", "Spielzeug: Hype Train", ALERTS, "frisbee", TOYS),
  color("toyBoneColor", "Knochen: Farbe", ALERTS, "#fff6e6"),
  color("toyFrisbeeColor", "Frisbee: Farbe", ALERTS, "#c24535"),
  color("toyTreatColor", "Leckerli: Farbe", ALERTS, "#a8754a"),
  number("dropBounce", "Spielzeug: Sprunghöhe", ALERTS, 14, 0, 60),
  number("cardTop", "Karte: Abstand von oben", ALERTS, 440, 0, 900, "px"),
  ...withDefaults([
    sound("soundAlertRun", "Eingebaut: Hereinrennen", ALERTS),
    sound("soundAlertToy", "Eingebaut: Spielzeug", ALERTS),
    sound("soundAlertCard", "Eingebaut: Karte", ALERTS),
    sound("soundAlertLeave", "Eingebaut: Hinausrennen", ALERTS),
  ], { soundAlertRun: volume(0.5), soundAlertToy: volume(0.5), soundAlertCard: volume(0.5), soundAlertLeave: volume(0.4) }),
  ...withDefaults([...alertSoundFields(ALERTS)], { soundRaid: volume(0.5) }),

  flag("raidPack", "Ein Hund je Raider", RAID, true),
  number("raidMaxOnScreen", "Hunde gleichzeitig höchstens", RAID, 12, 1, 40),
  // fixed: at most 1000 dogs in all, every one is planned up front
  number("raidMaxDogs", "Hunde insgesamt höchstens", RAID, 300, 0, 1000),
  number("raidCrossMs", "Lauf durchs Bild: Dauer", RAID, 2400, 800, 10000, "ms"),
  number("raidSpeedSpread", "Tempo: Streuung", RAID, 20, 0, 60, "%"),
  number("raidLanes", "Spuren", RAID, 4, 1, 8),
  number("raidLaneGap", "Abstand der Spuren", RAID, 3, 0, 10),
  number("raidBarkEvery", "Bellen beim Warten: alle", RAID, 5, 1, 60, "s", 0.5),
  number("raidSeed", "Startwert", RAID, 1, 1, 9999),
  number("raidBarkShare", "Anteil der Läufe, die beim Erscheinen bellen", RAID, 25, 0, 100, "%"),
  ...BREED_IDS.map(id => flag(`raidBreed_${id}`, `Rudel: ${BREEDS[id].name}`, RAID, true)),

  choice("chatStyle", "Darstellung", CHAT, "hund", CHAT_STYLES),
  number("chatMax", "Max. Nachrichten", CHAT, 6, 1, 50),
  number("chatLifetime", "Ausblenden nach (0 = nie)", CHAT, 30, 0, 3600, "s"),
  number("chatWidth", "Breite", CHAT, 480, 200, 1900, "px"),
  color("chatNameColor", "Farbe der Namen", CHAT, "#c24535"),
  number("emoteSize", "Emote-Grösse", CHAT, 28, 8, 120, "px"),
  flag("chatBadges", "Badges zeigen", CHAT, true),
  ...badgeFields(CHAT),
  ...BREED_IDS.map(id => flag(`chatBreed_${id}`, `Hunde im Chat: ${BREEDS[id].name}`, CHAT, true)),

  flag("camRoof", "Hundehütten-Dach", CAM, true),
  color("camRoofColor", "Dach: Farbe", CAM, "#c24535"),
  flag("camDog", "Hund an der Ecke", CAM, true),
  text("camLabel", "Namensschild ({channel}, {dog})", CAM, "{channel}"),
  number("camBorder", "Rahmenstärke", CAM, 5, 0, 30, "px"),

  choice("musicStyle", "Darstellung", MUSIC, "hund", MUSIC_STYLES),
  text("musicLabel", "Überzeile", MUSIC, "JETZT LÄUFT"),
  text("musicIdle", "Text ohne Wiedergabe", MUSIC, "Gerade keine Musik"),
  flag("musicHide", "Bei Pause ausblenden", MUSIC, true),
  flag("musicCover", "Cover zeigen", MUSIC, true),
  flag("musicPaws", "Fortschritt als Pfotenspur", MUSIC, true),
  number("musicBob", "Hund wippt (pro Sekunde, 0 = still)", MUSIC, 2, 0, 6, undefined, 0.5),
  number("musicMarqueeSpeed", "Lange Zeilen: Lauftempo (px pro Sekunde)", MUSIC, 40, 5, 400),
  number("coverSize", "Cover-Grösse", MUSIC, 96, 40, 300, "px"),

  number("fxDuration", "Standarddauer", FX, 4, 0.5, 120, "s", 0.5),
  number("fxSize", "Standardgrösse", FX, 360, 20, 1920, "px"),
  flag("fxText", "Text zeigen", FX, true),
  number("fxTextSize", "Textgrösse", FX, 96, 8, 300, "px"),
  number("fxMargin", "Zufallsposition: Abstand zum Rand", FX, 20, 0, 50, "%"),
  number("fxMax", "Max. gleichzeitig", FX, 8, 1, 30),

  ...withDefaults(INFO_FIELDS, { infoTitle: "Befehle im Rudel" }),
  choice("infoBackground", "Befehlsseite: Hintergrund", INFO_GROUP, "wiese", INFO_BACKGROUNDS),
  number("infoWidth", "Befehlsseite: Breite der Spalte", INFO_GROUP, 900, 400, 1600, "px"),

  number("stingerDuration", "Länge", STINGER, 2.4, 0.5, 5, "s", 0.05),
  number("stingerCut", "Übergangspunkt", STINGER, 1.2, 0.1, 5, "s", 0.05),
  number("stingerSweep", "Wischen: Dauer", STINGER, 0.82, 0.2, 3, "s", 0.01),
  number("stingerPawSpacing", "Pfoten: Abstand (Pixel)", STINGER, 30, 12, 80),
  number("stingerSlant", "Kante: Neigung", STINGER, 0.45, 0, 1.5, undefined, 0.05),
  number("stingerStep", "Kante: Stufenhöhe (Pixel)", STINGER, 6, 1, 30),
  flag("stingerDog", "Hund läuft mit", STINGER, true),
  flag("stingerBadge", "Plakette am Übergang", STINGER, true),
  text("stingerText", "Name auf der Plakette ({dog}, {channel})", STINGER, "{dog}", 30),
  color("stingerCover", "Fläche", STINGER, "#fff6e6"),

  text("bannerProfileTitle", "Titel ({channel})", PROFILE_BANNER, "{channel}", 40),
  text("bannerProfileText", "Zeile ({channel})", PROFILE_BANNER, "Willkommen im Rudel!", 80),
  text("bannerOfflineTitle", "Titel ({channel})", OFFLINE_BANNER, "OFFLINE", 40),
  text("bannerOfflineText", "Zeile ({dog}, {channel})", OFFLINE_BANNER, "{dog} schläft. Bis bald!", 80),

  // Minimes: core fields plus the look and the own actions of the dogs (minimes.ts); the type is the breed
  ...MINIME_BASE_FIELDS,
  number("minimeScale", "Grösse (Bildschirmpixel je Pixel)", MINIME_DOGS, 3, 2, 8),
  flag("minimeGrass", "Grasstreifen unten", MINIME_DOGS, true),
  flag("minimeNameTag", "Namensschild", MINIME_DOGS, true),
  number("minimeBarkWeight", "Bellen: Häufigkeit", MINIME_DOGS, 3, 0, 100),
  number("minimeBarkMs", "Bellen: Dauer", MINIME_DOGS, 900, 200, 10000, "ms"),
  number("minimeSniffWeight", "Schnüffeln: Häufigkeit", MINIME_DOGS, 3, 0, 100),
  number("minimeSniffMs", "Schnüffeln: Dauer", MINIME_DOGS, 2000, 200, 10000, "ms"),
  number("minimeLieWeight", "Liegen: Häufigkeit", MINIME_DOGS, 2, 0, 100),
  number("minimeLieMs", "Liegen: Dauer", MINIME_DOGS, 4000, 200, 30000, "ms"),
  number("minimeSleepWeight", "Schlafen: Häufigkeit", MINIME_DOGS, 1, 0, 100),
  number("minimeSleepMs", "Schlafen: Dauer", MINIME_DOGS, 6000, 200, 60000, "ms"),
  number("minimeWagMs", "Reaktion auf Chat (schnelles Wedeln): Dauer", MINIME_DOGS, 1200, 200, 5000, "ms"),
  ...withDefaults([
    sound("soundMinimeBark", "Bellen", MINIME_SOUNDS),
    sound("soundMinimeSniff", "Schnüffeln", MINIME_SOUNDS),
    sound("soundMinimeWag", "Wedeln bei Chat", MINIME_SOUNDS),
  ], { soundMinimeBark: volume(0.3), soundMinimeSniff: volume(0), soundMinimeWag: volume(0.2) }),
] as const satisfies readonly SettingField[];

// The resolved values as the server generates them (src/generated/themes, npm run gen:types)
export type { DogsValues } from "../../generated/themes/dogs.ts";

const GROUP_SCENES = {
  [WORLD]: ["starting", "brb"],
  [STARTING]: ["starting"],
  [BRB]: ["brb"],
  [ENDING]: ["ending"],
  [STATS]: ["stats"],
  [ALERTS]: ["alerts"],
  [RAID]: ["alerts"],
  [CHAT]: ["chat"],
  [CAM]: ["cam"],
  [MUSIC]: ["music"],
  [FX]: ["fx"],
  [INFO_GROUP]: ["info"],
  [STINGER]: [],
  [PROFILE_BANNER]: [],
  [OFFLINE_BANNER]: [],
  [MINIME_COMMANDS]: ["minimes"],
  [MINIME_RULES]: ["minimes"],
  [MINIME_MOTION]: ["minimes"],
  [MINIME_VARIANTS]: ["minimes"],
  [MINIME_DOGS]: ["minimes"],
  [MINIME_SOUNDS]: ["minimes"],
} as const;

const personalize = (login: string) => ({ channelName: login.toUpperCase() });

// Simple view of the dashboard: per area the texts, main colors and switches most streamers change
const BASIC = ["quality", "channelName", "accent", "cream", "dog", "coat", "dogName", "startingTitle", "startingSubtitle", "countdownLabel", "cardLabel", "ticker", "brbTitle", "brbSubtitle", "endingTitle", "endingSubtitle", "statsLines", "followLine", "subLine", "raidLine", "cheerLine", "alertBark", "chatStyle", "chatBadges", "camLabel", "musicStyle", "musicLabel", "fxText", "minimeNameTag"];

export const dogsSettings: ThemeSchema = { id: "dogs", name: "Dogs", fields: markBasic(withStingerFields([...FIELDS, ...minimeVariantFields(DOG_SET)], STINGER), BASIC), groupScenes: GROUP_SCENES, personalize,
  minimeVariants: DOG_SET };
