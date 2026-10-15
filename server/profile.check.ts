// Check für profile.ts: Profil-Ordner und Twitch-Tokens in einem temporären Ordner, der danach gelöscht wird. Läuft mit npm test.
import assert from "node:assert/strict";
import { mkdir, mkdtemp, rm, stat, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import * as profile from "./profile.ts";

const dataDir = await mkdtemp(join(tmpdir(), "profile-"));
try {
  // Ohne Profile: leere Liste
  assert.deepEqual(await profile.list(dataDir), []);

  // Profile sind Ordner mit gültigem Login-Namen; Dateien und fremde Namen zählen nicht
  const folder = profile.folder(dataDir, "rezondes");
  assert.equal(folder, join(dataDir, "streamers", "rezondes"));
  await mkdir(folder, { recursive: true });
  await mkdir(join(dataDir, "streamers", "Kein Login"));
  await writeFile(join(dataDir, "streamers", "datei.txt"), "");
  await mkdir(join(dataDir, "streamers", "freund"));
  assert.deepEqual(await profile.list(dataDir), ["freund", "rezondes"]);

  // Tokens: speichern, lesen, löschen
  const tokens = { access: "access-value", refresh: "refresh-value", userId: "123", login: "rezondes" };
  assert.equal(await profile.loadTokens(folder), null);
  await profile.saveTokens(folder, tokens);
  assert.deepEqual(await profile.loadTokens(folder), tokens);
  if (process.platform !== "win32") assert.equal((await stat(join(folder, "tokens.json"))).mode & 0o777, 0o600);
  await profile.deleteTokens(folder);
  assert.equal(await profile.loadTokens(folder), null);

  // Kaputte oder unvollständige Dateien gelten als nicht verbunden
  await writeFile(join(folder, "tokens.json"), "{kaputt");
  assert.equal(await profile.loadTokens(folder), null);
  await writeFile(join(folder, "tokens.json"), JSON.stringify({ ...tokens, login: "../x" }));
  assert.equal(await profile.loadTokens(folder), null);
} finally {
  await rm(dataDir, { recursive: true, force: true });
}

console.log("profile ok");
