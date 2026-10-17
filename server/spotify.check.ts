// Check für spotify.ts: Redirect-Wahl, Tokens, Titel aus der Spotify-Antwort, Fortschritt, Änderungen und der
// Spotify-Client eines Streamers. fetch und Timer sind nachgebaut, Dateien liegen in einem temporären Ordner,
// der danach gelöscht wird. Token-Werte sind Platzhalter. Läuft mit npm test.
import assert from "node:assert/strict";
import { mkdtemp, readFile, rm, stat, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { mock } from "node:test";
import type { Track } from "../src/core/types.ts";
import { callbackHasSession, changed, deleteSpotifyTokens, progressed, redirectUri, spotifyClient, toTokens, toTrack } from "./spotify.ts";

// Redirect: lokal über 127.0.0.1 (Spotify lehnt "localhost" ab), sonst PUBLIC_URL
assert.equal(redirectUri("http://localhost:8089"), "http://127.0.0.1:8089/spotify/callback");
assert.equal(redirectUri("https://overlays.example.org/"), "https://overlays.example.org/spotify/callback");
// Öffentlich kommt der Callback mit Sitzungs-Cookie an, lokal (127.0.0.1 statt localhost) ohne
assert.equal(callbackHasSession("https://overlays.example.org"), true);
assert.equal(callbackHasSession("http://localhost:8089"), false);

// Tokens: nur vollständige mit Ablaufzeit
assert.deepEqual(toTokens({ access: "a", refresh: "r", expiresAt: 5, extra: 1 }), { access: "a", refresh: "r", expiresAt: 5 });
assert.equal(toTokens({ access: "a", refresh: "r" }), null);
assert.equal(toTokens(null), null);

// Titel: Songs mit Interpreten und Album, Podcast-Folgen mit Show und eigenem Bild, nichts = null
const song = toTrack({ is_playing: true, progress_ms: 1000, item: { id: "1", name: "Wake Up", duration_ms: 60_000, artists: [{ name: "RATM" }, { name: "Gast" }], album: { name: "Matrix", images: [{ url: "cover.jpg" }] } } });
assert.deepEqual(song, { id: "1", title: "Wake Up", artist: "RATM, Gast", album: "Matrix", cover: "cover.jpg", durationMs: 60_000, progressMs: 1000, playing: true });
assert.deepEqual(toTrack({ item: { uri: "episode:2", name: "Folge", show: { name: "Podcast" }, images: [] } }),
  { id: "episode:2", title: "Folge", artist: "Podcast", album: "Podcast", cover: null, durationMs: 0, progressMs: 0, playing: false });
assert.equal(toTrack({ item: null }), null);

// Fortschritt läuft nur beim Abspielen weiter und nie über das Ende
const track: Track = { id: "1", title: "t", artist: "a", album: "b", cover: null, durationMs: 10_000, progressMs: 2000, playing: true };
assert.equal(progressed(track, 1000, 4000)?.progressMs, 5000);
assert.equal(progressed(track, 0, 60_000)?.progressMs, 10_000);
assert.equal(progressed({ ...track, playing: false }, 0, 60_000)?.progressMs, 2000);
assert.equal(progressed(null, 0, 0), null);

// Änderung: anderer Titel, Play/Pause, gespult oder Wechsel zwischen Titel und Stille
assert.ok(!changed(null, null));
assert.ok(changed(null, track));
assert.ok(changed(track, null));
assert.ok(!changed(track, { ...track, progressMs: 4000 }));
assert.ok(changed(track, { ...track, progressMs: 6000 }));
assert.ok(changed(track, { ...track, id: "2" }));
assert.ok(changed(track, { ...track, playing: false }));

// --- Client eines Streamers ---
type Answer = { status: number; body?: unknown; headers?: Record<string, string>; wait?: Promise<void> };
let answers: Record<string, Answer[]> = {};
let requestCount = 0;
globalThis.fetch = (async (url: string) => {
  requestCount += 1;
  const prefix = Object.keys(answers).find(start => url.startsWith(start));
  const answer = prefix ? answers[prefix].shift() : undefined;
  if (!answer) throw new Error(`unexpected request ${url}`);
  await answer.wait;
  const body = answer.status === 204 ? null : JSON.stringify(answer.body ?? {});
  return new Response(body, { status: answer.status, headers: answer.headers });
}) as typeof fetch;
const TOKEN_URL = "https://accounts.spotify.com/api/token";
const PLAYING_URL = "https://api.spotify.com/v1/me/player/currently-playing";
const ME_URL = "https://api.spotify.com/v1/me";
const playing = { status: 200, body: { is_playing: true, progress_ms: 0, item: { id: "1", name: "Wake Up", duration_ms: 60_000 } } };
const settle = () => new Promise(resolve => setImmediate(resolve));

const folder = await mkdtemp(join(tmpdir(), "spotify-"));
mock.timers.enable({ apis: ["setInterval", "Date"], now: 1_800_000_000_000 });
try {
  const emitted: (Track | null)[] = [];
  let listening = true;
  const app = { clientId: "id", clientSecret: "secret", redirectUri: "http://127.0.0.1:8089/spotify/callback" };
  const client = await spotifyClient(app, folder, next => emitted.push(next), () => listening);

  // Ohne spotify.json nicht verbunden; Anmelde-URL mit state und Redirect
  assert.equal(client.connected(), false);
  const authorize = new URL(client.authorizeUrl("state-1"));
  assert.equal(authorize.searchParams.get("state"), "state-1");
  assert.equal(authorize.searchParams.get("redirect_uri"), app.redirectUri);

  // Verbinden: ungültiger Code = false, gültiger speichert die Tokens (nur für den Server lesbar)
  answers = { [TOKEN_URL]: [{ status: 400 }, { status: 200, body: { access_token: "a1", refresh_token: "r1", expires_in: 3600 } }] };
  assert.equal(await client.connect("falsch"), false);
  assert.equal(await client.connect("code"), true);
  assert.equal(client.connected(), true);
  assert.equal(toTokens(JSON.parse(await readFile(join(folder, "spotify.json"), "utf8")))?.refresh, "r1");
  if (process.platform !== "win32") assert.equal((await stat(join(folder, "spotify.json"))).mode & 0o777, 0o600);

  // Details: Konto von /v1/me (Fehler = null und beim nächsten Mal neu fragen, danach aus dem Speicher), Titel, Abfrage
  answers = { [ME_URL]: [{ status: 500 }, { status: 200, body: { id: "neo", display_name: "Neo" } }] };
  assert.deepEqual(await client.details(), { account: null, track: null, polling: true });
  assert.deepEqual(await client.details(), { account: "Neo", track: null, polling: true });
  listening = false;
  assert.deepEqual(await client.details(), { account: "Neo", track: null, polling: false });
  listening = true;

  // Abfrage alle 3 s: neuer Titel wird gesendet, gleicher Stand nicht, Stille als null
  answers = { [PLAYING_URL]: [playing, playing, { status: 204 }] };
  for (let round = 0; round < 3; round += 1) {
    mock.timers.tick(3000);
    await settle();
  }
  assert.deepEqual(emitted.map(next => next?.title ?? null), ["Wake Up", null]);
  assert.equal(client.current(), null);

  // Ohne offenes Overlay keine Abfrage
  listening = false;
  const before = requestCount;
  mock.timers.tick(3000);
  assert.equal(requestCount, before);
  listening = true;

  // 429: Pause laut retry-after
  answers = { [PLAYING_URL]: [{ status: 429, headers: { "retry-after": "10" } }] };
  mock.timers.tick(3000);
  await settle();
  mock.timers.tick(3000);
  assert.equal(requestCount, before + 1);

  // 401 und abgelehnter Refresh (nach der Pause): abgemeldet, Overlays bekommen null
  answers = { [PLAYING_URL]: [{ status: 401 }], [TOKEN_URL]: [{ status: 400 }] };
  for (let round = 0; round < 3; round += 1) {
    mock.timers.tick(3000);
    await settle();
  }
  assert.equal(client.connected(), false);
  assert.equal(emitted.at(-1), null);
  // Abmelden löscht spotify.json
  await client.logout();
  await assert.rejects(stat(join(folder, "spotify.json")));
  // Ohne Login keine Anfrage und kein Konto
  assert.deepEqual(await client.details(), { account: null, track: null, polling: true });
  client.stop();
} finally {
  mock.timers.reset();
  await rm(folder, { recursive: true, force: true });
}

// Abmelden ohne laufenden Client löscht spotify.json trotzdem
const orphan = await mkdtemp(join(tmpdir(), "spotify-"));
await writeFile(join(orphan, "spotify.json"), JSON.stringify({ access: "a", refresh: "r", expiresAt: 1 }));
await deleteSpotifyTokens(orphan);
await assert.rejects(stat(join(orphan, "spotify.json")));
await deleteSpotifyTokens(orphan);
await rm(orphan, { recursive: true, force: true });

// Abmelden, während eine Erneuerung läuft: die späte Antwort legt spotify.json nicht wieder an
const late = await mkdtemp(join(tmpdir(), "spotify-"));
try {
  await writeFile(join(late, "spotify.json"), JSON.stringify({ access: "a1", refresh: "r1", expiresAt: 1 }));
  let answerToken: () => void = () => {};
  answers = {
    [TOKEN_URL]: [{ status: 200, body: { access_token: "a2", refresh_token: "r2", expires_in: 3600 }, wait: new Promise<void>(resolve => { answerToken = resolve; }) }],
    [ME_URL]: [{ status: 200, body: { id: "neo" } }],
  };
  const app = { clientId: "id", clientSecret: "secret", redirectUri: "http://127.0.0.1:8089/spotify/callback" };
  const client = await spotifyClient(app, late, () => {}, () => false);
  const details = client.details();
  await settle();
  await client.logout();
  answerToken();
  await details;
  assert.equal(client.connected(), false);
  await assert.rejects(stat(join(late, "spotify.json")));
  client.stop();
} finally {
  await rm(late, { recursive: true, force: true });
}

console.log("spotify ok");
