// Atomares Schreiben (Regel 28): erst eine temporäre Datei daneben, dann umbenennen.
// Ein Absturz hinterlässt so nie eine halbe Datei. Check: atomicFile.check.ts.
import { mkdir, rename, writeFile } from "node:fs/promises";
import { dirname } from "node:path";

// Zähler statt Zufall: zwei gleichzeitige Schreibvorgänge auf dieselbe Datei kommen sich nicht in die Quere
let counter = 0;

// Schreibt content nach file und legt den Ordner an. mode z.B. 0o600 für Token-Dateien (Regel 27).
export async function writeAtomic(file: string, content: string | Buffer, mode = 0o644) {
  await mkdir(dirname(file), { recursive: true });
  counter += 1;
  const temporary = `${file}.${process.pid}.${counter}.tmp`;
  await writeFile(temporary, content, { mode });
  await rename(temporary, file);
}
