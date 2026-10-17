// Overlay server for multiple streamers: routing and startup only. No dependencies, runs directly on Node 24
// (TypeScript is stripped at startup): npm run server (reads server.env) or in the Docker container.
// Public: overlays under /s/<login>/... (scenes, status, events via SSE, media). Dashboard: login via Twitch,
// APIs with the login from the session cookie (rule 26). Who may do what is in routes.ts and access.ts.
import { createServer, type IncomingMessage, type ServerResponse } from "node:http";
import { mkdir, stat } from "node:fs/promises";
import { join, resolve } from "node:path";
import { randomBytes } from "node:crypto";
import * as streamerPath from "../src/core/streamerPath.ts";
import { loadAccess, revokedLogins, type Feature } from "./access.ts";
import { loadHelp, publicCommands, saveHelp, toHelpConfig } from "./commands.ts";
import { cookies, json, readBody, redirect, sameOrigin, send, serveStatic } from "./http.ts";
import { createLoginStates, sameBrowser } from "./loginStates.ts";
import { deleteMedia, listMedia, storeMedia, uploadSlots } from "./media.ts";
import { overlayKeys } from "./overlayKeys.ts";
import { renderRoutes } from "./renderRoutes.ts";
import { runtimeRegistry } from "./runtimeRegistry.ts";
import * as profile from "./profile.ts";
import { ensureSettings, loadSettings, minimeRules, publicSettings, saveSettings, updateSettings } from "./settings.ts";
import { THEMES } from "../src/themes/registry.ts";
import { authorize, find, overlayRoute, ROUTES, type RouteKey, type Visitor } from "./routes.ts";
import { createSession, isSecureUrl, loadSessionKey, oauthStateCookie, readSession, sessionCookie } from "./session.ts";
import { callbackHasSession, deleteSpotifyTokens, redirectUri, type SpotifyApp } from "./spotify.ts";
import { startStreamer, type Streamer } from "./streamer.ts";
import { isAlertKind, SAMPLE_ALERTS, twitchApp } from "./twitch.ts";
import { providerUrls } from "./providers.ts";

// --- Settings from server.env ----------------------------------------------------------------
const PORT = Number(process.env.PORT ?? 8080);
const PUBLIC_URL = (process.env.PUBLIC_URL ?? `http://localhost:${PORT}`).replace(/\/+$/, "");
const DIST = resolve(process.env.DIST ?? "dist");
const DATA = resolve(process.env.DATA ?? "data");
const ADMINS = (process.env.ADMINS ?? "").split(",").map(login => login.trim().toLowerCase()).filter(streamerPath.isLogin);
const SECURE = isSecureUrl(PUBLIC_URL);
const PUBLIC_HOST = new URL(PUBLIC_URL).host;
const SPOTIFY_NEEDS_SESSION = callbackHasSession(PUBLIC_URL);
const TWITCH_CLIENT_ID = process.env.TWITCH_CLIENT_ID ?? "";
const TWITCH_CLIENT_SECRET = process.env.TWITCH_CLIENT_SECRET ?? "";
const SPOTIFY_CLIENT_ID = process.env.SPOTIFY_CLIENT_ID ?? "";
const SPOTIFY_CLIENT_SECRET = process.env.SPOTIFY_CLIENT_SECRET ?? "";

const MEDIA_LIMIT = 50 * 1024 * 1024;
// Storage for all media of a streamer together (MEDIA_LIMIT_MB, default 200 MB)
const MEDIA_QUOTA = (Number(process.env.MEDIA_LIMIT_MB) || 200) * 1024 * 1024;
const TRIGGER_LIMIT = 1024 * 1024;
const ACCESS_LIMIT = 64 * 1024;
const SETTINGS_LIMIT = 512 * 1024;
// Codes from the OAuth callback (Twitch, Spotify)
const OAUTH_CODE = /^[\w.~-]{1,1024}$/;

if (!TWITCH_CLIENT_ID || !TWITCH_CLIENT_SECRET) {
  console.error("TWITCH_CLIENT_ID and TWITCH_CLIENT_SECRET are missing (see server.env.example)");
  process.exit(1);
}
if (ADMINS.length === 0) console.warn("ADMINS is empty: nobody can manage access (see server.env.example)");

const PROVIDERS = providerUrls(process.env);
const twitch = twitchApp(TWITCH_CLIENT_ID, TWITCH_CLIENT_SECRET, `${PUBLIC_URL}/auth/callback`, PROVIDERS);
const spotifyApp: SpotifyApp | null = SPOTIFY_CLIENT_ID && SPOTIFY_CLIENT_SECRET
  ? { clientId: SPOTIFY_CLIENT_ID, clientSecret: SPOTIFY_CLIENT_SECRET, redirectUri: redirectUri(PUBLIC_URL), accountsUrl: PROVIDERS.spotifyAccounts, apiUrl: PROVIDERS.spotifyApi }
  : null;

