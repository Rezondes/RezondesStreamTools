// Hop plan of the hopping fruit minimes: how many hops fit into a walk and how long one takes,
// so the fruit lands exactly at the target. Pure, check: hops.check.ts.

// count: number of hops (at least 1), periodMs: duration of one hop (duration / count)
export function hopPlan(durationMs: number, hopMs: number): { count: number; periodMs: number } {
  const count = hopMs > 0 ? Math.max(1, Math.round(durationMs / hopMs)) : 1;
  return { count, periodMs: Math.max(0, durationMs) / count };
}
