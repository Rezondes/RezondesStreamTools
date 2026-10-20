// Check for settings.ts (schema of the Bärenbande theme): valid defaults, no dead key, required keys per group, the bear
// choice per scene, every group mapped to a scene, personalize. Runs with npm test.
import assert from "node:assert/strict";
import { hasMinimes, minimeNamesKey, STACK_LEVEL_KEYS } from "../../core/minimeFields.ts";
import { auditTheme } from "../schemaAudit.ts";
import { BEAR_CHOICES, BEAR_IDS } from "./bears.ts";
import { bearsSettings } from "./settings.ts";

const fields = bearsSettings.fields;

// Valid defaults and no dead key (every one occurs in the theme code)
const audit = auditTheme(bearsSettings, import.meta.dirname);
assert.deepEqual(audit.errors, []);
assert.deepEqual(audit.unused, [], `unused keys: ${audit.unused.join(", ")}`);
assert.deepEqual(audit.basic, [], `simple view: ${audit.basic.join("; ")}`);

// Required keys per group
const REQUIRED: Record<string, string[]> = {
  // The bear fields are general (no own group "Bären" in every scene)
  "Allgemein": [
    "channelName", "font", "titleFont", "outline", "outlineWidth", "paper", "paperShade", "accent", "accentText", "accent2", "radius", "facing",
    "iceFur", "iceShade", "grizzlyFur", "grizzlyShade", "pandaFur", "pandaShade", "pandaPatch", "pandaPatchShade", "bearEye", "bearNose", "blinkEvery", "breathe", "towerSway",
  ],
  "Welt": ["timeStarting", "timeBrb", "timeEnding", "skyNightTop", "sun", "moon", "cloudCount", "meadow", "fir", "city", "bridge", "cave", "paperGrain", "sketchLines"],
  "Starting, BRB, Ending": ["bearStarting", "bearBrb", "bearEnding", "bearSize", "bearSide", "startingTitle", "brbSign", "countdown", "progressStyle", "ticker", "powerOn"],
  "Alerts": ["bearAlerts", "alertBearSize", "followLine", "followIcon", "hypeEndLine", "alertDuration", "alertIn", "alertOut", "alertTimer", "confetti", "soundFollow", "soundLeave"],
  "Chat": ["bearChat", "chatStyle", "chatFade", "chatMax", "chatAlign", "chatBearSize", "chatPhoneWidth"],
  "Kamera-Rahmen": ["bearCam", "camStyle", "camBearSpot", "camBearSize", "camLabel", "camLive"],
  "Musik": ["bearMusic", "musicStyle", "coverShape", "equalizer", "musicHide", "musicBearSize", "bopStrength"],
  "Effekte": ["bearFx", "fxStyle", "fxBearSize", "fxDuration", "fxSize", "fxIn", "fxOut"],
  "Befehlsseite": ["bearInfo", "timeInfo"],
};
for (const [group, required] of Object.entries(REQUIRED)) {
  for (const key of required) assert.equal(fields.find(field => field.key === key)?.group, group, `${key} fehlt in ${group}`);
}

// The full-screen scenes offer every bear and the tower; Starting Grizzly, BRB Eisbär, Ending Panda
for (const [key, value] of [["bearStarting", "grizzly"], ["bearBrb", "eisbaer"], ["bearEnding", "panda"]]) {
  const field = fields.find(candidate => candidate.key === key);
  assert.ok(field?.type === "select");
  assert.deepEqual(field.options, [...BEAR_CHOICES]);
  assert.equal(field.default, value);
}

// Chat and effects offer only single bears, every other bear choice also the tower
const optionsOf = (key: string) => { const field = fields.find(candidate => candidate.key === key); return field?.type === "select" ? field.options : []; };
for (const key of ["bearChat", "bearFx"]) assert.deepEqual(optionsOf(key), [...BEAR_IDS], key);
for (const key of ["bearAlerts", "bearCam", "bearMusic", "bearInfo"]) assert.deepEqual(optionsOf(key), [...BEAR_CHOICES], key);

// Every group is mapped to its scenes (Allgemein applies everywhere)
for (const group of new Set(fields.map(field => field.group))) {
  if (group !== "Allgemein") assert.ok(group in (bearsSettings.groupScenes ?? {}), `${group} without a scene`);
}

// Minimes: the core fields, one names field per bear, the three bears as variants, the scene for every minime group
assert.ok(hasMinimes(bearsSettings));
for (const id of BEAR_IDS) assert.ok(fields.some(field => field.key === minimeNamesKey(id)), `${minimeNamesKey(id)} fehlt`);
assert.deepEqual(bearsSettings.minimeVariants?.variants.map(variant => variant.id), [...BEAR_IDS]);
for (const key of ["minimeBearSize", "minimeDefault", "waddleAngle", "minimeEnter"]) assert.equal(fields.find(field => field.key === key)?.group, "Minimes: Aussehen", key);
for (const [group, scenes] of Object.entries(bearsSettings.groupScenes ?? {})) if (group.startsWith("Minimes")) assert.deepEqual(scenes, ["minimes"], group);

// Towers: on, Eisbär at the bottom, Panda in the middle, Grizzly on top; a step height per bear
const defaultOf = (key: string) => fields.find(field => field.key === key)?.default;
assert.deepEqual(["minimeStack", ...STACK_LEVEL_KEYS].map(defaultOf), [true, "eisbaer", "panda", "grizzly"]);
for (const key of ["stackFit", "stackSway", "stackSwayMs", "stackNameOffset", "minimeOutlineWidth"]) assert.equal(fields.find(field => field.key === key)?.group, "Minimes: Aussehen", key);

assert.ok(!fields.some(field => field.group === "Bären") && !("Bären" in (bearsSettings.groupScenes ?? {})));

// First login: channel name from the login with a capital first letter
assert.deepEqual(bearsSettings.personalize?.("neo_42"), { channelName: "Neo_42" });

console.log("bears settings ok");
