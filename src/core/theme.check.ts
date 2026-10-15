// Check für theme.ts: jede Szene hat genau eine empfohlene Grösse. Läuft mit npm test.
import assert from "node:assert/strict";
import { SCENE_SIZES, SCENES } from "./theme.ts";

assert.deepEqual(Object.keys(SCENE_SIZES).sort(), [...SCENES].sort());
for (const scene of SCENES) assert.ok(SCENE_SIZES[scene].width > 0 && SCENE_SIZES[scene].height > 0, scene);

console.log("theme ok");
