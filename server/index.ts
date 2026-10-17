// Overlay-Server für mehrere Streamer: nur Routing und Start. Keine Abhängigkeiten, läuft direkt mit Node 24
// (TypeScript wird beim Start entfernt): npm run server (liest server.env) oder im Docker-Container.
// Öffentlich: Overlays unter /s/<login>/... (Szenen, status, events per SSE, media). Dashboard: Anmeldung per Twitch,
// APIs mit Login aus dem Sitzungs-Cookie (Regel 26). Wer was darf, steht in routes.ts und access.ts.
import { spawn } from "node:child_process";
import { createServer, type IncomingMessage, type ServerResponse } from "node:http";
import { copyFile, mkdir, readdir, rm, stat, writeFile } from "node:fs/promises";
import { join, resolve } from "node:path";
import { randomBytes } from "node:crypto";
import * as streamerPath from "../src/core/streamerPath.ts";
import { loadAccess, revokedLogins, type Feature } from "./access.ts";
import { writeAtomic } from "./atomicFile.ts";
import { loadHelp, publicCommands, saveHelp, toHelpConfig } from "./commands.ts";
import { cookies, json, readBody, redirect, sameOrigin, send, serveStatic } from "./http.ts";
import { createLoginStates } from "./loginStates.ts";
import { deleteMedia, listMedia, quotaError } from "./media.ts";
import { CLIPS, createRenderJobs, ffmpegArgs, isClip, isOutputName, outputNames, RENDER_LIMITS } from "./render.ts";
import * as profile from "./profile.ts";
import { ensureSettings, loadSettings, minimeRules, publicSettings, saveSettings, updateSettings } from "./settings.ts";
import { THEMES } from "../src/themes/registry.ts";
import { authorize, find, overlayRoute, ROUTES, type RouteKey, type Visitor } from "./routes.ts";
import { createSession, isSecureUrl, loadSessionKey, readSession, sessionCookie } from "./session.ts";
import { deleteSpotifyTokens, redirectUri, type SpotifyApp } from "./spotify.ts";
import { startStreamer, type Streamer } from "./streamer.ts";
import { isAlertKind, SAMPLE_ALERTS, twitchApp } from "./twitch.ts";

// --- Einstellungen aus server.env -------------------------------------------------------------
const PORT = Number(process.env.PORT ?? 8080);
const PUBLIC_URL = (process.env.PUBLIC_URL ?? `http://localhost:${PORT}`).replace(/\/+$/, "");
const DIST = resolve(process.env.DIST ?? "dist");
const DATA = resolve(process.env.DATA ?? "data");
const ADMINS = (process.env.ADMINS ?? "").split(",").map(login => login.trim().toLowerCase()).filter(streamerPath.isLogin);
const SECURE = isSecureUrl(PUBLIC_URL);
const TWITCH_CLIENT_ID = process.env.TWITCH_CLIENT_ID ?? "";
const TWITCH_CLIENT_SECRET = process.env.TWITCH_CLIENT_SECRET ?? "";
const SPOTIFY_CLIENT_ID = process.env.SPOTIFY_CLIENT_ID ?? "";
const SPOTIFY_CLIENT_SECRET = process.env.SPOTIFY_CLIENT_SECRET ?? "";

const MEDIA_LIMIT = 50 * 1024 * 1024;
// Speicherplatz aller Medien eines Streamers zusammen (MEDIA_LIMIT_MB, Standard 200 MB)
const MEDIA_QUOTA = (Number(process.env.MEDIA_LIMIT_MB) || 200) * 1024 * 1024;
const TRIGGER_LIMIT = 1024 * 1024;
const ACCESS_LIMIT = 64 * 1024;
const SETTINGS_LIMIT = 512 * 1024;
// Codes aus dem OAuth-Callback (Twitch, Spotify)
const OAUTH_CODE = /^[\w.~-]{1,1024}$/;

