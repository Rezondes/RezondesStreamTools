// Verbindung einer Overlay-Seite (nur von den Hooks in core/hooks genutzt, Regel 16):
// - Streamer: aus dem Pfad /s/<login>/<szene>.html, in Vite (npm run dev) aus ?s=<login>
// - Chat: immer anonymer IRC-Login (kein Token nötig), Kanal = Streamer (oder ?channel=)
// - Alerts mit Server: per Server-Sent Events von /s/<login>/events, inkl. Follows, Kanalpunkten und Hype Train
// - Alerts ohne Server oder ohne laufende Laufzeit: Subs, Resubs, Gifts, Raids, Bits aus dem IRC
// - ?demo in der URL: erzeugt Fake-Ereignisse zum Testen ohne Stream
import { loadEmotes } from "./emotes.ts";
import { parseIrc } from "./irc.ts";
import { toIrcEvents } from "./ircEvents.ts";
import { params } from "./params.ts";
import * as streamerPath from "./streamerPath.ts";
import { demo } from "./demo.ts";
import type { Alert, ChatMessage, ChatRemoval, FxEvent, ServerMessage, ServerStatus, Track } from "./types.ts";

export type Handlers = {
  chat?: (message: ChatMessage) => void;
  alert?: (alert: Alert) => void;
  music?: (track: Track | null) => void;
  fx?: (event: FxEvent) => void;
  remove?: (removal: ChatRemoval) => void;
};

// Login des Streamers, dessen Overlay das ist; null ohne /s/<login>/ und ohne gültiges ?s=
const loginFromQuery = (params.get("s") ?? "").toLowerCase();
export const streamer = streamerPath.parse(location.pathname)?.login ?? (streamerPath.isLogin(loginFromQuery) ? loginFromQuery : null);

const channel = (params.get("channel") ?? streamer ?? String(import.meta.env.VITE_TWITCH_CHANNEL ?? "")).toLowerCase().replace(/^#/, "");

// null = kein Streamer, kein Server erreichbar oder Streamer dort unbekannt
async function serverStatus(): Promise<ServerStatus | null> {
  if (!streamer || !location.protocol.startsWith("http")) return null;
  try {
    const response = await fetch(`${streamerPath.base(streamer)}/status`);
    return response.ok ? ((await response.json()) as ServerStatus) : null;
  } catch {
    // Netzwerkfehler: wie ohne Server, der Chat läuft trotzdem
    return null;
  }
}

// Verbindet alle Quellen und meldet Ereignisse an handlers; die Rückgabe trennt alles wieder
export function connect(handlers: Handlers): () => void {
  let stopped = false;
  const stops = [params.has("demo") ? demo(handlers) : () => {}];
  serverStatus()
    .then(server => {
      if (stopped) return;
      const name = channel || server?.login;
      // Mit Server kommen Alerts nur vom Server, sonst gäbe es Subs doppelt
      if (name) stops.push(irc(name, handlers, !server));
      if (server) stops.push(events(server.login, handlers));
    })
    .catch((error: unknown) => console.error("Connecting failed:", error));
  return () => { stopped = true; stops.forEach(stop => stop()); };
}

function events(login: string, handlers: Handlers) {
  let source: EventSource;
  let retry: ReturnType<typeof setTimeout> | undefined;
  const open = () => {
    source = new EventSource(`${streamerPath.base(login)}/events`);
    source.onmessage = event => {
      const message = JSON.parse(String(event.data)) as ServerMessage;
      if (message.type === "alert") handlers.alert?.(message.alert);
      else if (message.type === "music") handlers.music?.(message.track);
      else if (message.type === "fx") handlers.fx?.(message.event);
    };
    // Nach einer Antwort wie 404 (Laufzeit gerade nicht gestartet) gibt EventSource auf: selbst mit Pause neu verbinden
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
  // 7TV/BTTV/FFZ-Emotes, geladen sobald die Kanal-ID bekannt ist, alle 10 Minuten aufgefrischt
  let emotes = new Map<string, string>();
  let roomId = "";
  let reload: ReturnType<typeof setInterval> | undefined;
  // loadEmotes wirft nie (allSettled); ohne Ergebnis bleiben die alten Emotes
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
    socket = new WebSocket("wss://irc-ws.chat.twitch.tv:443");
    socket.onopen = () => {
      socket.send("CAP REQ :twitch.tv/tags twitch.tv/commands");
      socket.send("PASS SCHMOOPIIE");
      socket.send(`NICK justinfan${10000 + ((Math.random() * 80000) | 0)}`);
      socket.send(`JOIN #${name}`);
    };
    socket.onmessage = event => String(event.data).split("\r\n").filter(Boolean).forEach(handleLine);
    socket.onclose = () => { if (!stopped) retry = setTimeout(open, 3000); };
  };

  open();
  return () => { stopped = true; clearTimeout(retry); clearInterval(reload); socket.close(); };
}
