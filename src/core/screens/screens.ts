// Context full-screen scenes (Starting, BRB, Ending): stage, countdown, break time, clock and rotating quotes. The same
// rules for every theme; the themes call them via useScreen and useStage and only do the styling.
// Pure (time comes in); check: screens.check.ts.
import { clock } from "../overlayTiming.ts";

export type ScreenKind = "starting" | "brb" | "ending";

// All full-screen scenes are built for this stage and are scaled to the source
export const STAGE = { width: 1920, height: 1080 };
export const stageScale = (width: number, height: number) => Math.min(width / STAGE.width, height / STAGE.height);

const SECOND_MS = 1000;
const HOUR_SECONDS = 3600;
const MINUTES_FROM = 3; // clock returns HH:MM:SS, below one hour MM:SS is enough

// Remaining time in seconds and fraction of the elapsed time (0..1) of a countdown from start to end
export function countdown(start: number, end: number, now: number) {
  const left = Math.max(0, (end - now) / SECOND_MS);
  return { left, progress: end > start ? 1 - (left * SECOND_MS) / (end - start) : 1 };
}

// Clock: below one hour MM:SS, otherwise HH:MM:SS
export const shortClock = (seconds: number) => (seconds < HOUR_SECONDS ? clock(seconds).slice(MINUTES_FROM) : clock(seconds));

// Quote that is due after elapsedMs when the next one comes every everyMs; "" without quotes
export function rotating(lines: readonly string[], everyMs: number, elapsedMs: number) {
  if (lines.length === 0) return "";
  return everyMs > 0 ? lines[Math.floor(elapsedMs / everyMs) % lines.length] : lines[0];
}
