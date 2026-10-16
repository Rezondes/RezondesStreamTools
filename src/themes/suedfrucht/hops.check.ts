// Check für hops.ts: Anzahl gerundet aus Dauer und Sprungtakt, mindestens ein Sprung, Takt teilt die Dauer genau.
// Läuft mit npm test (einzeln: node src/themes/suedfrucht/hops.check.ts).
import assert from "node:assert/strict";
import { hopPlan } from "./hops.ts";

const plan = hopPlan(1000, 300);
assert.equal(plan.count, 3);
assert.ok(Math.abs(plan.periodMs - 1000 / 3) < 1e-9);
assert.deepEqual(hopPlan(100, 300), { count: 1, periodMs: 100 });
assert.deepEqual(hopPlan(0, 300), { count: 1, periodMs: 0 });
assert.deepEqual(hopPlan(900, 300), { count: 3, periodMs: 300 });
assert.deepEqual(hopPlan(900, 0), { count: 1, periodMs: 900 });

console.log("suedfrucht hops ok");
