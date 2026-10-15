// Routen des Servers und wer sie aufrufen darf (Regel 26). Reine Entscheidungen ohne IO:
// ROUTES sagt pro Dashboard- und Anmelde-Route, wer sie braucht; overlayRoute zerlegt /s/<login>/<rest>.
// server/index.ts hängt an jeden Eintrag von ROUTES einen Handler. Check: routes.check.ts.
import { isMediaName } from "../src/core/streamerPath.ts";
import type { Feature } from "./access.ts";

// public: ohne Anmeldung; session: Login aus dem Sitzungs-Cookie und freigeschaltet; admin: nur ADMINS
export type Guard = "public" | "session" | "admin";
// features: alle müssen für den Login an sein
export type Route = { guard: Guard; features: readonly Feature[] };

const PUBLIC: Route = { guard: "public", features: [] };
const SESSION: Route = { guard: "session", features: [] };
const ADMIN: Route = { guard: "admin", features: [] };
// Chat-Listener, Trigger und Medien gehören zu den Stufen triggers und fx
const TRIGGERS: Route = { guard: "session", features: ["triggers", "fx"] };

export const ROUTES = {
  "GET /auth/login": PUBLIC,
  "GET /auth/callback": PUBLIC,
  "POST /auth/logout": PUBLIC,
  // Spotify kennt nur eine Callback-URL (lokal über 127.0.0.1, dort fehlt das Cookie): der Login kommt aus dem state
  "GET /spotify/callback": PUBLIC,
  "GET /api/me": SESSION,
  "POST /api/test": { guard: "session", features: ["alerts"] },
  "GET /api/triggers/config": TRIGGERS,
  "POST /api/triggers/config": TRIGGERS,
  "GET /api/triggers": TRIGGERS,
  "POST /api/trigger": TRIGGERS,
  "GET /api/media": TRIGGERS,
  "POST /api/media": TRIGGERS,
  "GET /spotify/login": { guard: "session", features: ["music"] },
  // Trennen bleibt auch bei abgeschalteter Funktion möglich
  "POST /spotify/logout": SESSION,
  "POST /api/twitch/disconnect": SESSION,
  "GET /api/admin/access": ADMIN,
  "POST /api/admin/access": ADMIN,
} as const satisfies Record<string, Route>;

export type RouteKey = keyof typeof ROUTES;

// Route zu Methode und Pfad: ihr Schlüssel, "method-not-allowed" (Pfad bekannt, andere Methode) oder null (keine Route)
export function find(method: string, pathname: string): RouteKey | "method-not-allowed" | null {
  const key = `${method} ${pathname}`;
  if (Object.hasOwn(ROUTES, key)) return key as RouteKey;
  return Object.keys(ROUTES).some(known => known.endsWith(` ${pathname}`)) ? "method-not-allowed" : null;
}

// Wer anfragt: Login aus dem Sitzungs-Cookie (null = keine gültige Sitzung) und was der Server über ihn weiss
export type Visitor = { login: string | null; allowed: boolean; admin: boolean; features: Partial<Record<Feature, boolean>> };

// ok, oder der Code für die Antwort: unauthorized = 401, alle anderen 403
export type Decision = "ok" | "unauthorized" | "not-allowed" | "admin-only" | "feature-off";

export function authorize(route: Route, visitor: Visitor): Decision {
  if (route.guard === "public") return "ok";
  if (!visitor.login) return "unauthorized";
  if (!visitor.allowed) return "not-allowed";
  if (route.guard === "admin" && !visitor.admin) return "admin-only";
  return route.features.every(feature => visitor.features[feature] === true) ? "ok" : "feature-off";
}

// Öffentliche Overlay-Adressen unter /s/<login>/: status, events, <szene>.html, media/<datei>
export type OverlayRoute =
  | { kind: "status" }
  | { kind: "events" }
  | { kind: "scene"; file: string }
  | { kind: "media"; file: string };

// segments: die dekodierten Pfadteile nach /s/<login>/; null = keine Overlay-Adresse (404)
export function overlayRoute(segments: string[]): OverlayRoute | null {
  const [first, second] = segments;
  if (segments.length === 1 && first === "status") return { kind: "status" };
  if (segments.length === 1 && first === "events") return { kind: "events" };
  // Szenen heissen wie ihre Datei in dist/ (alerts.html); index.html ist das Dashboard, keine Szene
  if (segments.length === 1 && /^[a-z]+\.html$/.test(first) && first !== "index.html") return { kind: "scene", file: first };
  if (segments.length === 2 && first === "media" && isMediaName(second)) return { kind: "media", file: second };
  return null;
}
