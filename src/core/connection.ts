// Connection of an overlay page (used only by the hooks in core/hooks, rule 16):
// - Streamer: from the path /s/<login>/<scene>.html, in Vite (npm run dev) from ?s=<login>
// - Chat: always an anonymous IRC login (no token needed), channel = streamer (or ?channel=)
// - Alerts with server: via server-sent events from /s/<login>/events, incl. follows, channel points and hype train
// - Alerts without server or without a running runtime: subs, resubs, gifts, raids, bits from IRC
// - ?demo in the URL: creates fake events for testing without a stream
import { loadEmotes } from "./emotes.ts";
import { anonymousLogin, IRC_URL, parseIrc } from "./irc.ts";
import { toIrcEvents } from "./ircEvents.ts";
import { params } from "./params.ts";
import * as streamerPath from "./streamerPath.ts";
import { demo } from "./demo.ts";
import type { CommandList } from "./commands.ts";
import type { Alert, ChatMessage, ChatRemoval, FxEvent, Minime, PublicSettings, ServerMessage, ServerStatus, Track } from "./types.ts";

export type Handlers = {
  chat?: (message: ChatMessage) => void;
  alert?: (alert: Alert) => void;
  music?: (track: Track | null) => void;
  fx?: (event: FxEvent) => void;
  remove?: (removal: ChatRemoval) => void;
  settings?: (settings: PublicSettings) => void;
  minimes?: (minimes: Minime[]) => void;
  minimeChat?: (login: string) => void;
};

// Login of the streamer whose overlay this is; null without /s/<login>/ and without a valid ?s=
const loginFromQuery = (params.get("s") ?? "").toLowerCase();
export const streamer = streamerPath.parse(location.pathname)?.login ?? (streamerPath.isLogin(loginFromQuery) ? loginFromQuery : null);