await mkdir(DATA, { recursive: true });
const access = await loadAccess(DATA, ADMINS);
const sessionKey = await loadSessionKey(DATA);
// Pending logins: Twitch only needs the state, Spotify also remembers the login
const twitchStates = createLoginStates<true>(600_000, 1000);
const spotifyStates = createLoginStates<string>(600_000, 1000);
const mediaUploads = uploadSlots();
const keys = overlayKeys(login => profile.folder(DATA, login));

// --- Runtimes ---------------------------------------------------------------------------------
const runtimes = runtimeRegistry<Streamer>();

// (Re)start when the login is enabled and has tokens; otherwise only stop. runtimeRegistry resolves simultaneous
// starts and a lock during startup
function startRuntime(login: string): Promise<Streamer | null> {
  return runtimes.start(login, async () => {
    const folder = profile.folder(DATA, login);
    const tokens = access.canUse(login) ? await profile.loadTokens(folder) : null;
    if (!tokens) return null;
    const runtime: Streamer = await startStreamer({
      login, folder, tokens, twitch, spotify: spotifyApp, features: access.features(login), minimeRules: minimeRules(await loadSettings(folder)), link: `${PUBLIC_URL}/s/${login}/`,
      onEnd: () => runtimes.ended(login, runtime),
    });
    return runtime;
  }, () => access.canUse(login));
}

// After changed access or feature levels: restart all runtimes, the overlays reconnect on their own
async function restartAll() {
  runtimes.stopAll();
  for (const login of await profile.list(DATA)) await startRuntime(login);
}

// spotify in the status: null = not set up or feature off, otherwise whether it is connected
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
    case "events": return events(request, response, path.login, runtime);
    case "commands": return json(response, await publicCommands(folder, path.login, access.features(path.login)));
    case "scene": return serveStatic(response, DIST, `/${route.file}`);
    case "media": return serveStatic(response, join(folder, "media"), `/${route.file}`, true);
  }
}

// Live stream: overlays only with the secret overlay key (?key=), the event log in the dashboard (?log, does not
// count as an open overlay) only with the session of the same streamer. Strangers cannot take up slots this way.
async function events(request: IncomingMessage, response: ServerResponse, login: string, runtime: Streamer | undefined) {
  if (!runtime) return send(response, 404, "not-running");
  const query = new URL(request.url ?? "/", "http://x").searchParams;
  const watcher = query.has("log");
  const allowed = watcher ? readSession(sessionKey, cookies(request).sid) === login : await keys.matches(login, query.get("key") ?? "");
  if (!allowed) return send(response, 403, "forbidden");
  runtime.attach(request, response, watcher);
}

// --- Dashboard and login ---------------------------------------------------------------------
// A request to a route from ROUTES. login: from the cookie, possibly empty for public routes.
type Call = { request: IncomingMessage; response: ServerResponse; url: URL; login: string; runtime: Streamer | undefined };
type Handler = (call: Call) => Promise<void> | void;

// JSON from a body; undefined for broken JSON
function parseJson(text: string): unknown {
  try {
    return JSON.parse(text);
  } catch {
    // The caller answers with 400
    return undefined;
  }
}

// The state cookie must be on the host Twitch redirects back to (PUBLIC_URL)
function twitchLogin({ request, response }: Call) {
  if (request.headers.host !== PUBLIC_HOST) return redirect(response, `${PUBLIC_URL}/auth/login`);
  const state = randomBytes(16).toString("hex");
  twitchStates.add(state, true, Date.now());
  redirect(response, twitch.authorizeUrl(state), { "Set-Cookie": oauthStateCookie(state, SECURE) });
}

