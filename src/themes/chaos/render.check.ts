// Check for render.ts: the Chaos theme brings no clip yet (stinger and banners follow in package 4). Runs with npm test.
import assert from "node:assert/strict";
import { chaosClips } from "./render.ts";

assert.deepEqual(chaosClips(), []);

console.log("chaos render ok");
