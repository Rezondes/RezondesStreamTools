// Check for settings.ts (schema of the KOTH theme): valid defaults, no dead key, required keys per group, chat names and
// fight durations for every role, three factions with names, label and color, fixed places without wandering, every group
// mapped to a scene. Runs with npm test.
import assert from "node:assert/strict";
import { hasMinimes, MEDIC, minimeAimKey, minimeFireKey, minimeNamesKey, minimeTeamColorKey, minimeTeamLabelKey, minimeTeamNamesKey } from "../../core/minimeFields.ts";
import { normalizeName } from "../../core/minimes.ts";
import { auditTheme } from "../schemaAudit.ts";
import { kothSettings, TEAM_SET } from "./settings.ts";
import { ROLE_IDS, ROLES } from "./soldiers3d.ts";

const fields = kothSettings.fields;
const keys = new Set(fields.map(field => field.key));
const defaultOf = (key: string) => fields.find(field => field.key === key)?.default;

// Valid defaults and no dead key (every one occurs in the theme code)
const audit = auditTheme(kothSettings, import.meta.dirname);
assert.deepEqual(audit.errors, []);
assert.deepEqual(audit.unused, [], `unused keys: ${audit.unused.join(", ")}`);
assert.deepEqual(audit.basic, [], `simple view: ${audit.basic.join("; ")}`);

// Required keys per group
const REQUIRED: Record<string, string[]> = {
  "Allgemein": ["channelName", "font", "titleFont", "olive", "sand", "steel", "paper", "ink", "accent", "accent2", "radius", "fadeDuration"],
  "Hügel": ["skyNightTop", "sun", "moon", "mountains", "hillColor", "tower", "flagColor", "sandbags", "smoke", "dust"],
  "Starting, BRB, Ending": ["startingTitle", "brbTitle", "endingTitle", "mapGrid", "countdown", "progressStyle", "startingLines", "ticker", "briefingMapOn", "radioLinesOn"],
  "Welt": ["quality", "worldSeed", "skyTop", "skyHorizon", "fogNear", "fogFar", "sunColor", "bloomStrength", "shadows", "hillHeight", "sandColor"],
  "Lager": ["mastHeight", "mastWires", "flagFaction", "flagSize", "bunkerOn", "tents", "trees", "rocks", "jeepOn", "helicopterOn", "smokeColumns", "dustAmount"],
  "Kamera": ["cameraIntro", "cameraRadius", "cameraHeight", "cameraSpeed", "buildSpeed"],
  "BRB: Nacht": ["brbSkyTop", "brbSkyHorizon", "moonOn", "searchlightOn", "searchlightFrom", "searchlightTo", "campfireOn", "brbCameraHeight"],
  "Ending: Abend": ["endingSkyTop", "endingSkyHorizon", "flaresOn", "flaresEvery", "flareSparks", "flareSound", "reportOn", "reportLines", "countUpMs", "stampText", "stampAt"],
  "Alerts": ["alertStyle", "alertCallsign", "followLine", "followIcon", "hypeEndLine", "alertDuration", "alertIn", "alertOut", "alertTimer", "alertStatic", "soundFollow", "soundLeave"],
  "Chat": ["chatStyle", "chatTime", "chatFade", "chatMax", "chatAlign"],
  "Kamera-Rahmen": ["camStyle", "camMarks", "camCross", "camBattery", "camLabel", "camLive"],
  "Musik": ["musicStyle", "coverShape", "equalizer", "musicHide", "musicMarquee"],
  "Effekte": ["fxDuration", "fxSize", "fxIn", "fxOut", "fxBubble"],
  "Stinger": ["stingerDuration", "stingerCut", "stingerText", "stingerFlag", "smokeColor"],
  "Banner": ["bannerTitle", "bannerProfileText", "bannerOfflineTitle", "bannerOfflineLines"],
  "Minimes: Aussehen": ["soldierSize", "soldierFaces", "helmet", "weapon", "medicCross", "dustColor", "soldierDefault", "soldierNameStyle", "holderBanner", "holderText", "contestedText"],
  "Minimes: Animationen": ["sightWeight", "reloadWeight", "coverWeight", "proneWeight", "lookWeight", "saluteWeight", "cheerMs"],
  "Minimes: Fraktionen": ["minimeTeamCommand"],
  "Minimes: Gefechte": ["minimeCombat", "minimeHitChance", "minimeDownMs", "minimeReviveMs"],
};
for (const [group, required] of Object.entries(REQUIRED)) {
  for (const key of required) assert.equal(fields.find(field => field.key === key)?.group, group, `${key} fehlt in ${group}`);
}

// Fixed places at the hill, no wandering, no hop fields
assert.equal(defaultOf("minimePlacement"), "slots");
assert.equal(defaultOf("minimeWalkWeight"), 0);
assert.ok(!keys.has("hopMs"));

// Every role has names in chat, every one except the medic aims and fires
for (const id of ROLE_IDS) {
  assert.ok(keys.has(minimeNamesKey(id)), `${id} without names`);
  assert.equal(keys.has(minimeAimKey(id)), id !== MEDIC, id);
  assert.equal(keys.has(minimeFireKey(id)), id !== MEDIC, id);
}

// Three factions with names, label and color; their names in chat are normalized and differ from the role names
assert.deepEqual(TEAM_SET.variants.map(team => team.id), ["blufor", "opfor", "indfor"]);
for (const team of TEAM_SET.variants) {
  for (const key of [minimeTeamNamesKey(team.id), minimeTeamLabelKey(team.id), minimeTeamColorKey(team.id)]) assert.ok(keys.has(key), `${key} fehlt`);
  for (const name of team.names) assert.equal(normalizeName(name), name, name);
}
const roleNames = new Set(ROLES.flatMap(role => role.names));
assert.ok(TEAM_SET.variants.every(team => team.names.every(name => !roleNames.has(name))));

// Every group is mapped to its scenes (Allgemein applies everywhere)
for (const group of new Set(fields.map(field => field.group))) {
  if (group !== "Allgemein") assert.ok(group in (kothSettings.groupScenes ?? {}), `${group} without a scene`);
}

assert.equal(hasMinimes(kothSettings), true);
assert.equal(kothSettings.minimeVariants?.command, "!rolle");
assert.equal(kothSettings.minimeTeams?.command, "!team");

console.log("koth settings ok");
