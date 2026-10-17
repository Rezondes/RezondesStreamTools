// Contract cases: server-wide backups for admins (Rust server only, see pending-node.json).
import { ADMIN, expect, expectCode, fail, request, STREAMER, type Case } from "../client.ts";

const admin = ADMIN.login;
type Listing = { running: boolean; backups: { id: string; bytes: number }[] };

export const BACKUP_CASES: Case[] = [
  {
    name: "backups: only admins, created in the background, downloaded, restored and deleted",
    async run(context) {
      await expectCode(await request(context, "/api/admin/backups", { session: STREAMER.login }), 403, "admin-only");
      const { id } = (await expect(await request(context, "/api/admin/backups", { method: "POST", session: admin }), 202, { id: "string" })) as { id: string };
      let listing: Listing = { running: true, backups: [] };
      for (let tries = 0; tries < 100 && !listing.backups.some(backup => backup.id === id); tries++) {
        listing = (await expect(await request(context, "/api/admin/backups", { session: admin }), 200, { running: "boolean", backups: "array" })) as Listing;
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      if (!listing.backups.some(backup => backup.id === id && backup.bytes > 0)) fail("backup did not appear");
      const download = await request(context, `/api/admin/backup?id=${id}`, { session: admin });
      if (download.status !== 200 || download.headers.get("content-type") !== "application/zip") fail(`download answered ${download.status}`);
      const bytes = new Uint8Array(await download.arrayBuffer());
      if (bytes[0] !== 0x50 || bytes[1] !== 0x4b) fail("download is no ZIP");
      await expectCode(await request(context, "/api/admin/backup?id=../keys", { session: admin }), 404, "not-found");
      // The downloaded archive comes back as an upload and restores the same state
      const uploaded = (await expect(await request(context, "/api/admin/backups/upload", { method: "POST", session: admin, body: bytes }), 200, { id: "string" })) as { id: string };
      const report = (await expect(await request(context, `/api/admin/backup/restore?id=${uploaded.id}`, { method: "POST", session: admin }), 200, { restored: "number", skipped: "array" })) as { restored: number };
      if (report.restored < 2) fail(`only ${report.restored} profiles restored`);
      await expect(await request(context, "/api/me", { session: STREAMER.login }), 200, { login: "string" });
      await expectCode(await request(context, "/api/admin/backups/upload", { method: "POST", session: admin, body: "no zip" }), 400, "backup-invalid");
      await expect(await request(context, `/api/admin/backup?id=${uploaded.id}`, { method: "DELETE", session: admin }), 200, { ok: "boolean" });
      await expect(await request(context, `/api/admin/backup?id=${id}`, { method: "DELETE", session: admin }), 200, { ok: "boolean" });
      await expectCode(await request(context, `/api/admin/backup?id=${id}`, { method: "DELETE", session: admin }), 404, "not-found");
    },
  },
  {
    name: "backups: the schedule is off by default and only admins change it",
    async run(context) {
      const shape = { enabled: "boolean", intervalHours: "number", keep: "number" };
      const schedule = (await expect(await request(context, "/api/admin/backup-settings", { session: admin }), 200, shape)) as { enabled: boolean };
      if (schedule.enabled) fail("automatic backups are on by default");
      await expectCode(await request(context, "/api/admin/backup-settings", { session: STREAMER.login }), 403, "admin-only");
      const post = (body: unknown) => request(context, "/api/admin/backup-settings", { method: "POST", session: admin, body: JSON.stringify(body) });
      await expectCode(await post({ enabled: true, intervalHours: 0, keep: 3 }), 400, "invalid-json");
      await expect(await post({ enabled: true, intervalHours: 24, keep: 3 }), 200, shape);
      await expect(await post({ enabled: false, intervalHours: 24, keep: 3 }), 200, shape);
    },
  },
];
