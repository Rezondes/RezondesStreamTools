// Check for swell.ts: coming in the crest runs from left to right, going out from right to left, between the two there
// is no swell; the water is 0 at both ends of the stretch; the card reaches its place when the crest reaches the middle.
// Runs with npm test.
import assert from "node:assert/strict";
import { MIDDLE, STRETCH, swellAt, waterHeight } from "./swell.ts";

const timing = { inSeconds: 1.3, leave: 5.9, outSeconds: 1.3, height: 300 };

// Welle je Phase: left to right coming in, right to left going out, none before, between and after
const early = swellAt(0.3, timing)!;
const later = swellAt(0.9, timing)!;
assert.ok(early.direction === 1 && later.crest > early.crest);
const away = swellAt(6.2, timing)!;
const gone = swellAt(6.8, timing)!;
assert.ok(away.direction === -1 && gone.crest < away.crest);
for (const time of [0, 1.3, 3, 5.9, 7.3, 9]) assert.equal(swellAt(time, timing), null, `t = ${time}`);
// Highest halfway, as high as asked
assert.ok(Math.abs(swellAt(0.65, timing)!.height - 300) < 1e-9);
assert.ok(early.height < 300);

// The water: 0 at and past both ends, highest at the crest, the steep front falls faster than the long back
for (const x of [STRETCH.from, STRETCH.to, STRETCH.from - 50, STRETCH.to + 50]) assert.equal(waterHeight(x, later), 0);
const crest = waterHeight(later.crest, later);
assert.ok(crest > waterHeight(later.crest + 150, later) && crest > waterHeight(later.crest - 150, later));
assert.ok(waterHeight(later.crest + 150, later) < waterHeight(later.crest - 150, later));

// The crest reaches the middle of the stretch at its share of the way in
const atMiddle = timing.inSeconds * ((MIDDLE - STRETCH.from) / (STRETCH.to - STRETCH.from));
assert.ok(Math.abs(swellAt(atMiddle, timing)!.crest - MIDDLE) < 1e-9);

console.log("urlaub swell ok");
