// Check of areas.ts: the source of the stream numbers grows with the rows of the closing bon. Runs with npm test.
import assert from "node:assert/strict";
import { resolveSettings } from "../../core/settings.ts";
import { kebabAreas } from "./areas.ts";
import { kebabSettings } from "./settings.ts";

const areas = (changes: Record<string, unknown>) => kebabAreas(resolveSettings(kebabSettings, changes));

assert.deepEqual(areas({}).stats, { width: 460, height: 580 }, "five rows");
assert.deepEqual(areas({ closingLines: ["follows|Neue Stammkunden"] }).stats, { width: 460, height: 428 }, "one row");

// The alert: the bon on the stage with room for the crumbs; the bag is a little narrower but taller
assert.deepEqual(areas({}).alerts, { width: 780, height: 660, offset: { x: 570, y: 48 } });
assert.deepEqual(areas({ alertStyle: "tuete" }).alerts, { width: 760, height: 700, offset: { x: 580, y: 48 } });
// The width setting: a wider bon keeps its height, a narrower one wraps and grows taller, the bag grows with it
assert.deepEqual(areas({ alertWidth: 920 }).alerts, { width: 1240, height: 660, offset: { x: 340, y: 48 } });
assert.deepEqual(areas({ alertWidth: 345 }).alerts, { width: 666, height: 860, offset: { x: 627, y: 48 } });
assert.deepEqual(areas({ alertStyle: "tuete", alertWidth: 920 }).alerts, { width: 1200, height: 1032, offset: { x: 360, y: 48 } }, "at most down to the bottom of the stage");
assert.deepEqual(areas({ chatWidth: 600 }).chat?.width, 600);
assert.ok((areas({ coverSize: 300 }).music?.height ?? 0) > (areas({ musicCover: false }).music?.height ?? 0), "a big cover makes the music taller");

console.log("kebab areas ok");
