// Check for minimeHops.ts: count rounded from duration and hop interval, at least one hop, the interval divides the
// duration exactly; hopStyle sets the CSS variables from the running action.
// Runs with npm test (alone: node src/core/minimeHops.check.ts).
import assert from "node:assert/strict";
import type { MinimeActor } from "./minimeBehavior.ts";
import { hopPlan, hopStyle } from "./minimeHops.ts";

const plan = hopPlan(1000, 300);
assert.equal(plan.count, 3);
assert.ok(Math.abs(plan.periodMs - 1000 / 3) < 1e-9);
assert.deepEqual(hopPlan(100, 300), { count: 1, periodMs: 100 });
assert.deepEqual(hopPlan(0, 300), { count: 1, periodMs: 0 });
assert.deepEqual(hopPlan(900, 300), { count: 3, periodMs: 300 });
assert.deepEqual(hopPlan(900, 0), { count: 1, periodMs: 900 });

const actor: MinimeActor = {
  login: "neo", user: "Neo", color: null, variant: null, action: "walk", startedAt: 0, durationMs: 900, fromX: 0, toX: 100, facing: 1, leaving: false,
};
assert.deepEqual(hopStyle(actor, 300), { "--hops": 3, "--hop-ms": "300ms" });

console.log("minimeHops ok");