if (!TWITCH_CLIENT_ID || !TWITCH_CLIENT_SECRET) {
  console.error("TWITCH_CLIENT_ID and TWITCH_CLIENT_SECRET are missing (see server.env.example)");
  process.exit(1);
}
if (ADMINS.length === 0) console.warn("ADMINS is empty: nobody can manage access (see server.env.example)");

const twitch = twitchApp(TWITCH_CLIENT_ID, TWITCH_CLIENT_SECRET, `${PUBLIC_URL}/auth/callback`);
const spotifyApp: SpotifyApp | null = SPOTIFY_CLIENT_ID && SPOTIFY_CLIENT_SECRET
  ? { clientId: SPOTIFY_CLIENT_ID, clientSecret: SPOTIFY_CLIENT_SECRET, redirectUri: redirectUri(PUBLIC_URL) }
  : null;

await mkdir(DATA, { recursive: true });
const access = await loadAccess(DATA, ADMINS);
const sessionKey = await loadSessionKey(DATA);
// Offene Anmeldungen: Twitch braucht nur den state, Spotify merkt sich dazu den Login
const twitchStates = createLoginStates<true>(600_000, 1000);
const spotifyStates = createLoginStates<string>(600_000, 1000);

// --- Laufzeiten -------------------------------------------------------------------------------
const runtimes = new Map<string, Streamer>();

// (Neu) starten, wenn der Login freigeschaltet ist und Tokens hat; sonst nur stoppen
async function startRuntime(login: string): Promise<Streamer | null> {
  runtimes.get(login)?.stop();
  runtimes.delete(login);
  const folder = profile.folder(DATA, login);
  const tokens = access.canUse(login) ? await profile.loadTokens(folder) : null;
  if (!tokens) return null;
  const runtime: Streamer = await startStreamer({
    login, folder, tokens, twitch, spotify: spotifyApp, features: access.features(login), minimeRules: minimeRules(await loadSettings(folder)), link: `${PUBLIC_URL}/s/${login}/`,
    onEnd: () => { if (runtimes.get(login) === runtime) runtimes.delete(login); },
  });
  runtimes.set(login, runtime);
  return runtime;
}

// Nach geänderten Zugängen oder Funktionsstufen: alle Laufzeiten neu, die Overlays verbinden sich selbst wieder
async function restartAll() {
  for (const runtime of runtimes.values()) runtime.stop();
  runtimes.clear();
  for (const login of await profile.list(DATA)) await startRuntime(login);
}

// spotify im Status: null = nicht eingerichtet oder Funktion aus, sonst ob verbunden
const spotifyStatus = (features: Record<Feature, boolean>, runtime: Streamer | undefined) =>
  (spotifyApp && features.music ? runtime?.spotify?.connected() ?? false : null);

// --- Overlays: /s/<login>/... -----------------------------------------------------------------
async function overlay(request: IncomingMessage, response: ServerResponse, path: streamerPath.StreamerPath) {
  const route = overlayRoute(path.segments);
  const folder = profile.folder(DATA, path.login);
  const known = access.canUse(path.login) && (await stat(folder).then(info => info.isDirectory(), () => false));
  if (!route || !known) return send(response, 404, "not-found");
  const runtime = runtimes.get(path.login);
  switch (route.kind) {
    case "status": {
      const features = access.features(path.login);
      return json(response, { login: path.login, live: runtime?.live() ?? false, spotify: spotifyStatus(features, runtime), features });
    }
    case "settings": return json(response, publicSettings(await loadSettings(folder)));
    // ?log: Ereignis-Protokoll im Dashboard, zählt nicht als offenes Overlay
    case "events": return runtime ? runtime.attach(request, response, new URL(request.url ?? "/", "http://x").searchParams.has("log")) : send(response, 404, "not-running");
    case "commands": return json(response, await publicCommands(folder, path.login, access.features(path.login)));
    case "scene": return serveStatic(response, DIST, `/${route.file}`);
    case "media": return serveStatic(response, join(folder, "media"), `/${route.file}`, true);
  }
}

