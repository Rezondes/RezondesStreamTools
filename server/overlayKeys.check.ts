// Check für overlayKeys.ts: Schlüssel je Streamer anlegen, wiederfinden, prüfen und neu erzeugen. Arbeitet in einem
// temporären Ordner, der danach gelöscht wird. Läuft mit npm test.
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

  // Erster Zugriff legt einen zufälligen Schlüssel an, nur für den Server lesbar
  const key = await keys.get("neo");
  assert.match(key, /^[0-9a-f]{32}$/);
  assert.equal(await readFile(join(folderOf("neo"), "overlay.key"), "utf8"), key);
  if (process.platform !== "win32") assert.equal((await stat(join(folderOf("neo"), "overlay.key"))).mode & 0o777, 0o600);
  assert.equal(await keys.get("neo"), key);
  // Nach einem Neustart des Servers derselbe Schlüssel aus der Datei; jeder Streamer hat seinen eigenen
  assert.equal(await overlayKeys(folderOf).get("neo"), key);
  assert.notEqual(await keys.get("trinity"), key);

  // Prüfen: nur der genaue Schlüssel des Streamers
  assert.equal(await keys.matches("neo", key), true);
  assert.equal(await keys.matches("neo", ""), false);
  assert.equal(await keys.matches("neo", key.slice(1)), false);
  assert.equal(await keys.matches("trinity", key), false);

  // Neu erzeugen: der alte Schlüssel gilt nicht mehr
  const rotated = await keys.rotate("neo");
  assert.notEqual(rotated, key);
  assert.equal(await keys.matches("neo", key), false);
  assert.equal(await keys.matches("neo", rotated), true);

  // Kaputte Datei: neuer Schlüssel
  await writeFile(join(folderOf("trinity"), "overlay.key"), "kaputt");
  assert.match(await overlayKeys(folderOf).get("trinity"), /^[0-9a-f]{32}$/);
} finally {
  await rm(dataDir, { recursive: true, force: true });
}

console.log("overlayKeys ok");
