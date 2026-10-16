// Chat des Südfrucht-Themes: Nachrichten als aufsteigende Luftblasen, Holzplanken oder Muscheln, neue unten (oder
// oben), Badges als kleine Schilder, optional sanftes Schaukeln und Ausblenden. Nutzt nur den Kern-Hook useChat.
import { useChat } from "../../../core/hooks/useChat.ts";
import type { ChatMessage } from "../../../core/types.ts";
import { useSuedfrucht } from "../useSuedfrucht.ts";

export default function Chat() {
  const values = useSuedfrucht();
  const messages = useChat(values.chatMax);
  return (
    <div className={`sf-chat sf-chat-${values.chatStyle} sf-chat-${values.chatAlign}${values.chatSway ? " sway" : ""}`}>
      {messages.map(message => <Row key={message.id} message={message} />)}
    </div>
  );
}

function Row({ message }: { message: ChatMessage }) {
  const values = useSuedfrucht();
  // Badges kommen als HOST, MOD, VIP, SUB aus core/ircEvents.ts
  const badges: Record<string, string> = { HOST: values.badgeHost, MOD: values.badgeMod, VIP: values.badgeVip, SUB: values.badgeSub };
  return (
    <div className={`sf-row${values.chatFade > 0 ? " fades" : ""}${message.action ? " action" : ""}`}>
      <span className="sf-msg">
        {values.chatBadges && message.badges.map(badge => <span key={badge} className="sf-badge">{badges[badge] ?? badge}</span>)}
        <b className="sf-user">{message.user}</b>
        {message.parts.map((part, index) => (typeof part === "string"
          ? <span key={index}>{part}</span>
          : <img key={index} className="sf-emote" alt={part.name} src={part.url} />))}
      </span>
    </div>
  );
}
