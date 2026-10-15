// Kleine HTTP-Helfer ohne Abhängigkeiten
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

// POSTs von fremden Webseiten abweisen (sonst könnte jede Seite im Browser in fremdem Namen handeln)
export function sameOrigin(req: IncomingMessage) {
  const origin = req.headers.origin;
  // Kaputte Herkunft (z.B. "null" aus einer Sandbox) zählt als fremd
  return !origin || (URL.canParse(origin) && new URL(origin).host === req.headers.host);
}

// Request-Body lesen, mit Obergrenze gegen riesige Uploads
export async function readBody(req: IncomingMessage, limit: number) {
  const chunks: Buffer[] = [];
  let size = 0;
  for await (const chunk of req) {
    size += chunk.length;
    if (size > limit) throw Object.assign(new Error("zu gross"), { status: 413 });
    chunks.push(chunk);
  }
  return Buffer.concat(chunks);
}

// Cookies der Anfrage. Kaputte Prozent-Kodierung (z.B. von einer anderen App auf localhost) bleibt roh stehen.
export function cookies(req: IncomingMessage): Record<string, string> {
  const pairs = (req.headers.cookie ?? "").split(";").map(pair => pair.trim().split("=")).filter(([name]) => name);
  return Object.fromEntries(pairs.map(([name, ...value]) => [name, decodeCookie(value.join("="))]));
}

function decodeCookie(value: string) {
  try {
    return decodeURIComponent(value);
  } catch {
    // Nicht dekodierbar: unverändert, eine Sitzung erkennt readSession daran ohnehin nicht
    return value;
  }
}

// Datei aus root ausliefern; Pfade ausserhalb von root sind verboten.
// sandbox: Medien direkt geöffnet (z.B. eine hochgeladene SVG) dürfen kein Script ausführen.
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
