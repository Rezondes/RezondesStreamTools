// Rolling digits of the standard countdown: which places of a clock text change and how far each has rolled. Texts
// line up from the right, so 9:59 to 10:00 rolls the new leading 1 in from nothing. Check: digits.check.ts.

type DigitRoll = { index: number; from: string; to: string; rolled: number };

// How far a place has rolled: progress 0 to 1 eases out to 0 to 1, clamped outside
const rolledShare = (progress: number) => 1 - (1 - Math.min(1, Math.max(0, progress))) ** 3;

// Places of the next text that differ from the previous one, each rolled as far as the progress says
export function rollDigits(previous: string, next: string, progress: number): DigitRoll[] {
  const rolled = rolledShare(progress);
  const offset = previous.length - next.length;
  return [...next].flatMap((to, index) => {
    const from = previous[index + offset] ?? "";
    return from === to ? [] : [{ index, from, to, rolled }];
  });
}
