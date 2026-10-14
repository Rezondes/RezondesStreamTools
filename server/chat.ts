// Anonymer Twitch-Chat auf dem Server (gleich wie im Overlay), Quelle für die Chat-Trigger.
import { parseIrc } from "../src/irc.ts";

export type ChatLine = { user: string; login: string; text: string; roles: string[] };

export function chat(channel: string, onLine: (line: ChatLine) => void): () => void {
  let ws: WebSocket;
  let stopped = false;
  let retry: ReturnType<typeof setTimeout>;

  const open = () => {
    ws = new WebSocket("wss://irc-ws.chat.twitch.tv:443");
    ws.onopen = () => {
      ws.send("CAP REQ :twitch.tv/tags");
      ws.send("PASS SCHMOOPIIE");
      ws.send(`NICK justinfan${10000 + ((Math.random() * 80000) | 0)}`);
      ws.send(`JOIN #${channel}`);
      console.log(`Chat-Trigger lauschen auf #${channel}`);
    };
    ws.onmessage = e => {
      for (const raw of String(e.data).split("\r\n")) {
        if (!raw) continue;
        const m = parseIrc(raw);
        if (m.command === "PING") ws.send(`PONG :${m.params[0]}`);
        if (m.command !== "PRIVMSG") continue;
        const login = m.prefix.split("!")[0];
        onLine({
          user: m.tags["display-name"] || login,
          login,
          text: m.params[1] ?? "",
          // badges=broadcaster/1,subscriber/12 -> ["broadcaster", "subscriber"]
          roles: (m.tags.badges ?? "").split(",").map(b => b.split("/")[0]).filter(Boolean),
        });
      }
    };
    ws.onclose = () => { if (!stopped) retry = setTimeout(open, 3000); };
  };

  open();
  return () => { stopped = true; clearTimeout(retry); ws.close(); };
}
