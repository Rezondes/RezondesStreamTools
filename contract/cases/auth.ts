// Contract cases: Twitch login through the fake provider, state bound to the browser, logout, refused logins.
import { ADMIN, cookie, expect, expectCode, fail, location, login, request, STRANGER, type Case } from "../client.ts";

export const AUTH_CASES: Case[] = [
  {
    name: "auth: login redirects to Twitch with state and state cookie",
    async run(context) {
      const start = await request(context, "/auth/login");
      const target = new URL(location(start));
      if (!target.href.startsWith(`${context.fake.env.TWITCH_ID_URL}/authorize`)) fail(`unexpected target ${target.href}`);
      const state = target.searchParams.get("state");
      if (!state || cookie(start, "oauth_state") !== `oauth_state=${state}`) fail("state and cookie differ");
    },
  },
  {
    name: "auth: callback with a foreign state fails",
    async run(context) {
      const start = await request(context, "/auth/login");
      const state = new URL(location(start)).searchParams.get("state") ?? "";
      const foreign = await request(context, `/auth/callback?code=code-x-1&state=${state}`, { headers: { Cookie: "oauth_state=foreign" } });
      if (location(foreign) !== "/?error=login-failed") fail(`unexpected target ${location(foreign)}`);
      const noCookie = await request(context, `/auth/callback?code=code-x-1&state=${state}`);
      if (location(noCookie) !== "/?error=login-failed") fail(`unexpected target ${location(noCookie)}`);
    },
  },
  {
    name: "auth: admin login sets a session",
    async run(context) {
      const callback = await login(context, ADMIN.login, ADMIN.id);
      if (location(callback) !== "/") fail(`unexpected target ${location(callback)}`);
      if (!context.sessions.has(ADMIN.login)) fail("no session cookie");
      await expect(await request(context, "/api/me", { session: ADMIN.login }), 200, { login: "string" });
    },
  },
  {
    name: "auth: login not on the allowlist is refused and the token revoked",
    async run(context) {
      const revokedBefore = context.fake.revoked.size;
      const callback = await login(context, STRANGER.login, STRANGER.id);
      if (location(callback) !== "/?error=not-allowed") fail(`unexpected target ${location(callback)}`);
      if (context.fake.revoked.size !== revokedBefore + 1) fail("token not revoked");
    },
  },
  {
    name: "auth: logout clears the session cookie",
    async run(context) {
      const response = await request(context, "/auth/logout", { method: "POST" });
      if (cookie(response, "sid") !== "sid=") fail("session cookie not cleared");
      await expect(response, 200, { ok: "boolean" });
    },
  },
  {
    name: "auth: writing requests from foreign origins are rejected",
    async run(context) {
      await expectCode(await request(context, "/auth/logout", { method: "POST", headers: { Origin: "http://evil.example" } }), 403, "cross-origin");
    },
  },
  {
    name: "auth: unknown method and route",
    async run(context) {
      await expectCode(await request(context, "/api/me", { method: "POST" }), 405, "method-not-allowed");
      await expectCode(await request(context, "/api/nothing", { method: "POST" }), 404, "not-found");
    },
  },
];
