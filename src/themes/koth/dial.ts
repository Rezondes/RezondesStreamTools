// The dial of the KOTH field radio (PLAN-KOTH.md package 4): every track sits on its own frequency of the band, the
// same track always on the same one. Check: dial.check.ts.
import { seedOf, hash } from "../../core/hash.ts";

// fixed: the FM band (MHz) and its step
const BAND = { low: 87.5, high: 108, step: 0.1 };

export function dialFrequency(track: string): string {
  const steps = Math.round((BAND.high - BAND.low) / BAND.step);
  return (BAND.low + Math.floor(hash(seedOf(track)) * (steps + 1)) * BAND.step).toFixed(1);
}
