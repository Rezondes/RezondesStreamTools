// Anonymer Twitch-Chat auf dem Server (gleich wie im Overlay), Quelle für Chat-Trigger und Minimes.
// onBan: Ban oder Timeout eines Chatters (CLEARCHAT mit Login).
import { parseIrc } from "../src/core/irc.ts";

// color: Twitch-Namensfarbe (#RRGGBB) oder nichts, wenn der Chatter keine gewählt hat
export type ChatLine = { user: string; login: string; text: string; roles: string[]; color?: string };

export function chat(channel: string, onLine: (line: ChatLine) => void, onBan: (login: string) => void = () => {}): () => void {
  let socket: WebSocket;
  let stopped = false;
  let retry: ReturnType<typeof setTimeout>;

  const open = () => {
    socket = new WebSocket("wss://irc-ws.chat.twitch.tv:443");
    socket.onopen = () => {
      socket.send("CAP REQ :twitch.tv/tags twitch.tv/commands");
      socket.send("PASS SCHMOOPIIE");
      socket.send(`NICK justinfan${10000 + ((Math.random() * 80000) | 0)}`);
      socket.send(`JOIN #${channel}`);
      console.log(`Chat triggers listening on #${channel}`);
    };
    socket.onmessage = event => {
      for (const raw of String(event.data).split("\r\n")) {
        if (!raw) continue;
        const message = parseIrc(raw);
        if (message.command === "PING") socket.send(`PONG :${message.params[0]}`);
        if (message.command === "CLEARCHAT" && message.params[1]) onBan(message.params[1].toLowerCase());
        if (message.command !== "PRIVMSG") continue;
        const login = message.prefix.split("!")[0];
        onLine({
          user: message.tags["display-name"] || login,
          login,
          text: message.params[1] ?? "",
          // badges=broadcaster/1,subscriber/12 -> ["broadcaster", "subscriber"]
          roles: (message.tags.badges ?? "").split(",").map(badge => badge.split("/")[0]).filter(Boolean),
          ...(message.tags.color ? { color: message.tags.color } : {}),
        });
      }
    };
    socket.onclose = () => { if (!stopped) retry = setTimeout(open, 3000); };
  };

  open();
  return () => { stopped = true; clearTimeout(retry); socket.close(); };
}
