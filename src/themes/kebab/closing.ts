// Timing of the closing bon (scenes/Stats.tsx): the bon is printed, then its rows count up one after another, then the
// stamp hits. Shares from 0 to 1 per row as a pure function of the time. Check: closing.check.ts.

const SECOND_MS = 1000;
// fixed: the printer drops at once, the bon is printed after this many seconds, each row starts this much after the one
// above it
export const CLOSING = { printer: 0.1, bon: 0.4, printed: 1.5, rowGap: 0.25 };
// fixed: numbers like on a German bon; the printer (steps of the feed, drop height in px and durations in s) and how
// the stamp hits (from 2.6 times its size) and shakes the paper (px, s, times)
export const LOCALE = "de-DE";
export const PRINT = { steps: 16, dropY: -200, drop: 0.45, feed: 1 };
export const HIT = { scale: 2.6, duration: 0.18, shake: 6, shakeTime: 0.04, shakes: 3 };

export function rowShares(time: number, rows: number, countUpMs: number): number[] {
  const count = countUpMs / SECOND_MS;
  return Array.from({ length: rows }, (_, row) => {
    const start = CLOSING.printed + row * CLOSING.rowGap;
    if (count <= 0) return time >= start ? 1 : 0;
    return Math.min(1, Math.max(0, (time - start) / count));
  });
}
