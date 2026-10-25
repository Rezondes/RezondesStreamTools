// Settings schema of the Kebab theme (DESIGN-KEBAB.md, PLAN-KEBAB.md): a kebab shop as red line art on paper. The only
// place of the theme with fixed colors, texts and numbers. KebabValues is the type of the resolved values that the
// scenes read via useKebab.
import { alertSoundFields } from "../../core/alerts/alerts.ts";
import { badgeFields } from "../../core/chat/chat.ts";
import { choice, color, flag, font, inScene, lines, markBasic, number, text, withDefaults } from "../../core/fields.ts";
import { qualityField } from "../../core/graphicsFields.ts";
import { INFO_FIELDS, INFO_GROUP } from "../../core/infoFields.ts";
import { MINIME_BASE_FIELDS, MINIME_COMMANDS, MINIME_HOP, MINIME_HOP_FIELDS, MINIME_MOTION, MINIME_RULES, MINIME_VARIANTS, minimeVariantFields } from "../../core/minimeFields.ts";
import { withStingerFields } from "../../core/stingerOptions.ts";
import type { SettingField, ThemeSchema } from "../../core/theme.ts";
import { TUNING_FIELDS, TUNING_GROUPS } from "./tuning.ts";
import { DISH_SET, DISH_TYPES } from "./dishes.ts";

const TITLE_FONTS = ["Titan One", "Baloo 2", "Fredoka"] as const;
const TEXT_FONTS = ["Nunito", "DM Sans", "Manrope"] as const;

const GENERAL = "Allgemein";
const CHEF = "Koch und Spieß";
const STARTING = "Starting";
const BRB = "BRB";
const ENDING = "Ending";
const CLOSING = "Tagesabschluss";
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

const ALERT_STYLES = ["bon", "tuete"] as const;
const CHAT_STYLES = ["zettel", "liste", "schlicht"] as const;
const NAME_COLORS = ["rot", "chatter"] as const;
const CAM_STYLES = ["fenster", "rahmen", "aus"] as const;
const MUSIC_STYLES = ["bon", "schild", "schlicht"] as const;
const STINGER_STYLES = ["papier", "messer"] as const;

