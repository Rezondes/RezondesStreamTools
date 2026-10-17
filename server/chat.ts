// Anonymous Twitch chat on the server (same as in the overlay), source for chat triggers and minimes.
// onBan: ban or timeout of a chatter (CLEARCHAT with login). url: IRC URL (providers.ts), default Twitch.
import { anonymousLogin, IRC_URL, parseIrc } from "../src/core/irc.ts";

// color: Twitch name color (#RRGGBB) or nothing if the chatter has not chosen one
export type ChatLine = { user: string; login: string; text: string; roles: string[]; color?: string };

export function chat(channel: string, onLine: (line: ChatLine) => void, onBan: (login: string) => void = () => {}, url = IRC_URL): () => void {
  let socket: WebSocket;
  let stopped = false;
  let retry: ReturnType<typeof setTimeout>;

  const handleLine = (raw: string) => {
    const message = parseIrc(raw);
    if (message.command === "PING") socket.send(`PONG :${message.params[0]}`);
    if (message.command === "CLEARCHAT" && message.params[1]) onBan(message.params[1].toLowerCase());
    if (message.command !== "PRIVMSG") return;
    const login = message.prefix.split("!")[0];
    onLine({
      user: message.tags["display-name"] || login,
      login,
      text: message.params[1] ?? "",
      // badges=broadcaster/1,subscriber/12 -> ["broadcaster", "subscriber"]
      roles: (message.tags.badges ?? "").split(",").map(badge => badge.split("/")[0]).filter(Boolean),
      ...(message.tags.color ? { color: message.tags.color } : {}),
    });
  };

  const open = () => {
    socket = new WebSocket(url);
    socket.onopen = () => {
      anonymousLogin(channel, Math.random).forEach(line => socket.send(line));
      console.log(`Chat triggers listening on #${channel}`);
    };
    socket.onmessage = event => {
      for (const raw of String(event.data).split("\r\n")) {
        if (!raw) continue;
        // An error in one line must never stop the server of all streamers (errors in the WebSocket handler would be uncaught)
        try {
          handleLine(raw);
        } catch (error) {
          console.error(`Chat line for #${channel} failed:`, error);
        }
      }
    };
    socket.onclose = () => { if (!stopped) retry = setTimeout(open, 3000); };
  };

  open();
  return () => { stopped = true; clearTimeout(retry); socket.close(); };
}
