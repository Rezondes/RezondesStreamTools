// Context music (Spotify "Now Playing"): what the player shows, progress and scrolling text. The same rules for every
// theme; the themes call them via useNowPlaying, useTrackProgress and <Marquee> and only do the styling.
// Pure (time comes in); check: music.check.ts.
import { clock, currentProgress } from "../overlayTiming.ts";
import type { Track } from "../types.ts";

// State from useMusic: track = current (null = nothing playing), last = last known track, receivedAt = time of receipt
type MusicState = { track: Track | null; last: Track | null; receivedAt: number };

// What the player shows. hideWhenPaused: visible only while playing, the last track stays for the fade-out
// animation. shown null = idle (the theme shows its own). at: time of receipt to move on, 0 = track from
// memory, the progress stands still
export function nowPlaying(state: MusicState, hideWhenPaused: boolean) {
  return {
    shown: state.track ?? (hideWhenPaused ? state.last : null),
    visible: hideWhenPaused ? Boolean(state.track?.playing) : true,
    at: state.track ? state.receivedAt : 0,
  };
}

const SECOND_MS = 1000;
const HOUR_MS = 3_600_000;
const MINUTES_FROM = 3; // clock returns HH:MM:SS, below one hour MM:SS is enough

// Clock time of a track: below one hour MM:SS, otherwise HH:MM:SS
export const trackClock = (ms: number) => (ms < HOUR_MS ? clock(ms / SECOND_MS).slice(MINUTES_FROM) : clock(ms / SECOND_MS));

// Progress at time now: in ms, as a fraction 0..1 and as clock time (played, total)
export function trackProgress(track: Track, at: number, now: number) {
  const progressMs = at ? currentProgress(track, at, now) : track.progressMs;
  return { progressMs, part: track.durationMs ? progressMs / track.durationMs : 0, elapsed: trackClock(progressMs), total: trackClock(track.durationMs) };
}

// Scrolling text for too long lines: seconds for one pass, so the text moves at pxPerSecond.
// The keyframes (marquee.css) stand still 15 % at the start and 15 % at the end, moving happens in the 70 % between.
const MARQUEE_TRAVEL = 0.7;
export function marqueeSeconds(overflowPx: number, pxPerSecond: number) {
  return overflowPx > 0 && pxPerSecond > 0 ? overflowPx / pxPerSecond / MARQUEE_TRAVEL : 0;
}
