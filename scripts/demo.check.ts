// Check for demo.ts: the demo server gets the fake providers, its port, its Vite server as public URL, the demo
// user as admin and never keeps a real Twitch app or master key from the environment. Runs with npm test.
import assert from "node:assert/strict";
import { DEMO_USER } from "../contract/fakeProviders.ts";
import { DASHBOARD, DEMO_PORT, demoEnv } from "./demo.ts";

const env = demoEnv({ TWITCH_ID_URL: "http://127.0.0.1:1/oauth2" }, { PATH: "/bin", TWITCH_CLIENT_ID: "real", RST_MASTER_KEY: "real" }, "/tmp/demo");
assert.equal(env.TWITCH_ID_URL, "http://127.0.0.1:1/oauth2");
assert.equal(env.PATH, "/bin");
assert.equal(env.PORT, String(DEMO_PORT));
assert.equal(env.PUBLIC_URL, DASHBOARD);
assert.equal(env.ADMINS, DEMO_USER.login);
assert.equal(env.DATA, "/tmp/demo");
assert.notEqual(env.TWITCH_CLIENT_ID, "real");
assert.notEqual(env.RST_MASTER_KEY, "real");

console.log("demo ok");
