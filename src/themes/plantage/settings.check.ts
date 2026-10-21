// Check for settings.ts (schema of the Plantage theme): valid defaults, no dead key, required keys per group, chat names
// and fight durations for every role, every group mapped to a scene. Runs with npm test.
import assert from "node:assert/strict";
import { hasMinimes, MEDIC, minimeAimKey, minimeFireKey, minimeNamesKey } from "../../core/minimeFields.ts";
import { auditTheme } from "../schemaAudit.ts";
import { ROLE_IDS } from "./mangos.ts";
import { plantageSettings } from "./settings.ts";

const fields = plantageSettings.fields;
const keys = new Set(fields.map(field => field.key));
const defaultOf = (key: string) => fields.find(field => field.key === key)?.default;

// Valid defaults and no dead key (every one occurs in the theme code)
const audit = auditTheme(plantageSettings, import.meta.dirname);
assert.deepEqual(audit.errors, []);
assert.deepEqual(audit.unused, [], `unused keys: ${audit.unused.join(", ")}`);
assert.deepEqual(audit.basic, [], `simple view: ${audit.basic.join("; ")}`);

// Required keys per group
const REQUIRED: Record<string, string[]> = {
  "Allgemein": ["channelName", "font", "titleFont", "wood", "soil", "leaf", "trunk", "mango", "mangoBlush", "accent", "accent2", "radius", "fadeDuration"],
  "Plantage": ["skyNightTop", "sun", "moon", "clouds", "hills", "treeSway", "mangosOnTrees", "crates", "crateName"],
  "Starting, BRB, Ending": ["startingTitle", "brbTitle", "endingTitle", "picker", "pickerSide", "countdown", "progressStyle", "startingLines", "ticker", "tickerStyle", "brbPickEvery"],
  "Alerts": ["alertStyle", "followLine", "followIcon", "hypeEndLine", "alertDuration", "alertMangoOn", "alertGap", "alertTimer", "leafConfetti", "juice", "soundFollow", "soundLeave"],
  "Chat": ["chatStyle", "chatFade", "chatMax", "chatAlign", "chatSway"],
  "Kamera-Rahmen": ["camStyle", "camLeaves", "camMango", "camLabel", "camLive"],
  "Musik": ["musicStyle", "coverShape", "equalizer", "musicHide", "musicMarquee"],
  "Effekte": ["fxDuration", "fxSize", "fxIn", "fxOut", "fxBubble"],
  "Stinger": ["stingerDuration", "stingerCut", "stingerText", "stingerLeaves"],
  "Banner": ["bannerTitle", "bannerProfileText", "bannerOfflineTitle", "bannerOfflineLines"],
  "Minimes: Aussehen": ["mangoSize", "mangoFaces", "helmet", "weapon", "medicCross", "muzzle", "mangoDefault", "mangoNameStyle", "mangoEnter", "mangoExit"],
  "Minimes: Hüpfen": ["hopHeight", "hopMs", "hopSquash"],
  "Minimes: Animationen": ["reloadWeight", "helmetWeight", "lookWeight", "sleepWeight", "cheerMs", "cheerHeight"],
  "Minimes: Gefechte": ["minimeCombat", "minimeHitChance", "minimeDownMs", "minimeReviveMs"],
};
for (const [group, required] of Object.entries(REQUIRED)) {
  for (const key of required) assert.equal(fields.find(field => field.key === key)?.group, group, `${key} fehlt in ${group}`);
}

// Every role has names in chat, every one except the medic aims and fires; the sniper aims long, the MG fires long
for (const id of ROLE_IDS) {
  assert.ok(keys.has(minimeNamesKey(id)), `${id} without names`);
  assert.equal(keys.has(minimeAimKey(id)), id !== MEDIC, id);
  assert.equal(keys.has(minimeFireKey(id)), id !== MEDIC, id);
}
assert.equal(defaultOf(minimeAimKey("sniper")), 1600);
assert.equal(defaultOf(minimeFireKey("mg")), 1400);

// Every group is mapped to its scenes (Allgemein applies everywhere)
for (const group of new Set(fields.map(field => field.group))) {
  if (group !== "Allgemein") assert.ok(group in (plantageSettings.groupScenes ?? {}), `${group} without a scene`);
}

// Minimes with the roles as variants, chosen with !rolle
assert.equal(hasMinimes(plantageSettings), true);
assert.equal(plantageSettings.minimeVariants?.command, "!rolle");
assert.equal(plantageSettings.minimeVariants?.variants.length, 5);

console.log("plantage settings ok");
