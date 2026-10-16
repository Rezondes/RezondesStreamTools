// Check für settings.ts (Schema des Südfrucht-Themes): gültige Standardwerte, kein toter Schlüssel, Pflichtschlüssel je
// Gruppe, Farben und Chat-Namen für jede Frucht, jede Gruppe einer Szene zugeordnet. Läuft mit npm test.
import assert from "node:assert/strict";
import { hasMinimes, minimeNamesKey } from "../../core/minimeFields.ts";
import { auditTheme } from "../schemaAudit.ts";
import { FRUIT_IDS } from "./fruits.ts";
import { fruitColorKeys, suedfruchtSettings } from "./settings.ts";

const fields = suedfruchtSettings.fields;
const keys = new Set(fields.map(field => field.key));

// Gültige Standardwerte und kein toter Schlüssel (jeder kommt im Theme-Code vor)
const audit = auditTheme(suedfruchtSettings, import.meta.dirname);
assert.deepEqual(audit.errors, []);
assert.deepEqual(audit.unused, [], `unbenutzte Schlüssel: ${audit.unused.join(", ")}`);

// Pflichtschlüssel je Gruppe
const REQUIRED: Record<string, string[]> = {
  "Allgemein": ["channelName", "font", "titleFont", "wood", "sea", "sand", "palmLeaf", "accent", "accent2", "radius", "fadeDuration"],
  "Kulisse": ["timeStarting", "timeBrb", "timeEnding", "skyNightTop", "sun", "moon", "clouds", "waveLayers", "waveSpeed", "palmsLeft", "palmsRight", "palmSway", "boat", "gulls", "shells", "sandName"],
  "Starting, BRB, Ending": ["startingTitle", "brbTitle", "endingTitle", "signStyle", "countdown", "progressStyle", "startingLines", "brbLines", "endingLines", "ticker", "tickerStyle", "powerOn"],
  "Alerts": ["alertStyle", "followLine", "followIcon", "hypeEndLine", "alertDuration", "alertIn", "alertOut", "alertTimer", "petals", "splash", "soundFollow", "soundLeave"],
  "Chat": ["chatStyle", "chatFade", "chatMax", "chatAlign", "chatSway"],
  "Kamera-Rahmen": ["camStyle", "camLeaves", "camFlower", "camLabel", "camLive"],
  "Musik": ["musicStyle", "coverShape", "equalizer", "musicHide", "musicMarquee", "musicMarqueeSpeed"],
  "Effekte": ["fxDuration", "fxSize", "fxIn", "fxOut", "fxBubble"],
  "Stinger": ["stingerDuration", "stingerCut", "stingerText", "stingerWaves", "stingerFoam", "stingerPalm"],
  "Banner": ["bannerTitle", "bannerProfileText", "bannerOfflineTitle", "bannerOfflineLines", "bannerLoop"],
  "Minimes: Aussehen": ["fruitSize", "fruitFaces", "fruitDefault", "fruitNameStyle", "fruitEnter", "fruitExit"],
  "Minimes: Hüpfen": ["hopHeight", "hopMs", "hopSquash"],
  "Minimes: Animationen": ["bounceWeight", "spinWeight", "wobbleWeight", "sunglassesWeight", "lookWeight", "sleepWeight", "splashMs"],
};
for (const [group, required] of Object.entries(REQUIRED)) {
  for (const key of required) assert.equal(fields.find(field => field.key === key)?.group, group, `${key} fehlt in ${group}`);
}

// Jede Frucht hat Haupt- und Detailfarbe und Namen im Chat
for (const id of FRUIT_IDS) {
  for (const key of [fruitColorKeys(id).main, fruitColorKeys(id).detail, minimeNamesKey(id)]) assert.ok(keys.has(key), `${key} fehlt`);
}

// Jede Gruppe ist ihren Szenen zugeordnet (Allgemein gilt überall)
for (const group of new Set(fields.map(field => field.group))) {
  if (group !== "Allgemein") assert.ok(group in (suedfruchtSettings.groupScenes ?? {}), `${group} ohne Szene`);
}

// Minimes mit Früchten als Typen
assert.equal(hasMinimes(suedfruchtSettings), true);
assert.equal(suedfruchtSettings.minimeVariants?.variants.length, 16);

console.log("suedfrucht settings ok");
