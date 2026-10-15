// Wann und wo Overlay-Teile erscheinen: Zeitanzeige, Musik-Fortschritt, Phasen und Position der Chat-Effekte,
// Zeitpunkte der Alerts und das Einzelbild des Entschlüsselungs-Effekts. Reine Funktionen (Zeit und Zufall
// werden übergeben), getestet in overlayTiming.check.ts.
import type { FxAction, FxPosition, Track } from "./types.ts";

const pad = (value: number) => String(Math.max(0, Math.floor(value))).padStart(2, "0");

// Sekunden als HH:MM:SS
export function clock(seconds: number) {
  const safe = Math.max(0, seconds);
  return `${pad(safe / 3600)}:${pad((safe % 3600) / 60)}:${pad(safe % 60)}`;
}

// Fortschritt eines Titels zum Zeitpunkt now, wenn er bei receivedAt mit progressMs ankam
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

// Phase eines Effekts elapsedMs nach seinem Erscheinen
export function fxPhase(action: FxAction, elapsedMs: number): FxPhase {
  const times = fxTimes(action);
  if (elapsedMs < times.delay) return "pre";
  if (elapsedMs < times.delay + times.duration) return "play";
  if (elapsedMs < fxLifetime(action)) return "post";
  return "done";
}

// Position in Prozent der Overlay-Fläche; zufällig nur zwischen 20 und 80, damit nichts am Rand klebt
export function placeFx(position: FxPosition | undefined, random: () => number) {
  if (position === "random") return { x: 20 + random() * 60, y: 20 + random() * 60 };
  if (position && position !== "center") return position;
  return { x: 50, y: 50 };
}

// Ein Alert beginnt 600 ms vor Ablauf auszublenden; der nächste kommt 400 ms nach Ablauf
export function alertTiming(durationMs: number) {
  return { leaveAtMs: durationMs - 600, nextAtMs: durationMs + 400 };
}

// Entschlüsseln: Text erscheint von links, davor läuft ein Streifen aus bis zu 6 Zufallszeichen
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
