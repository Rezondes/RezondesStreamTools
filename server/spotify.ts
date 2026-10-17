// Spotify "Now Playing" pro Streamer: OAuth-Login, Token-Erneuerung und Abfrage des laufenden Titels.
// spotifyClient ist die Fabrik für die Laufzeit eines Streamers (Profil-Ordner, emit, "hört jemand zu");
// die Abfrage läuft nur, solange mindestens ein Overlay des Streamers verbunden ist. Welcher Streamer zu einem
// Login-state gehört, weiss der Router (Spotify kennt nur eine Callback-URL). Check: spotify.check.ts.
import { readFile, rm } from "node:fs/promises";
import { join } from "node:path";
import type { SpotifyDetails, Track } from "../src/core/types.ts";
import { writeAtomic } from "./atomicFile.ts";

// Die Spotify-App aus server.env; redirectUri aus redirectUri(PUBLIC_URL)
export type SpotifyApp = { clientId: string; clientSecret: string; redirectUri: string };
type SpotifyTokens = { access: string; refresh: string; expiresAt: number };
type TokenAnswer = { access_token?: string; refresh_token?: string; expires_in?: number };

const SCOPES = "user-read-currently-playing user-read-playback-state";
const PLAYING_URL = "https://api.spotify.com/v1/me/player/currently-playing?additional_types=episode";
const ME_URL = "https://api.spotify.com/v1/me";
const POLL_MS = 3000;

// Spotify erlaubt für lokale Redirects nur die Loopback-IP, nicht "localhost"; sonst gilt PUBLIC_URL
export function redirectUri(publicUrl: string) {
  const url = new URL(publicUrl);
  if (url.hostname === "localhost") url.hostname = "127.0.0.1";
  return `${url.origin}/spotify/callback`;
}

// Nur bekannte Felder mit gültigen Werten (Regel 25), sonst null
export function toTokens(value: unknown): SpotifyTokens | null {
  if (typeof value !== "object" || value === null) return null;
  const { access, refresh, expiresAt } = value as Record<string, unknown>;
  if (typeof access !== "string" || !access || typeof refresh !== "string" || !refresh || typeof expiresAt !== "number") return null;
  return { access, refresh, expiresAt };
}

// Die Felder der Spotify-Antwort, die toTrack liest
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

// Songs haben artists und album, Podcast-Folgen show und eigene Bilder. null = nichts läuft.
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

// Stand zum Zeitpunkt now: läuft der Titel, ist der Fortschritt seit sentAt weitergelaufen
export function progressed(track: Track | null, sentAt: number, now: number): Track | null {
  if (!track) return null;
  return { ...track, progressMs: track.playing ? Math.min(track.durationMs, track.progressMs + now - sentAt) : track.progressMs };
}

// Nur Änderungen senden: anderer Titel, Play/Pause, gespult (Abweichung > 3 s) oder Wechsel zwischen Titel und Stille
export function changed(before: Track | null, next: Track | null): boolean {
  if (!before || !next) return before !== next;
  return next.id !== before.id || next.playing !== before.playing || Math.abs(next.progressMs - before.progressMs) > 3000;
}

// Zustand eines Streamers
type Player = {
  app: SpotifyApp;
  file: string;
  emit: (track: Track | null) => void;
  tokens: SpotifyTokens | null;
  track: Track | null; // zuletzt gesendeter Stand
  sentAt: number;
  blockedUntil: number; // nach 429 (zu viele Anfragen) bis dahin Pause
  account: string | null; // Name des Spotify-Kontos, einmal geholt; null = noch unbekannt
  // Zählt Abmelden und Verbinden: eine Erneuerung, die vorher begann, darf danach nichts mehr speichern
  generation: number;
};