// --- Dashboard und Anmeldung ------------------------------------------------------------------
// Eine Anfrage an eine Route aus ROUTES. login: aus dem Cookie, bei öffentlichen Routen evtl. leer.
type Call = { request: IncomingMessage; response: ServerResponse; url: URL; login: string; runtime: Streamer | undefined };
type Handler = (call: Call) => Promise<void> | void;

// JSON aus einem Body; undefined bei kaputtem JSON
function parseJson(text: string): unknown {
  try {
    return JSON.parse(text);
  } catch {
    // Der Aufrufer antwortet mit 400
    return undefined;
  }
}

function twitchLogin({ response }: Call) {
  const state = randomBytes(16).toString("hex");
  twitchStates.add(state, true, Date.now());
  redirect(response, twitch.authorizeUrl(state));
}

// Tokens tauschen, Freischaltung prüfen, speichern, Laufzeit starten, Sitzung setzen.
// Fehler gehen als Code (?error=) an das Dashboard, das den Text dazu zeigt (Regel 20).
async function twitchCallback({ response, url }: Call) {
  const code = url.searchParams.get("code") ?? "";
  const stateValid = twitchStates.take(url.searchParams.get("state") ?? "", Date.now()) !== null;
  const tokens = stateValid && OAUTH_CODE.test(code) ? await twitch.exchange(code) : null;
  if (!tokens) return redirect(response, "/?error=login-failed");
  if (!access.canUse(tokens.login)) {
    // Nicht freigeschaltet: nichts speichern, Token gleich widerrufen
    await twitch.revoke(tokens.access).catch((error: unknown) => console.error("Revoking a token failed:", error));
    console.log(`Login refused, not on the allowlist: ${tokens.login}`);
    return redirect(response, "/?error=not-allowed");
  }
  const folder = profile.folder(DATA, tokens.login);
  await profile.saveTokens(folder, tokens);
  await profile.saveLastLogin(folder, Date.now());
  // Erster Login: Kanal-Name, Logo usw. der Themes mit dem eigenen Login statt der Beispiele (vor dem Start der Laufzeit)
  if (await ensureSettings(folder, tokens.login)) console.log(`Settings created for ${tokens.login}`);
  await startRuntime(tokens.login);
  console.log(`Twitch login: ${tokens.login}`);
  redirect(response, "/", { "Set-Cookie": sessionCookie(createSession(sessionKey, tokens.login), SECURE) });
}

// Abmelden: Cookie löschen, die Laufzeit (Overlays) läuft weiter
function logout({ response }: Call) {
  response.setHeader("Set-Cookie", sessionCookie("", SECURE, 0));
  json(response, { ok: true });
}

// theme: das aktive Theme; das Dashboard sieht danach aus (Skin)
async function me({ response, login, runtime }: Call) {
  const features = access.features(login);
  const { theme } = await loadSettings(profile.folder(DATA, login));
  json(response, { login, admin: access.isAdmin(login), live: runtime?.live() ?? false, spotify: spotifyStatus(features, runtime), features, theme });
}

function testAlert({ response, url, runtime }: Call) {
  const kind = url.searchParams.get("kind") ?? "";
  if (!isAlertKind(kind)) return send(response, 400, "unknown-kind");
  if (!runtime) return send(response, 409, "not-connected");
  runtime.alert(SAMPLE_ALERTS[kind]);
  json(response, { ok: true });
}

function triggerConfig({ response, runtime }: Call) {
  if (!runtime?.triggers) return send(response, 409, "not-connected");
  json(response, runtime.triggers.config());
}

// Vom Editor: der Server prüft die Regeln; bei Fehlern bleibt die Datei unverändert
async function saveTriggerConfig({ request, response, runtime }: Call) {
  if (!runtime?.triggers) return send(response, 409, "not-connected");
  const body = parseJson(String(await readBody(request, TRIGGER_LIMIT))) as { triggers?: unknown } | null | undefined;
  const list = body?.triggers;
  if (!Array.isArray(list)) return json(response, ["invalid-json"], 400);
  const errors = await runtime.triggers.save(list as Parameters<typeof runtime.triggers.save>[0]);
  if (errors.length) return json(response, errors, 400);
  json(response, { ok: true });
}

