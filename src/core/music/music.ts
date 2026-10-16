// Kontext Musik (Spotify "Now Playing"): was der Player zeigt, Fortschritt und Lauftext. Gleiche Regeln für jedes
// Theme; die Themes rufen sie über useNowPlaying, useTrackProgress und <Marquee> auf und gestalten nur.
// Rein (Zeit kommt herein); Check: music.check.ts.
import { clock, currentProgress } from "../overlayTiming.ts";
import type { Track } from "../types.ts";

// Stand aus useMusic: track = aktuell (null = nichts läuft), last = zuletzt bekannter Titel, receivedAt = Empfangszeit
type MusicState = { track: Track | null; last: Track | null; receivedAt: number };

// Was der Player zeigt. hideWhenPaused: nur bei Wiedergabe sichtbar, der letzte Titel bleibt für die Ausblend-Animation
// stehen. shown null = Leerlauf (das Theme zeigt seinen eigenen). at: Empfangszeit zum Weiterrechnen, 0 = Titel aus dem
// Gedächtnis, der Fortschritt steht
export function nowPlaying(state: MusicState, hideWhenPaused: boolean) {
  return {
    shown: state.track ?? (hideWhenPaused ? state.last : null),
    visible: hideWhenPaused ? Boolean(state.track?.playing) : true,
    at: state.track ? state.receivedAt : 0,
  };
}

const SECOND_MS = 1000;
const HOUR_MS = 3_600_000;
const MINUTES_FROM = 3; // clock liefert HH:MM:SS, unter einer Stunde reicht MM:SS

// Uhrzeit eines Titels: unter einer Stunde MM:SS, sonst HH:MM:SS
export const trackClock = (ms: number) => (ms < HOUR_MS ? clock(ms / SECOND_MS).slice(MINUTES_FROM) : clock(ms / SECOND_MS));

// Fortschritt zum Zeitpunkt now: in ms, als Anteil 0..1 und als Uhrzeit (gespielt, gesamt)
export function trackProgress(track: Track, at: number, now: number) {
  const progressMs = at ? currentProgress(track, at, now) : track.progressMs;
  return { progressMs, part: track.durationMs ? progressMs / track.durationMs : 0, elapsed: trackClock(progressMs), total: trackClock(track.durationMs) };
}

// Lauftext für zu lange Zeilen: Sekunden für einen Durchlauf hin, damit der Text mit pxPerSecond fährt.
// Die Keyframes (marquee.css) stehen 15 % am Anfang und 15 % am Ende, gefahren wird in den 70 % dazwischen.
const MARQUEE_TRAVEL = 0.7;
export function marqueeSeconds(overflowPx: number, pxPerSecond: number) {
  return overflowPx > 0 && pxPerSecond > 0 ? overflowPx / pxPerSecond / MARQUEE_TRAVEL : 0;
}
