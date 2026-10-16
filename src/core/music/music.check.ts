// Check für music.ts: was der Player zeigt, Fortschritt als Anteil und Uhrzeit, Dauer des Lauftexts.
// Läuft mit npm test.
import assert from "node:assert/strict";
import type { Track } from "../types.ts";
import { marqueeSeconds, nowPlaying, trackClock, trackProgress } from "./music.ts";

const song: Track = { id: "1", title: "Wake Up", artist: "RATM", album: "", cover: null, durationMs: 200_000, progressMs: 50_000, playing: true };

// Sichtbarkeit: mit "bei Pause ausblenden" nur bei Wiedergabe, der letzte Titel bleibt für das Ausblenden stehen;
// ohne Ausblenden immer sichtbar, ohne Titel nichts (das Theme zeigt dann seinen Leerlauf). at = 0: nicht weiterrechnen
assert.deepEqual(nowPlaying({ track: song, last: song, receivedAt: 7 }, true), { shown: song, visible: true, at: 7 });
assert.deepEqual(nowPlaying({ track: { ...song, playing: false }, last: song, receivedAt: 7 }, true), { shown: { ...song, playing: false }, visible: false, at: 7 });
assert.deepEqual(nowPlaying({ track: null, last: song, receivedAt: 7 }, true), { shown: song, visible: false, at: 0 });
assert.deepEqual(nowPlaying({ track: null, last: song, receivedAt: 7 }, false), { shown: null, visible: true, at: 0 });

// Fortschritt: läuft ab Empfang weiter, aus dem Gedächtnis (at 0) steht er; Uhrzeit als m:ss, ab einer Stunde h:mm:ss
assert.deepEqual(trackProgress(song, 1000, 11_000), { progressMs: 60_000, part: 0.3, elapsed: "01:00", total: "03:20" });
assert.deepEqual(trackProgress(song, 0, 11_000), { progressMs: 50_000, part: 0.25, elapsed: "00:50", total: "03:20" });
assert.equal(trackProgress({ ...song, durationMs: 0 }, 0, 0).part, 0);
assert.equal(trackClock(3_725_000), "01:02:05");

// Lauftext: Dauer wächst mit der Strecke (Fahrt ist 70 % der Dauer), auch sehr lange Titel laufen mit gleichem Tempo;
// ohne Überstand oder ohne Tempo keine Dauer
assert.equal(marqueeSeconds(280, 40), 10);
assert.equal(marqueeSeconds(2800, 40), 100);
assert.equal(marqueeSeconds(0, 40), 0);
assert.equal(marqueeSeconds(100, 0), 0);

console.log("music ok");
