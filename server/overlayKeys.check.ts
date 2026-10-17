// Check for overlayKeys.ts: create, find again, check and regenerate the key per streamer. Works in a
// temporary folder that is deleted afterwards. Runs with npm test.
import assert from "node:assert/strict";
import { mkdir, mkdtemp, readFile, rm, stat, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { overlayKeys } from "./overlayKeys.ts";

const dataDir = await mkdtemp(join(tmpdir(), "overlay-keys-"));
try {
  const folderOf = (login: string) => join(dataDir, login);
  await mkdir(folderOf("neo"));
  await mkdir(folderOf("trinity"));
  const keys = overlayKeys(folderOf);

  // The first access creates a random key, readable only by the server
  const key = await keys.get("neo");
  assert.match(key, /^[0-9a-f]{32}$/);
  assert.equal(await readFile(join(folderOf("neo"), "overlay.key"), "utf8"), key);
  if (process.platform !== "win32") assert.equal((await stat(join(folderOf("neo"), "overlay.key"))).mode & 0o777, 0o600);
  assert.equal(await keys.get("neo"), key);
  // After a server restart the same key from the file; every streamer has their own
  assert.equal(await overlayKeys(folderOf).get("neo"), key);
  assert.notEqual(await keys.get("trinity"), key);

  // Check: only the exact key of the streamer
  assert.equal(await keys.matches("neo", key), true);
  assert.equal(await keys.matches("neo", ""), false);
  assert.equal(await keys.matches("neo", key.slice(1)), false);
  assert.equal(await keys.matches("trinity", key), false);

  // Regenerate: the old key no longer works
  const rotated = await keys.rotate("neo");
  assert.notEqual(rotated, key);
  assert.equal(await keys.matches("neo", key), false);
  assert.equal(await keys.matches("neo", rotated), true);

  // Broken file: new key
  await writeFile(join(folderOf("trinity"), "overlay.key"), "kaputt");
  assert.match(await overlayKeys(folderOf).get("trinity"), /^[0-9a-f]{32}$/);
} finally {
  await rm(dataDir, { recursive: true, force: true });
}

console.log("overlayKeys ok");
