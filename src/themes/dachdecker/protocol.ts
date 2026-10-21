// Acceptance protocol of the Ending scene of the Dachdecker theme (DESIGN-DACHDECKER.md "Szenen"): the lines of the
// setting with the real numbers of the stream (core stats), each counting up from 0 by its share; without stats dashes
// instead of numbers. Check: protocol.check.ts.
import { describeStats, type StatLine } from "../../core/stats/stats.ts";
import type { StreamStats } from "../../core/types.ts";

export type ProtocolRow = { label: string; value: string };

// fixed: shown without stats (no server, not counted yet)
export const NO_VALUE = "--";
// fixed: numbers as on a German drawing (1.284), like all texts of the theme
export const LOCALE = "de-DE";

// shares: how far each row has counted (0..1), missing ones are done
export function protocolRows(stats: StreamStats | null, lines: readonly StatLine[], locale: string, now: number, shares: readonly number[] = []): ProtocolRow[] {
  return lines.map((line, index) => {
    if (!stats) return { label: line.label, value: NO_VALUE };
    const share = Math.min(1, Math.max(0, shares[index] ?? 1));
    const counted = line.key === "duration" ? stats : { ...stats, [line.key]: Math.round(stats[line.key] * share) };
    return { label: line.label, value: describeStats(counted, [line], locale, now)[0].value };
  });
}
