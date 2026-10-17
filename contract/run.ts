// Contract test runner (RUST-PLAN.md package 4): starts the fake providers and the server under test with dummy
// values and an empty DATA folder, runs every case in contract/cases and prints the result. The server never sees
// server.env or a real account; its environment is built here from scratch.
//   node contract/run.ts [--server "<command>"] [--pending <cases still allowed to fail>.json]
// Not part of npm run verify (needs running processes); needs a built dist/ (vite build).
import { spawn } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { mkdtemp, rm } from "node:fs/promises";
import { createServer } from "node:net";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { parseArgs } from "node:util";
import { CASES } from "./cases/index.ts";
import { ADMIN, type Context } from "./client.ts";
import { startFakeProviders } from "./fakeProviders.ts";
import { summarize, type CaseResult } from "./shape.ts";

const CASE_TIMEOUT_MS = 15_000;
const START_TIMEOUT_MS = 30_000;

function freePort() {
  return new Promise<number>(done => {
    const probe = createServer().listen(0, "127.0.0.1", () => {
      const { port } = probe.address() as { port: number };
      probe.close(() => done(port));
    });
  });
}

// Only what a process needs to start, plus the dummy configuration of the server
function serverEnv(port: number, data: string, providers: Record<string, string>) {
  const keep = ["PATH", "Path", "SystemRoot", "SYSTEMROOT", "TEMP", "TMP", "HOME", "USERPROFILE", "APPDATA", "LOCALAPPDATA"];
  const base = Object.fromEntries(keep.filter(name => process.env[name]).map(name => [name, process.env[name] ?? ""]));
  return {
    ...base, ...providers, PORT: String(port), PUBLIC_URL: `http://localhost:${port}`, DATA: data, DIST: resolve("dist"),
    ADMINS: ADMIN.login, TWITCH_CLIENT_ID: "contract-client", TWITCH_CLIENT_SECRET: "contract-secret",
    SPOTIFY_CLIENT_ID: "contract-spotify", SPOTIFY_CLIENT_SECRET: "contract-spotify-secret", MEDIA_LIMIT_MB: "1",
    // A dummy master key; the key store lands in the temporary DATA folder
    RST_MASTER_KEY: "Y29udHJhY3QtbWFzdGVyLWtleS1vZi0zMi1ieXRlcyE=",
  };
}

async function waitForServer(base: string, exited: () => boolean) {
  const until = Date.now() + START_TIMEOUT_MS;
  while (Date.now() < until && !exited()) {
    if (await fetch(base, { redirect: "manual" }).then(() => true, () => false)) return true;
    await new Promise(done => setTimeout(done, 200));
  }
  return false;
}

async function runCase(context: Context, run: (context: Context) => Promise<void>): Promise<string | null> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<string>(done => { timer = setTimeout(() => done(`timeout after ${CASE_TIMEOUT_MS} ms`), CASE_TIMEOUT_MS); });
  try {
    return await Promise.race([run(context).then(() => null, (error: unknown) => (error instanceof Error ? error.message : String(error))), timeout]);
  } finally {
    clearTimeout(timer);
  }
}

function report(results: CaseResult[], pending: string[], log: string) {
  for (const result of results) console.log(`${result.error === null ? "ok  " : pending.includes(result.name) ? "pend" : "FAIL"} ${result.name}${result.error ? `\n     ${result.error}` : ""}`);
  const summary = summarize(results, pending);
  for (const name of summary.fixed) console.log(`passes now, remove from the pending list: ${name}`);
  for (const name of summary.unknownPending) console.log(`pending list names an unknown case: ${name}`);
  console.log(`${results.length - summary.failed.length}/${results.length} cases without failure`);
  if (!summary.ok) console.log(`--- server output ---\n${log.slice(-4000)}`);
  return summary.ok;
}

/** The server under test is the debug build of rst unless --server names another command */
export const DEFAULT_SERVER = "server-rs/target/debug/rst serve";

/** A running server under test with the fake providers and an empty DATA folder; stop() ends and cleans up all of it */
export type ServerUnderTest = { context: Context; pid: number | undefined; log: () => string; stop: () => Promise<void> };

export async function startServer(commandLine: string): Promise<ServerUnderTest> {
  const fake = await startFakeProviders();
  const data = await mkdtemp(join(tmpdir(), "rst-contract-"));
  const port = await freePort();
  const [command, ...args] = commandLine.split(/\s+/).filter(Boolean);
  const server = spawn(command, args, { env: serverEnv(port, data, fake.env), stdio: ["ignore", "pipe", "pipe"] });
  let log = "";
  let exited = false;
  server.stdout.on("data", (chunk: Buffer) => { log += chunk.toString(); });
  server.stderr.on("data", (chunk: Buffer) => { log += chunk.toString(); });
  server.on("exit", () => { exited = true; });
  const context: Context = { base: `http://localhost:${port}`, fake, sessions: new Map(), memory: new Map() };
  const stop = async () => {
    server.kill();
    await fake.stop();
    await rm(data, { recursive: true, force: true }).catch(() => {});
  };
  if (!(await waitForServer(context.base, () => exited))) {
    await stop();
    throw new Error(`server did not start:\n${log}`);
  }
  return { context, pid: server.pid, log: () => log, stop };
}

async function main() {
  const { values } = parseArgs({ options: { server: { type: "string" }, pending: { type: "string" } } });
  if (!existsSync("dist/index.html")) throw new Error("dist/ missing: run vite build first");
  const pending = values.pending ? (JSON.parse(readFileSync(values.pending, "utf8")) as string[]) : [];
  const server = await startServer(values.server ?? DEFAULT_SERVER);
  try {
    const results: CaseResult[] = [];
    for (const { name, run } of CASES) results.push({ name, error: await runCase(server.context, run) });
    process.exitCode = report(results, pending, server.log()) ? 0 : 1;
  } finally {
    await server.stop();
  }
}

if (import.meta.main) await main();
