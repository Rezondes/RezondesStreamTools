// Timing of the closing bon (scenes/Stats.tsx): the bon is printed, then its rows count up one after another, then the
// stamp hits. Shares from 0 to 1 per row as a pure function of the time. Check: closing.check.ts.

const SECOND_MS = 1000;
// fixed: numbers like on a German bon
export const LOCALE = "de-DE";

// printed: when the bon is printed (s), rowGap: how much later each row starts than the one above it (s)
export function rowShares(time: number, rows: number, countUpMs: number, printed: number, rowGap: number): number[] {
  const count = countUpMs / SECOND_MS;
  return Array.from({ length: rows }, (_, row) => {
    const start = printed + row * rowGap;
    if (count <= 0) return time >= start ? 1 : 0;
    return Math.min(1, Math.max(0, (time - start) / count));
  });
}
