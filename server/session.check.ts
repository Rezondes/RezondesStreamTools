// Check for session.ts: signed session cookies. Runs with npm test.
import assert from "node:assert/strict";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createSession, isSecureUrl, loadSessionKey, oauthStateCookie, readSession, sessionCookie } from "./session.ts";

const key = "test-key";
const now = 1_800_000_000_000;
const value = createSession(key, "rezondes", now);

// A valid session returns the login
assert.equal(readSession(key, value, now + 1000), "rezondes");
// Expired after 30 days
assert.equal(readSession(key, value, now + 31 * 86_400_000), null);
// A foreign key, a changed login or garbage is rejected
assert.equal(readSession("other-key", value, now), null);
assert.equal(readSession(key, value.replace("rezondes", "admin"), now), null);
assert.equal(readSession(key, "kaputt", now), null);
assert.equal(readSession(key, undefined, now), null);

// Cookie: readable only via HTTP, Secure only with HTTPS
assert.match(sessionCookie(value, true), /HttpOnly; SameSite=Lax; Max-Age=\d+; Secure$/);
assert.doesNotMatch(sessionCookie(value, false), /Secure/);
// Behind Caddy with PUBLIC_URL=https://<DOMAIN>: Secure; locally with http: without
assert.match(sessionCookie(value, isSecureUrl("https://overlays.example.de")), /; Secure$/);
assert.doesNotMatch(sessionCookie(value, isSecureUrl("http://localhost:8089")), /Secure/);
// state of a started login: only for the callback, valid briefly; empty = delete
assert.equal(oauthStateCookie("s1", true), "oauth_state=s1; Path=/; HttpOnly; SameSite=Lax; Max-Age=600; Secure");
assert.equal(oauthStateCookie("", false, 0), "oauth_state=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0");

// Key: created on first start, the same afterwards (temporary folder, deleted afterwards)
const folder = await mkdtemp(join(tmpdir(), "session-"));
try {
  const first = await loadSessionKey(folder);
  assert.match(first, /^[0-9a-f]{64}$/);
  assert.equal(await loadSessionKey(folder), first);
} finally {
  await rm(folder, { recursive: true, force: true });
}

console.log("session ok");
