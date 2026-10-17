// Laufzeit eines Streamers (Regel 29): besitzt alle Verbindungen seines Profils (EventSub, Chat-Listener mit
// Triggern, Minimes und Hilfe-Befehl, Spotify, SSE-Overlays) und beendet sie in stop(). Welche Teile laufen, sagen die Funktionsstufen.
// Prüft die Twitch-Tokens stündlich; ein ungültiger Login beendet die Laufzeit und löscht die Tokens.
// Gestartet und gestoppt von server/index.ts.
import type { IncomingMessage, ServerResponse } from "node:http";
import type { MinimeRules } from "../src/core/minimes.ts";
import type { Alert } from "../src/core/types.ts";
import type { Feature } from "./access.ts";
import { chat } from "./chat.ts";
import { loadHelp, publicCommands } from "./commands.ts";
import { startHelp, type HelpRuntime } from "./help.ts";
import { send } from "./http.ts";
import { startMinimes, type MinimeRuntime } from "./minimes.ts";
import * as profile from "./profile.ts";
import { spotifyClient, type SpotifyApp } from "./spotify.ts";
import { openStream, streamHub } from "./streamHub.ts";
import { tokenKeeper } from "./tokenKeeper.ts";
import { startTriggers } from "./triggers.ts";
import { eventSub, type TwitchApp, type TwitchTokens } from "./twitch.ts";

type StreamerSetup = {
  login: string;
  folder: string; // Profil-Ordner
  tokens: TwitchTokens;
  twitch: TwitchApp;
  spotify: SpotifyApp | null; // null = Spotify nicht eingerichtet
  features: Record<Feature, boolean>;
  minimeRules: MinimeRules | null; // null = das gewählte Theme hat keine Minimes
  onEnd: () => void; // Login ungültig geworden, die Laufzeit hat sich selbst beendet
  link: string; // Adresse der öffentlichen Befehlsseite, für die Antwort auf den Hilfe-Befehl
};

export async function startStreamer(setup: StreamerSetup) {
  const hub = streamHub();
  const emit = hub.emit;
  const alert = (value: Alert) => {
    emit({ type: "alert", alert: value });
    console.log(`Alert ${value.kind} for ${setup.login}: ${value.user} (${hub.overlayCount()} overlays)`);
  };

  const tokens = tokenKeeper({ login: setup.login, tokens: setup.tokens, twitch: setup.twitch, save: value => profile.saveTokens(setup.folder, value) }, () => end());
  const minimes = setup.features.minimes ? await startMinimes({ folder: setup.folder, emit, now: Date.now, rules: setup.minimeRules }) : null;
  const events = setup.features.alerts ? eventSub(setup.twitch, tokens.valid, alert, () => minimes?.offline()) : null;
  const triggers = setup.features.triggers && setup.features.fx ? startTriggers(setup.folder, event => emit({ type: "fx", event })) : null;
  const help = await helpFor(setup, tokens);
  const stopChat = listenToChat(setup.login, triggers, minimes, help);
  const spotify = setup.spotify && setup.features.music
    ? await spotifyClient(setup.spotify, setup.folder, track => emit({ type: "music", track }), () => hub.overlayCount() > 0)
    : null;
  events?.start();

  let stopped = false;
  function stop() {
    if (stopped) return;
    stopped = true;
    tokens.stop();
    events?.stop();
    stopChat?.();
    triggers?.stop();
    minimes?.stop().catch((error: unknown) => console.error(`Stopping minimes of ${setup.login} failed:`, error));
    spotify?.stop();
    hub.close();
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
    minimes,
    help,
    alert,
    // Nachricht an alle offenen Overlays, z.B. geänderte Einstellungen
    broadcast: emit,
    stop,
    live: () => events?.live() ?? false,
    tokens: tokens.current,
    // Nach stop(): wartet, bis keine Token-Prüfung mehr läuft, die tokens.json noch schreiben könnte
    tokensIdle: tokens.idle,
    // Neues Overlay (SSE); watcher = Ereignis-Protokoll im Dashboard statt Overlay
    attach(request: IncomingMessage, response: ServerResponse, watcher = false) {
      if (stopped || hub.full()) return send(response, 503, "unavailable");
      openStream(response, spotify?.current() ?? null, minimes?.current() ?? null);
      hub.add(request, response, watcher);
    },
  };
}

// Der Server liest den Chat mit, damit Trigger, Minimes und der Hilfe-Befehl auch ohne offenes Chat-Overlay laufen
function listenToChat(login: string, triggers: ReturnType<typeof startTriggers> | null, minimes: MinimeRuntime | null, help: HelpRuntime) {
  return chat(login, line => {
    if (help.isEcho(line)) return;
    triggers?.handle(line);
    minimes?.handle(line);
    help.handle(line).catch((error: unknown) => console.error(`Help reply for ${login} failed:`, error));
  }, banned => minimes?.ban(banned));
}

// Hilfe-Befehl mit der gespeicherten Einstellung; antwortet mit gültigen Tokens als Streamer. Ob der Login schreiben
// darf, fragt er einmal beim Start bei Twitch nach
async function helpFor(setup: StreamerSetup, tokens: ReturnType<typeof tokenKeeper>) {
  const help = startHelp({
    login: setup.login,
    help: await loadHelp(setup.folder),
    link: setup.link,
    now: Date.now,
    commands: () => publicCommands(setup.folder, setup.login, setup.features),
    say: async message => {
      const valid = await tokens.valid();
      return valid ? setup.twitch.say(valid, message) : "missing-scope";
    },
  });
  setup.twitch.canChat(tokens.current()).then(help.setCanChat).catch(() => {});
  return help;
}

export type Streamer = Awaited<ReturnType<typeof startStreamer>>;