// Spotify eines Streamers. folder: Profil-Ordner (spotify.json), emit: an die Overlays, listening: ist ein Overlay offen
export async function spotifyClient(app: SpotifyApp, folder: string, emit: (track: Track | null) => void, listening: () => boolean) {
  const file = join(folder, "spotify.json");
  const player: Player = { app, file, emit, tokens: await loadTokens(file), track: null, sentAt: 0, blockedUntil: 0, account: null, generation: 0 };
  const timer = setInterval(() => {
    if (!player.tokens || !listening() || Date.now() < player.blockedUntil) return;
    poll(player).catch((error: unknown) => console.error("Spotify poll failed:", error instanceof Error ? error.message : error));
  }, POLL_MS);

  return {
    connected: () => player.tokens !== null,
    // Aktueller Stand mit weitergerechnetem Fortschritt, z.B. für frisch verbundene Overlays
    current: () => progressed(player.track, player.sentAt, Date.now()),
    async details(): Promise<SpotifyDetails> {
      if (player.tokens && !player.account) player.account = await loadAccount(player);
      return { account: player.account, track: progressed(player.track, player.sentAt, Date.now()), polling: listening() };
    },
    authorizeUrl(state: string) {
      const query = new URLSearchParams({ client_id: app.clientId, response_type: "code", redirect_uri: app.redirectUri, scope: SCOPES, state });
      return `https://accounts.spotify.com/authorize?${query}`;
    },
    // Code aus dem Callback eintauschen; false = Code ungültig
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

// Abmelden ohne laufenden Spotify-Client (Funktion Musik aus oder keine Laufzeit): spotify.json trotzdem löschen
export const deleteSpotifyTokens = (folder: string) => rm(join(folder, "spotify.json"), { force: true });

async function loadTokens(file: string) {
  try {
    return toTokens(JSON.parse(await readFile(file, "utf8")));
  } catch {
    // Fehlt oder kein JSON: nicht verbunden
    return null;
  }
}

// null = Code oder Refresh-Token ungültig (400, 401); andere Fehler werfen, damit ein Netzwerkproblem nie den Login löscht
async function requestToken(app: SpotifyApp, body: Record<string, string>): Promise<TokenAnswer | null> {
  const response = await fetch("https://accounts.spotify.com/api/token", {
    method: "POST",
    headers: { Authorization: `Basic ${Buffer.from(`${app.clientId}:${app.clientSecret}`).toString("base64")}` },
    body: new URLSearchParams(body),
  });
  if (response.status === 400 || response.status === 401) return null;
  if (!response.ok) throw new Error(`Spotify token request failed: ${response.status}`);
  return (await response.json()) as TokenAnswer;
}

async function save(player: Player, answer: TokenAnswer) {
  // Beim Erneuern schickt Spotify nicht immer einen neuen Refresh-Token mit
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
  // Inzwischen abgemeldet oder neu verbunden: die Antwort gehört zu einem alten Login
  if (generation !== player.generation) return;
  if (answer) return save(player, answer);
  console.error("Spotify login expired, please reconnect");
  await logout(player);
}

// Name des Kontos (Anzeigename, sonst die Spotify-ID); null bei jedem Fehler, die Details fragen dann später neu
async function loadAccount(player: Player): Promise<string | null> {
  try {
    if (player.tokens && Date.now() > player.tokens.expiresAt - 60_000) await refresh(player);
    if (!player.tokens) return null;
    const response = await fetch(ME_URL, { headers: { Authorization: `Bearer ${player.tokens.access}` } });
    if (!response.ok) return null;
    const answer = (await response.json()) as { id?: string; display_name?: string | null };
    return answer.display_name || answer.id || null;
  } catch {
    // Netzwerkfehler: Konto bleibt unbekannt
    return null;
  }
}

async function poll(player: Player) {
  if (player.tokens && Date.now() > player.tokens.expiresAt - 60_000) await refresh(player);
  if (!player.tokens) return;
  const response = await fetch(PLAYING_URL, { headers: { Authorization: `Bearer ${player.tokens.access}` } });
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
