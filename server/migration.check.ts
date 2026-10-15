// Check für migration.ts: Plan als reine Funktion und die Übernahme in einem temporären Ordner,
// der danach gelöscht wird (Token-Werte sind Platzhalter). Läuft mit npm test.
import assert from "node:assert/strict";
import { mkdir, mkdtemp, readdir, readFile, rm, stat, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { loadAccess } from "./access.ts";
import { migrate, plan } from "./migration.ts";

const folders = { data: join("d"), config: join("c"), profile: join("d", "streamers", "rezondes") };

// Keine Altdateien: nichts zu tun
assert.equal(plan({ data: [], config: [], existing: [] }, folders), null);

// Alles kopieren, Dateien einzeln und den Medienordner als Ganzes umbenennen
assert.deepEqual(plan({ data: ["tokens.json"], config: ["triggers.json", "media/a.gif"], existing: [] }, folders), {
  copies: [
    { from: join("d", "tokens.json"), to: join("d", "streamers", "rezondes", "tokens.json") },
    { from: join("c", "triggers.json"), to: join("d", "streamers", "rezondes", "triggers.json") },
    { from: join("c", "media/a.gif"), to: join("d", "streamers", "rezondes", "media/a.gif") },
  ],
  renames: [
    { from: join("d", "tokens.json"), to: join("d", "tokens.json.migrated") },
    { from: join("c", "triggers.json"), to: join("c", "triggers.json.migrated") },
    { from: join("c", "media"), to: join("c", "media.migrated") },
  ],
});

// Was das Profil schon hat, wird nicht überschrieben (zweiter Start mit schreibgeschütztem CONFIG)
assert.deepEqual(plan({ data: [], config: ["triggers.json"], existing: ["triggers.json"] }, folders)?.copies, []);

// Übernahme in echten Dateien
const root = await mkdtemp(join(tmpdir(), "migration-"));
try {
  const data = join(root, "data");
  const config = join(root, "config");
  await mkdir(join(config, "media"), { recursive: true });
  await mkdir(data);
  const tokens = { access: "fake-access", refresh: "fake-refresh", userId: "42", login: "streamer_one" };
  await writeFile(join(data, "tokens.json"), JSON.stringify(tokens));
  await writeFile(join(data, "spotify.json"), JSON.stringify({ access: "a1", refresh: "r1", expiresAt: 1 }));
  await writeFile(join(config, "triggers.json"), '{ "triggers": [] }');
  await writeFile(join(config, "media", "lizard.gif"), "GIF");
  await writeFile(join(config, "media", "notes.txt"), "keine Mediendatei");
  const access = await loadAccess(data, ["rezondes"]);

  // Login aus tokens.json: alles im Profil, alte Dateien umbenannt, Login in der Allowlist
  const result = await migrate({ data, config }, ["rezondes"], access);
  assert.equal(result?.login, "streamer_one");
  const profileFolder = join(data, "streamers", "streamer_one");
  assert.deepEqual(JSON.parse(await readFile(join(profileFolder, "tokens.json"), "utf8")), tokens);
  assert.equal(await readFile(join(profileFolder, "media", "lizard.gif"), "utf8"), "GIF");
  assert.deepEqual((await readdir(profileFolder)).sort(), ["media", "spotify.json", "tokens.json", "triggers.json"]);
  assert.deepEqual((await readdir(data)).sort(), ["access.json", "spotify.json.migrated", "streamers", "tokens.json.migrated"]);
  assert.deepEqual((await readdir(config)).sort(), ["media.migrated", "triggers.json.migrated"]);
  if (process.platform !== "win32") assert.equal((await stat(join(profileFolder, "spotify.json"))).mode & 0o777, 0o600);
  assert.deepEqual(access.get().allowlist, ["rezondes", "streamer_one"]);

  // Zweiter Start: nichts mehr zu tun
  assert.equal(await migrate({ data, config }, ["rezondes"], access), null);

  // Ohne alte Tokens geht die Übernahme an den ersten Admin; ohne Admin gar nicht
  await writeFile(join(config, "triggers.json"), '{ "triggers": [] }');
  await rm(join(data, "tokens.json.migrated"));
  assert.equal(await migrate({ data, config }, [], access), null);
  assert.equal((await migrate({ data, config }, ["rezondes"], access))?.login, "rezondes");
  assert.equal(await readFile(join(data, "streamers", "rezondes", "triggers.json"), "utf8"), '{ "triggers": [] }');
} finally {
  await rm(root, { recursive: true, force: true });
}

console.log("migration ok");