// File from the streamer's media folder (/s/<login>/media/); full URLs and pages without a streamer unchanged
export const mediaUrl = (name: string) => (/^https?:\/\//.test(name) || !streamer ? name : `${streamerPath.base(streamer)}/media/${encodeURIComponent(name)}`);

const channel = (params.get("channel") ?? streamer ?? String(import.meta.env.VITE_TWITCH_CHANNEL ?? "")).toLowerCase().replace(/^#/, "");

// null = no streamer, no server reachable or streamer unknown there
async function serverStatus(): Promise<ServerStatus | null> {
  if (!streamer || !location.protocol.startsWith("http")) return null;
  try {
    const response = await fetch(`${streamerPath.base(streamer)}/status`);
    return response.ok ? ((await response.json()) as ServerStatus) : null;
  } catch {
    // Network error: like without a server, the chat runs anyway
    return null;
  }
}

// All hooks of a page share one connection: the first subscriber starts the sources, the last one stops them.
// The server sends the current track and the minimes only on connect; whoever subscribes later (the scene loads after
// the settings) gets them from lastTrack and lastMinimes. undefined = no message yet.
const subscribers = new Set<Handlers>();
let stopSources: (() => void) | null = null;
let lastTrack: Track | null | undefined;
let lastMinimes: Minime[] | undefined;
const fanout: Handlers = {
  chat: message => subscribers.forEach(handlers => handlers.chat?.(message)),
  alert: alert => subscribers.forEach(handlers => handlers.alert?.(alert)),
  music: track => {
    lastTrack = track;
    subscribers.forEach(handlers => handlers.music?.(track));
  },
  fx: event => subscribers.forEach(handlers => handlers.fx?.(event)),
  remove: removal => subscribers.forEach(handlers => handlers.remove?.(removal)),
  settings: settings => subscribers.forEach(handlers => handlers.settings?.(settings)),
  minimes: minimes => {
    lastMinimes = minimes;
    subscribers.forEach(handlers => handlers.minimes?.(minimes));
  },
  minimeChat: login => subscribers.forEach(handlers => handlers.minimeChat?.(login)),
};

// Reports events to handlers; the return value unsubscribes again
export function connect(handlers: Handlers): () => void {
  subscribers.add(handlers);
  stopSources ??= startSources(fanout);
  if (lastTrack !== undefined) handlers.music?.(lastTrack);
  if (lastMinimes !== undefined) handlers.minimes?.(lastMinimes);
  return () => {
    subscribers.delete(handlers);
    if (subscribers.size > 0) return;
    stopSources?.();
    stopSources = null;
    lastTrack = undefined;
    lastMinimes = undefined;
  };
}

// Chosen theme and settings of the streamer; null without streamer or server
export async function fetchSettings(): Promise<PublicSettings | null> {
  if (!streamer || !location.protocol.startsWith("http")) return null;
  try {
    const response = await fetch(`${streamerPath.base(streamer)}/settings`);
    return response.ok ? ((await response.json()) as PublicSettings) : null;
  } catch {
    // Network error: the scene runs with the defaults
    return null;
  }
}

// Chat commands of the streamer for the commands page; null without streamer, server or on network errors
export async function fetchCommands(): Promise<CommandList | null> {
  if (!streamer || !location.protocol.startsWith("http")) return null;
  try {
    const response = await fetch(`${streamerPath.base(streamer)}/commands`);
    return response.ok ? ((await response.json()) as CommandList) : null;
  } catch {
    // Network error: the page then does not show the list
    return null;
  }
}

// Connects all sources and reports events to handlers; the return value disconnects everything again
function startSources(handlers: Handlers): () => void {
  let stopped = false;
  const isDemo = params.has("demo");
  const stops = [isDemo ? demo(handlers) : () => {}];
  // With ?demo music and minimes only show the demo: the server sends its state on connect (often no track,
  // no minimes) and would otherwise overwrite the demo
  const live: Handlers = isDemo ? { ...handlers, music: undefined, minimes: undefined, minimeChat: undefined } : handlers;
  serverStatus()
    .then(server => {
      if (stopped) return;
      const name = channel || server?.login;
      // With a server, alerts only come from the server, otherwise subs would appear twice
      if (name) stops.push(irc(name, live, !server));
      if (server) stops.push(events(server.login, live));
    })
    .catch((error: unknown) => console.error("Connecting failed:", error));
  return () => { stopped = true; stops.forEach(stop => stop()); };
}

function events(login: string, handlers: Handlers) {
  let source: EventSource;
  let retry: ReturnType<typeof setTimeout> | undefined;
  const open = () => {
    // Without the overlay key from the OBS URL the server rejects the live stream
    source = new EventSource(`${streamerPath.base(login)}/events?key=${encodeURIComponent(params.get("key") ?? "")}`);
    source.onmessage = event => {
      const message = JSON.parse(String(event.data)) as ServerMessage;
      if (message.type === "alert") handlers.alert?.(message.alert);
      else if (message.type === "music") handlers.music?.(message.track);
      else if (message.type === "fx") handlers.fx?.(message.event);
      else if (message.type === "settings") handlers.settings?.(message.settings);
      else if (message.type === "minimes") handlers.minimes?.(message.minimes);
      else if (message.type === "minimeChat") handlers.minimeChat?.(message.login);
    };
    // After an answer like 404 (runtime not started right now) EventSource gives up: reconnect ourselves after a pause
    source.onerror = () => {
      if (source.readyState === EventSource.CLOSED) retry = setTimeout(open, 10_000);
    };
  };
  open();
  return () => { clearTimeout(retry); source.close(); };
}

function irc(name: string, handlers: Handlers, withAlerts: boolean) {
  let socket: WebSocket;
  let stopped = false;
  let retry: ReturnType<typeof setTimeout>;
  // 7TV/BTTV/FFZ emotes, loaded as soon as the channel ID is known, refreshed every 10 minutes
  let emotes = new Map<string, string>();
  let roomId = "";
  let reload: ReturnType<typeof setInterval> | undefined;
  // loadEmotes never throws (allSettled); without a result the old emotes stay
  const fetchEmotes = () => { loadEmotes(roomId).then(loaded => { emotes = loaded; }).catch(() => {}); };

  const handleLine = (line: string) => {
    for (const event of toIrcEvents(parseIrc(line), emotes, withAlerts, () => crypto.randomUUID())) {
      if (event.type === "chat") handlers.chat?.(event.message);
      else if (event.type === "alert") handlers.alert?.(event.alert);
      else if (event.type === "remove") handlers.remove?.(event.removal);
      else if (event.type === "ping") socket.send(`PONG :${event.token}`);
      else if (event.roomId !== roomId) {
        roomId = event.roomId;
        fetchEmotes();
        clearInterval(reload);
        reload = setInterval(fetchEmotes, 600_000);
      }
    }
  };

  const open = () => {
    socket = new WebSocket(IRC_URL);
    socket.onopen = () => anonymousLogin(name, Math.random).forEach(line => socket.send(line));
    socket.onmessage = event => String(event.data).split("\r\n").filter(Boolean).forEach(handleLine);
    socket.onclose = () => { if (!stopped) retry = setTimeout(open, 3000); };
  };

  open();
  return () => { stopped = true; clearTimeout(retry); clearInterval(reload); socket.close(); };
}
