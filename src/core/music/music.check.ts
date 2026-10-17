// Check for music.ts: what the player shows, progress as a fraction and clock time, duration of the scrolling text.
// Runs with npm test.
import assert from "node:assert/strict";
import type { Track } from "../types.ts";
import { marqueeSeconds, nowPlaying, trackClock, trackProgress } from "./music.ts";

const song: Track = { id: "1", title: "Wake Up", artist: "RATM", album: "", cover: null, durationMs: 200_000, progressMs: 50_000, playing: true };

// Visibility: with "hide on pause" only while playing, the last track stays for the fade-out;
// without hiding always visible, without a track nothing (the theme then shows its idle state). at = 0: do not move on
assert.deepEqual(nowPlaying({ track: song, last: song, receivedAt: 7 }, true), { shown: song, visible: true, at: 7 });
assert.deepEqual(nowPlaying({ track: { ...song, playing: false }, last: song, receivedAt: 7 }, true), { shown: { ...song, playing: false }, visible: false, at: 7 });
assert.deepEqual(nowPlaying({ track: null, last: song, receivedAt: 7 }, true), { shown: song, visible: false, at: 0 });
assert.deepEqual(nowPlaying({ track: null, last: song, receivedAt: 7 }, false), { shown: null, visible: true, at: 0 });

// Progress: moves on from receipt, from memory (at 0) it stands still; clock time as m:ss, from one hour h:mm:ss
assert.deepEqual(trackProgress(song, 1000, 11_000), { progressMs: 60_000, part: 0.3, elapsed: "01:00", total: "03:20" });
assert.deepEqual(trackProgress(song, 0, 11_000), { progressMs: 50_000, part: 0.25, elapsed: "00:50", total: "03:20" });
assert.equal(trackProgress({ ...song, durationMs: 0 }, 0, 0).part, 0);
assert.equal(trackClock(3_725_000), "01:02:05");

// Scrolling text: the duration grows with the distance (moving is 70 % of the duration), very long titles move at the same speed too;
// without overflow or without speed no duration
assert.equal(marqueeSeconds(280, 40), 10);
assert.equal(marqueeSeconds(2800, 40), 100);
assert.equal(marqueeSeconds(0, 40), 0);
assert.equal(marqueeSeconds(100, 0), 0);

console.log("music ok");
