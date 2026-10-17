// Profile of a streamer: folder DATA/streamers/<login>/ with tokens.json (Twitch, mode 600), spotify.json,
// triggers.json, settings.json, profile.json (last login, Twitch ID of the owner) and media/. Here: find folders, read,
// write and delete the Twitch tokens, and remember the last login.
// Meant for import * as profile. Check: profile.check.ts.
import { readdir, readFile, rm } from "node:fs/promises";
import { join } from "node:path";
import { isLogin } from "../src/core/streamerPath.ts";
import { writeAtomic } from "./atomicFile.ts";
import { toTokens, type TwitchTokens } from "./twitch.ts";

// Profile folder of a login (login must satisfy isLogin)
export const folder = (dataDir: string, login: string) => join(dataDir, "streamers", login);

// Logins of all profiles, sorted; folders with an invalid name do not count
export async function list(dataDir: string): Promise<string[]> {
  const entries = await readdir(join(dataDir, "streamers"), { withFileTypes: true }).catch(() => []);
  return entries.filter(entry => entry.isDirectory() && isLogin(entry.name)).map(entry => entry.name).sort();
}

// Twitch tokens of the profile; null if there are none or the file is broken
export async function loadTokens(profileFolder: string): Promise<TwitchTokens | null> {
  try {
    return toTokens(JSON.parse(await readFile(join(profileFolder, "tokens.json"), "utf8")));
  } catch {
    // Missing or not JSON: counts as not connected
    return null;
  }
}

// Readable only by the server (rule 27), atomic (rule 28)
export const saveTokens = (profileFolder: string, tokens: TwitchTokens) => writeAtomic(join(profileFolder, "tokens.json"), JSON.stringify(tokens), 0o600);

export const deleteTokens = (profileFolder: string) => rm(join(profileFolder, "tokens.json"), { force: true });

// Remember the login: time (ms since 1970) for the admin overview and the Twitch ID of the owner
export const saveLogin = (profileFolder: string, time: number, userId: string) =>
  writeAtomic(join(profileFolder, "profile.json"), JSON.stringify({ lastLogin: time, userId }));

async function readProfile(profileFolder: string): Promise<{ lastLogin?: unknown; userId?: unknown }> {
  try {
    return JSON.parse(await readFile(join(profileFolder, "profile.json"), "utf8")) as { lastLogin?: unknown; userId?: unknown };
  } catch {
    // Missing or broken: unknown
    return {};
  }
}

export async function loadLastLogin(profileFolder: string): Promise<number | null> {
  const { lastLogin } = await readProfile(profileFolder);
  return typeof lastLogin === "number" ? lastLogin : null;
}

// A profile belongs to the Twitch ID that created it, not to the name: Twitch reassigns renamed names, and
// another account with the same login must inherit neither profile nor access. Older profiles without a saved
// ID: the ID from tokens.json; without any known ID the profile belongs to the first account.
export async function ownedByOther(profileFolder: string, userId: string): Promise<boolean> {
  const stored = (await readProfile(profileFolder)).userId;
  const owner = typeof stored === "string" ? stored : (await loadTokens(profileFolder))?.userId;
  return owner !== undefined && owner !== userId;
}
