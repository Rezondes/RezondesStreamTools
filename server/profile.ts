// Profil eines Streamers: Ordner DATA/streamers/<login>/ mit tokens.json (Twitch, mode 600), spotify.json,
// triggers.json, settings.json, profile.json (letzte Anmeldung) und media/. Hier: Ordner finden, die Twitch-Tokens
// lesen, schreiben, löschen und die letzte Anmeldung merken.
// Gedacht für import * as profile. Check: profile.check.ts.
import { readdir, readFile, rm } from "node:fs/promises";
import { join } from "node:path";
import { isLogin } from "../src/core/streamerPath.ts";
import { writeAtomic } from "./atomicFile.ts";
import { toTokens, type TwitchTokens } from "./twitch.ts";

// Profil-Ordner eines Logins (login muss isLogin erfüllen)
export const folder = (dataDir: string, login: string) => join(dataDir, "streamers", login);

// Logins aller Profile, sortiert; Ordner mit ungültigem Namen zählen nicht
export async function list(dataDir: string): Promise<string[]> {
  const entries = await readdir(join(dataDir, "streamers"), { withFileTypes: true }).catch(() => []);
  return entries.filter(entry => entry.isDirectory() && isLogin(entry.name)).map(entry => entry.name).sort();
}

// Twitch-Tokens des Profils; null, wenn keine da sind oder die Datei kaputt ist
export async function loadTokens(profileFolder: string): Promise<TwitchTokens | null> {
  try {
    return toTokens(JSON.parse(await readFile(join(profileFolder, "tokens.json"), "utf8")));
  } catch {
    // Fehlt oder kein JSON: gilt als nicht verbunden
    return null;
  }
}

// Nur für den Server lesbar (Regel 27), atomar (Regel 28)
export const saveTokens = (profileFolder: string, tokens: TwitchTokens) => writeAtomic(join(profileFolder, "tokens.json"), JSON.stringify(tokens), 0o600);

export const deleteTokens = (profileFolder: string) => rm(join(profileFolder, "tokens.json"), { force: true });

// Zeitpunkt der letzten Twitch-Anmeldung (ms seit 1970) für die Admin-Übersicht
export const saveLastLogin = (profileFolder: string, time: number) => writeAtomic(join(profileFolder, "profile.json"), JSON.stringify({ lastLogin: time }));

export async function loadLastLogin(profileFolder: string): Promise<number | null> {
  try {
    const parsed = JSON.parse(await readFile(join(profileFolder, "profile.json"), "utf8")) as { lastLogin?: unknown };
    return typeof parsed.lastLogin === "number" ? parsed.lastLogin : null;
  } catch {
    // Fehlt oder kaputt: unbekannt
    return null;
  }
}
