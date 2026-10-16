// Reine Parser für Twitch-IRC, ohne DOM. Getestet in irc.check.ts.

export type IrcMessage = { tags: Record<string, string>; prefix: string; command: string; params: string[] };
export type Part = string | { name: string; url: string };

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

// Tag "emotes" sieht so aus: "25:0-4,12-16/1902:6-10". Positionen zählen Codepoints, nicht UTF-16.
export function splitEmotes(text: string, emotes = ""): Part[] {
  const chars = Array.from(text);
  const ranges = emotes
    .split("/")
    .filter(Boolean)
    .flatMap(entry => {
      const [id, positions] = entry.split(":");
      return positions.split(",").map(position => {
        const [from, to] = position.split("-").map(Number);
        return { id, from, to };
      });
    })
    .sort((first, second) => first.from - second.from);

  const parts: Part[] = [];
  let next = 0;
  for (const range of ranges) {
    if (range.from > next) parts.push(chars.slice(next, range.from).join(""));
    parts.push({ name: chars.slice(range.from, range.to + 1).join(""), url: `https://static-cdn.jtvnw.net/emoticons/v2/${range.id}/default/dark/2.0` });
    next = range.to + 1;
  }
  if (next < chars.length) parts.push(chars.slice(next).join(""));
  return parts;
}

// Emotes von 7TV, BTTV und FFZ stehen nicht in den Tags, sondern sind einfach Wörter im Text
export function splitWords(parts: Part[], emotes: Map<string, string>): Part[] {
  if (!emotes.size) return parts;
  return parts.flatMap(part => {
    if (typeof part !== "string") return [part];
    return part.split(/(\s+)/).filter(Boolean).map(word => (emotes.has(word) ? { name: word, url: emotes.get(word)! } : word));
  });
}

// Adresse des Twitch-Chats und die Zeilen für eine anonyme Anmeldung (kein Token nötig, nur lesen) im Kanal channel;
// random wählt die Nummer des Gast-Namens justinfan<n>. Gleich für Overlays und Server.
export const IRC_URL = "wss://irc-ws.chat.twitch.tv:443";
export const anonymousLogin = (channel: string, random: () => number) => [
  "CAP REQ :twitch.tv/tags twitch.tv/commands",
  "PASS SCHMOOPIIE",
  `NICK justinfan${10000 + Math.floor(random() * 80000)}`,
  `JOIN #${channel}`,
];
