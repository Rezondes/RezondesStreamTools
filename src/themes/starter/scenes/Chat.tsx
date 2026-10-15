// Chat des Starter-Themes: Nachrichten als abgerundete Karten untereinander, neue unten, optional mit Badges und
// Ausblenden. Nutzt nur den Kern-Hook useChat und die Werte des Themes.
import type { ChatMessage } from "../../../core/types.ts";
import { useChat } from "../../../core/hooks/useChat.ts";
import { useStarter } from "../useStarter.ts";

export default function Chat() {
  const values = useStarter();
  const messages = useChat(values.chatMax);
  return <div className="starter-chat">{messages.map(message => <Row key={message.id} message={message} />)}</div>;
}

function Row({ message }: { message: ChatMessage }) {
  const values = useStarter();
  return (
    <div className={`starter-card starter-row${values.chatFade > 0 ? " fades" : ""}`}>
      {values.chatBadges && message.badges.map(badge => <span key={badge} className="starter-chip">{badge}</span>)}
      <b className="starter-user">{message.user}</b>
      {message.parts.map((part, index) => (typeof part === "string"
        ? <span key={index}>{part}</span>
        : <img key={index} className="starter-emote" alt={part.name} src={part.url} />))}
    </div>
  );
}
