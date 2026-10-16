// Sprungplan der hüpfenden Frucht-Minimes: wie viele Sprünge in eine Wanderung passen und wie lang einer dauert,
// damit die Frucht genau am Ziel landet. Rein, Check: hops.check.ts.

// count: Anzahl Sprünge (mindestens 1), periodMs: Dauer eines Sprungs (Dauer / Anzahl)
export function hopPlan(durationMs: number, hopMs: number): { count: number; periodMs: number } {
  const count = hopMs > 0 ? Math.max(1, Math.round(durationMs / hopMs)) : 1;
  return { count, periodMs: Math.max(0, durationMs) / count };
}
