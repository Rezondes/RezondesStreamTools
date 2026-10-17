// Client side of the contract tests: requests against the server under test, the Twitch login through the fake
// provider and assertions on status and shape. Every case gets one Context; sessions stay between cases.
import type { FakeProviders } from "./fakeProviders.ts";
import { shapeErrors, type Shape } from "./shape.ts";

export type Context = {
  base: string;
  fake: FakeProviders;
  // Cookie header "sid=..." per login, filled by login()
  sessions: Map<string, string>;
  // Values that later cases need (e.g. the overlay key)
  memory: Map<string, string>;
};

export type Case = { name: string; run: (context: Context) => Promise<void> };

type Init = { method?: string; session?: string; headers?: Record<string, string>; body?: BodyInit; duplex?: "half" };

export function request(context: Context, path: string, init: Init = {}) {
  const method = init.method ?? "GET";
  // Browsers send Origin with every writing request; a case may set a foreign one
  const origin: Record<string, string> = method === "GET" || method === "HEAD" ? {} : { Origin: context.base };
  const headers: Record<string, string> = { ...origin, ...init.headers };
  if (init.session) headers.Cookie = context.sessions.get(init.session) ?? "";
  return fetch(`${context.base}${path}`, { method, headers, body: init.body, redirect: "manual", duplex: init.duplex } as RequestInit);
}

export function fail(message: string): never {
  throw new Error(message);
}

// Status must match; with a shape the body must be JSON of that shape. Returns the parsed body (or the text).
export async function expect(response: Response, status: number, shape?: Shape): Promise<unknown> {
  const text = await response.text();
  if (response.status !== status) fail(`expected status ${status}, got ${response.status}: ${text.slice(0, 200)}`);
  if (shape === undefined) return text;
  let body: unknown;
  try {
    body = JSON.parse(text);
  } catch {
    fail(`expected JSON, got: ${text.slice(0, 200)}`);
  }
  const errors = shapeErrors(shape, body);
  if (errors.length) fail(`shape: ${errors.join("; ")}`);
  return body;
}

// Error answers are plain text with the code
export async function expectCode(response: Response, status: number, code: string) {
  const text = await expect(response, status);
  if (text !== code) fail(`expected code ${code}, got ${String(text)}`);
}

// Redirect target of a 302
export function location(response: Response) {
  if (response.status !== 302) fail(`expected redirect, got ${response.status}`);
  return response.headers.get("location") ?? fail("redirect without Location");
}

// "name=value" of a Set-Cookie header
export function cookie(response: Response, name: string) {
  const found = response.headers.getSetCookie().find(header => header.startsWith(`${name}=`));
  return found?.split(";")[0] ?? null;
}

// Starts the OAuth login and returns the callback answer (302); the session cookie is stored for later cases
export async function login(context: Context, login: string, id: string) {
  const start = await request(context, "/auth/login");
  const state = new URL(location(start)).searchParams.get("state") ?? fail("authorize URL without state");
  const stateCookie = cookie(start, "oauth_state") ?? fail("login without oauth_state cookie");
  const callback = await request(context, `/auth/callback?code=code-${login}-${id}&state=${state}`, { headers: { Cookie: stateCookie } });
  const sid = cookie(callback, "sid");
  if (sid && sid !== "sid=") context.sessions.set(login, sid);
  return callback;
}

// Admin changes access: allowlist and feature levels (all others "all")
export async function setAccess(context: Context, allowlist: string[], features: Record<string, string> = {}) {
  const body = JSON.stringify({ registration: "allowlist", allowlist, beta: [], features });
  await expect(await request(context, "/api/admin/access", { method: "POST", session: "rezondes", body }), 200, { allowlist: ["string"] });
}

export const ADMIN = { login: "rezondes", id: "1" };
export const STREAMER = { login: "neo", id: "7" };
export const STRANGER = { login: "smith", id: "9" };
