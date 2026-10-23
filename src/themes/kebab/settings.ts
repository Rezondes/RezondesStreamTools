// Settings schema of the Kebab theme (DESIGN-KEBAB.md, PLAN-KEBAB.md): a kebab shop as red line art on paper. The only
// place of the theme with fixed colors, texts and numbers. KebabValues is the type of the resolved values that the
// scenes read via useKebab.
import { color, flag, font, inScene, lines, markBasic, number, text } from "../../core/fields.ts";
import { qualityField } from "../../core/graphicsFields.ts";
import { withStingerFields } from "../../core/stingerOptions.ts";
import type { SettingField, ThemeSchema } from "../../core/theme.ts";

const TITLE_FONTS = ["Titan One", "Baloo 2", "Fredoka"] as const;
const TEXT_FONTS = ["Nunito", "DM Sans", "Manrope"] as const;

const GENERAL = "Allgemein";
const CHEF = "Koch und Spieß";
const STARTING = "Starting";
const BRB = "BRB";
const ENDING = "Ending";
const CLOSING = "Tagesabschluss";
const STINGER = "Stinger";

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
  inScene("brb", flag("brbSignOn", "Schild am Spieß", BRB, true)),
  inScene("brb", text("brbSign", "Schild: Text", BRB, "Kurz Tee trinken", 30)),
  inScene("brb", number("brbSignSwing", "Schild: Pendeln", BRB, 3, 0, 20)),
  inScene("brb", text("brbTicker", "Laufband (leer = aus)", BRB, "Gleich geht's weiter • Der Spieß dreht sich weiter • Noch kurz ziehen lassen", 300)),

  inScene("ending", text("endingTitle", "Titel", ENDING, "Danke und bis morgen!", 60)),
  inScene("ending", text("endingClosed", "Bon: Titel", ENDING, "HEUTE GESCHLOSSEN", 40)),
  inScene("ending", lines("endingItems", "Bon: Posten (Posten|Zusatz)", ENDING, ["1x Stream|aufgegessen", "1x Chat|satt"], 6)),
  inScene("ending", text("endingNextLabel", "Nächster Stream: Beschriftung", ENDING, "NÄCHSTER STREAM", 40)),
  inScene("ending", text("endingNext", "Nächster Stream (leer = ausblenden)", ENDING, "", 60)),
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
  [STINGER]: [],
} as const;

// On first login: the shop of the streamer, "Rezondes' Döner" for a login ending in s, x or z, else "Neos Döner"
export function shopOf(login: string) {
  const name = login.charAt(0).toUpperCase() + login.slice(1);
  return /[sxz]$/i.test(name) ? `${name}' Döner` : `${name}s Döner`;
}
const personalize = (login: string) => ({ channelName: shopOf(login) });

// Simple view of the dashboard: per area the texts, main colors and switches most streamers change
const BASIC = ["quality", "channelName", "red", "redText", "sawOn", "shavingsOn", "startingItems", "countdownLabel", "countdownDone", "ticker", "brbTitle", "brbSign", "brbTicker", "endingTitle", "endingNext", "closingTitle", "closingLines", "stampText"];

export const kebabSettings: ThemeSchema = { id: "kebab", name: "Kebab", fields: markBasic(withStingerFields([...FIELDS], STINGER), BASIC), groupScenes: GROUP_SCENES, personalize };
