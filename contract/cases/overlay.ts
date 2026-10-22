// Contract cases: public overlay routes under /s/<login>/ and the live event stream (/events) with its key rules.
import { expect, expectCode, fail, request, STREAMER, type Case, type Context } from "../client.ts";

const base = `/s/${STREAMER.login}`;

// Reads the event stream until text contains needle (or the time is up); the stream is closed afterwards
export async function readStream(response: Response, needle: string, trigger?: () => Promise<void>) {
  if (response.status !== 200) fail(`expected status 200, got ${response.status}`);
  if (!response.headers.get("content-type")?.startsWith("text/event-stream")) fail("not an event stream");
  const reader = response.body?.getReader() ?? fail("no body");
  const decoder = new TextDecoder();
  const deadline = setTimeout(() => void reader.cancel(), 5000);
  let text = "";
  try {
    await trigger?.();
    while (!text.includes(needle)) {
      const { value, done } = await reader.read();
      if (done) break;
      text += decoder.decode(value, { stream: true });
    }
  } finally {
    clearTimeout(deadline);
    await reader.cancel().catch(() => {});
  }
  if (!text.includes(needle)) fail(`stream without ${needle}: ${text.slice(0, 200)}`);
}

const key = (context: Context) => context.memory.get("overlayKey") ?? fail("no overlay key from an earlier case");

export const OVERLAY_CASES: Case[] = [
  {
    name: "overlay: status, settings and commands are public",
    async run(context) {
      await expect(await request(context, `${base}/status`), 200, { login: "string", live: "boolean", spotify: "boolean|null", features: "object" });
      await expect(await request(context, `${base}/settings`), 200, { theme: "string", values: "object" });
      await expect(await request(context, `${base}/commands`), 200, { channel: "string", items: [{ kind: "string" }] });
    },
  },
  {
    name: "overlay: scenes are served as HTML, unknown logins and scenes are 404",
    async run(context) {
      const scene = await request(context, `${base}/alerts`);
      if (!scene.headers.get("content-type")?.startsWith("text/html")) fail("scene is not HTML");
      await expect(scene, 200);
      await expectCode(await request(context, "/s/nobody/status"), 404, "not-found");
      await expectCode(await request(context, `${base}/nothing`), 404, "not-found");
    },
  },
  {
    name: "events: without or with a wrong key 403",
    async run(context) {
      await expectCode(await request(context, `${base}/events`), 403, "forbidden");
      await expectCode(await request(context, `${base}/events?key=wrong`), 403, "forbidden");
    },
  },
  {
    name: "events: with the key the stream delivers a test alert",
    async run(context) {
      const stream = await request(context, `${base}/events?key=${key(context)}`);
      await readStream(stream, "\"type\":\"alert\"", async () => {
        await expect(await request(context, "/api/test?kind=follow", { method: "POST", session: STREAMER.login }), 200, { ok: "boolean" });
      });
    },
  },
  {
    name: "events: the log needs the session of the same streamer",
    async run(context) {
      await expectCode(await request(context, `${base}/events?log`), 403, "forbidden");
      await expectCode(await request(context, `${base}/events?log`, { session: "rezondes" }), 403, "forbidden");
      await readStream(await request(context, `${base}/events?log`, { session: STREAMER.login }), "data:");
    },
  },
  {
    name: "events: the stream starts with the stream stats",
    async run(context) {
      await readStream(await request(context, `${base}/events?key=${key(context)}`), "\"type\":\"stats\"");
    },
  },
  {
    name: "stats: reset needs a session and clears the count",
    async run(context) {
      await expectCode(await request(context, "/api/stats/reset", { method: "POST" }), 401, "unauthorized");
      await expect(await request(context, "/api/stats/reset", { method: "POST", session: STREAMER.login }), 200, { ok: "boolean" });
      await readStream(await request(context, `${base}/events?key=${key(context)}`), "\"follows\":0");
    },
  },
  {
    name: "stats: live by hand needs a session and toggles",
    async run(context) {
      await expectCode(await request(context, "/api/stats/live", { method: "POST" }), 401, "unauthorized");
      await expect(await request(context, "/api/stats/live", { method: "POST", session: STREAMER.login }), 200, { live: "boolean" });
      await expect(await request(context, "/api/stats/live", { method: "POST", session: STREAMER.login }), 200, { live: "boolean" });
    },
  },
  {
    name: "stats: the dashboard reads the count with a session",
    async run(context) {
      await expectCode(await request(context, "/api/stats"), 401, "unauthorized");
      await expect(await request(context, "/api/stats", { session: STREAMER.login }), 200, { follows: "number", chatters: "number" });
    },
  },
  {
    name: "events: unknown alert kind is 400",
    async run(context) {
      await expectCode(await request(context, "/api/test?kind=nothing", { method: "POST", session: STREAMER.login }), 400, "unknown-kind");
    },
  },
];
