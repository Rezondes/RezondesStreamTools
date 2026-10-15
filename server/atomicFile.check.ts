// Check für atomicFile.ts: atomares Schreiben in einen temporären Ordner, der danach gelöscht wird. Läuft mit npm test.
import assert from "node:assert/strict";
import { mkdtemp, readdir, readFile, rm, stat } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { writeAtomic } from "./atomicFile.ts";

const folder = await mkdtemp(join(tmpdir(), "atomic-"));
try {
  // Legt fehlende Ordner an, überschreibt und lässt keine temporäre Datei liegen
  const file = join(folder, "deep", "tokens.json");
  await writeAtomic(file, "old", 0o600);
  await writeAtomic(file, "new", 0o600);
  assert.equal(await readFile(file, "utf8"), "new");
  assert.deepEqual(await readdir(join(folder, "deep")), ["tokens.json"]);

  // Token-Dateien nur für den Besitzer lesbar (Windows kennt keine Unix-Rechte)
  if (process.platform !== "win32") assert.equal((await stat(file)).mode & 0o777, 0o600);

  // Binärdaten bleiben unverändert
  await writeAtomic(join(folder, "media.bin"), Buffer.from([0, 1, 255]));
  assert.deepEqual([...(await readFile(join(folder, "media.bin")))], [0, 1, 255]);
} finally {
  await rm(folder, { recursive: true, force: true });
}

console.log("atomicFile ok");
