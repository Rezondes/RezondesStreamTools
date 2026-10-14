// Overlay-Server: liefert dist/ aus, meldet sich per OAuth bei Twitch an und reicht
// EventSub-Ereignisse per Server-Sent Events (/events) an alle offenen Overlays weiter.
// Keine Abhängigkeiten, läuft direkt mit Node 24 (TypeScript wird beim Start entfernt).
import { createServer, type IncomingMessage, type ServerResponse } from "node:http";
import { mkdir, readdir, readFile, rm, writeFile } from "node:fs/promises";
import { extname, join, resolve, sep } from "node:path";
import { randomBytes } from "node:crypto";
import type { Alert, Track } from "../src/twitch.ts";
import * as spotify from "./spotify.ts";
import { chat } from "./chat.ts";
import { startTriggers } from "./triggers.ts";

const PORT = Number(process.env.PORT ?? 8080);
const PUBLIC_URL = process.env.PUBLIC_URL ?? `http://localhost:${PORT}`;
const CLIENT_ID = process.env.TWITCH_CLIENT_ID ?? "";
const CLIENT_SECRET = process.env.TWITCH_CLIENT_SECRET ?? "";
const DIST = resolve(process.env.DIST ?? "dist");
const DATA = resolve(process.env.DATA ?? "data");
// Eigene Einstellungen: config/triggers.json und config/media/ (Bilder, Videos, Sounds)
const CONFIG = resolve(process.env.CONFIG ?? "config");
const MEDIA = join(CONFIG, "media");
const TOKEN_FILE = join(DATA, "tokens.json");
const REDIRECT = `${PUBLIC_URL}/auth/callback`;
const SCOPES = [
  "moderator:read:followers",
  "channel:read:subscriptions",
  "bits:read",
  "channel:read:redemptions",
  "channel:read:hype_train",
];

if (!CLIENT_ID || !CLIENT_SECRET) {
  console.error("TWITCH_CLIENT_ID und TWITCH_CLIENT_SECRET fehlen (siehe server.env.example)");
  process.exit(1);
}

// --- Overlays (Server-Sent Events) ---------------------------------------------------
const clients = new Set<ServerResponse>();

function emit(message: object) {
  const line = `data: ${JSON.stringify(message)}\n\n`;
  for (const c of clients) c.write(line);
}

function broadcast(alert: Alert) {
  emit({ type: "alert", alert });
  console.log(`Alert ${alert.kind}: ${alert.user} (${clients.size} Overlays)`);
}

await spotify.init(PUBLIC_URL, DATA, (track: Track | null) => emit({ type: "music", track }), () => clients.size > 0);

const triggers = startTriggers(CONFIG, event => emit({ type: "fx", event }));

// Der Server liest den Chat des eingeloggten Kanals mit, damit Trigger auch ohne offenes Chat-Overlay laufen
let stopChat: (() => void) | null = null;
let chatLogin = "";
function listenChat() {
  const login = tokens?.login ?? "";
  if (login === chatLogin) return;
  stopChat?.();
  stopChat = null;
  chatLogin = login;
  if (login) stopChat = chat(login, line => triggers.handle(line));
}
// Kommentarzeile hält die Verbindung durch Proxys und OBS offen
setInterval(() => { for (const c of clients) c.write(": ping\n\n"); }, 25_000);

// --- Tokens ----------------------------------------------------------------------------
type Tokens = { access: string; refresh: string; userId: string; login: string };
let tokens: Tokens | null = null;

async function save(t: Tokens | null) {
  tokens = t;
  if (t) {
    await mkdir(DATA, { recursive: true });
    await writeFile(TOKEN_FILE, JSON.stringify(t), { mode: 0o600 });
  } else {
    await rm(TOKEN_FILE, { force: true });
  }
  listenChat();
}

