// Check for spotify.ts: redirect choice, tokens, track from the Spotify answer, progress, changes and the
// Spotify client of a streamer. fetch and timers are fakes, files are in a temporary folder
// that is deleted afterwards. Token values are placeholders. Runs with npm test.
import assert from "node:assert/strict";
import { mkdtemp, readFile, rm, stat, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { mock } from "node:test";
import type { Track } from "../src/core/types.ts";
import { REAL_PROVIDERS } from "./providers.ts";
import { callbackHasSession, changed, deleteSpotifyTokens, progressed, redirectUri, spotifyClient, toTokens, toTrack } from "./spotify.ts";

// Redirect: locally via 127.0.0.1 (Spotify rejects "localhost"), otherwise PUBLIC_URL
assert.equal(redirectUri("http://localhost:8089"), "http://127.0.0.1:8089/spotify/callback");
assert.equal(redirectUri("https://overlays.example.org/"), "https://overlays.example.org/spotify/callback");
// Publicly the callback arrives with the session cookie, locally (127.0.0.1 instead of localhost) without
assert.equal(callbackHasSession("https://overlays.example.org"), true);
assert.equal(callbackHasSession("http://localhost:8089"), false);

// Tokens: only complete ones with an expiry time
assert.deepEqual(toTokens({ access: "a", refresh: "r", expiresAt: 5, extra: 1 }), { access: "a", refresh: "r", expiresAt: 5 });
assert.equal(toTokens({ access: "a", refresh: "r" }), null);
assert.equal(toTokens(null), null);

// Track: songs with artists and album, podcast episodes with show and their own image, nothing = null
const song = toTrack({ is_playing: true, progress_ms: 1000, item: { id: "1", name: "Wake Up", duration_ms: 60_000, artists: [{ name: "RATM" }, { name: "Gast" }], album: { name: "Matrix", images: [{ url: "cover.jpg" }] } } });
assert.deepEqual(song, { id: "1", title: "Wake Up", artist: "RATM, Gast", album: "Matrix", cover: "cover.jpg", durationMs: 60_000, progressMs: 1000, playing: true });
assert.deepEqual(toTrack({ item: { uri: "episode:2", name: "Folge", show: { name: "Podcast" }, images: [] } }),
  { id: "episode:2", title: "Folge", artist: "Podcast", album: "Podcast", cover: null, durationMs: 0, progressMs: 0, playing: false });
assert.equal(toTrack({ item: null }), null);

// Progress only moves on while playing and never past the end
const track: Track = { id: "1", title: "t", artist: "a", album: "b", cover: null, durationMs: 10_000, progressMs: 2000, playing: true };
assert.equal(progressed(track, 1000, 4000)?.progressMs, 5000);
assert.equal(progressed(track, 0, 60_000)?.progressMs, 10_000);
assert.equal(progressed({ ...track, playing: false }, 0, 60_000)?.progressMs, 2000);
assert.equal(progressed(null, 0, 0), null);

// Change: different track, play/pause, seeked or a switch between track and silence
assert.ok(!changed(null, null));
assert.ok(changed(null, track));
assert.ok(changed(track, null));
assert.ok(!changed(track, { ...track, progressMs: 4000 }));
assert.ok(changed(track, { ...track, progressMs: 6000 }));
assert.ok(changed(track, { ...track, id: "2" }));
assert.ok(changed(track, { ...track, playing: false }));

// --- Client of a streamer ---
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
  const app = { clientId: "id", clientSecret: "secret", redirectUri: "http://127.0.0.1:8089/spotify/callback", accountsUrl: REAL_PROVIDERS.spotifyAccounts, apiUrl: REAL_PROVIDERS.spotifyApi };
  const client = await spotifyClient(app, folder, next => emitted.push(next), () => listening);

  // Without spotify.json not connected; login URL with state and redirect
  assert.equal(client.connected(), false);
  const authorize = new URL(client.authorizeUrl("state-1"));
  assert.equal(authorize.searchParams.get("state"), "state-1");
  assert.equal(authorize.searchParams.get("redirect_uri"), app.redirectUri);

  // Connect: invalid code = false, a valid one saves the tokens (readable only by the server)
  answers = { [TOKEN_URL]: [{ status: 400 }, { status: 200, body: { access_token: "a1", refresh_token: "r1", expires_in: 3600 } }] };
  assert.equal(await client.connect("wrong"), false);
  assert.equal(await client.connect("code"), true);
  assert.equal(client.connected(), true);
  assert.equal(toTokens(JSON.parse(await readFile(join(folder, "spotify.json"), "utf8")))?.refresh, "r1");
  if (process.platform !== "win32") assert.equal((await stat(join(folder, "spotify.json"))).mode & 0o777, 0o600);

  // Details: account from /v1/me (error = null and ask again next time, afterwards from memory), track, polling
  answers = { [ME_URL]: [{ status: 500 }, { status: 200, body: { id: "neo", display_name: "Neo" } }] };
  assert.deepEqual(await client.details(), { account: null, track: null, polling: true });
  assert.deepEqual(await client.details(), { account: "Neo", track: null, polling: true });
  listening = false;
  assert.deepEqual(await client.details(), { account: "Neo", track: null, polling: false });
  listening = true;

  // Polling every 3 s: a new track is sent, the same state is not, silence as null
  answers = { [PLAYING_URL]: [playing, playing, { status: 204 }] };
  for (let round = 0; round < 3; round += 1) {
    mock.timers.tick(3000);
    await settle();
  }
  assert.deepEqual(emitted.map(next => next?.title ?? null), ["Wake Up", null]);
  assert.equal(client.current(), null);

  // Without an open overlay no polling
  listening = false;
  const before = requestCount;
  mock.timers.tick(3000);
  assert.equal(requestCount, before);
  listening = true;

  // 429: pause according to retry-after
  answers = { [PLAYING_URL]: [{ status: 429, headers: { "retry-after": "10" } }] };
  mock.timers.tick(3000);
  await settle();
  mock.timers.tick(3000);
  assert.equal(requestCount, before + 1);

  // 401 and a rejected refresh (after the pause): logged out, overlays get null
  answers = { [PLAYING_URL]: [{ status: 401 }], [TOKEN_URL]: [{ status: 400 }] };
  for (let round = 0; round < 3; round += 1) {
    mock.timers.tick(3000);
    await settle();
  }
  assert.equal(client.connected(), false);
  assert.equal(emitted.at(-1), null);
  // Logging out deletes spotify.json
  await client.logout();
  await assert.rejects(stat(join(folder, "spotify.json")));
  // Without login no request and no account
  assert.deepEqual(await client.details(), { account: null, track: null, polling: true });
  client.stop();
} finally {
  mock.timers.reset();
  await rm(folder, { recursive: true, force: true });
}