// Exchange tokens, check access, save, start the runtime, set the session.
// Errors go as a code (?error=) to the dashboard, which shows the text for it (rule 20).
async function twitchCallback({ request, response, url }: Call) {
  const code = url.searchParams.get("code") ?? "";
  const state = url.searchParams.get("state") ?? "";
  // Only in the browser that started the login (login CSRF); the state cookie is valid once
  response.setHeader("Set-Cookie", oauthStateCookie("", SECURE, 0));
  const stateValid = sameBrowser(cookies(request).oauth_state, state) && twitchStates.take(state, Date.now()) !== null;
  const tokens = stateValid && OAUTH_CODE.test(code) ? await twitch.exchange(code) : null;
  if (!tokens) return redirect(response, "/?error=login-failed");
  if (!access.canUse(tokens.login)) {
    // Not enabled: save nothing, revoke the token right away
    await twitch.revoke(tokens.access).catch((error: unknown) => console.error("Revoking a token failed:", error));
    console.log(`Login refused, not on the allowlist: ${tokens.login}`);
    return redirect(response, "/?error=not-allowed");
  }
  const folder = profile.folder(DATA, tokens.login);
  if (await profile.ownedByOther(folder, tokens.userId)) {
    // Same name, different Twitch account (name reassigned after a rename): do not inherit profile and access
    await twitch.revoke(tokens.access).catch((error: unknown) => console.error("Revoking a token failed:", error));
    console.log(`Login refused, profile ${tokens.login} belongs to another Twitch account`);
    return redirect(response, "/?error=account-changed");
  }
  await profile.saveTokens(folder, tokens);
  await profile.saveLogin(folder, Date.now(), tokens.userId);
  // First login: channel name, logo etc. of the themes with the own login instead of the samples (before the runtime starts)
  if (await ensureSettings(folder, tokens.login)) console.log(`Settings created for ${tokens.login}`);
  await startRuntime(tokens.login);
  console.log(`Twitch login: ${tokens.login}`);
  redirect(response, "/", { "Set-Cookie": [oauthStateCookie("", SECURE, 0), sessionCookie(createSession(sessionKey, tokens.login), SECURE)] });
}

// Log out: delete the cookie, the runtime (overlays) keeps running
function logout({ response }: Call) {
  response.setHeader("Set-Cookie", sessionCookie("", SECURE, 0));
  json(response, { ok: true });
}

// theme: the active theme; the dashboard looks like it (skin)
async function me({ response, login, runtime }: Call) {
  const features = access.features(login);
  const { theme } = await loadSettings(profile.folder(DATA, login));
  json(response, { login, admin: access.isAdmin(login), live: runtime?.live() ?? false, spotify: spotifyStatus(features, runtime), features, theme, overlayKey: await keys.get(login) });
}

