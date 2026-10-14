// Twitch-Anbindung der Overlays:
// - Chat: immer anonymer IRC-Login (kein Token nötig)
// - Alerts mit Server (Docker, server/index.ts): kommen per Server-Sent Events von /events,
//   inkl. Follows, Kanalpunkten und Hype Train. Der Kanal kommt dann aus dem Twitch-Login.
// - Alerts ohne Server (z.B. dist/*.html als Datei): Subs, Resubs, Gifts, Raids, Bits aus dem IRC
// - ?demo in der URL: erzeugt Fake-Events zum Testen ohne Stream
import { parseIrc, splitEmotes, splitWords, type IrcMessage, type Part } from "./irc.ts";
import { loadEmotes } from "./emotes.ts";
import { params } from "./util.ts";

export type ChatMessage = { id: string; login: string; user: string; badges: string[]; parts: Part[]; action: boolean };
export type AlertKind = "follow" | "sub" | "resub" | "gift" | "raid" | "cheer" | "redeem" | "hype";
// detail: Abo-Stufe (sub, resub), Name der Belohnung (redeem), "begin" oder "end" (hype)
export type Alert = { kind: AlertKind; user: string; amount?: number; text?: string; detail?: string };

// Laufender Spotify-Titel. progressMs gilt für den Moment, in dem die Nachricht ankommt.
export type Track = { id: string; title: string; artist: string; album: string; cover: string | null; durationMs: number; progressMs: number; playing: boolean };

// Chat-Trigger (config/triggers.json): was ein Effekt-Overlay (fx.html) tun soll.
// position: "center", "random" oder Prozent { x, y } der Overlay-Fläche. size: Breite in px.
export type FxPosition = "center" | "random" | { x: number; y: number };
export type FxAction = {
  type: "media" | "text";
  zone?: string;
  image?: string;
  video?: string;
  text?: string;
  sound?: string;
  volume?: number;
  duration?: number;
  // Ablauf in "do": Aktionen laufen nacheinander. delay = Sekunden sichtbar, aber angehalten (erstes Bild),
  // after = Sekunden angehalten stehen bleiben (letztes Bild), together = erscheint mit der vorherigen Aktion
  delay?: number;
  after?: number;
  together?: boolean;
  position?: FxPosition;
  size?: number;
};
export type FxEvent = { id: number; zone: string; action: FxAction; user: string; message: string };

export type Handlers = {
  chat?: (m: ChatMessage) => void;
  alert?: (a: Alert) => void;
  music?: (t: Track | null) => void;
  fx?: (e: FxEvent) => void;
  // Moderation: Nachricht gelöscht (id) oder Nutzer gebannt/getimeoutet (login) oder Chat geleert (beides leer)
  remove?: (target: { id?: string; login?: string }) => void;
};

