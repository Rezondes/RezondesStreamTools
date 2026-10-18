// Hopping of the minimes while they move (walk, and approach in fights): how many hops fit into a movement and how long
// one takes, so the figure lands exactly at the target. The theme puts .minime-hop around the body and .minime-hop-shadow
// on the shadow (minimeHops.css) and sets the CSS variables from hopStyle; heights come from MINIME_HOP_FIELDS.
// Pure, check: minimeHops.check.ts.
import type { MinimeActor } from "./minimeBehavior.ts";

// count: number of hops (at least 1), periodMs: duration of one hop (duration / count)
export function hopPlan(durationMs: number, hopMs: number): { count: number; periodMs: number } {
  const count = hopMs > 0 ? Math.max(1, Math.round(durationMs / hopMs)) : 1;
  return { count, periodMs: Math.max(0, durationMs) / count };
}

// CSS variables of the hops of a figure for its running action
export function hopStyle(actor: MinimeActor, hopMs: number): Record<string, string | number> {
  const plan = hopPlan(actor.durationMs, hopMs);
  return { "--hops": plan.count, "--hop-ms": `${plan.periodMs}ms` };
}
