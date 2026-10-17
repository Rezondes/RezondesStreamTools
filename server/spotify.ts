// Spotify "Now Playing" per streamer: OAuth login, token renewal and polling of the current track.
// spotifyClient is the factory for a streamer's runtime (profile folder, emit, "is anyone listening");
// polling only runs while at least one overlay of the streamer is connected. Which streamer a login state
// belongs to is known by the router (Spotify knows only one callback URL). Check: spotify.check.ts.
import { readFile, rm } from "node:fs/promises";
import { join } from "node:path";
import type { SpotifyDetails, Track } from "../src/core/types.ts";
import { writeAtomic } from "./atomicFile.ts";

// The Spotify app from server.env; redirectUri from redirectUri(PUBLIC_URL), URLs from providerUrls (providers.ts)
export type SpotifyApp = { clientId: string; clientSecret: string; redirectUri: string; accountsUrl: string; apiUrl: string };
type SpotifyTokens = { access: string; refresh: string; expiresAt: number };
type TokenAnswer = { access_token?: string; refresh_token?: string; expires_in?: number };

const SCOPES = "user-read-currently-playing user-read-playback-state";
const POLL_MS = 3000;

// For local redirects Spotify only allows the loopback IP, not "localhost"; otherwise PUBLIC_URL applies
export function redirectUri(publicUrl: string) {
  const url = new URL(publicUrl);
  if (url.hostname === "localhost") url.hostname = "127.0.0.1";
  return `${url.origin}/spotify/callback`;
}

// If the Spotify callback arrives on the dashboard's host, it carries the session cookie: then the callback must
// come from the same streamer who started the connection. Locally (localhost -> 127.0.0.1) the cookie is missing.
export const callbackHasSession = (publicUrl: string) => new URL(redirectUri(publicUrl)).host === new URL(publicUrl).host;

// Only known fields with valid values (rule 25), otherwise null
export function toTokens(value: unknown): SpotifyTokens | null {
  if (typeof value !== "object" || value === null) return null;
  const { access, refresh, expiresAt } = value as Record<string, unknown>;
  if (typeof access !== "string" || !access || typeof refresh !== "string" || !refresh || typeof expiresAt !== "number") return null;
  return { access, refresh, expiresAt };
}

// The fields of the Spotify answer that toTrack reads
type SpotifyImage = { url?: string };
type PlayingAnswer = {
  is_playing?: boolean;
  progress_ms?: number | null;
  item?: {
    id?: string | null;
    uri?: string;
    name?: string;
    duration_ms?: number;
    artists?: { name?: string }[];
    album?: { name?: string; images?: SpotifyImage[] };
    show?: { name?: string };
    images?: SpotifyImage[];
  } | null;
};

// Songs have artists and album, podcast episodes have show and their own images. null = nothing is playing.
export function toTrack(answer: PlayingAnswer): Track | null {
  const item = answer.item;
  if (!item) return null;
  return {
    id: item.id ?? item.uri ?? "",
    title: item.name ?? "",
    artist: item.artists?.map(artist => artist.name ?? "").join(", ") ?? item.show?.name ?? "",
    album: item.album?.name ?? item.show?.name ?? "",
    cover: (item.album?.images ?? item.images)?.[0]?.url ?? null,
    durationMs: item.duration_ms ?? 0,
    progressMs: answer.progress_ms ?? 0,
    playing: Boolean(answer.is_playing),
  };
}

// State at time now: if the track is playing, the progress has moved on since sentAt
export function progressed(track: Track | null, sentAt: number, now: number): Track | null {
  if (!track) return null;
  return { ...track, progressMs: track.playing ? Math.min(track.durationMs, track.progressMs + now - sentAt) : track.progressMs };
}

// Only send changes: different track, play/pause, seeked (deviation > 3 s) or a switch between track and silence
export function changed(before: Track | null, next: Track | null): boolean {
  if (!before || !next) return before !== next;
  return next.id !== before.id || next.playing !== before.playing || Math.abs(next.progressMs - before.progressMs) > 3000;
}

// State of a streamer
type Player = {
  app: SpotifyApp;
  file: string;
  emit: (track: Track | null) => void;
  tokens: SpotifyTokens | null;
  track: Track | null; // last sent state
  sentAt: number;
  blockedUntil: number; // after 429 (too many requests) pause until then
  account: string | null; // name of the Spotify account, fetched once; null = not known yet
  // Counts logouts and connects: a renewal that started before must not save anything afterwards
  generation: number;
};