async function tokenRequest(params: Record<string, string>) {
  const res = await fetch("https://id.twitch.tv/oauth2/token", {
    method: "POST",
    body: new URLSearchParams({ client_id: CLIENT_ID, client_secret: CLIENT_SECRET, ...params }),
  });
  if (!res.ok) throw new Error(`Token-Anfrage fehlgeschlagen: ${res.status} ${await res.text()}`);
  return (await res.json()) as { access_token: string; refresh_token: string };
}

// Twitch verlangt eine stündliche Prüfung. Abgelaufen: mit dem Refresh-Token erneuern.
async function validate() {
  if (!tokens) return false;
  const res = await fetch("https://id.twitch.tv/oauth2/validate", { headers: { Authorization: `OAuth ${tokens.access}` } });
  if (res.ok) return true;
  try {
    const r = await tokenRequest({ grant_type: "refresh_token", refresh_token: tokens.refresh });
    await save({ ...tokens, access: r.access_token, refresh: r.refresh_token });
    return true;
  } catch (e) {
    console.error("Login abgelaufen, bitte neu verbinden:", e);
    stopEventSub();
    await save(null);
    return false;
  }
}
setInterval(validate, 3_600_000);

// --- EventSub ----------------------------------------------------------------------------
const subscriptions = (id: string): [string, string, Record<string, string>][] => [
  ["channel.follow", "2", { broadcaster_user_id: id, moderator_user_id: id }],
  ["channel.subscribe", "1", { broadcaster_user_id: id }],
  ["channel.subscription.message", "1", { broadcaster_user_id: id }],
  ["channel.subscription.gift", "1", { broadcaster_user_id: id }],
  ["channel.cheer", "1", { broadcaster_user_id: id }],
  ["channel.raid", "1", { to_broadcaster_user_id: id }],
  ["channel.channel_points_custom_reward_redemption.add", "1", { broadcaster_user_id: id }],
  ["channel.hype_train.begin", "2", { broadcaster_user_id: id }],
  ["channel.hype_train.end", "2", { broadcaster_user_id: id }],
];

const TIERS: Record<string, string> = { "1000": "", "2000": "Tier 2", "3000": "Tier 3" };

// Übersetzt ein EventSub-Ereignis in das Alert-Format der Overlays
function toAlert(type: string, ev: any): Alert | null {
  const anon = (name: string | null) => (ev.is_anonymous || !name ? "Anonym" : name);
  switch (type) {
    case "channel.follow": return { kind: "follow", user: ev.user_name };
    // Verschenkte Subs meldet schon channel.subscription.gift, sonst gäbe es pro Empfänger einen Alert
    case "channel.subscribe": return ev.is_gift ? null : { kind: "sub", user: ev.user_name, detail: TIERS[ev.tier] || undefined };
    case "channel.subscription.message": return { kind: "resub", user: ev.user_name, amount: ev.cumulative_months, text: ev.message?.text || undefined, detail: TIERS[ev.tier] || undefined };
    case "channel.subscription.gift": return { kind: "gift", user: anon(ev.user_name), amount: ev.total };
    // Cheermotes wie "Cheer100" aus dem Text nehmen
    case "channel.cheer": return { kind: "cheer", user: anon(ev.user_name), amount: ev.bits, text: ev.message.replace(/\b[a-zA-Z]+\d+\b/g, "").trim() || undefined };
    case "channel.raid": return { kind: "raid", user: ev.from_broadcaster_user_name, amount: ev.viewers };
    case "channel.channel_points_custom_reward_redemption.add": return { kind: "redeem", user: ev.user_name, amount: ev.reward.cost, detail: ev.reward.title, text: ev.user_input || undefined };
    case "channel.hype_train.begin": return { kind: "hype", user: "HYPE TRAIN", amount: ev.level, detail: "begin" };
    case "channel.hype_train.end": return { kind: "hype", user: "HYPE TRAIN", amount: ev.level, detail: "end" };
  }
  return null;
}

let ws: WebSocket | null = null;
let wanted = false;
let keepalive: ReturnType<typeof setTimeout> | undefined;
let retry: ReturnType<typeof setTimeout> | undefined;

