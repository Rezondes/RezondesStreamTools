// Content of a chat message: text and emotes (Twitch, 7TV, BTTV, FFZ) in the order of the message. The same for
// every theme; the theme gives the class of the emotes, the look comes from its CSS.
import type { Part } from "./parts.ts";

export default function MessageParts({ parts, emoteClassName }: { parts: readonly Part[]; emoteClassName: string }) {
  return (
    <>
      {parts.map((part, index) => (typeof part === "string"
        ? <span key={index}>{part}</span>
        : <img key={index} className={emoteClassName} alt={part.name} src={part.url} />))}
    </>
  );
}
