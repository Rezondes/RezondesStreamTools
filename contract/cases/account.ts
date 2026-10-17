// Contract cases: Spotify connection bound to the login state, rendering without the feature, a new overlay key
// and disconnecting Twitch. Runs last: the disconnect ends the streamer's runtime.
import { ADMIN, cookie, expect, expectCode, fail, location, request, setAccess, STREAMER, type Case } from "../client.ts";

const session = STREAMER.login;

export const ACCOUNT_CASES: Case[] = [
  {
    name: "spotify: callback only connects with the state of a started login",
    async run(context) {
      await expectCode(await request(context, "/api/spotify", { session }), 409, "not-connected");
      const start = await request(context, "/spotify/login", { session });
      const target = new URL(location(start));
      if (!target.href.startsWith(`${context.fake.env.SPOTIFY_ACCOUNTS_URL}/authorize`)) fail(`unexpected target ${target.href}`);
      const state = target.searchParams.get("state") ?? fail("no state");
      const foreign = await request(context, "/spotify/callback?code=abc&state=foreign");
      if (!location(foreign).endsWith("/?error=spotify-failed")) fail(`unexpected target ${location(foreign)}`);
      const callback = await request(context, `/spotify/callback?code=abc&state=${state}`);
      if (location(callback) !== `${context.base}/`) fail(`unexpected target ${location(callback)}`);
      await expect(await request(context, "/api/spotify", { session }), 200, { account: "string|null", track: "object|null", polling: "boolean" });
    },
  },
  {
    name: "spotify: logout disconnects",
    async run(context) {
      await expect(await request(context, "/spotify/logout", { method: "POST", session }), 200, { ok: "boolean" });
      await expectCode(await request(context, "/api/spotify", { session }), 409, "not-connected");
    },
  },
  {
    name: "render: unknown clip and switched-off feature",
    async run(context) {
      await expectCode(await request(context, "/api/render/start?clip=nothing", { method: "POST", session }), 400, "unknown-clip");
      await setAccess(context, [STREAMER.login], { stinger: "off" });
      await expectCode(await request(context, "/api/render/start?clip=stinger", { method: "POST", session }), 403, "feature-off");
      await setAccess(context, [STREAMER.login]);
    },
  },
  {
    name: "overlay key: a new key replaces the old one",
    async run(context) {
      const old = context.memory.get("overlayKey") ?? fail("no overlay key from an earlier case");
      const { overlayKey } = (await expect(await request(context, "/api/overlay-key", { method: "POST", session }), 200, { overlayKey: "string" })) as { overlayKey: string };
      if (overlayKey === old) fail("key did not change");
      context.memory.set("overlayKey", overlayKey);
      await expectCode(await request(context, `/s/${STREAMER.login}/events?key=${old}`), 403, "forbidden");
    },
  },
  {
    name: "twitch: disconnect revokes the token, ends the runtime and the session",
    async run(context) {
      const revokedBefore = context.fake.revoked.size;
      const response = await request(context, "/api/twitch/disconnect", { method: "POST", session });
      if (cookie(response, "sid") !== "sid=") fail("session cookie not cleared");
      await expect(response, 200, { ok: "boolean" });
      if (context.fake.revoked.size <= revokedBefore) fail("token not revoked");
      await expectCode(await request(context, `/s/${STREAMER.login}/events?key=${context.memory.get("overlayKey") ?? ""}`), 404, "not-running");
      await expect(await request(context, "/api/me", { session: ADMIN.login }), 200, { login: "string" });
    },
  },
];