function triggerList({ response, runtime }: Call) {
  json(response, runtime?.triggers?.list() ?? []);
}

function fireTrigger({ response, url, runtime }: Call) {
  if (!runtime?.triggers) return send(response, 409, "not-connected");
  if (!runtime.triggers.fire((url.searchParams.get("name") ?? "").slice(0, 200))) return send(response, 404, "unknown-trigger");
  json(response, { ok: true });
}

// Medien mit Grösse und den Triggern, die sie nutzen, dazu belegter und erlaubter Speicher
async function mediaList({ response, login }: Call) {
  json(response, await listMedia(profile.folder(DATA, login), MEDIA_QUOTA));
}

async function uploadMedia({ request, response, url, login }: Call) {
  const name = url.searchParams.get("name") ?? "";
  if (!streamerPath.isMediaName(name)) return send(response, 400, "invalid-name");
  const body = await readBody(request, MEDIA_LIMIT);
  const folder = profile.folder(DATA, login);
  const media = await listMedia(folder, MEDIA_QUOTA);
  const replaced = media.files.find(file => file.name === name)?.size ?? 0;
  if (quotaError(media.usedBytes, body.length, replaced, MEDIA_QUOTA)) return send(response, 413, "quota-exceeded");
  await writeAtomic(join(folder, "media", name), body);
  console.log(`Media uploaded by ${login}: ${name}`);
  json(response, { ok: true, name });
}

// Löscht nur im eigenen Medienordner und nur gültige Namen
async function removeMedia({ response, url, login }: Call) {
  const name = url.searchParams.get("name") ?? "";
  if (!streamerPath.isMediaName(name)) return send(response, 400, "invalid-name");
  if (!(await deleteMedia(profile.folder(DATA, login), name))) return send(response, 404, "not-found");
  console.log(`Media deleted by ${login}: ${name}`);
  json(response, { ok: true });
}

function spotifyLogin({ response, login, runtime }: Call) {
  if (!spotifyApp) return send(response, 409, "spotify-not-configured");
  if (!runtime?.spotify) return send(response, 409, "not-connected");
  const state = randomBytes(16).toString("hex");
  spotifyStates.add(state, login, Date.now());
  redirect(response, runtime.spotify.authorizeUrl(state));
}

// Kommt über die Spotify-Redirect-URL (lokal 127.0.0.1, ohne Cookie): der Login steht am state
async function spotifyCallback({ response, url }: Call) {
  const code = url.searchParams.get("code") ?? "";
  const login = spotifyStates.take(url.searchParams.get("state") ?? "", Date.now());
  const spotify = login && access.hasFeature(login, "music") ? runtimes.get(login)?.spotify : undefined;
  const connected = spotify && OAUTH_CODE.test(code) ? await spotify.connect(code) : false;
  // Zurück auf die Übersicht unter der normalen Adresse, dort liegt das Cookie
  redirect(response, connected ? `${PUBLIC_URL}/` : `${PUBLIC_URL}/?error=spotify-failed`);
}

// Konto, laufender Titel und Abfrage-Status für die Verbindungsseite; 409 ohne Spotify-Login
async function spotifyDetails({ response, runtime }: Call) {
  if (!runtime?.spotify?.connected()) return send(response, 409, "not-connected");
  json(response, await runtime.spotify.details());
}

// Auch ohne laufenden Spotify-Client (Musik aus, keine Laufzeit) wirklich trennen: spotify.json löschen
async function spotifyLogout({ response, login, runtime }: Call) {
  await runtime?.spotify?.logout();
  await deleteSpotifyTokens(profile.folder(DATA, login));
  json(response, { ok: true });
}

