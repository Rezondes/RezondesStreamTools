// Dashboard login: signed cookie "sid" = login.expiry.signature (HMAC-SHA256).
// The key is in data/session.key and is created on first start.
import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";

const DAYS = 30;

export async function loadSessionKey(dataDir: string) {
  const file = join(dataDir, "session.key");
  const existing = await readFile(file, "utf8").catch(() => "");
  if (existing.trim()) return existing.trim();
  const key = randomBytes(32).toString("hex");
  await writeFile(file, key, { mode: 0o600 });
  return key;
}

const sign = (key: string, data: string) => createHmac("sha256", key).update(data).digest("base64url");

export function createSession(key: string, login: string, now = Date.now()) {
  const data = `${login}.${now + DAYS * 86_400_000}`;
  return `${data}.${sign(key, data)}`;
}

// Returns the login, or null if the signature is wrong or expired
export function readSession(key: string, value: string | undefined, now = Date.now()): string | null {
  const parts = (value ?? "").split(".");
  if (parts.length !== 3) return null;
  const [login, exp, sig] = parts;
  const expected = Buffer.from(sign(key, `${login}.${exp}`));
  const given = Buffer.from(sig);
  if (given.length !== expected.length || !timingSafeEqual(given, expected)) return null;
  return Number(exp) > now ? login : null;
}

// Secure cookies only when the server is reachable publicly via HTTPS (PUBLIC_URL, e.g. behind Caddy)
export const isSecureUrl = (publicUrl: string) => publicUrl.startsWith("https://");

// state of a started OAuth login, only 10 minutes (see loginStates.ts sameBrowser); maxAge 0 deletes
export function oauthStateCookie(state: string, secure: boolean, maxAge = 600) {
  return `oauth_state=${state}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${maxAge}${secure ? "; Secure" : ""}`;
}

export function sessionCookie(value: string, secure: boolean, maxAge = DAYS * 86_400) {
  return `sid=${value}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${maxAge}${secure ? "; Secure" : ""}`;
}
