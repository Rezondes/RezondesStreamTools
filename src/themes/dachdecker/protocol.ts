// Acceptance protocol of the Ending scene of the Dachdecker theme (DESIGN-DACHDECKER.md "Szenen"): the lines of the
// setting with the real numbers of the stream, each counting up from 0 by its share; without stats dashes instead of
// numbers. The counting is the shared countedStats of the core. Check: protocol.check.ts.
import { countedStats, NO_STAT, type StatRow } from "../../core/stats/stats.ts";

export type ProtocolRow = StatRow;

export const NO_VALUE = NO_STAT;
// fixed: numbers as on a German drawing (1.284), like all texts of the theme
export const LOCALE = "de-DE";

export const protocolRows = countedStats;
