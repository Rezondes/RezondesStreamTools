// Check for settings.ts (schema of the Urlaub theme): valid defaults, no dead key, required keys per
// group, colors and chat names for every beach thing, every group mapped to a scene. Runs with npm test.
import assert from "node:assert/strict";
import { hasMinimes, minimeNamesKey } from "../../core/minimeFields.ts";
import { auditTheme } from "../schemaAudit.ts";
import { THING_IDS } from "./beachThings.ts";
import { thingColorKeys, urlaubSettings } from "./settings.ts";

const fields = urlaubSettings.fields;
const keys = new Set(fields.map(field => field.key));

// Valid defaults and no dead key (every one occurs in the theme code)
const audit = auditTheme(urlaubSettings, import.meta.dirname);
assert.deepEqual(audit.errors, []);
assert.deepEqual(audit.unused, [], `unused keys: ${audit.unused.join(", ")}`);

// Required keys per group
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

// Every beach thing has main and detail color and names in chat
for (const id of THING_IDS) {
  for (const key of [thingColorKeys(id).main, thingColorKeys(id).detail, minimeNamesKey(id)]) assert.ok(keys.has(key), `${key} fehlt`);
}

// Every group is mapped to its scenes (Allgemein applies everywhere)
for (const group of new Set(fields.map(field => field.group))) {
  if (group !== "Allgemein") assert.ok(group in (urlaubSettings.groupScenes ?? {}), `${group} without a scene`);
}

// Minimes with beach things as variants, chosen with !typ
assert.equal(hasMinimes(urlaubSettings), true);
assert.equal(urlaubSettings.minimeVariants?.variants.length, 16);

console.log("urlaub settings ok");
