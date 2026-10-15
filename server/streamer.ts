// Laufzeit eines Streamers (Regel 29): besitzt alle Verbindungen seines Profils (EventSub, Chat-Listener mit
// Triggern, Spotify, SSE-Overlays) und beendet sie in stop(). Welche Teile laufen, sagen die Funktionsstufen.
// Prüft die Twitch-Tokens stündlich; ein ungültiger Login beendet die Laufzeit und löscht die Tokens.
// Gestartet und gestoppt von server/index.ts.
import type { IncomingMessage, ServerResponse } from "node:http";
import type { Alert, ServerMessage, Track } from "../src/core/types.ts";
import type { Feature } from "./access.ts";
import { chat } from "./chat.ts";
import { send } from "./http.ts";
import * as profile from "./profile.ts";
import { spotifyClient, type SpotifyApp } from "./spotify.ts";
import { startTriggers } from "./triggers.ts";
import { eventSub, type TwitchApp, type TwitchTokens } from "./twitch.ts";

export type StreamerSetup = {
  login: string;
  folder: string; // Profil-Ordner
  tokens: TwitchTokens;
  twitch: TwitchApp;
  spotify: SpotifyApp | null; // null = Spotify nicht eingerichtet
  features: Record<Feature, boolean>;
  onEnd: () => void; // Login ungültig geworden, die Laufzeit hat sich selbst beendet
};

// Obergrenze offener Overlays pro Streamer, damit niemand den Server mit Verbindungen füllt
const MAX_OVERLAYS = 50;

export async function startStreamer(setup: StreamerSetup) {
  const overlays = new Set<ServerResponse>();
  const emit = (message: ServerMessage) => {
    const line = `data: ${JSON.stringify(message)}\n\n`;
    for (const overlay of overlays) overlay.write(line);
  };
  const alert = (value: Alert) => {
    emit({ type: "alert", alert: value });
    console.log(`Alert ${value.kind} for ${setup.login}: ${value.user} (${overlays.size} overlays)`);
  };

  const tokens = tokenKeeper(setup, () => end());
  const events = setup.features.alerts ? eventSub(setup.twitch, tokens.valid, alert) : null;
  const triggers = setup.features.triggers && setup.features.fx ? startTriggers(setup.folder, event => emit({ type: "fx", event })) : null;
  // Der Server liest den Chat mit, damit Trigger auch ohne offenes Chat-Overlay laufen
  const stopChat = triggers ? chat(setup.login, line => triggers.handle(line)) : null;
  const spotify = setup.spotify && setup.features.music
    ? await spotifyClient(setup.spotify, setup.folder, track => emit({ type: "music", track }), () => overlays.size > 0)
    : null;
  // Kommentarzeile hält die Verbindung durch Proxys und OBS offen
  const ping = setInterval(() => { for (const overlay of overlays) overlay.write(": ping\n\n"); }, 25_000);
  events?.start();

  let stopped = false;
  function stop() {
    if (stopped) return;
    stopped = true;
    clearInterval(ping);
    tokens.stop();
    events?.stop();
    stopChat?.();
    triggers?.stop();
    spotify?.stop();
    for (const overlay of overlays) overlay.end();
    overlays.clear();
  }

  async function end() {
    if (stopped) return;
    console.error(`Twitch login of ${setup.login} is no longer valid, please reconnect`);
    stop();
    await profile.deleteTokens(setup.folder);
    setup.onEnd();
  }

  return {
    login: setup.login,
    triggers,
    spotify,
    alert,
    // Nachricht an alle offenen Overlays, z.B. geänderte Einstellungen
    broadcast: emit,
    stop,
    live: () => events?.live() ?? false,
    tokens: tokens.current,
    // Neues Overlay (SSE)
    attach(request: IncomingMessage, response: ServerResponse) {
      if (stopped || overlays.size >= MAX_OVERLAYS) return send(response, 503, "unavailable");
      openStream(response, spotify?.current() ?? null);
      overlays.add(response);
      request.on("close", () => overlays.delete(response));
    },
  };
}

// Antwort als Server-Sent Events öffnen und sofort mit dem laufenden Titel versorgen
function openStream(response: ServerResponse, track: Track | null) {
  response.writeHead(200, { "Content-Type": "text/event-stream", "Cache-Control": "no-cache", Connection: "keep-alive" });
  response.write(": connected\n\n");
  response.write(`data: ${JSON.stringify({ type: "music", track })}\n\n`);
}
export type Streamer = Awaited<ReturnType<typeof startStreamer>>;

// Hält die Twitch-Tokens aktuell: prüft sie stündlich und vor jedem EventSub-Abo, speichert erneuerte.
// onInvalid: Twitch hat den Login abgelehnt.
function tokenKeeper(setup: StreamerSetup, onInvalid: () => Promise<void>) {
  let tokens = setup.tokens;
  async function valid(): Promise<TwitchTokens | null> {
    const checked = await setup.twitch.validate(tokens);
    if (!checked) {
      await onInvalid();
      return null;
    }
    if (checked !== tokens) {
      tokens = checked;
      await profile.saveTokens(setup.folder, checked);
    }
    return checked;
  }
  // Twitch verlangt eine stündliche Prüfung
  const check = setInterval(() => { valid().catch((error: unknown) => console.error(`Token check for ${setup.login} failed:`, error)); }, 3_600_000);
  return { valid, current: () => tokens, stop: () => clearInterval(check) };
}
