// Check for media.ts: storage limit, use by triggers, list with sizes and deleting only valid names.
// Works in its own temp folder, never in data/. Runs with npm test.
import assert from "node:assert/strict";
import { mkdir, mkdtemp, readdir, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { deleteMedia, listMedia, quotaError, storeMedia, triggersUsing, uploadSlots } from "./media.ts";
import type { Trigger } from "./triggers.ts";

const MB = 1024 * 1024;

// Limit: 190 MB used, 20 MB more at a 200 MB limit is too much; if the upload replaces a 15 MB file, it fits
assert.equal(quotaError(190 * MB, 20 * MB, 0, 200 * MB), "quota-exceeded");
assert.equal(quotaError(190 * MB, 20 * MB, 15 * MB, 200 * MB), null);
assert.equal(quotaError(0, 200 * MB, 0, 200 * MB), null);

// Use: triggers that use the file as image, video or sound
const triggers: Trigger[] = [
  { name: "lizard", when: { type: "word", match: "LIZARD" }, do: [{ type: "media", image: "lizard.gif", sound: "lizard.wav" }] },
  { name: "hype", when: { type: "word", match: "HYPE" }, do: [{ type: "text", text: "HYPE" }, { type: "media", video: "lizard.gif" }] },
  { name: "other", when: { type: "word", match: "X" }, do: [{ type: "media", image: "x.png" }] },
];
assert.deepEqual(triggersUsing(triggers, "lizard.gif"), ["lizard", "hype"]);
assert.deepEqual(triggersUsing(triggers, "lizard.wav"), ["lizard"]);
assert.deepEqual(triggersUsing(triggers, "nichts.gif"), []);

// List and delete in a temp profile
const profile = await mkdtemp(join(tmpdir(), "rz-media-"));
try {
  await mkdir(join(profile, "media"));
  await writeFile(join(profile, "media", "lizard.gif"), Buffer.alloc(3000));
  await writeFile(join(profile, "media", "beep.wav"), Buffer.alloc(1000));
  await writeFile(join(profile, "media", "notes.txt"), "not media");
  await writeFile(join(profile, "triggers.json"), JSON.stringify({ triggers }));

  const list = await listMedia(profile, 200 * MB);
  assert.deepEqual(list.files, [
    { name: "beep.wav", size: 1000, usedBy: [] },
    { name: "lizard.gif", size: 3000, usedBy: ["lizard", "hype"] },
  ]);
  assert.equal(list.usedBytes, 4000);
  assert.equal(list.limitBytes, 200 * MB);

  // Only valid names in the own folder; paths and foreign extensions are rejected
  assert.equal(await deleteMedia(profile, "../triggers.json"), false);
  assert.equal(await deleteMedia(profile, "a.exe"), false);
  assert.equal(await deleteMedia(profile, "../x.gif"), false);
  assert.equal(await deleteMedia(profile, "fehlt.gif"), false);
  assert.equal(await deleteMedia(profile, "lizard.gif"), true);
  assert.deepEqual((await readdir(join(profile, "media"))).sort(), ["beep.wav", "notes.txt"]);

  // Without a folder and without triggers.json: empty list
  assert.deepEqual(await listMedia(join(profile, "fehlt"), MB), { files: [], usedBytes: 0, limitBytes: MB });
} finally {
  await rm(profile, { recursive: true, force: true });
}

// Save: fits the limit = saved, otherwise error code and nothing written; replacing subtracts the old file
const store = await mkdtemp(join(tmpdir(), "media-store-"));
assert.equal(await storeMedia(store, "a.png", Buffer.alloc(6), 10), null);
assert.equal(await storeMedia(store, "b.png", Buffer.alloc(6), 10), "quota-exceeded");
assert.equal(await storeMedia(store, "a.png", Buffer.alloc(9), 10), null);
assert.deepEqual((await listMedia(store, 10)).files.map(file => [file.name, file.size]), [["a.png", 9]]);
await rm(store, { recursive: true, force: true });

// One upload per streamer at a time, other streamers run in parallel
const slots = uploadSlots();
assert.equal(slots.take("neo"), true);
assert.equal(slots.take("neo"), false);
assert.equal(slots.take("trinity"), true);
slots.release("neo");
assert.equal(slots.take("neo"), true);

console.log("media ok");
