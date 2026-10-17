// Check for atomicFile.ts: atomic writes into a temporary folder that is deleted afterwards. Runs with npm test.
import assert from "node:assert/strict";
import { mkdtemp, readdir, readFile, rm, stat } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { writeAtomic } from "./atomicFile.ts";

const folder = await mkdtemp(join(tmpdir(), "atomic-"));
try {
  // Creates missing folders, overwrites and leaves no temporary file behind
  const file = join(folder, "deep", "tokens.json");
  await writeAtomic(file, "old", 0o600);
  await writeAtomic(file, "new", 0o600);
  assert.equal(await readFile(file, "utf8"), "new");
  assert.deepEqual(await readdir(join(folder, "deep")), ["tokens.json"]);

  // Token files readable only by the owner (Windows has no Unix permissions)
  if (process.platform !== "win32") assert.equal((await stat(file)).mode & 0o777, 0o600);

  // Binary data stays unchanged
  await writeAtomic(join(folder, "media.bin"), Buffer.from([0, 1, 255]));
  assert.deepEqual([...(await readFile(join(folder, "media.bin")))], [0, 1, 255]);
} finally {
  await rm(folder, { recursive: true, force: true });
}

console.log("atomicFile ok");