// Twitch trennen: Token widerrufen und löschen, Laufzeit stoppen, abmelden
async function twitchDisconnect({ response, login, runtime }: Call) {
  const folder = profile.folder(DATA, login);
  runtime?.stop();
  runtimes.delete(login);
  // Erst nach einer laufenden Token-Prüfung lesen: sie kann noch erneuerte Tokens gespeichert haben
  await runtime?.tokensIdle();
  const tokens = runtime?.tokens() ?? (await profile.loadTokens(folder));
  if (tokens) await twitch.revoke(tokens.access).catch((error: unknown) => console.error("Revoking a token failed:", error));
  await profile.deleteTokens(folder);
  console.log(`Twitch disconnected: ${login}`);
  response.setHeader("Set-Cookie", sessionCookie("", SECURE, 0));
  json(response, { ok: true });
}

// Dashboard: gewähltes Theme, gespeicherte Werte je Theme und die verfügbaren Themes
// canChat: darf der Twitch-Login in den Chat schreiben (false = neu verbinden, null = unbekannt)
async function helpConfig({ response, login, runtime }: Call) {
  json(response, { ...(await loadHelp(profile.folder(DATA, login))), canChat: runtime?.help.canChat() ?? null });
}

async function saveHelpConfig({ request, response, login, runtime }: Call) {
  const help = toHelpConfig(parseJson(String(await readBody(request, SETTINGS_LIMIT))));
  if (!help) return send(response, 400, "invalid-json");
  await saveHelp(profile.folder(DATA, login), help);
  runtime?.help.setConfig(help);
  json(response, help);
}

async function settings({ response, login }: Call) {
  const file = await loadSettings(profile.folder(DATA, login));
  json(response, { ...file, themes: THEMES.map(theme => ({ id: theme.id, name: theme.name })) });
}

// Theme wählen und dessen Werte speichern; der Server prüft gegen das Schema, Fehler kommen als Codes je Feld
async function saveSettingsRequest({ request, response, login }: Call) {
  const body = parseJson(String(await readBody(request, SETTINGS_LIMIT))) as { theme?: unknown; values?: unknown; choose?: unknown } | null | undefined;
  if (typeof body?.theme !== "string") return json(response, [{ key: "theme", code: "invalid_type" }], 400);
  const folder = profile.folder(DATA, login);
  // choose: false speichert nur die Werte (z.B. von der Render-Seite), das Overlay-Theme bleibt
  const result = updateSettings(await loadSettings(folder), body.theme, body.values ?? {}, body.choose !== false);
  if (!result.file) return json(response, result.errors, 400);
  await saveSettings(folder, result.file);
  const settings = publicSettings(result.file);
  // Offene Overlays übernehmen die Werte sofort, ohne Neuladen
  runtimes.get(login)?.broadcast({ type: "settings", settings });
  // Die Minimes gelten mit den neuen Regeln weiter (oder ruhen, wenn das Theme keine hat)
  runtimes.get(login)?.minimes?.setRules(minimeRules(result.file));
  json(response, settings);
}

async function saveAccess({ request, response }: Call) {
  const value = parseJson(String(await readBody(request, ACCESS_LIMIT)));
  if (typeof value !== "object" || value === null || Array.isArray(value)) return send(response, 400, "invalid-json");
  // access.save bringt alles auf gültige Werte (sanitize). Wer den Zugang verliert, dessen Laufzeit endet sofort;
  // alle anderen starten neu, damit geänderte Funktionsstufen gelten.
  const before = access.get();
  const saved = await access.save(value);
  const revoked = revokedLogins(before, saved, ADMINS, [...runtimes.keys()]);
  for (const login of revoked) {
    runtimes.get(login)?.stop();
    runtimes.delete(login);
    console.log(`Access revoked, runtime stopped: ${login}`);
  }
  await restartAll();
  json(response, saved);
}

// Alle Profile mit Zugang, Verbindung (Tokens), EventSub-Status und letzter Anmeldung
async function adminStreamers({ response }: Call) {
  const rows = await Promise.all((await profile.list(DATA)).map(async login => {
    const folder = profile.folder(DATA, login);
    return {
      login,
      allowed: access.canUse(login),
      admin: access.isAdmin(login),
      connected: (await profile.loadTokens(folder)) !== null,
      live: runtimes.get(login)?.live() ?? false,
      lastLogin: await profile.loadLastLogin(folder),
    };
  }));
  json(response, rows);
}

