// Chat of the Urlaub theme: messages as rising bubbles, wooden planks or shells, new ones at the bottom (or
// top), badges as small signs, optional gentle swaying and fading. Messages (useChat), badge texts
// (badgeLabel) and content with emotes (MessageParts) come from the core, here the beach look.
import { badgeLabel } from "../../../core/chat/chat.ts";
import MessageParts from "../../../core/chat/MessageParts.tsx";
import { useChat } from "../../../core/hooks/useChat.ts";
import type { ChatMessage } from "../../../core/types.ts";
import { useUrlaub } from "../useUrlaub.ts";

export default function Chat() {
  const values = useUrlaub();
  const messages = useChat(values.chatMax);
  return (
    <div className={`ul-chat ul-chat-${values.chatStyle} ul-chat-${values.chatAlign}${values.chatSway ? " sway" : ""}`}>
      {messages.map(message => <Row key={message.id} message={message} />)}
    </div>
  );
}

function Row({ message }: { message: ChatMessage }) {
  const values = useUrlaub();
  return (
    <div className={`ul-row${values.chatFade > 0 ? " fades" : ""}${message.action ? " action" : ""}`}>
      <span className="ul-msg">
        {values.chatBadges && message.badges.map(badge => <span key={badge} className="ul-badge">{badgeLabel(badge, values)}</span>)}
        <b className="ul-user">{message.user}</b>
        <MessageParts parts={message.parts} emoteClassName="ul-emote" />
      </span>
    </div>
  );
}
