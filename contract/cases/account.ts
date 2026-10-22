// Contract cases: Spotify connection bound to the login state, rendering without the feature, a new overlay key
// and disconnecting Twitch. Runs last: the disconnect ends the streamer's runtime.
import { ADMIN, cookie, expect, expectCode, fail, location, request, setAccess, STREAMER, type Case } from "../client.ts";
import { readStream } from "./overlay.ts";

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
    name: "spotify: the current track reaches an open overlay",
    async run(context) {
      const playing = { is_playing: true, progress_ms: 1000, item: { id: "contract-track", name: "Song", duration_ms: 200_000, artists: [{ name: "Band" }] } };
      const set = await fetch(`${context.fake.url}/control/spotify`, { method: "POST", body: JSON.stringify({ playing }) });
      if (set.status !== 204) fail(`fake control answered ${set.status}`);
      const key = context.memory.get("overlayKey") ?? fail("no overlay key from an earlier case");
      await readStream(await request(context, `/s/${STREAMER.login}/events?key=${key}`), "contract-track");
      const details = (await expect(await request(context, "/api/spotify", { session }), 200, { account: "string|null", polling: "boolean" })) as { account: string | null };
      if (details.account !== "Fake Spotify") fail(`unexpected account ${String(details.account)}`);
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
    name: "render: one render at a time, frames until cancel, the file list",
    async run(context) {
      const post = (path: string, body?: BodyInit) => request(context, path, { method: "POST", session, body });
      await expect(await post("/api/render/start?clip=stinger"), 200, { ok: "boolean" });
      await expectCode(await post("/api/render/start?clip=profile"), 409, "render-busy");
      await expect(await post("/api/render/frame?i=0", new Uint8Array([137, 80, 78, 71])), 200, { ok: "boolean" });
      await expectCode(await post("/api/render/frame?i=5000", new Uint8Array([1])), 400, "render-limit");
      await expectCode(await post("/api/render/done?fps=0"), 400, "render-limit");
      await expect(await post("/api/render/cancel"), 200, { ok: "boolean" });
      await expectCode(await post("/api/render/frame?i=1", new Uint8Array([1])), 409, "render-not-started");
      await expect(await request(context, "/api/render/files", { session }), 200, "array");
      await expectCode(await request(context, "/api/render/file?name=../x", { session }), 400, "invalid-name");
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
  {
    name: "account: dashboard preferences need a session, refuse unknown values and come back with /api/me",
    async run(context) {
      const save = (body: unknown, session?: string) => request(context, "/api/account/prefs", { method: "POST", session, body: JSON.stringify(body) });
      await expectCode(await save({ look: "theme" }), 401, "unauthorized");
      await expectCode(await save({ language: "en" }, ADMIN.login), 400, "invalid-json");
      await expect(await save({ look: "theme", language: "de" }, ADMIN.login), 200, { look: "string", language: "string" });
      const me = await request(context, "/api/me", { session: ADMIN.login });
      const prefs = ((await me.json()) as { prefs?: { look?: string } }).prefs;
      if (prefs?.look !== "theme") fail(`prefs not stored: ${JSON.stringify(prefs)}`);
    },
  },
];
