// Small HTTP helpers without dependencies
import type { IncomingMessage, ServerResponse } from "node:http";
import { readFile } from "node:fs/promises";
import { extname, join, resolve, sep } from "node:path";

const TYPES: Record<string, string> = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript",
  ".css": "text/css",
  ".json": "application/json",
  ".png": "image/png",
  ".svg": "image/svg+xml",
  ".webm": "video/webm",
  ".mp4": "video/mp4",
  ".gif": "image/gif",
  ".webp": "image/webp",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".mp3": "audio/mpeg",
  ".wav": "audio/wav",
  ".ogg": "audio/ogg",
};

export const send = (res: ServerResponse, status: number, body: string) => {
  res.writeHead(status, { "Content-Type": "text/plain; charset=utf-8" });
  res.end(body);
};

export const json = (res: ServerResponse, body: unknown, status = 200) => {
  res.writeHead(status, { "Content-Type": "application/json", "Cache-Control": "no-store" });
  res.end(JSON.stringify(body));
};

export const redirect = (res: ServerResponse, to: string, headers: Record<string, string | string[]> = {}) => {
  res.writeHead(302, { Location: to, ...headers });
  res.end();
};

// Rejects POSTs from foreign websites (otherwise any page in the browser could act on someone else's behalf)
export function sameOrigin(req: IncomingMessage) {
  const origin = req.headers.origin;
  // A broken origin (e.g. "null" from a sandbox) counts as foreign
  return !origin || (URL.canParse(origin) && new URL(origin).host === req.headers.host);
}

// Reads the request body, with an upper limit against huge uploads
export async function readBody(req: IncomingMessage, limit: number) {
  const chunks: Buffer[] = [];
  let size = 0;
  for await (const chunk of req as AsyncIterable<Buffer>) {
    size += chunk.length;
    if (size > limit) throw Object.assign(new Error("too large"), { status: 413 });
    chunks.push(chunk);
  }
  return Buffer.concat(chunks);
}

// Cookies of the request. Broken percent encoding (e.g. from another app on localhost) stays raw.
export function cookies(req: IncomingMessage): Record<string, string> {
  const pairs = (req.headers.cookie ?? "").split(";").map(pair => pair.trim().split("=")).filter(([name]) => name);
  return Object.fromEntries(pairs.map(([name, ...value]) => [name, decodeCookie(value.join("="))]));
}

function decodeCookie(value: string) {
  try {
    return decodeURIComponent(value);
  } catch {
    // Not decodable: unchanged, readSession does not recognize a session from it anyway
    return value;
  }
}

// Serves a file from root; paths outside of root are forbidden.
// sandbox: media opened directly (e.g. an uploaded SVG) must not run scripts.
export async function serveStatic(res: ServerResponse, root: string, path: string, sandbox = false) {
  const base = resolve(root);
  const file = resolve(join(base, decodeURIComponent(path)));
  if (!file.startsWith(base + sep)) return send(res, 403, "forbidden");
  try {
    const body = await readFile(file);
    const csp = sandbox ? { "Content-Security-Policy": "sandbox; default-src 'none'; img-src 'self' data:; media-src 'self'; style-src 'unsafe-inline'" } : {};
    res.writeHead(200, { "Content-Type": TYPES[extname(file).toLowerCase()] ?? "application/octet-stream", ...csp });
    res.end(body);
  } catch {
    send(res, 404, "not-found");
  }
}
