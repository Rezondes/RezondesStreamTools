// Local demo server (npm run demo): the debug build of rst against the fake Twitch and Spotify of the contract tests
// (contract/fakeProviders.ts), with its data in .demo/, and an own Vite dev server in front of it. "Mit Twitch anmelden"
// in that dashboard logs in as the admin "demo" without a real account. Own ports, so the Docker server (8089) and the
// usual npm run dev (5173) keep running. Only for a local dev build: the fake providers listen on
// loopback and exist only while this script runs; a real server never points at them. Check: demo.check.ts.
import { spawn } from "node:child_process";
import { resolve } from "node:path";
import { DEMO_USER, startFakeProviders } from "../contract/fakeProviders.ts";

// The port of the demo server and of its Vite dev server (which proxies /api, /auth, /s/ and /spotify to it)
export const DEMO_PORT = 8090;
const VITE_PORT = 5174;
export const DASHBOARD = `http://localhost:${VITE_PORT}`;
const SERVER = "server-rs/target/debug/rst";

// The environment of the demo server: fake providers, its Vite dev server as public URL (the proxy keeps the host, so
// login and the origin check of changing requests work there), a dummy master key for .demo/
export function demoEnv(providers: Record<string, string>, base: Record<string, string | undefined>, data: string): Record<string, string | undefined> {
  return {
    ...base, ...providers, PORT: String(DEMO_PORT), PUBLIC_URL: DASHBOARD, DATA: data, DIST: resolve("dist"), ADMINS: DEMO_USER.login,
    TWITCH_CLIENT_ID: "demo-client", TWITCH_CLIENT_SECRET: "demo-secret", SPOTIFY_CLIENT_ID: "demo-spotify", SPOTIFY_CLIENT_SECRET: "demo-spotify-secret",
    // Not a secret: it only locks the made-up data in .demo/
    RST_MASTER_KEY: "ZGVtby1tYXN0ZXIta2V5LW9mLTMyLWJ5dGVzLWxvbmc=",
  };
}

async function main() {
  const fake = await startFakeProviders();
  const server = spawn(SERVER, ["serve"], { env: demoEnv(fake.env, process.env, resolve(".demo")), stdio: "inherit" });
  const vite = spawn(process.execPath, [resolve("node_modules/vite/bin/vite.js"), "--port", String(VITE_PORT)], {
    env: { ...process.env, RST_PROXY: `http://localhost:${DEMO_PORT}` }, stdio: "inherit",
  });
  console.log(`demo server on ${DEMO_PORT}, fake providers on ${fake.url}; open ${DASHBOARD} and log in with Twitch as "${DEMO_USER.login}"`);
  const stop = () => { server.kill(); vite.kill(); void fake.stop().then(() => process.exit(0)); };
  process.on("SIGINT", stop);
  process.on("SIGTERM", stop);
  server.on("exit", code => { vite.kill(); void fake.stop().then(() => process.exit(code ?? 0)); });
}

if (import.meta.main) await main();