// Logging out without a running client deletes spotify.json anyway
const orphan = await mkdtemp(join(tmpdir(), "spotify-"));
await writeFile(join(orphan, "spotify.json"), JSON.stringify({ access: "a", refresh: "r", expiresAt: 1 }));
await deleteSpotifyTokens(orphan);
await assert.rejects(stat(join(orphan, "spotify.json")));
await deleteSpotifyTokens(orphan);
await rm(orphan, { recursive: true, force: true });

// Logging out while a renewal runs: the late answer does not create spotify.json again
const late = await mkdtemp(join(tmpdir(), "spotify-"));
try {
  await writeFile(join(late, "spotify.json"), JSON.stringify({ access: "a1", refresh: "r1", expiresAt: 1 }));
  let answerToken: () => void = () => {};
  answers = {
    [TOKEN_URL]: [{ status: 200, body: { access_token: "a2", refresh_token: "r2", expires_in: 3600 }, wait: new Promise<void>(resolve => { answerToken = resolve; }) }],
    [ME_URL]: [{ status: 200, body: { id: "neo" } }],
  };
  const app = { clientId: "id", clientSecret: "secret", redirectUri: "http://127.0.0.1:8089/spotify/callback", accountsUrl: REAL_PROVIDERS.spotifyAccounts, apiUrl: REAL_PROVIDERS.spotifyApi };
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
