// Stream stats for the scenes: which numbers a theme shows comes from a lines setting ("key|Text" per line), this file
// reads it and formats the values (numbers with the locale, duration as h:mm of the stream: from its start to its end,
// while live to now).
import type { StreamStats } from "../types.ts";

export type StatKey = Exclude<keyof StreamStats, "startedAt" | "endedAt"> | "duration";
export type StatLine = { key: StatKey; label: string };
export type StatValue = StatLine & { value: string };

const KEYS: readonly StatKey[] = ["follows", "subs", "giftedSubs", "raids", "raiders", "bits", "redeems", "hypeLevel", "chatMessages", "chatters", "duration"];
const isKey = (key: string): key is StatKey => (KEYS as readonly string[]).includes(key);

// Lines of the setting in their order; unknown keys and empty lines are skipped, without | the key is the text
export function parseStatLines(text: string): StatLine[] {
  return text.split("\n").flatMap(line => {
    const [key, ...label] = line.split("|").map(part => part.trim());
    return isKey(key) ? [{ key, label: label.join("|") || key }] : [];
  });
}

const duration = (ms: number) => {
  const minutes = Math.floor(Math.max(0, ms) / 60_000);
  return `${Math.floor(minutes / 60)}:${String(minutes % 60).padStart(2, "0")} h`;
};

// The lines with their formatted value; now is the current time in ms
export function describeStats(stats: StreamStats, lines: readonly StatLine[], locale: string, now: number): StatValue[] {
  const number = new Intl.NumberFormat(locale);
  return lines.map(line => ({
    ...line,
    value: line.key === "duration" ? duration(stats.startedAt === null ? 0 : (stats.endedAt ?? now) - stats.startedAt) : number.format(stats[line.key]),
  }));
}

export type StatRow = { label: string; value: string };
// fixed: shown without stats (no server, not counted yet)
export const NO_STAT = "--";

// Rows for a report: the real numbers, each counting up from 0 by its share (0..1, missing ones are done); the duration
// does not count. Without stats dashes instead of numbers.
export function countedStats(stats: StreamStats | null, lines: readonly StatLine[], locale: string, now: number, shares: readonly number[] = []): StatRow[] {
  return lines.map((line, index) => {
    if (!stats) return { label: line.label, value: NO_STAT };
    const share = Math.min(1, Math.max(0, shares[index] ?? 1));
    const counted = line.key === "duration" ? stats : { ...stats, [line.key]: Math.round(stats[line.key] * share) };
    return { label: line.label, value: describeStats(counted, [line], locale, now)[0].value };
  });
}
