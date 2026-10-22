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
      // Losing access ends every session of the streamer
      await expectCode(await request(context, "/api/me", { session: STREAMER.login }), 401, "unauthorized");
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
      const row = { login: "string", allowed: "boolean", admin: "boolean", connected: "boolean", live: "boolean", streamLive: "boolean", lastLogin: "number|null" };
      const rows = (await expect(await request(context, "/api/admin/streamers", { session: ADMIN.login }), 200, [row])) as unknown[];
      if (rows.length < 2) fail(`expected at least 2 profiles, got ${rows.length}`);
    },
  },
  {
    name: "rights: admin marks the stream of a streamer live and ended again",
    async run(context) {
      const toggle = (login: string, session = ADMIN.login) => request(context, `/api/admin/streamer/live?login=${login}`, { method: "POST", session });
      await expectCode(await toggle(STREAMER.login, STREAMER.login), 403, "admin-only");
      await expectCode(await toggle("bad!login"), 400, "invalid-login");
      await expectCode(await toggle("nobodyhere"), 404, "not-found");
      const streamLive = async () => {
        const rows = (await expect(await request(context, "/api/admin/streamers", { session: ADMIN.login }), 200)) as string;
        return (JSON.parse(rows) as { login: string; streamLive: boolean }[]).find(row => row.login === STREAMER.login)?.streamLive;
      };
      const before = await streamLive();
      const first = (await expect(await toggle(STREAMER.login), 200, { live: "boolean" })) as { live: boolean };
      if (first.live === before || (await streamLive()) !== first.live) fail(`toggle did not flip the stream: ${before} -> ${first.live}`);
      const second = (await expect(await toggle(STREAMER.login), 200, { live: "boolean" })) as { live: boolean };
      if (second.live !== before) fail(`second toggle did not flip back: ${second.live}`);
    },
  },
];
