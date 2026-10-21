// Check for settings.ts (schema of the Dachdecker theme): valid defaults, no dead key, simple view, required keys per
// group, every group mapped to a scene, personal start values. Runs with npm test.
import assert from "node:assert/strict";
import { qualityField } from "../../core/graphicsFields.ts";
import { auditTheme } from "../schemaAudit.ts";
import { dachdeckerSettings } from "./settings.ts";

const fields = dachdeckerSettings.fields;

// Valid defaults and no dead key (every one occurs in the theme code)
const audit = auditTheme(dachdeckerSettings, import.meta.dirname);
assert.deepEqual(audit.errors, []);
assert.deepEqual(audit.unused, [], `unused keys: ${audit.unused.join(", ")}`);
assert.deepEqual(audit.basic, [], `simple view: ${audit.basic.join("; ")}`);

// Required keys per group
const REQUIRED: Record<string, string[]> = {
  "Allgemein": ["channelName", "font", "fontSize", "titleSize", "countSize", "blueprint", "accent", "copper", "line", "quality", "bloom", "bloomStrength", "glow", "scramble", "scrambleMs", "flicker", "flickerEvery", "linesEvery", "card", "slateDark", "rain", "dusk"],
  "Dachstuhl": ["span", "rise", "trusses", "trussGap", "overhang", "lineOpacity", "fillOpacity", "grid", "gridOpacity", "fog", "tileCopperShare", "seed", "cameraRadius", "cameraHeight", "cameraSpeed", "cameraIntro", "buildSpeed"],
  "BRB": ["brbHead", "brbTitle", "brbSubtitle", "brbTimerPrefix", "brbLines", "brbBlock", "brbBlockLines", "brbTileRows", "rainOn", "rainCount", "rainSpeed", "rainLength", "rainOpacity", "splashOn", "splashAmount", "splashGround", "windMax", "windEvery", "lightningOn", "lightningEvery", "lightningStrength", "rainSound", "rainVolume"],
  "Ending": ["endingHead", "endingTitle", "endingSubtitle", "endingNext", "endingBlock", "endingBlockLines", "wallHeight", "windowsOn", "windowStep", "smokeOn", "smokeAmount", "wreathOn", "ribbonColors", "ribbonWind", "fireworksOn", "fireworksEvery", "fireworksSparks", "endingIntro", "endingShift", "protocolOn", "protocolTitle", "protocolLines", "countUpMs", "stampOn", "stampText", "stampAt", "stampSound"],
  "Starting": ["startingHead", "startingTitle", "startingSubtitle", "startingLines", "countdown", "countdownPrefix", "countdownDone", "startingTiles", "startingTileRows", "startingProgress", "startingBlock", "startingBlockLines", "ticker", "tickerSpeed"],
};
for (const [group, required] of Object.entries(REQUIRED)) {
  for (const key of required) assert.equal(fields.find(field => field.key === key)?.group, group, `${key} fehlt in ${group}`);
}

// Every group is mapped to its scenes (Allgemein applies everywhere)
for (const group of new Set(fields.map(field => field.group))) {
  if (group !== "Allgemein") assert.ok(group in (dachdeckerSettings.groupScenes ?? {}), `${group} without a scene`);
}

assert.deepEqual(dachdeckerSettings.personalize?.("neo"), { channelName: "NEO" });

// The performance level is the shared core field (same key, so stored levels stay)
assert.deepEqual(fields.find(field => field.key === "quality"), { ...qualityField("Allgemein"), basic: true });

console.log("dachdecker settings ok");
