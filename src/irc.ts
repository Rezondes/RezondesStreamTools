// Reine Parser für Twitch-IRC, ohne DOM. Getestet in irc.check.ts.

export type IrcMessage = { tags: Record<string, string>; prefix: string; command: string; params: string[] };
export type Part = string | { name: string; url: string };

const ESCAPES: Record<string, string> = { s: " ", ":": ";", r: "\r", n: "\n", "\\": "\\" };
const unescapeTag = (v: string) => v.replace(/\\(.)/g, (_, c: string) => ESCAPES[c] ?? c);

// Format: [@tags ][:prefix ]COMMAND [params...] [:trailing]
export function parseIrc(line: string): IrcMessage {
  const tags: Record<string, string> = {};
  let rest = line;
  if (rest.startsWith("@")) {
    const end = rest.indexOf(" ");
    for (const pair of rest.slice(1, end).split(";")) {
      const eq = pair.indexOf("=");
      if (eq < 0) tags[pair] = "";
      else tags[pair.slice(0, eq)] = unescapeTag(pair.slice(eq + 1));
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
      return positions.split(",").map(p => {
        const [from, to] = p.split("-").map(Number);
        return { id, from, to };
      });
    })
    .sort((a, b) => a.from - b.from);

  const parts: Part[] = [];
  let i = 0;
  for (const r of ranges) {
    if (r.from > i) parts.push(chars.slice(i, r.from).join(""));
    parts.push({ name: chars.slice(r.from, r.to + 1).join(""), url: `https://static-cdn.jtvnw.net/emoticons/v2/${r.id}/default/dark/2.0` });
    i = r.to + 1;
  }
  if (i < chars.length) parts.push(chars.slice(i).join(""));
  return parts;
}

// Emotes von 7TV, BTTV und FFZ stehen nicht in den Tags, sondern sind einfach Wörter im Text
export function splitWords(parts: Part[], emotes: Map<string, string>): Part[] {
  if (!emotes.size) return parts;
  return parts.flatMap(p => {
    if (typeof p !== "string") return [p];
    return p.split(/(\s+)/).filter(Boolean).map(w => (emotes.has(w) ? { name: w, url: emotes.get(w)! } : w));
  });
}