// Spotify of a streamer. folder: profile folder (spotify.json), emit: to the overlays, listening: is an overlay open
export async function spotifyClient(app: SpotifyApp, folder: string, emit: (track: Track | null) => void, listening: () => boolean) {
  const file = join(folder, "spotify.json");
  const player: Player = { app, file, emit, tokens: await loadTokens(file), track: null, sentAt: 0, blockedUntil: 0, account: null, generation: 0 };
  const timer = setInterval(() => {
    if (!player.tokens || !listening() || Date.now() < player.blockedUntil) return;
    poll(player).catch((error: unknown) => console.error("Spotify poll failed:", error instanceof Error ? error.message : error));
  }, POLL_MS);

  return {
    connected: () => player.tokens !== null,
    // Current state with progress moved on, e.g. for freshly connected overlays
    current: () => progressed(player.track, player.sentAt, Date.now()),
    async details(): Promise<SpotifyDetails> {
      if (player.tokens && !player.account) player.account = await loadAccount(player);
      return { account: player.account, track: progressed(player.track, player.sentAt, Date.now()), polling: listening() };
    },
    authorizeUrl(state: string) {
      const query = new URLSearchParams({ client_id: app.clientId, response_type: "code", redirect_uri: app.redirectUri, scope: SCOPES, state });
      return `${app.accountsUrl}/authorize?${query}`;
    },
    // Exchange the code from the callback; false = code invalid
    async connect(code: string) {
      const generation = ++player.generation;
      const answer = await requestToken(app, { grant_type: "authorization_code", code, redirect_uri: app.redirectUri });
      if (answer && generation === player.generation) {
        player.account = null;
        await save(player, answer);
      }
      return answer !== null;
    },
    logout: () => logout(player),
    stop: () => clearInterval(timer),
  };
}

// Log out without a running Spotify client (music feature off or no runtime): delete spotify.json anyway
export const deleteSpotifyTokens = (folder: string) => rm(join(folder, "spotify.json"), { force: true });

async function loadTokens(file: string) {
  try {
    return toTokens(JSON.parse(await readFile(file, "utf8")));
  } catch {
    // Missing or not JSON: not connected
    return null;
  }
}

// null = code or refresh token invalid (400, 401); other errors throw, so a network problem never deletes the login
async function requestToken(app: SpotifyApp, body: Record<string, string>): Promise<TokenAnswer | null> {
  const response = await fetch(`${app.accountsUrl}/api/token`, {
    method: "POST",
    headers: { Authorization: `Basic ${Buffer.from(`${app.clientId}:${app.clientSecret}`).toString("base64")}` },
    body: new URLSearchParams(body),
  });
  if (response.status === 400 || response.status === 401) return null;
  if (!response.ok) throw new Error(`Spotify token request failed: ${response.status}`);
  return (await response.json()) as TokenAnswer;
}

async function save(player: Player, answer: TokenAnswer) {
  // On renewal Spotify does not always send a new refresh token
  const tokens = toTokens({ access: answer.access_token, refresh: answer.refresh_token ?? player.tokens?.refresh, expiresAt: Date.now() + (answer.expires_in ?? 3600) * 1000 });
  if (!tokens) throw new Error("Spotify sent incomplete tokens");
  player.tokens = tokens;
  await writeAtomic(player.file, JSON.stringify(tokens), 0o600);
}

async function logout(player: Player) {
  player.generation += 1;
  player.tokens = null;
  player.track = null;
  player.account = null;
  player.emit(null);
  await rm(player.file, { force: true });
}

async function refresh(player: Player) {
  const generation = player.generation;
  const answer = player.tokens ? await requestToken(player.app, { grant_type: "refresh_token", refresh_token: player.tokens.refresh }) : null;
  // Logged out or reconnected meanwhile: the answer belongs to an old login
  if (generation !== player.generation) return;
  if (answer) return save(player, answer);
  console.error("Spotify login expired, please reconnect");
  await logout(player);
}

// Name of the account (display name, otherwise the Spotify ID); null on any error, the details ask again later
async function loadAccount(player: Player): Promise<string | null> {
  try {
    if (player.tokens && Date.now() > player.tokens.expiresAt - 60_000) await refresh(player);
    if (!player.tokens) return null;
    const response = await fetch(`${player.app.apiUrl}/me`, { headers: { Authorization: `Bearer ${player.tokens.access}` } });
    if (!response.ok) return null;
    const answer = (await response.json()) as { id?: string; display_name?: string | null };
    return answer.display_name || answer.id || null;
  } catch {
    // Network error: the account stays unknown
    return null;
  }
}

async function poll(player: Player) {
  if (player.tokens && Date.now() > player.tokens.expiresAt - 60_000) await refresh(player);
  if (!player.tokens) return;
  const response = await fetch(`${player.app.apiUrl}/me/player/currently-playing?additional_types=episode`, { headers: { Authorization: `Bearer ${player.tokens.access}` } });
  if (response.status === 429) {
    player.blockedUntil = Date.now() + (Number(response.headers.get("retry-after")) || 30) * 1000;
    return;
  }
  if (response.status === 401) return refresh(player);
  if (response.status !== 200 && response.status !== 204) throw new Error(`Spotify answered ${response.status}`);
  const next = response.status === 200 ? toTrack((await response.json()) as PlayingAnswer) : null;
  if (!changed(progressed(player.track, player.sentAt, Date.now()), next)) return;
  player.track = next;
  player.sentAt = Date.now();
  player.emit(next);
}
