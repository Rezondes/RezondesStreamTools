// Check for edgeTrace.ts of the standard theme: the gradient edge of the alert card draws itself once around, and the
// sparks start on that edge, fly out and are gone after their life. Runs with npm test.
import assert from "node:assert/strict";
import { edgePoint, perimeter, type SparkLook, sparksAt, sparksDone, traceLength } from "./edgeTrace.ts";

const CARD = { width: 640, height: 200, radius: 16 };
// The default look of the sparks (alertSpark* in tuning/alerts.ts)
const LOOK: SparkLook = { life: 1.1, latest: 0.25, spread: 1.2, speedMin: 160, speedMax: 480, gravity: 520, size: 8, sizeSpread: 14, shrink: 0.6 };
const near = (first: number, second: number) => Math.abs(first - second) < 1e-6;
const at = (path: number) => edgePoint(path / 1680, 640, 200);
const same = (point: { x: number; y: number; normal: number }, x: number, y: number, normal: number) =>
  assert.ok(near(point.x, x) && near(point.y, y) && near(point.normal, normal), `${point.x}, ${point.y}, ${point.normal}`);

// Rand: the perimeter of a rounded card, for radius 0 and for the largest radius (half the height)
assert.equal(perimeter(640, 200, 0), 1680);
assert.ok(near(perimeter(640, 200, 100), 2 * 440 + Math.PI * 200), "a pill: two straights and a circle");
assert.ok(near(perimeter(640, 200, 500), perimeter(640, 200, 100)), "the radius never exceeds half the height");
const full = perimeter(CARD.width, CARD.height, CARD.radius);
assert.equal(traceLength(0, 700, full), 0);
assert.ok(traceLength(0.35, 700, full) > 0 && traceLength(0.35, 700, full) < full);
assert.equal(traceLength(0.7, 700, full), full, "full after alertTraceMs");
assert.equal(traceLength(5, 700, full), full, "and stays full");
assert.equal(traceLength(-1, 700, full), 0);
assert.equal(traceLength(0, 0, full), full, "without a trace at once");
for (let step = 0; step < 70; step++) assert.ok(traceLength((step + 1) / 100, 700, full) >= traceLength(step / 100, 700, full), "only grows");

// Points on the edge, clockwise from the top left corner; the normal points outwards
same(at(0), 0, 0, -Math.PI / 2);
same(at(320), 320, 0, -Math.PI / 2);
same(at(740), 640, 100, 0);
same(at(1160), 320, 200, Math.PI / 2);
same(at(1580), 0, 100, Math.PI);

// Funken auf dem Rand: alertSparks of them, from seed and time, starting on the edge, gone after their life
const sparks = (time: number) => sparksAt(7, 36, time, CARD, LOOK);
assert.equal(sparks(0.5).length, 36);
assert.deepEqual(sparks(0.5), sparks(0.5));
assert.notDeepEqual(sparksAt(8, 36, 0.5, CARD, LOOK), sparks(0.5), "another seed, other sparks");
for (const spark of sparksAt(7, 36, 0, CARD, LOOK).filter(item => item.opacity > 0)) {
  const onEdge = near(spark.x, 0) || near(spark.x, CARD.width) || near(spark.y, 0) || near(spark.y, CARD.height);
  assert.ok(onEdge, `spark starts on the edge at ${spark.x}, ${spark.y}`);
}
assert.ok(sparks(0.5).some(spark => spark.opacity > 0), "sparks fly");
assert.ok(sparks(sparksDone(LOOK)).every(spark => spark.opacity === 0), "after their life the stage is empty");
// The look comes from the settings: larger sparks, a longer life
const big = sparksAt(7, 36, 0.5, CARD, { ...LOOK, size: 40, sizeSpread: 0, shrink: 0 });
assert.ok(big.every(spark => spark.size === 40), "size from the settings");
assert.ok(sparksAt(7, 36, 2, CARD, { ...LOOK, life: 5 }).some(spark => spark.opacity > 0), "a longer life keeps them flying");
assert.ok(sparks(-0.1).every(spark => spark.opacity === 0), "nothing before the burst");
assert.ok(sparks(0.5).every(spark => spark.size > 0));

console.log("standard edgeTrace ok");
