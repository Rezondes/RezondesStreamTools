// Runtime of a streamer (rule 29): owns all connections of its profile (EventSub, chat listener with
// triggers, minimes and help command, Spotify, SSE overlays) and ends them in stop(). The feature levels say which parts run.
// Checks the Twitch tokens hourly; an invalid login ends the runtime and deletes the tokens.
// Started and stopped by server/index.ts.
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
  folder: string; // profile folder
  tokens: TwitchTokens;
  twitch: TwitchApp;
  spotify: SpotifyApp | null; // null = Spotify not set up
  features: Record<Feature, boolean>;
  minimeRules: MinimeRules | null; // null = the chosen theme has no minimes
  onEnd: () => void; // login became invalid, the runtime ended itself
  link: string; // URL of the public commands page, for the reply to the help command
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
  const stopChat = listenToChat(setup.login, setup.twitch.urls.twitchIrc, triggers, minimes, help);
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
    // Message to all open overlays, e.g. changed settings
    broadcast: emit,
    stop,
    live: () => events?.live() ?? false,
    tokens: tokens.current,
    // After stop(): waits until no token check is running that could still write tokens.json
    tokensIdle: tokens.idle,
    // New overlay (SSE); watcher = event log in the dashboard instead of an overlay
    attach(request: IncomingMessage, response: ServerResponse, watcher = false) {
      if (stopped || hub.full()) return send(response, 503, "unavailable");
      openStream(response, spotify?.current() ?? null, minimes?.current() ?? null);
      hub.add(request, response, watcher);
    },
  };
}

// The server reads the chat along, so triggers, minimes and the help command run even without an open chat overlay
function listenToChat(login: string, ircUrl: string, triggers: ReturnType<typeof startTriggers> | null, minimes: MinimeRuntime | null, help: HelpRuntime) {
  return chat(login, line => {
    if (help.isEcho(line)) return;
    triggers?.handle(line);
    minimes?.handle(line);
    help.handle(line).catch((error: unknown) => console.error(`Help reply for ${login} failed:`, error));
  }, banned => minimes?.ban(banned), ircUrl);
}

// Help command with the saved setting; replies with valid tokens as the streamer. Whether the login may write,
// it asks Twitch once at startup
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
