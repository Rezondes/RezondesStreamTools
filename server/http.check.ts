// Check for http.ts: read cookies, same origin, body with an upper limit and serve files only from root.
// Requests and responses are small fakes, files are in a temp folder. Runs with npm test.
import assert from "node:assert/strict";
import type { IncomingMessage, ServerResponse } from "node:http";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { cookies, readBody, sameOrigin, serveStatic } from "./http.ts";

// An array is iterable with "for await" like the body stream of a real request
const request = (headers: Record<string, string>, chunks: Buffer[] = []) => Object.assign([...chunks], { headers }) as unknown as IncomingMessage;

// Cookies: several, with equals signs in the value, broken encoding stays raw
assert.deepEqual(cookies(request({ cookie: "sid=a.b=c; theme=%7Bx%7D; broken=%E0%A4" })), { sid: "a.b=c", theme: "{x}", broken: "%E0%A4" });
assert.deepEqual(cookies(request({})), {});

// Same origin: allowed without Origin, same host allowed, foreign or "null" rejected
assert.ok(sameOrigin(request({ host: "overlays.example.de" })));
assert.ok(sameOrigin(request({ host: "overlays.example.de", origin: "https://overlays.example.de" })));
assert.ok(!sameOrigin(request({ host: "overlays.example.de", origin: "https://evil.example" })));
assert.ok(!sameOrigin(request({ host: "overlays.example.de", origin: "null" })));

// Body: assembled, above the limit an error with status 413
assert.equal(String(await readBody(request({}, [Buffer.from("ab"), Buffer.from("cd")]), 10)), "abcd");
await assert.rejects(readBody(request({}, [Buffer.alloc(8), Buffer.alloc(8)]), 10), (error: Error & { status?: number }) => error.status === 413);

// Files: from root with type, sandbox CSP on request, outside 403, missing 404
type Captured = { status: number; headers: Record<string, string>; body: string };
function response() {
  const captured: Captured = { status: 0, headers: {}, body: "" };
  const fake = {
    headersSent: false,
    writeHead(status: number, headers: Record<string, string> = {}) { captured.status = status; Object.assign(captured.headers, headers); return fake; },
    setHeader(name: string, value: string) { captured.headers[name] = value; },
    end(body: string | Buffer = "") { captured.body = String(body); },
  };
  return { res: fake as unknown as ServerResponse, captured };
}

const root = await mkdtemp(join(tmpdir(), "rz-http-"));
try {
  await writeFile(join(root, "bild.svg"), "<svg/>");
  const served = response();
  await serveStatic(served.res, root, "/bild.svg", true);
  assert.equal(served.captured.status, 200);
  assert.equal(served.captured.headers["Content-Type"], "image/svg+xml");
  assert.match(served.captured.headers["Content-Security-Policy"], /sandbox/);
  assert.equal(served.captured.body, "<svg/>");

  const outside = response();
  await serveStatic(outside.res, root, "/../geheim.txt");
  assert.equal(outside.captured.status, 403);

  const missing = response();
  await serveStatic(missing.res, root, "/fehlt.png");
  assert.equal(missing.captured.status, 404);
} finally {
  await rm(root, { recursive: true, force: true });
}

console.log("http ok");
