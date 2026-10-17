// Medien eines Streamers (Profil-Ordner media/): Liste mit Grössen und den Triggern, die eine Datei nutzen,
// Speicherlimit beim Hochladen und Löschen. Erlaubte Namen prüft streamerPath.isMediaName (kein Pfad, bekannte Endung).
// Check: media.check.ts.
import { readdir, readFile, stat, unlink } from "node:fs/promises";
import { join } from "node:path";
import { isMediaName } from "../src/core/streamerPath.ts";
import { writeAtomic } from "./atomicFile.ts";
import type { Trigger } from "./triggers.ts";

type MediaFile = { name: string; size: number; usedBy: string[] };
export type MediaList = { files: MediaFile[]; usedBytes: number; limitBytes: number };

// Namen der Trigger, deren Aktionen die Datei als Bild, Video oder Ton verwenden
export function triggersUsing(triggers: readonly Trigger[], name: string): string[] {
  return triggers
    .filter(trigger => Array.isArray(trigger.do) && trigger.do.some(action => [action.image, action.video, action.sound].includes(name)))
    .map(trigger => trigger.name);
}

// null, wenn der Upload ins Limit passt, sonst der Fehlercode. replacedBytes: Grösse der gleichnamigen Datei, die ersetzt wird
export function quotaError(usedBytes: number, uploadBytes: number, replacedBytes: number, limitBytes: number) {
  return usedBytes - replacedBytes + uploadBytes > limitBytes ? ("quota-exceeded" as const) : null;
}

// Ein Upload pro Streamer zur Zeit: Prüfen des Limits und Schreiben liegen auseinander, gleichzeitige Uploads
// sähen alle denselben alten Stand und kämen zusammen über das Limit
export function uploadSlots() {
  const busy = new Set<string>();
  return {
    take: (login: string) => (busy.has(login) ? false : (busy.add(login), true)),
    release: (login: string) => { busy.delete(login); },
  };
}

export async function listMedia(profileFolder: string, limitBytes: number): Promise<MediaList> {
  const folder = join(profileFolder, "media");
  const names = (await readdir(folder).catch(() => [] as string[])).filter(isMediaName).sort();
  const triggers = await readTriggers(profileFolder);
  const files = await Promise.all(names.map(async name => ({ name, size: (await stat(join(folder, name))).size, usedBy: triggersUsing(triggers, name) })));
  return { files, usedBytes: files.reduce((sum, file) => sum + file.size, 0), limitBytes };
}

// Speichert einen Upload, wenn er ins Limit passt (eine gleichnamige Datei wird ersetzt); sonst der Fehlercode
export async function storeMedia(profileFolder: string, name: string, body: Buffer, limitBytes: number) {
  const media = await listMedia(profileFolder, limitBytes);
  const replaced = media.files.find(file => file.name === name)?.size ?? 0;
  const error = quotaError(media.usedBytes, body.length, replaced, limitBytes);
  if (!error) await writeAtomic(join(profileFolder, "media", name), body);
  return error;
}

// Löscht eine Datei aus dem Medienordner des Streamers; false bei ungültigem Namen oder wenn es sie nicht gibt
export async function deleteMedia(profileFolder: string, name: string): Promise<boolean> {
  if (!isMediaName(name)) return false;
  return unlink(join(profileFolder, "media", name)).then(() => true, () => false);
}

// Regeln aus triggers.json; ohne oder mit kaputter Datei keine
async function readTriggers(profileFolder: string): Promise<Trigger[]> {
  try {
    const parsed = JSON.parse(await readFile(join(profileFolder, "triggers.json"), "utf8")) as { triggers?: unknown };
    return Array.isArray(parsed.triggers) ? (parsed.triggers as Trigger[]) : [];
  } catch {
    return [];
  }
}
