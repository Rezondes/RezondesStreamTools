// Check for theme.ts: every scene has exactly one recommended size. Runs with npm test.
import assert from "node:assert/strict";
import { SCENE_SIZES, SCENES } from "./theme.ts";

assert.deepEqual(Object.keys(SCENE_SIZES).sort(), [...SCENES].sort());
for (const scene of SCENES) assert.ok(SCENE_SIZES[scene].width > 0 && SCENE_SIZES[scene].height > 0, scene);

console.log("theme ok");
