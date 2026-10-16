// Check für overlayTiming.ts: Zeitanzeige, Musik-Fortschritt, Effekt-Phasen und -Position, Alert-Zeiten,
// Entschlüsselungs-Effekt. Läuft mit npm test.
import assert from "node:assert/strict";
import { alertTiming, clock, countdownEnd, currentProgress, decodeFrame, fxLifetime, fxPhase, marqueeSeconds, placeFx } from "./overlayTiming.ts";

// Uhr: Stunden:Minuten:Sekunden, nie negativ
assert.equal(clock(3725), "01:02:05");
assert.equal(clock(-5), "00:00:00");

// Musik: läuft weiter ab Empfang, gedeckelt bei der Länge; bei Pause unverändert
const track = { durationMs: 10_000, progressMs: 2000, playing: true };
assert.equal(currentProgress(track, 1000, 4000), 5000);
assert.equal(currentProgress(track, 1000, 99_000), 10_000);
assert.equal(currentProgress({ ...track, playing: false }, 1000, 4000), 2000);

// Effekt-Phasen: delay angehalten, duration abspielen, after stehen bleiben, dann vorbei
const action = { type: "media" as const, delay: 1, duration: 3, after: 2 };
assert.equal(fxPhase(action, 500), "pre");
assert.equal(fxPhase(action, 2000), "play");
assert.equal(fxPhase(action, 4500), "post");
assert.equal(fxPhase(action, 6000), "done");
assert.equal(fxLifetime(action), 6000);
// Standarddauer 4 s, ohne delay sofort abspielen
assert.equal(fxPhase({ type: "media" }, 0), "play");
assert.equal(fxLifetime({ type: "media" }), 4000);

// Position: Mitte, fest, zufällig im Bereich 20 bis 80 Prozent
assert.deepEqual(placeFx("center", () => 0.5), { x: 50, y: 50 });
assert.deepEqual(placeFx({ x: 10, y: 90 }, () => 0.5), { x: 10, y: 90 });
assert.deepEqual(placeFx("random", () => 0), { x: 20, y: 20 });
assert.deepEqual(placeFx("random", () => 1), { x: 80, y: 80 });
assert.deepEqual(placeFx(undefined, () => 0.5), { x: 50, y: 50 });
// Eigener Rand für Zufallspositionen
assert.deepEqual(placeFx("random", () => 0, 10), { x: 10, y: 10 });
assert.deepEqual(placeFx("random", () => 1, 10), { x: 90, y: 90 });

// Countdown-Ende: ?at=HH:MM heute (oder morgen, wenn schon vorbei), sonst die Sekunden ab now
const now = new Date(2026, 9, 15, 19, 30, 0);
assert.equal(countdownEnd("20:00", 300, now), new Date(2026, 9, 15, 20, 0, 0).getTime());
assert.equal(countdownEnd("19:00", 300, now), new Date(2026, 9, 16, 19, 0, 0).getTime());
assert.equal(countdownEnd(null, 300, now), now.getTime() + 300_000);
assert.equal(countdownEnd("kaputt", 60, now), now.getTime() + 60_000);

// Alert: Ausblenden beginnt 600 ms vor Ende, der nächste kommt 400 ms nach Ende
assert.deepEqual(alertTiming(7000), { leaveAtMs: 6400, nextAtMs: 7400 });

// Entschlüsseln: vor dem Start leer, dann Zeichen für Zeichen mit bis zu 6 Zufallszeichen davor, Leerzeichen bleiben
const scrambled = () => "?";
assert.equal(decodeFrame("ABC DEF", -1, 10, scrambled), "");
assert.equal(decodeFrame("ABC DEF", 25, 10, scrambled), "AB? ???");
assert.equal(decodeFrame("ABC DEF", 1000, 10, scrambled), "ABC DEF");

// Lauftext: Dauer wächst mit der Strecke (Fahrt ist 70 % der Dauer), auch sehr lange Titel laufen mit gleichem Tempo;
// ohne Überstand oder ohne Tempo keine Dauer
assert.equal(marqueeSeconds(280, 40), 10);
assert.equal(marqueeSeconds(2800, 40), 100);
assert.equal(marqueeSeconds(0, 40), 0);
assert.equal(marqueeSeconds(100, 0), 0);

console.log("overlayTiming ok");
