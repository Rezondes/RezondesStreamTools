// Check for render.ts of the Dachdecker theme: no clips until package 4 brings stinger and banners. Runs with npm test.
import assert from "node:assert/strict";
import { dachdeckerClips } from "./render.ts";

assert.deepEqual(dachdeckerClips(), []);

console.log("dachdecker render ok");
