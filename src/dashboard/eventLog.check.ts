// Check für eventLog.ts: Texte je Ereignis, nur Änderungen bei Musik, Beitreten und Verlassen bei Minimes, Rauschen
// fällt weg, Obergrenze der Liste. Läuft mit npm test.
import assert from "node:assert/strict";
import type { Minime, ServerMessage, Track } from "../core/types.ts";
import { EMPTY_LOG, logMessage, MAX_ENTRIES, type LogState } from "./eventLog.ts";

const run = (messages: ServerMessage[], start: LogState = EMPTY_LOG) => messages.reduce((state, message, index) => logMessage(state, message, 1000 + index), start);
const texts = (state: LogState) => state.entries.map(entry => `${entry.kind}: ${entry.text}`);

// Alerts: ein Satz je Art, Nachricht des Zuschauers in Anführungszeichen; neueste zuerst
assert.deepEqual(texts(run([
  { type: "alert", alert: { kind: "follow", user: "neo" } },
  { type: "alert", alert: { kind: "sub", user: "neo", text: "hallo" } },
  { type: "alert", alert: { kind: "resub", user: "neo", amount: 12 } },
  { type: "alert", alert: { kind: "gift", user: "neo", amount: 5 } },
  { type: "alert", alert: { kind: "raid", user: "neo", amount: 42 } },
  { type: "alert", alert: { kind: "cheer", user: "neo", amount: 500 } },
  { type: "alert", alert: { kind: "redeem", user: "neo", detail: "Hydrieren!" } },
  { type: "alert", alert: { kind: "hype", user: "HYPE", amount: 1, detail: "begin" } },
  { type: "alert", alert: { kind: "hype", user: "HYPE", amount: 3 } },
  { type: "alert", alert: { kind: "hype", user: "HYPE", amount: 4, detail: "end" } },
])).reverse(), [
  "alert: neo folgt jetzt",
  "alert: neo hat abonniert: \"hallo\"",
  "alert: neo abonniert seit 12 Monaten",
  "alert: neo verschenkt 5 Abos",
  "alert: neo raidet mit 42 Zuschauern",
  "alert: neo schickt 500 Bits",
  "alert: neo löst \"Hydrieren!\" ein",
  "alert: Hype Train gestartet",
  "alert: Hype Train Stufe 3",
  "alert: Hype Train beendet, Stufe 4",
]);

// Effekte mit auslösender Nachricht
assert.deepEqual(texts(run([{ type: "fx", event: { id: 1, zone: "mitte", action: { type: "text" }, user: "neo", message: "!boom" } }])), ["fx: neo löst einen Effekt aus: \"!boom\""]);

// Musik: Stille beim Verbinden zählt nicht, gleicher Titel (gespult) nicht doppelt, Pause und Stopp schon
const song: Track = { id: "1", title: "Wake Up", artist: "RATM", album: "", cover: null, durationMs: 1, progressMs: 0, playing: true };
assert.deepEqual(texts(run([
  { type: "music", track: null },
  { type: "music", track: song },
  { type: "music", track: { ...song, progressMs: 50 } },
  { type: "music", track: { ...song, playing: false } },
  { type: "music", track: null },
])).reverse(), ["music: Läuft: Wake Up von RATM", "music: Pausiert: Wake Up von RATM", "music: Musik gestoppt"]);

// Minimes: die erste Liste ist der Stand (nur gezählt), danach Beitreten und Verlassen
const minime = (login: string): Minime => ({ login, user: login.toUpperCase(), color: null, variant: null });
assert.deepEqual(texts(run([
  { type: "minimes", minimes: [minime("neo")] },
  { type: "minimes", minimes: [minime("neo"), minime("trinity")] },
  { type: "minimes", minimes: [minime("trinity")] },
])).reverse(), ["minimes: 1 Minimes in der Szene", "minimes: TRINITY ist als Minime beigetreten", "minimes: NEO hat die Szene verlassen"]);
assert.deepEqual(texts(run([{ type: "minimes", minimes: [] }])), []);

// Rauschen: Einstellungen und Minime-Reaktionen erscheinen nicht
assert.deepEqual(run([{ type: "minimeChat", login: "neo" }]).entries, []);

// Zeit und fortlaufende id; Obergrenze schneidet die ältesten ab
const one = run([{ type: "alert", alert: { kind: "follow", user: "neo" } }]);
assert.deepEqual(one.entries[0], { id: 0, at: 1000, kind: "alert", text: "neo folgt jetzt" });
const many = run(Array.from({ length: MAX_ENTRIES + 5 }, (): ServerMessage => ({ type: "alert", alert: { kind: "follow", user: "neo" } })));
assert.equal(many.entries.length, MAX_ENTRIES);
assert.equal(many.entries[0].id, MAX_ENTRIES + 4);

console.log("eventLog ok");
