// Check for profile.ts: profile folders and Twitch tokens in a temporary folder that is deleted afterwards. Runs with npm test.
import assert from "node:assert/strict";
import { mkdir, mkdtemp, rm, stat, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import * as profile from "./profile.ts";

const dataDir = await mkdtemp(join(tmpdir(), "profile-"));
try {
  // Without profiles: empty list
  assert.deepEqual(await profile.list(dataDir), []);

  // Profiles are folders with a valid login name; files and foreign names do not count
  const folder = profile.folder(dataDir, "rezondes");
  assert.equal(folder, join(dataDir, "streamers", "rezondes"));
  await mkdir(folder, { recursive: true });
  await mkdir(join(dataDir, "streamers", "Kein Login"));
  await writeFile(join(dataDir, "streamers", "datei.txt"), "");
  await mkdir(join(dataDir, "streamers", "friend"));
  assert.deepEqual(await profile.list(dataDir), ["friend", "rezondes"]);

  // Tokens: save, read, delete
  const tokens = { access: "access-value", refresh: "refresh-value", userId: "123", login: "rezondes" };
  assert.equal(await profile.loadTokens(folder), null);
  await profile.saveTokens(folder, tokens);
  assert.deepEqual(await profile.loadTokens(folder), tokens);
  if (process.platform !== "win32") assert.equal((await stat(join(folder, "tokens.json"))).mode & 0o777, 0o600);
  await profile.deleteTokens(folder);
  assert.equal(await profile.loadTokens(folder), null);

  // Last login: without a file null, otherwise the saved time
  assert.equal(await profile.loadLastLogin(folder), null);
  await profile.saveLogin(folder, 1_700_000_000_000, "123");
  assert.equal(await profile.loadLastLogin(folder), 1_700_000_000_000);

  // Owner: the profile belongs to the Twitch ID, not to the name. Another account with the same login (name
  // reassigned after a rename) does not get it; a new profile without an owner belongs to the first account
  assert.equal(await profile.ownedByOther(folder, "123"), false);
  assert.equal(await profile.ownedByOther(folder, "999"), true);
  assert.equal(await profile.ownedByOther(profile.folder(dataDir, "friend"), "999"), false);
  // Older profiles without a saved ID: the ID from tokens.json counts
  await writeFile(join(folder, "profile.json"), JSON.stringify({ lastLogin: 1 }));
  await profile.saveTokens(folder, tokens);
  assert.equal(await profile.ownedByOther(folder, "999"), true);
  assert.equal(await profile.ownedByOther(folder, "123"), false);
  await profile.deleteTokens(folder);

  await writeFile(join(folder, "profile.json"), "{kaputt");
  assert.equal(await profile.loadLastLogin(folder), null);

  // Broken or incomplete files count as not connected
  await writeFile(join(folder, "tokens.json"), "{kaputt");
  assert.equal(await profile.loadTokens(folder), null);
  await writeFile(join(folder, "tokens.json"), JSON.stringify({ ...tokens, login: "../x" }));
  assert.equal(await profile.loadTokens(folder), null);
} finally {
  await rm(dataDir, { recursive: true, force: true });
}

console.log("profile ok");
