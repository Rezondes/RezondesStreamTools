// Check for overlayTiming.ts: time display, music progress, effect phases and position, alert times,
// decode effect. Runs with npm test.
import assert from "node:assert/strict";
import { alertDurationMs, alertTiming, clock, countdownEnd, currentProgress, decodeFrame, fxLifetime, fxPhase, placeFx } from "./overlayTiming.ts";

// Clock: hours:minutes:seconds, never negative
assert.equal(clock(3725), "01:02:05");
assert.equal(clock(-5), "00:00:00");

// Music: moves on from receipt, capped at the length; unchanged while paused
const track = { durationMs: 10_000, progressMs: 2000, playing: true };
assert.equal(currentProgress(track, 1000, 4000), 5000);
assert.equal(currentProgress(track, 1000, 99_000), 10_000);
assert.equal(currentProgress({ ...track, playing: false }, 1000, 4000), 2000);

// Effect phases: delay paused, duration playing, after standing, then over
const action = { type: "media" as const, delay: 1, duration: 3, after: 2 };
assert.equal(fxPhase(action, 500), "pre");
assert.equal(fxPhase(action, 2000), "play");
assert.equal(fxPhase(action, 4500), "post");
assert.equal(fxPhase(action, 6000), "done");
assert.equal(fxLifetime(action), 6000);
// Default duration 4 s, without delay play immediately
assert.equal(fxPhase({ type: "media" }, 0), "play");
assert.equal(fxLifetime({ type: "media" }), 4000);

// Position: center, fixed, random in the range 20 to 80 percent
assert.deepEqual(placeFx("center", () => 0.5), { x: 50, y: 50 });
assert.deepEqual(placeFx({ x: 10, y: 90 }, () => 0.5), { x: 10, y: 90 });
assert.deepEqual(placeFx("random", () => 0), { x: 20, y: 20 });
assert.deepEqual(placeFx("random", () => 1), { x: 80, y: 80 });
assert.deepEqual(placeFx(undefined, () => 0.5), { x: 50, y: 50 });
// Own margin for random positions
assert.deepEqual(placeFx("random", () => 0, 10), { x: 10, y: 10 });
assert.deepEqual(placeFx("random", () => 1, 10), { x: 90, y: 90 });

// Countdown end: countdownAt HH:MM today (or tomorrow if already past), otherwise the seconds from now
const now = new Date(2026, 9, 15, 19, 30, 0);
assert.equal(countdownEnd("20:00", 300, now), new Date(2026, 9, 15, 20, 0, 0).getTime());
assert.equal(countdownEnd("19:00", 300, now), new Date(2026, 9, 16, 19, 0, 0).getTime());
assert.equal(countdownEnd(null, 300, now), now.getTime() + 300_000);
assert.equal(countdownEnd("kaputt", 60, now), now.getTime() + 60_000);

// Alert: fading out starts 600 ms before the end, the next one comes 400 ms after the end
assert.deepEqual(alertTiming(7000), { leaveAtMs: 6400, nextAtMs: 7400 });

// Dauer je Alert: a fixed number or a function of the alert, clamped to 1 ms up to 30 minutes, NaN gives 1
const raid = { kind: "raid" as const, user: "neo", amount: 42 };
assert.equal(alertDurationMs(5000, raid), 5000);
assert.equal(alertDurationMs(alert => (alert.amount ?? 0) * 100, raid), 4200);
for (const wrong of [0, -5, Number.NaN]) assert.equal(alertDurationMs(wrong, raid), 1, String(wrong));
assert.equal(alertDurationMs(3_600_000, raid), 1_800_000);
assert.equal(alertDurationMs(() => Number.POSITIVE_INFINITY, raid), 1_800_000);

// Decode: empty before the start, then character by character with up to 6 random characters before it, spaces stay
const scrambled = () => "?";
assert.equal(decodeFrame("ABC DEF", -1, 10, scrambled), "");
assert.equal(decodeFrame("ABC DEF", 25, 10, scrambled), "AB? ???");
assert.equal(decodeFrame("ABC DEF", 1000, 10, scrambled), "ABC DEF");

console.log("overlayTiming ok");
