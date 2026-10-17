// Geheimer Overlay-Schlüssel je Streamer: die OBS-URLs tragen ihn als ?key=, nur damit bekommt ein Overlay den
// Live-Stream /s/<login>/events. So kann niemand Fremdes die Verbindungen eines Streamers belegen und seine Overlays
// aussperren. Gespeichert in overlay.key im Profil (nur für den Server lesbar), im Speicher zwischengespeichert.
import { randomBytes, timingSafeEqual } from "node:crypto";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { writeAtomic } from "./atomicFile.ts";

const KEY = /^[0-9a-f]{32}$/;

// folderOf: Profil-Ordner eines Logins
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
    // Neuer Schlüssel: alle bisherigen OBS-URLs gelten nicht mehr
    rotate: create,
    async matches(login: string, given: string) {
      const expected = Buffer.from(await get(login));
      const candidate = Buffer.from(given);
      return candidate.length === expected.length && timingSafeEqual(candidate, expected);
    },
  };
}
