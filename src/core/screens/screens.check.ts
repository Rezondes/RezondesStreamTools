// Check für screens.ts: Countdown, Pausenzeit, kurze Uhr, wechselnde Sprüche und die Skalierung der Bühne.
// Läuft mit npm test.
import assert from "node:assert/strict";
import { countdown, rotating, shortClock, stageScale } from "./screens.ts";

// Countdown: Rest in Sekunden und Anteil der vergangenen Zeit; vorbei = 0 und 1; ohne Dauer gleich fertig
assert.deepEqual(countdown(0, 60_000, 15_000), { left: 45, progress: 0.25 });
assert.deepEqual(countdown(0, 60_000, 90_000), { left: 0, progress: 1 });
assert.deepEqual(countdown(5, 5, 5), { left: 0, progress: 1 });

// Kurze Uhr: unter einer Stunde MM:SS, sonst HH:MM:SS
assert.equal(shortClock(125), "02:05");
assert.equal(shortClock(3725), "01:02:05");

// Sprüche wechseln alle everyMs der Reihe nach, leere Liste = kein Spruch, Tempo 0 = immer der erste
assert.equal(rotating(["a", "b", "c"], 1000, 2500), "c");
assert.equal(rotating(["a", "b", "c"], 1000, 3500), "a");
assert.equal(rotating([], 1000, 3500), "");
assert.equal(rotating(["a", "b"], 0, 3500), "a");

// Bühne 1920x1080: so gross wie möglich in die Quelle
assert.equal(stageScale(960, 1080), 0.5);
assert.equal(stageScale(3840, 1080), 1);

console.log("screens ok");
