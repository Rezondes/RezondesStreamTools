// Shred drill (RUST-PLAN.md package 46): back up, delete a streamer, restore the backup; the streamer stays gone
// because its data key is shredded, and the archive holds neither its login nor its tokens in plaintext.
//   node contract/drills/shred.ts [--server "<command>"]
import assert from "node:assert/strict";
import { inflateRawSync } from "node:zlib";
import { parseArgs } from "node:util";
import { ADMIN, expect, login, request, setAccess, STREAMER, type Context } from "../client.ts";
import { DEFAULT_SERVER, startServer } from "../run.ts";
import { backup } from "./restore.ts";

const admin = ADMIN.login;
const doomed = { login: "morpheus", id: "13" };

// Every entry of a ZIP archive, unpacked (stored or deflated), read through the central directory
export function zipEntries(archive: Buffer): Map<string, Buffer> {
  const end = archive.lastIndexOf(Buffer.from([0x50, 0x4b, 0x05, 0x06]));
  if (end < 0) throw new Error("no ZIP archive");
  const count = archive.readUInt16LE(end + 10);
  let at = archive.readUInt32LE(end + 16);
  const entries = new Map<string, Buffer>();
  for (let index = 0; index < count; index++) {
    const method = archive.readUInt16LE(at + 10);
    const size = archive.readUInt32LE(at + 20);
    const nameLength = archive.readUInt16LE(at + 28);
    const skip = nameLength + archive.readUInt16LE(at + 30) + archive.readUInt16LE(at + 32);
    const name = archive.toString("utf8", at + 46, at + 46 + nameLength);
    const local = archive.readUInt32LE(at + 42);
    const start = local + 30 + archive.readUInt16LE(local + 26) + archive.readUInt16LE(local + 28);
    const data = archive.subarray(start, start + size);
    entries.set(name, method === 8 ? inflateRawSync(data) : Buffer.from(data));
    at += 46 + skip;
  }
  return entries;
}

async function drill(context: Context) {
  await login(context, admin, ADMIN.id);
  await setAccess(context, [STREAMER.login, doomed.login]);
  await login(context, STREAMER.login, STREAMER.id);
  await login(context, doomed.login, doomed.id);
  const trigger = { name: "secret", when: { type: "command", match: "!secret" }, do: [{ type: "text", text: "secret" }] };
  await expect(await request(context, "/api/triggers/config", { method: "POST", session: doomed.login, body: JSON.stringify({ triggers: [trigger] }) }), 200, { ok: "boolean" });
  const id = await backup(context);
  console.log(`backup ${id} made`);

  const archive = Buffer.from(await (await request(context, `/api/admin/backup?id=${id}`, { session: admin })).arrayBuffer());
  const entries = zipEntries(archive);
  assert.ok(entries.has("manifest.json") && entries.has("db/streamers.jsonl"), "archive with manifest and tables");
  for (const [name, data] of entries) {
    for (const secret of [doomed.login, `access-${doomed.login}`, `refresh-${doomed.login}`, ADMIN.login]) {
      assert.ok(!data.includes(secret), `${secret} in plaintext in ${name}`);
    }
  }
  console.log(`${entries.size} archive entries without plaintext`);

  await expect(await request(context, `/api/admin/streamer?login=${doomed.login}`, { method: "DELETE", session: admin }), 200, { ok: "boolean" });
  const report = (await expect(await request(context, `/api/admin/backup/restore?id=${id}`, { method: "POST", session: admin }), 200, { restored: "number", skipped: "array" })) as { restored: number; skipped: string[] };
  console.log(`restored ${report.restored} profiles, skipped ${report.skipped.length}`);
  assert.equal(report.skipped.length, 1, "the deleted streamer is skipped");
  assert.equal((await request(context, `/s/${doomed.login}/status`)).status, 404, "the deleted streamer stays gone");
  assert.equal((await request(context, `/s/${STREAMER.login}/status`)).status, 200, "the others are back");
}

async function main() {
  const { values } = parseArgs({ options: { server: { type: "string" } } });
  const server = await startServer(values.server ?? DEFAULT_SERVER);
  try {
    await drill(server.context);
    console.log("shred drill ok");
  } catch (error) {
    console.log(`--- server output ---\n${server.log().slice(-4000)}`);
    throw error;
  } finally {
    await server.stop();
  }
}

if (import.meta.main) await main();
