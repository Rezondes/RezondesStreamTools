// Contract cases: /api/me, the access decisions (401, not-allowed, admin-only, feature-off) and the admin routes.
import { ADMIN, expect, expectCode, fail, location, login, request, setAccess, STREAMER, type Case } from "../client.ts";

const ME = { login: "string", admin: "boolean", live: "boolean", spotify: "boolean|null", features: "object", theme: "string", overlayKey: "string" };

export const RIGHTS_CASES: Case[] = [
  {
    name: "rights: /api/me without session is 401",
    async run(context) {
      await expectCode(await request(context, "/api/me"), 401, "unauthorized");
    },
  },
  {
    name: "rights: allowlisted streamer logs in and sees /api/me",
    async run(context) {
      await setAccess(context, [STREAMER.login]);
      const callback = await login(context, STREAMER.login, STREAMER.id);
      if (location(callback) !== "/") fail(`unexpected target ${location(callback)}`);
      const me = (await expect(await request(context, "/api/me", { session: STREAMER.login }), 200, ME)) as { overlayKey: string; admin: boolean };
      if (me.admin) fail("streamer must not be admin");
      context.memory.set("overlayKey", me.overlayKey);
    },
  },
  {
    name: "rights: admin routes are admin-only",
    async run(context) {
      await expectCode(await request(context, "/api/admin/access", { session: STREAMER.login }), 403, "admin-only");
    },
  },
  {
    name: "rights: switched-off feature is feature-off",
    async run(context) {
      await setAccess(context, [STREAMER.login], { music: "off" });
      await expectCode(await request(context, "/api/spotify", { session: STREAMER.login }), 403, "feature-off");
      await setAccess(context, [STREAMER.login]);
    },
  },
  {
    name: "rights: removed from the allowlist is not-allowed",
    async run(context) {
      await setAccess(context, []);
      // The Node server keeps the session (403 not-allowed), the Rust server ends it (401 unauthorized)
      const response = await request(context, "/api/me", { session: STREAMER.login });
      const answer = `${response.status} ${await response.text()}`;
      if (answer !== "403 not-allowed" && answer !== "401 unauthorized") fail(`unexpected answer ${answer}`);
      await setAccess(context, [STREAMER.login]);
      const callback = await login(context, STREAMER.login, STREAMER.id);
      if (location(callback) !== "/") fail(`login again failed: ${location(callback)}`);
    },
  },
  {
    name: "rights: admin reads and saves access, invalid input is rejected",
    async run(context) {
      const shape = { registration: "string", allowlist: ["string"], beta: ["string"], features: "object" };
      await expect(await request(context, "/api/admin/access", { session: ADMIN.login }), 200, shape);
      await expectCode(await request(context, "/api/admin/access", { method: "POST", session: ADMIN.login, body: "[]" }), 400, "invalid-json");
    },
  },
  {
    name: "rights: admin lists the streamers",
    async run(context) {
      const row = { login: "string", allowed: "boolean", admin: "boolean", connected: "boolean", live: "boolean", lastLogin: "number|null" };
      const rows = (await expect(await request(context, "/api/admin/streamers", { session: ADMIN.login }), 200, [row])) as unknown[];
      if (rows.length < 2) fail(`expected at least 2 profiles, got ${rows.length}`);
    },
  },
];
