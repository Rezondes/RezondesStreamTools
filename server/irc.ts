// Pure parser for Twitch IRC lines and the anonymous login of the Node server (server/chat.ts). Tested in irc.check.ts.

export type IrcMessage = { tags: Record<string, string>; prefix: string; command: string; params: string[] };

const ESCAPES: Record<string, string> = { s: " ", ":": ";", r: "\r", n: "\n", "\\": "\\" };
const unescapeTag = (value: string) => value.replace(/\\(.)/g, (_, char: string) => ESCAPES[char] ?? char);

// Format: [@tags ][:prefix ]COMMAND [params...] [:trailing]
export function parseIrc(line: string): IrcMessage {
  const tags: Record<string, string> = {};
  let rest = line;
  if (rest.startsWith("@")) {
    const end = rest.indexOf(" ");
    for (const pair of rest.slice(1, end).split(";")) {
      const equals = pair.indexOf("=");
      if (equals < 0) tags[pair] = "";
      else tags[pair.slice(0, equals)] = unescapeTag(pair.slice(equals + 1));
    }
    rest = rest.slice(end + 1);
  }
  let prefix = "";
  if (rest.startsWith(":")) {
    const end = rest.indexOf(" ");
    prefix = rest.slice(1, end);
    rest = rest.slice(end + 1);
  }
  const cut = rest.indexOf(" :");
  const [command = "", ...params] = (cut >= 0 ? rest.slice(0, cut) : rest).split(" ").filter(Boolean);
  if (cut >= 0) params.push(rest.slice(cut + 2));
  return { tags, prefix, command, params };
}

// URL of the Twitch chat and the lines for an anonymous login (no token needed, read only) in the channel channel;
// random chooses the number of the guest name justinfan<n>.
export const IRC_URL = "wss://irc-ws.chat.twitch.tv:443";
export const anonymousLogin = (channel: string, random: () => number) => [
  "CAP REQ :twitch.tv/tags twitch.tv/commands",
  "PASS SCHMOOPIIE",
  `NICK justinfan${10000 + Math.floor(random() * 80000)}`,
  `JOIN #${channel}`,
];
