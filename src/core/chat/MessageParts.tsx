// Inhalt einer Chatnachricht: Text und Emotes (Twitch, 7TV, BTTV, FFZ) in der Reihenfolge der Nachricht. Gleich für
// jedes Theme; das Theme gibt die Klasse der Emotes, das Aussehen kommt aus seinem CSS.
import type { Part } from "../irc.ts";

export default function MessageParts({ parts, emoteClassName }: { parts: readonly Part[]; emoteClassName: string }) {
  return (
    <>
      {parts.map((part, index) => (typeof part === "string"
        ? <span key={index}>{part}</span>
        : <img key={index} className={emoteClassName} alt={part.name} src={part.url} />))}
    </>
  );
}