// --- Rendern (Stinger, Banner) -------------------------------------------------------------------
// Frames kommen als PNG vom Dashboard, ffmpeg (FFMPEG, sonst aus dem PATH; im Docker-Image per apk) baut das Ergebnis
// in DATA/streamers/<login>/render/.
const renderJobs = createRenderJobs(Date.now);
const FFMPEG = process.env.FFMPEG ?? "ffmpeg";
const renderFolder = (login: string) => join(profile.folder(DATA, login), "render");

async function renderStart({ response, url, login }: Call) {
  const clip = url.searchParams.get("clip") ?? "";
  if (!isClip(clip)) return send(response, 400, "unknown-clip");
  if (!access.hasFeature(login, CLIPS[clip].feature)) return send(response, 403, "feature-off");
  const busy = renderJobs.start(login, clip);
  if (busy) return send(response, 409, busy);
  const frames = join(renderFolder(login), "frames");
  await rm(frames, { recursive: true, force: true });
  await mkdir(frames, { recursive: true });
  json(response, { ok: true });
}

async function renderFrame({ request, response, url, login }: Call) {
  const index = Number(url.searchParams.get("i"));
  const body = await readBody(request, RENDER_LIMITS.frameBytes);
  const error = renderJobs.frame(login, index, body.length);
  if (error) return send(response, error === "render-not-started" ? 409 : 400, error);
  await writeFile(join(renderFolder(login), "frames", `${String(index).padStart(4, "0")}.png`), body);
  json(response, { ok: true });
}

async function renderDone({ response, url, login }: Call) {
  const job = renderJobs.finish(login, Number(url.searchParams.get("fps")));
  if (typeof job === "string") return send(response, job === "render-not-started" ? 409 : 400, job);
  const folder = renderFolder(login);
  const frames = join(folder, "frames");
  const [video, still] = outputNames(job.clip);
  const target = join(folder, video);
  const result = await runFfmpeg(ffmpegArgs(CLIPS[job.clip].format, job.fps, frames, target));
  // Standbild aus dem ersten Frame für Stellen, an denen Twitch kein animiertes GIF zeigt
  if (result === 0 && still) await copyFile(join(frames, "0000.png"), join(folder, still));
  await rm(frames, { recursive: true, force: true });
  if (result !== 0) return send(response, 500, result === "missing" ? "ffmpeg-missing" : "render-failed");
  const bytes = (await stat(target)).size;
  console.log(`Rendered ${video} for ${login}: ${job.frames} frames, ${bytes} bytes`);
  json(response, { files: outputNames(job.clip), bytes, tooLarge: CLIPS[job.clip].format === "gif" && bytes > RENDER_LIMITS.gifWarnBytes });
}

// Abbrechen vor dem Kodieren: Job freigeben und die bisherigen Frames löschen
async function renderCancel({ response, login }: Call) {
  renderJobs.cancel(login);
  await rm(join(renderFolder(login), "frames"), { recursive: true, force: true });
  json(response, { ok: true });
}

// Exit-Code von ffmpeg, "missing" wenn es nicht startet
function runFfmpeg(args: string[]): Promise<number | "missing"> {
  return new Promise(done => {
    const child = spawn(FFMPEG, args, { stdio: ["ignore", "ignore", "pipe"] });
    let log = "";
    child.stderr.on("data", (chunk: Buffer) => { log = (log + chunk.toString()).slice(-2000); });
    child.on("error", () => done("missing"));
    child.on("close", code => {
      if (code !== 0) console.error(`ffmpeg failed (${code ?? "?"}): ${log}`);
      done(code ?? 1);
    });
  });
}

// Fertige Dateien des Streamers mit Grösse
async function renderFiles({ response, login }: Call) {
  const folder = renderFolder(login);
  const names = (await readdir(folder).catch(() => [] as string[])).filter(isOutputName).sort();
  json(response, await Promise.all(names.map(async name => ({ name, size: (await stat(join(folder, name))).size }))));
}

