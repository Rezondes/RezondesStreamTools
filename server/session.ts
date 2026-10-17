// Anmeldung im Dashboard: signiertes Cookie "sid" = login.ablauf.signatur (HMAC-SHA256).
// Der Schlüssel liegt in data/session.key und wird beim ersten Start erzeugt.
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

// Liefert den Login oder null, wenn Signatur falsch oder abgelaufen
export function readSession(key: string, value: string | undefined, now = Date.now()): string | null {
  const parts = (value ?? "").split(".");
  if (parts.length !== 3) return null;
  const [login, exp, sig] = parts;
  const expected = Buffer.from(sign(key, `${login}.${exp}`));
  const given = Buffer.from(sig);
  if (given.length !== expected.length || !timingSafeEqual(given, expected)) return null;
  return Number(exp) > now ? login : null;
}

// Secure-Cookies nur, wenn der Server öffentlich über HTTPS erreichbar ist (PUBLIC_URL, z.B. hinter Caddy)
export const isSecureUrl = (publicUrl: string) => publicUrl.startsWith("https://");

// state einer begonnenen OAuth-Anmeldung, nur 10 Minuten (siehe loginStates.ts sameBrowser); maxAge 0 löscht
export function oauthStateCookie(state: string, secure: boolean, maxAge = 600) {
  return `oauth_state=${state}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${maxAge}${secure ? "; Secure" : ""}`;
}

export function sessionCookie(value: string, secure: boolean, maxAge = DAYS * 86_400) {
  return `sid=${value}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${maxAge}${secure ? "; Secure" : ""}`;
}
