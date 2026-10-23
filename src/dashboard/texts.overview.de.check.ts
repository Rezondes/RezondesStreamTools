// Check for texts.overview.de.ts: every tab has a name and texts with placeholders insert the values. Runs with npm test.
import assert from "node:assert/strict";
import { OBS_TEXTS, OFFLINE_TEXTS, OVERVIEW_TEXTS } from "./texts.overview.de.ts";

for (const name of Object.values(OVERVIEW_TEXTS.tabs)) assert.ok(name.length > 0);
assert.equal(OBS_TEXTS.collection("neo"), "Overlays neo");
assert.ok(OBS_TEXTS.done(7).includes("7"));
assert.ok(OBS_TEXTS.failed("kaputt").endsWith("kaputt"));

assert.ok(OFFLINE_TEXTS.saved("a.html").startsWith("a.html"));
assert.ok(OFFLINE_TEXTS.recordTitle("BRB", 30).includes("30 s"));
assert.ok(OFFLINE_TEXTS.recording(12).includes("12 s"));
assert.ok(OFFLINE_TEXTS.recorded("a.webm, a.mp4").endsWith("a.mp4"));

console.log("texts overview ok");