function renderFile({ response, url, login }: Call) {
  const name = url.searchParams.get("name") ?? "";
  if (!isOutputName(name)) return send(response, 400, "invalid-name");
  response.setHeader("Content-Disposition", `attachment; filename="${name}"`);
  return serveStatic(response, renderFolder(login), `/${name}`, true);
}

// Jede Route aus ROUTES hat genau einen Handler (der Typ erzwingt es)
const HANDLERS: Record<RouteKey, Handler> = {
  "GET /auth/login": twitchLogin,
  "GET /auth/callback": twitchCallback,
  "POST /auth/logout": logout,
  "GET /spotify/callback": spotifyCallback,
  "GET /api/me": me,
  "POST /api/test": testAlert,
  "GET /api/triggers/config": triggerConfig,
  "POST /api/triggers/config": saveTriggerConfig,
  "GET /api/triggers": triggerList,
  "POST /api/trigger": fireTrigger,
  "GET /api/media": mediaList,
  "POST /api/media": uploadMedia,
  "DELETE /api/media": removeMedia,
  "GET /spotify/login": spotifyLogin,
  "GET /api/spotify": spotifyDetails,
  "POST /spotify/logout": spotifyLogout,
  "POST /api/twitch/disconnect": twitchDisconnect,
  "GET /api/commands": helpConfig,
  "POST /api/commands": saveHelpConfig,
  "GET /api/settings": settings,
  "POST /api/settings": saveSettingsRequest,
  "POST /api/render/start": renderStart,
  "POST /api/render/frame": renderFrame,
  "POST /api/render/done": renderDone,
  "POST /api/render/cancel": renderCancel,
  "GET /api/render/files": renderFiles,
  "GET /api/render/file": renderFile,
  "GET /api/admin/access": ({ response }) => json(response, access.get()),
  "POST /api/admin/access": saveAccess,
  "GET /api/admin/streamers": adminStreamers,
};

// Login aus dem Cookie, und was er darf (Regel 26: nie aus der Anfrage selbst)
function visitor(request: IncomingMessage): Visitor {
  const login = readSession(sessionKey, cookies(request).sid);
  if (!login) return { login: null, allowed: false, admin: false, features: {} };
  return { login, allowed: access.canUse(login), admin: access.isAdmin(login), features: access.features(login) };
}

async function route(request: IncomingMessage, response: ServerResponse) {
  const url = new URL(request.url ?? "/", PUBLIC_URL);
  const method = request.method ?? "GET";
  // Schreibende Anfragen (POST, DELETE) von fremden Webseiten abweisen
  if (method !== "GET" && method !== "HEAD" && !sameOrigin(request)) return send(response, 403, "cross-origin");
  const key = find(method, url.pathname);
  if (key === "method-not-allowed") return send(response, 405, "method-not-allowed");
  if (key) {
    const caller = visitor(request);
    const decision = authorize(ROUTES[key], caller);
    if (decision !== "ok") return send(response, decision === "unauthorized" ? 401 : 403, decision);
    const login = caller.login ?? "";
    return HANDLERS[key]({ request, response, url, login, runtime: runtimes.get(login) });
  }
  if (method !== "GET" && method !== "HEAD") return send(response, 404, "not-found");
  const path = streamerPath.parse(url.pathname);
  if (path) return overlay(request, response, path);
  // Dashboard und Werkzeuge (index.html mit #/triggers, #/stinger)
  return serveStatic(response, DIST, url.pathname === "/" ? "/index.html" : url.pathname);
}

// --- Start ------------------------------------------------------------------------------------
for (const login of await profile.list(DATA)) await startRuntime(login);

createServer((request, response) => {
  route(request, response).catch((error: unknown) => {
    const tooLarge = error instanceof Error && "status" in error && error.status === 413;
    if (!tooLarge) console.error("Request failed:", error);
    if (!response.headersSent) send(response, tooLarge ? 413 : 500, tooLarge ? "too-large" : "server-error");
  });
}).listen(PORT, () => console.log(`Overlay server on ${PUBLIC_URL} (${runtimes.size} streamers running)`));
