// Übernahme der alten Einzel-Daten (ein Streamer, vor dem Umbau) in ein Profil, beim Start:
// DATA/tokens.json, DATA/spotify.json, CONFIG/triggers.json und CONFIG/media/* -> DATA/streamers/<login>/.
// Danach werden die alten Dateien zu *.migrated umbenannt (der Medienordner als Ganzes). Ist CONFIG schreibgeschützt,
// bleiben sie liegen; beim nächsten Start ist nichts mehr zu kopieren, weil das Profil sie schon hat.
// Der Login kommt aus DATA/tokens.json (oder tokens.json.migrated), sonst ist es der erste Admin; er landet in der Allowlist.
// plan entscheidet rein, migrate liest und schreibt. Check: migration.check.ts.
import { access as exists, readdir, readFile, rename } from "node:fs/promises";
import { basename, join } from "node:path";
import { isMediaName } from "../src/core/streamerPath.ts";
import type { AccessStore } from "./access.ts";
import { writeAtomic } from "./atomicFile.ts";
import * as profile from "./profile.ts";
import { toTokens } from "./twitch.ts";

const DATA_FILES = ["tokens.json", "spotify.json"];
const CONFIG_FILES = ["triggers.json"];
// Token-Dateien bleiben nur für den Server lesbar (Regel 27)
const SECRET_FILES = ["tokens.json", "spotify.json"];

// Vorgefundene Dateien als Namen relativ zum jeweiligen Ordner, Medien als "media/<name>"
export type Found = {
  data: string[]; // Altdateien in DATA
  config: string[]; // Altdateien in CONFIG
  existing: string[]; // schon im Profil vorhanden, wird nie überschrieben
};
export type Folders = { data: string; config: string; profile: string };
export type Move = { from: string; to: string };
export type MigrationPlan = { copies: Move[]; renames: Move[] };

// Was zu tun ist; null, wenn es keine Altdateien gibt
export function plan(found: Found, folders: Folders): MigrationPlan | null {
  if (found.data.length === 0 && found.config.length === 0) return null;
  const sources = [
    ...found.data.map(name => ({ name, from: join(folders.data, name) })),
    ...found.config.map(name => ({ name, from: join(folders.config, name) })),
  ];
  const copies = sources
    .filter(source => !found.existing.includes(source.name))
    .map(source => ({ from: source.from, to: join(folders.profile, source.name) }));
  // Einzelne Dateien einzeln umbenennen, die Medien als ganzen Ordner
  const renamed = sources.filter(source => !source.name.startsWith("media/")).map(source => source.from);
  if (found.config.some(name => name.startsWith("media/"))) renamed.push(join(folders.config, "media"));
  return { copies, renames: renamed.map(from => ({ from, to: `${from}.migrated` })) };
}

// Führt die Übernahme aus. Liefert den Login und den Plan, oder null, wenn nichts zu tun war.
export async function migrate(folders: { data: string; config: string }, admins: string[], access: AccessStore) {
  const login = (await legacyLogin(folders.data)) ?? admins[0];
  if (!login) return null;
  const profileFolder = profile.folder(folders.data, login);
  const media = (await readdir(join(folders.config, "media")).catch(() => [] as string[])).filter(isMediaName).map(name => `media/${name}`);
  const found: Found = {
    data: await present(folders.data, DATA_FILES),
    config: [...(await present(folders.config, CONFIG_FILES)), ...media],
    existing: await present(profileFolder, [...DATA_FILES, ...CONFIG_FILES, ...media]),
  };
  const steps = plan(found, { ...folders, profile: profileFolder });
  if (!steps) return null;
  for (const copy of steps.copies) await writeAtomic(copy.to, await readFile(copy.from), SECRET_FILES.includes(basename(copy.to)) ? 0o600 : 0o644);
  for (const move of steps.renames) {
    await rename(move.from, move.to).catch((error: unknown) => {
      console.warn(`Could not rename ${move.from}, it stays and is skipped from now on (read-only?):`, error instanceof Error ? error.message : error);
    });
  }
  // Nur beim ersten Mal in die Allowlist; später entscheidet der Admin
  const allowlist = access.get().allowlist;
  if (steps.copies.length > 0 && !allowlist.includes(login)) await access.save({ ...access.get(), allowlist: [...allowlist, login] });
  console.log(`Migrated legacy data to profile ${login}: ${steps.copies.length} files copied`);
  return { login, ...steps };
}

// Login aus den alten Twitch-Tokens, auch wenn sie schon umbenannt sind
async function legacyLogin(dataDir: string) {
  for (const name of ["tokens.json", "tokens.json.migrated"]) {
    const text = await readFile(join(dataDir, name), "utf8").catch(() => null);
    const tokens = text === null ? null : parseTokens(text);
    if (tokens) return tokens.login;
  }
  return null;
}

function parseTokens(text: string) {
  try {
    return toTokens(JSON.parse(text));
  } catch {
    // Kaputte Datei: kein Login daraus
    return null;
  }
}

// Welche der Namen in folder vorhanden sind
async function present(folder: string, names: string[]) {
  const checked = await Promise.all(names.map(name => exists(join(folder, name)).then(() => name, () => null)));
  return checked.filter(name => name !== null);
}
