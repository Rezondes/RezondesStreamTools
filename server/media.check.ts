// Check für media.ts: Speicherlimit, Nutzung durch Trigger, Liste mit Grössen und Löschen nur gültiger Namen.
// Arbeitet in einem eigenen Temp-Ordner, nie in data/. Läuft mit npm test.
import assert from "node:assert/strict";
import { mkdir, mkdtemp, readdir, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { deleteMedia, listMedia, quotaError, storeMedia, triggersUsing, uploadSlots } from "./media.ts";
import type { Trigger } from "./triggers.ts";

const MB = 1024 * 1024;

// Limit: 190 MB belegt, 20 MB dazu bei 200 MB Limit ist zu viel; ersetzt der Upload eine 15-MB-Datei, passt es
assert.equal(quotaError(190 * MB, 20 * MB, 0, 200 * MB), "quota-exceeded");
assert.equal(quotaError(190 * MB, 20 * MB, 15 * MB, 200 * MB), null);
assert.equal(quotaError(0, 200 * MB, 0, 200 * MB), null);

// Nutzung: Trigger, die die Datei als Bild, Video oder Ton verwenden
const triggers: Trigger[] = [
  { name: "lizard", when: { type: "word", match: "LIZARD" }, do: [{ type: "media", image: "lizard.gif", sound: "lizard.wav" }] },
  { name: "hype", when: { type: "word", match: "HYPE" }, do: [{ type: "text", text: "HYPE" }, { type: "media", video: "lizard.gif" }] },
  { name: "other", when: { type: "word", match: "X" }, do: [{ type: "media", image: "x.png" }] },
];
assert.deepEqual(triggersUsing(triggers, "lizard.gif"), ["lizard", "hype"]);
assert.deepEqual(triggersUsing(triggers, "lizard.wav"), ["lizard"]);
assert.deepEqual(triggersUsing(triggers, "nichts.gif"), []);

// Liste und Löschen in einem Temp-Profil
const profile = await mkdtemp(join(tmpdir(), "rz-media-"));
try {
  await mkdir(join(profile, "media"));
  await writeFile(join(profile, "media", "lizard.gif"), Buffer.alloc(3000));
  await writeFile(join(profile, "media", "beep.wav"), Buffer.alloc(1000));
  await writeFile(join(profile, "media", "notes.txt"), "kein Medium");
  await writeFile(join(profile, "triggers.json"), JSON.stringify({ triggers }));

  const list = await listMedia(profile, 200 * MB);
  assert.deepEqual(list.files, [
    { name: "beep.wav", size: 1000, usedBy: [] },
    { name: "lizard.gif", size: 3000, usedBy: ["lizard", "hype"] },
  ]);
  assert.equal(list.usedBytes, 4000);
  assert.equal(list.limitBytes, 200 * MB);

  // Nur gültige Namen im eigenen Ordner; Pfade und fremde Endungen werden abgelehnt
  assert.equal(await deleteMedia(profile, "../triggers.json"), false);
  assert.equal(await deleteMedia(profile, "a.exe"), false);
  assert.equal(await deleteMedia(profile, "../x.gif"), false);
  assert.equal(await deleteMedia(profile, "fehlt.gif"), false);
  assert.equal(await deleteMedia(profile, "lizard.gif"), true);
  assert.deepEqual((await readdir(join(profile, "media"))).sort(), ["beep.wav", "notes.txt"]);

  // Ohne Ordner und ohne triggers.json: leere Liste
  assert.deepEqual(await listMedia(join(profile, "fehlt"), MB), { files: [], usedBytes: 0, limitBytes: MB });
} finally {
  await rm(profile, { recursive: true, force: true });
}

// Speichern: passt ins Limit = gespeichert, sonst Fehlercode und nichts geschrieben; Ersetzen zählt die alte Datei ab
const store = await mkdtemp(join(tmpdir(), "media-store-"));
assert.equal(await storeMedia(store, "a.png", Buffer.alloc(6), 10), null);
assert.equal(await storeMedia(store, "b.png", Buffer.alloc(6), 10), "quota-exceeded");
assert.equal(await storeMedia(store, "a.png", Buffer.alloc(9), 10), null);
assert.deepEqual((await listMedia(store, 10)).files.map(file => [file.name, file.size]), [["a.png", 9]]);
await rm(store, { recursive: true, force: true });

// Ein Upload pro Streamer zur Zeit, andere Streamer laufen parallel
const slots = uploadSlots();
assert.equal(slots.take("neo"), true);
assert.equal(slots.take("neo"), false);
assert.equal(slots.take("trinity"), true);
slots.release("neo");
assert.equal(slots.take("neo"), true);

console.log("media ok");
