// Check for settings.ts (schema of the Bärenbande theme): valid defaults, no dead key, required keys per group, the bear
// choice per scene, every group mapped to a scene, personalize. Runs with npm test.
import assert from "node:assert/strict";
import { auditTheme } from "../schemaAudit.ts";
import { BEAR_CHOICES } from "./bears.ts";
import { bearsSettings } from "./settings.ts";

const fields = bearsSettings.fields;

// Valid defaults and no dead key (every one occurs in the theme code)
const audit = auditTheme(bearsSettings, import.meta.dirname);
assert.deepEqual(audit.errors, []);
assert.deepEqual(audit.unused, [], `unused keys: ${audit.unused.join(", ")}`);

// Required keys per group
const REQUIRED: Record<string, string[]> = {
  "Allgemein": ["channelName", "font", "titleFont", "outline", "outlineWidth", "paper", "paperShade", "accent", "accentText", "accent2", "radius", "facing"],
  "Bären": ["iceFur", "iceShade", "grizzlyFur", "grizzlyShade", "pandaFur", "pandaShade", "pandaPatch", "pandaPatchShade", "bearEye", "bearNose", "blinkEvery", "breathe", "towerSway"],
  "Welt": ["timeStarting", "timeBrb", "timeEnding", "skyNightTop", "sun", "moon", "cloudCount", "meadow", "fir", "city", "bridge", "cave", "paperGrain", "sketchLines"],
  "Starting, BRB, Ending": ["bearStarting", "bearBrb", "bearEnding", "bearSize", "bearSide", "startingTitle", "brbSign", "countdown", "progressStyle", "ticker", "powerOn"],
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

// Every group is mapped to its scenes (Allgemein applies everywhere)
for (const group of new Set(fields.map(field => field.group))) {
  if (group !== "Allgemein") assert.ok(group in (bearsSettings.groupScenes ?? {}), `${group} without a scene`);
}

// First login: channel name from the login with a capital first letter
assert.deepEqual(bearsSettings.personalize?.("neo_42"), { channelName: "Neo_42" });

console.log("bears settings ok");
