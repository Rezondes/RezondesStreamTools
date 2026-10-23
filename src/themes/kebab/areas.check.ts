// Check of areas.ts: the source of the stream numbers grows with the rows of the closing bon. Runs with npm test.
import assert from "node:assert/strict";
import { resolveSettings } from "../../core/settings.ts";
import { kebabAreas } from "./areas.ts";
import { kebabSettings } from "./settings.ts";

const areas = (changes: Record<string, unknown>) => kebabAreas(resolveSettings(kebabSettings, changes));

assert.deepEqual(areas({}).stats, { width: 460, height: 580 }, "five rows");
assert.deepEqual(areas({ closingLines: ["follows|Neue Stammkunden"] }).stats, { width: 460, height: 428 }, "one row");

console.log("kebab areas ok");
