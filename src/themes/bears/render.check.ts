// Check for render.ts of the Bärenbande theme: no clips yet, for any values and login. Runs with npm test.
import assert from "node:assert/strict";
import { resolveSettings } from "../../core/settings.ts";
import { findModule } from "../registry.ts";
import { bearsSettings } from "./settings.ts";

assert.deepEqual(findModule("bears")?.clips(resolveSettings(bearsSettings, {}), "rezondes"), []);

console.log("bears render ok");
