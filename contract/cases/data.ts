// Contract cases: settings with error codes, the help command and the triggers of a streamer.
import { expect, expectCode, fail, request, STREAMER, type Case } from "../client.ts";

const session = STREAMER.login;
const post = (body: unknown) => ({ method: "POST", session, body: JSON.stringify(body) });
const LIZARD = { name: "lizard", when: { type: "command", match: "!lizard" }, do: [{ type: "text", text: "hi" }] };

export const DATA_CASES: Case[] = [
  {
    name: "settings: read with the list of themes",
    async run(context) {
      await expect(await request(context, "/api/settings", { session }), 200, { theme: "string", values: "object", themes: [{ id: "string", name: "string" }] });
    },
  },
  {
    name: "settings: invalid values come back as codes per field",
    async run(context) {
      const errors = (await expect(await request(context, "/api/settings", post({ theme: "matrix", values: { accent: "nope" } })), 400, [{ key: "string", code: "string" }])) as { code: string }[];
      if (!errors.some(error => error.code === "invalid_color")) fail("no invalid_color code");
      await expect(await request(context, "/api/settings", post({ values: {} })), 400, [{ key: "string", code: "string" }]);
    },
  },
  {
    name: "settings: valid values are saved and public",
    async run(context) {
      await expect(await request(context, "/api/settings", post({ theme: "matrix", values: {} })), 200, { theme: "string", values: "object" });
      const settings = (await expect(await request(context, `/s/${STREAMER.login}/settings`), 200, { theme: "string" })) as { theme: string };
      if (settings.theme !== "matrix") fail(`theme not chosen: ${settings.theme}`);
    },
  },
  {
    name: "commands: help command is read and saved, broken input is 400",
    async run(context) {
      const shape = { enabled: "boolean", command: "string", reply: "string", cooldown: "number" };
      const help = await expect(await request(context, "/api/commands", { session }), 200, { ...shape, canChat: "boolean|null" });
      await expect(await request(context, "/api/commands", post(help)), 200, shape);
      await expectCode(await request(context, "/api/commands", { method: "POST", session, body: "nope" }), 400, "invalid-json");
    },
  },
  {
    name: "triggers: invalid rules are rejected with messages, the file stays",
    async run(context) {
      const invalid = { ...LIZARD, who: "moderator" };
      await expect(await request(context, "/api/triggers/config", post({ triggers: [invalid] })), 400, ["string"]);
      await expect(await request(context, "/api/triggers/config", post({ nothing: true })), 400, ["string"]);
      const config = (await expect(await request(context, "/api/triggers/config", { session }), 200, { triggers: "array" })) as { triggers: unknown[] };
      if (config.triggers.length !== 0) fail("invalid rules were saved");
    },
  },
  {
    name: "triggers: valid rules are saved, listed and fire",
    async run(context) {
      await expect(await request(context, "/api/triggers/config", post({ triggers: [LIZARD] })), 200, { ok: "boolean" });
      await expect(await request(context, "/api/triggers", { session }), 200, [{ name: "string" }]);
      await expect(await request(context, "/api/trigger?name=lizard", { method: "POST", session }), 200, { ok: "boolean" });
      await expectCode(await request(context, "/api/trigger?name=nothing", { method: "POST", session }), 404, "unknown-trigger");
    },
  },
];