async function subscribeAll(sessionId: string) {
  if (!(await validate()) || !tokens) return;
  for (const [type, version, condition] of subscriptions(tokens.userId)) {
    const res = await fetch("https://api.twitch.tv/helix/eventsub/subscriptions", {
      method: "POST",
      headers: { "Client-Id": CLIENT_ID, Authorization: `Bearer ${tokens.access}`, "Content-Type": "application/json" },
      body: JSON.stringify({ type, version, condition, transport: { method: "websocket", session_id: sessionId } }),
    });
    if (!res.ok) console.error(`Abo ${type} fehlgeschlagen: ${res.status} ${await res.text()}`);
  }
  console.log(`EventSub verbunden als ${tokens.login}`);
}

function startEventSub(url = "wss://eventsub.wss.twitch.tv/ws", subscribe = true) {
  wanted = true;
  const socket = new WebSocket(url);
  let timeoutMs = 30_000;

  socket.onmessage = async e => {
    const m = JSON.parse(String(e.data));
    const type = m.metadata?.message_type;
    if (type === "session_welcome") {
      timeoutMs = (m.payload.session.keepalive_timeout_seconds ?? 30) * 1000;
      const old = ws;
      ws = socket;
      if (old && old !== socket) old.close();
      // Nach session_reconnect bleiben die Abos bestehen
      if (subscribe) await subscribeAll(m.payload.session.id);
    } else if (type === "notification") {
      const alert = toAlert(m.metadata.subscription_type, m.payload.event);
      if (alert) broadcast(alert);
    } else if (type === "session_reconnect") {
      startEventSub(m.payload.session.reconnect_url, false);
    } else if (type === "revocation") {
      console.warn(`Abo widerrufen: ${m.payload.subscription.type} (${m.payload.subscription.status})`);
    }
    // Twitch schickt regelmässig Keepalives. Bleiben sie aus, ist die Verbindung tot.
    if (socket === ws) {
      clearTimeout(keepalive);
      keepalive = setTimeout(() => socket.close(), timeoutMs + 5000);
    }
  };

  socket.onclose = () => {
    if (!wanted || (socket !== ws && ws !== null)) return;
    ws = null;
    clearTimeout(keepalive);
    clearTimeout(retry);
    retry = setTimeout(() => tokens && startEventSub(), 5000);
  };
}

function stopEventSub() {
  wanted = false;
  clearTimeout(keepalive);
  clearTimeout(retry);
  const old = ws;
  ws = null;
  old?.close();
}

// --- HTTP --------------------------------------------------------------------------------
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
  ".mp3": "audio/mpeg",
  ".wav": "audio/wav",
  ".ogg": "audio/ogg",
};

const SAMPLES: Record<string, Alert> = {
  follow: { kind: "follow", user: "neo_42" },
  sub: { kind: "sub", user: "Trinity", text: "Endlich abonniert!" },
  resub: { kind: "resub", user: "MorpheusTV", amount: 12, text: "Ein Jahr schon!", detail: "Tier 2" },
  gift: { kind: "gift", user: "Oracle", amount: 5 },
  cheer: { kind: "cheer", user: "Tank", amount: 500, text: "Nimm das!" },
  raid: { kind: "raid", user: "agent_smith", amount: 42 },
  redeem: { kind: "redeem", user: "Dozer", amount: 500, detail: "Hydrieren!", text: "Trink was!" },
  hype: { kind: "hype", user: "HYPE TRAIN", amount: 3, detail: "end" },
};

const loginStates = new Set<string>();

const send = (res: ServerResponse, status: number, body: string) => {
  res.writeHead(status, { "Content-Type": "text/plain; charset=utf-8" });
  res.end(body);
};
const json = (res: ServerResponse, body: unknown) => {
  res.writeHead(200, { "Content-Type": "application/json", "Cache-Control": "no-store" });
  res.end(JSON.stringify(body));
};
const redirect = (res: ServerResponse, to: string) => {
  res.writeHead(302, { Location: to });
  res.end();
};

