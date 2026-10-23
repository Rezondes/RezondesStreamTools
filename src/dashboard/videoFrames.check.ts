// Check of videoFrames.ts: key color away from the theme, keyed pixels, video length
import assert from "node:assert/strict";
import { keyColorFor, keyHex, keyPixels, LONGEST_VIDEO, videoSeconds } from "./videoFrames.ts";

// A green theme gets magenta or blue, a magenta one green; without colors the first candidate
assert.notDeepEqual(keyColorFor({ accent: "#39ff14", text: "#00cc00" }), [0, 255, 0]);
assert.deepEqual(keyColorFor({ accent: "#ff2bd6", accent2: "#cc00cc" }), [0, 255, 0]);
assert.deepEqual(keyColorFor({ title: "kein Farbwert" }), [0, 255, 0]);
assert.equal(keyHex([0, 255, 128]), "00ff80");

// The key turns transparent, a far color stays, a mix in between is half covered with the key taken out
const key = [0, 255, 0] as const;
const pixels = new Uint8ClampedArray([0, 255, 0, 255, 200, 40, 40, 255, 100, 177, 20, 255]);
keyPixels(pixels, key);
assert.equal(pixels[3], 0, "the key is transparent");
assert.deepEqual([...pixels.slice(4, 8)], [200, 40, 40, 255], "a far color stays as it is");
assert.ok(pixels[11] > 0 && pixels[11] < 255, "a mix is partly covered");
assert.ok(pixels[9] < 177, "and loses green");

// Starting follows its countdown, the others the loop; never longer than the longest video
assert.equal(videoSeconds("starting", { countdown: 300 }, 30), 300);
assert.equal(videoSeconds("starting", { countdown: 0 }, 30), 30);
assert.equal(videoSeconds("brb", { countdown: 300 }, 45), 45);
assert.equal(videoSeconds("starting", { countdown: 7200 }, 30), LONGEST_VIDEO);
assert.equal(videoSeconds("cam", {}, 0), 1);

console.log("videoFrames ok");
