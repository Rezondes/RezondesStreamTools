// Chat des Standard-Themes: Nachrichten als abgerundete Karten untereinander, neue unten, optional mit Badges und
// Ausblenden. Nutzt nur den Kern-Hook useChat und die Werte des Themes.
import type { ChatMessage } from "../../../core/types.ts";
import { useChat } from "../../../core/hooks/useChat.ts";
import { useStandard } from "../useStandard.ts";

export default function Chat() {
  const values = useStandard();
  const messages = useChat(values.chatMax);
  return <div className="standard-chat">{messages.map(message => <Row key={message.id} message={message} />)}</div>;
}

function Row({ message }: { message: ChatMessage }) {
  const values = useStandard();
  return (
    <div className={`standard-card standard-row${values.chatFade > 0 ? " fades" : ""}`}>
      {values.chatBadges && message.badges.map(badge => <span key={badge} className="standard-chip">{badge}</span>)}
      <b className="standard-user">{message.user}</b>
      {message.parts.map((part, index) => (typeof part === "string"
        ? <span key={index}>{part}</span>
        : <img key={index} className="standard-emote" alt={part.name} src={part.url} />))}
    </div>
  );
}
