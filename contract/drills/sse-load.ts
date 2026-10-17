// SSE load drill (RUST-PLAN.md package 46): 50 overlays for each of 10 streamers read the event stream while every
// streamer gets a test alert ten times a second, and 10 clients of an 11th streamer never read. No reading overlay may
// lose its connection or miss alerts, and the server stays below 200 MB of memory.
//   node contract/drills/sse-load.ts [--server "<command>"] [--seconds 10]
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { connect, type Socket } from "node:net";
import { parseArgs } from "node:util";
import { ADMIN, expect, login, request, setAccess, type Context } from "../client.ts";
import { DEFAULT_SERVER, startServer } from "../run.ts";

const STREAMERS = 10;
const OVERLAYS = 50;
const SILENT = 10;
const ALERT_EVERY_MS = 100;
const MEMORY_LIMIT_MB = 200;

type Streamer = { login: string; key: string };
type Reader = { alerts: number; ended: boolean };

// Resident memory of a process in MB
function memoryMb(pid: number): number {
  if (process.platform === "win32") {
    const bytes = execFileSync("powershell", ["-NoProfile", "-Command", `(Get-Process -Id ${pid}).WorkingSet64`], { encoding: "utf8" });
    return Number(bytes.trim()) / 1024 / 1024;
  }
  const status = readFileSync(`/proc/${pid}/status`, "utf8");
  return Number(/VmRSS:\s+(\d+) kB/.exec(status)?.[1] ?? 0) / 1024;
}

async function streamer(context: Context, index: number): Promise<Streamer> {
  const name = `load${index}`;
  await login(context, name, String(100 + index));
  const me = (await expect(await request(context, "/api/me", { session: name }), 200, { overlayKey: "string" })) as { overlayKey: string };
  return { login: name, key: me.overlayKey };
}

// Reads the stream until stop and counts the alerts; ended: the server closed it
function read(context: Context, target: Streamer, stop: AbortSignal): Reader {
  const reader: Reader = { alerts: 0, ended: false };
  void (async () => {
    try {
      const response = await fetch(`${context.base}/s/${target.login}/events?key=${target.key}`, { signal: stop });
      const body = response.body?.getReader();
      const decoder = new TextDecoder();
      for (;;) {
        const chunk = await body?.read();
        if (!chunk || chunk.done) break;
        reader.alerts += decoder.decode(chunk.value).split('"type":"alert"').length - 1;
      }
      reader.ended = !stop.aborted;
    } catch {
      reader.ended = !stop.aborted;
    }
  })();
  return reader;
}

// A client that asks for the stream and never reads a byte of it
function silentClient(context: Context, target: Streamer): Socket {
  const url = new URL(context.base);
  const socket = connect(Number(url.port), url.hostname, () => {
    socket.write(`GET /s/${target.login}/events?key=${target.key} HTTP/1.1\r\nHost: ${url.host}\r\n\r\n`);
    socket.pause();
  });
  socket.on("error", () => {});
  return socket;
}

async function drill(context: Context, pid: number, seconds: number) {
  await login(context, ADMIN.login, ADMIN.id);
  const logins = Array.from({ length: STREAMERS + 1 }, (_, index) => `load${index + 1}`);
  await setAccess(context, logins);
  const streamers: Streamer[] = [];
  for (let index = 1; index <= STREAMERS + 1; index++) streamers.push(await streamer(context, index));
  const quiet = streamers.pop() as Streamer;

  const stop = new AbortController();
  const readers = streamers.flatMap(target => Array.from({ length: OVERLAYS }, () => read(context, target, stop.signal)));
  const silent = Array.from({ length: SILENT }, () => silentClient(context, quiet));
  await new Promise(resolve => setTimeout(resolve, 2000));

  let sent = 0;
  const until = Date.now() + seconds * 1000;
  while (Date.now() < until) {
    await Promise.all([...streamers, quiet].map(target => request(context, "/api/test?kind=follow", { method: "POST", session: target.login })));
    sent++;
    await new Promise(resolve => setTimeout(resolve, ALERT_EVERY_MS));
  }
  await new Promise(resolve => setTimeout(resolve, 1000));
  const memory = memoryMb(pid);
  stop.abort();
  silent.forEach(socket => socket.destroy());

  const ended = readers.filter(reader => reader.ended).length;
  const fewest = Math.min(...readers.map(reader => reader.alerts));
  console.log(`${readers.length} reading overlays, ${SILENT} silent clients, ${sent} alerts per streamer`);
  console.log(`fewest alerts read by one overlay: ${fewest}, connections lost: ${ended}, server memory: ${memory.toFixed(1)} MB`);
  assert.equal(ended, 0, "no reading overlay loses its connection");
  assert.ok(fewest >= sent, "every reading overlay gets every alert");
  assert.ok(memory < MEMORY_LIMIT_MB, `server memory ${memory.toFixed(1)} MB below ${MEMORY_LIMIT_MB} MB`);
}

async function main() {
  const { values } = parseArgs({ options: { server: { type: "string" }, seconds: { type: "string" } } });
  const server = await startServer(values.server ?? DEFAULT_SERVER);
  try {
    if (server.pid === undefined) throw new Error("no process id of the server");
    await drill(server.context, server.pid, Number(values.seconds ?? 10));
    console.log("sse load drill ok");
  } catch (error) {
    console.log(`--- server output ---\n${server.log().slice(-4000)}`);
    throw error;
  } finally {
    await server.stop();
  }
}

if (import.meta.main) await main();
