// Media of a streamer (profile folder media/): list with sizes and the triggers that use a file,
// storage limit on upload, and deletion. streamerPath.isMediaName checks allowed names (no path, known extension).
// Check: media.check.ts.
import { readdir, readFile, stat, unlink } from "node:fs/promises";
import { join } from "node:path";
import { isMediaName } from "../src/core/streamerPath.ts";
import { writeAtomic } from "./atomicFile.ts";
import type { Trigger } from "./triggers.ts";

type MediaFile = { name: string; size: number; usedBy: string[] };
export type MediaList = { files: MediaFile[]; usedBytes: number; limitBytes: number };

// Names of the triggers whose actions use the file as image, video or sound
export function triggersUsing(triggers: readonly Trigger[], name: string): string[] {
  return triggers
    .filter(trigger => Array.isArray(trigger.do) && trigger.do.some(action => [action.image, action.video, action.sound].includes(name)))
    .map(trigger => trigger.name);
}

// null if the upload fits the limit, otherwise the error code. replacedBytes: size of the same-named file being replaced
export function quotaError(usedBytes: number, uploadBytes: number, replacedBytes: number, limitBytes: number) {
  return usedBytes - replacedBytes + uploadBytes > limitBytes ? ("quota-exceeded" as const) : null;
}

// One upload per streamer at a time: checking the limit and writing are apart, simultaneous uploads
// would all see the same old state and together exceed the limit
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

// Saves an upload if it fits the limit (a same-named file is replaced); otherwise the error code
export async function storeMedia(profileFolder: string, name: string, body: Buffer, limitBytes: number) {
  const media = await listMedia(profileFolder, limitBytes);
  const replaced = media.files.find(file => file.name === name)?.size ?? 0;
  const error = quotaError(media.usedBytes, body.length, replaced, limitBytes);
  if (!error) await writeAtomic(join(profileFolder, "media", name), body);
  return error;
}

// Deletes a file from the streamer's media folder; false for an invalid name or when it does not exist
export async function deleteMedia(profileFolder: string, name: string): Promise<boolean> {
  if (!isMediaName(name)) return false;
  return unlink(join(profileFolder, "media", name)).then(() => true, () => false);
}

// Rules from triggers.json; without or with a broken file none
async function readTriggers(profileFolder: string): Promise<Trigger[]> {
  try {
    const parsed = JSON.parse(await readFile(join(profileFolder, "triggers.json"), "utf8")) as { triggers?: unknown };
    return Array.isArray(parsed.triggers) ? (parsed.triggers as Trigger[]) : [];
  } catch {
    return [];
  }
}
