// When and where overlay parts appear: time display, music progress, phases and position of the chat effects,
// times of the alerts and the single frame of the decode effect. Pure functions (time and randomness
// are passed in), tested in overlayTiming.check.ts.
import type { FxAction, FxPosition, Track } from "./types.ts";

const pad = (value: number) => String(Math.max(0, Math.floor(value))).padStart(2, "0");

// Seconds as HH:MM:SS
export function clock(seconds: number) {
  const safe = Math.max(0, seconds);
  return `${pad(safe / 3600)}:${pad((safe % 3600) / 60)}:${pad(safe % 60)}`;
}

// Progress of a track at time now, if it arrived at receivedAt with progressMs
export function currentProgress(track: Pick<Track, "durationMs" | "progressMs" | "playing">, receivedAt: number, now: number) {
  return track.playing ? Math.min(track.durationMs, track.progressMs + now - receivedAt) : track.progressMs;
}

export type FxPhase = "pre" | "play" | "post" | "done";

const fxTimes = (action: FxAction) => ({ delay: (action.delay ?? 0) * 1000, duration: (action.duration ?? 4) * 1000, after: (action.after ?? 0) * 1000 });

// Gesamte Sichtbarkeit eines Effekts in ms
export function fxLifetime(action: FxAction) {
  const times = fxTimes(action);
  return times.delay + times.duration + times.after;
}

// Phase of an effect elapsedMs after it appeared
export function fxPhase(action: FxAction, elapsedMs: number): FxPhase {
  const times = fxTimes(action);
  if (elapsedMs < times.delay) return "pre";
  if (elapsedMs < times.delay + times.duration) return "play";
  if (elapsedMs < fxLifetime(action)) return "post";
  return "done";
}

// Position in percent of the overlay area; random only with margin percent distance to the edge, so nothing sticks to the edge
export function placeFx(position: FxPosition | undefined, random: () => number, margin = 20) {
  const span = 100 - 2 * margin;
  if (position === "random") return { x: margin + random() * span, y: margin + random() * span };
  if (position && position !== "center") return position;
  return { x: 50, y: 50 };
}

// End of a countdown in ms: at = "HH:MM" (today, or tomorrow if the time is already past), otherwise seconds from now
export function countdownEnd(at: string | null, seconds: number, now: Date) {
  const time = at?.match(/^(\d{1,2}):(\d{2})$/);
  if (!time) return now.getTime() + seconds * 1000;
  const end = new Date(now);
  end.setHours(Number(time[1]), Number(time[2]), 0, 0);
  if (end.getTime() < now.getTime()) end.setDate(end.getDate() + 1);
  return end.getTime();
}

// An alert starts fading out 600 ms before it expires; the next one comes 400 ms after it expires
export function alertTiming(durationMs: number) {
  return { leaveAtMs: durationMs - 600, nextAtMs: durationMs + 400 };
}

// Decode: text appears from the left, before it runs a strip of up to 6 random characters
export function decodeFrame(text: string, elapsedMs: number, msPerChar: number, glyph: () => string) {
  if (elapsedMs < 0) return "";
  const done = Math.floor(elapsedMs / msPerChar);
  return Array.from(text)
    .map((char, index) => {
      if (index < done) return char;
      if (index >= done + 6) return "";
      return char === " " ? " " : glyph();
    })
    .join("");
}
