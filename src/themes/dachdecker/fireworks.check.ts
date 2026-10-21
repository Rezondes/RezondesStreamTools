// Check for fireworks.ts of the Dachdecker theme: bursts are pure in the time, start at their times, fade and spread.
// Runs with npm test.
import assert from "node:assert/strict";
import { BURST_LIFE, bursts } from "./fireworks.ts";

// Nothing before the start, a burst after it
assert.deepEqual(bursts(7, 1, 6.4, 2.5, 110), []);
const now = bursts(7, 7.2, 6.4, 2.5, 110);
assert.ok(now.length >= 1);
assert.equal(now[0].points.length, 110 * 3);
// Pure in the time: same inputs, same points
assert.deepEqual(bursts(7, 7.2, 6.4, 2.5, 110), now);
assert.notDeepEqual(bursts(8, 7.2, 6.4, 2.5, 110)[0]?.points, now[0].points);
// Later the sparks are spread wider and the burst fades; after its life it is gone
const spread = (points: Float32Array) => Math.max(...points.filter((_, index) => index % 3 === 0)) - Math.min(...points.filter((_, index) => index % 3 === 0));
// One burst only (every 100 s): find its start, then compare two ages
const begin = Array.from({ length: 2000 }, (_, step) => -30 + step * 0.05).find(time => bursts(7, time, 6.4, 100, 50).length > 0)!;
const first = bursts(7, begin + 0.1, 6.4, 100, 50)[0];
const later = bursts(7, begin + 1.5, 6.4, 100, 50)[0];
assert.ok(first && later && spread(later.points) > spread(first.points) && later.life < first.life);
assert.deepEqual(bursts(7, begin + BURST_LIFE + 0.1, 6.4, 100, 50), []);
// Over a minute there are bursts again and again
assert.ok(Array.from({ length: 60 }, (_, second) => bursts(7, 10 + second, 6.4, 2.5, 10).length).filter(Boolean).length > 30);

console.log("dachdecker fireworks ok");
