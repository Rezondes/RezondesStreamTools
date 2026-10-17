// Secret overlay key per streamer: the OBS URLs carry it as ?key=, only with it does an overlay get the
// live stream /s/<login>/events. This way no stranger can take up a streamer's connections and lock out their
// overlays. Stored in overlay.key in the profile (readable only by the server), cached in memory.
import { randomBytes, timingSafeEqual } from "node:crypto";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { writeAtomic } from "./atomicFile.ts";

const KEY = /^[0-9a-f]{32}$/;

// folderOf: profile folder of a login
export function overlayKeys(folderOf: (login: string) => string) {
  const known = new Map<string, string>();

  async function create(login: string) {
    const key = randomBytes(16).toString("hex");
    await writeAtomic(join(folderOf(login), "overlay.key"), key, 0o600);
    known.set(login, key);
    return key;
  }

  async function get(login: string): Promise<string> {
    const cached = known.get(login);
    if (cached) return cached;
    const stored = (await readFile(join(folderOf(login), "overlay.key"), "utf8").catch(() => "")).trim();
    if (!KEY.test(stored)) return create(login);
    known.set(login, stored);
    return stored;
  }

  return {
    get,
    // New key: all previous OBS URLs stop working
    rotate: create,
    async matches(login: string, given: string) {
      const expected = Buffer.from(await get(login));
      const candidate = Buffer.from(given);
      return candidate.length === expected.length && timingSafeEqual(candidate, expected);
    },
  };
}