const FIELDS = [
  text("channelName", "Ladenname ({shop})", GENERAL, "Döner", 40),
  font("titleFont", "Schrift: Titel und Namen", GENERAL, "Titan One", TITLE_FONTS),
  font("font", "Schrift: Text", GENERAL, "Nunito", TEXT_FONTS),
  number("fontSize", "Schriftgrösse", GENERAL, 24, 10, 60, "px"),
  color("red", "Linien und Bogenschrift (Signatur)", GENERAL, "#f85449"),
  color("redText", "Rot für Schrift und Flächen", GENERAL, "#c8261b"),
  color("paper", "Papier", GENERAL, "#fff8ec"),
  color("bon", "Bon-Papier", GENERAL, "#fffdf8"),
  color("kraft", "Tütenpapier", GENERAL, "#f9ebd6"),
  color("brown", "Text dunkel", GENERAL, "#3a1a12"),
  color("muted", "Text gedämpft", GENERAL, "#8a5a4a"),
  color("steam", "Dampf über dem Spiel", GENERAL, "#fff8ec"),
  qualityField(GENERAL),
  number("inkRoughness", "Linie: Rauheit", GENERAL, 0.55, 0, 3, undefined, 0.05),
  number("inkBowing", "Linie: Bogen", GENERAL, 0.6, 0, 5, undefined, 0.05),
  number("inkWidth", "Linie: Stärke (Faktor)", GENERAL, 1, 0.3, 3, undefined, 0.05),
  number("inkSeed", "Linie: Startwert", GENERAL, 11, 1, 9999),
  number("introSpeed", "Auftritt: Tempo (Faktor)", GENERAL, 1, 0.25, 4, undefined, 0.05),
  flag("lightsOn", "Licht flackert beim Start an", GENERAL, true),

  text("arcText", "Bogenschrift", CHEF, "DÖNER KEBAB", 30),
  number("arcSize", "Bogenschrift: Grösse", CHEF, 72, 20, 140),
  number("arcSpan", "Bogenschrift: Winkel", CHEF, 66, 10, 180),
  number("arcStroke", "Bogenschrift: Kontur", CHEF, 4, 0, 12, "px", 0.5),
  number("spitSpeed", "Spieß: Tempo", CHEF, 18, 0, 120),
  number("hatchRows", "Spieß: Reihen", CHEF, 32, 8, 60),
  flag("sawOn", "Koch sägt", CHEF, true),
  number("sawSpeed", "Sägen: Tempo", CHEF, 5.2, 0, 20, undefined, 0.1),
  number("sawAngle", "Sägen: Ausschlag", CHEF, 2.6, 0, 15, undefined, 0.1),
  flag("hatOn", "Mütze wippt", CHEF, true),
  flag("stacheOn", "Schnurrbart zuckt", CHEF, true),
  number("blinkEvery", "Blinzeln: alle (0 = nie)", CHEF, 4.2, 0, 30, "s", 0.1),
  flag("shavingsOn", "Fleischspäne fallen", CHEF, true),
  number("shavingsEvery", "Späne: alle", CHEF, 160, 40, 2000, "ms"),
  number("shavingsFall", "Späne: Fallzeit", CHEF, 800, 100, 3000, "ms"),
  // fixed: at most 300 shavings, every one is drawn every frame
  number("shavingsMax", "Späne: höchstens", CHEF, 140, 0, 300),
  flag("steamOn", "Dampf", CHEF, true),
  number("steamHeight", "Dampf: Höhe", CHEF, 70, 0, 300),

  inScene("starting", text("startingNumber", "Bon: Bestellnummer", STARTING, "Bestellung Nr. 042", 40)),
  inScene("starting", lines("startingItems", "Bon: Posten (Posten|Zusatz)", STARTING, ["1x Stream|mit alles", "1x Gute Laune|scharf", "1x Chat|extra Soße"], 6)),
  inScene("starting", text("countdownLabel", "Countdown: Beschriftung", STARTING, "FERTIG IN", 40)),
  inScene("starting", number("countdown", "Countdown: Dauer", STARTING, 300, 0, 86400, "s")),
  inScene("starting", text("countdownAt", "Countdown: bis Uhrzeit (z.B. 20:00, leer = Dauer)", STARTING, "", 5)),
  inScene("starting", text("countdownDone", "Text nach dem Countdown", STARTING, "GUTEN APPETIT!", 40)),
  inScene("starting", lines("startingLines", "Bon: wechselnde Zeile unten", STARTING, ["Danke und guten Appetit!", "Zwiebeln? Scharf? Mit alles!"], 12)),
  inScene("starting", number("linesEvery", "Wechselnde Zeile: alle", STARTING, 8, 1, 120, "s")),
  inScene("starting", flag("bonOn", "Bestellbon zeigen", STARTING, true)),
  inScene("starting", text("ticker", "Laufband (leer = aus)", STARTING, "Frisch vom Spieß • Mit alles und scharf • Gleich geht's los • Zwiebeln? Klar!", 300)),
  inScene("starting", number("tickerSpeed", "Laufband: Tempo (px pro Sekunde)", STARTING, 90, 10, 400)),

  inScene("brb", text("brbTitle", "Bon: Titel", BRB, "BIN GLEICH ZURÜCK", 40)),
  inScene("brb", lines("brbItems", "Bon: Posten (Posten|Zusatz)", BRB, ["1x Çay|heiß", "1x Pause|kurz"], 6)),
  inScene("brb", text("brbTimerLabel", "Pausenzeit: Beschriftung", BRB, "PAUSE SEIT", 40)),
  inScene("brb", lines("brbLines", "Bon: wechselnde Zeile unten", BRB, ["Gleich geht's weiter", "Der Spieß dreht sich weiter"], 12)),
  inScene("brb", flag("brbTeaOn", "Koch trinkt Tee", BRB, true)),
  inScene("brb", text("brbTicker", "Laufband (leer = aus)", BRB, "Gleich geht's weiter • Der Spieß dreht sich weiter • Noch kurz ziehen lassen", 300)),

  inScene("ending", text("endingTitle", "Titel", ENDING, "Danke und bis morgen!", 60)),
  inScene("ending", text("endingClosed", "Bon: Titel", ENDING, "HEUTE GESCHLOSSEN", 40)),
  inScene("ending", lines("endingItems", "Bon: Posten (Posten|Zusatz)", ENDING, ["1x Stream|aufgegessen", "1x Chat|satt"], 6)),
  inScene("ending", text("endingNextLabel", "Nächster Stream: Beschriftung", ENDING, "NÄCHSTER STREAM", 40)),
  inScene("ending", text("endingNext", "Nächster Stream (leer = ausblenden)", ENDING, "", 60)),
  inScene("ending", flag("endingWaveOn", "Koch winkt zum Abschied", ENDING, true)),
  inScene("ending", flag("shutterOn", "Rollladen", ENDING, true)),
  inScene("ending", text("shutterText", "Rollladen: Schrift", ENDING, "DÖNER KEBAB", 30)),
  inScene("ending", number("shutterStart", "Rollladen fährt herunter nach", ENDING, 1, 0, 60, "s", 0.5)),
  inScene("ending", number("shutterMs", "Rollladen: Dauer", ENDING, 1600, 0, 10000, "ms")),

  // Keys: follows, subs, giftedSubs, raids, raiders, bits, redeems, hypeLevel, chatMessages, chatters, duration
  inScene("stats", text("closingTitle", "Bon: Titel", CLOSING, "TAGESABSCHLUSS", 40)),
  inScene("stats", lines("closingLines", "Zahlen (Schlüssel|Text)", CLOSING, ["follows|Neue Stammkunden", "subs|Abos", "raids|Raids", "bits|Bits", "chatMessages|Bestellungen im Chat"], 12)),
  inScene("stats", number("countUpMs", "Hochzählen: Dauer", CLOSING, 1000, 0, 5000, "ms")),
  inScene("stats", flag("stampOn", "Stempel", CLOSING, true)),
  inScene("stats", text("stampText", "Stempel: Text", CLOSING, "BEZAHLT", 20)),
  inScene("stats", number("stampAt", "Stempel knallt auf nach", CLOSING, 3, 0.5, 60, "s", 0.5)),

  // Per kind: head line, dish, the line under the name (when the viewer wrote nothing) and the item at the bottom
  // (Posten|Zusatz). Placeholders: {user}, {amount}, {detail}, {text}
  choice("alertStyle", "Darstellung", ALERTS, "bon", ALERT_STYLES),
  number("alertWidth", "Breite", ALERTS, 460, 300, 1800, "px"),
  text("followTag", "Follow: Kopfzeile", ALERTS, "NEUER FOLLOW"),
  text("followDish", "Follow: Gericht", ALERTS, "1x Döner"),
  text("followLine", "Follow: Spruch", ALERTS, "Mit alles?"),
  text("followItem", "Follow: Posten", ALERTS, "Follow|gratis"),
  text("subTag", "Sub: Kopfzeile", ALERTS, "NEUES ABO"),
  text("subDish", "Sub: Gericht", ALERTS, "1x Dürüm"),
  text("subLine", "Sub: Spruch", ALERTS, "Ab jetzt Stammkunde!"),
  text("subItem", "Sub: Posten", ALERTS, "Abo|Stammkunde"),
  text("resubTag", "Resub: Kopfzeile", ALERTS, "ABO x{amount}"),
  text("resubDish", "Resub: Gericht", ALERTS, "1x Dönerteller"),
  text("resubLine", "Resub: Spruch", ALERTS, "Wie immer, {user}? Seit {amount} Monaten!"),
  text("resubItem", "Resub: Posten", ALERTS, "{amount} Monate|treu"),
  text("giftTag", "Gift: Kopfzeile", ALERTS, "ABOS VERSCHENKT"),
  text("giftDish", "Gift: Gericht", ALERTS, "Runde für alle"),
  text("giftLine", "Gift: Spruch", ALERTS, "{user} gibt {amount} Döner aus!"),
  text("giftItem", "Gift: Posten", ALERTS, "{amount}x Döner|geschenkt"),
  text("raidTag", "Raid: Kopfzeile", ALERTS, "RAID"),
  text("raidDish", "Raid: Gericht", ALERTS, "Familienplatte"),
  text("raidLine", "Raid: Spruch", ALERTS, "{user} kommt mit {amount} Leuten rein!"),
  text("raidItem", "Raid: Posten", ALERTS, "{amount} Gäste|willkommen"),
  text("cheerTag", "Bits: Kopfzeile", ALERTS, "{amount} BITS"),
  text("cheerDish", "Bits: Gericht", ALERTS, "Extra-Soße"),
  text("cheerLine", "Bits: Spruch", ALERTS, "{amount} Bits auf die Theke!"),
  text("cheerItem", "Bits: Posten", ALERTS, "{amount} Bits|danke"),
  text("redeemTag", "Kanalpunkte: Kopfzeile", ALERTS, "KANALPUNKTE"),
  text("redeemDish", "Kanalpunkte: Gericht", ALERTS, "1x Ayran"),
  text("redeemLine", "Kanalpunkte: Spruch", ALERTS, "{detail} kommt sofort!"),
  text("redeemItem", "Kanalpunkte: Posten", ALERTS, "Punkte|eingelöst"),
  text("hypeTag", "Hype Train: Kopfzeile", ALERTS, "HYPE TRAIN"),
  text("hypeDish", "Hype Train: Gericht", ALERTS, "Grillparty"),
  text("hypeBeginLine", "Hype Train: Start", ALERTS, "Alle an den Grill!"),
  text("hypeEndLine", "Hype Train: Ende", ALERTS, "Grillparty Level {amount} geschafft!"),
  text("hypeItem", "Hype Train: Posten", ALERTS, "Hype|Level {amount}"),
  text("alertNumber", "Bestellnummer ({number})", ALERTS, "Bestellung Nr. {number}", 40),
  text("alertFor", "Wort vor dem Namen", ALERTS, "für", 20),
  flag("alertQuote", "Nachricht statt Spruch zeigen", ALERTS, true),
  text("quoteFormat", "Nachricht ({text})", ALERTS, "„{text}“"),
  number("alertDuration", "Dauer", ALERTS, 7000, 2000, 60000, "ms"),
  flag("alertStamp", "Stempel", ALERTS, true),
  text("alertStampText", "Stempel: Text", ALERTS, "MIT ALLES", 20),
  number("alertStampAt", "Stempel knallt auf nach", ALERTS, 2000, 0, 10000, "ms"),
  flag("alertCrumbs", "Zwiebelringe und Fleischstücke", ALERTS, true),
  // fixed: at most 200 crumbs, every one is drawn every frame
  number("alertCrumbCount", "Zwiebelringe: Anzahl", ALERTS, 34, 0, 200),
  number("alertPrintSteps", "Drucker: Rucke", ALERTS, 16, 1, 40),
  flag("alertSound", "Töne", ALERTS, true),
  ...alertSoundFields(ALERTS),

  choice("chatStyle", "Darstellung", CHAT, "zettel", CHAT_STYLES),
  number("chatMax", "Max. Nachrichten", CHAT, 6, 1, 50),
  number("chatLifetime", "Ausblenden nach (0 = nie)", CHAT, 30, 0, 3600, "s"),
  number("chatWidth", "Breite", CHAT, 480, 200, 1900, "px"),
  choice("chatNameColor", "Farbe der Namen", CHAT, "rot", NAME_COLORS),
  number("chatPrintMs", "Zettel kommt heraus (Dauer)", CHAT, 400, 0, 3000, "ms"),
  number("emoteSize", "Emote-Grösse", CHAT, 28, 8, 120, "px"),
  flag("chatBadges", "Badges zeigen", CHAT, true),
  ...badgeFields(CHAT),

  choice("camStyle", "Darstellung", CAM, "fenster", CAM_STYLES),
  text("camLabel", "Namensschild ({channel}, {shop})", CAM, "{shop}"),
  flag("camAwning", "Markise", CAM, true),
  number("camAwningStripes", "Markise: Streifen", CAM, 8, 2, 30),
  flag("camCounter", "Theke unten", CAM, true),
  number("camBorder", "Rahmenstärke", CAM, 6, 0, 30, "px"),

  choice("musicStyle", "Darstellung", MUSIC, "bon", MUSIC_STYLES),
  text("musicLabel", "Überzeile", MUSIC, "LÄUFT GERADE"),
  text("musicIdle", "Text ohne Wiedergabe", MUSIC, "Gerade keine Musik"),
  flag("musicHide", "Bei Pause ausblenden", MUSIC, true),
  flag("musicCover", "Cover zeigen", MUSIC, true),
  flag("musicProgress", "Fortschritt", MUSIC, true),
  number("musicMarqueeSpeed", "Lange Zeilen: Lauftempo (px pro Sekunde)", MUSIC, 40, 5, 400),
  number("coverSize", "Cover-Grösse", MUSIC, 96, 40, 300, "px"),

  number("fxDuration", "Standarddauer", FX, 4, 0.5, 120, "s", 0.5),
  number("fxSize", "Standardgrösse", FX, 360, 20, 1920, "px"),
  flag("fxText", "Text zeigen", FX, true),
  number("fxTextSize", "Textgrösse", FX, 96, 8, 300, "px"),
  number("fxMargin", "Zufallsposition: Abstand zum Rand", FX, 20, 0, 50, "%"),
  number("fxMax", "Max. gleichzeitig", FX, 8, 1, 30),

  // Commands page (public, /s/<login>/): shared texts from the core with the title of a menu, plus the look
  ...withDefaults(INFO_FIELDS, { infoTitle: "Speisekarte" }),
  number("infoWidth", "Befehlsseite: Breite der Spalte", INFO_GROUP, 900, 400, 1600, "px"),

  // Clips: the stinger (papier or messer) and the profile and offline banners. Placeholders: {shop}, {channel}, {login}
  choice("stingerStyle", "Darstellung", STINGER, "papier", STINGER_STYLES),
  text("stingerText", "Bogenschrift", STINGER, "DÖNER KEBAB", 30),
  number("stingerDuration", "Länge", STINGER, 1.6, 0.5, 5, "s", 0.05),
  number("stingerCut", "Übergangspunkt", STINGER, 0.8, 0.1, 5, "s", 0.05),
  number("stingerTearJag", "Papier: Zacken der Riss-Kante", STINGER, 4, 0, 15, "%", 0.5),
  number("stingerSlices", "Messer: Fleischscheiben", STINGER, 9, 3, 20),
  flag("stingerShavings", "Messer: Späne fliegen", STINGER, true),
  number("stingerSeed", "Startwert", STINGER, 7, 1, 9999),
  text("profileTitle", "Titel", PROFILE_BANNER, "{shop}", 60),
  text("profileSubtitle", "Zeile darunter", PROFILE_BANNER, "Frisch vom Spieß", 80),
  flag("profileSteam", "Dampf über dem Spieß", PROFILE_BANNER, true),
  text("offlineText", "Text auf dem Rollladen", OFFLINE_BANNER, "Heute geschlossen", 60),
  flag("offlineSteam", "Dampf unter dem Rollladen", OFFLINE_BANNER, true),

  // Minimes (core fields plus the look and the own animations of the dishes, dishes.ts). Any of the four own moves
  // makes a dish do its own one (the döner spins, the dürüm unrolls, the lahmacun folds, the fries throw a stick)
  ...MINIME_BASE_FIELDS,
  ...MINIME_HOP_FIELDS,
  number("minimeSize", "Grösse (Höhe)", MINIME_LOOK, 96, 40, 400, "px"),
  number("minimeGround", "Abstand zum unteren Rand", MINIME_LOOK, 12, 0, 300, "px"),
  choice("minimeDefault", "Typ ohne Wahl (alle aus)", MINIME_LOOK, "doener", DISH_TYPES),
  flag("minimeCounter", "Thekenlinie unten", MINIME_LOOK, true),
  flag("minimeLabels", "Namensschilder als Bestellzettel", MINIME_LOOK, true),
  number("minimeLabelSize", "Namensschild: Schriftgrösse", MINIME_LOOK, 16, 8, 48, "px"),
  number("minimeSpinWeight", "Drehen (Döner): Häufigkeit", MINIME_MOVES, 5, 0, 100),
  number("minimeSpinMs", "Drehen (Döner): Dauer", MINIME_MOVES, 1600, 300, 10000, "ms"),
  number("minimeRollWeight", "Aufrollen (Dürüm): Häufigkeit", MINIME_MOVES, 4, 0, 100),
  number("minimeRollMs", "Aufrollen (Dürüm): Dauer", MINIME_MOVES, 2000, 300, 10000, "ms"),
  number("minimeFoldWeight", "Falten (Lahmacun): Häufigkeit", MINIME_MOVES, 4, 0, 100),
  number("minimeFoldMs", "Falten (Lahmacun): Dauer", MINIME_MOVES, 1800, 300, 10000, "ms"),
  number("minimeFriesWeight", "Stäbchen werfen (Pommes): Häufigkeit", MINIME_MOVES, 4, 0, 100),
  number("minimeFriesMs", "Stäbchen werfen (Pommes): Dauer", MINIME_MOVES, 1400, 300, 10000, "ms"),
  number("minimeWaveWeight", "Winken: Häufigkeit", MINIME_MOVES, 3, 0, 100),
  number("minimeWaveMs", "Winken: Dauer", MINIME_MOVES, 1500, 300, 10000, "ms"),
  number("minimeJumpMs", "Reaktion auf Chat (Sprung mit Dampf): Dauer", MINIME_MOVES, 700, 200, 5000, "ms"),
] as const satisfies readonly SettingField[];

