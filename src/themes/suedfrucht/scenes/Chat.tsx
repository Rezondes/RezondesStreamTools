// Chat des Südfrucht-Themes: Nachrichten als aufsteigende Luftblasen, Holzplanken oder Muscheln, neue unten (oder
// oben), Badges als kleine Schilder, optional sanftes Schaukeln und Ausblenden. Nachrichten (useChat), Badge-Texte
// (badgeLabel) und Inhalt mit Emotes (MessageParts) kommen aus dem Kern, hier das Strand-Aussehen.
import { badgeLabel } from "../../../core/chat/chat.ts";
import MessageParts from "../../../core/chat/MessageParts.tsx";
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
  return (
    <div className={`sf-row${values.chatFade > 0 ? " fades" : ""}${message.action ? " action" : ""}`}>
      <span className="sf-msg">
        {values.chatBadges && message.badges.map(badge => <span key={badge} className="sf-badge">{badgeLabel(badge, values)}</span>)}
        <b className="sf-user">{message.user}</b>
        <MessageParts parts={message.parts} emoteClassName="sf-emote" />
      </span>
    </div>
  );
}
