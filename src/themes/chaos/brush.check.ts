// Check for brush.ts of the Chaos theme: a stroke painted to p = 0 shows nothing, to p = 1 every bristle to its end;
// bristles and drips come from the seed; the spray edge runs over the title only while it is sprayed. Runs with npm test.
import assert from "node:assert/strict";
import { brushAt, brushSchedule, makeBrush, sprayEdgeAt, SPRAY_EDGE } from "./brush.ts";

const STROKE = { from: [120, 300] as [number, number], to: [1020, 980] as [number, number], width: 150 };
const brush = makeBrush(STROKE, 7);

// Strich bis p: nothing at 0, more on the way, all bristles at 1
assert.deepEqual(brushAt(brush, 0), { body: null, bristles: [], tip: null });
const half = brushAt(brush, 0.3);
const full = brushAt(brush, 1);
assert.ok(half.bristles.length > 0 && half.bristles.length <= full.bristles.length);
assert.equal(full.bristles.length, brush.bristles.length, "every bristle is painted at the end");
assert.ok(full.body && full.body.length > 10);
assert.ok(Math.abs((full.tip?.x ?? 0) - 1020) < 1e-6 && Math.abs((full.tip?.y ?? 0) - 980) < 1e-6, "the tip reaches the end");
assert.ok((half.tip?.x ?? 0) < (full.tip?.x ?? 0));

// Fixed randomness: same seed, same brush; another seed, other bristles
assert.deepEqual(makeBrush(STROKE, 7), brush);
assert.notDeepEqual(makeBrush(STROKE, 8).bristles, brush.bristles);
assert.ok(brush.drips.length >= 3 && brush.drips.length <= 5);
// Shimmer only moves the bristles when it is on
assert.deepEqual(brushAt(brush, 1, 5, 0), brushAt(brush, 1, 0, 0));
assert.notDeepEqual(brushAt(brush, 1, 5, 1), brushAt(brush, 1, 0, 1));

// Spray edge
assert.equal(sprayEdgeAt(1.9, 2, 1200), null);
assert.equal(sprayEdgeAt(2, 2, 1200), SPRAY_EDGE.from);
assert.equal(sprayEdgeAt(3.2, 2, 1200), SPRAY_EDGE.to);
assert.equal(sprayEdgeAt(3.3, 2, 1200), null);

// Schedule: one brush per stroke of the composition, each starting after the build began, same seed same strokes
const schedule = brushSchedule("zweix", 5);
assert.equal(schedule.length, 6);
assert.ok(schedule.every(entry => entry.start > 0));
assert.deepEqual(brushSchedule("zweix", 5), schedule);
assert.equal(brushSchedule("keine", 5).length, 0);

console.log("chaos brush ok");
