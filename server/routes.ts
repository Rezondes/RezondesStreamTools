// Routes of the server and who may call them (rule 26). Pure decisions without IO:
// ROUTES says per dashboard and login route who needs it; overlayRoute splits /s/<login>/<rest>.
// server/index.ts attaches a handler to every entry of ROUTES. Check: routes.check.ts.
import { isMediaName } from "../src/core/streamerPath.ts";
import { SCENES } from "../src/core/theme.ts";
import type { Feature } from "./access.ts";

// public: without login; session: login from the session cookie and enabled; admin: ADMINS only
type Guard = "public" | "session" | "admin";
// features: all must be on for the login
export type Route = { guard: Guard; features: readonly Feature[] };

const PUBLIC: Route = { guard: "public", features: [] };
const SESSION: Route = { guard: "session", features: [] };
const ADMIN: Route = { guard: "admin", features: [] };
// Chat listener, triggers and media belong to the levels triggers and fx
const TRIGGERS: Route = { guard: "session", features: ["triggers", "fx"] };

export const ROUTES = {
  "GET /auth/login": PUBLIC,
  "GET /auth/callback": PUBLIC,
  "POST /auth/logout": PUBLIC,
  // Spotify knows only one callback URL (locally via 127.0.0.1, where the cookie is missing): the login comes from the state
  "GET /spotify/callback": PUBLIC,
  "GET /api/me": SESSION,
  "POST /api/overlay-key": SESSION,
  "POST /api/test": { guard: "session", features: ["alerts"] },
  "GET /api/triggers/config": TRIGGERS,
  "POST /api/triggers/config": TRIGGERS,
  "GET /api/triggers": TRIGGERS,
  "POST /api/trigger": TRIGGERS,
  "GET /api/media": TRIGGERS,
  "POST /api/media": TRIGGERS,
  "DELETE /api/media": TRIGGERS,
  "GET /spotify/login": { guard: "session", features: ["music"] },
  "GET /api/spotify": { guard: "session", features: ["music"] },
  // Disconnecting stays possible even with the feature switched off
  "POST /spotify/logout": SESSION,
  "POST /api/twitch/disconnect": SESSION,
  // Help command in chat (list of commands), for every streamer
  "GET /api/commands": SESSION,
  "POST /api/commands": SESSION,
  // Theme and settings of the own profile
  "GET /api/settings": { guard: "session", features: ["themes"] },
  "POST /api/settings": { guard: "session", features: ["themes"] },
  // Rendering: stinger needs the feature stinger, banners the feature banners; the handler checks per clip
  "POST /api/render/start": SESSION,
  "POST /api/render/frame": SESSION,
  "POST /api/render/done": SESSION,
  "POST /api/render/cancel": SESSION,
  "GET /api/render/files": SESSION,
  "GET /api/render/file": SESSION,
  "GET /api/admin/access": ADMIN,
  "POST /api/admin/access": ADMIN,
  "GET /api/admin/streamers": ADMIN,
} as const satisfies Record<string, Route>;

export type RouteKey = keyof typeof ROUTES;

// Route for method and path: its key, "method-not-allowed" (path known, other method) or null (no route)
export function find(method: string, pathname: string): RouteKey | "method-not-allowed" | null {
  const key = `${method} ${pathname}`;
  if (Object.hasOwn(ROUTES, key)) return key as RouteKey;
  return Object.keys(ROUTES).some(known => known.endsWith(` ${pathname}`)) ? "method-not-allowed" : null;
}

// Who is asking: login from the session cookie (null = no valid session) and what the server knows about it
export type Visitor = { login: string | null; allowed: boolean; admin: boolean; features: Partial<Record<Feature, boolean>> };

// ok, or the code for the response: unauthorized = 401, all others 403
export type Decision = "ok" | "unauthorized" | "not-allowed" | "admin-only" | "feature-off";

export function authorize(route: Route, visitor: Visitor): Decision {
  if (route.guard === "public") return "ok";
  if (!visitor.login) return "unauthorized";
  if (!visitor.allowed) return "not-allowed";
  if (route.guard === "admin" && !visitor.admin) return "admin-only";
  return route.features.every(feature => visitor.features[feature] === true) ? "ok" : "feature-off";
}

// Public overlay URLs under /s/<login>/: status, settings, events, commands (list of chat commands), <scene> or <scene>.html, media/<file>
type OverlayRoute =
  | { kind: "status" }
  | { kind: "settings" }
  | { kind: "events" }
  | { kind: "commands" }
  | { kind: "scene"; file: string }
  | { kind: "media"; file: string };

// segments: the decoded path parts after /s/<login>/; null = no overlay URL (404)
export function overlayRoute(segments: string[]): OverlayRoute | null {
  const [first, second] = segments;
  // /s/<login>/ is the public commands page
  if (segments.length === 0 || (segments.length === 1 && first === "")) return { kind: "scene", file: "info.html" };
  if (segments.length === 1 && first === "status") return { kind: "status" };
  if (segments.length === 1 && first === "settings") return { kind: "settings" };
  if (segments.length === 1 && first === "events") return { kind: "events" };
  if (segments.length === 1 && first === "commands") return { kind: "commands" };
  // Scenes are named like their file in dist/ (alerts.html); index.html is the dashboard, not a scene
  if (segments.length === 1 && /^[a-z]+\.html$/.test(first) && first !== "index.html") return { kind: "scene", file: first };
  // Short URL without extension (/s/<login>/alerts), only for known scenes
  if (segments.length === 1 && (SCENES as readonly string[]).includes(first)) return { kind: "scene", file: `${first}.html` };
  if (segments.length === 2 && first === "media" && isMediaName(second)) return { kind: "media", file: second };
  return null;
}