// New overlay key (e.g. when an OBS URL got into the wrong hands); the restart disconnects all overlays
async function rotateOverlayKey({ response, login }: Call) {
  const overlayKey = await keys.rotate(login);
  await startRuntime(login);
  json(response, { overlayKey });
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

// From the editor: the server checks the rules; on errors the file stays unchanged
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

// Media with size and the triggers that use them, plus used and allowed storage
async function mediaList({ response, login }: Call) {
  json(response, await listMedia(profile.folder(DATA, login), MEDIA_QUOTA));
}

async function uploadMedia({ request, response, url, login }: Call) {
  const name = url.searchParams.get("name") ?? "";
  if (!streamerPath.isMediaName(name)) return send(response, 400, "invalid-name");
  if (!mediaUploads.take(login)) return send(response, 409, "upload-busy");
  try {
    const error = await storeMedia(profile.folder(DATA, login), name, await readBody(request, MEDIA_LIMIT), MEDIA_QUOTA);
    if (error) return send(response, 413, error);
    console.log(`Media uploaded by ${login}: ${name}`);
    json(response, { ok: true, name });
  } finally {
    mediaUploads.release(login);
  }
}

// Deletes only in the own media folder and only valid names
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

// Arrives via the Spotify redirect URL (locally 127.0.0.1, without cookie): the login is tied to the state
async function spotifyCallback({ request, response, url }: Call) {
  const code = url.searchParams.get("code") ?? "";
  const login = spotifyStates.take(url.searchParams.get("state") ?? "", Date.now());
  // Public: only in the browser of the streamer who started the connection (otherwise a foreign Spotify account gets attached)
  const ownBrowser = !SPOTIFY_NEEDS_SESSION || (login !== null && readSession(sessionKey, cookies(request).sid) === login);
  const spotify = login && ownBrowser && access.hasFeature(login, "music") ? runtimes.get(login)?.spotify : undefined;
  const connected = spotify && OAUTH_CODE.test(code) ? await spotify.connect(code) : false;
  // Back to the overview under the normal URL, the cookie is there
  redirect(response, connected ? `${PUBLIC_URL}/` : `${PUBLIC_URL}/?error=spotify-failed`);
}

// Account, current track and polling status for the connection page; 409 without Spotify login
async function spotifyDetails({ response, runtime }: Call) {
  if (!runtime?.spotify?.connected()) return send(response, 409, "not-connected");
  json(response, await runtime.spotify.details());
}

// Really disconnect even without a running Spotify client (music off, no runtime): delete spotify.json
async function spotifyLogout({ response, login, runtime }: Call) {
  await runtime?.spotify?.logout();
  await deleteSpotifyTokens(profile.folder(DATA, login));
  json(response, { ok: true });
}

// Disconnect Twitch: revoke and delete the token, stop the runtime, log out
async function twitchDisconnect({ response, login, runtime }: Call) {
  const folder = profile.folder(DATA, login);
  runtimes.stop(login);
  // Read only after a running token check: it may still have saved renewed tokens
  await runtime?.tokensIdle();
  const tokens = runtime?.tokens() ?? (await profile.loadTokens(folder));
  if (tokens) await twitch.revoke(tokens.access).catch((error: unknown) => console.error("Revoking a token failed:", error));
  await profile.deleteTokens(folder);
  console.log(`Twitch disconnected: ${login}`);
  response.setHeader("Set-Cookie", sessionCookie("", SECURE, 0));
  json(response, { ok: true });
}

// Dashboard: chosen theme, saved values per theme and the available themes
// canChat: may the Twitch login write to chat (false = reconnect, null = unknown)
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

// Choose a theme and save its values; the server checks against the schema, errors come as codes per field
async function saveSettingsRequest({ request, response, login }: Call) {
  const body = parseJson(String(await readBody(request, SETTINGS_LIMIT))) as { theme?: unknown; values?: unknown; choose?: unknown } | null | undefined;
  if (typeof body?.theme !== "string") return json(response, [{ key: "theme", code: "invalid_type" }], 400);
  const folder = profile.folder(DATA, login);
  // choose: false only saves the values (e.g. from the render page), the overlay theme stays
  const result = updateSettings(await loadSettings(folder), body.theme, body.values ?? {}, body.choose !== false);
  if (!result.file) return json(response, result.errors, 400);
  await saveSettings(folder, result.file);
  const settings = publicSettings(result.file);
  // Open overlays take over the values immediately, without reloading
  runtimes.get(login)?.broadcast({ type: "settings", settings });
  // The minimes continue with the new rules (or rest if the theme has none)
  runtimes.get(login)?.minimes?.setRules(minimeRules(result.file));
  json(response, settings);
}

async function saveAccess({ request, response }: Call) {
  const value = parseJson(String(await readBody(request, ACCESS_LIMIT)));
  if (typeof value !== "object" || value === null || Array.isArray(value)) return send(response, 400, "invalid-json");
  // access.save brings everything to valid values (sanitize). Whoever loses access, their runtime ends immediately;
  // all others restart so that changed feature levels apply.
  const before = access.get();
  const saved = await access.save(value);
  const revoked = revokedLogins(before, saved, ADMINS, runtimes.logins());
  for (const login of revoked) {
    runtimes.stop(login);
    console.log(`Access revoked, runtime stopped: ${login}`);
  }
  await restartAll();
  json(response, saved);
}

// All profiles with access, connection (tokens), EventSub status and last login
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

// --- Rendering (stinger, banners): handlers in renderRoutes.ts ----------------------------------
const render = renderRoutes(login => join(profile.folder(DATA, login), "render"), (login, feature) => access.hasFeature(login, feature));

// Every route from ROUTES has exactly one handler (the type enforces it)
const HANDLERS: Record<RouteKey, Handler> = {
  "GET /auth/login": twitchLogin,
  "GET /auth/callback": twitchCallback,
  "POST /auth/logout": logout,
  "GET /spotify/callback": spotifyCallback,
  "GET /api/me": me,
  "POST /api/overlay-key": rotateOverlayKey,
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
  "POST /api/render/start": render.start,
  "POST /api/render/frame": render.frame,
  "POST /api/render/done": render.done,
  "POST /api/render/cancel": render.cancel,
  "GET /api/render/files": render.files,
  "GET /api/render/file": render.file,
  "GET /api/admin/access": ({ response }) => json(response, access.get()),
  "POST /api/admin/access": saveAccess,
  "GET /api/admin/streamers": adminStreamers,
};

// Login from the cookie, and what it may do (rule 26: never from the request itself)
function visitor(request: IncomingMessage): Visitor {
  const login = readSession(sessionKey, cookies(request).sid);
  if (!login) return { login: null, allowed: false, admin: false, features: {} };
  return { login, allowed: access.canUse(login), admin: access.isAdmin(login), features: access.features(login) };
}

async function route(request: IncomingMessage, response: ServerResponse) {
  const url = new URL(request.url ?? "/", PUBLIC_URL);
  const method = request.method ?? "GET";
  // Reject writing requests (POST, DELETE) from foreign websites
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
  // Dashboard and tools (index.html with #/triggers, #/stinger)
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
}).listen(PORT, () => console.log(`Overlay server on ${PUBLIC_URL} (${runtimes.count()} streamers running)`));