const channel = (params.get("channel") ?? import.meta.env.VITE_TWITCH_CHANNEL ?? "").toLowerCase().replace(/^#/, "");

const BADGES: Record<string, string> = { broadcaster: "HOST", moderator: "MOD", vip: "VIP", subscriber: "SUB" };

// spotify: null = nicht eingerichtet (keine Client-ID), sonst ob verbunden
export type ServerStatus = { login: string | null; live: boolean; spotify: boolean | null };

// null = kein Server erreichbar (Datei-Modus oder Vite ohne laufenden Server)
export async function serverStatus(): Promise<ServerStatus | null> {
  if (!location.protocol.startsWith("http")) return null;
  try {
    const res = await fetch("/api/status");
    return res.ok ? await res.json() : null;
  } catch {
    return null;
  }
}

export function connect(h: Handlers): () => void {
  let stopped = false;
  const stops = [params.has("demo") ? demo(h) : () => {}];
  serverStatus().then(server => {
    if (stopped) return;
    const name = channel || server?.login;
    // Mit Server kommen Alerts nur vom Server, sonst gäbe es Subs doppelt
    if (name) stops.push(irc(name, h, !server));
    if (server) stops.push(events(h));
  });
  return () => { stopped = true; stops.forEach(stop => stop()); };
}

function events(h: Handlers) {
  const source = new EventSource("/events");
  source.onmessage = e => {
    const m = JSON.parse(e.data);
    if (m.type === "alert") h.alert?.(m.alert);
    else if (m.type === "music") h.music?.(m.track);
    else if (m.type === "fx") h.fx?.(m.event);
  };
  return () => source.close();
}

function irc(channel: string, h: Handlers, alerts: boolean) {
  let ws: WebSocket;
  let stopped = false;
  let retry: ReturnType<typeof setTimeout>;
  // 7TV/BTTV/FFZ-Emotes, geladen sobald die Kanal-ID bekannt ist, alle 10 Minuten aufgefrischt
  let emotes = new Map<string, string>();
  let roomId = "";
  let reload: ReturnType<typeof setInterval> | undefined;
  const fetchEmotes = () => loadEmotes(roomId).then(m => { emotes = m; });

  const open = () => {
    ws = new WebSocket("wss://irc-ws.chat.twitch.tv:443");
    ws.onopen = () => {
      ws.send("CAP REQ :twitch.tv/tags twitch.tv/commands");
      ws.send("PASS SCHMOOPIIE");
      ws.send(`NICK justinfan${10000 + ((Math.random() * 80000) | 0)}`);
      ws.send(`JOIN #${channel}`);
    };
    ws.onmessage = e => String(e.data).split("\r\n").filter(Boolean).forEach(line => handle(parseIrc(line)));
    ws.onclose = () => { if (!stopped) retry = setTimeout(open, 3000); };
  };

  const handle = (m: IrcMessage) => {
    const t = m.tags;
    const user = t["display-name"] || m.prefix.split("!")[0];
    switch (m.command) {
      case "PING":
        ws.send(`PONG :${m.params[0]}`);
        break;
      case "PRIVMSG": {
        let text = m.params[1] ?? "";
        const action = text.startsWith("\u0001ACTION ") && text.endsWith("\u0001");
        if (action) text = text.slice(8, -1);
        h.chat?.({
          id: t.id ?? crypto.randomUUID(),
          login: m.prefix.split("!")[0],
          user,
          badges: (t.badges ?? "").split(",").map(b => BADGES[b.split("/")[0]]).filter(Boolean),
          parts: splitWords(splitEmotes(text, t.emotes), emotes),
          action,
        });
        if (alerts && t.bits) h.alert?.({ kind: "cheer", user, amount: Number(t.bits), text: text.replace(/\b\w+\d+\b/g, "").trim() });
        break;
      }
      case "USERNOTICE": {
        if (!alerts) break;
        const id = t["msg-id"];
        const text = m.params[1];
        if (id === "sub") h.alert?.({ kind: "sub", user, text });
        else if (id === "resub") h.alert?.({ kind: "resub", user, amount: Number(t["msg-param-cumulative-months"]), text });
        // Einzel-Gifts einer Massen-Schenkung tragen community-gift-id, die zählt schon submysterygift
        else if (id === "subgift" && !t["msg-param-community-gift-id"]) h.alert?.({ kind: "gift", user, amount: 1, text: t["msg-param-recipient-display-name"] });
        else if (id === "submysterygift") h.alert?.({ kind: "gift", user, amount: Number(t["msg-param-mass-gift-count"]) });
        else if (id === "raid") h.alert?.({ kind: "raid", user: t["msg-param-displayName"] || user, amount: Number(t["msg-param-viewerCount"]) });
        break;
      }
      case "ROOMSTATE":
        if (t["room-id"] && t["room-id"] !== roomId) {
          roomId = t["room-id"];
          fetchEmotes();
          clearInterval(reload);
          reload = setInterval(fetchEmotes, 600_000);
        }
        break;
      case "CLEARMSG":
        h.remove?.({ id: t["target-msg-id"] });
        break;
      case "CLEARCHAT":
        h.remove?.({ login: m.params[1] });
        break;
    }
  };

  open();
  return () => { stopped = true; clearTimeout(retry); clearInterval(reload); ws.close(); };
}

// --- Demo -----------------------------------------------------------------------
const NAMES = ["neo_42", "Trinity", "MorpheusTV", "agent_smith", "Oracle", "Tank", "Dozer", "Switch"];
const LINES = [
  "hallo zusammen!", "was programmierst du heute?", "LUL", "der matrix style ist krass",
  "C# > alles", "kannst du das nochmal erklären?", "gg", "follow ist raus <3",
  "wie lange streamst du heute noch?", "Kappa", "das ist ein etwas längerer Text, damit man sieht wie der Umbruch aussieht",
];
// Selbst gezeichnetes Demo-Cover (Verlauf mit Kreisen und Schrift), damit ?art=cover|record ohne Spotify testbar ist
const DEMO_COVER = "data:image/svg+xml," + encodeURIComponent(
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><defs><linearGradient id="g" x2="1" y2="1"><stop offset="0" stop-color="#fff"/><stop offset="1" stop-color="#222"/></linearGradient></defs>'
  + '<rect width="100" height="100" fill="url(#g)"/><circle cx="30" cy="35" r="18" fill="#000"/><circle cx="68" cy="62" r="24" fill="none" stroke="#000" stroke-width="5"/>'
  + '<text x="8" y="92" font-family="monospace" font-size="13" fill="#000">DEMO</text></svg>',
);
const pick = <T,>(list: T[]) => list[(Math.random() * list.length) | 0];

function demo(h: Handlers) {
  const chat = setInterval(() => {
    const user = pick(NAMES);
    const text = pick(LINES);
    h.chat?.({
      id: crypto.randomUUID(),
      login: user.toLowerCase(),
      user,
      badges: Math.random() < 0.3 ? [pick(["MOD", "VIP", "SUB"])] : [],
      // 25 = Kappa, 425618 = LUL (öffentliche Twitch-Emotes)
      parts: text === "Kappa" || text === "LUL" ? splitEmotes(text, `${text === "Kappa" ? 25 : 425618}:0-${text.length - 1}`) : [text],
      action: false,
    });
  }, 2200);

  const samples: Alert[] = [
    { kind: "follow", user: "neo_42" },
    { kind: "sub", user: "Trinity", text: "Endlich abonniert!" },
    { kind: "resub", user: "MorpheusTV", amount: 12, text: "Ein Jahr schon!" },
    { kind: "gift", user: "Oracle", amount: 5 },
    { kind: "raid", user: "agent_smith", amount: 42 },
    { kind: "cheer", user: "Tank", amount: 500, text: "Nimm das!" },
    { kind: "redeem", user: "Dozer", amount: 500, detail: "Hydrieren!", text: "Trink was!" },
    { kind: "hype", user: "HYPE TRAIN", amount: 1, detail: "begin" },
  ];
  const tracks: Track[] = [
    { id: "1", title: "Wake Up", artist: "Rage Against the Machine", album: "The Matrix (Music from the Motion Picture)", cover: null, durationMs: 364000, progressMs: 40000, playing: true },
    { id: "2", title: "Clubbed to Death (Kurayamino Variation)", artist: "Rob Dougan", album: "The Matrix (Music from the Motion Picture)", cover: DEMO_COVER, durationMs: 451000, progressMs: 0, playing: true },
  ];
  let t = 0;
  h.music?.(tracks[0]);
  const music = setInterval(() => h.music?.(tracks[++t % tracks.length]), 15000);

  let i = 0;
  const fire = () => h.alert?.(samples[i++ % samples.length]);
  const first = setTimeout(fire, 1000);
  const alerts = setInterval(fire, 11000);
  return () => { clearInterval(chat); clearInterval(alerts); clearInterval(music); clearTimeout(first); };
}
