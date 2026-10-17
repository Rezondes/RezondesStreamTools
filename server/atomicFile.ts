// Atomic writes (rule 28): first a temporary file next to the target, then rename.
// A crash never leaves half a file behind. Check: atomicFile.check.ts.
import { mkdir, rename, writeFile } from "node:fs/promises";
import { dirname } from "node:path";

// Counter instead of randomness: two simultaneous writes to the same file never get in each other's way
let counter = 0;

// Writes content to file and creates the folder. mode e.g. 0o600 for token files (rule 27).
export async function writeAtomic(file: string, content: string | Buffer, mode = 0o644) {
  await mkdir(dirname(file), { recursive: true });
  counter += 1;
  const temporary = `${file}.${process.pid}.${counter}.tmp`;
  await writeFile(temporary, content, { mode });
  await rename(temporary, file);
}
