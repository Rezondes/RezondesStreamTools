// Kontext Vollbild-Szenen (Starting, BRB, Ending): Bühne, Countdown, Pausenzeit, Uhr und wechselnde Sprüche. Gleiche
// Regeln für jedes Theme; die Themes rufen sie über useScreen und useStage auf und gestalten nur.
// Rein (Zeit kommt herein); Check: screens.check.ts.
import { clock } from "../overlayTiming.ts";

export type ScreenKind = "starting" | "brb" | "ending";

// Alle Vollbild-Szenen sind für diese Bühne gebaut und werden auf die Quelle skaliert
export const STAGE = { width: 1920, height: 1080 };
export const stageScale = (width: number, height: number) => Math.min(width / STAGE.width, height / STAGE.height);

const SECOND_MS = 1000;
const HOUR_SECONDS = 3600;
const MINUTES_FROM = 3; // clock liefert HH:MM:SS, unter einer Stunde reicht MM:SS

// Restzeit in Sekunden und Anteil der vergangenen Zeit (0..1) eines Countdowns von start bis end
export function countdown(start: number, end: number, now: number) {
  const left = Math.max(0, (end - now) / SECOND_MS);
  return { left, progress: end > start ? 1 - (left * SECOND_MS) / (end - start) : 1 };
}

// Uhr: unter einer Stunde MM:SS, sonst HH:MM:SS
export const shortClock = (seconds: number) => (seconds < HOUR_SECONDS ? clock(seconds).slice(MINUTES_FROM) : clock(seconds));

// Spruch, der nach elapsedMs dran ist, wenn alle everyMs der nächste kommt; "" ohne Sprüche
export function rotating(lines: readonly string[], everyMs: number, elapsedMs: number) {
  if (lines.length === 0) return "";
  return everyMs > 0 ? lines[Math.floor(elapsedMs / everyMs) % lines.length] : lines[0];
}
