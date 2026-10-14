// Spotify "Now Playing": OAuth-Login, Token-Erneuerung und Abfrage des laufenden Titels.
// Die Abfrage läuft nur, solange mindestens ein Overlay verbunden ist.
import { readFile, rm, writeFile, mkdir } from "node:fs/promises";
import { join } from "node:path";
import { randomBytes } from "node:crypto";
import type { Track } from "../src/twitch.ts";

const CLIENT_ID = process.env.SPOTIFY_CLIENT_ID ?? "";
const CLIENT_SECRET = process.env.SPOTIFY_CLIENT_SECRET ?? "";
const SCOPES = "user-read-currently-playing user-read-playback-state";
const POLL_MS = 3000;

type Tokens = { access: string; refresh: string; expiresAt: number };
let tokens: Tokens | null = null;
let file = "";
let redirect = "";
const states = new Set<string>();

// Zuletzt gesendeter Stand. Die Overlays rechnen den Fortschritt selbst weiter.
let track: Track | null = null;
let sentAt = 0;
let blockedUntil = 0;

export const enabled = () => Boolean(CLIENT_ID && CLIENT_SECRET);
export const connected = () => tokens !== null;

// Aktueller Stand mit weitergerechnetem Fortschritt, z.B. für frisch verbundene Overlays
export function current(): Track | null {
  if (!track) return null;
  return { ...track, progressMs: track.playing ? Math.min(track.durationMs, track.progressMs + Date.now() - sentAt) : track.progressMs };
}

export async function init(publicUrl: string, dataDir: string, emit: (t: Track | null) => void, listening: () => boolean) {
  if (!enabled()) return;
  file = join(dataDir, "spotify.json");
  // Spotify erlaubt für lokale Redirects nur die Loopback-IP, nicht "localhost"
  const url = new URL(publicUrl);
  url.hostname = "127.0.0.1";
  redirect = `${url.origin}/spotify/callback`;
  tokens = await readFile(file, "utf8").then(JSON.parse).catch(() => null);

  setInterval(() => {
    if (!tokens || !listening() || Date.now() < blockedUntil) return;
    poll(emit).catch(e => console.error("Spotify:", e.message));
  }, POLL_MS);
}

export function loginUrl() {
  const state = randomBytes(16).toString("hex");
  states.add(state);
  setTimeout(() => states.delete(state), 600_000);
  const query = new URLSearchParams({ client_id: CLIENT_ID, response_type: "code", redirect_uri: redirect, scope: SCOPES, state });
  return `https://accounts.spotify.com/authorize?${query}`;
}

export async function callback(code: string | null, state: string | null) {
  if (!code || !states.delete(state ?? "")) return false;
  await save(await tokenRequest({ grant_type: "authorization_code", code, redirect_uri: redirect }));
  console.log("Spotify verbunden");
  return true;
}

export async function logout() {
  tokens = null;
  track = null;
  await rm(file, { force: true });
}

async function tokenRequest(body: Record<string, string>) {
  const res = await fetch("https://accounts.spotify.com/api/token", {
    method: "POST",
    headers: { Authorization: `Basic ${Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString("base64")}` },
    body: new URLSearchParams(body),
  });
  if (!res.ok) throw new Error(`Token-Anfrage fehlgeschlagen: ${res.status} ${await res.text()}`);
  return (await res.json()) as { access_token: string; refresh_token?: string; expires_in: number };
}

async function save(r: { access_token: string; refresh_token?: string; expires_in: number }) {
  // Beim Erneuern schickt Spotify nicht immer einen neuen Refresh-Token mit
  tokens = { access: r.access_token, refresh: r.refresh_token ?? tokens!.refresh, expiresAt: Date.now() + r.expires_in * 1000 };
  await mkdir(join(file, ".."), { recursive: true });
  await writeFile(file, JSON.stringify(tokens), { mode: 0o600 });
}

async function refresh() {
  try {
    await save(await tokenRequest({ grant_type: "refresh_token", refresh_token: tokens!.refresh }));
  } catch (e) {
    console.error("Spotify-Login abgelaufen, bitte neu verbinden:", e);
    await logout();
  }
}

async function poll(emit: (t: Track | null) => void) {
  if (Date.now() > tokens!.expiresAt - 60_000) await refresh();
  if (!tokens) return;
  const res = await fetch("https://api.spotify.com/v1/me/player/currently-playing?additional_types=episode", {
    headers: { Authorization: `Bearer ${tokens.access}` },
  });
  if (res.status === 429) {
    blockedUntil = Date.now() + Number(res.headers.get("retry-after") ?? 30) * 1000;
    return;
  }
  if (res.status === 401) return refresh();
  if (res.status !== 200 && res.status !== 204) throw new Error(`${res.status} ${await res.text()}`);

  const data = res.status === 200 ? await res.json() : null;
  const next = data?.item ? toTrack(data) : null;
  const before = current();
  // Nur Änderungen senden: anderer Titel, Play/Pause oder gespult (Abweichung > 3 s)
  const changed = !next !== !before
    || (next && before && (next.id !== before.id || next.playing !== before.playing || Math.abs(next.progressMs - before.progressMs) > 3000));
  if (!changed) return;
  track = next;
  sentAt = Date.now();
  emit(next);
}

// Songs haben artists und album, Podcast-Folgen show und eigene Bilder
function toTrack(data: any): Track {
  const item = data.item;
  return {
    id: item.id ?? item.uri,
    title: item.name,
    artist: item.artists?.map((a: { name: string }) => a.name).join(", ") ?? item.show?.name ?? "",
    album: item.album?.name ?? item.show?.name ?? "",
    cover: (item.album?.images ?? item.images)?.[0]?.url ?? null,
    durationMs: item.duration_ms,
    progressMs: data.progress_ms ?? 0,
    playing: Boolean(data.is_playing),
  };
}
