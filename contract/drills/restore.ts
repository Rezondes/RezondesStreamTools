// Restore drill (RUST-PLAN.md package 46): make a backup, change the data, restore the backup; the triggers and
// settings of the streamer are the same as in the backup again. Starts its own server with the fake providers.
//   node contract/drills/restore.ts [--server "<command>"]
import assert from "node:assert/strict";
import { parseArgs } from "node:util";
import { ADMIN, expect, login, request, setAccess, STREAMER, type Context } from "../client.ts";
import { DEFAULT_SERVER, startServer } from "../run.ts";

const admin = ADMIN.login;
const streamer = STREAMER.login;
const post = (context: Context, path: string, body: unknown, session = streamer) =>
  request(context, path, { method: "POST", session, body: JSON.stringify(body) });
const trigger = (name: string) => ({ name, when: { type: "command", match: `!${name}` }, do: [{ type: "text", text: name }] });

// Starts a backup and waits until it is listed; returns its id
export async function backup(context: Context): Promise<string> {
  const { id } = (await expect(await request(context, "/api/admin/backups", { method: "POST", session: admin }), 202, { id: "string" })) as { id: string };
  for (let tries = 0; tries < 100; tries++) {
    const listing = (await (await request(context, "/api/admin/backups", { session: admin })).json()) as { backups: { id: string }[] };
    if (listing.backups.some(entry => entry.id === id)) return id;
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  throw new Error(`backup ${id} did not appear`);
}

async function state(context: Context) {
  const triggers = (await (await request(context, "/api/triggers/config", { session: streamer })).json()) as unknown;
  const settings = (await (await request(context, `/s/${streamer}/settings`)).json()) as unknown;
  return { triggers, settings };
}

async function drill(context: Context) {
  await login(context, admin, ADMIN.id);
  await setAccess(context, [streamer]);
  await login(context, streamer, STREAMER.id);
  await expect(await post(context, "/api/triggers/config", { triggers: [trigger("before")] }), 200, { ok: "boolean" });
  await expect(await post(context, "/api/settings", { theme: "matrix", values: {}, choose: true }), 200, { theme: "string" });
  const saved = await state(context);
  const id = await backup(context);
  console.log(`backup ${id} made`);

  await expect(await post(context, "/api/triggers/config", { triggers: [trigger("after"), trigger("more")] }), 200, { ok: "boolean" });
  await expect(await post(context, "/api/settings", { theme: "standard", values: {}, choose: true }), 200, { theme: "string" });
  assert.notDeepEqual(await state(context), saved, "the data changed after the backup");

  const report = (await expect(await post(context, `/api/admin/backup/restore?id=${id}`, {}, admin), 200, { restored: "number", skipped: "array" })) as { restored: number; skipped: string[] };
  console.log(`restored ${report.restored} profiles, skipped ${report.skipped.length}`);
  assert.deepEqual(await state(context), saved, "the state equals the backup");
  assert.deepEqual(report.skipped, []);
}

async function main() {
  const { values } = parseArgs({ options: { server: { type: "string" } } });
  const server = await startServer(values.server ?? DEFAULT_SERVER);
  try {
    await drill(server.context);
    console.log("restore drill ok");
  } catch (error) {
    console.log(`--- server output ---\n${server.log().slice(-4000)}`);
    throw error;
  } finally {
    await server.stop();
  }
}

if (import.meta.main) await main();
