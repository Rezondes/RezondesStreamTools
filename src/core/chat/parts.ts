// Parts of a chat message: text and emotes. The server sends the Twitch emotes already as parts; the browser adds the
// emotes of 7TV, BTTV and FFZ (splitWords). splitEmotes builds parts from the emotes tag, for the demo. Pure functions,
// tested in parts.check.ts.
import type { Part } from "../../generated/Part.ts";

export type { Part };

// The tag "emotes" looks like this: "25:0-4,12-16/1902:6-10". Positions count code points, not UTF-16.
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

// Emotes from 7TV, BTTV and FFZ are not in the tags, they are just words in the text
export function splitWords(parts: Part[], emotes: Map<string, string>): Part[] {
  if (!emotes.size) return parts;
  return parts.flatMap(part => {
    if (typeof part !== "string") return [part];
    return part.split(/(\s+)/).filter(Boolean).map(word => (emotes.has(word) ? { name: word, url: emotes.get(word)! } : word));
  });
}
