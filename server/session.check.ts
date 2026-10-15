// Check für session.ts: signierte Sitzungs-Cookies. Läuft mit npm test.
import assert from "node:assert/strict";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createSession, isSecureUrl, loadSessionKey, readSession, sessionCookie } from "./session.ts";

const key = "test-key";
const now = 1_800_000_000_000;
const value = createSession(key, "rezondes", now);

// Gültige Sitzung liefert den Login
assert.equal(readSession(key, value, now + 1000), "rezondes");
// Abgelaufen nach 30 Tagen
assert.equal(readSession(key, value, now + 31 * 86_400_000), null);
// Fremder Schlüssel, veränderter Login oder Müll werden abgelehnt
assert.equal(readSession("other-key", value, now), null);
assert.equal(readSession(key, value.replace("rezondes", "admin"), now), null);
assert.equal(readSession(key, "kaputt", now), null);
assert.equal(readSession(key, undefined, now), null);

// Cookie: nur per HTTP lesbar, Secure nur bei HTTPS
assert.match(sessionCookie(value, true), /HttpOnly; SameSite=Lax; Max-Age=\d+; Secure$/);
assert.doesNotMatch(sessionCookie(value, false), /Secure/);
// Hinter Caddy mit PUBLIC_URL=https://<DOMAIN>: Secure; lokal mit http: ohne
assert.match(sessionCookie(value, isSecureUrl("https://overlays.example.de")), /; Secure$/);
assert.doesNotMatch(sessionCookie(value, isSecureUrl("http://localhost:8089")), /Secure/);

// Schlüssel: beim ersten Start erzeugt, danach derselbe (temporärer Ordner, danach gelöscht)
const folder = await mkdtemp(join(tmpdir(), "session-"));
try {
  const first = await loadSessionKey(folder);
  assert.match(first, /^[0-9a-f]{64}$/);
  assert.equal(await loadSessionKey(folder), first);
} finally {
  await rm(folder, { recursive: true, force: true });
}

console.log("session ok");