// POSTs von fremden Webseiten abweisen (sonst könnte jede Seite im Browser Fake-Alerts auslösen)
function sameOrigin(req: IncomingMessage) {
  const origin = req.headers.origin;
  return !origin || new URL(origin).host === req.headers.host;
}

// Request-Body lesen, mit Obergrenze gegen versehentlich riesige Uploads
async function readBody(req: IncomingMessage, limit: number) {
  const chunks: Buffer[] = [];
  let size = 0;
  for await (const chunk of req) {
    size += chunk.length;
    if (size > limit) throw Object.assign(new Error("zu gross"), { status: 413 });
    chunks.push(chunk);
  }
  return Buffer.concat(chunks);
}

// Erlaubte Mediendateien: nur einfache Namen (kein Pfad) mit bekannter Endung
const MEDIA_NAME = /^[\w][\w .()-]*\.(gif|png|jpe?g|webp|svg|mp4|webm|mp3|wav|ogg)$/i;
const MEDIA_LIMIT = 50 * 1024 * 1024;

async function serveStatic(root: string, path: string, res: ServerResponse) {
  const file = resolve(join(root, decodeURIComponent(path === "/" ? "/index.html" : path)));
  if (!file.startsWith(root + sep)) return send(res, 403, "Verboten");
  try {
    const body = await readFile(file);
    // Medien direkt geöffnet (z.B. eine hochgeladene SVG) dürfen kein Script ausführen
    const sandbox = root === MEDIA ? { "Content-Security-Policy": "sandbox; default-src 'none'; img-src 'self' data:; media-src 'self'; style-src 'unsafe-inline'" } : {};
    res.writeHead(200, { "Content-Type": TYPES[extname(file)] ?? "application/octet-stream", ...sandbox });
    res.end(body);
  } catch {
    send(res, 404, "Nicht gefunden");
  }
}