// The resolved values as the server generates them (src/generated/themes, npm run gen:types)
export type { KebabValues } from "../../generated/themes/kebab.ts";

const GROUP_SCENES = {
  [GENERAL]: ["starting", "brb", "ending", "stats"],
  [CHEF]: ["starting", "brb", "ending"],
  [STARTING]: ["starting"],
  [BRB]: ["brb"],
  [ENDING]: ["ending"],
  [CLOSING]: ["stats"],
  [ALERTS]: ["alerts"],
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
  [MINIME_HOP]: ["minimes"],
  [MINIME_VARIANTS]: ["minimes"],
  [MINIME_LOOK]: ["minimes"],
  [MINIME_MOVES]: ["minimes"],
  ...TUNING_GROUPS,
} as const;

// On first login: the shop of the streamer, "Rezondes' Döner" for a login ending in s, x or z, else "Neos Döner"
export function shopOf(login: string) {
  const name = login.charAt(0).toUpperCase() + login.slice(1);
  return /[sxz]$/i.test(name) ? `${name}' Döner` : `${name}s Döner`;
}
const personalize = (login: string) => ({ channelName: shopOf(login) });

// Simple view of the dashboard: per area the texts, main colors and switches most streamers change
const BASIC = ["quality", "channelName", "red", "redText", "sawOn", "shavingsOn", "startingItems", "countdownLabel", "countdownDone", "ticker", "brbTitle", "brbTicker", "endingTitle", "endingNext", "closingTitle", "closingLines", "stampText", "alertStyle", "followLine", "subLine", "raidLine", "cheerLine", "alertStampText", "chatStyle", "chatBadges", "camStyle", "camLabel", "musicStyle", "musicLabel", "musicIdle", "fxText", "minimeDefault", "minimeLabels"];

export const kebabSettings: ThemeSchema = { id: "kebab", name: "Kebab", fields: markBasic(withStingerFields([...FIELDS, ...minimeVariantFields(DISH_SET), ...TUNING_FIELDS], STINGER), BASIC), groupScenes: GROUP_SCENES, personalize,
  minimeVariants: DISH_SET,
};
