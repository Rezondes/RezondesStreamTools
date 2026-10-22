// Check for texts.overview.de.ts: every tab has a name and texts with placeholders insert the values. Runs with npm test.
import assert from "node:assert/strict";
import { OBS_TEXTS, OVERVIEW_TEXTS } from "./texts.overview.de.ts";

for (const name of Object.values(OVERVIEW_TEXTS.tabs)) assert.ok(name.length > 0);
assert.equal(OBS_TEXTS.collection("neo"), "Overlays neo");
assert.ok(OBS_TEXTS.done(7).includes("7"));
assert.ok(OBS_TEXTS.failed("kaputt").endsWith("kaputt"));

console.log("texts overview ok");