async function handle(req: IncomingMessage, res: ServerResponse) {
  const url = new URL(req.url ?? "/", PUBLIC_URL);
  const post = req.method === "POST";
  if (post && !sameOrigin(req)) return send(res, 403, "Fremde Herkunft");

  switch (url.pathname) {
    case "/api/status":
      return json(res, { login: tokens?.login ?? null, live: ws !== null, spotify: spotify.enabled() ? spotify.connected() : null });

    case "/events":
      res.writeHead(200, { "Content-Type": "text/event-stream", "Cache-Control": "no-cache", Connection: "keep-alive" });
      res.write(": verbunden\n\n");
      // Neue Overlays sofort mit dem laufenden Titel versorgen
      res.write(`data: ${JSON.stringify({ type: "music", track: spotify.current() })}\n\n`);
      clients.add(res);
      req.on("close", () => clients.delete(res));
      return;

    case "/auth/login": {
      const state = randomBytes(16).toString("hex");
      loginStates.add(state);
      setTimeout(() => loginStates.delete(state), 600_000);
      const query = new URLSearchParams({ client_id: CLIENT_ID, redirect_uri: REDIRECT, response_type: "code", scope: SCOPES.join(" "), state, force_verify: "true" });
      return redirect(res, `https://id.twitch.tv/oauth2/authorize?${query}`);
    }

    case "/auth/callback": {
      // state schützt davor, dass eine fremde Seite dir ihren Login unterschiebt
      const code = url.searchParams.get("code");
      if (!loginStates.delete(url.searchParams.get("state") ?? "") || !code) {
        return send(res, 400, `Login abgebrochen oder ungültig (${url.searchParams.get("error_description") ?? "state"}). Bitte erneut verbinden.`);
      }
      const t = await tokenRequest({ grant_type: "authorization_code", code, redirect_uri: REDIRECT });
      const me = await fetch("https://api.twitch.tv/helix/users", { headers: { "Client-Id": CLIENT_ID, Authorization: `Bearer ${t.access_token}` } }).then(r => r.json());
      await save({ access: t.access_token, refresh: t.refresh_token, userId: me.data[0].id, login: me.data[0].login });
      stopEventSub();
      startEventSub();
      return redirect(res, "/");
    }

    case "/auth/logout": {
      if (!post) return send(res, 405, "Nur POST");
      if (tokens) await fetch("https://id.twitch.tv/oauth2/revoke", { method: "POST", body: new URLSearchParams({ client_id: CLIENT_ID, token: tokens.access }) }).catch(() => {});
      stopEventSub();
      await save(null);
      return json(res, { ok: true });
    }

    case "/spotify/login":
      if (!spotify.enabled()) return send(res, 400, "SPOTIFY_CLIENT_ID und SPOTIFY_CLIENT_SECRET fehlen in server.env");
      return redirect(res, spotify.loginUrl());

    case "/spotify/callback":
      if (!(await spotify.callback(url.searchParams.get("code"), url.searchParams.get("state")))) {
        return send(res, 400, `Spotify-Login abgebrochen oder ungültig (${url.searchParams.get("error") ?? "state"}). Bitte erneut verbinden.`);
      }
      // Zurück auf die Übersicht unter der normalen Adresse (Callback kam über 127.0.0.1)
      return redirect(res, `${PUBLIC_URL}/`);

    case "/spotify/logout":
      if (!post) return send(res, 405, "Nur POST");
      await spotify.logout();
      emit({ type: "music", track: null });
      return json(res, { ok: true });

    case "/api/triggers/config": {
      if (!post) return json(res, triggers.config());
      let list: unknown;
      try {
        list = JSON.parse(String(await readBody(req, 1024 * 1024))).triggers;
      } catch {
        return send(res, 400, JSON.stringify(["Ungültiges JSON"]));
      }
      if (!Array.isArray(list)) return send(res, 400, JSON.stringify(["triggers muss eine Liste sein"]));
      const errors = await triggers.save(list);
      return errors.length ? send(res, 400, JSON.stringify(errors)) : json(res, { ok: true });
    }

    case "/api/media": {
      if (!post) {
        const files = await readdir(MEDIA).catch(() => [] as string[]);
        return json(res, files.filter(f => MEDIA_NAME.test(f)).sort());
      }
      const name = url.searchParams.get("name") ?? "";
      if (!MEDIA_NAME.test(name)) return send(res, 400, "Dateiname oder Endung nicht erlaubt");
      await mkdir(MEDIA, { recursive: true });
      await writeFile(join(MEDIA, name), await readBody(req, MEDIA_LIMIT));
      console.log(`Medium hochgeladen: ${name}`);
      return json(res, { ok: true, name });
    }

    case "/api/triggers":
      return json(res, triggers.list());

    case "/api/trigger": {
      if (!post) return send(res, 405, "Nur POST");
      if (!triggers.fire(url.searchParams.get("name") ?? "")) return send(res, 404, "Trigger nicht gefunden");
      return json(res, { ok: true });
    }

    case "/api/test": {
      if (!post) return send(res, 405, "Nur POST");
      const alert = SAMPLES[url.searchParams.get("kind") ?? ""];
      if (!alert) return send(res, 400, `Unbekannt, erlaubt: ${Object.keys(SAMPLES).join(", ")}`);
      broadcast(alert);
      return json(res, { ok: true });
    }
  }
  if (url.pathname.startsWith("/media/")) return serveStatic(MEDIA, url.pathname.slice("/media".length), res);
  return serveStatic(DIST, url.pathname, res);
}

// Gespeicherten Login vom letzten Start übernehmen
try {
  tokens = JSON.parse(await readFile(TOKEN_FILE, "utf8"));
  if (await validate()) startEventSub();
} catch {
  console.log(`Noch nicht mit Twitch verbunden: ${PUBLIC_URL} öffnen`);
}
listenChat();

createServer((req, res) => {
  handle(req, res).catch(e => {
    if (e.status === 413) return send(res, 413, "Datei zu gross (max. 50 MB)");
    console.error(e);
    if (!res.headersSent) send(res, 500, "Serverfehler, siehe Log");
  });
}).listen(PORT, () => console.log(`Overlays auf ${PUBLIC_URL}`));
